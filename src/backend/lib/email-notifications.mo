import EmailClient "mo:caffeineai-email/emailClient";

// Domain logic for PedalPost transactional email notifications.
// All monetary amounts are stored as ZAR cents (100 cents = R1).
// Emails are sent via the caffeineai-email extension.
module {

  // ── Currency formatting ──────────────────────────────────────────────────

  // Formats a ZAR cent amount as "R XX.XX"
  public func formatRands(cents : Nat) : Text {
    let rands = cents / 100;
    let remainingCents = cents % 100;
    let centsStr = if (remainingCents < 10) { "0" # remainingCents.toText() } else { remainingCents.toText() };
    "R " # rands.toText() # "." # centsStr;
  };

  // ── HTML email builders ──────────────────────────────────────────────────

  func htmlWrapper(title : Text, body : Text) : Text {
    "<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>"
    # "<div style='background:#2e7d32;padding:16px;border-radius:8px 8px 0 0;'>"
    # "<h1 style='color:#fff;margin:0;font-size:20px;'>🚲 PedalPost</h1>"
    # "</div>"
    # "<div style='border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;'>"
    # "<h2 style='color:#2e7d32;'>" # title # "</h2>"
    # body
    # "<hr style='margin:24px 0;border:none;border-top:1px solid #e0e0e0;'/>"
    # "<p style='color:#888;font-size:12px;'>PedalPost – Eco-friendly delivery by bicycles &amp; electric wheels. All amounts in South African Rands (R).</p>"
    # "</div></body></html>";
  };

  func orderRow(rowLabel : Text, value : Text) : Text {
    "<tr><td style='padding:6px 12px 6px 0;color:#555;'><strong>" # rowLabel # "</strong></td>"
    # "<td style='padding:6px 0;'>" # value # "</td></tr>";
  };

  // Customer email: order accepted
  public func buildCustomerAcceptedHtml(
    orderId : Text,
    riderName : Text,
    pickupAddress : Text,
    deliveryAddress : Text,
    deliveryFee : Nat,
  ) : Text {
    let body = "<p>Great news! A rider has accepted your delivery order.</p>"
      # "<table style='width:100%;border-collapse:collapse;'>"
      # orderRow("Order ID:", orderId)
      # orderRow("Rider:", riderName)
      # orderRow("Pickup:", pickupAddress)
      # orderRow("Delivery to:", deliveryAddress)
      # orderRow("Delivery Fee:", formatRands(deliveryFee))
      # "</table>"
      # "<p style='margin-top:16px;'>Your rider is on their way to pick up your parcel. You'll hear from us again when it's been collected.</p>";
    htmlWrapper("Your Rider Has Accepted Your Order", body);
  };

  // Operator email: order accepted
  public func buildOperatorAcceptedHtml(
    orderId : Text,
    customerName : Text,
    riderName : Text,
    deliveryFee : Nat,
    platformFee : Nat,
  ) : Text {
    let body = "<p>A new order has been accepted by a rider.</p>"
      # "<table style='width:100%;border-collapse:collapse;'>"
      # orderRow("Order ID:", orderId)
      # orderRow("Customer:", customerName)
      # orderRow("Rider:", riderName)
      # orderRow("Delivery Fee:", formatRands(deliveryFee))
      # orderRow("Your Commission (25%):", formatRands(platformFee))
      # "</table>";
    htmlWrapper("New Order Accepted – Commission Incoming", body);
  };

  // Customer email: parcel picked up
  public func buildCustomerPickedUpHtml(
    orderId : Text,
    riderName : Text,
    deliveryAddress : Text,
    deliveryFee : Nat,
  ) : Text {
    let body = "<p>Your parcel has been picked up and is now on its way to you!</p>"
      # "<table style='width:100%;border-collapse:collapse;'>"
      # orderRow("Order ID:", orderId)
      # orderRow("Rider:", riderName)
      # orderRow("Delivering to:", deliveryAddress)
      # orderRow("Delivery Fee:", formatRands(deliveryFee))
      # "</table>"
      # "<p style='margin-top:16px;'>Sit tight – your rider is heading your way on their eco-friendly wheels. 🌿</p>";
    htmlWrapper("Your Parcel Has Been Picked Up", body);
  };

  // Operator email: parcel picked up
  public func buildOperatorPickedUpHtml(
    orderId : Text,
    customerName : Text,
    riderName : Text,
    deliveryFee : Nat,
    platformFee : Nat,
  ) : Text {
    let body = "<p>A parcel is now in transit.</p>"
      # "<table style='width:100%;border-collapse:collapse;'>"
      # orderRow("Order ID:", orderId)
      # orderRow("Customer:", customerName)
      # orderRow("Rider:", riderName)
      # orderRow("Delivery Fee:", formatRands(deliveryFee))
      # orderRow("Your Commission (25%):", formatRands(platformFee))
      # "</table>";
    htmlWrapper("Order In Transit", body);
  };

  // Customer email: parcel delivered
  public func buildCustomerDeliveredHtml(
    orderId : Text,
    riderName : Text,
    deliveryPhotoUrl : ?Text,
  ) : Text {
    let photoSection = switch (deliveryPhotoUrl) {
      case (null) "";
      case (?url) "<p><strong>Proof of delivery photo:</strong><br/>"
        # "<img src='" # url # "' alt='Delivery photo' style='max-width:100%;border-radius:8px;margin-top:8px;'/></p>";
    };
    let body = "<p>🎉 Your parcel has been delivered successfully!</p>"
      # "<table style='width:100%;border-collapse:collapse;'>"
      # orderRow("Order ID:", orderId)
      # orderRow("Delivered by:", riderName)
      # "</table>"
      # photoSection
      # "<p style='margin-top:16px;'>Thank you for choosing PedalPost for your eco-friendly delivery.</p>";
    htmlWrapper("Your Parcel Has Been Delivered", body);
  };

  // Operator email: parcel delivered
  public func buildOperatorDeliveredHtml(
    orderId : Text,
    customerName : Text,
    riderName : Text,
    deliveryFee : Nat,
    platformFee : Nat,
    riderPayout : Nat,
  ) : Text {
    let body = "<p>✅ Delivery completed. Your commission has been earned.</p>"
      # "<table style='width:100%;border-collapse:collapse;'>"
      # orderRow("Order ID:", orderId)
      # orderRow("Customer:", customerName)
      # orderRow("Rider:", riderName)
      # orderRow("Delivery Fee:", formatRands(deliveryFee))
      # orderRow("Your Commission (25%):", formatRands(platformFee))
      # orderRow("Rider Payout:", formatRands(riderPayout))
      # "</table>";
    htmlWrapper("Delivery Completed – Commission Earned", body);
  };

  // Customer email: payment failed — retry prompt
  public func buildPaymentFailedHtml(
    orderId : Text,
    deliveryFee : Nat,
  ) : Text {
    let body = "<p>⚠️ Your payment for order <strong>" # orderId # "</strong> could not be processed.</p>"
      # "<table style='width:100%;border-collapse:collapse;'>"
      # orderRow("Order ID:", orderId)
      # orderRow("Amount Due:", formatRands(deliveryFee))
      # "</table>"
      # "<p style='margin-top:16px;'>Your order is still reserved for the same rider. Please retry your payment to proceed with the delivery.</p>"
      # "<p style='color:#d32f2f;'>If you do not complete payment, your order may be cancelled.</p>";
    htmlWrapper("Payment Failed — Please Retry", body);
  };

  // ── Send helpers ────────────────────────────────────────────────────────

  // Sends a service email to a list of recipients; ignores errors gracefully.
  public func sendNotification(
    recipients : [Text],
    subject : Text,
    htmlBody : Text,
  ) : async () {
    if (recipients.size() == 0) { return };
    let _ = await EmailClient.sendServiceEmail(
      "notifications",
      recipients,
      subject,
      htmlBody,
    );
  };
};
