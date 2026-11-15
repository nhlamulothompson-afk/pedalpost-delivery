import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  Leaf,
  Loader2,
  MapPin,
  Package,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RiderRatingWidget } from "../components/delivery/RiderRatingWidget";
import { SocialShareModal } from "../components/delivery/SocialShareModal";
import { PaymentRetryModal } from "../components/payment/PaymentRetryModal";
import {
  useCancelOrder,
  useConfirmOrderPayment,
  useGetOrder,
  useGetOrderPaymentSession,
  useGetRiderLocation,
} from "../hooks/useQueries";
import type { RiderLocation } from "../types";
import {
  type OrderStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  formatZAR,
} from "../types";

// Fix Leaflet default icon paths
(L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl =
  undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Geocoding via Nominatim ───────────────────────────────────────────────────

async function geocodeAddress(
  address: string,
): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "PedalPost/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return [Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon)];
  } catch {
    return null;
  }
}

// ── Custom map icons ──────────────────────────────────────────────────────────

function svgIcon(color: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 9.941 14.667 28 16 28S32 25.941 32 16C32 7.163 24.837 0 16 0z" fill="${color}"/>
      <circle cx="16" cy="16" r="7" fill="white"/>
      <text x="16" y="42" text-anchor="middle" font-size="9" fill="${color}" font-family="sans-serif" font-weight="bold">${label}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
    className: "",
  });
}

const pickupIcon = svgIcon("#22c55e", "Pickup");
const dropoffIcon = svgIcon("#ef4444", "Drop-off");
const riderIcon = svgIcon("#3b82f6", "Rider");

// ── Delivery Map component ────────────────────────────────────────────────────

interface DeliveryMapProps {
  pickupAddress: string;
  deliveryAddress: string;
  riderLocation: RiderLocation | null | undefined;
}

