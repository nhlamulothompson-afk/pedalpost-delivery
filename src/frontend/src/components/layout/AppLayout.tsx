import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bike,
  Briefcase,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  Package,
  Share2,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useState } from "react";

// Operator principal — update to actual operator if needed
const OPERATOR_PRINCIPAL = "2vxsx-fae";

export default function AppLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";
  const principalStr = identity?.getPrincipal().toText() ?? "";
  const shortPrincipal =
    principalStr.length > 8 ? `${principalStr.slice(0, 5)}...` : principalStr;
  const isOperator = principalStr === OPERATOR_PRINCIPAL;

  const isCustomer = currentPath.startsWith("/customer");
  const isRider = currentPath.startsWith("/rider");

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: "/" });
    } else {
      try {
        await login();
      } catch {
        // ignore
      }
    }
  };

  const customerNavLinks = [
    { path: "/customer", label: "Dashboard", icon: LayoutDashboard },
    { path: "/customer/place-order", label: "New Order", icon: Package },
    { path: "/customer/orders", label: "My Orders", icon: MapPin },
  ];

  const riderNavLinks = [
    { path: "/rider", label: "Dashboard", icon: LayoutDashboard },
    { path: "/rider/jobs", label: "Available Jobs", icon: Briefcase },
    { path: "/rider/earnings", label: "Earnings", icon: TrendingUp },
  ];

  const activeNav = isCustomer
    ? customerNavLinks
    : isRider
      ? riderNavLinks
      : [];

  // Global engagement links (always visible or conditionally visible)
  const globalLinks = [
    {
      path: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      alwaysShow: true,
    },
    { path: "/referral", label: "Referral", icon: Share2, requiresAuth: true },
    ...(isOperator
      ? [
          {
            path: "/operator",
            label: "Operator",
            icon: BarChart3,
            alwaysShow: true,
          },
        ]
      : []),
  ].filter((l) => l.alwaysShow || (l.requiresAuth && isAuthenticated));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            onClick={() => navigate({ to: "/" })}
            data-ocid="nav.home_link"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <Bike className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-lg text-foreground">
                PedalPost
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Leaf className="h-2.5 w-2.5 text-accent-foreground" /> Zero
                Emissions
              </span>
            </div>
          </button>

          {/* Desktop Nav — context + global combined */}
          <nav className="hidden md:flex items-center gap-1">
            {activeNav.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <Button
                  key={link.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate({ to: link.path as "/" })}
                  data-ocid={`nav.${link.label.toLowerCase().replace(/\s+/g, "_")}_link`}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {link.label}
                </Button>
              );
            })}

            {/* Separator between context nav and global links */}
            {activeNav.length > 0 && globalLinks.length > 0 && (
              <div className="w-px h-5 bg-border mx-1" />
            )}

            {globalLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <Button
                  key={link.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate({ to: link.path as "/" })}
                  data-ocid={`nav.${link.label.toLowerCase().replace(/\s+/g, "_")}_link`}
                  className={
                    link.path === "/operator"
                      ? "text-amber-600 hover:text-amber-700"
                      : ""
                  }
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {link.label}
                </Button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/rider" })}
                  data-ocid="nav.rider_link"
                >
                  Ride with us
                </Button>
              </div>
            )}

            {isAuthenticated && identity && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {shortPrincipal.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground">
                  {shortPrincipal}
                </span>
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                  {isOperator
                    ? "Operator"
                    : isCustomer
                      ? "Customer"
                      : isRider
                        ? "Rider"
                        : "User"}
                </Badge>
              </div>
            )}

            <Button
              variant={isAuthenticated ? "outline" : "default"}
              size="sm"
              onClick={handleAuth}
              disabled={isLoggingIn}
              data-ocid="nav.auth_button"
            >
              {isLoggingIn
                ? "Signing in..."
                : isAuthenticated
                  ? "Sign out"
                  : "Sign in"}
            </Button>

            {/* Mobile menu button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              data-ocid="nav.mobile_menu_button"
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 pb-3 pt-2 flex flex-col gap-1">
            {[...activeNav, ...globalLinks].map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <Button
                  key={link.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="justify-start w-full"
                  onClick={() => {
                    navigate({ to: link.path as "/" });
                    setMenuOpen(false);
                  }}
                  data-ocid={`nav.mobile_${link.label.toLowerCase().replace(/\s+/g, "_")}_link`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary">
              <Bike className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground text-sm">
              PedalPost
            </span>
            <span className="text-xs">
              · Zero emissions delivery, worldwide
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              type="button"
              className="hover:text-foreground transition-colors"
              onClick={() => navigate({ to: "/customer" })}
            >
              Send a Parcel
            </button>
            <button
              type="button"
              className="hover:text-foreground transition-colors"
              onClick={() => navigate({ to: "/rider" })}
            >
              Become a Rider
            </button>
            <button
              type="button"
              className="hover:text-foreground transition-colors"
              onClick={() => navigate({ to: "/leaderboard" })}
              data-ocid="footer.leaderboard_link"
            >
              Leaderboard
            </button>
            <button
              type="button"
              className="hover:text-foreground transition-colors"
              onClick={() => navigate({ to: "/referral" })}
              data-ocid="footer.referral_link"
            >
              Refer & Earn
            </button>
            <span>·</span>
            <span>
              © {new Date().getFullYear()}.{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
