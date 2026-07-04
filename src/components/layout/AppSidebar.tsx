import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Landmark, Receipt,
  MessageSquare, BarChart3, Bell, Users, Settings,
  Package, Layers, Shield, HeartPulse,
  ChevronLeft, ChevronRight, LogOut, X, type LucideIcon,
  DollarSign,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { emailApi } from "@/lib/api";

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
  badge?: "email" | "static";
  badgeCount?: number;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Core",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", exact: true },
      { title: "Institutions", icon: Building2, href: "/tenants" },
      { title: "Banking Operations", icon: Landmark, href: "/operations" },
      { title: "Modules", icon: Package, href: "/modules" },
      { title: "Plans & Subscriptions", icon: Layers, href: "/plans" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { title: "Billing & Revenue", icon: Receipt, href: "/billing" },
      { title: "SMS Platform", icon: MessageSquare, href: "/sms" },
      { title: "Analytics", icon: BarChart3, href: "/analytics" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Finance Center", icon: DollarSign, href: "/accounting" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Security & Logs", icon: Shield, href: "/security" },
      { title: "System Health", icon: HeartPulse, href: "/system-health" },
      { title: "Notifications", icon: Bell, href: "/email", badge: "email" },
      { title: "System Users", icon: Users, href: "/users" },
      { title: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const isCompact = collapsed && !mobileOpen;

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["email-unread"],
    queryFn: () => emailApi.getUnreadCount(),
    refetchInterval: 60_000,
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
  });

  function isActive(item: NavItem): boolean {
    if (item.exact) return location.pathname === item.href;
    // Banking Operations hub should also be active for all child routes
    if (item.href === "/operations") {
      const opsPaths = [
        "/operations", "/vault-banking", "/settlement", "/transactions",
        "/fraud", "/compliance", "/bvn-nin", "/audit-logs",
        "/api-integrations", "/virtual-accounts", "/reports", "/developer", "/support",
      ];
      return opsPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
    }
    return location.pathname === item.href || location.pathname.startsWith(item.href + "/");
  }

  function getBadgeCount(item: NavItem): number {
    if (item.badge === "email") return unreadCount;
    return item.badgeCount ?? 0;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-white/[0.06] bg-[#0D1117] transition-all duration-300 ease-in-out",
        collapsed ? "lg:w-16" : "lg:w-64",
        mobileOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0",
        "w-72 lg:w-auto"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#080B14] px-4 shrink-0">
        {!isCompact ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-600/20 shrink-0">
              <span className="text-base font-black text-white">Q</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-slate-100">QuovaTech BOC</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Operations Center</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-600/20">
            <span className="text-base font-black text-white">Q</span>
          </div>
        )}
        <button
          onClick={onMobileClose}
          className="lg:hidden ml-auto p-1 rounded-md text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {!isCompact && (
              <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {section.label}
              </p>
            )}
            {isCompact && <div className="my-2 border-t border-white/[0.04]" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item);
                const badgeCount = getBadgeCount(item);
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onMobileClose}
                    title={isCompact ? item.title : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                      active
                        ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
                        : "text-slate-400 border border-transparent hover:bg-white/[0.04] hover:text-slate-100",
                      isCompact && "lg:justify-center lg:px-2"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!isCompact && <span className="flex-1 truncate">{item.title}</span>}
                    {!isCompact && badgeCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-400">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                    {isCompact && badgeCount > 0 && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:block border-t border-white/[0.06] p-2 shrink-0">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition-all"
        >
          {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Sign out */}
      <div className="border-t border-white/[0.06] p-2 shrink-0">
        <NavLink
          to="/"
          onClick={onMobileClose}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all",
            isCompact && "lg:justify-center lg:px-2"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!isCompact && <span>Sign Out</span>}
        </NavLink>
      </div>
    </aside>
  );
}
