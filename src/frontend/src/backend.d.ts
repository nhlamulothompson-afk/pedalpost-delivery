import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaderboardEntry {
    vehicleType?: VehicleType;
    displayName: string;
    badgeTier: BadgeTier;
    userId: UserId;
    averageRating: number;
    totalEarnings: bigint;
    deliveriesCompleted: bigint;
}
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Rating = bigint;
export interface PromoCode {
    id: bigint;
    expiresAt?: Timestamp;
    code: string;
    createdAt: Timestamp;
    discountType: DiscountType;
    totalUses: bigint;
    isActive: boolean;
    usesPerUser?: bigint;
    maxUses?: bigint;
}
export interface PayoutRecord {
    id: string;
    status: PayoutStatus;
    note: string;
    createdAt: Timestamp;
    riderId: UserId;
    amount: bigint;
}
export interface RiderLocation {
    latitude: number;
    updatedAt: bigint;
    longitude: number;
}
export interface ShareEvent {
    id: bigint;
    userId: UserId;
    createdAt: Timestamp;
    platform: SharePlatform;
    orderId?: OrderId;
}
export interface DailyStat {
    date: string;
    commission: bigint;
    ordersDelivered: bigint;
    ordersPlaced: bigint;
}
export interface AnalyticsDashboard {
    periodDays: bigint;
    promoStats: PromoAnalytics;
    topRiders: Array<TopRiderEntry>;
    totalCommission: bigint;
    topCustomers: Array<TopCustomerEntry>;
    dailyStats: Array<DailyStat>;
    referralStats: ReferralAnalytics;
}
export type DiscountType = {
    __kind__: "fixed";
    fixed: bigint;
} | {
    __kind__: "percent";
    percent: bigint;
};
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type SharePlatform = {
    __kind__: "twitter";
    twitter: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "instagram";
    instagram: null;
} | {
    __kind__: "whatsapp";
    whatsapp: null;
} | {
    __kind__: "facebook";
    facebook: null;
};
export interface RatingRecord {
    id: bigint;
    createdAt: Timestamp;
    riderId: UserId;
    orderId: OrderId;
    comment?: string;
    customerId: UserId;
    rating: Rating;
}
export interface OperatorPayoutDashboard {
    totalPayoutsCompleted: bigint;
    totalPayoutsPending: bigint;
    totalCommissionEarned: bigint;
    payouts: Array<PayoutRecord>;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface TopRiderEntry {
    displayName: string;
    userId: UserId;
    averageRating: number;
    totalEarnings: bigint;
    deliveriesCompleted: bigint;
}
export interface PromoAnalytics {
    totalUsesThisPeriod: bigint;
    totalCodesCreated: bigint;
    totalDiscountGivenThisPeriod: bigint;
}
export interface ReferralAnalytics {
    totalReferrals: bigint;
    totalCreditsIssued: bigint;
    referralsThisPeriod: bigint;
}
export interface Order {
    id: string;
    status: OrderStatus;
    deliveryPhotoUrl?: string;
    deliveryAddress: string;
    deliveryFee: bigint;
    packageWeight: string;
    platformFee: bigint;
    createdAt: bigint;
    riderId?: Principal;
    updatedAt: bigint;
    promoDiscount?: bigint;
    pickupAddress: string;
    customerId: Principal;
    estimatedTime?: string;
    riderPayout: bigint;
    packageDescription: string;
}
export interface UserProfilePublic {
    id: Principal;
    vehicleType?: VehicleType;
    balance: bigint;
    displayName: string;
    ratingCount: bigint;
    createdAt: bigint;
    role: UserRole;
    isAvailable: boolean;
    email?: string;
    averageRating: number;
    rating: number;
    totalDeliveries: bigint;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TopCustomerEntry {
    displayName: string;
    userId: UserId;
    totalSpend: bigint;
    ordersPlaced: bigint;
}
export type UserId = Principal;
export interface http_header {
    value: string;
    name: string;
}
export interface ReferralRecord {
    id: bigint;
    redeemedAt: Timestamp;
    refereeId: UserId;
    creditAmount: bigint;
    referrerId: UserId;
}
export interface PaymentSessionRecord {
    status: PaymentSessionStatus;
    createdAt: Timestamp;
    orderId: OrderId;
    updatedAt: Timestamp;
    customerId: UserId;
    sessionId: string;
    amount: bigint;
}
export interface PromoStats {
    totalCodes: bigint;
    totalUses: bigint;
    totalDiscountGiven: bigint;
}
export type OrderId = string;
export enum BadgeTier {
    bronze = "bronze",
    gold = "gold",
    default_ = "default",
    silver = "silver"
}
export enum OrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    pickedUp = "pickedUp",
    delivered = "delivered",
    accepted = "accepted",
    paymentPending = "paymentPending"
}
export enum PaymentSessionStatus {
    pending = "pending",
    retrying = "retrying",
    failed = "failed",
    succeeded = "succeeded"
}
export enum PayoutStatus {
    pending = "pending",
    completed = "completed",
    processing = "processing",
    failed = "failed"
}
export enum UserRole {
    customer = "customer",
    rider = "rider"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleType {
    bicycle = "bicycle",
    eBike = "eBike",
    electricWheel = "electricWheel"
}
export interface backendInterface {
    acceptOrder(orderId: string): Promise<Order>;
    applyPromoCode(orderId: OrderId, code: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    cancelOrder(orderId: string): Promise<Order>;
    completeRiderPayout(payoutId: string): Promise<void>;
    confirmOrderPayment(orderId: string, sessionId: string): Promise<boolean>;
    createCheckoutSession(orderId: string, successUrl: string, cancelUrl: string): Promise<string>;
    createPromoCode(code: string, discountType: DiscountType, expiresAt: Timestamp | null, maxUses: bigint | null, usesPerUser: bigint | null): Promise<PromoCode>;
    deactivatePromoCode(code: string): Promise<boolean>;
    getAllOrders(): Promise<Array<Order>>;
    getAllRiders(): Promise<Array<UserProfilePublic>>;
    getAnalyticsDashboard(periodDays: bigint | null): Promise<AnalyticsDashboard>;
    getCallerUserProfile(): Promise<UserProfilePublic | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getMyCreditBalance(): Promise<bigint>;
    getMyOrders(): Promise<Array<Order>>;
    getMyReferralCode(): Promise<string>;
    getMyReferralHistory(): Promise<Array<ReferralRecord>>;
    getMyRiderOrders(): Promise<Array<Order>>;
    getMyShareCount(): Promise<bigint>;
    getOperatorEmail(): Promise<string>;
    getOperatorPayoutDashboard(): Promise<OperatorPayoutDashboard>;
    getOrder(orderId: string): Promise<Order | null>;
    getOrderPaymentSession(orderId: string): Promise<PaymentSessionRecord | null>;
    getOrderStats(): Promise<{
        total: bigint;
        cancelled: bigint;
        pending: bigint;
        delivered: bigint;
    }>;
    getPendingOrders(): Promise<Array<Order>>;
    getPlatformBalance(): Promise<bigint>;
    getPromoStats(): Promise<PromoStats>;
    getRiderLocation(riderId: Principal): Promise<RiderLocation | null>;
    getRiderPayoutHistory(riderId: Principal): Promise<Array<PayoutRecord>>;
    getRiderRatings(riderId: UserId): Promise<Array<RatingRecord>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(userId: Principal): Promise<UserProfilePublic | null>;
    getUserReferralLink(): Promise<string>;
    initiateRiderPayout(riderId: Principal, amount: bigint, note: string): Promise<PayoutRecord>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    markDelivered(orderId: string, deliveryPhotoUrl: string | null): Promise<Order>;
    markPickedUp(orderId: string): Promise<Order>;
    placeOrder(pickupAddress: string, deliveryAddress: string, packageDescription: string, packageWeight: string, deliveryFee: bigint): Promise<Order>;
    rateRider(orderId: OrderId, rating: Rating, comment: string | null): Promise<RatingRecord>;
    recordShareEvent(orderId: OrderId | null, platform: SharePlatform): Promise<ShareEvent>;
    redeemReferralCode(code: string): Promise<boolean>;
    saveCallerUserProfile(displayName: string, role: UserRole, vehicleType: VehicleType | null, email: string | null): Promise<UserProfilePublic>;
    setOperatorEmail(email: string): Promise<void>;
    setStripeConfiguration(key: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateRiderLocation(latitude: number, longitude: number): Promise<void>;
    withdrawRiderBalance(amount: bigint): Promise<boolean>;
}
