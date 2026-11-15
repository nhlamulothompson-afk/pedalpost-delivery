import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  AnalyticsDashboard,
  LeaderboardEntry,
  OperatorPayoutDashboard,
  Order,
  PaymentSessionRecord,
  PayoutRecord,
  PromoCode,
  PromoStats,
  RatingRecord,
  ReferralRecord,
  ShareEvent,
  UserProfile,
} from "../types";

function useBackendActor() {
  return useActor(createActor);
}

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetUserProfile() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getCallerUserProfile();
      if (!result) return null;
      return {
        id: result.id.toText(),
        displayName: result.displayName,
        role: result.role as "customer" | "rider",
        vehicleType: result.vehicleType as UserProfile["vehicleType"],
        isAvailable: result.isAvailable,
        totalDeliveries: Number(result.totalDeliveries),
        rating: result.rating,
        averageRating: result.averageRating,
        ratingCount: Number(result.ratingCount),
        balance: result.balance,
        createdAt: result.createdAt,
        email: result.email,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateUserProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: {
      displayName: string;
      role: "customer" | "rider";
      vehicleType?: string;
      email?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(
        profile.displayName,
        profile.role as Parameters<typeof actor.saveCallerUserProfile>[1],
        (profile.vehicleType as Parameters<
          typeof actor.saveCallerUserProfile
        >[2]) ?? null,
        profile.email?.trim() || null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useUpdateUserProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: {
      displayName: string;
      role: "customer" | "rider";
      vehicleType?: string;
      email?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(
        profile.displayName,
        profile.role as Parameters<typeof actor.saveCallerUserProfile>[1],
        (profile.vehicleType as Parameters<
          typeof actor.saveCallerUserProfile
        >[2]) ?? null,
        profile.email?.trim() || null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

function mapOrder(o: import("../backend.d.ts").Order): Order {
  return {
    id: o.id,
    customerId: o.customerId.toText(),
    riderId: o.riderId?.toText(),
    pickupAddress: o.pickupAddress,
    deliveryAddress: o.deliveryAddress,
    packageDescription: o.packageDescription,
    packageWeight: o.packageWeight,
    deliveryFee: o.deliveryFee,
    platformFee: o.platformFee,
    riderPayout: o.riderPayout,
    status: o.status as Order["status"],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    estimatedTime: o.estimatedTime,
    deliveryPhotoUrl: o.deliveryPhotoUrl,
    promoDiscount: o.promoDiscount,
  };
}

function mapPayoutRecord(
  p: import("../backend.d.ts").PayoutRecord,
): PayoutRecord {
  return {
    id: p.id,
    riderId: p.riderId.toText(),
    amount: p.amount,
    status: p.status as PayoutRecord["status"],
    note: p.note,
    createdAt: p.createdAt,
  };
}

export function useGetCustomerOrders() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Order[]>({
    queryKey: ["customerOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const orders = await actor.getMyOrders();
      return orders.map(mapOrder);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOrder(orderId: string) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Order | null>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getOrder(orderId);
      return result ? mapOrder(result) : null;
    },
    enabled: !!actor && !isFetching && !!orderId,
    refetchInterval: 8000,
  });
}

export function usePlaceOrder() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: {
      pickupAddress: string;
      deliveryAddress: string;
      packageDescription: string;
      packageWeight: string;
      deliveryFee: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.placeOrder(
        order.pickupAddress,
        order.deliveryAddress,
        order.packageDescription,
        order.packageWeight,
        order.deliveryFee,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    },
  });
}

export function useCancelOrder() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.cancelOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    },
  });
}

// ── Stripe Payment ────────────────────────────────────────────────────────────

export function useCreateCheckoutSession() {
  const { actor } = useBackendActor();

  return useMutation({
    mutationFn: async (params: {
      orderId: string;
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // Returns the checkout URL string
      const url = await actor.createCheckoutSession(
        params.orderId,
        params.successUrl,
        params.cancelUrl,
      );
      return url as string;
    },
  });
}

export function useConfirmOrderPayment() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { orderId: string; sessionId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.confirmOrderPayment(params.orderId, params.sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useGetStripeSessionStatus(sessionId: string | undefined) {
  const { actor, isFetching } = useBackendActor();

  return useQuery({
    queryKey: ["stripeSessionStatus", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: 3000,
  });
}

export function useGetOrderPaymentSession(orderId: string | undefined) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<PaymentSessionRecord | null>({
    queryKey: ["orderPaymentSession", orderId],
    queryFn: async () => {
      if (!actor || !orderId) return null;
      const result = await actor.getOrderPaymentSession(orderId);
      if (!result) return null;
      return {
        sessionId: result.sessionId,
        orderId: result.orderId,
        customerId: result.customerId.toText(),
        amount: result.amount,
        status: result.status as PaymentSessionRecord["status"],
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    },
    enabled: !!actor && !isFetching && !!orderId,
    refetchInterval: 5000,
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setStripeConfiguration(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isStripeConfigured"] });
    },
  });
}

// ── Rider Payouts ─────────────────────────────────────────────────────────────

export function useInitiateRiderPayout() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      riderId: string;
      amount: bigint;
      note: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const record = await actor.initiateRiderPayout(
        Principal.fromText(params.riderId),
        params.amount,
        params.note,
      );
      return mapPayoutRecord(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operatorPayoutDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["riderPayoutHistory"] });
    },
  });
}

