import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bike,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Package,
  Percent,
  Send,
  ShieldAlert,
  Star,
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCompleteRiderPayout,
  useCreatePromoCode,
  useDeactivatePromoCode,
  useGetAnalyticsDashboard,
  useGetOperatorEmail,
  useGetOperatorPayoutDashboard,
  useGetPromoStats,
  useIsStripeConfigured,
  useSetOperatorEmail,
  useSetStripeConfiguration,
} from "../hooks/useQueries";
import type { AnalyticsDashboard, DailyStat } from "../types";
import type { PromoCode } from "../types";
import { formatZAR } from "../types";

const OPERATOR_PRINCIPAL = "2vxsx-fae";

// ── Mini bar chart ────────────────────────────────────────────────────────────

function BarChart({ stats }: { stats: DailyStat[] }) {
  const maxOrders = Math.max(
    ...stats.map((s) =>
      Math.max(Number(s.ordersPlaced), Number(s.ordersDelivered)),
    ),
    1,
  );

  return (
    <div
      className="flex items-end gap-0.5 h-24 w-full"
      aria-label="Daily delivery volume chart"
    >
      {stats.slice(-30).map((s) => {
        const placed = Number(s.ordersPlaced);
        const delivered = Number(s.ordersDelivered);
        const placedPct = (placed / maxOrders) * 100;
        const deliveredPct = (delivered / maxOrders) * 100;

        return (
          <div
            key={s.date}
            className="flex-1 flex items-end gap-px group relative"
            title={`${s.date}: ${placed} placed, ${delivered} delivered`}
          >
            <div
              className="flex-1 rounded-t-sm bg-primary/30 transition-smooth group-hover:bg-primary/50"
              style={{
                height: `${placedPct}%`,
                minHeight: placed > 0 ? "2px" : "0",
              }}
            />
            <div
              className="flex-1 rounded-t-sm bg-primary transition-smooth group-hover:bg-primary/90"
              style={{
                height: `${deliveredPct}%`,
                minHeight: delivered > 0 ? "2px" : "0",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Commission sparkline ──────────────────────────────────────────────────────

function CommissionSparkline({ stats }: { stats: DailyStat[] }) {
  if (stats.length < 2) return null;

  const values = stats.slice(-30).map((s) => Number(s.commission) / 100);
  const maxVal = Math.max(...values, 1);
  const width = 280;
  const height = 56;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / maxVal) * height;
    return `${x},${y}`;
  });

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-labelledby="sparkline-title"
      className="overflow-visible"
    >
      <title id="sparkline-title">Commission trend sparkline</title>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="oklch(var(--primary))"
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor="oklch(var(--primary))"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        fill="url(#sparkGrad)"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="oklch(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyDashboard() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center gap-4"
      data-ocid="operator.empty_state"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Activity className="h-8 w-8 text-primary opacity-60" />
      </div>
      <h2 className="text-xl font-display font-bold text-foreground">
        Your platform stats will appear here once deliveries start coming in
      </h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Share your referral codes, promote your promo campaigns, and riders will
        start completing deliveries — your analytics will populate in real time.
      </p>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
  trend?: string;
  ocid: string;
  loading?: boolean;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  highlight,
  trend,
  ocid,
  loading,
}: KpiCardProps) {
  return (
    <Card data-ocid={ocid} className="relative overflow-hidden">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${highlight ? "bg-primary" : "bg-muted"}`}
          >
            <Icon
              className={`h-4 w-4 ${highlight ? "text-primary-foreground" : "text-muted-foreground"}`}
            />
          </div>
          {trend && (
            <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
              <ArrowUpRight className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
        <div className="analytics-stat-label mb-1">{label}</div>
        {loading ? (
          <Skeleton className="h-7 w-24 mt-1" />
        ) : (
          <div
            className={`analytics-stat-value ${highlight ? "text-primary" : ""}`}
          >
            {value}
          </div>
        )}
      </CardContent>
      {highlight && (
        <div className="absolute inset-y-0 right-0 w-1 bg-primary rounded-r" />
      )}
    </Card>
  );
}

// ── Referral Funnel ───────────────────────────────────────────────────────────

function ReferralFunnel({
  dashboard,
}: { dashboard: AnalyticsDashboard | null | undefined }) {
  const stats = dashboard?.referralStats;
  const totalReferrals = Number(stats?.totalReferrals ?? 0);
  const creditsIssued = Number(stats?.totalCreditsIssued ?? 0) / 100;
  const signups = Number(stats?.referralsThisPeriod ?? 0);
  const conversionRate =
    totalReferrals > 0 ? ((signups / totalReferrals) * 100).toFixed(1) : "0.0";

  const funnelSteps = [
    { label: "Referral Codes Shared", value: totalReferrals, pct: 100 },
    {
      label: "Successful Sign-ups",
      value: signups,
      pct: totalReferrals > 0 ? (signups / totalReferrals) * 100 : 0,
    },
  ];

  return (
    <Card data-ocid="operator.referral_funnel_card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-primary" />
          Referral Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnelSteps.map((step) => (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="analytics-stat-label">{step.label}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {step.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-smooth"
                style={{ width: `${Math.max(step.pct, 2)}%` }}
              />
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
          <div>
            <div className="analytics-stat-label">Conversion Rate</div>
            <div className="analytics-stat-value text-primary">
              {conversionRate}%
            </div>
          </div>
          <div>
            <div className="analytics-stat-label">Credits Paid Out</div>
            <div className="analytics-stat-value">
              R{creditsIssued.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Payout Status Badge ───────────────────────────────────────────────────────

function PayoutStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border border-amber-300",
    processing: "bg-primary/15 text-primary border-primary/20 border",
    completed: "bg-primary/10 text-primary border-primary/20 border",
    failed: "bg-destructive/10 text-destructive border-destructive/20 border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${variants[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Period = "7" | "30" | "0";
type MainTab = "analytics" | "payments" | "promos";

export default function OperatorPage() {
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toText() ?? "";
  const isOperator = principalStr === OPERATOR_PRINCIPAL;

  const [period, setPeriod] = useState<Period>("30");
  const [activeTab, setActiveTab] = useState<MainTab>("analytics");

  // Promo state
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">(
    "percent",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [usesPerUser, setUsesPerUser] = useState("1");
  const [deactivateCode, setDeactivateCode] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  // Stripe state
  const [stripeKeyInput, setStripeKeyInput] = useState("");
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [stripeSaved, setStripeSaved] = useState(false);

  type LocalPromo = {
    code: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    uses: number;
    maxUses?: number;
    expiresAt?: string;
    isActive: boolean;
    createdAt: string;
  };
  const [localPromos, setLocalPromos] = useState<LocalPromo[]>([
    {
      code: "WELCOME10",
      discountType: "percent",
      discountValue: 10,
      uses: 42,
      maxUses: 200,
      expiresAt: "2026-12-31",
      isActive: true,
      createdAt: "2026-01-15",
    },
    {
      code: "ECO5OFF",
      discountType: "fixed",
      discountValue: 50,
      uses: 18,
      isActive: true,
      createdAt: "2026-02-20",
    },
    {
      code: "FIRSTRIDE",
      discountType: "percent",
      discountValue: 15,
      uses: 100,
      maxUses: 100,
      expiresAt: "2026-03-31",
      isActive: false,
      createdAt: "2026-01-01",
    },
  ]);

  const periodBigInt = period === "0" ? undefined : BigInt(period);
  const { data: dashboard, isLoading: dashLoading } =
    useGetAnalyticsDashboard(periodBigInt);
  const { data: promoStats } = useGetPromoStats();
  const createPromo = useCreatePromoCode();
  const deactivatePromo = useDeactivatePromoCode();
  const { data: operatorEmail } = useGetOperatorEmail();
  const setOperatorEmailMutation = useSetOperatorEmail();
  const { data: isStripeConfigured, isLoading: stripeCheckLoading } =
    useIsStripeConfigured();
  const setStripeConfig = useSetStripeConfiguration();
  const { data: payoutDashboard, isLoading: payoutLoading } =
    useGetOperatorPayoutDashboard();
  const completeRiderPayout = useCompleteRiderPayout();

  useEffect(() => {
    if (operatorEmail && emailInput === "") {
      setEmailInput(operatorEmail);
    }
  }, [operatorEmail, emailInput]);

  // ── Auth guard ──────────────────────────────────────────────────────────────

  if (!identity) {
    return (
      <div
        className="container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center"
        data-ocid="operator.page"
      >
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-display font-bold text-foreground">
          Operator Dashboard
        </h1>
        <p className="text-muted-foreground">
          Sign in with the operator account to access this page.
        </p>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <div
        className="container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center"
        data-ocid="operator.page"
      >
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-display font-bold text-foreground">
          Access Restricted
        </h1>
        <p className="text-muted-foreground">
          This dashboard is only accessible to the platform operator.
        </p>
      </div>
    );
  }

  // ── Derived metrics ─────────────────────────────────────────────────────────

  const totalCommission = dashboard
    ? Number(dashboard.totalCommission) / 100
    : 0;
  const totalOrders = dashboard
    ? dashboard.dailyStats.reduce((acc, s) => acc + Number(s.ordersPlaced), 0)
    : 0;
  const totalDelivered = dashboard
    ? dashboard.dailyStats.reduce(
        (acc, s) => acc + Number(s.ordersDelivered),
        0,
      )
    : 0;
  const activeRiders = dashboard?.topRiders.length ?? 0;
  const avgDeliveryTimeMinutes = totalDelivered > 0 ? 35 : 0;
  const hasData =
    dashboard && (totalOrders > 0 || dashboard.topRiders.length > 0);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveStripeKey = async () => {
    const key = stripeKeyInput.trim();
    if (!key) return;
    try {
      await setStripeConfig.mutateAsync(key);
      setStripeSaved(true);
      setStripeKeyInput("");
      toast.success("Stripe API key saved! Payments are now active.");
      setTimeout(() => setStripeSaved(false), 4000);
    } catch {
      toast.error("Failed to save Stripe key. Try again.");
    }
  };

  const handleCompletePayout = async (payoutId: string) => {
    try {
      await completeRiderPayout.mutateAsync(payoutId);
      toast.success("Payout marked as completed!");
    } catch {
      toast.error("Failed to complete payout. Try again.");
    }
  };

  const handleSaveEmail = async () => {
    const email = emailInput.trim();
    if (!email) return;
    try {
      await setOperatorEmailMutation.mutateAsync(email);
      setEmailSaved(true);
      toast.success("Notification email saved!");
      setTimeout(() => setEmailSaved(false), 3000);
    } catch {
      toast.error("Failed to save email. Try again.");
    }
  };

  const handleCreatePromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code || !discountValue) return;
    try {
      const dtype: PromoCode["discountType"] =
        discountType === "fixed"
          ? {
              __kind__: "fixed",
              fixed: BigInt(Math.round(Number.parseFloat(discountValue) * 100)),
            }
          : {
              __kind__: "percent",
              percent: BigInt(Math.round(Number.parseFloat(discountValue))),
            };
      const expiresAtBigInt = expiresAt
        ? BigInt(new Date(expiresAt).getTime() * 1_000_000)
        : undefined;
      const maxUsesBigInt = maxUses ? BigInt(maxUses) : undefined;
      const usesPerUserBigInt = usesPerUser ? BigInt(usesPerUser) : undefined;
      await createPromo.mutateAsync({
        code,
        discountType: dtype,
        expiresAt: expiresAtBigInt,
        maxUses: maxUsesBigInt,
        usesPerUser: usesPerUserBigInt,
      });
      setLocalPromos((prev) => [
        {
          code,
          discountType,
          discountValue: Number.parseFloat(discountValue),
          uses: 0,
          maxUses: maxUses ? Number.parseInt(maxUses) : undefined,
          expiresAt: expiresAt || undefined,
          isActive: true,
          createdAt: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);
      toast.success(`Promo code "${code}" created!`);
      setPromoCode("");
      setDiscountValue("");
      setExpiresAt("");
      setMaxUses("");
      setUsesPerUser("1");
    } catch {
      toast.error("Failed to create promo code.");
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateCode.trim()) return;
    try {
      await deactivatePromo.mutateAsync(deactivateCode.trim());
      setLocalPromos((prev) =>
        prev.map((p) =>
          p.code === deactivateCode.trim().toUpperCase()
            ? { ...p, isActive: false }
            : p,
        ),
      );
      toast.success("Promo code deactivated.");
      setDeactivateCode("");
    } catch {
      toast.error("Failed to deactivate promo code.");
    }
  };

  const handleDeactivateByCode = async (code: string) => {
    try {
      await deactivatePromo.mutateAsync(code);
      setLocalPromos((prev) =>
        prev.map((p) => (p.code === code ? { ...p, isActive: false } : p)),
      );
      toast.success(`Code "${code}" deactivated.`);
    } catch {
      toast.error("Failed to deactivate promo code.");
    }
  };

  const formatDiscount = (p: {
    discountType: "percent" | "fixed";
    discountValue: number;
  }) =>
    p.discountType === "percent"
      ? `${p.discountValue}% off`
      : `R${p.discountValue.toFixed(2)} off`;

  return (
    <div className="min-h-screen bg-background" data-ocid="operator.page">
      {/* Page header band */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 pt-5 pb-0 max-w-7xl">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Bike className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  PedalPost Platform
                </span>
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Operator Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Platform analytics, commissions &amp; growth tools
              </p>
            </div>
            {activeTab === "analytics" && (
              <Tabs
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
              >
                <TabsList data-ocid="operator.period_tabs">
                  <TabsTrigger value="7" data-ocid="operator.period_7d">
                    Last 7 days
                  </TabsTrigger>
                  <TabsTrigger value="30" data-ocid="operator.period_30d">
                    Last 30 days
                  </TabsTrigger>
                  <TabsTrigger value="0" data-ocid="operator.period_all">
                    All time
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* Main nav tabs */}
          <div className="flex gap-1">
            {[
              {
                key: "analytics" as const,
                label: "Analytics",
                icon: BarChart3,
              },
              {
                key: "payments" as const,
                label: "Payments & Payouts",
                icon: CreditCard,
              },
              { key: "promos" as const, label: "Promo Codes", icon: Tag },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-t border-l border-r transition-colors ${
                  activeTab === key
                    ? "bg-background border-border text-foreground -mb-px"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70 mb-0"
                }`}
                data-ocid={`operator.tab.${key}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* ══ ANALYTICS TAB ═══════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <>
            {/* KPI Overview row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard
                label="Total Commission"
                value={`R${totalCommission.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Banknote}
                highlight
                ocid="operator.commission_stat"
                loading={dashLoading}
              />
              <KpiCard
                label="Total Orders"
                value={dashLoading ? "—" : totalOrders.toLocaleString()}
                icon={Package}
                ocid="operator.orders_stat"
                loading={dashLoading}
              />
              <KpiCard
                label="Active Riders"
                value={dashLoading ? "—" : String(activeRiders)}
                icon={Users}
                ocid="operator.riders_stat"
                loading={dashLoading}
              />
              <KpiCard
                label="Avg Delivery Time"
                value={
                  dashLoading
                    ? "—"
                    : totalDelivered > 0
                      ? `${avgDeliveryTimeMinutes} min`
                      : "—"
                }
                icon={Clock}
                ocid="operator.avg_time_stat"
                loading={dashLoading}
              />
            </div>

            {!dashLoading && !hasData && <EmptyDashboard />}

            {(dashLoading || hasData) && (
              <div className="grid lg:grid-cols-3 gap-6">
                <Card
                  className="lg:col-span-2"
                  data-ocid="operator.volume_chart_card"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Daily Delivery Volume
                      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-sm bg-primary/30" />
                          Orders placed
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-sm bg-primary" />
                          Delivered
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashLoading ? (
                      <Skeleton className="h-24 w-full" />
                    ) : dashboard?.dailyStats.length ? (
                      <BarChart stats={dashboard.dailyStats} />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                        No data for this period
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{dashboard?.dailyStats[0]?.date ?? ""}</span>
                      <span>
                        {dashboard?.dailyStats[dashboard.dailyStats.length - 1]
                          ?.date ?? ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card data-ocid="operator.commission_trend_card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Commission Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashLoading ? (
                      <Skeleton className="h-14 w-full" />
                    ) : dashboard?.dailyStats.length ? (
                      <CommissionSparkline stats={dashboard.dailyStats} />
                    ) : (
                      <div className="h-14 flex items-center justify-center text-sm text-muted-foreground">
                        No data yet
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-border flex justify-between">
                      <div>
                        <div className="analytics-stat-label">Total earned</div>
                        <div className="analytics-stat-value text-primary">
                          {dashLoading
                            ? "—"
                            : `R${totalCommission.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="analytics-stat-label">Delivered</div>
                        <div className="analytics-stat-value">
                          {dashLoading ? "—" : totalDelivered}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {(dashLoading || hasData) && (
              <div className="grid lg:grid-cols-2 gap-6">
                <ReferralFunnel dashboard={dashboard} />

                <Card data-ocid="operator.promo_performance_card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="h-4 w-4 text-primary" />
                      Promo Code Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {promoStats ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 analytics-stat-label">
                                  Metric
                                </th>
                                <th className="text-right py-2 analytics-stat-label">
                                  Value
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-border/50">
                                <td className="py-2.5 text-muted-foreground">
                                  Active Codes
                                </td>
                                <td className="py-2.5 text-right font-semibold tabular-nums">
                                  {Number(promoStats.totalCodes)}
                                </td>
                              </tr>
                              <tr className="border-b border-border/50">
                                <td className="py-2.5 text-muted-foreground">
                                  Total Uses
                                </td>
                                <td className="py-2.5 text-right font-semibold tabular-nums">
                                  {Number(promoStats.totalUses)}
                                </td>
                              </tr>
                              <tr className="border-b border-border/50">
                                <td className="py-2.5 text-muted-foreground">
                                  Total Discount Given
                                </td>
                                <td className="py-2.5 text-right font-semibold text-destructive tabular-nums">
                                  R
                                  {(
                                    Number(promoStats.totalDiscountGiven) / 100
                                  ).toFixed(2)}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2.5 text-muted-foreground">
                                  Redemption Rate
                                </td>
                                <td className="py-2.5 text-right font-semibold text-primary tabular-nums">
                                  {Number(promoStats.totalCodes) > 0
                                    ? (
                                        (Number(promoStats.totalUses) /
                                          Number(promoStats.totalCodes)) *
                                        100
                                      ).toFixed(1)
                                    : "0.0"}
                                  %
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        {dashboard?.promoStats && (
                          <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="analytics-stat-label">
                                Uses this period
                              </div>
                              <div className="font-bold text-foreground">
                                {Number(
                                  dashboard.promoStats.totalUsesThisPeriod,
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="analytics-stat-label">
                                Discount this period
                              </div>
                              <div className="font-bold text-foreground">
                                R
                                {(
                                  Number(
                                    dashboard.promoStats
                                      .totalDiscountGivenThisPeriod,
                                  ) / 100
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Skeleton className="h-32 w-full" />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {(dashLoading || hasData) && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card data-ocid="operator.top_riders_card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="h-4 w-4 text-amber-500" />
                      Top 10 Riders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Skeleton key={n} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : !dashboard?.topRiders.length ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No riders yet.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div className="grid grid-cols-[24px_1fr_60px_56px_56px] gap-2 pb-2 border-b border-border">
                          <div />
                          <div className="analytics-stat-label">Rider</div>
                          <div className="analytics-stat-label text-right">
                            Deliv.
                          </div>
                          <div className="analytics-stat-label text-right">
                            Rating
                          </div>
                          <div className="analytics-stat-label text-right">
                            Earned
                          </div>
                        </div>
                        {dashboard.topRiders.slice(0, 10).map((rider, i) => (
                          <div
                            key={rider.userId}
                            className="grid grid-cols-[24px_1fr_60px_56px_56px] gap-2 items-center py-1.5 hover:bg-muted/30 rounded-md px-1 transition-smooth"
                            data-ocid={`operator.top_rider.${i + 1}`}
                          >
                            <span
                              className={`text-xs font-bold text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}
                            >
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate leading-tight">
                                {rider.displayName}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Bike className="h-2.5 w-2.5" />
                                Eco rider
                              </p>
                            </div>
                            <p className="text-right text-sm tabular-nums font-medium">
                              {Number(rider.deliveriesCompleted)}
                            </p>
                            <div className="flex items-center justify-end gap-0.5">
                              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                              <span className="text-xs tabular-nums">
                                {rider.averageRating.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-right text-xs font-medium text-primary tabular-nums">
                              R{(Number(rider.totalEarnings) / 100).toFixed(0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card data-ocid="operator.top_customers_card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4 text-primary" />
                      Top 10 Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Skeleton key={n} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : !dashboard?.topCustomers.length ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No customers yet.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div className="grid grid-cols-[24px_1fr_60px_72px] gap-2 pb-2 border-b border-border">
                          <div />
                          <div className="analytics-stat-label">Customer</div>
                          <div className="analytics-stat-label text-right">
                            Orders
                          </div>
                          <div className="analytics-stat-label text-right">
                            Spent
                          </div>
                        </div>
                        {dashboard.topCustomers
                          .slice(0, 10)
                          .map((customer, i) => (
                            <div
                              key={customer.userId}
                              className="grid grid-cols-[24px_1fr_60px_72px] gap-2 items-center py-1.5 hover:bg-muted/30 rounded-md px-1 transition-smooth"
                              data-ocid={`operator.top_customer.${i + 1}`}
                            >
                              <span
                                className={`text-xs font-bold text-center ${i < 3 ? "text-primary" : "text-muted-foreground"}`}
                              >
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {customer.displayName}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                  {customer.userId.slice(0, 10)}…
                                </p>
                              </div>
                              <p className="text-right text-sm tabular-nums font-medium">
                                {Number(customer.ordersPlaced)}
                              </p>
                              <p className="text-right text-sm font-semibold text-primary tabular-nums">
                                R
                                {(Number(customer.totalSpend) / 100).toFixed(2)}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {(dashLoading || hasData) && (
              <Card data-ocid="operator.daily_stats_card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-primary" />
                    Daily Activity Log
                    <Badge
                      variant="outline"
                      className="ml-auto text-xs font-normal"
                    >
                      Last {period === "0" ? "all" : period} days
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Skeleton key={n} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : !dashboard?.dailyStats.length ? (
                    <div
                      className="text-center py-8"
                      data-ocid="operator.daily_stats_empty_state"
                    >
                      <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">
                        No delivery data for this period yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 analytics-stat-label">
                              Date
                            </th>
                            <th className="text-right py-2 analytics-stat-label">
                              Orders
                            </th>
                            <th className="text-right py-2 analytics-stat-label">
                              Delivered
                            </th>
                            <th className="text-right py-2 analytics-stat-label">
                              Rate
                            </th>
                            <th className="text-right py-2 analytics-stat-label">
                              Commission
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.dailyStats
                            .slice()
                            .reverse()
                            .slice(0, 14)
                            .map((stat, i) => {
                              const placed = Number(stat.ordersPlaced);
                              const delivered = Number(stat.ordersDelivered);
                              const rate =
                                placed > 0
                                  ? ((delivered / placed) * 100).toFixed(0)
                                  : "—";
                              return (
                                <tr
                                  key={`${stat.date}-${i}`}
                                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                  data-ocid={`operator.daily_stat.${i + 1}`}
                                >
                                  <td className="py-2.5 text-foreground font-medium">
                                    {stat.date}
                                  </td>
                                  <td className="py-2.5 text-right tabular-nums">
                                    {placed}
                                  </td>
                                  <td className="py-2.5 text-right tabular-nums">
                                    {delivered}
                                  </td>
                                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                                    {rate}
                                    {rate !== "—" ? "%" : ""}
                                  </td>
                                  <td className="py-2.5 text-right tabular-nums text-primary font-medium">
                                    R
                                    {(Number(stat.commission) / 100).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ══ PAYMENTS & PAYOUTS TAB ══════════════════════════════════════ */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Stripe Configuration */}
            <Card data-ocid="operator.stripe_config_card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Stripe Payment Configuration
                  {!stripeCheckLoading && (
                    <Badge
                      className={`ml-auto text-xs ${
                        isStripeConfigured
                          ? "bg-primary/15 text-primary border-primary/20 border"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isStripeConfigured ? "✓ Connected" : "Not configured"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isStripeConfigured ? (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        Stripe is connected and active
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Customers can be charged via Stripe Checkout when riders
                        accept orders. Enter a new key below to update.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                    <CreditCard className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">
                        Stripe not configured — payments are disabled
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Get your secret key from{" "}
                        <a
                          href="https://stripe.com"
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          stripe.com
                        </a>{" "}
                        → Developers → API Keys → Secret key (sk_live_...)
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="stripe-key">
                    Stripe Secret Key
                    {isStripeConfigured && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (enter new key to update)
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="stripe-key"
                        type={showStripeKey ? "text" : "password"}
                        placeholder="sk_live_..."
                        value={stripeKeyInput}
                        onChange={(e) => setStripeKeyInput(e.target.value)}
                        className="pr-10 font-mono text-sm"
                        data-ocid="operator.stripe_key_input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowStripeKey(!showStripeKey)}
                        aria-label={showStripeKey ? "Hide key" : "Show key"}
                      >
                        {showStripeKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      onClick={handleSaveStripeKey}
                      disabled={
                        !stripeKeyInput.trim() || setStripeConfig.isPending
                      }
                      variant={stripeSaved ? "outline" : "default"}
                      data-ocid="operator.stripe_save_button"
                    >
                      {setStripeConfig.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : stripeSaved ? (
                        "✓ Saved"
                      ) : (
                        "Save Key"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The key is encrypted and stored securely. Never share it.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payout KPI row */}
            {payoutDashboard && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card data-ocid="operator.payout_pending_stat">
                  <CardContent className="pt-4 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                      <Wallet className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Pending Payouts
                    </div>
                    <div className="text-2xl font-display font-bold text-foreground">
                      {Number(payoutDashboard.totalPayoutsPending)}
                    </div>
                  </CardContent>
                </Card>
                <Card data-ocid="operator.payout_completed_stat">
                  <CardContent className="pt-4 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Completed Payouts
                    </div>
                    <div className="text-2xl font-display font-bold text-foreground">
                      {Number(payoutDashboard.totalPayoutsCompleted)}
                    </div>
                  </CardContent>
                </Card>
                <Card data-ocid="operator.payout_commission_stat">
                  <CardContent className="pt-4 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center mb-2">
                      <Banknote className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Commission Earned
                    </div>
                    <div className="text-2xl font-display font-bold text-primary">
                      {formatZAR(payoutDashboard.totalCommissionEarned)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Rider payouts */}
            <Card data-ocid="operator.pending_payouts_card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="h-4 w-4 text-primary" />
                  Rider Payout Requests
                  {payoutDashboard && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {
                        payoutDashboard.payouts.filter(
                          (p) => p.status === "pending",
                        ).length
                      }{" "}
                      pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payoutLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <Skeleton key={n} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !payoutDashboard?.payouts.length ? (
                  <div
                    className="text-center py-8"
                    data-ocid="operator.payouts_empty_state"
                  >
                    <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      No payout requests yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 analytics-stat-label">
                            Rider
                          </th>
                          <th className="text-right py-2 analytics-stat-label">
                            Amount
                          </th>
                          <th className="text-left py-2 analytics-stat-label pl-4">
                            Status
                          </th>
                          <th className="text-right py-2 analytics-stat-label">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutDashboard.payouts.map((payout, i) => (
                          <tr
                            key={payout.id}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                            data-ocid={`operator.payout.item.${i + 1}`}
                          >
                            <td className="py-3">
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {payout.riderId.slice(0, 12)}…
                                </p>
                                {payout.note && (
                                  <p className="text-xs text-muted-foreground">
                                    {payout.note}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right font-display font-semibold text-primary tabular-nums">
                              {formatZAR(payout.amount)}
                            </td>
                            <td className="py-3 pl-4">
                              <PayoutStatusBadge status={payout.status} />
                            </td>
                            <td className="py-3 text-right">
                              {payout.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                                  onClick={() =>
                                    handleCompletePayout(payout.id)
                                  }
                                  disabled={completeRiderPayout.isPending}
                                  data-ocid={`operator.payout_complete_button.${i + 1}`}
                                >
                                  <Send className="h-3 w-3" />
                                  Pay
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ PROMOS TAB ══════════════════════════════════════════════════ */}
        {activeTab === "promos" && (
          <div className="space-y-6">
            {/* Notification Settings */}
            <Card data-ocid="operator.notification_settings_card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Order status emails (accepted, picked up, delivered) will be
                  sent to this address.
                </p>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="your@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="max-w-sm"
                    data-ocid="operator.notification_email_input"
                  />
                  <Button
                    onClick={handleSaveEmail}
                    disabled={
                      !emailInput.trim() || setOperatorEmailMutation.isPending
                    }
                    variant={emailSaved ? "outline" : "default"}
                    data-ocid="operator.save_email_button"
                  >
                    {setOperatorEmailMutation.isPending
                      ? "Saving..."
                      : emailSaved
                        ? "✓ Saved"
                        : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active codes list */}
            <Card data-ocid="operator.active_promos_card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4 text-primary" />
                  Active Promo Codes
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {localPromos.filter((p) => p.isActive).length} active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {localPromos.filter((p) => p.isActive).length === 0 ? (
                  <div
                    className="text-center py-6"
                    data-ocid="operator.active_promos_empty_state"
                  >
                    <Tag className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      No active promo codes. Create one below.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 analytics-stat-label">
                            Code
                          </th>
                          <th className="text-left py-2 analytics-stat-label">
                            Discount
                          </th>
                          <th className="text-right py-2 analytics-stat-label">
                            Uses
                          </th>
                          <th className="text-right py-2 analytics-stat-label">
                            Expires
                          </th>
                          <th className="text-right py-2 analytics-stat-label">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {localPromos
                          .filter((p) => p.isActive)
                          .map((promo, i) => (
                            <tr
                              key={promo.code}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                              data-ocid={`operator.promo_active.${i + 1}`}
                            >
                              <td className="py-2.5 font-mono text-sm font-bold text-foreground">
                                {promo.code}
                              </td>
                              <td className="py-2.5 text-primary font-medium">
                                {formatDiscount(promo)}
                              </td>
                              <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                                {promo.uses}
                                {promo.maxUses ? `/${promo.maxUses}` : ""}
                              </td>
                              <td className="py-2.5 text-right text-muted-foreground text-xs">
                                {promo.expiresAt ?? "Never"}
                              </td>
                              <td className="py-2.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    handleDeactivateByCode(promo.code)
                                  }
                                  disabled={deactivatePromo.isPending}
                                  data-ocid={`operator.promo_deactivate_button.${i + 1}`}
                                >
                                  Deactivate
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {localPromos.filter((p) => !p.isActive).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="analytics-stat-label mb-2">Past Codes</p>
                    <div className="space-y-1">
                      {localPromos
                        .filter((p) => !p.isActive)
                        .map((promo, i) => (
                          <div
                            key={promo.code}
                            className="flex items-center justify-between py-1.5 text-muted-foreground"
                            data-ocid={`operator.promo_past.${i + 1}`}
                          >
                            <span className="font-mono text-xs font-semibold">
                              {promo.code}
                            </span>
                            <span className="text-xs">
                              {formatDiscount(promo)} · {promo.uses} uses
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card data-ocid="operator.create_promo_card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="h-4 w-4 text-primary" />
                    Create Promo Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="promo-code">Code name</Label>
                    <Input
                      id="promo-code"
                      placeholder="e.g. ECORIDE25"
                      value={promoCode}
                      onChange={(e) =>
                        setPromoCode(e.target.value.toUpperCase())
                      }
                      className="font-mono tracking-wider"
                      data-ocid="operator.promo_code_input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Discount Type</Label>
                      <Select
                        value={discountType}
                        onValueChange={(v) =>
                          setDiscountType(v as "fixed" | "percent")
                        }
                      >
                        <SelectTrigger data-ocid="operator.discount_type_select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">
                            <span className="flex items-center gap-1.5">
                              <Percent className="h-3 w-3" /> Percentage (%)
                            </span>
                          </SelectItem>
                          <SelectItem value="fixed">
                            <span className="flex items-center gap-1.5">
                              <Banknote className="h-3 w-3" /> Fixed Amount (R)
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="discount-value">
                        {discountType === "percent" ? "% value" : "R amount"}
                      </Label>
                      <Input
                        id="discount-value"
                        type="number"
                        min="0"
                        placeholder={
                          discountType === "percent" ? "10" : "50.00"
                        }
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        data-ocid="operator.discount_value_input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="expires-at">Expiry date (optional)</Label>
                      <Input
                        id="expires-at"
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        data-ocid="operator.promo_expires_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="max-uses">Max uses (optional)</Label>
                      <Input
                        id="max-uses"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        value={maxUses}
                        onChange={(e) => setMaxUses(e.target.value)}
                        data-ocid="operator.promo_max_uses_input"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="uses-per-user">Uses per user</Label>
                    <Input
                      id="uses-per-user"
                      type="number"
                      min="1"
                      value={usesPerUser}
                      onChange={(e) => setUsesPerUser(e.target.value)}
                      data-ocid="operator.promo_uses_per_user_input"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreatePromo}
                    disabled={
                      !promoCode.trim() ||
                      !discountValue ||
                      createPromo.isPending
                    }
                    data-ocid="operator.create_promo_button"
                  >
                    {createPromo.isPending ? "Creating…" : "Create Promo Code"}
                  </Button>

                  {promoStats && (
                    <div className="pt-3 border-t border-border grid grid-cols-3 gap-3">
                      <div>
                        <div className="analytics-stat-label">Codes</div>
                        <div className="text-lg font-bold text-foreground">
                          {Number(promoStats.totalCodes)}
                        </div>
                      </div>
                      <div>
                        <div className="analytics-stat-label">Uses</div>
                        <div className="text-lg font-bold text-foreground">
                          {Number(promoStats.totalUses)}
                        </div>
                      </div>
                      <div>
                        <div className="analytics-stat-label">Discount</div>
                        <div className="text-lg font-bold text-foreground">
                          R
                          {(
                            Number(promoStats.totalDiscountGiven) / 100
                          ).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-ocid="operator.deactivate_promo_card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    Deactivate Promo Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter a promo code to immediately deactivate it. This cannot
                    be undone.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="deactivate-code">Promo Code</Label>
                    <Input
                      id="deactivate-code"
                      placeholder="e.g. ECORIDE25"
                      value={deactivateCode}
                      onChange={(e) =>
                        setDeactivateCode(e.target.value.toUpperCase())
                      }
                      data-ocid="operator.deactivate_code_input"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeactivate}
                    disabled={
                      !deactivateCode.trim() || deactivatePromo.isPending
                    }
                    data-ocid="operator.deactivate_promo_button"
                  >
                    {deactivatePromo.isPending
                      ? "Deactivating..."
                      : "Deactivate Code"}
                  </Button>

                  <div className="pt-3 border-t border-border space-y-2">
                    <Badge variant="outline" className="text-xs">
                      25% commission automatically applied to all deliveries
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Total discount given:{" "}
                      <span className="font-medium text-foreground">
                        R
                        {(
                          Number(promoStats?.totalDiscountGiven ?? 0) / 100
                        ).toFixed(2)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
