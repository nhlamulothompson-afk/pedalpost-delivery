import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import StripeClient "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/common";
import StripeTypes "../types/stripe";
import StripeLib "../lib/stripe";
import EmailLib "../lib/email-notifications";

// Public Stripe API mixin — payment sessions, retry, payout management.
mixin (
  orders : Map.Map<Types.OrderId, {
    id : Types.OrderId;
    customerId : Types.UserId;
    riderId : ?Types.UserId;
    pickupAddress : Text;
    deliveryAddress : Text;
    packageDescription : Text;
    packageWeight : Text;
    deliveryFee : Nat;
    platformFee : Nat;
    riderPayout : Nat;
    promoDiscount : ?Nat;
    status : Types.OrderStatus;
    createdAt : Types.Timestamp;
    updatedAt : Types.Timestamp;
    estimatedTime : ?Text;
    deliveryPhotoUrl : ?Text;
  }>,
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
  paymentSessions : Map.Map<Types.OrderId, StripeTypes.PaymentSessionRecord>,
  payoutRecords : List.List<StripeTypes.PayoutRecord>,
  stripeConfig : { var secretKey : Text },
  nextPayoutId : { var value : Nat },
  platformBalance : { var value : Nat },
  accessControlState : AccessControl.AccessControlState,
  operatorEmailRef : { var value : Text },
) {

  // ── Transform function required by Stripe extension ────────────────────

  public query func transform(raw : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    { raw.response with headers = [] };
  };

  // ── Stripe configuration ───────────────────────────────────────────────

  // Admin only: store the Stripe secret key.
  public shared ({ caller }) func setStripeConfiguration(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    stripeConfig.secretKey := key;
  };

  // Anyone can check if Stripe is configured (needed by frontend).
  public query func isStripeConfigured() : async Bool {
    stripeConfig.secretKey != "";
  };

  // ── Payment session creation (called by acceptOrder flow) ──────────────

  // Create a Stripe Checkout Session for an order that is in #paymentPending.
  // Returns the checkout URL; the customer must visit it to pay.
  // Only callable by the order's customer.
  // Named createCheckoutSession to satisfy the Stripe extension rule.
  public shared ({ caller }) func createCheckoutSession(
    orderId : Types.OrderId,
    successUrl : Text,
    cancelUrl : Text,
  ) : async Text {
    if (stripeConfig.secretKey == "") {
      Runtime.trap("Stripe is not configured — contact the operator");
    };
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) o;
    };
    if (not Principal.equal(order.customerId, caller)) {
      Runtime.trap("Unauthorized: only the order customer can initiate payment");
    };
    switch (order.status) {
      case (#paymentPending or #accepted) {};
      case (_) { Runtime.trap("Order is not awaiting payment") };
    };
    let riderName = switch (order.riderId) {
      case (null) "Your Rider";
      case (?rid) switch (userProfiles.get(rid)) {
        case (?rp) rp.displayName;
        case (null) "Your Rider";
      };
    };
    let config : StripeClient.StripeConfiguration = {
      secretKey = stripeConfig.secretKey;
      allowedCountries = ["ZA"];
    };
    let sessionUrl = await StripeClient.createCheckoutSession(
      config,
      caller,
      [{
        currency = "zar";
        productName = "PedalPost Delivery #" # orderId;
        productDescription = "Eco-friendly delivery by " # riderName;
        priceInCents = order.deliveryFee;
        quantity = 1;
      }],
      successUrl,
      cancelUrl,
      transform,
    );
    // Record session as pending
    let record : StripeTypes.PaymentSessionRecord = {
      sessionId = sessionUrl; // Stripe returns session URL; we store it as the reference
      orderId;
      customerId = caller;
      amount = order.deliveryFee;
      status = #pending;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    StripeLib.upsertSession(paymentSessions, record);
    sessionUrl;
  };

  // ── Confirm payment (called after Stripe redirects back) ───────────────

  // Confirm payment for an order using the Stripe session ID.
  // Transitions order from #paymentPending → #accepted and credits commissions.
  // Only callable by the order's customer.
  public shared ({ caller }) func confirmOrderPayment(
    orderId : Types.OrderId,
    sessionId : Text,
  ) : async Bool {
    if (stripeConfig.secretKey == "") {
      Runtime.trap("Stripe is not configured");
    };
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) o;
    };
    if (not Principal.equal(order.customerId, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (order.status) {
      case (#paymentPending or #accepted) {};
      case (_) { Runtime.trap("Order is not awaiting payment confirmation") };
    };
    let config : StripeClient.StripeConfiguration = {
      secretKey = stripeConfig.secretKey;
      allowedCountries = ["ZA"];
    };
    let succeeded = switch (await StripeClient.getSessionStatus(config, sessionId, transform)) {
      case (#completed(_)) true;
      case (#failed(_)) false;
    };
    if (succeeded) {
      // Mark payment session succeeded
      switch (paymentSessions.get(orderId)) {
        case (?rec) {
          StripeLib.upsertSession(paymentSessions, { rec with status = #succeeded; updatedAt = Time.now() });
        };
        case (null) {};
      };
      // Transition order to #accepted and credit platform balance
      let updated = { order with status = #accepted; updatedAt = Time.now() };
      orders.add(orderId, updated);
      platformBalance.value += order.platformFee;
      // Send success emails
      let customerProfile = userProfiles.get(order.customerId);
      let riderName = switch (order.riderId) {
        case (null) "Your Rider";
        case (?rid) switch (userProfiles.get(rid)) {
          case (?rp) rp.displayName;
          case (null) "Your Rider";
        };
      };
      let customerName = switch (customerProfile) {
        case (?cp) cp.displayName;
        case (null) "Customer";
      };
      let subject = "PedalPost - Payment Confirmed: Order Accepted";
      switch (customerProfile) {
        case (?cp) {
          switch (cp.email) {
            case (?custEmail) {
              ignore EmailLib.sendNotification(
                [custEmail],
                subject,
                EmailLib.buildCustomerAcceptedHtml(
                  orderId,
                  riderName,
                  order.pickupAddress,
                  order.deliveryAddress,
                  order.deliveryFee,
                ),
              );
            };
            case (null) {};
          };
        };
        case (null) {};
      };
      let opEmail = operatorEmailRef.value;
      if (opEmail != "") {
        ignore EmailLib.sendNotification(
          [opEmail],
          subject,
          EmailLib.buildOperatorAcceptedHtml(
            orderId,
            customerName,
            riderName,
            order.deliveryFee,
            order.platformFee,
          ),
        );
      };
      true
    } else {
      // Payment failed — mark session failed, keep order in #paymentPending
      switch (paymentSessions.get(orderId)) {
        case (?rec) {
          StripeLib.upsertSession(paymentSessions, { rec with status = #failed; updatedAt = Time.now() });
        };
        case (null) {};
      };
      // Ensure order stays in #paymentPending
      let pending = { order with status = #paymentPending; updatedAt = Time.now() };
      orders.add(orderId, pending);
      // Send retry prompt to customer
      switch (userProfiles.get(order.customerId)) {
        case (?cp) {
          switch (cp.email) {
            case (?custEmail) {
              ignore EmailLib.sendNotification(
                [custEmail],
                "PedalPost - Payment Failed: Please Retry",
                EmailLib.buildPaymentFailedHtml(orderId, order.deliveryFee),
              );
            };
            case (null) {};
          };
        };
        case (null) {};
      };
      false
    };
  };

  // ── Stripe session status passthrough ──────────────────────────────────

  // Check Stripe session status; required by the Stripe extension rules.
  public shared ({ caller }) func getStripeSessionStatus(
    sessionId : Text,
  ) : async StripeClient.StripeSessionStatus {
    if (stripeConfig.secretKey == "") {
      Runtime.trap("Stripe is not configured");
    };
    let config : StripeClient.StripeConfiguration = {
      secretKey = stripeConfig.secretKey;
      allowedCountries = ["ZA"];
    };
    await StripeClient.getSessionStatus(config, sessionId, transform);
  };

  // ── Payout management (admin only) ─────────────────────────────────────

  // Admin: initiate a payout to a rider (deducts from their balance and records payout).
  public shared ({ caller }) func initiateRiderPayout(
    riderId : Types.UserId,
    amount : Nat,
    note : Text,
  ) : async StripeTypes.PayoutRecord {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let riderProfile = switch (userProfiles.get(riderId)) {
      case (null) { Runtime.trap("Rider profile not found") };
      case (?p) {
        if (p.role != #rider) { Runtime.trap("Target is not a rider") };
        p;
      };
    };
    if (riderProfile.balance < amount.toInt()) {
      Runtime.trap("Rider balance insufficient");
    };
    // Deduct from rider balance
    riderProfile.balance -= amount.toInt();
    let updatedRider = { riderProfile with var balance = riderProfile.balance };
    userProfiles.add(riderId, updatedRider);
    // Record payout
    StripeLib.recordPayout(payoutRecords, nextPayoutId, riderId, amount, note);
  };

  // Admin: mark a payout as completed.
  public shared ({ caller }) func completeRiderPayout(payoutId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    StripeLib.completePayout(payoutRecords, payoutId);
  };

  // Query: get payout history for a specific rider (rider can query their own; admin can query any).
  public query ({ caller }) func getRiderPayoutHistory(
    riderId : Types.UserId,
  ) : async [StripeTypes.PayoutRecord] {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let isSelf = Principal.equal(caller, riderId);
    if (not isAdmin and not isSelf) {
      Runtime.trap("Unauthorized");
    };
    StripeLib.getRiderPayouts(payoutRecords, riderId);
  };

  // Admin: get full payout dashboard.
  public query ({ caller }) func getOperatorPayoutDashboard() : async StripeTypes.OperatorPayoutDashboard {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    StripeLib.buildPayoutDashboard(payoutRecords, platformBalance.value);
  };

  // Query: get the payment session record for an order.
  public query ({ caller }) func getOrderPaymentSession(
    orderId : Types.OrderId,
  ) : async ?StripeTypes.PaymentSessionRecord {
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) o;
    };
    let isCustomer = Principal.equal(order.customerId, caller);
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isCustomer and not isAdmin) {
      Runtime.trap("Unauthorized");
    };
    paymentSessions.get(orderId);
  };
};
