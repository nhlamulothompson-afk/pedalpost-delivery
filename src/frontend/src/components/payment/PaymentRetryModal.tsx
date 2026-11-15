import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateCheckoutSession } from "../../hooks/useQueries";
import { formatZAR } from "../../types";

interface PaymentRetryModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amount: bigint;
  errorReason?: string;
}

export function PaymentRetryModal({
  open,
  onClose,
  orderId,
  amount,
  errorReason,
}: PaymentRetryModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const createCheckout = useCreateCheckoutSession();

  const handleRetry = async () => {
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
        window.location.href = checkoutUrl;
      } else {
        toast.error("Could not create payment session. Please try again.");
        setIsRedirecting(false);
      }
    } catch {
      toast.error("Payment session failed. Please try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-ocid="payment_retry.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Payment Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Amount */}
          <div className="bg-muted/40 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Amount to charge
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              {formatZAR(amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You will only be charged once — via secure Stripe checkout
            </p>
          </div>

          {/* Error reason */}
          {errorReason && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{errorReason}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p className="flex items-start gap-1.5">
              <span className="text-primary font-bold mt-0.5">•</span>
              Your order is locked to your assigned rider
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-primary font-bold mt-0.5">•</span>
              Enter a different card if the previous one was declined
            </p>
            <p className="flex items-start gap-1.5">
              <span className="text-primary font-bold mt-0.5">•</span>
              You will return here automatically after payment
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full gap-2"
              onClick={handleRetry}
              disabled={isRedirecting || createCheckout.isPending}
              data-ocid="payment_retry.confirm_button"
            >
              {isRedirecting || createCheckout.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay {formatZAR(amount)} Now
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
              disabled={isRedirecting}
              data-ocid="payment_retry.cancel_button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
