import Types "common";
// Promo codes domain types
module {
  public type DiscountType = {
    #percent : Nat;  // e.g. 10 = 10% off
    #fixed : Nat;    // fixed amount off delivery fee, in ZAR cents (e.g. 1000 = R10 off)
  };

  public type PromoCode = {
    id : Nat;
    code : Text;
    discountType : DiscountType;
    expiresAt : ?Types.Timestamp;
    maxUses : ?Nat;        // null = unlimited
    usesPerUser : ?Nat;    // null = unlimited per user
    totalUses : Nat;
    createdAt : Types.Timestamp;
    isActive : Bool;
  };

  public type PromoUseRecord = {
    promoId : Nat;
    userId : Types.UserId;
    orderId : Types.OrderId;
    discountApplied : Nat;
    usedAt : Types.Timestamp;
  };

  public type PromoStats = {
    totalCodes : Nat;
    totalUses : Nat;
    totalDiscountGiven : Nat;
  };
};
