import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import AppLayout from "./components/layout/AppLayout";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import HomePage from "./pages/HomePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import PlaceOrderPage from "./pages/PlaceOrderPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import RiderDashboardPage from "./pages/RiderDashboardPage";
import RiderEarningsPage from "./pages/RiderEarningsPage";
import RiderJobsPage from "./pages/RiderJobsPage";

const LeaderboardPage = lazy(() => import("./pages/LeaderboardsPage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const OperatorPage = lazy(() => import("./pages/OperatorPage"));

const rootRoute = createRootRoute({ component: AppLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const setupProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup-profile",
  component: ProfileSetupPage,
});

// Customer routes
const customerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer",
  component: () => <Outlet />,
});

const customerDashboardRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: "/",
  component: CustomerDashboardPage,
});

const placeOrderRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: "/place-order",
  component: PlaceOrderPage,
});

const orderHistoryRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: "/orders",
  component: OrderHistoryPage,
});

const orderTrackingRoute = createRoute({
  getParentRoute: () => customerLayoutRoute,
  path: "/track/$orderId",
  component: OrderTrackingPage,
});

// Rider routes
const riderLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rider",
  component: () => <Outlet />,
});

const riderDashboardRoute = createRoute({
  getParentRoute: () => riderLayoutRoute,
  path: "/",
  component: RiderDashboardPage,
});

const riderJobsRoute = createRoute({
  getParentRoute: () => riderLayoutRoute,
  path: "/jobs",
  component: RiderJobsPage,
});

const riderEarningsRoute = createRoute({
  getParentRoute: () => riderLayoutRoute,
  path: "/earnings",
  component: RiderEarningsPage,
});

// Engagement routes
const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: () => (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LeaderboardPage />
    </Suspense>
  ),
});

const referralRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/referral",
  component: () => (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ReferralPage />
    </Suspense>
  ),
});

const operatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator",
  component: () => (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <OperatorPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  setupProfileRoute,
  customerLayoutRoute.addChildren([
    customerDashboardRoute,
    placeOrderRoute,
    orderHistoryRoute,
    orderTrackingRoute,
  ]),
  riderLayoutRoute.addChildren([
    riderDashboardRoute,
    riderJobsRoute,
    riderEarningsRoute,
  ]),
  leaderboardRoute,
  referralRoute,
  operatorRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
