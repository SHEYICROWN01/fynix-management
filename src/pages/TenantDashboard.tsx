import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type {
  Tenant, TenantModule,
  TenantDashboardStats, TenantDashboardCustomer, TenantDashboardCustomersMeta,
  TenantDashboardActivityItem, TenantDashboardFlag,
  TenantDashboardSavings, TenantDashboardLoans, TenantDashboardAssets,
  TenantDashboardCooperatives, TenantDashboardInvestments, TenantDashboardServices,
} from "@/lib/api";
import { toast as showToast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Users, TrendingUp, DollarSign, CreditCard, Package,
  Activity, RefreshCw, Globe, Clock, Loader2, AlertTriangle, CheckCircle2,
  BarChart3, PiggyBank, Landmark, Wallet, FileText, ArrowUpRight,
  ArrowDownRight, Shield, Star, Zap, Download, Filter,
  Building2, AlertCircle, UserCheck, Receipt, Briefcase,
  Target, ChevronRight, TrendingDown, Layers, ChevronLeft,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-NG").format(n);
const fmtTime = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
const pct = (curr: number, prev: number) =>
  prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  title: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
  trend?: number; trendLabel?: string;
}
function StatCard({ title, value, sub, icon: Icon, color, trend, trendLabel }: StatCardProps) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="relative rounded-2xl border bg-card p-5 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-10 ${color}`} />
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        {trendLabel && <p className="text-xs text-muted-foreground mt-0.5">{trendLabel}</p>}
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode;
}
function SectionCard({ title, icon: Icon, children, action }: SectionCardProps) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    approved: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    disbursed: "bg-violet-500/10 text-violet-700 border-violet-500/20",
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    failed: "bg-red-500/10 text-red-700 border-red-500/20",
    rejected: "bg-red-500/10 text-red-700 border-red-500/20",
    overdue: "bg-red-500/10 text-red-700 border-red-500/20",
    inactive: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    suspended: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    matured: "bg-teal-500/10 text-teal-700 border-teal-500/20",
    withdrawn: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Sparkline({ values, color = "stroke-primary" }: { values: number[]; color?: string }) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80; const h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" className={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function SectionSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="h-8 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-2/3" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  );
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  savings: PiggyBank, loans: Landmark, assets: Briefcase,
  services: Zap, cooperatives: Users, investments: TrendingUp,
};
const MODULE_COLORS: Record<string, string> = {
  savings: "bg-emerald-500", loans: "bg-blue-500", assets: "bg-violet-500",
  services: "bg-orange-500", cooperatives: "bg-teal-500", investments: "bg-indigo-500",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const tid = Number(tenantId);

  // Core
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [modules, setModules] = useState<TenantModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dashboard sections
  const [stats, setStats] = useState<TenantDashboardStats | null>(null);
  const [savings, setSavings] = useState<TenantDashboardSavings | null>(null);
  const [loans, setLoans] = useState<TenantDashboardLoans | null>(null);
  const [assets, setAssets] = useState<TenantDashboardAssets | null>(null);
  const [cooperatives, setCooperatives] = useState<TenantDashboardCooperatives | null>(null);
  const [investments, setInvestments] = useState<TenantDashboardInvestments | null>(null);
  const [services, setServices] = useState<TenantDashboardServices | null>(null);
  const [activity, setActivity] = useState<TenantDashboardActivityItem[]>([]);
  const [flags, setFlags] = useState<TenantDashboardFlag[]>([]);

  // Customers
  const [customers, setCustomers] = useState<TenantDashboardCustomer[]>([]);
  const [customersMeta, setCustomersMeta] = useState<TenantDashboardCustomersMeta | null>(null);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI
  const [activeTab, setActiveTab] = useState("overview");
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingFlagId, setResolvingFlagId] = useState<number | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadAll = useCallback(async (refresh = false) => {
    if (!tid) return;
    try {
      if (refresh) setIsRefreshing(true); else setIsLoading(true);

      const [tenantResult, modulesResult] = await Promise.allSettled([
        api.getTenant(tid),
        api.getTenantModules(tid),
      ]);

      if (tenantResult.status === "rejected") throw tenantResult.reason;
      const t = tenantResult.value.data;
      const mods: TenantModule[] = modulesResult.status === "fulfilled"
        ? (modulesResult.value.data || [])
        : [];

      setTenant(t);
      setModules(mods);

      // Load all sections in parallel — each failure is isolated
      const [statsR, savR, loanR, assR, coopR, invR, servR, actR, flagR] = await Promise.allSettled([
        api.getTenantDashboardStats(tid),
        api.getTenantDashboardSavings(tid),
        api.getTenantDashboardLoans(tid),
        api.getTenantDashboardAssets(tid),
        api.getTenantDashboardCooperatives(tid),
        api.getTenantDashboardInvestments(tid),
        api.getTenantDashboardServices(tid),
        api.getTenantDashboardActivity(tid, { limit: 20 }),
        api.getTenantDashboardFlags(tid, { resolved: false }),
      ]);

      if (statsR.status === "fulfilled") setStats(statsR.value.data);
      if (savR.status === "fulfilled") setSavings(savR.value.data);
      if (loanR.status === "fulfilled") setLoans(loanR.value.data);
      if (assR.status === "fulfilled") setAssets(assR.value.data);
      if (coopR.status === "fulfilled") setCooperatives(coopR.value.data);
      if (invR.status === "fulfilled") setInvestments(invR.value.data);
      if (servR.status === "fulfilled") setServices(servR.value.data);
      if (actR.status === "fulfilled") setActivity(actR.value.data);
      if (flagR.status === "fulfilled") setFlags(flagR.value.data);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast.error("Failed to load tenant", { description: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tid]);

  const loadFlags = useCallback(async (resolved: boolean) => {
    if (!tid) return;
    try {
      const res = await api.getTenantDashboardFlags(tid, { resolved });
      setFlags(res.data);
    } catch {
      showToast.error("Failed to reload flags");
    }
  }, [tid]);

  const loadCustomers = useCallback(async (page: number, search: string) => {
    if (!tid) return;
    setCustomerLoading(true);
    try {
      const res = await api.getTenantDashboardCustomers(tid, { page, per_page: 20, search: search || undefined });
      setCustomers(res.data.data);
      setCustomersMeta(res.data.meta);
      setCustomersLoaded(true);
    } catch {
      showToast.error("Failed to load customers");
    } finally {
      setCustomerLoading(false);
    }
  }, [tid]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (activeTab === "customers" && !customersLoaded) {
      loadCustomers(1, "");
    }
  }, [activeTab, customersLoaded, loadCustomers]);

  const handleSearchChange = (value: string) => {
    setCustomerSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setCustomerPage(1);
      loadCustomers(1, value);
    }, 350);
  };

  const handlePageChange = (page: number) => {
    setCustomerPage(page);
    loadCustomers(page, customerSearch);
  };

  const handleToggleResolved = () => {
    const next = !showResolved;
    setShowResolved(next);
    loadFlags(next);
  };

  const handleResolveFlag = async (flagId: number) => {
    setResolvingFlagId(flagId);
    try {
      await api.resolveTenantDashboardFlag(tid, flagId);
      showToast.success("Flag resolved");
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, resolved: true } : f));
    } catch {
      showToast.error("Failed to resolve flag");
    } finally {
      setResolvingFlagId(null);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout title="Tenant Dashboard">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading tenant dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout title="Tenant Dashboard">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="font-medium">Tenant not found</p>
          <Button onClick={() => navigate("/tenants")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const customerGrowth = stats ? pct(stats.new_customers_this_month, stats.new_customers_last_month) : 0;
  const openFlags = flags.filter(f => !f.resolved);
  const highFlags = openFlags.filter(f => f.severity === "high").length;

  const totalAUM = (stats?.total_savings_balance ?? 0)
    + (investments?.total_invested ?? 0)
    + (cooperatives?.total_contributions ?? 0);

  const hasSavings = modules.some(m => m.module_slug === "savings" && m.is_active) || (savings?.total_accounts ?? 0) > 0;
  const hasLoans = modules.some(m => m.module_slug === "loans" && m.is_active) || (loans?.active_loans ?? 0) > 0;
  const hasAssets = modules.some(m => ["asset-finance", "assets-loan"].includes(m.module_slug) && m.is_active) || (assets?.total_assets ?? 0) > 0;
  const hasCoops = modules.some(m => m.module_slug === "cooperatives" && m.is_active) || (cooperatives?.total_groups ?? 0) > 0;
  const hasInvestments = modules.some(m => m.module_slug === "investment" && m.is_active) || (investments?.total_portfolios ?? 0) > 0;
  const hasServices = modules.some(m => ["services", "service"].includes(m.module_slug) && m.is_active) || (services?.total_transactions ?? 0) > 0;

  const brandBg = tenant.branding
    ? `linear-gradient(135deg, ${tenant.branding.primary_color} 0%, ${tenant.branding.accent_color} 100%)`
    : undefined;
  const logoUrl: string | undefined = (tenant as Tenant & { logo_url?: string }).logo_url ?? tenant.logo ?? undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title={`${tenant.name} — Dashboard`}>
      <div className="space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/tenants")} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="h-4 w-px bg-border" />
          <p className="text-sm text-muted-foreground truncate">
            Tenants <ChevronRight className="inline h-3 w-3 mx-1" />
            <span className="font-medium text-foreground">{tenant.name}</span>
          </p>
        </div>

        {/* Hero Banner */}
        <div
          className="relative rounded-2xl overflow-hidden px-6 py-6 text-white"
          style={{ background: brandBg ?? "linear-gradient(135deg, #0A2540 0%, #1a4a7a 50%, #4F9CF9 100%)" }}
        >
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute top-4 right-48 h-16 w-16 rounded-full bg-white/5" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
              {logoUrl
                ? <img src={logoUrl} alt={tenant.name} className="h-full w-full object-contain p-1" />
                : <span className="text-2xl font-black text-white">{tenant.name.slice(0, 2).toUpperCase()}</span>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white">{tenant.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tenant.status === "active" ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" : "bg-red-500/20 text-red-200 border-red-400/30"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${tenant.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                  {tenant.status.toUpperCase()}
                </span>
                {highFlags > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-200 border border-red-400/30">
                    <AlertTriangle className="h-3 w-3" /> {highFlags} HIGH ALERT{highFlags > 1 ? "S" : ""}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-white/70 text-sm">
                  <Globe className="h-3.5 w-3.5" /> {tenant.subdomain}.fynixcobanking.com
                </span>
                {tenant.institution_code && (
                  <span className="flex items-center gap-1.5 text-white/70 text-sm font-mono">
                    <Shield className="h-3.5 w-3.5" /> {tenant.institution_code}
                  </span>
                )}
                {stats && (
                  <span className="flex items-center gap-1.5 text-white/70 text-sm">
                    <Building2 className="h-3.5 w-3.5" /> {stats.total_branches} branch{stats.total_branches !== 1 ? "es" : ""} · {stats.total_staff} staff
                  </span>
                )}
                {stats?.last_activity_at && (
                  <span className="flex items-center gap-1.5 text-white/70 text-sm">
                    <Clock className="h-3.5 w-3.5" /> Last active {fmtTime(stats.last_activity_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 shrink-0 flex-wrap">
              {([
                { label: "Customers", value: stats ? fmtNum(stats.total_customers) : "—" },
                { label: "AUM", value: totalAUM > 0 ? fmt(totalAUM) : "—" },
                { label: "Modules", value: String(modules.filter(m => m.is_active).length) },
                { label: "Flags", value: String(openFlags.length) },
              ] as Array<{ label: string; value: string }>).map(({ label, value }) => (
                <div key={label} className="text-center px-4 py-2 rounded-xl bg-white/10 border border-white/15">
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => loadAll(true)} disabled={isRefreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold">
                <Download className="h-4 w-4 mr-1.5" /> Export
              </Button>
            </div>
          </div>
        </div>

        {/* Top KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats ? (
            <>
              <StatCard title="Total Customers" value={fmtNum(stats.total_customers)} icon={Users} color="bg-blue-500"
                trend={customerGrowth} trendLabel={`${stats.new_customers_this_month} new this month`} />
              <StatCard title="Assets Under Mgmt" value={fmt(totalAUM)} sub="Savings + Investments + Coops"
                icon={Wallet} color="bg-violet-500" />
              <StatCard title="Txn Volume (Month)" value={fmt(stats.transaction_volume_this_month)}
                icon={Activity} color="bg-emerald-500" trend={12}
                trendLabel={`${fmtNum(stats.total_transactions)} total`} />
              <StatCard title="Open Risk Flags" value={String(openFlags.length)}
                sub={`${highFlags} high severity`} icon={AlertTriangle}
                color={highFlags > 0 ? "bg-red-500" : "bg-orange-500"} />
            </>
          ) : (
            [1, 2, 3, 4].map(i => <SectionSkeleton key={i} />)
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            {([
              { value: "overview", icon: BarChart3, label: "Overview" },
              { value: "customers", icon: Users, label: "Customers" },
              ...(hasSavings ? [{ value: "savings", icon: PiggyBank, label: "Savings" }] : []),
              ...(hasLoans ? [{ value: "loans", icon: Landmark, label: "Loans" }] : []),
              ...(hasAssets ? [{ value: "assets", icon: Briefcase, label: "Asset Finance" }] : []),
              ...(hasCoops ? [{ value: "cooperatives", icon: Users, label: "Cooperatives" }] : []),
              ...(hasInvestments ? [{ value: "investments", icon: TrendingUp, label: "Investments" }] : []),
              ...(hasServices ? [{ value: "services", icon: Zap, label: "Services" }] : []),
              { value: "risk", icon: Shield, label: `Risk${openFlags.length ? ` (${openFlags.length})` : ""}` },
              { value: "modules", icon: Package, label: "Modules" },
            ] as Array<{ value: string; icon: React.ElementType; label: string }>).map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <t.icon className="h-3.5 w-3.5 mr-1.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {stats ? (
                <SectionCard title="Financial Snapshot" icon={DollarSign}>
                  <div className="space-y-0">
                    {([
                      { label: "Total Savings Balance", value: fmt(stats.total_savings_balance), sub: `${savings ? fmtNum(savings.total_accounts) : "—"} accounts`, color: "text-emerald-600" },
                      { label: "Total Loans Outstanding", value: fmt(loans?.outstanding_balance ?? 0), sub: `${loans ? fmtNum(loans.active_loans) : "—"} active loans`, color: "text-blue-600" },
                      { label: "Investments Portfolio", value: fmt(investments?.total_invested ?? 0), sub: `${investments ? fmtNum(investments.total_portfolios) : "—"} portfolios`, color: "text-indigo-600" },
                      { label: "Deposits This Month", value: fmt(stats.total_deposits), color: "text-violet-600" },
                      { label: "Withdrawals This Month", value: fmt(stats.total_withdrawals), color: "text-orange-600" },
                      { label: "Revenue This Month", value: fmt(stats.revenue_this_month), color: "text-primary" },
                    ] as Array<{ label: string; value: string; sub?: string; color: string }>).map(row => (
                      <div key={row.label} className="flex items-center justify-between py-2.5 border-b last:border-0">
                        <div>
                          <p className="text-sm text-muted-foreground">{row.label}</p>
                          {row.sub && <p className="text-[10px] text-muted-foreground/70">{row.sub}</p>}
                        </div>
                        <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ) : <SectionSkeleton />}

              {stats ? (
                <SectionCard title="Customer Activity" icon={UserCheck}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { label: "Total", value: fmtNum(stats.total_customers), color: "text-foreground" },
                        { label: "Active", value: fmtNum(stats.active_customers), color: "text-emerald-600" },
                        { label: "New This Month", value: fmtNum(stats.new_customers_this_month), color: "text-blue-600" },
                        { label: "Suspended", value: fmtNum(stats.suspended_customers), color: "text-orange-600" },
                      ] as Array<{ label: string; value: string; color: string }>).map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl bg-muted/40 p-3 text-center">
                          <p className={`text-xl font-bold ${color}`}>{value}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Customer Growth Rate</span>
                        <span className={customerGrowth >= 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                          {customerGrowth >= 0 ? "+" : ""}{customerGrowth}% MoM
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all"
                          style={{ width: `${Math.min(Math.abs(customerGrowth) * 2, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Active rate</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {stats.total_customers > 0 ? Math.round((stats.active_customers / stats.total_customers) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Avg Savings / Customer</span>
                      <span className="text-sm font-bold">
                        {stats.total_customers > 0 ? fmt(stats.total_savings_balance / stats.total_customers) : "—"}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              ) : <SectionSkeleton />}
            </div>

            {/* AUM by Module */}
            <SectionCard title="Assets Under Management by Module" icon={Layers}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {([
                  { label: "Savings", value: stats?.total_savings_balance ?? 0, color: "bg-emerald-500", icon: PiggyBank, active: hasSavings },
                  { label: "Loans Out", value: loans?.outstanding_balance ?? 0, color: "bg-blue-500", icon: Landmark, active: hasLoans },
                  { label: "Investments", value: investments?.total_invested ?? 0, color: "bg-indigo-500", icon: TrendingUp, active: hasInvestments },
                  { label: "Cooperatives", value: cooperatives?.total_contributions ?? 0, color: "bg-teal-500", icon: Users, active: hasCoops },
                  { label: "Asset Finance", value: assets?.total_financed ?? 0, color: "bg-violet-500", icon: Briefcase, active: hasAssets },
                  { label: "Services Vol.", value: services?.total_volume ?? 0, color: "bg-orange-500", icon: Zap, active: hasServices },
                ] as Array<{ label: string; value: number; color: string; icon: React.ElementType; active: boolean }>)
                  .filter(m => m.active)
                  .map(m => (
                    <div key={m.label} className="rounded-xl border p-4 space-y-2 hover:border-primary/30 transition-colors">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${m.color}`}>
                        <m.icon className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-base font-bold leading-tight">{fmt(m.value)}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
              </div>
            </SectionCard>

            {/* Live Activity Feed */}
            <SectionCard title="Live Activity Feed" icon={Activity}
              action={<Badge variant="secondary">{activity.length} events</Badge>}>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-0">
                  {activity.map(item => {
                    const ModIcon = MODULE_ICONS[item.module] ?? Activity;
                    const modColor = MODULE_COLORS[item.module] ?? "bg-gray-400";
                    return (
                      <div key={`${item.module}-${item.id}`} className="flex items-center gap-3 py-3 border-b last:border-0 hover:bg-muted/20 -mx-5 px-5 transition-colors">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${modColor}`}>
                          <ModIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{item.type} · {item.module}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{fmt(item.amount)}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtTime(item.created_at)}</p>
                        </div>
                        <StatusPill status={item.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* ── CUSTOMERS ────────────────────────────────────────────────────── */}
          <TabsContent value="customers" className="mt-5 space-y-5">
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Registered" value={fmtNum(stats.total_customers)} icon={Users} color="bg-blue-500" />
                <StatCard title="Active" value={fmtNum(stats.active_customers)} icon={CheckCircle2} color="bg-emerald-500" trend={customerGrowth} />
                <StatCard title="New This Month" value={fmtNum(stats.new_customers_this_month)} icon={Star} color="bg-violet-500" />
                <StatCard title="Avg Savings Balance" value={stats.total_customers > 0 ? fmt(stats.total_savings_balance / stats.total_customers) : "—"} icon={Wallet} color="bg-orange-500" />
              </div>
            ) : null}

            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Customer List</h3>
                  {customersMeta && <Badge variant="secondary">{fmtNum(customersMeta.total)}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      placeholder="Search by name, email, account..."
                      value={customerSearch}
                      onChange={e => handleSearchChange(e.target.value)}
                      className="h-8 pl-8 pr-3 rounded-lg border bg-background text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Export
                  </Button>
                </div>
              </div>

              {customerLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading customers...</span>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/10">
                          {["Customer", "Account No.", "Phone", "Savings", "Loan Balance", "Investments", "Status", "Risk", "Last Active"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {customers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                              {customerSearch ? "No customers match your search" : "No customers found"}
                            </td>
                          </tr>
                        ) : customers.map(c => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-primary">{c.name.slice(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm whitespace-nowrap">{c.name}</p>
                                  <p className="text-xs text-muted-foreground">{c.email ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.account_number ?? "—"}</code>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{c.phone ?? "—"}</td>
                            <td className="px-4 py-3.5">
                              <p className="text-sm font-semibold text-emerald-600">{fmt(c.savings_balance)}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              {c.loan_balance > 0
                                ? <p className="text-sm font-semibold text-blue-600">{fmt(c.loan_balance)}</p>
                                : <p className="text-xs text-muted-foreground">—</p>}
                            </td>
                            <td className="px-4 py-3.5">
                              {c.investment_balance > 0
                                ? <p className="text-sm font-semibold text-indigo-600">{fmt(c.investment_balance)}</p>
                                : <p className="text-xs text-muted-foreground">—</p>}
                            </td>
                            <td className="px-4 py-3.5"><StatusPill status={c.status} /></td>
                            <td className="px-4 py-3.5 text-center">
                              {c.risk_flags > 0
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                                  <AlertCircle className="h-3 w-3" /> {c.risk_flags}
                                </span>
                                : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                              {c.last_active_at ? fmtTime(c.last_active_at) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {customersMeta && customersMeta.last_page > 1 && (
                    <div className="flex items-center justify-between border-t px-5 py-3">
                      <p className="text-xs text-muted-foreground">
                        Page {customersMeta.current_page} of {customersMeta.last_page} · {fmtNum(customersMeta.total)} total
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                          disabled={customerPage <= 1}
                          onClick={() => handlePageChange(customerPage - 1)}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: Math.min(5, customersMeta.last_page) }, (_, i) => {
                          const page = Math.max(1, Math.min(customersMeta.last_page - 4, customerPage - 2)) + i;
                          return (
                            <Button key={page} variant={page === customerPage ? "default" : "outline"} size="sm"
                              className="h-7 w-7 p-0 text-xs"
                              onClick={() => handlePageChange(page)}>
                              {page}
                            </Button>
                          );
                        })}
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                          disabled={customerPage >= customersMeta.last_page}
                          onClick={() => handlePageChange(customerPage + 1)}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ── SAVINGS ──────────────────────────────────────────────────────── */}
          {hasSavings && (
            <TabsContent value="savings" className="mt-5 space-y-5">
              {savings ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Accounts" value={fmtNum(savings.total_accounts)} icon={PiggyBank} color="bg-emerald-500" />
                    <StatCard title="Active Accounts" value={fmtNum(savings.active_accounts)} icon={CheckCircle2} color="bg-blue-500" />
                    <StatCard title="Total Balance" value={fmt(savings.total_balance)} icon={DollarSign} color="bg-violet-500" />
                    <StatCard title="New This Month" value={fmtNum(savings.new_accounts_this_month)} icon={Star} color="bg-orange-500" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <SectionCard title="Deposit vs Withdrawal — This Month" icon={TrendingUp}>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Deposits</span>
                            <span className="font-bold text-emerald-600">{fmt(savings.deposits_this_month)}</span>
                          </div>
                          <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                              style={{ width: `${savings.deposits_this_month + savings.withdrawals_this_month > 0 ? (savings.deposits_this_month / (savings.deposits_this_month + savings.withdrawals_this_month)) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Withdrawals</span>
                            <span className="font-bold text-orange-600">{fmt(savings.withdrawals_this_month)}</span>
                          </div>
                          <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                              style={{ width: `${savings.deposits_this_month + savings.withdrawals_this_month > 0 ? (savings.withdrawals_this_month / (savings.deposits_this_month + savings.withdrawals_this_month)) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">Net Flow</span>
                          <span className={`text-sm font-bold ${savings.deposits_this_month >= savings.withdrawals_this_month ? "text-emerald-600" : "text-red-500"}`}>
                            {savings.deposits_this_month >= savings.withdrawals_this_month ? "+" : ""}
                            {fmt(savings.deposits_this_month - savings.withdrawals_this_month)}
                          </span>
                        </div>
                        {savings.weekly_deposits.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">7-Day Deposit Trend</p>
                            <Sparkline values={savings.weekly_deposits} color="stroke-emerald-500" />
                          </div>
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard title="Top Savings Products" icon={Star}>
                      <div className="space-y-4">
                        {savings.top_products.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                        ) : savings.top_products.map((p, i) => {
                          const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-teal-500"];
                          return (
                            <div key={p.name} className="flex items-center gap-3">
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${colors[i % colors.length]}`}>{i + 1}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium truncate">{p.name}</p>
                                  <p className="text-sm font-bold shrink-0 ml-2">{fmt(p.balance)}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className={`h-full rounded-full ${colors[i % colors.length]}`}
                                      style={{ width: `${savings.total_accounts > 0 ? (p.count / savings.total_accounts) * 100 : 0}%` }} />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{p.count} accounts</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </SectionCard>
                  </div>

                  {savings.recent_transactions.length > 0 && (
                    <SectionCard title="Recent Savings Transactions" icon={Activity}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {["Customer", "Type", "Amount", "Status", "Time"].map(h => (
                              <th key={h} className={`pb-3 text-xs font-semibold text-muted-foreground uppercase ${h === "Amount" ? "text-right" : h === "Status" || h === "Time" ? "text-center" : "text-left"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {savings.recent_transactions.map(t => (
                            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="py-3 font-medium">{t.customer_name}</td>
                              <td className="py-3 text-muted-foreground">{t.type}</td>
                              <td className="py-3 text-right font-bold">{fmt(t.amount)}</td>
                              <td className="py-3 text-center"><StatusPill status={t.status} /></td>
                              <td className="py-3 text-center text-xs text-muted-foreground">{fmtTime(t.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </SectionCard>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SectionSkeleton key={i} />)}</div>
              )}
            </TabsContent>
          )}

          {/* ── LOANS ────────────────────────────────────────────────────────── */}
          {hasLoans && (
            <TabsContent value="loans" className="mt-5 space-y-5">
              {loans ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Active Loans" value={fmtNum(loans.active_loans)} icon={Landmark} color="bg-blue-500" />
                    <StatCard title="Disbursed Amount" value={fmt(loans.disbursed_amount)} icon={DollarSign} color="bg-emerald-500" />
                    <StatCard title="Outstanding Balance" value={fmt(loans.outstanding_balance)} icon={CreditCard} color="bg-violet-500" />
                    <StatCard title="Overdue Loans" value={fmtNum(loans.overdue_loans)} sub={fmt(loans.overdue_amount)} icon={AlertTriangle} color="bg-red-500" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-semibold">NPL Ratio</p>
                      </div>
                      <p className="text-4xl font-black text-orange-600">{loans.npl_ratio.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Non-performing loans</p>
                      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${loans.npl_ratio < 5 ? "bg-emerald-500" : loans.npl_ratio < 10 ? "bg-orange-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(loans.npl_ratio * 5, 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {loans.npl_ratio < 5 ? "Healthy" : loans.npl_ratio < 10 ? "Watch closely" : "Critical"}
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-blue-500" />
                        <p className="text-sm font-semibold">Loan-to-Deposit Ratio</p>
                      </div>
                      <p className="text-4xl font-black text-blue-600">{loans.loan_to_deposit_ratio.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Of savings deployed as loans</p>
                      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${loans.loan_to_deposit_ratio < 70 ? "bg-blue-500" : loans.loan_to_deposit_ratio < 85 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(loans.loan_to_deposit_ratio, 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {loans.loan_to_deposit_ratio < 70 ? "Optimal liquidity" : "Monitor closely"}
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <p className="text-sm font-semibold">Repayments This Month</p>
                      </div>
                      <p className="text-3xl font-black text-emerald-600">{fmt(loans.repayments_this_month)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Collected from borrowers</p>
                      <div className="mt-4 flex items-center justify-between text-xs border-t pt-3">
                        <span className="text-muted-foreground">Pipeline</span>
                        <div className="flex gap-2">
                          <span className="font-semibold text-blue-600">{loans.total_applications} apps</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-semibold text-emerald-600">{loans.approved_loans} approved</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <SectionCard title="Recent Applications" icon={FileText}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {["Applicant", "Product", "Amount", "Status", "Date"].map(h => (
                              <th key={h} className={`pb-3 text-xs font-semibold text-muted-foreground uppercase ${h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {loans.recent_applications.map(a => (
                            <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="py-3 font-medium whitespace-nowrap">{a.applicant_name}</td>
                              <td className="py-3 text-muted-foreground text-xs">{a.product}</td>
                              <td className="py-3 text-right font-bold">{fmt(a.amount)}</td>
                              <td className="py-3 text-center"><StatusPill status={a.status} /></td>
                              <td className="py-3 text-xs text-muted-foreground">{fmtTime(a.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </SectionCard>

                    <SectionCard title="Overdue Loans" icon={TrendingDown}
                      action={<Badge variant="destructive">{loans.overdue_loans} overdue</Badge>}>
                      <div className="space-y-0">
                        {loans.overdue_list.length === 0 ? (
                          <div className="py-8 text-center">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                            <p className="text-sm text-muted-foreground">No overdue loans</p>
                          </div>
                        ) : loans.overdue_list.map((o, i) => (
                          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div>
                              <p className="text-sm font-medium">{o.name}</p>
                              <p className="text-xs text-muted-foreground">{o.product}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-600">{fmt(o.amount)}</p>
                              <p className="text-[10px] text-red-500 font-medium">{o.days_overdue} days overdue</p>
                            </div>
                          </div>
                        ))}
                        {loans.overdue_list.length > 0 && (
                          <div className="pt-3 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Total overdue amount</span>
                            <span className="font-bold text-red-600">{fmt(loans.overdue_amount)}</span>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SectionSkeleton key={i} />)}</div>
              )}
            </TabsContent>
          )}

          {/* ── ASSET FINANCE ─────────────────────────────────────────────────── */}
          {hasAssets && (
            <TabsContent value="assets" className="mt-5 space-y-5">
              {assets ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Assets" value={fmtNum(assets.total_assets)} icon={Briefcase} color="bg-blue-500" />
                    <StatCard title="Active Leases" value={fmtNum(assets.active_leases)} icon={CheckCircle2} color="bg-emerald-500" />
                    <StatCard title="Total Financed" value={fmt(assets.total_financed)} icon={DollarSign} color="bg-violet-500" />
                    <StatCard title="Overdue" value={fmtNum(assets.overdue_count)} sub={fmt(assets.overdue_amount)} icon={AlertTriangle} color="bg-red-500" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {assets.asset_types.length > 0 && (
                      <SectionCard title="Asset Type Breakdown" icon={Layers}>
                        <div className="space-y-3">
                          {assets.asset_types.map(t => (
                            <div key={t.type}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{t.type}</span>
                                <span className="text-sm font-bold">{fmt(t.value)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-violet-500"
                                    style={{ width: `${assets.total_financed > 0 ? (t.value / assets.total_financed) * 100 : 0}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground w-12 text-right">{t.count} units</span>
                              </div>
                            </div>
                          ))}
                          <div className="pt-3 border-t flex justify-between text-xs text-muted-foreground">
                            <span>Outstanding balance</span>
                            <span className="font-bold text-foreground">{fmt(assets.outstanding_balance)}</span>
                          </div>
                        </div>
                      </SectionCard>
                    )}

                    <SectionCard title="Recent Asset Records" icon={Receipt}>
                      <div className="space-y-0">
                        {assets.recent.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">No records found</p>
                        ) : assets.recent.map(a => (
                          <div key={a.id} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div>
                              <p className="text-sm font-medium">{a.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{a.asset_type} · {fmtTime(a.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{fmt(a.amount)}</p>
                              <StatusPill status={a.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SectionSkeleton key={i} />)}</div>
              )}
            </TabsContent>
          )}

          {/* ── COOPERATIVES ──────────────────────────────────────────────────── */}
          {hasCoops && (
            <TabsContent value="cooperatives" className="mt-5 space-y-5">
              {cooperatives ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard title="Total Groups" value={fmtNum(cooperatives.total_groups)} icon={Users} color="bg-blue-500" />
                    <StatCard title="Total Members" value={fmtNum(cooperatives.total_members)} icon={UserCheck} color="bg-violet-500" />
                    <StatCard title="Contributions" value={fmt(cooperatives.total_contributions)} icon={PiggyBank} color="bg-emerald-500" />
                    <StatCard title="Total Payouts" value={fmt(cooperatives.total_payouts)} icon={DollarSign} color="bg-orange-500" />
                    <StatCard title="Active Cycles" value={fmtNum(cooperatives.active_cycles)} icon={Activity} color="bg-teal-500" trendLabel={`${cooperatives.completed_cycles} completed`} />
                  </div>

                  <SectionCard title="Cooperative Groups" icon={Users}
                    action={<Badge variant="secondary">{cooperatives.total_groups} groups</Badge>}>
                    {cooperatives.groups.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No groups found</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {["Group Name", "Members", "Contributions", "Payouts", "Cycle Ends", "Status"].map(h => (
                              <th key={h} className={`pb-3 text-xs font-semibold text-muted-foreground uppercase ${["Contributions", "Payouts"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cooperatives.groups.map(g => (
                            <tr key={g.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="py-3 font-medium">{g.name}</td>
                              <td className="py-3 text-muted-foreground">{g.members}</td>
                              <td className="py-3 text-right font-bold text-emerald-600">{fmt(g.contributions)}</td>
                              <td className="py-3 text-right font-bold">{fmt(g.payout)}</td>
                              <td className="py-3 text-xs text-muted-foreground">{fmtDate(g.cycle_end)}</td>
                              <td className="py-3"><StatusPill status={g.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </SectionCard>
                </>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map(i => <SectionSkeleton key={i} />)}</div>
              )}
            </TabsContent>
          )}

          {/* ── INVESTMENTS ───────────────────────────────────────────────────── */}
          {hasInvestments && (
            <TabsContent value="investments" className="mt-5 space-y-5">
              {investments ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard title="Portfolios" value={fmtNum(investments.total_portfolios)} icon={BarChart3} color="bg-blue-500" />
                    <StatCard title="Total Invested" value={fmt(investments.total_invested)} icon={DollarSign} color="bg-violet-500" />
                    <StatCard title="Total Returns" value={fmt(investments.total_returns)} icon={TrendingUp} color="bg-emerald-500" />
                    <StatCard title="Avg ROI" value={`${investments.roi_percentage.toFixed(1)}%`} icon={Target} color="bg-orange-500" />
                    <StatCard title="Active Plans" value={fmtNum(investments.active_plans)} icon={Activity} color="bg-teal-500" trendLabel={`${investments.matured_plans} matured`} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {investments.plan_breakdown.length > 0 && (
                      <SectionCard title="Plan Breakdown" icon={Layers}>
                        <div className="space-y-3">
                          {investments.plan_breakdown.map(p => (
                            <div key={p.name}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{p.name}</span>
                                <span className="text-sm font-bold">{fmt(p.amount)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-indigo-500"
                                    style={{ width: `${investments.total_invested > 0 ? (p.amount / investments.total_invested) * 100 : 0}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground w-14 text-right">{p.count} plans</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    <SectionCard title="Active Investment Plans" icon={FileText}>
                      <div className="space-y-0">
                        {investments.plans.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">No plans found</p>
                        ) : investments.plans.map(p => (
                          <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                            <div>
                              <p className="text-sm font-medium">{p.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{p.plan_name} · matures {fmtDate(p.maturity_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{fmt(p.amount)}</p>
                              <p className="text-[10px] text-emerald-600 font-semibold">+{fmt(p.returns)} ({p.roi.toFixed(2)}%)</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map(i => <SectionSkeleton key={i} />)}</div>
              )}
            </TabsContent>
          )}

          {/* ── SERVICES ──────────────────────────────────────────────────────── */}
          {hasServices && (
            <TabsContent value="services" className="mt-5 space-y-5">
              {services ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Transactions" value={fmtNum(services.total_transactions)} icon={Activity} color="bg-blue-500" />
                    <StatCard title="Total Volume" value={fmt(services.total_volume)} icon={DollarSign} color="bg-emerald-500" />
                    <StatCard title="Bills Payments" value={fmt(services.bills_volume)} icon={Receipt} color="bg-violet-500" />
                    <StatCard title="Fund Transfers" value={fmt(services.transfers_volume)} icon={Wallet} color="bg-orange-500" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <SectionCard title="Channel Volume Breakdown" icon={Zap}>
                      <div className="space-y-3">
                        {([
                          { label: "Airtime Top-up", value: services.airtime_volume, color: "bg-blue-500" },
                          { label: "Data Bundles", value: services.data_volume, color: "bg-violet-500" },
                          { label: "Bill Payments", value: services.bills_volume, color: "bg-emerald-500" },
                          { label: "Fund Transfers", value: services.transfers_volume, color: "bg-orange-500" },
                        ] as Array<{ label: string; value: number; color: string }>).map(c => (
                          <div key={c.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-muted-foreground">{c.label}</span>
                              <span className="text-sm font-bold">{fmt(c.value)}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${c.color}`}
                                style={{ width: `${services.total_volume > 0 ? (c.value / services.total_volume) * 100 : 0}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {services.total_volume > 0 ? Math.round((c.value / services.total_volume) * 100) : 0}% of total
                            </p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard title="Daily Transaction Trend (Last 7 Days)" icon={BarChart3}>
                      {services.daily_counts.length > 0 ? (
                        <>
                          <div className="flex items-end gap-2 h-32">
                            {services.daily_counts.map((v, i) => {
                              const max = Math.max(...services.daily_counts) || 1;
                              const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                              const dayLabel = days[(new Date().getDay() + 6 - (6 - i)) % 7];
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-[9px] text-muted-foreground">{v}</span>
                                  <div className="w-full rounded-t-sm bg-primary/80 transition-all" style={{ height: `${(v / max) * 96}px` }} />
                                  <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground mt-2">
                            <span>Avg per day</span>
                            <span className="font-bold text-foreground">
                              {Math.round(services.daily_counts.reduce((a, b) => a + b, 0) / services.daily_counts.length)} txns
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                      )}
                    </SectionCard>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SectionSkeleton key={i} />)}</div>
              )}
            </TabsContent>
          )}

          {/* ── RISK & ACTIVITY ───────────────────────────────────────────────── */}
          <TabsContent value="risk" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Open Flags" value={String(openFlags.length)} sub="Requiring review" icon={AlertTriangle} color={openFlags.length > 0 ? "bg-red-500" : "bg-emerald-500"} />
              <StatCard title="High Severity" value={String(highFlags)} icon={AlertCircle} color={highFlags > 0 ? "bg-red-500" : "bg-emerald-500"} />
              <StatCard title="Suspended Accounts" value={stats ? String(stats.suspended_customers) : "—"} icon={Shield} color="bg-orange-500" />
              <StatCard title="Failed Transactions" value={String(activity.filter(a => a.status === "failed").length)} sub="In activity feed" icon={TrendingDown} color="bg-amber-500" />
            </div>

            <SectionCard title="Risk Flags & Alerts" icon={AlertTriangle}
              action={
                <button onClick={handleToggleResolved}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                  {showResolved ? "Hide resolved" : "Show resolved"}
                </button>
              }>
              <div className="space-y-0">
                {flags.filter(f => showResolved || !f.resolved).length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm font-medium">No open flags</p>
                    <p className="text-xs">All alerts have been resolved</p>
                  </div>
                ) : flags.filter(f => showResolved || !f.resolved).map(flag => (
                  <div key={flag.id} className={`flex items-start gap-4 py-4 border-b last:border-0 ${flag.resolved ? "opacity-50" : ""}`}>
                    <span className={`inline-block h-2 w-2 rounded-full shrink-0 mt-1.5 ${flag.severity === "high" ? "bg-red-500" : flag.severity === "medium" ? "bg-amber-500" : "bg-blue-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{flag.type}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${flag.severity === "high" ? "bg-red-100 text-red-700" : flag.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {flag.severity.toUpperCase()}
                        </span>
                        {flag.resolved && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-bold">RESOLVED</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{flag.customer_name} · {flag.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(flag.created_at)}</p>
                    </div>
                    {flag.amount != null && (
                      <p className="text-sm font-bold shrink-0">{fmt(flag.amount)}</p>
                    )}
                    {!flag.resolved && (
                      <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs"
                        disabled={resolvingFlagId === flag.id}
                        onClick={() => handleResolveFlag(flag.id)}>
                        {resolvingFlagId === flag.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Resolve"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Recent Activity Across All Modules" icon={Activity}>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-0">
                  {activity.map(item => {
                    const ModIcon = MODULE_ICONS[item.module] ?? Activity;
                    const modColor = MODULE_COLORS[item.module] ?? "bg-gray-400";
                    return (
                      <div key={`${item.module}-${item.id}`} className="flex items-center gap-3 py-3 border-b last:border-0">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${modColor}`}>
                          <ModIcon className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.customer_name} — {item.type}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.module} · {fmtTime(item.created_at)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{fmt(item.amount)}</p>
                          <StatusPill status={item.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* ── MODULES ───────────────────────────────────────────────────────── */}
          <TabsContent value="modules" className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map(mod => (
                <div key={mod.id} className={`rounded-2xl border p-5 transition-all ${mod.is_active ? "bg-card hover:border-primary/30 hover:shadow-sm" : "bg-muted/20 opacity-60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${mod.is_active ? "bg-primary/10" : "bg-muted"}`}>
                        <Package className={`h-5 w-5 ${mod.is_active ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{mod.module_name}</p>
                          {mod.is_active
                            ? <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                            : <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Disabled</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {mod.subscription_type} · since {fmtDate(mod.activated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-primary">{fmt(mod.price_at_subscription)}</p>
                      <p className="text-[10px] text-muted-foreground">/{mod.subscription_type === "monthly" ? "mo" : "yr"}</p>
                    </div>
                  </div>
                  {mod.module_description && (
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{mod.module_description}</p>
                  )}
                </div>
              ))}
            </div>

            {modules.length > 0 && (
              <div className="rounded-2xl border bg-gradient-to-r from-primary/5 via-blue-500/5 to-violet-500/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Total Subscription Cost</p>
                    <p className="text-xs text-muted-foreground">{modules.filter(m => m.is_active).length} active module(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">
                    {fmt(modules.filter(m => m.is_active && m.subscription_type === "monthly").reduce((s, m) => s + m.price_at_subscription, 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
