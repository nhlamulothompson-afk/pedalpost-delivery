import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import CommonTypes "../types/common";

module {
  public type RiderLocation = CommonTypes.RiderLocation;
  public type RiderLocations = Map.Map<Principal, RiderLocation>;

  /// Store or overwrite the caller's GPS location.
  public func update(
    riderLocations : RiderLocations,
    riderId : Principal,
    latitude : Float,
    longitude : Float,
  ) {
    let loc : RiderLocation = {
      latitude;
      longitude;
      updatedAt = Time.now();
    };
    riderLocations.add(riderId, loc);
  };

  /// Return the latest location for a given rider principal.
  public func getForRider(
    riderLocations : RiderLocations,
    riderId : Principal,
  ) : ?RiderLocation {
    riderLocations.get(riderId);
  };
};
