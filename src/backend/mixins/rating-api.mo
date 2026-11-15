import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/common";
import RatingTypes "../types/rating";
import RatingLib "../lib/rating";

// Public API mixin for the rider ratings domain
mixin (
  ratings : List.List<RatingTypes.RatingRecord>,
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
  userAverageRatings : Map.Map<Types.UserId, (Float, Nat)>,
) {
  // Customer submits a rating (1–5) + optional comment after delivery
  public shared ({ caller }) func rateRider(
    orderId : Types.OrderId,
    rating : RatingTypes.Rating,
    comment : ?Text,
  ) : async RatingTypes.RatingRecord {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in");
    let order = switch (orders.get(orderId)) {
      case (null) Runtime.trap("Order not found");
      case (?o) o;
    };
    if (not Principal.equal(order.customerId, caller)) {
      Runtime.trap("Only the customer who placed this order can rate the rider");
    };
    if (order.status != #delivered) {
      Runtime.trap("Can only rate after delivery is complete");
    };
    let riderId = switch (order.riderId) {
      case (null) Runtime.trap("No rider assigned to this order");
      case (?r) r;
    };
    if (RatingLib.alreadyRated(ratings, orderId, caller)) {
      Runtime.trap("You have already rated this delivery");
    };
    let now = Time.now();
    let record = RatingLib.createRating(ratings, orderId, caller, riderId, rating, comment, now);
    // Update cached average rating
    let (avg, cnt) = RatingLib.computeAverageRating(ratings, riderId);
    userAverageRatings.add(riderId, (avg, cnt));
    record;
  };

  // Returns all ratings received by a specific rider
  public query func getRiderRatings(riderId : Types.UserId) : async [RatingTypes.RatingRecord] {
    RatingLib.getRiderRatings(ratings, riderId);
  };
};