export function useCompleteRiderPayout() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payoutId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.completeRiderPayout(payoutId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operatorPayoutDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["riderPayoutHistory"] });
    },
  });
}

export function useGetRiderPayoutHistory() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<PayoutRecord[]>({
    queryKey: ["riderPayoutHistory"],
    queryFn: async () => {
      if (!actor) return [];
      const profile = await actor.getCallerUserProfile();
      if (!profile) return [];
      const records = await actor.getRiderPayoutHistory(profile.id);
      return records.map(mapPayoutRecord);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOperatorPayoutDashboard() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<OperatorPayoutDashboard | null>({
    queryKey: ["operatorPayoutDashboard"],
    queryFn: async () => {
      if (!actor) return null;
      const dash = await actor.getOperatorPayoutDashboard();
      return {
        totalPayoutsCompleted: dash.totalPayoutsCompleted,
        totalPayoutsPending: dash.totalPayoutsPending,
        totalCommissionEarned: dash.totalCommissionEarned,
        payouts: dash.payouts.map(mapPayoutRecord),
      };
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

// ── Rider ─────────────────────────────────────────────────────────────────────

export function useGetAvailableJobs() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Order[]>({
    queryKey: ["availableJobs"],
    queryFn: async () => {
      if (!actor) return [];
      const orders = await actor.getPendingOrders();
      return orders.map(mapOrder);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useGetRiderActiveOrder() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Order | null>({
    queryKey: ["riderActiveOrder"],
    queryFn: async () => {
      if (!actor) return null;
      const orders = await actor.getMyRiderOrders();
      const active = orders.find(
        (o) =>
          o.status === "accepted" ||
          o.status === "pickedUp" ||
          o.status === "paymentPending",
      );
      return active ? mapOrder(active) : null;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGetRiderOrderHistory() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<Order[]>({
    queryKey: ["riderOrderHistory"],
    queryFn: async () => {
      if (!actor) return [];
      const orders = await actor.getMyRiderOrders();
      return orders.map(mapOrder);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAcceptJob() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.acceptOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableJobs"] });
      queryClient.invalidateQueries({ queryKey: ["riderActiveOrder"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      orderId: string;
      status: string;
      photoUrl?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      if (params.status === "pickedUp") {
        return actor.markPickedUp(params.orderId);
      }
      if (params.status === "delivered") {
        return actor.markDelivered(params.orderId, params.photoUrl ?? null);
      }
      throw new Error(`Unsupported status transition: ${params.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riderActiveOrder"] });
      queryClient.invalidateQueries({ queryKey: ["riderOrderHistory"] });
    },
  });
}

export function useToggleAvailability() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_available: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return null; // availability managed via profile update
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useWithdrawRiderBalance() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.withdrawRiderBalance(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ── Referrals ─────────────────────────────────────────────────────────────────

export function useGetMyReferralCode() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<string>({
    queryKey: ["myReferralCode"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getMyReferralCode();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserReferralLink() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<string>({
    queryKey: ["userReferralLink"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getUserReferralLink();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRedeemReferralCode() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.redeemReferralCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCreditBalance"] });
      queryClient.invalidateQueries({ queryKey: ["myReferralHistory"] });
    },
  });
}

export function useGetMyReferralHistory() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<ReferralRecord[]>({
    queryKey: ["myReferralHistory"],
    queryFn: async () => {
      if (!actor) return [];
      const records = await actor.getMyReferralHistory();
      return records.map((r) => ({
        id: r.id,
        referrerId: r.referrerId.toText(),
        refereeId: r.refereeId.toText(),
        creditAmount: r.creditAmount,
        redeemedAt: r.redeemedAt,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyCreditBalance() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<bigint>({
    queryKey: ["myCreditBalance"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getMyCreditBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Ratings ───────────────────────────────────────────────────────────────────

export function useRateRider() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      orderId: string;
      rating: bigint;
      comment?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rateRider(
        params.orderId,
        params.rating,
        params.comment ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    },
  });
}

export function useGetRiderRatings(riderId: string) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<RatingRecord[]>({
    queryKey: ["riderRatings", riderId],
    queryFn: async () => {
      if (!actor || !riderId) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const records = await actor.getRiderRatings(Principal.fromText(riderId));
      return records.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        riderId: r.riderId.toText(),
        customerId: r.customerId.toText(),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      }));
    },
    enabled: !!actor && !isFetching && !!riderId,
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export function useGetLeaderboard() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.getLeaderboard();
      return entries.map((e) => ({
        userId: e.userId.toText(),
        displayName: e.displayName,
        vehicleType: e.vehicleType as LeaderboardEntry["vehicleType"],
        deliveriesCompleted: e.deliveriesCompleted,
        averageRating: e.averageRating,
        totalEarnings: e.totalEarnings,
      }));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

// ── Promo Codes ───────────────────────────────────────────────────────────────

export function useCreatePromoCode() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      code: string;
      discountType: PromoCode["discountType"];
      expiresAt?: bigint;
      maxUses?: bigint;
      usesPerUser?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPromoCode(
        params.code,
        params.discountType,
        params.expiresAt ?? null,
        params.maxUses ?? null,
        params.usesPerUser ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoStats"] });
    },
  });
}

export function useApplyPromoCode() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { orderId: string; code: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.applyPromoCode(params.orderId, params.code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    },
  });
}

export function useDeactivatePromoCode() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deactivatePromoCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoStats"] });
    },
  });
}

export function useGetPromoStats() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<PromoStats>({
    queryKey: ["promoStats"],
    queryFn: async () => {
      if (!actor)
        return { totalCodes: 0n, totalUses: 0n, totalDiscountGiven: 0n };
      return actor.getPromoStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useGetAnalyticsDashboard(periodDays?: bigint) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<AnalyticsDashboard | null>({
    queryKey: ["analyticsDashboard", periodDays?.toString()],
    queryFn: async () => {
      if (!actor) return null;
      const dash = await actor.getAnalyticsDashboard(periodDays ?? null);
      return {
        periodDays: dash.periodDays,
        totalCommission: dash.totalCommission,
        dailyStats: dash.dailyStats.map((d) => ({
          date: d.date,
          ordersPlaced: d.ordersPlaced,
          ordersDelivered: d.ordersDelivered,
          commission: d.commission,
        })),
        referralStats: {
          totalReferrals: dash.referralStats.totalReferrals,
          referralsThisPeriod: dash.referralStats.referralsThisPeriod,
          totalCreditsIssued: dash.referralStats.totalCreditsIssued,
        },
        promoStats: {
          totalCodesCreated: dash.promoStats.totalCodesCreated,
          totalUsesThisPeriod: dash.promoStats.totalUsesThisPeriod,
          totalDiscountGivenThisPeriod:
            dash.promoStats.totalDiscountGivenThisPeriod,
        },
        topRiders: dash.topRiders.map((r) => ({
          userId: r.userId.toText(),
          displayName: r.displayName,
          deliveriesCompleted: r.deliveriesCompleted,
          averageRating: r.averageRating,
          totalEarnings: r.totalEarnings,
        })),
        topCustomers: dash.topCustomers.map((c) => ({
          userId: c.userId.toText(),
          displayName: c.displayName,
          ordersPlaced: c.ordersPlaced,
          totalSpend: c.totalSpend,
        })),
      };
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Rider Location ────────────────────────────────────────────────────────────

export function useGetRiderLocation(riderId: string | undefined) {
  const { actor, isFetching } = useBackendActor();

  return useQuery<import("../types").RiderLocation | null>({
    queryKey: ["riderLocation", riderId],
    queryFn: async () => {
      if (!actor || !riderId) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.getRiderLocation(Principal.fromText(riderId));
      if (!result) return null;
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        updatedAt: result.updatedAt,
      };
    },
    enabled: !!actor && !isFetching && !!riderId,
    refetchInterval: 10000,
  });
}

export function useUpdateRiderLocation() {
  const { actor } = useBackendActor();

  return useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateRiderLocation(coords.latitude, coords.longitude);
    },
  });
}

// ── Operator Email ─────────────────────────────────────────────────────────────

export function useGetOperatorEmail() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<string>({
    queryKey: ["operatorEmail"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getOperatorEmail();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetOperatorEmail() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setOperatorEmail(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operatorEmail"] });
    },
  });
}

// ── Social Sharing ────────────────────────────────────────────────────────────

export function useRecordShareEvent() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { platform: string; orderId?: string }) => {
      if (!actor) throw new Error("Actor not available");
      const platform = buildSharePlatform(params.platform);
      const result = await actor.recordShareEvent(
        params.orderId ?? null,
        platform,
      );
      return {
        id: result.id,
        userId: result.userId.toText(),
        platform: params.platform as ShareEvent["platform"],
        orderId: result.orderId,
        createdAt: result.createdAt,
      } satisfies ShareEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myShareCount"] });
    },
  });
}

export function useGetMyShareCount() {
  const { actor, isFetching } = useBackendActor();

  return useQuery<bigint>({
    queryKey: ["myShareCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getMyShareCount();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSharePlatform(
  platform: string,
): import("../backend.d.ts").SharePlatform {
  switch (platform) {
    case "twitter":
      return { __kind__: "twitter", twitter: null };
    case "whatsapp":
      return { __kind__: "whatsapp", whatsapp: null };
    case "facebook":
      return { __kind__: "facebook", facebook: null };
    case "instagram":
      return { __kind__: "instagram", instagram: null };
    default:
      return { __kind__: "other", other: platform };
  }
}
