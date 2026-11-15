import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/common";
import SocialTypes "../types/social";
import ReferralTypes "../types/referral";
import SocialLib "../lib/social";

// Public API mixin for the social sharing domain
mixin (
  shareEvents : List.List<SocialTypes.ShareEvent>,
  referralCodes : Map.Map<Types.UserId, ReferralTypes.ReferralCode>,
) {
  // Record a share event (user sharing the app or a delivery on social media)
  public shared ({ caller }) func recordShareEvent(
    orderId : ?Types.OrderId,
    platform : SocialTypes.SharePlatform,
  ) : async SocialTypes.ShareEvent {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    let now = Time.now();
    SocialLib.recordShare(shareEvents, caller, orderId, platform, now);
  };

  // Returns total share count for the caller
  public query ({ caller }) func getMyShareCount() : async Nat {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    SocialLib.getUserShareCount(shareEvents, caller);
  };
};
