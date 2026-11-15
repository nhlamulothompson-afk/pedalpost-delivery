import Types "common";

// Stripe payment domain types for PedalPost.
// All monetary amounts in ZAR cents (100 cents = R1).
module {

  // Status of a Stripe Checkout Session for an order
  public type PaymentSessionStatus = {
    #pending;     // session created, customer has not paid yet
    #succeeded;   // payment confirmed
    #failed;      // payment failed / expired
    #retrying;    // new session created for retry
  };

  // Record tracking a Stripe Checkout Session tied to an order
  public type PaymentSessionRecord = {
    sessionId : Text;           // Stripe session ID (cs_…)
    orderId : Types.OrderId;
    customerId : Types.UserId;
    amount : Nat;               // delivery fee in ZAR cents
    status : PaymentSessionStatus;
    createdAt : Types.Timestamp;
    updatedAt : Types.Timestamp;
  };

  // Status of an operator payout to a rider
  public type PayoutStatus = {
    #pending;
    #processing;
    #completed;
    #failed;
  };

  // Record tracking a payout from the operator to a rider
  public type PayoutRecord = {
    id : Text;
    riderId : Types.UserId;
    amount : Nat;           // ZAR cents
    status : PayoutStatus;
    note : Text;
    createdAt : Types.Timestamp;
  };

  // Operator payout dashboard summary
  public type OperatorPayoutDashboard = {
    totalCommissionEarned : Nat;       // total platform commission ever, ZAR cents
    totalPayoutsCompleted : Nat;       // sum of completed payout amounts, ZAR cents
    totalPayoutsPending : Nat;         // sum of pending/processing amounts, ZAR cents
    payouts : [PayoutRecord];
  };
};
