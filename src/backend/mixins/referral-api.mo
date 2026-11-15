import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/common";
import ReferralTypes "../types/referral";
import ReferralLib "../lib/referral";

// Public API mixin for the referral domain
// Referral links use invite-links extension pattern: ?ref=<code>
mixin (
  referralCodes : Map.Map<Types.UserId, ReferralTypes.ReferralCode>,
  referralRecords : List.List<ReferralTypes.ReferralRecord>,
  userCredits : Map.Map<Types.UserId, Nat>,
) {
  // Returns the caller's unique referral code, generating it if needed
  public shared ({ caller }) func getMyReferralCode() : async Text {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    switch (referralCodes.get(caller)) {
      case (?code) code;
      case (null) {
        let code = ReferralLib.generateCode(caller);
        referralCodes.add(caller, code);
        code;
      };
    };
  };

  // Returns the caller's shareable referral link
  // Frontend app URL is used as base; ref param is appended
  public shared ({ caller }) func getUserReferralLink() : async Text {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    let code = switch (referralCodes.get(caller)) {
      case (?c) c;
      case (null) {
        let c = ReferralLib.generateCode(caller);
        referralCodes.add(caller, c);
        c;
      };
    };
    // invite-links pattern: app URL with ?ref=<code>
    "https://padeldelever.com?ref=" # code;
  };

  // Called by a new user to redeem a referral code (typically after first sign-up)
  // Awards REFERRAL_CREDIT credits to both referrer and referee
  public shared ({ caller }) func redeemReferralCode(code : Text) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    let REFERRAL_CREDIT : Nat = 5000; // R50.00 in ZAR cents (100 cents = R1)
    let now = Time.now();
    switch (ReferralLib.redeemReferral(
      referralCodes, referralRecords,
      caller, code, REFERRAL_CREDIT, now,
    )) {
      case (null) false;
      case (?(_, referrerId)) {
        // Award credits to referrer
        let referrerCredits = switch (userCredits.get(referrerId)) {
          case (?c) c;
          case (null) 0;
        };
        userCredits.add(referrerId, referrerCredits + REFERRAL_CREDIT);
        // Award credits to referee (caller)
        let refereeCredits = switch (userCredits.get(caller)) {
          case (?c) c;
          case (null) 0;
        };
        userCredits.add(caller, refereeCredits + REFERRAL_CREDIT);
        true;
      };
    };
  };

  // Returns referral history for the caller (as referrer)
  public query ({ caller }) func getMyReferralHistory() : async [ReferralTypes.ReferralRecord] {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    ReferralLib.getReferralHistory(referralRecords, caller);
  };

  // Returns the caller's current credit balance
  public query ({ caller }) func getMyCreditBalance() : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    switch (userCredits.get(caller)) {
      case (?c) c;
      case (null) 0;
    };
  };
};
