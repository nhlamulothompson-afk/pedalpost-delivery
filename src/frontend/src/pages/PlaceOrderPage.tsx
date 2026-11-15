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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Info,
  Leaf,
  MapPin,
  Package,
  Scale,
  Shield,
  Tag,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useApplyPromoCode,
  useCreateCheckoutSession,
  usePlaceOrder,
} from "../hooks/useQueries";

const WEIGHT_OPTIONS = [
  { value: "0-0.5kg", label: "Tiny (0–0.5 kg) — Letter, docs" },
  { value: "0.5-2kg", label: "Small (0.5–2 kg) — Books, gifts" },
  { value: "2-5kg", label: "Medium (2–5 kg) — Shoes, clothes" },
  { value: "5-10kg", label: "Large (5–10 kg) — Electronics" },
];

const FEE_ESTIMATE: Record<string, string> = {
  "0-0.5kg": "25.00",
  "0.5-2kg": "40.00",
  "2-5kg": "65.00",
  "5-10kg": "90.00",
};

type PromoState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "applied"; code: string; discountCents: number };

export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const { mutateAsync: placeOrder, isPending } = usePlaceOrder();
  const applyPromo = useApplyPromoCode();
  const createCheckout = useCreateCheckoutSession();

  const [form, setForm] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    packageDescription: "",
    packageWeight: "0-0.5kg",
  });
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoState, setPromoState] = useState<PromoState>({ status: "idle" });
  // Placed order id — needed for promo + checkout
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const fee = FEE_ESTIMATE[form.packageWeight] ?? "25.00";
  const baseFee = Number.parseFloat(fee);
  const platformFee = (baseFee * 0.25).toFixed(2);

  const discount =
    promoState.status === "applied" ? promoState.discountCents / 100 : 0;
  const discountedBase = Math.max(0, baseFee - discount);
  const finalPlatformFee = (discountedBase * 0.25).toFixed(2);
  const finalTotal = (
    discountedBase + Number.parseFloat(finalPlatformFee)
  ).toFixed(2);

  const ensureOrderPlaced = async (): Promise<string | null> => {
    if (pendingOrderId) return pendingOrderId;
    if (!form.pickupAddress.trim() || !form.deliveryAddress.trim()) {
      toast.error("Please fill in both addresses.");
      return null;
    }
    if (!form.packageDescription.trim()) {
      toast.error("Please describe your package.");
      return null;
    }
    try {
      const result = await placeOrder({
        ...form,
        deliveryFee: BigInt(Math.round(baseFee * 100)),
      });
      const orderId =
        (result as unknown as { id: string }).id ??
        (result as unknown as string);
      setPendingOrderId(orderId);
      return orderId;
    } catch {
      return null;
    }
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    let orderId = pendingOrderId;
    if (!orderId) {
      if (!form.pickupAddress.trim() || !form.deliveryAddress.trim()) {
        setPromoState({
          status: "error",
          message: "Fill in pickup and delivery addresses first.",
        });
        return;
      }
      if (!form.packageDescription.trim()) {
        setPromoState({
          status: "error",
          message: "Add a package description first.",
        });
        return;
      }
      try {
        const result = await placeOrder({
          ...form,
          deliveryFee: BigInt(Math.round(baseFee * 100)),
        });
        orderId =
          (result as unknown as { id: string }).id ??
          (result as unknown as string);
        setPendingOrderId(orderId);
      } catch {
        setPromoState({
          status: "error",
          message: "Could not create order to apply promo.",
        });
        return;
      }
    }

    try {
      const result = await applyPromo.mutateAsync({ orderId, code });
      const discountCents = Number(result as unknown as bigint);
      setPromoState({ status: "applied", code, discountCents });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid or expired promo code.";
      setPromoState({ status: "error", message });
    }
  };

  const handleRemovePromo = () => {
    setPromoState({ status: "idle" });
    setPromoInput("");
    setPendingOrderId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderId = await ensureOrderPlaced();
    if (!orderId) return;

    setIsRedirecting(true);
    try {
      const successUrl = `${window.location.origin}/customer/track/${orderId}?session_id={CHECKOUT_SESSION_ID}&payment=success`;
      const cancelUrl = `${window.location.origin}/customer/track/${orderId}?payment=cancelled`;

      const checkoutUrl = await createCheckout.mutateAsync({
        orderId,
        successUrl,
        cancelUrl,
      });

      if (checkoutUrl) {
        toast.success(
          "Redirecting to secure payment — your card will only be charged once a rider accepts your order.",
        );
        window.location.href = checkoutUrl;
      } else {
        // No Stripe configured — fall back to direct navigation
        toast.success(
          "Order placed! A rider will pick up your parcel shortly. 🚲",
        );
        navigate({ to: "/customer/orders" });
      }
    } catch {
      // Stripe not configured — proceed without payment for now
      toast.success(
        "Order placed! A rider will pick up your parcel shortly. 🚲",
      );
      navigate({ to: "/customer/orders" });
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-2xl"
      data-ocid="place_order.page"
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          New Delivery
        </h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details and a rider will be on their way.
        </p>
      </div>

      {/* Payment info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Card saved — charged only on rider acceptance
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            After placing your order you'll be taken to secure Stripe checkout
            to save your card. You will <strong>not</strong> be charged until a
            rider accepts your job.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} data-ocid="place_order.form">
        <div className="flex flex-col gap-6">
          {/* Addresses */}
          <Card data-ocid="place_order.addresses_card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pickup">Pickup address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pickup"
                    className="pl-9"
                    placeholder="123 Main St, City"
                    value={form.pickupAddress}
                    onChange={(e) =>
                      setForm({ ...form, pickupAddress: e.target.value })
                    }
                    data-ocid="place_order.pickup_address_input"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="delivery">Delivery address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-foreground" />
                  <Input
                    id="delivery"
                    className="pl-9"
                    placeholder="456 Oak Ave, City"
                    value={form.deliveryAddress}
                    onChange={(e) =>
                      setForm({ ...form, deliveryAddress: e.target.value })
                    }
                    data-ocid="place_order.delivery_address_input"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package */}
          <Card data-ocid="place_order.package_card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Package description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g. Important documents, fragile items inside..."
                  value={form.packageDescription}
                  onChange={(e) =>
                    setForm({ ...form, packageDescription: e.target.value })
                  }
                  rows={3}
                  data-ocid="place_order.description_textarea"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="weight" className="flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5" /> Package weight
                </Label>
                <Select
                  value={form.packageWeight}
                  onValueChange={(v) => setForm({ ...form, packageWeight: v })}
                  data-ocid="place_order.weight_select"
                >
                  <SelectTrigger id="weight">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fee Summary */}
          <Card
            className="bg-primary/5 border-primary/20"
            data-ocid="place_order.fee_summary_card"
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <Bike className="h-4 w-4 text-primary" />
                <span className="font-display font-semibold text-foreground text-sm">
                  Delivery estimate
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-primary gap-1"
                >
                  <Leaf className="h-3 w-3" /> Zero Emissions
                </Badge>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                {promoState.status === "applied" ? (
                  <>
                    <div className="flex justify-between text-muted-foreground line-through">
                      <span>Delivery fee</span>
                      <span>R{fee}</span>
                    </div>
                    <div className="flex justify-between text-primary font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Promo: {promoState.code}
                      </span>
                      <span>
                        −R{(promoState.discountCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Discounted fee
                      </span>
                      <span className="font-medium text-foreground">
                        R{discountedBase.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className="font-medium text-foreground">R{fee}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Platform fee
                    <Info className="h-3 w-3" />
                  </span>
                  <span className="font-medium text-foreground">
                    {promoState.status === "applied"
                      ? `R${finalPlatformFee}`
                      : `R${platformFee}`}
                  </span>
                </div>

                <Separator className="my-1" />

                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span>
                    {promoState.status === "applied"
                      ? `R${finalTotal}`
                      : `R${(baseFee + Number.parseFloat(platformFee)).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Estimated delivery: 25–45 minutes in urban areas
              </p>
            </CardContent>
          </Card>

          {/* Promo Code Section */}
          <Card data-ocid="place_order.promo_card">
            <CardContent className="pt-4 pb-4">
              {promoState.status === "applied" ? (
                <div
                  className="flex items-center justify-between animate-fade-in-up"
                  data-ocid="place_order.promo_success_state"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Code applied! You save R
                        {(promoState.discountCents / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Promo code{" "}
                        <span className="font-mono font-bold">
                          {promoState.code}
                        </span>{" "}
                        is active
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-8 px-2"
                    onClick={handleRemovePromo}
                    data-ocid="place_order.promo_remove_button"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-smooth w-full text-left"
                    onClick={() => setPromoExpanded(!promoExpanded)}
                    data-ocid="place_order.promo_toggle"
                    aria-expanded={promoExpanded}
                  >
                    <Tag className="h-4 w-4" />
                    Have a promo code?
                    <ChevronDown
                      className={`h-4 w-4 ml-auto transition-transform duration-200 ${promoExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {promoExpanded && (
                    <div className="mt-3 flex flex-col gap-2 animate-fade-in-up">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code (e.g. WELCOME10)"
                          value={promoInput}
                          onChange={(e) =>
                            setPromoInput(e.target.value.toUpperCase())
                          }
                          className="font-mono tracking-wider"
                          data-ocid="place_order.promo_code_input"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
                          onClick={handleApplyPromo}
                          disabled={
                            !promoInput.trim() ||
                            applyPromo.isPending ||
                            isPending
                          }
                          data-ocid="place_order.promo_apply_button"
                        >
                          {applyPromo.isPending ? "Applying…" : "Apply"}
                        </Button>
                      </div>

                      {promoState.status === "error" && (
                        <div
                          className="flex items-center gap-2 text-destructive text-xs animate-fade-in-up"
                          data-ocid="place_order.promo_error_state"
                        >
                          <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          {promoState.message}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full font-display font-semibold gap-2"
            disabled={isPending || isRedirecting || createCheckout.isPending}
            data-ocid="place_order.submit_button"
          >
            {isPending ? (
              "Placing order..."
            ) : isRedirecting || createCheckout.isPending ? (
              "Redirecting to payment..."
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Place Order & Save Card
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
