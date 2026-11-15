// Common cross-cutting types shared across all domains
// Currency: ZAR (South African Rand). Stored as integer cents where 100 cents = R1.
module {
  public type UserId = Principal;
  public type Timestamp = Int; // nanoseconds from Time.now()
  public type OrderId = Text;

  public type VehicleType = { #bicycle; #electricWheel; #eBike };

  public type UserRole = { #customer; #rider };

  public type OrderStatus = {
    #pending;
    #paymentPending; // rider assigned, awaiting customer payment via Stripe
    #accepted;
    #pickedUp;
    #delivered;
    #cancelled;
  };

  public type RiderLocation = {
    latitude : Float;
    longitude : Float;
    updatedAt : Int;
  };
};
