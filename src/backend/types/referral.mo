import Types "common";
// Referral domain types
module {
  public type ReferralCode = Text;

  public type ReferralRecord = {
    id : Nat;
    referrerId : Types.UserId;
    refereeId : Types.UserId;
    creditAmount : Nat; // ZAR credits awarded to each party, in cents (100 cents = R1)
    redeemedAt : Types.Timestamp;
  };

  public type ReferralStats = {
    totalReferrals : Nat;
    totalCreditsAwarded : Nat;
    referralHistory : [ReferralRecord];
  };
};
