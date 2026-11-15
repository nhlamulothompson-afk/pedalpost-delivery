import Types "common";
// Leaderboard domain types
module {
  public type BadgeTier = { #gold; #silver; #bronze; #default };

  public type LeaderboardEntry = {
    userId : Types.UserId;
    displayName : Text;
    vehicleType : ?Types.VehicleType;
    deliveriesCompleted : Nat;
    averageRating : Float;
    totalEarnings : Int;
    badgeTier : BadgeTier;
  };
};
