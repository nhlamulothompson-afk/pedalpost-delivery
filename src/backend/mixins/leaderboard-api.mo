import Map "mo:core/Map";
import Types "../types/common";
import LeaderboardTypes "../types/leaderboard";
import LeaderboardLib "../lib/leaderboard";

// Public API mixin for the leaderboard domain
mixin (
  userProfiles : Map.Map<Types.UserId, {
    id : Types.UserId;
    displayName : Text;
    role : Types.UserRole;
    vehicleType : ?Types.VehicleType;
    isAvailable : Bool;
    totalDeliveries : Nat;
    averageRating : Float;
    ratingCount : Nat;
    rating : Float;
    var balance : Int;
    email : ?Text;
    createdAt : Int;
  }>,
) {
  // Returns the top 25 riders sorted by deliveries completed then rating
  // Each entry includes a badge tier: gold (1st), silver (2nd), bronze (3rd), default (rest)
  public query func getLeaderboard() : async [LeaderboardTypes.LeaderboardEntry] {
    LeaderboardLib.buildLeaderboard(userProfiles, 25);
  };
};
