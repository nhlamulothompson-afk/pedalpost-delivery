import Types "common";
// Ratings domain types
module {
  public type Rating = Nat; // 1–5

  public type RatingRecord = {
    id : Nat;
    orderId : Types.OrderId;
    customerId : Types.UserId;
    riderId : Types.UserId;
    rating : Rating;
    comment : ?Text;
    createdAt : Types.Timestamp;
  };
};
