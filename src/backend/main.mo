import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Migration "migration";
import MixinReferral "mixins/referral-api";
import MixinRating "mixins/rating-api";
import MixinLeaderboard "mixins/leaderboard-api";
import MixinPromo "mixins/promo-api";
import MixinAnalytics "mixins/analytics-api";
import MixinSocial "mixins/social-api";
import MixinRiderLocation "mixins/rider-location-api";
import MixinEmailNotifications "mixins/email-notifications-api";
import EmailLib "lib/email-notifications";
import StripeLib "lib/stripe";
import StripeClient "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import ReferralTypes "types/referral";
import RatingTypes "types/rating";
import PromoTypes "types/promo";
import SocialTypes "types/social";
import StripeTypes "types/stripe";


(with migration = Migration.run)
actor {
  // ── Authorization ──────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Types ──────────────────────────────────────────────────────────────────

  public type VehicleType = { #bicycle; #electricWheel; #eBike };
  public type UserRole = { #customer; #rider };
  public type OrderStatus = {
    #pending;
    #paymentPending;
    #accepted;
    #pickedUp;
    #delivered;
    #cancelled;
  };

  public type UserProfile = {
    id : Principal;
    displayName : Text;
    role : UserRole;
    vehicleType : ?VehicleType;
    isAvailable : Bool;
    totalDeliveries : Nat;
    averageRating : Float;
    ratingCount : Nat;
    rating : Float; // kept for legacy compat — equals averageRating
    var balance : Int;
    email : ?Text;
    createdAt : Int;
  };

  public type UserProfilePublic = {
    id : Principal;
    displayName : Text;
    role : UserRole;
    vehicleType : ?VehicleType;
    isAvailable : Bool;
    totalDeliveries : Nat;
    averageRating : Float;
    ratingCount : Nat;
    rating : Float;
    balance : Int;
    email : ?Text;
    createdAt : Int;
  };

  public type Order = {
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
    status : OrderStatus;
    createdAt : Int;
    updatedAt : Int;
    estimatedTime : ?Text;
    deliveryPhotoUrl : ?Text; // photo proof of delivery
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let userProfiles = Map.empty<Principal, UserProfile>();
  let orders = Map.empty<Text, Order>();
  var nextOrderId : Nat = 0;

  // Referral state
  let referralCodes = Map.empty<Principal, ReferralTypes.ReferralCode>();
  let referralRecords = List.empty<ReferralTypes.ReferralRecord>();
  let userCredits = Map.empty<Principal, Nat>();

  // Rating state
  let ratings = List.empty<RatingTypes.RatingRecord>();
  let userAverageRatings = Map.empty<Principal, (Float, Nat)>();

  // Promo state
  let promoCodes = List.empty<PromoTypes.PromoCode>();
  let promoUses = List.empty<PromoTypes.PromoUseRecord>();

  // Social sharing state
  let shareEvents = List.empty<SocialTypes.ShareEvent>();

  // Rider location state
  let riderLocations = Map.empty<Principal, { latitude : Float; longitude : Float; updatedAt : Int }>();

  // Email notification state — operator email is configurable by admin
  let operatorEmailRef = { var value : Text = "" };

  // Stripe state
  let paymentSessions = Map.empty<Text, StripeTypes.PaymentSessionRecord>();
  let payoutRecords = List.empty<StripeTypes.PayoutRecord>();
  let stripeConfig = { var secretKey : Text = "" };
  let nextPayoutId = { var value : Nat = 0 };
  let platformBalanceRef = { var value : Nat = 0 };

  // ── Mixins ─────────────────────────────────────────────────────────────────
  include MixinReferral(referralCodes, referralRecords, userCredits);
  include MixinRating(ratings, orders, userAverageRatings);
  include MixinLeaderboard(userProfiles);
  include MixinPromo(promoCodes, promoUses, orders, accessControlState);
  include MixinAnalytics(orders, userProfiles, referralRecords, promoUses, promoCodes, platformBalanceRef, accessControlState);
  include MixinSocial(shareEvents, referralCodes);
  include MixinRiderLocation(riderLocations, accessControlState);
  include MixinEmailNotifications(accessControlState, operatorEmailRef);

  // ── Helpers ────────────────────────────────────────────────────────────────

  func toPublic(p : UserProfile) : UserProfilePublic {
    {
      id = p.id;
      displayName = p.displayName;
      role = p.role;
      vehicleType = p.vehicleType;
      isAvailable = p.isAvailable;
      totalDeliveries = p.totalDeliveries;
      averageRating = p.averageRating;
      ratingCount = p.ratingCount;
      rating = p.rating;
      balance = p.balance;
      email = p.email;
      createdAt = p.createdAt;
    };
  };

  func requireAuth(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: must be logged in");
    };
  };

  // ── Profile API ────────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfilePublic {
    requireAuth(caller);
    switch (userProfiles.get(caller)) {
      case (null) null;
      case (?p) ?toPublic(p);
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(
    displayName : Text,
    role : UserRole,
    vehicleType : ?VehicleType,
    email : ?Text,
  ) : async UserProfilePublic {
    requireAuth(caller);
    let now = Time.now();
    let existing = userProfiles.get(caller);
    let profile : UserProfile = switch (existing) {
      case (null) {
        {
          id = caller;
          displayName;
          role;
          vehicleType;
          isAvailable = false;
          totalDeliveries = 0;
          averageRating = 5.0;
          ratingCount = 0;
          rating = 5.0;
          var balance = 0;
          email;
          createdAt = now;
        };
      };
      case (?p) {
        {
          id = p.id;
          displayName;
          role;
          vehicleType;
          isAvailable = p.isAvailable;
          totalDeliveries = p.totalDeliveries;
          averageRating = p.averageRating;
          ratingCount = p.ratingCount;
          rating = p.rating;
          var balance = p.balance;
          email;
          createdAt = p.createdAt;
        };
      };
    };
    userProfiles.add(caller, profile);
    toPublic(profile);
  };

  public query ({ caller }) func getUserProfile(userId : Principal) : async ?UserProfilePublic {
    requireAuth(caller);
    switch (userProfiles.get(userId)) {
      case (null) null;
      case (?p) ?toPublic(p);
    };
  };

  public query ({ caller }) func getAllRiders() : async [UserProfilePublic] {
    requireAuth(caller);
    userProfiles.values().filter(func(p : UserProfile) : Bool {
      p.role == #rider
    }).map<UserProfile, UserProfilePublic>(func(p) { toPublic(p) }).toArray();
  };

  // ── Order API ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func placeOrder(
    pickupAddress : Text,
    deliveryAddress : Text,
    packageDescription : Text,
    packageWeight : Text,
    deliveryFee : Nat,
  ) : async Order {
    requireAuth(caller);
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found: please create a profile first") };
      case (?p) {
        if (p.role != #customer) {
          Runtime.trap("Only customers can place orders");
        };
      };
    };
    if (deliveryFee == 0) {
      Runtime.trap("Delivery fee must be greater than zero");
    };

    let platformFee = (deliveryFee * 25) / 100;
    let riderPayout = deliveryFee - platformFee;
    let orderId = "order-" # nextOrderId.toText();
    nextOrderId += 1;

    let now = Time.now();
    let order : Order = {
      id = orderId;
      customerId = caller;
      riderId = null;
      pickupAddress;
      deliveryAddress;
      packageDescription;
      packageWeight;
      deliveryFee;
      platformFee;
      riderPayout;
      promoDiscount = null;
      status = #pending;
      createdAt = now;
      updatedAt = now;
      estimatedTime = null;
      deliveryPhotoUrl = null;
    };
    orders.add(orderId, order);
    order;
  };

  public shared ({ caller }) func acceptOrder(orderId : Text) : async Order {
    requireAuth(caller);
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) {
        if (p.role != #rider) {
          Runtime.trap("Only riders can accept orders");
        };
      };
    };
    let order = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) {
        if (o.status != #pending) {
          Runtime.trap("Order is not available for acceptance");
        };
        o;
      };
    };

    // Assign rider and set to #paymentPending — payment must be confirmed before #accepted
    let updated = { order with riderId = ?caller; status = #paymentPending; updatedAt = Time.now() };
    orders.add(orderId, updated);
    updated;
  };

  public shared ({ caller }) func markPickedUp(orderId : Text) : async Order {
    requireAuth(caller);
    let updated = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        switch (order.riderId) {
          case (null) { Runtime.trap("No rider assigned to this order") };
          case (?rider) {
            if (not Principal.equal(rider, caller)) {
              Runtime.trap("Only the assigned rider can update this order");
            };
          };
        };
        if (order.status != #accepted) {
          Runtime.trap("Order must be accepted before pick-up");
        };
        let u = { order with status = #pickedUp; updatedAt = Time.now() };
        orders.add(orderId, u);
        u;
      };
    };

    // Send email notifications
    let riderName = switch (userProfiles.get(caller)) {
      case (?rp) rp.displayName;
      case (null) "Rider";
    };
    let customerProfile = userProfiles.get(updated.customerId);
    let customerName = switch (customerProfile) {
      case (?cp) cp.displayName;
      case (null) "Customer";
    };
    let subject = "PedalPost - Order Update: Parcel Picked Up";
    // Customer email
    switch (customerProfile) {
      case (?cp) {
        switch (cp.email) {
          case (?custEmail) {
            ignore EmailLib.sendNotification(
              [custEmail],
              subject,
              EmailLib.buildCustomerPickedUpHtml(
                updated.id,
                riderName,
                updated.deliveryAddress,
                updated.deliveryFee,
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
        EmailLib.buildOperatorPickedUpHtml(
          updated.id,
          customerName,
          riderName,
          updated.deliveryFee,
          updated.platformFee,
        ),
      );
    };

    updated;
  };

  // deliveryPhotoUrl is uploaded via object-storage extension; URL passed here after upload
  public shared ({ caller }) func markDelivered(orderId : Text, deliveryPhotoUrl : ?Text) : async Order {
    requireAuth(caller);
    let updated = switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        switch (order.riderId) {
          case (null) { Runtime.trap("No rider assigned to this order") };
          case (?rider) {
            if (not Principal.equal(rider, caller)) {
              Runtime.trap("Only the assigned rider can update this order");
            };
          };
        };
        if (order.status != #pickedUp) {
          Runtime.trap("Order must be picked up before marking delivered");
        };
        let u = { order with status = #delivered; updatedAt = Time.now(); deliveryPhotoUrl };
        orders.add(orderId, u);
        // Credit rider balance and increment delivery count
        switch (userProfiles.get(caller)) {
          case (null) {};
          case (?riderProfile) {
            riderProfile.balance += order.riderPayout.toInt();
            let updatedRider : UserProfile = {
              riderProfile with
              totalDeliveries = riderProfile.totalDeliveries + 1;
              var balance = riderProfile.balance;
            };
            userProfiles.add(caller, updatedRider);
          };
        };
        u;
      };
    };

    // Send email notifications
    let riderName = switch (userProfiles.get(caller)) {
      case (?rp) rp.displayName;
      case (null) "Rider";
    };
    let customerProfile = userProfiles.get(updated.customerId);
    let customerName = switch (customerProfile) {
      case (?cp) cp.displayName;
      case (null) "Customer";
    };
    let deliveredSubject = "PedalPost - Order Update: Parcel Delivered";
    // Customer email
    switch (customerProfile) {
      case (?cp) {
        switch (cp.email) {
          case (?custEmail) {
            ignore EmailLib.sendNotification(
              [custEmail],
              deliveredSubject,
              EmailLib.buildCustomerDeliveredHtml(
                updated.id,
                riderName,
                updated.deliveryPhotoUrl,
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
        deliveredSubject,
        EmailLib.buildOperatorDeliveredHtml(
          updated.id,
          customerName,
          riderName,
          updated.deliveryFee,
          updated.platformFee,
          updated.riderPayout,
        ),
      );
    };

    updated;
  };

  public shared ({ caller }) func cancelOrder(orderId : Text) : async Order {
    requireAuth(caller);
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let isCustomer = Principal.equal(order.customerId, caller);
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        if (not isCustomer and not isAdmin) {
          Runtime.trap("Only the customer or an admin can cancel this order");
        };
        if (order.status != #pending and order.status != #paymentPending) {
          Runtime.trap("Only pending or payment-pending orders can be cancelled");
        };
        let updated = { order with status = #cancelled; updatedAt = Time.now() };
        orders.add(orderId, updated);
        updated;
      };
    };
  };

  public query func getPendingOrders() : async [Order] {
    // Exclude #paymentPending orders — those are locked to a rider awaiting payment
    orders.values().filter(func(o : Order) : Bool { o.status == #pending }).toArray();
  };

  public query ({ caller }) func getMyOrders() : async [Order] {
    requireAuth(caller);
    orders.values().filter(func(o : Order) : Bool {
      Principal.equal(o.customerId, caller)
    }).toArray();
  };

  public query ({ caller }) func getMyRiderOrders() : async [Order] {
    requireAuth(caller);
    orders.values().filter(func(o : Order) : Bool {
      switch (o.riderId) {
        case (?r) Principal.equal(r, caller);
        case (null) false;
      };
    }).toArray();
  };

  public query ({ caller }) func getOrder(orderId : Text) : async ?Order {
    requireAuth(caller);
    switch (orders.get(orderId)) {
      case (null) null;
      case (?order) {
        let isCustomer = Principal.equal(order.customerId, caller);
        let isRider = switch (order.riderId) {
          case (?r) Principal.equal(r, caller);
          case (null) false;
        };
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        if (not isCustomer and not isRider and not isAdmin) {
          Runtime.trap("Unauthorized: cannot view this order");
        };
        ?order;
      };
    };
  };

  // ── Admin API ──────────────────────────────────────────────────────────────

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func getPlatformBalance() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    platformBalanceRef.value;
  };

  public query ({ caller }) func getOrderStats() : async {
    total : Nat;
    pending : Nat;
    delivered : Nat;
    cancelled : Nat;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    var total = 0;
    var pending = 0;
    var delivered = 0;
    var cancelled = 0;
    for (o in orders.values()) {
      total += 1;
      switch (o.status) {
        case (#pending) pending += 1;
        case (#delivered) delivered += 1;
        case (#cancelled) cancelled += 1;
        case (_) {};
      };
    };
    { total; pending; delivered; cancelled };
  };

  // ── Rider Balance API ──────────────────────────────────────────────────────

  public shared ({ caller }) func withdrawRiderBalance(amount : Nat) : async Bool {
    requireAuth(caller);
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) {
        if (p.role != #rider) {
          Runtime.trap("Only riders can withdraw balance");
        };
        if (p.balance < amount.toInt()) {
          false;
        } else {
          p.balance -= amount.toInt();
          let updatedP : UserProfile = {
            p with
            var balance = p.balance;
          };
          userProfiles.add(caller, updatedP);
          true;
        };
      };
    };
  };

  // ── Stripe API (must be declared in the actor, not in a mixin) ────────────

  // Transform function required by the http-outcalls extension for Stripe calls.
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    { input.response with headers = [] };
  };

  // Check if Stripe is configured (no auth required — frontend needs this).
  public query func isStripeConfigured() : async Bool {
    stripeConfig.secretKey != "";
  };

  // Admin only: store the Stripe secret key.
  public shared ({ caller }) func setStripeConfiguration(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    stripeConfig.secretKey := key;
  };

  // Create a Stripe Checkout Session for an order in #paymentPending status.
  // Returns the checkout URL; the customer must visit it to pay.
  // Only callable by the order's customer.
  public shared ({ caller }) func createCheckoutSession(
    orderId : Text,
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
      sessionId = sessionUrl;
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

  // Confirm payment for an order using the Stripe session ID.
  // Transitions order from #paymentPending → #accepted and credits commissions.
  // Only callable by the order's customer.
  public shared ({ caller }) func confirmOrderPayment(
    orderId : Text,
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
      platformBalanceRef.value += order.platformFee;
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

  // Check Stripe session status (passthrough to Stripe).
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

  // Admin: initiate a payout to a rider (deducts from their balance and records payout).
  public shared ({ caller }) func initiateRiderPayout(
    riderId : Principal,
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
    riderProfile.balance -= amount.toInt();
    let updatedRider : UserProfile = { riderProfile with var balance = riderProfile.balance };
    userProfiles.add(riderId, updatedRider);
    StripeLib.recordPayout(payoutRecords, nextPayoutId, riderId, amount, note);
  };

  // Admin: mark a payout as completed.
  public shared ({ caller }) func completeRiderPayout(payoutId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    StripeLib.completePayout(payoutRecords, payoutId);
  };

  // Rider or admin: get payout history for a rider.
  public query ({ caller }) func getRiderPayoutHistory(
    riderId : Principal,
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
    StripeLib.buildPayoutDashboard(payoutRecords, platformBalanceRef.value);
  };

  // Customer or admin: get the payment session record for an order.
  public query ({ caller }) func getOrderPaymentSession(
    orderId : Text,
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
