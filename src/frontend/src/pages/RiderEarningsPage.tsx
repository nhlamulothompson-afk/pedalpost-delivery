import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownToLine,
  ArrowUp,
  Banknote,
  Bike,
  Calendar,
  CheckCircle2,
  Clock,
  Leaf,
  Loader2,
  Package,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetRiderOrderHistory,
  useGetRiderPayoutHistory,
  useGetUserProfile,
} from "../hooks/useQueries";
import type { VehicleType } from "../types";
import { VEHICLE_LABELS, formatZAR } from "../types";

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

const WEEKLY_EARNINGS = [
  { day: "Mon", amount: 285.0, deliveries: 4 },
  { day: "Tue", amount: 410.0, deliveries: 6 },
  { day: "Wed", amount: 227.5, deliveries: 3 },
  { day: "Thu", amount: 552.5, deliveries: 8 },
  { day: "Fri", amount: 480.0, deliveries: 7 },
  { day: "Sat", amount: 348.0, deliveries: 5 },
  { day: "Sun", amount: 185.0, deliveries: 3 },
];

const totalWeek = WEEKLY_EARNINGS.reduce((s, d) => s + d.amount, 0);
const maxDay = Math.max(...WEEKLY_EARNINGS.map((d) => d.amount));
const weeklyDeliveries = WEEKLY_EARNINGS.reduce((s, d) => s + d.deliveries, 0);

function PayoutStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border border-amber-300",
    processing: "bg-primary/15 text-primary border-primary/20 border",
    completed: "bg-primary/10 text-primary border-primary/20 border",
    failed: "bg-destructive/10 text-destructive border-destructive/20 border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

