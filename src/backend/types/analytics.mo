import Types "common";
// Analytics domain types
module {
  public type DailyStat = {
    date : Text; // "YYYY-MM-DD"
    ordersPlaced : Nat;
    ordersDelivered : Nat;
    commission : Nat;
  };

  public type ReferralAnalytics = {
    totalReferrals : Nat;
    referralsThisPeriod : Nat;
    totalCreditsIssued : Nat; // total ZAR credits issued, in cents
  };

  public type PromoAnalytics = {
    totalCodesCreated : Nat;
    totalUsesThisPeriod : Nat;
    totalDiscountGivenThisPeriod : Nat;
  };

  public type TopRiderEntry = {
    userId : Types.UserId;
    displayName : Text;
    deliveriesCompleted : Nat;
    totalEarnings : Int;
    averageRating : Float;
  };

  public type TopCustomerEntry = {
    userId : Types.UserId;
    displayName : Text;
    ordersPlaced : Nat;
    totalSpend : Nat;
  };

  public type AnalyticsDashboard = {
    totalCommission : Nat;
    periodDays : Nat;
    dailyStats : [DailyStat];
    referralStats : ReferralAnalytics;
    promoStats : PromoAnalytics;
    topRiders : [TopRiderEntry];
    topCustomers : [TopCustomerEntry];
  };
};
