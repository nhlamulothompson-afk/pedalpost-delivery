import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import RiderLocationLib "../lib/rider-location";

mixin (
  riderLocations : Map.Map<Principal, CommonTypes.RiderLocation>,
  accessControlState : AccessControl.AccessControlState,
) {
  /// Called by riders every 5-10 seconds with their current GPS coordinates.
  /// Only authenticated riders may call this.
  public shared ({ caller }) func updateRiderLocation(latitude : Float, longitude : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: must be logged in");
    };
    RiderLocationLib.update(riderLocations, caller, latitude, longitude);
  };

  /// Returns the latest location of the rider assigned to a given order.
  /// Returns null if no location has been reported for that rider yet.
  public query func getRiderLocation(riderId : Principal) : async ?CommonTypes.RiderLocation {
    RiderLocationLib.getForRider(riderLocations, riderId);
  };
};
