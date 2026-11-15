export type OrderStatus =
  | "pending"
  | "accepted"
  | "pickedUp"
  | "delivered"
  | "cancelled"
  | "paymentPending";

export type VehicleType = "bicycle" | "electricWheel" | "eBike";
export type UserRole = "customer" | "rider";
export type SharePlatform =
  | "twitter"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "other";

export type PaymentSessionStatus =
  | "pending"
  | "retrying"
  | "failed"
  | "succeeded";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export interface UserProfile {
  id: string;
  displayName: string;
  role: UserRole;
  vehicleType?: VehicleType;
  isAvailable: boolean;
  totalDeliveries: number;
  rating: number;
  averageRating: number;
  ratingCount: number;
  balance: bigint;
  createdAt: bigint;
  email?: string;
}

export interface Order {
  id: string;
  customerId: string;
  riderId?: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  packageWeight: string;
  deliveryFee: bigint;
  platformFee: bigint;
  riderPayout: bigint;
  status: OrderStatus;
  createdAt: bigint;
  updatedAt: bigint;
  estimatedTime?: string;
  deliveryPhotoUrl?: string;
  promoDiscount?: bigint;
}

export interface StripeSession {
  sessionId: string;
  checkoutUrl: string;
  status: PaymentSessionStatus;
}

export interface PaymentSessionRecord {
  sessionId: string;
  orderId: string;
  customerId: string;
  amount: bigint;
  status: PaymentSessionStatus;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface PayoutRecord {
  id: string;
  riderId: string;
  amount: bigint;
  status: PayoutStatus;
  note: string;
  createdAt: bigint;
}

export interface OperatorPayoutDashboard {
  totalPayoutsCompleted: bigint;
  totalPayoutsPending: bigint;
  totalCommissionEarned: bigint;
  payouts: PayoutRecord[];
}

export interface OrderStats {
  total: number;
  pending: number;
  accepted: number;
  delivered: number;
  cancelled: number;
}

export interface RatingRecord {
  id: bigint;
  orderId: string;
  riderId: string;
  customerId: string;
  rating: bigint;
  comment?: string;
  createdAt: bigint;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  vehicleType?: VehicleType;
  deliveriesCompleted: bigint;
  averageRating: number;
  totalEarnings: bigint;
}

export interface PromoCode {
  id: bigint;
  code: string;
  discountType:
    | { __kind__: "fixed"; fixed: bigint }
    | { __kind__: "percent"; percent: bigint };
  isActive: boolean;
  totalUses: bigint;
  maxUses?: bigint;
  usesPerUser?: bigint;
  expiresAt?: bigint;
  createdAt: bigint;
}

export interface ReferralRecord {
  id: bigint;
  referrerId: string;
  refereeId: string;
  creditAmount: bigint;
  redeemedAt: bigint;
}

export interface DailyStat {
  date: string;
  ordersPlaced: bigint;
  ordersDelivered: bigint;
  commission: bigint;
}

export interface ReferralAnalytics {
  totalReferrals: bigint;
  referralsThisPeriod: bigint;
  totalCreditsIssued: bigint;
}

export interface PromoAnalytics {
  totalCodesCreated: bigint;
  totalUsesThisPeriod: bigint;
  totalDiscountGivenThisPeriod: bigint;
}

export interface TopRiderEntry {
  userId: string;
  displayName: string;
  deliveriesCompleted: bigint;
  averageRating: number;
  totalEarnings: bigint;
}

export interface TopCustomerEntry {
  userId: string;
  displayName: string;
  ordersPlaced: bigint;
  totalSpend: bigint;
}

export interface AnalyticsDashboard {
  periodDays: bigint;
  totalCommission: bigint;
  dailyStats: DailyStat[];
  referralStats: ReferralAnalytics;
  promoStats: PromoAnalytics;
  topRiders: TopRiderEntry[];
  topCustomers: TopCustomerEntry[];
}

export interface ShareEvent {
  id: bigint;
  userId: string;
  platform: SharePlatform;
  orderId?: string;
  createdAt: bigint;
}

export interface PromoStats {
  totalCodes: bigint;
  totalUses: bigint;
  totalDiscountGiven: bigint;
}

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  bicycle: "Bicycle",
  electricWheel: "Electric Wheel",
  eBike: "E-Bike",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  pickedUp: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
  paymentPending: "Payment Required",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  accepted: "bg-primary/20 text-primary",
  pickedUp: "bg-chart-2/20 text-chart-2",
  delivered: "bg-primary/30 text-primary",
  cancelled: "bg-destructive/20 text-destructive",
  paymentPending: "bg-amber-100 text-amber-700 border border-amber-300",
};

// Operator principal constant — update with actual operator principal if needed
export const OPERATOR_PRINCIPAL = "2vxsx-fae";

export interface RiderLocation {
  latitude: number;
  longitude: number;
  updatedAt: bigint;
}

// Helper to format bigint cents to "R 150.00"
export function formatZAR(cents: bigint | number): string {
  const n = typeof cents === "bigint" ? Number(cents) : cents;
  return `R ${(n / 100).toFixed(2)}`;
}
