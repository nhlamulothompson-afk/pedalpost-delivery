import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Types "../types/common";
import ReferralTypes "../types/referral";

// Referral domain logic
module {
  public type ReferralCode = ReferralTypes.ReferralCode;
  public type ReferralRecord = ReferralTypes.ReferralRecord;
  public type ReferralStats = ReferralTypes.ReferralStats;

  // Generate a unique referral code for a user — deterministic from principal text
  // Takes first 6 + last 4 chars of the principal text as a short readable code
  public func generateCode(userId : Types.UserId) : ReferralCode {
    let raw = userId.toText();
    let chars = raw.toArray();
    let size = chars.size();
    if (size <= 12) raw
    else {
      var code = "";
      var i = 0;
      for (c in chars.values()) {
        if (i < 6) {
          code := code # Text.fromChar(c);
        };
        if (i >= size - 4) {
          code := code # Text.fromChar(c);
        };
        i += 1;
      };
      code;
    };
  };

  // Validate that a referral code belongs to a user and return the referrer's id
  public func resolveCode(
    referralCodes : Map.Map<Types.UserId, ReferralCode>,
    code : ReferralCode,
  ) : ?Types.UserId {
    for ((userId, userCode) in referralCodes.entries()) {
      if (userCode == code) return ?userId;
    };
    null;
  };

  // Record that a referee completed their first order and award credits to both parties
  // Returns (newRecord, referrerId) if successful
  public func redeemReferral(
    referralCodes : Map.Map<Types.UserId, ReferralCode>,
    referralRecords : List.List<ReferralRecord>,
    refereeId : Types.UserId,
    referralCode : ReferralCode,
    creditAmount : Nat,
    now : Types.Timestamp,
  ) : ?(ReferralRecord, Types.UserId) {
    // Must not have been referred before
    if (hasBeenReferred(referralRecords, refereeId)) return null;
    switch (resolveCode(referralCodes, referralCode)) {
      case (null) null;
      case (?referrerId) {
        // Referrer cannot refer themselves
        if (Principal.equal(referrerId, refereeId)) return null;
        let record : ReferralRecord = {
          id = referralRecords.size();
          referrerId;
          refereeId;
          creditAmount;
          redeemedAt = now;
        };
        referralRecords.add(record);
        ?(record, referrerId);
      };
    };
  };

  // Returns all referral records for a given user (as referrer)
  public func getReferralHistory(
    referralRecords : List.List<ReferralRecord>,
    userId : Types.UserId,
  ) : [ReferralRecord] {
    referralRecords.filter(func(r : ReferralRecord) : Bool {
      Principal.equal(r.referrerId, userId)
    }).toArray();
  };

  // Checks whether a referee has already been onboarded via a referral
  public func hasBeenReferred(
    referralRecords : List.List<ReferralRecord>,
    refereeId : Types.UserId,
  ) : Bool {
    switch (referralRecords.find(func(r : ReferralRecord) : Bool {
      Principal.equal(r.refereeId, refereeId)
    })) {
      case (?_) true;
      case (null) false;
    };
  };
};
