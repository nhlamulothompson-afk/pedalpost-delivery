import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Types "../types/common";
import PromoTypes "../types/promo";

// Promo codes domain logic
module {
  public type PromoCode = PromoTypes.PromoCode;
  public type PromoUseRecord = PromoTypes.PromoUseRecord;
  public type DiscountType = PromoTypes.DiscountType;

  // Create a new promo code (operator only)
  public func createPromoCode(
    promoCodes : List.List<PromoCode>,
    code : Text,
    discountType : DiscountType,
    expiresAt : ?Types.Timestamp,
    maxUses : ?Nat,
    usesPerUser : ?Nat,
    now : Types.Timestamp,
  ) : PromoCode {
    let promo : PromoCode = {
      id = promoCodes.size();
      code;
      discountType;
      expiresAt;
      maxUses;
      usesPerUser;
      totalUses = 0;
      createdAt = now;
      isActive = true;
    };
    promoCodes.add(promo);
    promo;
  };

  // Validate and compute discount amount for a promo code; returns ?discountAmount
  public func validateAndApply(
    promoCodes : List.List<PromoCode>,
    promoUses : List.List<PromoUseRecord>,
    code : Text,
    userId : Types.UserId,
    deliveryFee : Nat,
    now : Types.Timestamp,
  ) : ?Nat {
    switch (promoCodes.find(func(p : PromoCode) : Bool { p.code == code and p.isActive })) {
      case (null) null;
      case (?promo) {
        // Check expiry
        switch (promo.expiresAt) {
          case (?exp) { if (now > exp) return null };
          case (null) {};
        };
        // Check total max uses
        switch (promo.maxUses) {
          case (?max) { if (promo.totalUses >= max) return null };
          case (null) {};
        };
        // Check per-user limit
        switch (promo.usesPerUser) {
          case (?limit) {
            let userUseCount = promoUses.filter(func(u : PromoUseRecord) : Bool {
              u.promoId == promo.id and Principal.equal(u.userId, userId)
            }).size();
            if (userUseCount >= limit) return null;
          };
          case (null) {};
        };
        // Compute discount
        let discount = switch (promo.discountType) {
          case (#percent p) {
            let d = (deliveryFee * p) / 100;
            if (d > deliveryFee) deliveryFee else d;
          };
          case (#fixed f) {
            if (f > deliveryFee) deliveryFee else f;
          };
        };
        ?discount;
      };
    };
  };

  // Record that a promo code was used on an order
  public func recordUse(
    promoCodes : List.List<PromoCode>,
    promoUses : List.List<PromoUseRecord>,
    code : Text,
    userId : Types.UserId,
    orderId : Types.OrderId,
    discountApplied : Nat,
    now : Types.Timestamp,
  ) : PromoUseRecord {
    // Find promo and increment totalUses in-place
    var promoId : Nat = 0;
    promoCodes.mapInPlace(func(p : PromoCode) : PromoCode {
      if (p.code == code) {
        promoId := p.id;
        { p with totalUses = p.totalUses + 1 }
      } else p
    });
    let useRecord : PromoUseRecord = {
      promoId;
      userId;
      orderId;
      discountApplied;
      usedAt = now;
    };
    promoUses.add(useRecord);
    useRecord;
  };

  // Deactivate a promo code
  public func deactivateCode(
    promoCodes : List.List<PromoCode>,
    code : Text,
  ) : Bool {
    var found = false;
    promoCodes.mapInPlace(func(p : PromoCode) : PromoCode {
      if (p.code == code and p.isActive) {
        found := true;
        { p with isActive = false }
      } else p
    });
    found;
  };

  // Compute aggregate promo statistics
  public func computeStats(
    promoCodes : List.List<PromoCode>,
    promoUses : List.List<PromoUseRecord>,
  ) : PromoTypes.PromoStats {
    let totalCodes = promoCodes.size();
    let totalUses = promoUses.size();
    let totalDiscountGiven = promoUses.foldLeft(0, func(acc, u) { acc + u.discountApplied });
    { totalCodes; totalUses; totalDiscountGiven };
  };
};
