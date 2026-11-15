import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Bike,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Leaf,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DeliveryPhotoModal } from "../components/delivery/DeliveryPhotoModal";
import {
  useAcceptJob,
  useGetAvailableJobs,
  useGetRiderActiveOrder,
  useUpdateOrderStatus,
  useUpdateRiderLocation,
} from "../hooks/useQueries";
import type { Order } from "../types";

const SAMPLE_JOBS: (Order & { distance?: string })[] = [
  {
    id: "job-a01",
    customerId: "cust-01",
    pickupAddress: "14 Brick Lane, London E1 6RF",
    deliveryAddress: "55 Commercial Rd, London E1 1LN",
    packageDescription: "Sealed envelope",
    packageWeight: "0-0.5 kg",
    status: "pending",
    createdAt: BigInt(Date.now() - 120000),
    updatedAt: BigInt(Date.now() - 60000),
    deliveryFee: BigInt(250),
    platformFee: BigInt(63),
    riderPayout: BigInt(187),
    estimatedTime: "15-20 min",
    distance: "1.2 km",
  },
  {
    id: "job-a02",
    customerId: "cust-02",
    pickupAddress: "3 Shoreditch High St, London E1 6JE",
    deliveryAddress: "44 Old St, London EC1V 9AJ",
    packageDescription: "Fragile glass item",
    packageWeight: "0.5-2 kg",
    status: "pending",
    createdAt: BigInt(Date.now() - 300000),
    updatedAt: BigInt(Date.now() - 180000),
    deliveryFee: BigInt(400),
    platformFee: BigInt(100),
    riderPayout: BigInt(300),
    estimatedTime: "20-30 min",
    distance: "2.4 km",
  },
  {
    id: "job-a03",
    customerId: "cust-03",
    pickupAddress: "88 Liverpool St, London EC2M 7PP",
    deliveryAddress: "12 Cannon St, London EC4N 6JJ",
    packageDescription: "Birthday gift box",
    packageWeight: "2-5 kg",
    status: "pending",
    createdAt: BigInt(Date.now() - 600000),
    updatedAt: BigInt(Date.now() - 300000),
    deliveryFee: BigInt(650),
    platformFee: BigInt(163),
    riderPayout: BigInt(487),
    estimatedTime: "25-35 min",
    distance: "3.1 km",
  },
];

function formatPayout(val: bigint) {
  return `R ${(Number(val) / 100).toFixed(2)}`;
}

// ── Geolocation tracker hook ──────────────────────────────────────────────────