function DeliveryMap({
  pickupAddress,
  deliveryAddress,
  riderLocation,
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const pickupMarker = useRef<L.Marker | null>(null);
  const dropoffMarker = useRef<L.Marker | null>(null);
  const riderMarker = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const initPickup = useRef(pickupAddress).current;
  const initDelivery = useRef(deliveryAddress).current;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);
    mapInstance.current = map;

    Promise.all([geocodeAddress(initPickup), geocodeAddress(initDelivery)])
      .then(([pickupCoords, dropoffCoords]) => {
        if (!pickupCoords && !dropoffCoords) {
          setError(true);
          setLoading(false);
          return;
        }
        const bounds: L.LatLngTuple[] = [];
        if (pickupCoords) {
          pickupMarker.current = L.marker(pickupCoords, { icon: pickupIcon })
            .addTo(map)
            .bindPopup(`<strong>📦 Pickup</strong><br/>${pickupAddress}`);
          bounds.push(pickupCoords);
        }
        if (dropoffCoords) {
          dropoffMarker.current = L.marker(dropoffCoords, { icon: dropoffIcon })
            .addTo(map)
            .bindPopup(`<strong>🏁 Drop-off</strong><br/>${deliveryAddress}`);
          bounds.push(dropoffCoords);
        }
        if (bounds.length > 0) {
          if (bounds.length === 1) {
            map.setView(bounds[0], 14);
          } else {
            map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [initPickup, initDelivery, pickupAddress, deliveryAddress]);

  useEffect(() => {
    if (!mapInstance.current || !riderLocation) return;
    const { latitude, longitude } = riderLocation;
    const latlng: L.LatLngTuple = [latitude, longitude];

    if (riderMarker.current) {
      riderMarker.current.setLatLng(latlng);
    } else {
      riderMarker.current = L.marker(latlng, { icon: riderIcon })
        .addTo(mapInstance.current)
        .bindPopup("<strong>🚲 Your Rider</strong><br/>En route...");
    }

    const allMarkers = [
      pickupMarker.current,
      dropoffMarker.current,
      riderMarker.current,
    ].filter(Boolean) as L.Marker[];
    if (allMarkers.length > 1) {
      const bounds = L.latLngBounds(allMarkers.map((m) => m.getLatLng()));
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [riderLocation]);

  if (error) {
    return (
      <div className="h-52 flex items-center justify-center bg-muted/30 rounded-xl border border-border text-sm text-muted-foreground gap-2">
        <MapPin className="h-4 w-4 shrink-0" />
        Map unavailable — geocoding failed for these addresses.
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading map...
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="h-52 w-full rounded-xl overflow-hidden border border-border z-0"
        aria-label="Delivery tracking map"
      />
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          Pickup
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          Drop-off
        </span>
        {riderLocation && (
          <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <span className="w-3 h-3 rounded-full bg-primary inline-block animate-pulse" />
            Rider live location
          </span>
        )}
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MOCK_ORDER = {
  id: "ord-002",
  customerId: "usr-001",
  riderId: "rider-042",
  pickupAddress: "7 High St, London EC2A 1AB",
  deliveryAddress: "22 Victoria Ave, London SW1A 2AA",
  packageDescription: "Small gift parcel",
  packageWeight: "0.5-2kg",
  status: "delivered" as OrderStatus,
  createdAt: BigInt(Date.now() - 1800000),
  updatedAt: BigInt(Date.now() - 900000),
  deliveryFee: BigInt(400),
  platformFee: BigInt(100),
  riderPayout: BigInt(300),
  estimatedTime: "15-20 min",
  deliveryPhotoUrl: undefined as string | undefined,
};

const STEPS: {
  status: OrderStatus;
  label: string;
  icon: typeof CheckCircle;
}[] = [
  { status: "pending", label: "Order placed", icon: Clock },
  { status: "accepted", label: "Rider accepted", icon: Bike },
  { status: "pickedUp", label: "Package picked up", icon: Package },
  { status: "delivered", label: "Delivered!", icon: CheckCircle },
];

const STATUS_STEP: Record<OrderStatus, number> = {
  pending: 0,
  accepted: 1,
  pickedUp: 2,
  delivered: 3,
  cancelled: -1,
  paymentPending: 0,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const { orderId } = useParams({ from: "/customer/track/$orderId" });
  const navigate = useNavigate();

  // Read query params for Stripe redirect return
  const searchParams = new URLSearchParams(window.location.search);
  const stripeSessionId = searchParams.get("session_id");
  const paymentResult = searchParams.get("payment");

  const { data: order, isLoading } = useGetOrder(orderId);
  const { mutateAsync: cancelOrder, isPending: isCancelling } =
    useCancelOrder();
  const confirmPayment = useConfirmOrderPayment();
  const { data: paymentSession } = useGetOrderPaymentSession(orderId);

  const [hasRated, setHasRated] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [paymentRetryOpen, setPaymentRetryOpen] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const displayOrder = order ?? MOCK_ORDER;
  const currentStep = STATUS_STEP[displayOrder.status];
  const isDelivered = displayOrder.status === "delivered";
  const isPaymentPending = displayOrder.status === "paymentPending";
  const showMap =
    displayOrder.status === "accepted" || displayOrder.status === "pickedUp";

  const { data: riderLocation } = useGetRiderLocation(
    showMap ? displayOrder.riderId : undefined,
  );

  // Auto-confirm payment when returning from Stripe with session_id
  const confirmPaymentMutate = confirmPayment.mutateAsync;
  useEffect(() => {
    if (!stripeSessionId || !orderId || paymentConfirmed || paymentProcessing)
      return;

    setPaymentProcessing(true);
    confirmPaymentMutate({ orderId, sessionId: stripeSessionId })
      .then((success) => {
        setPaymentConfirmed(true);
        if (success) {
          toast.success("Payment confirmed! Your rider is on the way. 🚲");
        } else {
          toast.error("Payment could not be confirmed. Please retry.");
        }
        // Clean up URL params
        window.history.replaceState({}, "", `/customer/track/${orderId}`);
      })
      .catch(() => {
        toast.error("Payment confirmation failed. Please retry below.");
      })
      .finally(() => {
        setPaymentProcessing(false);
      });
  }, [
    stripeSessionId,
    orderId,
    paymentConfirmed,
    paymentProcessing,
    confirmPaymentMutate,
  ]);

  // Show toast when returning from cancelled payment
  useEffect(() => {
    if (paymentResult === "cancelled") {
      toast.warning(
        "Payment cancelled. Your order is still waiting for payment.",
      );
      window.history.replaceState({}, "", `/customer/track/${orderId}`);
    }
  }, [paymentResult, orderId]);

  const handleCancel = async () => {
    try {
      await cancelOrder(displayOrder.id);
      toast.success("Order cancelled successfully.");
      navigate({ to: "/customer/orders" });
    } catch {
      toast.error("Could not cancel the order. Please try again.");
    }
  };

  const handleRated = () => {
    setHasRated(true);
    setShareModalOpen(true);
  };

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-lg"
      data-ocid="order_tracking.page"
    >
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/customer/orders" })}
          data-ocid="order_tracking.back_button"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Track Order
        </h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Payment processing banner */}
          {paymentProcessing && (
            <Card
              className="border-primary/20 bg-primary/5"
              data-ocid="order_tracking.payment_processing_state"
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Confirming your payment...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please wait while we verify your Stripe payment
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment success banner */}
          {paymentConfirmed && !paymentProcessing && (
            <Card
              className="border-primary/20 bg-primary/5 animate-fade-in-up"
              data-ocid="order_tracking.payment_success_state"
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Payment confirmed — {formatZAR(displayOrder.deliveryFee)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your card has been charged. Rider is on the way!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment failed / pending banner */}
          {isPaymentPending && !paymentProcessing && (
            <Card
              className="border-amber-300/60 bg-amber-50/50"
              data-ocid="order_tracking.payment_pending_state"
            >
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">
                      Payment failed. Update your card to continue.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your rider is assigned and waiting. The order will remain
                      locked to them until payment succeeds.
                    </p>
                  </div>
                </div>

                {paymentSession && (
                  <div className="bg-amber-100/60 rounded-lg p-3 text-sm">
                    <p className="text-amber-800 font-medium">
                      Amount due: {formatZAR(paymentSession.amount)}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Status:{" "}
                      <span className="capitalize font-medium">
                        {paymentSession.status}
                      </span>
                    </p>
                  </div>
                )}

                <Button
                  className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => setPaymentRetryOpen(true)}
                  data-ocid="order_tracking.retry_payment_button"
                >
                  <CreditCard className="h-4 w-4" />
                  Retry Payment with New Card
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card data-ocid="order_tracking.summary_card">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <p className="font-display font-semibold text-foreground">
                    {displayOrder.id}
                  </p>
                </div>
                <Badge className={STATUS_COLORS[displayOrder.status]}>
                  {STATUS_LABELS[displayOrder.status]}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Pickup
                    </span>
                    <p className="text-foreground">
                      {displayOrder.pickupAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Delivery
                    </span>
                    <p className="text-foreground">
                      {displayOrder.deliveryAddress}
                    </p>
                  </div>
                </div>
              </div>

              {displayOrder.estimatedTime &&
                displayOrder.status !== "delivered" &&
                displayOrder.status !== "cancelled" &&
                displayOrder.status !== "paymentPending" && (
                  <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary">
                      {displayOrder.estimatedTime}
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs text-primary gap-1"
                    >
                      <Leaf className="h-3 w-3" /> Eco Rider
                    </Badge>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Live Map */}
          {showMap && (
            <Card
              className="border-primary/20"
              data-ocid="order_tracking.map_card"
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm font-semibold text-foreground">
                    Live Tracking
                  </p>
                  <Badge className="ml-auto text-xs bg-primary/10 text-primary border-primary/20 border gap-1">
                    <Bike className="h-3 w-3" />
                    {riderLocation ? "Rider on the way" : "Locating rider..."}
                  </Badge>
                </div>
                <DeliveryMap
                  pickupAddress={displayOrder.pickupAddress}
                  deliveryAddress={displayOrder.deliveryAddress}
                  riderLocation={riderLocation}
                />
                {riderLocation && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Rider location updates every 10 seconds
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Progress Steps */}
          {displayOrder.status === "cancelled" ? (
            <Card
              className="border-destructive/30"
              data-ocid="order_tracking.cancelled_card"
            >
              <CardContent className="pt-5 pb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Order Cancelled</p>
                  <p className="text-sm text-muted-foreground">
                    This order was cancelled. You were not charged.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !isPaymentPending ? (
            <Card data-ocid="order_tracking.progress_card">
              <CardContent className="pt-6 pb-6">
                <h3 className="font-display font-semibold text-foreground mb-5">
                  Delivery Progress
                </h3>
                <div className="flex flex-col gap-0">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isDone = index <= currentStep;
                    const isActive = index === currentStep;
                    return (
                      <div
                        key={step.status}
                        className="flex items-start gap-3"
                        data-ocid={`order_tracking.step.item.${index + 1}`}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isDone ? "bg-primary" : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${isDone ? "text-primary-foreground" : "text-muted-foreground"}`}
                            />
                          </div>
                          {index < STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-8 mt-1 ${isDone ? "bg-primary" : "bg-border"}`}
                            />
                          )}
                        </div>
                        <div className="pt-1 pb-6">
                          <p
                            className={`text-sm font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {step.label}
                          </p>
                          {isActive && !isDelivered && (
                            <p className="text-xs text-primary mt-0.5">
                              In progress...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Photo Proof */}
          {isDelivered && displayOrder.deliveryPhotoUrl && (
            <Card
              className="border-primary/20 overflow-hidden"
              data-ocid="order_tracking.photo_proof_card"
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    Delivery Photo Proof
                  </p>
                  <Badge className="ml-auto text-xs bg-primary/15 text-primary border-primary/20 border">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="photo-proof-overlay rounded-xl overflow-hidden">
                  <img
                    src={displayOrder.deliveryPhotoUrl}
                    alt="Delivery proof"
                    className="photo-proof-image w-full object-cover rounded-xl"
                  />
                  <div className="photo-proof-badge">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Delivered
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Delivery confirmed — photo captured by your rider
                </p>
              </CardContent>
            </Card>
          )}

          {/* Package Info */}
          <Card className="bg-muted/30" data-ocid="order_tracking.package_card">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Package: </span>
                <span className="text-foreground font-medium">
                  {displayOrder.packageDescription}
                </span>
                {displayOrder.packageWeight && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {displayOrder.packageWeight}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rate your rider */}
          {isDelivered && !hasRated && (
            <Card
              className="border-primary/20 bg-primary/3"
              data-ocid="order_tracking.rating_card"
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Your parcel has arrived!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      How was your eco delivery experience?
                    </p>
                  </div>
                </div>
                <Separator className="mb-4" />
                <RiderRatingWidget
                  orderId={displayOrder.id}
                  onRated={handleRated}
                />
              </CardContent>
            </Card>
          )}

          {/* Post-rating thank you */}
          {isDelivered && hasRated && (
            <Card
              className="border-primary/20 bg-primary/5 animate-fade-in-up"
              data-ocid="order_tracking.rated_card"
            >
              <CardContent className="pt-5 pb-5 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="font-display font-semibold text-foreground mb-1">
                  Thanks for your feedback!
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Your review helps other customers choose great riders.
                </p>
                <Button
                  variant="outline"
                  className="gap-2 border-primary/30 hover:bg-primary/5"
                  onClick={() => setShareModalOpen(true)}
                  data-ocid="order_tracking.share_button"
                >
                  <Leaf className="h-4 w-4 text-primary" />
                  Share your eco experience
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cancel button — only for pending orders */}
          {displayOrder.status === "pending" && (
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive"
              disabled={isCancelling}
              onClick={handleCancel}
              data-ocid="order_tracking.cancel_button"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
        </div>
      )}

      <SocialShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        riderName="Your rider"
        deliveryTimeMinutes={15}
        vehicleType="bicycle"
      />

      <PaymentRetryModal
        open={paymentRetryOpen}
        onClose={() => setPaymentRetryOpen(false)}
        orderId={displayOrder.id}
        amount={displayOrder.deliveryFee}
        errorReason={
          paymentSession?.status === "failed"
            ? "Your previous card payment was declined."
            : undefined
        }
      />
    </div>
  );
}
