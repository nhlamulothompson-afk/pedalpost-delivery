import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Types "../types/common";
import LeaderboardTypes "../types/leaderboard";

// Leaderboard domain logic
module {
  public type LeaderboardEntry = LeaderboardTypes.LeaderboardEntry;
  public type BadgeTier = LeaderboardTypes.BadgeTier;

  func badgeForRank(rank : Nat) : BadgeTier {
    if (rank == 0) #gold
    else if (rank == 1) #silver
    else if (rank == 2) #bronze
    else #default;
  };

  // Build top-N leaderboard entries sorted by deliveries desc, then rating desc
  public func buildLeaderboard(
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
    topN : Nat,
  ) : [LeaderboardEntry] {
    let riders = List.empty<LeaderboardEntry>();
    for ((userId, p) in userProfiles.entries()) {
      if (p.role == #rider) {
        riders.add({
          userId;
          displayName = p.displayName;
          vehicleType = p.vehicleType;
          deliveriesCompleted = p.totalDeliveries;
          averageRating = p.averageRating;
          totalEarnings = p.balance;
          badgeTier = #default; // placeholder — assigned after sorting
        });
      };
    };

    let sorted = riders.sort(func(a : LeaderboardEntry, b : LeaderboardEntry) : Order.Order =
      if (a.deliveriesCompleted > b.deliveriesCompleted) #less
      else if (a.deliveriesCompleted < b.deliveriesCompleted) #greater
      else if (a.averageRating > b.averageRating) #less
      else if (a.averageRating < b.averageRating) #greater
      else #equal
    );

    let capped = if (sorted.size() <= topN) sorted.toArray()
                 else sorted.sliceToArray(0, topN.toInt());

    // Assign badge tiers based on final rank
    capped.mapEntries<LeaderboardEntry, LeaderboardEntry>(func(entry, rank) {
      { entry with badgeTier = badgeForRank(rank) }
    });
  };
};
