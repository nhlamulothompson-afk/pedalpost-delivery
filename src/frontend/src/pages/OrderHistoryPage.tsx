import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Filter, Package, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useGetCustomerOrders } from "../hooks/useQueries";
import { type OrderStatus, STATUS_COLORS, STATUS_LABELS } from "../types";

const SAMPLE_ORDERS = [
  {
    id: "ord-001",
    pickupAddress: "12 Baker St, London",
    deliveryAddress: "45 Oxford Rd, London",
    packageDescription: "Important documents",
    packageWeight: "0-0.5kg",
    status: "delivered" as OrderStatus,
    createdAt: BigInt(Date.now() - 7200000),
    updatedAt: BigInt(Date.now() - 5400000),
    deliveryFee: BigInt(250),
    platformFee: BigInt(63),
    riderPayout: BigInt(187),
    customerId: "usr-001",
    estimatedTime: "Delivered",
  },
  {
    id: "ord-002",
    pickupAddress: "7 High St, London",
    deliveryAddress: "22 Victoria Ave, London",
    packageDescription: "Small gift parcel",
    packageWeight: "0.5-2kg",
    status: "pending" as OrderStatus,
    createdAt: BigInt(Date.now() - 1800000),
    updatedAt: BigInt(Date.now() - 900000),
    deliveryFee: BigInt(400),
    platformFee: BigInt(100),
    riderPayout: BigInt(300),
    customerId: "usr-001",
    estimatedTime: "25-35 min",
  },
  {
    id: "ord-003",
    pickupAddress: "3 Park Lane, London",
    deliveryAddress: "88 Green Rd, London",
    packageDescription: "Fragile ceramic vase",
    packageWeight: "2-5kg",
    status: "accepted" as OrderStatus,
    createdAt: BigInt(Date.now() - 3600000),
    updatedAt: BigInt(Date.now() - 1800000),
    deliveryFee: BigInt(650),
    platformFee: BigInt(163),
    riderPayout: BigInt(487),
    customerId: "usr-001",
    estimatedTime: "Rider en route",
  },
  {
    id: "ord-004",
    pickupAddress: "19 Queens Rd, London",
    deliveryAddress: "5 Kings Cross, London",
    packageDescription: "Laptop computer",
    packageWeight: "2-5kg",
    status: "delivered" as OrderStatus,
    createdAt: BigInt(Date.now() - 86400000),
    updatedAt: BigInt(Date.now() - 84600000),
    deliveryFee: BigInt(650),
    platformFee: BigInt(163),
    riderPayout: BigInt(487),
    customerId: "usr-001",
  },
  {
    id: "ord-005",
    pickupAddress: "66 Bond St, London",
    deliveryAddress: "14 Hyde Park, London",
    packageDescription: "Clothing bundle",
    packageWeight: "2-5kg",
    status: "cancelled" as OrderStatus,
    createdAt: BigInt(Date.now() - 172800000),
    updatedAt: BigInt(Date.now() - 172800000),
    deliveryFee: BigInt(650),
    platformFee: BigInt(163),
    riderPayout: BigInt(487),
    customerId: "usr-001",
  },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useGetCustomerOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const displayOrders = orders?.length ? orders : SAMPLE_ORDERS;

  const filtered = displayOrders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSearch =
      !search ||
      o.packageDescription.toLowerCase().includes(search.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8" data-ocid="order_history.page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            My Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            {displayOrders.length} orders total
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => navigate({ to: "/customer/place-order" })}
          data-ocid="order_history.new_order_button"
        >
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="order_history.search_input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            data-ocid="order_history.status_filter.tab"
          >
            <TabsList>
              {STATUS_FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Orders List */}
      <div
        className="flex flex-col gap-3"
        data-ocid="order_history.orders_list"
      >
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16"
            data-ocid="order_history.empty_state"
          >
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-foreground mb-2">
              No orders found
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Place your first eco-delivery!"}
            </p>
            <Button
              size="sm"
              onClick={() => navigate({ to: "/customer/place-order" })}
            >
              Place an Order
            </Button>
          </div>
        ) : (
          filtered.map((order, i) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              data-ocid={`order_history.order.item.${i + 1}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">
                        {order.packageDescription}
                      </span>
                      <Badge
                        className={`text-xs shrink-0 ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1 truncate">
                      {order.pickupAddress} → {order.deliveryAddress}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        R{(Number(order.deliveryFee) / 100).toFixed(2)} delivery
                      </span>
                      {(order.status === "pending" ||
                        order.status === "accepted" ||
                        order.status === "pickedUp") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-primary"
                          onClick={() =>
                            navigate({
                              to: "/customer/track/$orderId",
                              params: { orderId: order.id },
                            })
                          }
                          data-ocid={`order_history.track.item.${i + 1}`}
                        >
                          Track <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
