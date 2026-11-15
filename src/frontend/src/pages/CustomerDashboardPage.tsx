import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Leaf,
  Package,
  Plus,
} from "lucide-react";
import { useGetCustomerOrders, useGetUserProfile } from "../hooks/useQueries";
import { STATUS_COLORS, STATUS_LABELS } from "../types";

const SAMPLE_ORDERS = [
  {
    id: "ord-001",
    pickupAddress: "12 Baker St, London",
    deliveryAddress: "45 Oxford Rd, London",
    packageDescription: "Documents",
    status: "delivered" as const,
    estimatedTime: "Delivered 2h ago",
  },
  {
    id: "ord-002",
    pickupAddress: "7 High St, London",
    deliveryAddress: "22 Victoria Ave, London",
    packageDescription: "Small parcel",
    status: "pending" as const,
    estimatedTime: "Estimated 25-35 min",
  },
  {
    id: "ord-003",
    pickupAddress: "3 Park Lane, London",
    deliveryAddress: "88 Green Rd, London",
    packageDescription: "Gift box",
    status: "accepted" as const,
    estimatedTime: "Rider en route",
  },
];

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useGetCustomerOrders();
  const { data: profile } = useGetUserProfile();

  const displayOrders = orders?.length ? orders : SAMPLE_ORDERS;
  const welcomeName = profile?.displayName ?? "there";

  const stats = [
    {
      label: "Total Orders",
      value: "12",
      icon: Package,
      color: "text-primary",
    },
    {
      label: "In Progress",
      value: "2",
      icon: Clock,
      color: "text-accent-foreground",
    },
    {
      label: "Delivered",
      value: "9",
      icon: CheckCircle,
      color: "text-primary",
    },
    { label: "Saved CO₂", value: "4.2kg", icon: Leaf, color: "text-primary" },
  ];

  return (
    <div
      className="container mx-auto px-4 py-8"
      data-ocid="customer_dashboard.page"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome back, {welcomeName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your eco-friendly deliveries
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => navigate({ to: "/customer/place-order" })}
          data-ocid="customer_dashboard.new_order_button"
        >
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              data-ocid={`customer_dashboard.stat.${stat.label.toLowerCase().replace(/\s+/g, "_")}_card`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="font-display text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card data-ocid="customer_dashboard.recent_orders_card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-display text-lg">Recent Orders</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/customer/orders" })}
            data-ocid="customer_dashboard.view_all_orders_button"
          >
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayOrders.slice(0, 5).map((order, i) => (
                <button
                  key={order.id}
                  type="button"
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
                  onClick={() =>
                    navigate({
                      to: "/customer/track/$orderId",
                      params: { orderId: order.id },
                    })
                  }
                  data-ocid={`customer_dashboard.order.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {order.packageDescription}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {order.deliveryAddress}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <Badge className={`text-xs ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && displayOrders.length === 0 && (
            <div
              className="text-center py-10"
              data-ocid="customer_dashboard.orders_empty_state"
            >
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">
                No orders yet. Send your first parcel!
              </p>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/customer/place-order" })}
              >
                Place an order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eco Banner */}
      <Card
        className="mt-6 bg-primary/5 border-primary/20"
        data-ocid="customer_dashboard.eco_banner"
      >
        <CardContent className="pt-5 pb-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Your deliveries saved 4.2 kg of CO₂
            </p>
            <p className="text-xs text-muted-foreground">
              That's equivalent to planting 0.2 trees. Thank you for choosing
              green! 🌳
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0 text-primary">
            Zero Emissions
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
