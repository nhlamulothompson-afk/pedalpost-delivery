import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/common";
import PromoTypes "../types/promo";
import PromoLib "../lib/promo";

// Public API mixin for the promo codes domain
// Discount is applied to the delivery fee before the 25% platform commission is taken
mixin (
  promoCodes : List.List<PromoTypes.PromoCode>,
  promoUses : List.List<PromoTypes.PromoUseRecord>,
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
  accessControlState : AccessControl.AccessControlState,
) {
  // Operator creates a new promo code
  public shared ({ caller }) func createPromoCode(
    code : Text,
    discountType : PromoTypes.DiscountType,
    expiresAt : ?Types.Timestamp,
    maxUses : ?Nat,
    usesPerUser : ?Nat,
  ) : async PromoTypes.PromoCode {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: operator only");
    };
    let now = Time.now();
    PromoLib.createPromoCode(
      promoCodes, code, discountType, expiresAt, maxUses, usesPerUser, now,
    );
  };

  // Customer applies a promo code to a pending order
  // Discount is applied to the delivery fee, then 25% commission is recalculated on the discounted fee
  public shared ({ caller }) func applyPromoCode(
    orderId : Types.OrderId,
    code : Text,
  ) : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    let order = switch (orders.get(orderId)) {
      case (null) Runtime.trap("Order not found");
      case (?o) o;
    };
    if (not Principal.equal(order.customerId, caller)) {
      Runtime.trap("Only the order's customer can apply a promo code");
    };
    if (order.status != #pending) {
      Runtime.trap("Promo codes can only be applied to pending orders");
    };
    if (order.promoDiscount != null) {
      Runtime.trap("A promo code has already been applied to this order");
    };
    let now = Time.now();
    let discount = switch (PromoLib.validateAndApply(
      promoCodes, promoUses, code, caller, order.deliveryFee, now,
    )) {
      case (null) Runtime.trap("Promo code is invalid, expired, or usage limit reached");
      case (?d) d;
    };
    // Recalculate fees after discount
    let discountedFee = if (discount >= order.deliveryFee) 0 else order.deliveryFee - discount;
    let newPlatformFee = (discountedFee * 25) / 100;
    let newRiderPayout = if (newPlatformFee >= discountedFee) 0 else discountedFee - newPlatformFee;
    let updated = {
      order with
      promoDiscount = ?discount;
      platformFee = newPlatformFee;
      riderPayout = newRiderPayout;
      updatedAt = now;
    };
    orders.add(orderId, updated);
    // Record the promo use
    ignore PromoLib.recordUse(
      promoCodes, promoUses, code, caller, orderId, discount, now,
    );
    discount;
  };

  // Operator deactivates a promo code
  public shared ({ caller }) func deactivatePromoCode(code : Text) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: operator only");
    };
    PromoLib.deactivateCode(promoCodes, code);
  };

  // Returns aggregate promo statistics (operator only)
  public query ({ caller }) func getPromoStats() : async PromoTypes.PromoStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: operator only");
    };
    PromoLib.computeStats(promoCodes, promoUses);
  };
};
