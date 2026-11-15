import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Leaf, X } from "lucide-react";
import { useState } from "react";
import { SiFacebook, SiWhatsapp, SiX } from "react-icons/si";
import { toast } from "sonner";
import {
  useGetUserReferralLink,
  useRecordShareEvent,
} from "../../hooks/useQueries";

interface SocialShareModalProps {
  open: boolean;
  onClose: () => void;
  riderName: string;
  deliveryTimeMinutes: number;
  vehicleType?: "bicycle" | "electricWheel" | string;
}

const PLATFORMS = [
  {
    key: "twitter",
    label: "Twitter",
    Icon: SiX,
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: SiWhatsapp,
    getUrl: (text: string, url: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: SiFacebook,
    getUrl: (_text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
] as const;

function getVehicleLabel(vehicleType: string): string {
  if (vehicleType === "electricWheel") return "electric wheel";
  return "bicycle";
}

export function SocialShareModal({
  open,
  onClose,
  riderName,
  deliveryTimeMinutes,
  vehicleType = "bicycle",
}: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);

  const { data: referralLink } = useGetUserReferralLink();
  const shareMutation = useRecordShareEvent();

  const vehicleLabel = getVehicleLabel(vehicleType);
  const timeLabel =
    deliveryTimeMinutes < 60
      ? `${deliveryTimeMinutes} min`
      : `${Math.floor(deliveryTimeMinutes / 60)}h ${deliveryTimeMinutes % 60}min`;

  const shareText = `Just got my parcel delivered by ${riderName} in ${timeLabel} on a ${vehicleLabel} — zero emissions! Try PedalPost:`;
  const shareUrl = referralLink ?? window.location.origin;
  const fullMessage = `${shareText} ${shareUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async (platform: string) => {
    try {
      await shareMutation.mutateAsync({ platform });
    } catch {
      // Non-blocking — don't prevent share if recording fails
    }
    const found = PLATFORMS.find((p) => p.key === platform);
    if (found) {
      const url = found.getUrl(shareText, shareUrl);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="social_share.dialog">
        {/* Custom close */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7 text-muted-foreground"
          onClick={onClose}
          data-ocid="social_share.close_button"
          aria-label="Close share modal"
        >
          <X className="h-4 w-4" />
        </Button>

        <DialogHeader className="pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl">
              Delivery Complete! 🎉
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Your parcel arrived safely. Spread the eco-love — share your
            experience and earn referral credits!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Pre-filled share message */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Share message
            </p>
            <Textarea
              readOnly
              value={fullMessage}
              className="text-sm text-foreground bg-muted/40 border-border resize-none h-24 font-body leading-relaxed"
              data-ocid="social_share.message_textarea"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <Button
              variant="outline"
              className="w-full transition-smooth"
              onClick={handleCopy}
              data-ocid="social_share.copy_button"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Message
                </>
              )}
            </Button>
          </div>

          {/* Social share buttons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Share on social media
            </p>
            <div className="flex gap-3">
              {PLATFORMS.map(({ key, label, Icon }) => (
                <Button
                  key={key}
                  variant="outline"
                  className="flex-1 flex items-center gap-2 transition-smooth hover:border-primary/50 hover:text-primary"
                  onClick={() => handleShare(key)}
                  data-ocid={`social_share.${key}_button`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Eco badge + dismiss */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Leaf className="h-3.5 w-3.5 text-primary" />
              <span>
                Zero emissions delivery · Powered by bicycles &amp; electric
                wheels
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={onClose}
              data-ocid="social_share.dismiss_button"
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
