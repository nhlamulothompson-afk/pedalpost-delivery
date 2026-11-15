import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Award, Bike, Clock, Medal, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { StarRating } from "../components/leaderboard/StarRating";
import { useGetLeaderboard, useGetUserProfile } from "../hooks/useQueries";
import type { LeaderboardEntry, VehicleType } from "../types";
import { VEHICLE_LABELS } from "../types";

type SortMode = "deliveries" | "rating";

const RANK_BADGE_CLASS = [
  "badge-gold",
  "badge-silver",
  "badge-bronze",
] as const;
const RANK_LABEL = ["🥇 Gold", "🥈 Silver", "🥉 Bronze"] as const;
const RANK_TIER_LABEL = ["Gold Rider", "Silver Rider", "Bronze Rider"] as const;

function VehicleIcon({ type }: { type?: VehicleType }) {
  if (!type) return null;
  return type === "electricWheel" || type === "eBike" ? (
    <Zap className="h-2.5 w-2.5" />
  ) : (
    <Bike className="h-2.5 w-2.5" />
  );
}

function VehicleBadge({ type }: { type?: VehicleType }) {
  if (!type) return null;
  const isEco = type === "electricWheel" || type === "eBike";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${
        isEco
          ? "bg-accent/15 text-accent-foreground border-accent/30"
          : "bg-muted text-muted-foreground border-border"
      }`}
    >
      <VehicleIcon type={type} />
      {VEHICLE_LABELS[type]}
    </span>
  );
}

function PodiumCard({
  entry,
  rank,
  podiumHeight,
}: {
  entry: LeaderboardEntry;
  rank: number;
  podiumHeight: string;
}) {
  const badgeClass = RANK_BADGE_CLASS[rank] ?? "rank-default";
  const isPulse = rank === 0;

  return (
    <div
      className={`flex flex-col items-center justify-end rounded-xl p-3 bg-card border-2 ${
        rank === 0 ? "border-[oklch(var(--gold-badge))]" : "border-border"
      } ${podiumHeight} relative overflow-hidden transition-smooth hover:shadow-md`}
      data-ocid={`leaderboard.podium.${rank + 1}`}
    >
      {rank === 0 && (
        <div className="absolute inset-0 bg-[oklch(var(--gold-badge)/0.05)] pointer-events-none" />
      )}

      <div
        className={`rank-indicator rank-${rank + 1} mb-2 ${isPulse ? "animate-pulse-badge" : ""}`}
        aria-label={`Rank ${rank + 1}`}
      >
        {rank === 0 ? (
          <Trophy className="h-3.5 w-3.5" />
        ) : (
          <Medal className="h-3.5 w-3.5" />
        )}
        <span className="text-xs font-bold leading-none">{rank + 1}</span>
      </div>

      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-sm mb-2 ${badgeClass}`}
      >
        {entry.displayName.charAt(0).toUpperCase()}
      </div>

      <p className="text-xs font-semibold text-foreground text-center leading-tight truncate w-full">
        {entry.displayName}
      </p>

      <StarRating
        value={entry.averageRating}
        size="sm"
        showValue={false}
        className="mt-1 justify-center"
      />

      <p className="text-xs font-bold text-primary mt-0.5">
        {Number(entry.deliveriesCompleted)}
        <span className="font-normal text-muted-foreground"> trips</span>
      </p>
    </div>
  );
}

function RankCell({ index }: { index: number }) {
  if (index < 3) {
    return (
      <div
        className={`rank-indicator ${RANK_BADGE_CLASS[index]} flex-shrink-0 ${index === 0 ? "animate-pulse-badge" : ""}`}
        aria-label={`Rank ${index + 1}`}
      >
        <span className="text-xs font-bold">{index + 1}</span>
      </div>
    );
  }
  return (
    <div
      className="rank-indicator rank-default flex-shrink-0"
      aria-label={`Rank ${index + 1}`}
    >
      <span className="text-xs font-semibold">{index + 1}</span>
    </div>
  );
}

