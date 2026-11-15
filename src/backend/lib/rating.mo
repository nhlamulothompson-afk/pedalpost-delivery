import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Types "../types/common";
import RatingTypes "../types/rating";

// Rider ratings domain logic
module {
  public type Rating = RatingTypes.Rating;
  public type RatingRecord = RatingTypes.RatingRecord;

  // Create a new rating record; validates rating is 1–5
  public func createRating(
    ratings : List.List<RatingRecord>,
    orderId : Types.OrderId,
    customerId : Types.UserId,
    riderId : Types.UserId,
    rating : Rating,
    comment : ?Text,
    now : Types.Timestamp,
  ) : RatingRecord {
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };
    let record : RatingRecord = {
      id = ratings.size();
      orderId;
      customerId;
      riderId;
      rating;
      comment;
      createdAt = now;
    };
    ratings.add(record);
    record;
  };

  // Checks whether a customer has already rated a given order
  public func alreadyRated(
    ratings : List.List<RatingRecord>,
    orderId : Types.OrderId,
    customerId : Types.UserId,
  ) : Bool {
    switch (ratings.find(func(r : RatingRecord) : Bool {
      r.orderId == orderId and Principal.equal(r.customerId, customerId)
    })) {
      case (?_) true;
      case (null) false;
    };
  };

  // Compute average rating for a rider across all recorded ratings
  public func computeAverageRating(
    ratings : List.List<RatingRecord>,
    riderId : Types.UserId,
  ) : (Float, Nat) {
    var total : Nat = 0;
    var count : Nat = 0;
    ratings.forEach(func(r : RatingRecord) {
      if (Principal.equal(r.riderId, riderId)) {
        total += r.rating;
        count += 1;
      };
    });
    if (count == 0) (5.0, 0)
    else (total.toFloat() / count.toFloat(), count);
  };

  // Returns all ratings for a given rider
  public func getRiderRatings(
    ratings : List.List<RatingRecord>,
    riderId : Types.UserId,
  ) : [RatingRecord] {
    ratings.filter(func(r : RatingRecord) : Bool {
      Principal.equal(r.riderId, riderId)
    }).toArray();
  };
};