export default function RiderEarningsPage() {
  const [period, setPeriod] = useState("week");

  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const { data: orderHistory } = useGetRiderOrderHistory();
  const { data: payoutHistory, isLoading: payoutLoading } =
    useGetRiderPayoutHistory();

  const balance = Number(profile?.balance ?? 0) / 100;
  const vehicleType = profile?.vehicleType ?? "bicycle";
  const isAvailable = profile?.isAvailable ?? true;
  const totalDeliveries =
    profile?.totalDeliveries ?? orderHistory?.length ?? 36;
  const rating = profile?.rating ?? 4.9;
  const lifetimeEarnings = totalDeliveries * (totalWeek / weeklyDeliveries);

  const hasPendingPayout = payoutHistory?.some((p) => p.status === "pending");

  const stats = [
    {
      label: "This Week",
      value: `R${totalWeek.toFixed(2)}`,
      icon: Banknote,
      change: "+12% vs last week",
      highlight: true,
    },
    {
      label: "Deliveries",
      value: String(weeklyDeliveries),
      icon: Package,
      change: "this week",
      highlight: false,
    },
    {
      label: "Avg per Job",
      value: `R${(totalWeek / weeklyDeliveries).toFixed(2)}`,
      icon: TrendingUp,
      change: "per delivery",
      highlight: false,
    },
    {
      label: "Rating",
      value: `${rating > 0 ? rating.toFixed(1) : "4.9"}★`,
      icon: Star,
      change: "average score",
      highlight: false,
    },
  ];

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-4xl"
      data-ocid="rider_earnings.page"
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          My Earnings
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your income and request payouts
        </p>
      </div>

      {/* Balance card */}
      <Card
        className="mb-6 bg-primary border-none"
        data-ocid="rider_earnings.balance_card"
      >
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-primary-foreground/70 text-sm mb-1">
                Available Balance
              </p>
              {profileLoading ? (
                <Skeleton className="h-12 w-32 bg-primary-foreground/20" />
              ) : (
                <div className="font-display text-4xl font-bold text-primary-foreground">
                  R{balance.toFixed(2)}
                </div>
              )}
              <p className="text-primary-foreground/60 text-xs mt-1">
                Lifetime earnings: R{lifetimeEarnings.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-3">
              <div className="text-center">
                {hasPendingPayout ? (
                  <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-2 border border-primary-foreground/20">
                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                    <span className="text-sm text-primary-foreground">
                      Payout pending approval
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-2 border border-primary-foreground/20">
                    <Clock className="h-4 w-4 text-primary-foreground/70" />
                    <span className="text-sm text-primary-foreground/70">
                      Operator sends payouts manually
                    </span>
                  </div>
                )}
                <p className="text-xs text-primary-foreground/50 mt-1.5 max-w-[220px]">
                  When your balance is ready, the operator will transfer it to
                  your bank
                </p>
              </div>
              {profileLoading ? (
                <Skeleton className="h-5 w-28 bg-primary-foreground/20" />
              ) : (
                <div className="flex items-center gap-2">
                  <Badge
                    className={`border text-xs gap-1 ${VEHICLE_BADGE[vehicleType]}`}
                    data-ocid="rider_earnings.vehicle_badge"
                  >
                    {VEHICLE_ICONS[vehicleType]} {VEHICLE_LABELS[vehicleType]}
                  </Badge>
                  <div
                    className={`flex items-center gap-1 text-xs ${isAvailable ? "text-primary-foreground/80" : "text-primary-foreground/50"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-primary-foreground animate-pulse" : "bg-primary-foreground/30"}`}
                    />
                    {isAvailable ? "Online" : "Offline"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              data-ocid={`rider_earnings.stat.item.${i + 1}`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="font-display text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-0.5">
                  {stat.highlight && (
                    <ArrowUp className="h-3 w-3 text-primary" />
                  )}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card className="mb-6" data-ocid="rider_earnings.chart_card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">
              Earnings Overview
            </CardTitle>
            <Tabs
              value={period}
              onValueChange={setPeriod}
              data-ocid="rider_earnings.period.tab"
            >
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs h-6">
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs h-6">
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-end gap-2 h-36"
            data-ocid="rider_earnings.bar_chart"
          >
            {WEEKLY_EARNINGS.map((day) => {
              const heightPct = (day.amount / maxDay) * 100;
              return (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <span className="text-[10px] text-muted-foreground">
                    R{day.amount.toFixed(0)}
                  </span>
                  <div
                    className="w-full flex flex-col justify-end"
                    style={{ height: "80px" }}
                  >
                    <div
                      className="w-full rounded-t-md bg-primary transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card className="mb-6" data-ocid="rider_earnings.payouts_card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-primary" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {payoutLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </div>
          ) : !payoutHistory?.length ? (
            <div
              className="text-center py-8"
              data-ocid="rider_earnings.payouts_empty_state"
            >
              <ArrowDownToLine className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground mb-1">
                No payouts yet
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Once your earnings are approved by the operator, payouts will
                appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {payoutHistory.map((payout, i) => (
                <div
                  key={payout.id}
                  data-ocid={`rider_earnings.payout.item.${i + 1}`}
                >
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          payout.status === "completed"
                            ? "bg-primary/10"
                            : "bg-muted"
                        }`}
                      >
                        {payout.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {payout.note || "Rider payout"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            Number(payout.createdAt) / 1_000_000,
                          ).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PayoutStatusBadge status={payout.status} />
                      <span className="font-display font-semibold text-foreground text-sm">
                        {formatZAR(payout.amount)}
                      </span>
                    </div>
                  </div>
                  {i < payoutHistory.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>
                Payouts are sent manually by the platform operator to your
                registered bank account. Processing typically takes 1–3 business
                days once approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eco + Tips */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          className="bg-primary/5 border-primary/20"
          data-ocid="rider_earnings.eco_card"
        >
          <CardContent className="pt-5 pb-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">
                You're making a difference 🌱
              </p>
              <p className="text-xs text-muted-foreground">
                This month, your bicycle deliveries saved 14.2 kg of CO₂ vs car
                delivery.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-ocid="rider_earnings.tips_card">
          <CardContent className="pt-5 pb-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bike className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1.5">
                Get more jobs
              </p>
              <ul className="flex flex-col gap-1">
                {[
                  "Stay online during 8–10am & 5–7pm",
                  "Keep rating above 4.5",
                  "Accept jobs within 60 seconds",
                ].map((tip) => (
                  <li
                    key={tip}
                    className="text-xs text-muted-foreground flex items-start gap-1.5"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
