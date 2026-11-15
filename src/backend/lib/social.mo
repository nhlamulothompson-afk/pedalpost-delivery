import List "mo:core/List";
import Principal "mo:core/Principal";
import Types "../types/common";
import SocialTypes "../types/social";

// Social sharing domain logic
module {
  public type ShareEvent = SocialTypes.ShareEvent;
  public type SharePlatform = SocialTypes.SharePlatform;

  // Build the shareable referral URL for a user given the app base URL and their referral code
  public func buildReferralLink(baseUrl : Text, referralCode : Text) : Text {
    baseUrl # "?ref=" # referralCode;
  };

  // Record a share event
  public func recordShare(
    shareEvents : List.List<ShareEvent>,
    userId : Types.UserId,
    orderId : ?Types.OrderId,
    platform : SharePlatform,
    now : Types.Timestamp,
  ) : ShareEvent {
    let event : ShareEvent = {
      id = shareEvents.size();
      userId;
      orderId;
      platform;
      createdAt = now;
    };
    shareEvents.add(event);
    event;
  };

  // Returns total share count for a user
  public func getUserShareCount(
    shareEvents : List.List<ShareEvent>,
    userId : Types.UserId,
  ) : Nat {
    shareEvents.filter(func(e : ShareEvent) : Bool {
      Principal.equal(e.userId, userId)
    }).size();
  };
};