export default function LeaderboardsPage() {
  const [sortMode, setSortMode] = useState<SortMode>("deliveries");
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: myProfile } = useGetUserProfile();

  // Get current identity to detect "my row"
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toText();

  const sorted = [...(leaderboard ?? [])].sort((a, b) => {
    if (sortMode === "deliveries") {
      return Number(b.deliveriesCompleted) - Number(a.deliveriesCompleted);
    }
    return b.averageRating - a.averageRating;
  });

  const top3 = sorted.slice(0, 3);
  const allTop25 = sorted.slice(0, 25);

  const myRankIndex = myPrincipal
    ? allTop25.findIndex((e) => e.userId === myPrincipal)
    : -1;

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-3xl"
      data-ocid="leaderboard.page"
    >
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Top Riders Leaderboard
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm">
          The fastest, most reliable eco-delivery riders on the planet.
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Updated daily — complete more deliveries to climb the ranks
          </span>
        </div>
      </div>

      {/* ── Sort Toggle ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <Button
          variant={sortMode === "deliveries" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode("deliveries")}
          data-ocid="leaderboard.filter.tab"
          className="rounded-full px-5"
        >
          <Bike className="h-3.5 w-3.5 mr-1.5" />
          Most Deliveries
        </Button>
        <Button
          variant={sortMode === "rating" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode("rating")}
          data-ocid="leaderboard.rating_filter.tab"
          className="rounded-full px-5"
        >
          <Award className="h-3.5 w-3.5 mr-1.5" />
          Highest Rated
        </Button>
      </div>

      {/* ── Podium Top 3 ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-8 items-end">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : top3.length >= 1 ? (
        <div className="grid grid-cols-3 gap-3 mb-8 items-end">
          {/* Order: 2nd | 1st | 3rd */}
          {top3[1] ? (
            <PodiumCard entry={top3[1]} rank={1} podiumHeight="h-28" />
          ) : (
            <div className="h-28" />
          )}
          {top3[0] ? (
            <PodiumCard entry={top3[0]} rank={0} podiumHeight="h-36" />
          ) : (
            <div className="h-36" />
          )}
          {top3[2] ? (
            <PodiumCard entry={top3[2]} rank={2} podiumHeight="h-24" />
          ) : (
            <div className="h-24" />
          )}
        </div>
      ) : null}

      {/* ── Full Rankings Table ───────────────────────────────────────── */}
      <Card data-ocid="leaderboard.table_card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
              <Bike className="h-4 w-4 text-primary" />
              Full Rankings
              <Badge variant="secondary" className="text-xs font-normal">
                Top 25
              </Badge>
            </h2>
            {myProfile?.role === "rider" && myRankIndex >= 0 && (
              <Badge className="text-xs bg-primary/10 text-primary border-primary/30 border">
                You're #{myRankIndex + 1}!
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[
                "sk-1",
                "sk-2",
                "sk-3",
                "sk-4",
                "sk-5",
                "sk-6",
                "sk-7",
                "sk-8",
              ].map((k) => (
                <Skeleton key={k} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : allTop25.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="leaderboard.empty_state"
            >
              <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No riders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete your first delivery to claim the #1 spot!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border -mx-2">
              {allTop25.map((entry, i) => {
                const isMe = myPrincipal && entry.userId === myPrincipal;
                const rankNum = i + 1;

                return (
                  <div
                    key={`rider-rank-${rankNum}`}
                    className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-colors ${
                      isMe
                        ? "bg-primary/5 border border-primary/25"
                        : "hover:bg-muted/30"
                    }`}
                    data-ocid={`leaderboard.item.${rankNum}`}
                  >
                    {/* Rank indicator */}
                    <RankCell index={i} />

                    {/* Avatar */}
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${
                        i < 3
                          ? RANK_BADGE_CLASS[i]
                          : "bg-muted text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {entry.displayName.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + vehicle + tier */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {entry.displayName}
                          {isMe && (
                            <span className="ml-1 text-xs text-primary font-normal">
                              (you)
                            </span>
                          )}
                        </p>
                        {i < 3 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${RANK_BADGE_CLASS[i]}`}
                          >
                            {RANK_LABEL[i]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {entry.vehicleType && (
                          <VehicleBadge type={entry.vehicleType} />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {Number(entry.deliveriesCompleted)} deliveries
                        </span>
                        {i < 3 && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {RANK_TIER_LABEL[i]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stars + earnings */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StarRating
                        value={entry.averageRating}
                        size="sm"
                        showValue
                      />
                      <span className="text-xs font-bold text-primary hidden sm:block">
                        R{(Number(entry.totalEarnings) / 100).toFixed(0)}
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          earned
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {allTop25.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
              Showing top {allTop25.length} riders · Updated daily
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
