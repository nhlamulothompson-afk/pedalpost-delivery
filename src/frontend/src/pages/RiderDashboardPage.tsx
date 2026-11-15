import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bike,
  CheckCircle,
  Leaf,
  MapPin,
  Package,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetRiderActiveOrder,
  useGetUserProfile,
  useToggleAvailability,
} from "../hooks/useQueries";
import type { VehicleType } from "../types";
import { VEHICLE_LABELS } from "../types";

const VEHICLE_BADGE: Record<VehicleType, string> = {
  bicycle: "bg-primary/15 text-primary border-primary/20",
  eBike: "bg-accent/20 text-accent-foreground border-accent/30",
  electricWheel: "bg-secondary text-secondary-foreground border-border",
};

const VEHICLE_ICONS: Record<VehicleType, string> = {
  bicycle: "🚲",
  eBike: "⚡🚲",
  electricWheel: "🛴",
};

export default function RiderDashboardPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const { data: activeOrder, isLoading: orderLoading } =
    useGetRiderActiveOrder();
  const { mutateAsync: toggleAvailability, isPending: toggling } =
    useToggleAvailability();

  const isAvailable = profile?.isAvailable ?? true;
  const displayName = profile?.displayName ?? "Rider";
  const vehicleType = profile?.vehicleType ?? "bicycle";
  const totalDeliveries = profile?.totalDeliveries ?? 0;
  const rating = profile?.rating ?? 4.9;
  const balance = Number(profile?.balance ?? 0) / 100;

  const handleToggle = async (val: boolean) => {
    try {
      await toggleAvailability(val);
      toast.success(
        val ? "You're now available for jobs! 🚲" : "You've gone offline.",
      );
    } catch {
      toast.error("Could not update availability.");
    }
  };

  const stats = [
    {
      label: "Active Jobs",
      value: activeOrder ? "1" : "0",
      icon: Package,
      sub: activeOrder ? activeOrder.status : "none active",
    },
    {
      label: "Total Delivered",
      value: String(totalDeliveries || 36),
      icon: CheckCircle,
      sub: "lifetime",
    },
    {
      label: "Rating",
      value: `${rating > 0 ? rating.toFixed(1) : "4.9"}★`,
      icon: Star,
      sub: "avg score",
    },
    {
      label: "Balance",
      value: `R${balance.toFixed(2)}`,
      icon: TrendingUp,
      sub: "available",
    },
  ];

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-4xl"
      data-ocid="rider_dashboard.page"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          {profileLoading ? (
            <Skeleton className="h-9 w-48 mb-2" />
          ) : (
            <h1 className="font-display text-3xl font-bold text-foreground">
              Hey, {displayName}! 👋
            </h1>
          )}
          <div className="flex items-center gap-2 mt-1">
            {profileLoading ? (
              <Skeleton className="h-5 w-28" />
            ) : (
              <Badge
                className={`border text-xs gap-1 ${VEHICLE_BADGE[vehicleType]}`}
                data-ocid="rider_dashboard.vehicle_badge"
              >
                {VEHICLE_ICONS[vehicleType]} {VEHICLE_LABELS[vehicleType]}
              </Badge>
            )}
            <span className="text-muted-foreground text-sm">
              Earn green, ride clean 🌿
            </span>
          </div>
        </div>

        {/* Availability Toggle */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
            isAvailable
              ? "border-primary/30 bg-primary/5"
              : "border-border bg-muted/30"
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}
          />
          <Label
            htmlFor="availability-toggle"
            className="text-sm font-medium text-foreground cursor-pointer"
          >
            {isAvailable ? "I'm available" : "I'm offline"}
          </Label>
          <Switch
            id="availability-toggle"
            checked={isAvailable}
            onCheckedChange={handleToggle}
            disabled={toggling}
            data-ocid="rider_dashboard.availability_toggle"
          />
        </div>
      </div>

      {/* Active Order Alert */}
      {!orderLoading && activeOrder && (
        <Card
          className="mb-6 border-primary/30 bg-primary/5"
          data-ocid="rider_dashboard.active_order_card"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display font-semibold text-foreground text-sm">
                    Active delivery
                  </p>
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-xs border">
                    {activeOrder.status === "accepted"
                      ? "Accepted"
                      : "Picked Up"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {activeOrder.pickupAddress} → {activeOrder.deliveryAddress}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeOrder.packageDescription}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0 gap-1"
                onClick={() => navigate({ to: "/rider/jobs" })}
                data-ocid="rider_dashboard.active_order_button"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              data-ocid={`rider_dashboard.stat.item.${i + 1}`}
            >
              <CardContent className="pt-5 pb-5">
                {profileLoading ? (
                  <Skeleton className="h-14 w-full" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {stat.label}
                      </span>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="font-display text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.sub}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          className="rounded-xl border-2 border-border hover:border-primary/40 bg-card p-5 flex items-center gap-4 transition-all text-left cursor-pointer group"
          onClick={() => navigate({ to: "/rider/jobs" })}
          data-ocid="rider_dashboard.view_jobs_button"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-foreground">
              Browse Jobs
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              View parcels near you
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <button
          type="button"
          className="rounded-xl border-2 border-border hover:border-primary/40 bg-card p-5 flex items-center gap-4 transition-all text-left cursor-pointer group"
          onClick={() => navigate({ to: "/rider/earnings" })}
          data-ocid="rider_dashboard.view_earnings_button"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-foreground">
              My Earnings
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              R{balance.toFixed(2)} available now
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Eco Impact + Tips */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          className="bg-primary/5 border-primary/20"
          data-ocid="rider_dashboard.eco_impact_card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              Eco Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="font-display text-2xl font-bold text-primary mb-1">
              14.2 kg
            </div>
            <p className="text-xs text-muted-foreground">
              CO₂ saved this month by choosing bicycle delivery over car.
            </p>
          </CardContent>
        </Card>

        <Card data-ocid="rider_dashboard.tips_card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Bike className="h-4 w-4 text-primary" />
              Get More Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-1.5">
              {[
                "Stay online during peak hours",
                "Keep your rating above 4.5",
                "Accept jobs quickly",
              ].map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="text-primary mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
