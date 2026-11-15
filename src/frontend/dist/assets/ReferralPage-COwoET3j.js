import { u as useInternetIdentity, a as useNavigate, r as reactExports, b as useGetMyReferralCode, c as useGetUserReferralLink, d as useGetMyCreditBalance, e as useGetMyReferralHistory, f as useGetMyShareCount, g as useRedeemReferralCode, h as useRecordShareEvent, j as jsxRuntimeExports, B as Button, C as Card, i as CardContent, k as CardHeader, l as CardTitle, S as Skeleton, m as Copy, n as Share2, o as SiX, p as SiWhatsapp, q as SiFacebook, s as SiInstagram, t as CreditCard, I as Input, v as CircleCheck, w as Badge, x as ue } from "./index--oF_bLO5.js";
import { G as Gift, U as Users } from "./users-C_-hspQX.js";
const SHARE_PLATFORMS = [
  {
    key: "twitter",
    label: "Twitter",
    Icon: SiX,
    color: "hover:text-foreground",
    getUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: SiWhatsapp,
    color: "hover:text-[oklch(0.6_0.18_145)]",
    getUrl: (text, url) => `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: SiFacebook,
    color: "hover:text-[oklch(0.52_0.2_270)]",
    getUrl: (_text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: SiInstagram,
    color: "hover:text-[oklch(0.62_0.22_25)]",
    getUrl: (text, url) => `https://www.instagram.com/?url=${encodeURIComponent(url)}&caption=${encodeURIComponent(text)}`
  }
];
function ReferralPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [redeemCode, setRedeemCode] = reactExports.useState("");
  const [codeCopied, setCodeCopied] = reactExports.useState(false);
  const [linkCopied, setLinkCopied] = reactExports.useState(false);
  const { data: referralCode, isLoading: codeLoading } = useGetMyReferralCode();
  const { data: referralLink } = useGetUserReferralLink();
  const { data: creditBalance } = useGetMyCreditBalance();
  const { data: history, isLoading: historyLoading } = useGetMyReferralHistory();
  const { data: shareCount } = useGetMyShareCount();
  const redeemMutation = useRedeemReferralCode();
  const shareMutation = useRecordShareEvent();
  if (!identity) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center",
        "data-ocid": "referral.page",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-8 w-8 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-display font-bold text-foreground", children: "Refer & Earn" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-sm", children: "Sign in to access your referral code and start earning credits for every friend you invite." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => navigate({ to: "/" }),
              "data-ocid": "referral.sign_in_button",
              children: "Sign In to Continue"
            }
          )
        ]
      }
    );
  }
  const handleCopyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCodeCopied(true);
    ue.success("Referral code copied!");
    setTimeout(() => setCodeCopied(false), 2e3);
  };
  const handleCopyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    ue.success("Referral link copied!");
    setTimeout(() => setLinkCopied(false), 2e3);
  };
  const handleShare = async (platform) => {
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
        ue.success(
          "Referral code redeemed! R50 credits added to your account."
        );
        setRedeemCode("");
      } else {
        ue.error("Invalid or already used referral code.");
      }
    } catch {
      ue.error("Failed to redeem code. Please try again.");
    }
  };
  const creditsDisplay = creditBalance !== void 0 ? `R${(Number(creditBalance) / 100).toFixed(2)}` : "R0.00";
  const totalCreditsEarned = history ? history.reduce((sum, r) => sum + Number(r.creditAmount), 0) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up",
      "data-ocid": "referral.page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-5 w-5 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-display font-bold text-foreground", children: "Refer & Earn" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground ml-13 pl-1", children: [
            "Share PedalPost with friends — when they sign up and complete their first delivery,",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-semibold", children: "you both earn R50 credit" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-primary/20", "data-ocid": "referral.credits_card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-5 pb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "analytics-stat-label mb-1", children: "Credit Balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "analytics-stat-value text-primary", children: creditsDisplay })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { "data-ocid": "referral.referrals_card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-5 pb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "analytics-stat-label mb-1", children: "Total Referrals" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "analytics-stat-value", children: (history == null ? void 0 : history.length) ?? 0 })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { "data-ocid": "referral.total_credits_card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-5 pb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "analytics-stat-label mb-1", children: "Credits Earned" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "analytics-stat-value text-primary", children: [
              "R",
              (totalCreditsEarned / 100).toFixed(2)
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { "data-ocid": "referral.shares_card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-5 pb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "analytics-stat-label mb-1", children: "Times Shared" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "analytics-stat-value", children: shareCount !== void 0 ? Number(shareCount) : 0 })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-primary/20", "data-ocid": "referral.code_card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-4 w-4 text-primary" }),
                "Your Referral Code"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Share your unique code — you both earn R50 when they complete their first delivery" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
              codeLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 w-full rounded-lg" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "referral-code-display w-full text-center text-xl tracking-[0.3em] font-bold text-foreground select-all cursor-pointer border-primary/30 bg-primary/5",
                  "data-ocid": "referral.code_display",
                  onClick: handleCopyCode,
                  title: "Click to copy",
                  children: referralCode ?? "Loading..."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  className: "w-full transition-smooth",
                  onClick: handleCopyCode,
                  "data-ocid": "referral.copy_code_button",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
                    codeCopied ? "Copied!" : "Copy Code"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  className: "w-full transition-smooth",
                  onClick: handleCopyLink,
                  "data-ocid": "referral.copy_link_button",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-4 w-4 mr-2" }),
                    linkCopied ? "Copied!" : "Copy Referral Link"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-3 border-t border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3 text-center", children: "Share directly on social media" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 justify-center", children: SHARE_PLATFORMS.map(({ key, label, Icon, color }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => handleShare(key),
                    className: `flex-1 flex items-center gap-1.5 text-muted-foreground transition-smooth ${color}`,
                    "data-ocid": `referral.share_${key}_button`,
                    title: `Share on ${label}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline text-xs", children: label })
                    ]
                  },
                  key
                )) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "referral.redeem_card", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4 text-primary" }),
                "Redeem a Referral Code"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Got a code from a friend? Enter it below to earn R50 credits on your first delivery" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    placeholder: "Enter referral code",
                    value: redeemCode,
                    onChange: (e) => setRedeemCode(e.target.value.toUpperCase()),
                    className: "font-mono tracking-wide",
                    "data-ocid": "referral.redeem_input",
                    onKeyDown: (e) => e.key === "Enter" && handleRedeem()
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: handleRedeem,
                    disabled: !redeemCode.trim() || redeemMutation.isPending,
                    "data-ocid": "referral.redeem_submit_button",
                    children: redeemMutation.isPending ? "..." : "Redeem"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-accent/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-foreground uppercase tracking-widest flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-primary" }),
                  "How it works"
                ] }),
                [
                  {
                    step: "1",
                    text: "Share your unique code with friends or family"
                  },
                  {
                    step: "2",
                    text: "They sign up and complete their first delivery"
                  },
                  {
                    step: "3",
                    text: "You both earn R50 in delivery credits instantly"
                  }
                ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 items-start", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-bold", children: item.step }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-snug", children: item.text })
                ] }, item.step))
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "mt-6", "data-ocid": "referral.history_card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 text-primary" }),
            "Referral History"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: historyLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full rounded-lg" }, i)) }) : !(history == null ? void 0 : history.length) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "text-center py-10",
              "data-ocid": "referral.history_empty_state",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-6 w-6 text-primary opacity-60" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground mb-1", children: "No referrals yet" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-xs mx-auto", children: "Share your code above and start earning — your referral history will appear here." })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4 px-3 pb-2 border-b border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "User" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Date" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right", children: "Credits" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right", children: "Status" })
            ] }),
            history.map((record, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "grid grid-cols-4 gap-4 items-center py-2.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth",
                "data-ocid": `referral.history_item.${i + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-mono text-foreground truncate", children: [
                    record.refereeId.slice(0, 10),
                    "…"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: new Date(
                    Number(record.redeemedAt) / 1e6
                  ).toLocaleDateString() }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-primary text-right", children: [
                    "+R",
                    (Number(record.creditAmount) / 100).toFixed(2)
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "secondary",
                      className: "text-xs bg-primary/10 text-primary border-primary/20",
                      children: "Credited"
                    }
                  ) })
                ]
              },
              record.id.toString()
            ))
          ] }) })
        ] })
      ]
    }
  );
}
export {
  ReferralPage as default
};
