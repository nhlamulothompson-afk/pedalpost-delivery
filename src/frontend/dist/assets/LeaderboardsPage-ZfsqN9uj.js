import { y as createLucideIcon, j as jsxRuntimeExports, z as Star, r as reactExports, A as useGetLeaderboard, D as useGetUserProfile, u as useInternetIdentity, T as Trophy, E as Clock, B as Button, F as Bike, S as Skeleton, C as Card, k as CardHeader, w as Badge, i as CardContent, V as VEHICLE_LABELS, Z as Zap } from "./index--oF_bLO5.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
      key: "1yiouv"
    }
  ],
  ["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }]
];
const Award = createLucideIcon("award", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15",
      key: "143lza"
    }
  ],
  ["path", { d: "M11 12 5.12 2.2", key: "qhuxz6" }],
  ["path", { d: "m13 12 5.88-9.8", key: "hbye0f" }],
  ["path", { d: "M8 7h8", key: "i86dvs" }],
  ["circle", { cx: "12", cy: "17", r: "5", key: "qbz8iq" }],
  ["path", { d: "M12 18v-2h-.5", key: "fawc4q" }]
];
const Medal = createLucideIcon("medal", __iconNode);
const SIZE_MAP = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5"
};
function StarRating({
  value,
  max = 5,
  size = "sm",
  showValue = true,
  className = ""
}) {
  const rounded = Math.round(value * 2) / 2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-0.5 ${className}`, children: [
    Array.from({ length: max }, (_, i) => {
      const pos = i + 1;
      const filled = pos <= rounded;
      const half = !filled && i + 0.5 === rounded;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Star,
        {
          className: `${SIZE_MAP[size]} flex-shrink-0 ${filled ? "text-amber-400 fill-amber-400" : half ? "text-amber-400 fill-amber-200" : "text-muted-foreground/30"}`
        },
        `star-pos-${pos}`
      );
    }),
    showValue && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-xs text-muted-foreground tabular-nums", children: value > 0 ? value.toFixed(1) : "—" })
  ] });
}
const RANK_BADGE_CLASS = [
  "badge-gold",
  "badge-silver",
  "badge-bronze"
];
const RANK_LABEL = ["🥇 Gold", "🥈 Silver", "🥉 Bronze"];
const RANK_TIER_LABEL = ["Gold Rider", "Silver Rider", "Bronze Rider"];
function VehicleIcon({ type }) {
  if (!type) return null;
  return type === "electricWheel" || type === "eBike" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-2.5 w-2.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "h-2.5 w-2.5" });
}
function VehicleBadge({ type }) {
  if (!type) return null;
  const isEco = type === "electricWheel" || type === "eBike";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${isEco ? "bg-accent/15 text-accent-foreground border-accent/30" : "bg-muted text-muted-foreground border-border"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(VehicleIcon, { type }),
        VEHICLE_LABELS[type]
      ]
    }
  );
}
function PodiumCard({
  entry,
  rank,
  podiumHeight
}) {
  const badgeClass = RANK_BADGE_CLASS[rank] ?? "rank-default";
  const isPulse = rank === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `flex flex-col items-center justify-end rounded-xl p-3 bg-card border-2 ${rank === 0 ? "border-[oklch(var(--gold-badge))]" : "border-border"} ${podiumHeight} relative overflow-hidden transition-smooth hover:shadow-md`,
      "data-ocid": `leaderboard.podium.${rank + 1}`,
      children: [
        rank === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[oklch(var(--gold-badge)/0.05)] pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `rank-indicator rank-${rank + 1} mb-2 ${isPulse ? "animate-pulse-badge" : ""}`,
            "aria-label": `Rank ${rank + 1}`,
            children: [
              rank === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Medal, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold leading-none", children: rank + 1 })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-sm mb-2 ${badgeClass}`,
            children: entry.displayName.charAt(0).toUpperCase()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground text-center leading-tight truncate w-full", children: entry.displayName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StarRating,
          {
            value: entry.averageRating,
            size: "sm",
            showValue: false,
            className: "mt-1 justify-center"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold text-primary mt-0.5", children: [
          Number(entry.deliveriesCompleted),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-muted-foreground", children: " trips" })
        ] })
      ]
    }
  );
}
function RankCell({ index }) {
  if (index < 3) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `rank-indicator ${RANK_BADGE_CLASS[index]} flex-shrink-0 ${index === 0 ? "animate-pulse-badge" : ""}`,
        "aria-label": `Rank ${index + 1}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: index + 1 })
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "rank-indicator rank-default flex-shrink-0",
      "aria-label": `Rank ${index + 1}`,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold", children: index + 1 })
    }
  );
}
function LeaderboardsPage() {
  const [sortMode, setSortMode] = reactExports.useState("deliveries");
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: myProfile } = useGetUserProfile();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity == null ? void 0 : identity.getPrincipal().toText();
  const sorted = [...leaderboard ?? []].sort((a, b) => {
    if (sortMode === "deliveries") {
      return Number(b.deliveriesCompleted) - Number(a.deliveriesCompleted);
    }
    return b.averageRating - a.averageRating;
  });
  const top3 = sorted.slice(0, 3);
  const allTop25 = sorted.slice(0, 25);
  const myRankIndex = myPrincipal ? allTop25.findIndex((e) => e.userId === myPrincipal) : -1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "container mx-auto px-4 py-8 max-w-3xl",
      "data-ocid": "leaderboard.page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-7 w-7 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-display font-bold text-foreground mb-2", children: "Top Riders Leaderboard" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-sm mx-auto text-sm", children: "The fastest, most reliable eco-delivery riders on the planet." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Updated daily — complete more deliveries to climb the ranks" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: sortMode === "deliveries" ? "default" : "outline",
              size: "sm",
              onClick: () => setSortMode("deliveries"),
              "data-ocid": "leaderboard.filter.tab",
              className: "rounded-full px-5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "h-3.5 w-3.5 mr-1.5" }),
                "Most Deliveries"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: sortMode === "rating" ? "default" : "outline",
              size: "sm",
              onClick: () => setSortMode("rating"),
              "data-ocid": "leaderboard.rating_filter.tab",
              className: "rounded-full px-5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-3.5 w-3.5 mr-1.5" }),
                "Highest Rated"
              ]
            }
          )
        ] }),
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 mb-8 items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 w-full rounded-xl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-36 w-full rounded-xl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 w-full rounded-xl" })
        ] }) : top3.length >= 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 mb-8 items-end", children: [
          top3[1] ? /* @__PURE__ */ jsxRuntimeExports.jsx(PodiumCard, { entry: top3[1], rank: 1, podiumHeight: "h-28" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-28" }),
          top3[0] ? /* @__PURE__ */ jsxRuntimeExports.jsx(PodiumCard, { entry: top3[0], rank: 0, podiumHeight: "h-36" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-36" }),
          top3[2] ? /* @__PURE__ */ jsxRuntimeExports.jsx(PodiumCard, { entry: top3[2], rank: 2, podiumHeight: "h-24" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24" })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "leaderboard.table_card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-base font-display font-semibold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "h-4 w-4 text-primary" }),
              "Full Rankings",
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs font-normal", children: "Top 25" })
            ] }),
            (myProfile == null ? void 0 : myProfile.role) === "rider" && myRankIndex >= 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "text-xs bg-primary/10 text-primary border-primary/30 border", children: [
              "You're #",
              myRankIndex + 1,
              "!"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-0", children: [
            isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [
              "sk-1",
              "sk-2",
              "sk-3",
              "sk-4",
              "sk-5",
              "sk-6",
              "sk-7",
              "sk-8"
            ].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 w-full rounded-lg" }, k)) }) : allTop25.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "text-center py-16",
                "data-ocid": "leaderboard.empty_state",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-3" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold", children: "No riders yet" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Complete your first delivery to claim the #1 spot!" })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border -mx-2", children: allTop25.map((entry, i) => {
              const isMe = myPrincipal && entry.userId === myPrincipal;
              const rankNum = i + 1;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `flex items-center gap-3 py-3 px-3 rounded-lg transition-colors ${isMe ? "bg-primary/5 border border-primary/25" : "hover:bg-muted/30"}`,
                  "data-ocid": `leaderboard.item.${rankNum}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RankCell, { index: i }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: `h-9 w-9 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${i < 3 ? RANK_BADGE_CLASS[i] : "bg-muted text-muted-foreground"}`,
                        "aria-hidden": "true",
                        children: entry.displayName.charAt(0).toUpperCase()
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-foreground truncate", children: [
                          entry.displayName,
                          isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-xs text-primary font-normal", children: "(you)" })
                        ] }),
                        i < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `text-xs px-1.5 py-0.5 rounded-full font-semibold ${RANK_BADGE_CLASS[i]}`,
                            children: RANK_LABEL[i]
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5 flex-wrap", children: [
                        entry.vehicleType && /* @__PURE__ */ jsxRuntimeExports.jsx(VehicleBadge, { type: entry.vehicleType }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                          Number(entry.deliveriesCompleted),
                          " deliveries"
                        ] }),
                        i < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground hidden sm:inline", children: RANK_TIER_LABEL[i] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1 flex-shrink-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        StarRating,
                        {
                          value: entry.averageRating,
                          size: "sm",
                          showValue: true
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-primary hidden sm:block", children: [
                        "R",
                        (Number(entry.totalEarnings) / 100).toFixed(0),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-normal text-muted-foreground", children: [
                          " ",
                          "earned"
                        ] })
                      ] })
                    ] })
                  ]
                },
                `rider-rank-${rankNum}`
              );
            }) }),
            allTop25.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-xs text-muted-foreground mt-4 pt-3 border-t border-border", children: [
              "Showing top ",
              allTop25.length,
              " riders · Updated daily"
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  LeaderboardsPage as default
};
