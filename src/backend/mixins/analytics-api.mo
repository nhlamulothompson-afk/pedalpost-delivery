import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/common";
import AnalyticsTypes "../types/analytics";
import ReferralTypes "../types/referral";
import PromoTypes "../types/promo";
import AnalyticsLib "../lib/analytics";

// Public API mixin for the operator analytics dashboard
mixin (
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
  platformBalanceRef : { var value : Nat },
  accessControlState : AccessControl.AccessControlState,
) {
  // Returns full analytics dashboard; operator only. periodDays defaults to 30 if null.
  public query ({ caller }) func getAnalyticsDashboard(
    periodDays : ?Nat,
  ) : async AnalyticsTypes.AnalyticsDashboard {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: operator only");
    };
    let days = switch (periodDays) {
      case (?d) d;
      case (null) 30;
    };
    let now = Time.now();
    AnalyticsLib.buildDashboard(
      orders, userProfiles, referralRecords, promoUses, promoCodes, platformBalanceRef.value, days, now,
    );
  };
};
