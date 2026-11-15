import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Types "../types/common";
import AnalyticsTypes "../types/analytics";
import ReferralTypes "../types/referral";
import PromoTypes "../types/promo";

// Analytics domain logic
module {
  public type DailyStat = AnalyticsTypes.DailyStat;
  public type AnalyticsDashboard = AnalyticsTypes.AnalyticsDashboard;

  let NANOS_PER_DAY : Int = 86_400_000_000_000;

  func natToTwoDigit(n : Nat) : Text {
    if (n < 10) "0" # n.toText() else n.toText();
  };

  // Approximate day label from nanosecond timestamp for display purposes
  func dayLabel(ts : Types.Timestamp) : Text {
    let days : Int = ts / NANOS_PER_DAY;
    let y : Int = 1970 + days / 365;
    let rem : Int = days - (y - 1970) * 365;
    let m : Int = 1 + rem / 30;
    let d : Int = 1 + rem - (m - 1) * 30;
    y.toText() # "-" # natToTwoDigit(m.toNat()) # "-" # natToTwoDigit(d.toNat());
  };

  // Build the full analytics dashboard for a given period (days back from now)
  public func buildDashboard(
    orders : Map.Map<Types.OrderId, {
      id : Types.OrderId;
      customerId : Types.UserId;
      riderId : ?Types.UserId;
      pickupAddress : Text;
      deliveryAddress : Text;
      packageDescription : Text;
      packageWeight : Text;
      deliveryFee : Nat;
      platformFee : Nat;
      riderPayout : Nat;
      promoDiscount : ?Nat;
      status : Types.OrderStatus;
      createdAt : Types.Timestamp;
      updatedAt : Types.Timestamp;
      estimatedTime : ?Text;
      deliveryPhotoUrl : ?Text;
    }>,
    userProfiles : Map.Map<Types.UserId, {
      id : Types.UserId;
      displayName : Text;
      role : Types.UserRole;
      vehicleType : ?Types.VehicleType;
      isAvailable : Bool;
      totalDeliveries : Nat;
      averageRating : Float;
      ratingCount : Nat;
      rating : Float;
      var balance : Int;
      email : ?Text;
      createdAt : Int;
    }>,
    referralRecords : List.List<ReferralTypes.ReferralRecord>,
    promoUses : List.List<PromoTypes.PromoUseRecord>,
    promoCodes : List.List<PromoTypes.PromoCode>,
    platformBalance : Nat,
    periodDays : Nat,
    now : Types.Timestamp,
  ) : AnalyticsDashboard {
    let cutoff : Int = now - (periodDays.toInt() * NANOS_PER_DAY);

    // ── Daily stats ────────────────────────────────────────────────────────────
    type DayEntry = { var placed : Nat; var delivered : Nat; var commission : Nat };
    let dailyMap = Map.empty<Text, DayEntry>();

    for ((_id, o) in orders.entries()) {
      if (o.createdAt >= cutoff) {
        let dayKey = dayLabel(o.createdAt);
        let isDelivered = o.status == #delivered;
        switch (dailyMap.get(dayKey)) {
          case (null) {
            let commission = if (isDelivered) o.platformFee else 0;
            let delivered = if (isDelivered) 1 else 0;
            dailyMap.add(dayKey, { var placed = 1; var delivered; var commission });
          };
          case (?entry) {
            entry.placed += 1;
            if (isDelivered) {
              entry.delivered += 1;
              entry.commission += o.platformFee;
            };
          };
        };
      };
    };

    let dailyStatsList = List.empty<DailyStat>();
    for ((date, e) in dailyMap.entries()) {
      dailyStatsList.add({
        date;
        ordersPlaced = e.placed;
        ordersDelivered = e.delivered;
        commission = e.commission;
      });
    };
    let dailyStats = dailyStatsList.toArray();

    // ── Referral stats ─────────────────────────────────────────────────────────
    var totalReferrals : Nat = 0;
    var referralsThisPeriod : Nat = 0;
    var totalCreditsIssued : Nat = 0;
    referralRecords.forEach(func(r : ReferralTypes.ReferralRecord) {
      totalReferrals += 1;
      totalCreditsIssued += r.creditAmount * 2; // both parties receive credits
      if (r.redeemedAt >= cutoff) {
        referralsThisPeriod += 1;
      };
    });

    // ── Promo stats ────────────────────────────────────────────────────────────
    let totalCodesCreated = promoCodes.size();
    var totalUsesThisPeriod : Nat = 0;
    var totalDiscountGivenThisPeriod : Nat = 0;
    promoUses.forEach(func(u : PromoTypes.PromoUseRecord) {
      if (u.usedAt >= cutoff) {
        totalUsesThisPeriod += 1;
        totalDiscountGivenThisPeriod += u.discountApplied;
      };
    });

    // ── Top riders ─────────────────────────────────────────────────────────────
    let riderList = List.empty<AnalyticsTypes.TopRiderEntry>();
    for ((userId, p) in userProfiles.entries()) {
      if (p.role == #rider and p.totalDeliveries > 0) {
        riderList.add({
          userId;
          displayName = p.displayName;
          deliveriesCompleted = p.totalDeliveries;
          totalEarnings = p.balance;
          averageRating = p.averageRating;
        });
      };
    };
    let sortedRiders = riderList.sort(func(a : AnalyticsTypes.TopRiderEntry, b : AnalyticsTypes.TopRiderEntry) : Order.Order =
      if (a.deliveriesCompleted > b.deliveriesCompleted) #less
      else if (a.deliveriesCompleted < b.deliveriesCompleted) #greater
      else #equal
    );
    let topRiders = if (sortedRiders.size() <= 10) sortedRiders.toArray()
                    else sortedRiders.sliceToArray(0, 10);

    // ── Top customers ──────────────────────────────────────────────────────────
    type CustEntry = { var count : Nat; var spend : Nat };
    let customerOrderMap = Map.empty<Types.UserId, CustEntry>();
    for ((_id, o) in orders.entries()) {
      switch (customerOrderMap.get(o.customerId)) {
        case (null) {
          customerOrderMap.add(o.customerId, { var count = 1; var spend = o.deliveryFee });
        };
        case (?entry) {
          entry.count += 1;
          entry.spend += o.deliveryFee;
        };
      };
    };

    let customerList = List.empty<AnalyticsTypes.TopCustomerEntry>();
    for ((userId, stats) in customerOrderMap.entries()) {
      let displayName = switch (userProfiles.get(userId)) {
        case (?p) p.displayName;
        case (null) userId.toText();
      };
      customerList.add({
        userId;
        displayName;
        ordersPlaced = stats.count;
        totalSpend = stats.spend;
      });
    };
    let sortedCustomers = customerList.sort(func(a : AnalyticsTypes.TopCustomerEntry, b : AnalyticsTypes.TopCustomerEntry) : Order.Order =
      if (a.ordersPlaced > b.ordersPlaced) #less
      else if (a.ordersPlaced < b.ordersPlaced) #greater
      else #equal
    );
    let topCustomers = if (sortedCustomers.size() <= 10) sortedCustomers.toArray()
                       else sortedCustomers.sliceToArray(0, 10);

    {
      totalCommission = platformBalance;
      periodDays;
      dailyStats;
      referralStats = {
        totalReferrals;
        referralsThisPeriod;
        totalCreditsIssued;
      };
      promoStats = {
        totalCodesCreated;
        totalUsesThisPeriod;
        totalDiscountGivenThisPeriod;
      };
      topRiders;
      topCustomers;
    };
  };
};
