import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Package, CreditCard, Receipt,
  BarChart3, Shield, Users, Settings, ChevronLeft, ChevronRight,
  LogOut, HeartPulse, X, MessageSquare,
} from "lucide-react";

const navigationItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Tenants", icon: Building2, href: "/tenants" },
  { title: "Modules", icon: Package, href: "/modules" },
  { title: "Plans & Subscriptions", icon: CreditCard, href: "/plans" },
  { title: "Billing & Revenue", icon: Receipt, href: "/billing" },
  { title: "Analytics", icon: BarChart3, href: "/analytics" },
  { title: "SMS Management", icon: MessageSquare, href: "/sms" },
  { title: "Security & Logs", icon: Shield, href: "/security" },
  { title: "System Health", icon: HeartPulse, href: "/system-health" },
  { title: "System Users", icon: Users, href: "/users" },
  { title: "Settings", icon: Settings, href: "/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "lg:w-16" : "lg:w-64",
        mobileOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0",
        "w-72 lg:w-auto"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 shrink-0">
        {(!collapsed || mobileOpen) && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
              <span className="text-sm font-bold text-sidebar-primary-foreground">FC</span>
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground truncate">Fynix CoBank</span>
          </div>
        )}
        {collapsed && !mobileOpen && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-sm font-bold text-sidebar-primary-foreground">FC</span>
          </div>
        )}
        <button
          onClick={onMobileClose}
          className="lg:hidden ml-auto p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onMobileClose}
              className={cn(
                "nav-link",
                isActive ? "nav-link-active" : "nav-link-inactive",
                collapsed && !mobileOpen && "lg:justify-center lg:px-2"
              )}
              title={collapsed && !mobileOpen ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {(!collapsed || mobileOpen) && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle — desktop only */}
      <div className="hidden lg:block border-t border-sidebar-border p-3 shrink-0">
        <button
          onClick={onToggle}
          className="nav-link nav-link-inactive w-full justify-center"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>

      {/* Sign Out */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        <NavLink
          to="/"
          onClick={onMobileClose}
          className={cn("nav-link nav-link-inactive", collapsed && !mobileOpen && "lg:justify-center lg:px-2")}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span>Sign Out</span>}
        </NavLink>
      </div>
    </aside>
  );
}