function useRiderLocationBroadcast(active: boolean) {
  const { mutate: updateLocation } = useUpdateRiderLocation();
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const updateLocationRef = useRef(updateLocation);
  useEffect(() => {
    updateLocationRef.current = updateLocation;
  });

  useEffect(() => {
    if (!active || !navigator.geolocation) return;

    let lastCoords: { latitude: number; longitude: number } | null = null;

    const sendLocation = () => {
      if (lastCoords) {
        updateLocationRef.current(lastCoords);
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setIsSharing(true);
      },
      () => {
        setIsSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    intervalRef.current = setInterval(sendLocation, 10000);
    sendLocation();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsSharing(false);
    };
  }, [active]);

  return { isSharing };
}

// ── Payment Pending Card ──────────────────────────────────────────────────────

function PaymentPendingCard({ order }: { order: Order }) {
  return (
    <Card
      className="mb-6 border-amber-300/60 bg-amber-50/50"
      data-ocid="rider_jobs.payment_pending_card"
    >
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-600" />
          Waiting for Payment
          <Badge className="ml-2 bg-amber-100 text-amber-700 border border-amber-300 text-xs">
            Payment Required
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-100/60 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">
              Customer payment is pending
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              This order is locked to you. Once the customer completes payment,
              it will automatically become active. You cannot accept other
              orders until this is resolved.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-muted-foreground">Pickup · </span>
              <span className="text-foreground font-medium">
                {order.pickupAddress}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-muted-foreground">
                Deliver to ·{" "}
              </span>
              <span className="text-foreground font-medium">
                {order.deliveryAddress}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-card rounded-lg px-3 py-2 border flex-1">
            <p className="text-xs text-muted-foreground">Your payout</p>
            <p className="text-sm font-display font-bold text-primary">
              {formatPayout(order.riderPayout)}
            </p>
          </div>
          <div className="bg-card rounded-lg px-3 py-2 border flex-1">
            <p className="text-xs text-muted-foreground">Package</p>
            <p className="text-sm font-medium text-foreground truncate">
              {order.packageDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking payment status... refreshes automatically
        </div>
      </CardContent>
    </Card>
  );
}

// ── Active order card ─────────────────────────────────────────────────────────

function ActiveOrderCard({ order }: { order: Order }) {
  const { mutateAsync: updateStatus, isPending } = useUpdateOrderStatus();
  const [updating, setUpdating] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const isAccepted = order.status === "accepted";
  const isPickedUp = order.status === "pickedUp";
  const isInTransit = isAccepted || isPickedUp;

  const { isSharing } = useRiderLocationBroadcast(isInTransit);

  const handlePickUp = async () => {
    setUpdating(true);
    try {
      await updateStatus({ orderId: order.id, status: "pickedUp" });
      toast.success("Package marked as picked up! Head to the dropoff. 📦");
    } catch {
      toast.error("Could not update order status. Try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliveryConfirm = async (photoUrl: string | null) => {
    setPhotoModalOpen(false);
    setUpdating(true);
    try {
      await updateStatus({
        orderId: order.id,
        status: "delivered",
        photoUrl: photoUrl ?? undefined,
      });
      toast.success("Delivery complete! Great work! 🎉");
    } catch {
      toast.error("Could not update order status. Try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card
        className="mb-6 border-primary/30 bg-primary/5"
        data-ocid="rider_jobs.active_order_card"
      >
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Current Delivery
            <Badge className="bg-primary/15 text-primary border-primary/20 border ml-1 text-xs">
              {isAccepted ? "Accepted" : "Picked Up"}
            </Badge>
            {isInTransit && (
              <span
                className={`ml-auto flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                  isSharing
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
                data-ocid="rider_jobs.location_sharing_badge"
              >
                <Navigation
                  className={`h-3 w-3 ${isSharing ? "animate-pulse" : ""}`}
                />
                {isSharing ? "Sharing location" : "Locating..."}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">Pickup · </span>
                <span className="text-foreground font-medium">
                  {order.pickupAddress}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">
                  Deliver to ·{" "}
                </span>
                <span className="text-foreground font-medium">
                  {order.deliveryAddress}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="bg-card rounded-lg px-3 py-2 border">
              <p className="text-xs text-muted-foreground">Package</p>
              <p className="text-sm font-medium text-foreground">
                {order.packageDescription}
              </p>
            </div>
            <div className="bg-card rounded-lg px-3 py-2 border">
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="text-sm font-medium text-foreground">
                {order.packageWeight}
              </p>
            </div>
            <div className="bg-card rounded-lg px-3 py-2 border ml-auto">
              <p className="text-xs text-muted-foreground">Your payout</p>
              <p className="text-sm font-display font-bold text-primary">
                {formatPayout(order.riderPayout)}
              </p>
            </div>
          </div>

          <Separator className="mb-4" />

          {isAccepted && (
            <Button
              className="w-full gap-2"
              onClick={handlePickUp}
              disabled={isPending || updating}
              data-ocid="rider_jobs.mark_picked_up_button"
            >
              <Package className="h-4 w-4" />
              {updating ? "Updating..." : "Mark as Picked Up"}
            </Button>
          )}
          {isPickedUp && (
            <Button
              className="w-full gap-2 bg-primary hover:bg-primary/90"
              onClick={() => setPhotoModalOpen(true)}
              disabled={isPending || updating}
              data-ocid="rider_jobs.mark_delivered_button"
            >
              <CheckCircle className="h-4 w-4" />
              {updating ? "Updating..." : "Mark as Delivered"}
            </Button>
          )}
        </CardContent>
      </Card>

      <DeliveryPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onConfirm={handleDeliveryConfirm}
        isSubmitting={updating}
      />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiderJobsPage() {
  const { data: jobs, isLoading: jobsLoading } = useGetAvailableJobs();
  const { data: activeOrder, isLoading: activeLoading } =
    useGetRiderActiveOrder();
  const { mutateAsync: acceptJob, isPending } = useAcceptJob();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const displayJobs = jobs?.length ? (jobs as typeof SAMPLE_JOBS) : SAMPLE_JOBS;

  const isPaymentPending = activeOrder?.status === "paymentPending";
  const hasActive =
    activeOrder &&
    (activeOrder.status === "accepted" || activeOrder.status === "pickedUp");
  // Block new jobs if payment is pending too
  const isBlocked = !!hasActive || isPaymentPending;

  const handleAccept = async (jobId: string) => {
    setAcceptingId(jobId);
    try {
      await acceptJob(jobId);
      toast.success("Job accepted! Head to the pickup location. 🚲");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not accept job.";
      toast.error(msg);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-3xl"
      data-ocid="rider_jobs.page"
    >
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Available Jobs
        </h1>
        <p className="text-muted-foreground mt-1">
          {isPaymentPending
            ? "Waiting for customer payment on your locked order"
            : hasActive
              ? "You have an active delivery"
              : `${displayJobs.length} parcels waiting near you`}
        </p>
      </div>

      {/* Payment pending state */}
      {!activeLoading && isPaymentPending && activeOrder && (
        <PaymentPendingCard order={activeOrder} />
      )}

      {/* Active order — shown when truly accepted/pickedUp */}
      {!activeLoading && hasActive && <ActiveOrderCard order={activeOrder} />}
      {activeLoading && <Skeleton className="h-48 w-full rounded-xl mb-6" />}

      {/* Job list header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">
          Refreshing every 15 seconds
        </span>
      </div>

      {isBlocked && (
        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-4 py-3 mb-4 text-sm text-muted-foreground">
          <Bike className="h-4 w-4 text-primary shrink-0" />
          <p>
            {isPaymentPending
              ? "Complete your pending payment before accepting a new job."
              : "Complete your current delivery before accepting a new job."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4" data-ocid="rider_jobs.jobs_list">
        {jobsLoading ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-16" data-ocid="rider_jobs.empty_state">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">
              No jobs available right now
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              New jobs will appear here automatically. Stay online to be first!
            </p>
          </div>
        ) : (
          displayJobs.map((job, i) => (
            <Card
              key={job.id}
              className="hover:shadow-md transition-all hover:border-primary/30"
              data-ocid={`rider_jobs.job.item.${i + 1}`}
            >
              <CardContent className="pt-5 pb-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground">
                        {job.packageDescription}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.packageWeight}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-xl text-primary">
                      {formatPayout(job.riderPayout)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      your 75% payout
                    </p>
                    <p className="text-xs text-muted-foreground line-through opacity-60">
                      {formatPayout(job.deliveryFee)} total
                    </p>
                  </div>
                </div>

                {/* Addresses */}
                <div className="flex flex-col gap-1.5 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Pickup ·{" "}
                      </span>
                      <span className="text-foreground">
                        {job.pickupAddress}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Deliver to ·{" "}
                      </span>
                      <span className="text-foreground">
                        {job.deliveryAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center flex-wrap gap-2 mb-4">
                  {job.estimatedTime && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" /> {job.estimatedTime}
                    </Badge>
                  )}
                  {"distance" in job && job.distance && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Bike className="h-3 w-3" /> {job.distance}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 text-primary"
                  >
                    <Leaf className="h-3 w-3" /> Eco Delivery
                  </Badge>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => handleAccept(job.id)}
                  disabled={(isPending && acceptingId === job.id) || isBlocked}
                  data-ocid={`rider_jobs.accept.item.${i + 1}`}
                >
                  {isPending && acceptingId === job.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing payment...
                    </>
                  ) : isPaymentPending ? (
                    "Waiting for payment — order locked"
                  ) : isBlocked ? (
                    "Finish current delivery first"
                  ) : (
                    <>
                      Accept Job <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
