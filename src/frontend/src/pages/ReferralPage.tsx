import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Gift,
  Share2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { SiFacebook, SiInstagram, SiWhatsapp, SiX } from "react-icons/si";
import { toast } from "sonner";
import {
  useGetMyCreditBalance,
  useGetMyReferralCode,
  useGetMyReferralHistory,
  useGetMyShareCount,
  useGetUserReferralLink,
  useRecordShareEvent,
  useRedeemReferralCode,
} from "../hooks/useQueries";

const SHARE_PLATFORMS = [
  {
    key: "twitter",
    label: "Twitter",
    Icon: SiX,
    color: "hover:text-foreground",
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: SiWhatsapp,
    color: "hover:text-[oklch(0.6_0.18_145)]",
    getUrl: (text: string, url: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: SiFacebook,
    color: "hover:text-[oklch(0.52_0.2_270)]",
    getUrl: (_text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: SiInstagram,
    color: "hover:text-[oklch(0.62_0.22_25)]",
    getUrl: (text: string, url: string) =>
      `https://www.instagram.com/?url=${encodeURIComponent(url)}&caption=${encodeURIComponent(text)}`,
  },
] as const;

export default function ReferralPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [redeemCode, setRedeemCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = useGetMyReferralCode();
  const { data: referralLink } = useGetUserReferralLink();
  const { data: creditBalance } = useGetMyCreditBalance();
  const { data: history, isLoading: historyLoading } =
    useGetMyReferralHistory();
  const { data: shareCount } = useGetMyShareCount();
  const redeemMutation = useRedeemReferralCode();
  const shareMutation = useRecordShareEvent();

  if (!identity) {
    return (
      <div
        className="container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center"
        data-ocid="referral.page"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Refer &amp; Earn
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Sign in to access your referral code and start earning credits for
          every friend you invite.
        </p>
        <Button
          onClick={() => navigate({ to: "/" })}
          data-ocid="referral.sign_in_button"
        >
          Sign In to Continue
        </Button>
      </div>
    );
  }

  const handleCopyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCodeCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = async (platform: string) => {
    await shareMutation.mutateAsync({ platform });
    const shareText = `Join PedalPost — eco-friendly delivery using only bicycles & electric wheels. Use my code: ${referralCode}`;
    const shareUrl = referralLink ?? window.location.href;
    const found = SHARE_PLATFORMS.find((p) => p.key === platform);
    if (found) {
      const url = found.getUrl(shareText, shareUrl);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    try {
      const success = await redeemMutation.mutateAsync(redeemCode.trim());
      if (success) {
        toast.success(
          "Referral code redeemed! R50 credits added to your account.",
        );
        setRedeemCode("");
      } else {
        toast.error("Invalid or already used referral code.");
      }
    } catch {
      toast.error("Failed to redeem code. Please try again.");
    }
  };

  const creditsDisplay =
    creditBalance !== undefined
      ? `R${(Number(creditBalance) / 100).toFixed(2)}`
      : "R0.00";

  const totalCreditsEarned = history
    ? history.reduce((sum, r) => sum + Number(r.creditAmount), 0)
    : 0;

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up"
      data-ocid="referral.page"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Refer &amp; Earn
          </h1>
        </div>
        <p className="text-muted-foreground ml-13 pl-1">
          Share PedalPost with friends — when they sign up and complete their
          first delivery,{" "}
          <span className="text-primary font-semibold">
            you both earn R50 credit
          </span>
          .
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="border-primary/20" data-ocid="referral.credits_card">
          <CardContent className="pt-5 pb-4">
            <div className="analytics-stat-label mb-1">Credit Balance</div>
            <div className="analytics-stat-value text-primary">
              {creditsDisplay}
            </div>
          </CardContent>
        </Card>
        <Card data-ocid="referral.referrals_card">
          <CardContent className="pt-5 pb-4">
            <div className="analytics-stat-label mb-1">Total Referrals</div>
            <div className="analytics-stat-value">{history?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card data-ocid="referral.total_credits_card">
          <CardContent className="pt-5 pb-4">
            <div className="analytics-stat-label mb-1">Credits Earned</div>
            <div className="analytics-stat-value text-primary">
              R{(totalCreditsEarned / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card data-ocid="referral.shares_card">
          <CardContent className="pt-5 pb-4">
            <div className="analytics-stat-label mb-1">Times Shared</div>
            <div className="analytics-stat-value">
              {shareCount !== undefined ? Number(shareCount) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Your referral code */}
        <Card className="border-primary/20" data-ocid="referral.code_card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-primary" />
              Your Referral Code
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Share your unique code — you both earn R50 when they complete
              their first delivery
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {codeLoading ? (
              <Skeleton className="h-14 w-full rounded-lg" />
            ) : (
              <button
                type="button"
                className="referral-code-display w-full text-center text-xl tracking-[0.3em] font-bold text-foreground select-all cursor-pointer border-primary/30 bg-primary/5"
                data-ocid="referral.code_display"
                onClick={handleCopyCode}
                title="Click to copy"
              >
                {referralCode ?? "Loading..."}
              </button>
            )}

            <Button
              className="w-full transition-smooth"
              onClick={handleCopyCode}
              data-ocid="referral.copy_code_button"
            >
              <Copy className="h-4 w-4 mr-2" />
              {codeCopied ? "Copied!" : "Copy Code"}
            </Button>

            <Button
              variant="outline"
              className="w-full transition-smooth"
              onClick={handleCopyLink}
              data-ocid="referral.copy_link_button"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {linkCopied ? "Copied!" : "Copy Referral Link"}
            </Button>

            {/* Social share row */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 text-center">
                Share directly on social media
              </p>
              <div className="flex gap-2 justify-center">
                {SHARE_PLATFORMS.map(({ key, label, Icon, color }) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(key)}
                    className={`flex-1 flex items-center gap-1.5 text-muted-foreground transition-smooth ${color}`}
                    data-ocid={`referral.share_${key}_button`}
                    title={`Share on ${label}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redeem a code */}
        <Card data-ocid="referral.redeem_card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Redeem a Referral Code
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Got a code from a friend? Enter it below to earn R50 credits on
              your first delivery
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter referral code"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="font-mono tracking-wide"
                data-ocid="referral.redeem_input"
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              />
              <Button
                onClick={handleRedeem}
                disabled={!redeemCode.trim() || redeemMutation.isPending}
                data-ocid="referral.redeem_submit_button"
              >
                {redeemMutation.isPending ? "..." : "Redeem"}
              </Button>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                How it works
              </p>
              {[
                {
                  step: "1",
                  text: "Share your unique code with friends or family",
                },
                {
                  step: "2",
                  text: "They sign up and complete their first delivery",
                },
                {
                  step: "3",
                  text: "You both earn R50 in delivery credits instantly",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-bold">
                    {item.step}
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral history */}
      <Card className="mt-6" data-ocid="referral.history_card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Referral History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !history?.length ? (
            <div
              className="text-center py-10"
              data-ocid="referral.history_empty_state"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary opacity-60" />
              </div>
              <p className="font-medium text-foreground mb-1">
                No referrals yet
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Share your code above and start earning — your referral history
                will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Table header */}
              <div className="grid grid-cols-4 gap-4 px-3 pb-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  User
                </p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Date
                </p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                  Credits
                </p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                  Status
                </p>
              </div>
              {history.map((record, i) => (
                <div
                  key={record.id.toString()}
                  className="grid grid-cols-4 gap-4 items-center py-2.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
                  data-ocid={`referral.history_item.${i + 1}`}
                >
                  <p className="text-sm font-mono text-foreground truncate">
                    {record.refereeId.slice(0, 10)}…
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      Number(record.redeemedAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-semibold text-primary text-right">
                    +R{(Number(record.creditAmount) / 100).toFixed(2)}
                  </p>
                  <div className="flex justify-end">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      Credited
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
