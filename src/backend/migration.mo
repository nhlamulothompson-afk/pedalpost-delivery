// Migration: add #paymentPending to OrderStatus and promote platformBalance to ref object.
//
// Old state (pre-Stripe):
//   orders        : Map<Text, Order>  where OrderStatus has no #paymentPending
//   platformBalance : Nat             scalar var
//
// New state (post-Stripe):
//   orders          : Map<Text, Order>  where OrderStatus includes #paymentPending
//   platformBalanceRef : { var value : Nat }  ref object used by stripe-api mixin
import Map "mo:core/Map";

module {
  // ── Old types (copied from .old/src/backend) ───────────────────────────────

  type OldOrderStatus = {
    #pending;
    #accepted;
    #pickedUp;
    #delivered;
    #cancelled;
  };

  type OldUserRole = { #customer; #rider };
  type OldVehicleType = { #bicycle; #electricWheel; #eBike };

  type OldUserProfile = {
    id : Principal;
    displayName : Text;
    role : OldUserRole;
    vehicleType : ?OldVehicleType;
    isAvailable : Bool;
    totalDeliveries : Nat;
    averageRating : Float;
    ratingCount : Nat;
    rating : Float;
    var balance : Int;
    email : ?Text;
    createdAt : Int;
  };

  type OldOrder = {
    id : Text;
    customerId : Principal;
    riderId : ?Principal;
    pickupAddress : Text;
    deliveryAddress : Text;
    packageDescription : Text;
    packageWeight : Text;
    deliveryFee : Nat;
    platformFee : Nat;
    riderPayout : Nat;
    promoDiscount : ?Nat;
    status : OldOrderStatus;
    createdAt : Int;
    updatedAt : Int;
    estimatedTime : ?Text;
    deliveryPhotoUrl : ?Text;
  };

  // ── New types (match main.mo actor state) ──────────────────────────────────

  type NewOrderStatus = {
    #pending;
    #paymentPending;
    #accepted;
    #pickedUp;
    #delivered;
    #cancelled;
  };

  type NewUserRole = { #customer; #rider };
  type NewVehicleType = { #bicycle; #electricWheel; #eBike };

  type NewUserProfile = {
    id : Principal;
    displayName : Text;
    role : NewUserRole;
    vehicleType : ?NewVehicleType;
    isAvailable : Bool;
    totalDeliveries : Nat;
    averageRating : Float;
    ratingCount : Nat;
    rating : Float;
    var balance : Int;
    email : ?Text;
    createdAt : Int;
  };

  type NewOrder = {
    id : Text;
    customerId : Principal;
    riderId : ?Principal;
    pickupAddress : Text;
    deliveryAddress : Text;
    packageDescription : Text;
    packageWeight : Text;
    deliveryFee : Nat;
    platformFee : Nat;
    riderPayout : Nat;
    promoDiscount : ?Nat;
    status : NewOrderStatus;
    createdAt : Int;
    updatedAt : Int;
    estimatedTime : ?Text;
    deliveryPhotoUrl : ?Text;
  };

  // ── Migration record types ─────────────────────────────────────────────────

  type OldActor = {
    orders : Map.Map<Text, OldOrder>;
    var platformBalance : Nat;
  };

  type NewActor = {
    orders : Map.Map<Text, NewOrder>;
    platformBalanceRef : { var value : Nat };
  };

  // ── Migration function ─────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Widen OrderStatus: old orders cannot have #paymentPending, so cast is safe.
    let orders = old.orders.map<Text, OldOrder, NewOrder>(
      func(_id, o) {
        let newStatus : NewOrderStatus = switch (o.status) {
          case (#pending) #pending;
          case (#accepted) #accepted;
          case (#pickedUp) #pickedUp;
          case (#delivered) #delivered;
          case (#cancelled) #cancelled;
        };
        {
          o with
          status = newStatus;
        };
      }
    );
    // Promote scalar platformBalance to ref object
    let platformBalanceRef = { var value : Nat = old.platformBalance };
    { orders; platformBalanceRef };
  };
};
