import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/common";
import StripeTypes "../types/stripe";

// Stripe domain helpers — state manipulation only (no HTTP calls).
// HTTP calls are made directly in the mixin to properly bind the transform function.
module {

  // ── Session store helpers ───────────────────────────────────────────────

  // Upsert a payment session record in the map (keyed by orderId).
  public func upsertSession(
    sessions : Map.Map<Types.OrderId, StripeTypes.PaymentSessionRecord>,
    record : StripeTypes.PaymentSessionRecord,
  ) {
    sessions.add(record.orderId, record);
  };

  // Get the current session record for an order.
  public func getSession(
    sessions : Map.Map<Types.OrderId, StripeTypes.PaymentSessionRecord>,
    orderId : Types.OrderId,
  ) : ?StripeTypes.PaymentSessionRecord {
    sessions.get(orderId);
  };

  // ── Payout helpers ──────────────────────────────────────────────────────

  // Record a new payout entry (operator-initiated, manual).
  public func recordPayout(
    payouts : List.List<StripeTypes.PayoutRecord>,
    nextId : { var value : Nat },
    riderId : Types.UserId,
    amount : Nat,
    note : Text,
  ) : StripeTypes.PayoutRecord {
    let payout : StripeTypes.PayoutRecord = {
      id = "payout-" # nextId.value.toText();
      riderId;
      amount;
      status = #pending;
      note;
      createdAt = Time.now();
    };
    nextId.value += 1;
    payouts.add(payout);
    payout;
  };

  // Mark a payout as completed.
  public func completePayout(
    payouts : List.List<StripeTypes.PayoutRecord>,
    payoutId : Text,
  ) {
    payouts.mapInPlace(func(p : StripeTypes.PayoutRecord) : StripeTypes.PayoutRecord {
      if (p.id == payoutId) { { p with status = #completed } } else { p };
    });
  };

  // Get all payouts for a specific rider.
  public func getRiderPayouts(
    payouts : List.List<StripeTypes.PayoutRecord>,
    riderId : Types.UserId,
  ) : [StripeTypes.PayoutRecord] {
    payouts.filter(func(p : StripeTypes.PayoutRecord) : Bool {
      Principal.equal(p.riderId, riderId)
    }).toArray();
  };

  // Build operator payout dashboard.
  public func buildPayoutDashboard(
    payouts : List.List<StripeTypes.PayoutRecord>,
    totalCommission : Nat,
  ) : StripeTypes.OperatorPayoutDashboard {
    var completedTotal : Nat = 0;
    var pendingTotal : Nat = 0;
    payouts.forEach(func(p : StripeTypes.PayoutRecord) {
      switch (p.status) {
        case (#completed) { completedTotal += p.amount };
        case (#pending or #processing) { pendingTotal += p.amount };
        case (#failed) {};
      };
    });
    {
      totalCommissionEarned = totalCommission;
      totalPayoutsCompleted = completedTotal;
      totalPayoutsPending = pendingTotal;
      payouts = payouts.toArray();
    };
  };
};
