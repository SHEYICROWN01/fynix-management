import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Tenant, TenantModule } from "@/lib/api";
import { toast as showToast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  Package,
  Activity,
  RefreshCw,
  Globe,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PiggyBank,
  Landmark,
  Wallet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Star,
  Zap,
  Eye,
  Download,
  Filter,
} from "lucide-react";

// Interfaces
interface TenantOverview {
  tenant: Tenant;
  modules: TenantModule[];
  stats: TenantStats;
  module_stats: ModuleStats;
}

interface TenantStats {
  total_customers: number;
  new_customers_this_month: number;
  new_customers_last_month: number;
  active_customers: number;
  total_transactions: number;
  transaction_volume: number;
  transaction_volume_this_month: number;
  total_revenue: number;
  revenue_this_month: number;
  total_loans_disbursed: number;
  active_loans: number;
  total_loan_amount: number;
  total_savings_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  total_branches: number;
  total_staff: number;
  last_activity_at: string;
}

interface ModuleStats {
  savings?: SavingsStats;
  loans?: LoansStats;
  asset_finance?: AssetFinanceStats;
  cooperatives?: CooperativesStats;
  investments?: InvestmentsStats;
  services?: ServicesStats;
}

interface SavingsStats {
  total_accounts: number;
  active_accounts: number;
  total_balance: number;
  total_deposits_this_month: number;
  total_withdrawals_this_month: number;
  new_accounts_this_month: number;
  top_products: Array<{ name: string; count: number; balance: number }>;
  recent_transactions: Transaction[];
}

interface LoansStats {
  total_applications: number;
  approved_loans: number;
  active_loans: number;
  disbursed_amount: number;
  outstanding_balance: number;
  overdue_loans: number;
  overdue_amount: number;
  repayments_this_month: number;
  npl_ratio: number;
  recent_applications: LoanApplication[];
}

interface AssetFinanceStats {
  total_assets: number;
  active_leases: number;
  total_financed: number;
  outstanding_balance: number;
  overdue_count: number;
  recent_assets: AssetRecord[];
}

interface CooperativesStats {
  total_groups: number;
  total_members: number;
  total_contributions: number;
  total_payouts: number;
  active_cycles: number;
}

interface InvestmentsStats {
  total_portfolios: number;
  total_invested: number;
  total_returns: number;
  roi_percentage: number;
  active_plans: number;
}

interface ServicesStats {
  total_transactions: number;
  total_volume: number;
  airtime_volume: number;
  data_volume: number;
  bills_volume: number;
  transfers_volume: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  customer_name: string;
  status: "completed" | "pending" | "failed";
  created_at: string;
}

interface LoanApplication {
  id: number;
  applicant_name: string;
  amount: number;
  status: "pending" | "approved" | "disbursed" | "rejected";
  product: string;
  created_at: string;
}

interface AssetRecord {
  id: number;
  customer_name: string;
  asset_type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface CustomerRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  account_number: string;
  status: "active" | "inactive" | "suspended";
  total_balance: number;
  joined_at: string;
}

// Mock data
function generateMockOverview(tenant: Tenant, modules: TenantModule[]): TenantOverview {
  const has = (slug: string) => modules.some(m => m.module_slug === slug && m.is_active);
  return {
    tenant,
    modules,
    stats: {
      total_customers: 1284,
      new_customers_this_month: 87,
      new_customers_last_month: 63,
      active_customers: 1102,
      total_transactions: 45320,
      transaction_volume: 284500000,
      transaction_volume_this_month: 38200000,
      total_revenue: 12400000,
      revenue_this_month: 1850000,
      total_loans_disbursed: 342,
      active_loans: 218,
      total_loan_amount: 87600000,
      total_savings_balance: 145000000,
      total_deposits: 22400000,
      total_withdrawals: 18700000,
      total_branches: 5,
      total_staff: 34,
      last_activity_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    },
    module_stats: {
      ...(has("savings") ? {
        savings: {
          total_accounts: 1102,
          active_accounts: 987,
          total_balance: 145000000,
          total_deposits_this_month: 22400000,
          total_withdrawals_this_month: 18700000,
          new_accounts_this_month: 54,
          top_products: [
            { name: "Target Savings", count: 423, balance: 62000000 },
            { name: "Fixed Deposit", count: 318, balance: 55000000 },
            { name: "Regular Savings", count: 361, balance: 28000000 },
          ],
          recent_transactions: [
            { id: 1, type: "Deposit", amount: 150000, customer_name: "Adaeze Okonkwo", status: "completed", created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
            { id: 2, type: "Withdrawal", amount: 85000, customer_name: "Emeka Nwosu", status: "completed", created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
            { id: 3, type: "Deposit", amount: 500000, customer_name: "Funmi Adeleke", status: "completed", created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
            { id: 4, type: "Withdrawal", amount: 30000, customer_name: "Tunde Balogun", status: "pending", created_at: new Date(Date.now() - 1000 * 60 * 67).toISOString() },
          ],
        },
      } : {}),
      ...(has("loans") ? {
        loans: {
          total_applications: 512,
          approved_loans: 394,
          active_loans: 218,
          disbursed_amount: 87600000,
          outstanding_balance: 54200000,
          overdue_loans: 23,
          overdue_amount: 8400000,
          repayments_this_month: 14300000,
          npl_ratio: 4.2,
          recent_applications: [
            { id: 1, applicant_name: "Chisom Eze", amount: 500000, status: "disbursed", product: "Business Loan", created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
            { id: 2, applicant_name: "Bola Akin", amount: 200000, status: "pending", product: "Personal Loan", created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
            { id: 3, applicant_name: "Ngozi Ibe", amount: 1200000, status: "approved", product: "SME Loan", created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString() },
            { id: 4, applicant_name: "Yemi Osu", amount: 350000, status: "rejected", product: "Personal Loan", created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
          ],
        },
      } : {}),
      ...(has("asset-finance") || has("assets-loan") ? {
        asset_finance: {
          total_assets: 187,
          active_leases: 143,
          total_financed: 38700000,
          outstanding_balance: 22100000,
          overdue_count: 8,
          recent_assets: [
            { id: 1, customer_name: "Kola Motors Ltd", asset_type: "Vehicle", amount: 4500000, status: "active", created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
            { id: 2, customer_name: "Bright Tech Solutions", asset_type: "Equipment", amount: 2800000, status: "active", created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
          ],
        },
      } : {}),
      ...(has("cooperatives") ? {
        cooperatives: {
          total_groups: 42,
          total_members: 630,
          total_contributions: 18600000,
          total_payouts: 14200000,
          active_cycles: 28,
        },
      } : {}),
      ...(has("investment") ? {
        investments: {
          total_portfolios: 234,
          total_invested: 56000000,
          total_returns: 8400000,
          roi_percentage: 15,
          active_plans: 198,
        },
      } : {}),
      ...(has("services") || has("service") ? {
        services: {
          total_transactions: 18430,
          total_volume: 74200000,
          airtime_volume: 18000000,
          data_volume: 12400000,
          bills_volume: 22800000,
          transfers_volume: 21000000,
        },
      } : {}),
    },
  };
}

function generateMockCustomers(): CustomerRecord[] {
  const names = ["Adaeze Okonkwo", "Emeka Nwosu", "Funmi Adeleke", "Tunde Balogun", "Chisom Eze", "Bola Akin", "Ngozi Ibe", "Yemi Osu", "Kola Adebayo", "Amaka Obi", "Seun Falade", "Rotimi Coker", "Zainab Musa", "Ibrahim Suleiman", "Grace Etim", "Victor Eze", "Patience Okoro", "Samuel Adesanya", "Blessing Nwachukwu", "Chidi Okafor"];
  return names.map((name, i) => ({
    id: i + 1,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@gmail.com`,
    phone: `080${Math.floor(10000000 + Math.random() * 89999999)}`,
    account_number: `00${Math.floor(10000000 + Math.random() * 89999999)}`,
    status: (i % 7 === 0 ? "suspended" : i % 4 === 0 ? "inactive" : "active") as CustomerRecord["status"],
    total_balance: Math.floor(Math.random() * 5000000) + 10000,
    joined_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString(),
  }));
}

// Helpers
const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => new Intl.NumberFormat("en-NG").format(n);

const fmtTime = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

const pct = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Sub-component types
interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
  trendLabel?: string;
}

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}

// StatCard
function StatCard({ title, value, sub, icon: Icon, color, trend, trendLabel }: StatCardProps) {
  const isUp = (trend ?? 0) >= 0;
  return (
    <div className= "relative rounded-2xl border bg-card p-5 overflow-hidden hover:shadow-md transition-all duration-200" >
    <div className={ `absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-10 ${color}` } />
      < div className = "flex items-start justify-between" >
        <div className={ `h-10 w-10 rounded-xl flex items-center justify-center ${color}` }>
          <Icon className="h-5 w-5 text-white" />
            </div>
  {
    trend !== undefined && (
      <span className={ `flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}` }>
        { isUp?<ArrowUpRight className = "h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
  { Math.abs(trend) }%
    </span>
        )
}
</div>
  < div className = "mt-3" >
    <p className="text-2xl font-bold tracking-tight" > { value } </p>
      < p className = "text-sm text-muted-foreground mt-0.5" > { title } </p>
{ sub && <p className="text-xs text-muted-foreground mt-1" > { sub } </p> }
{ trendLabel && <p className="text-xs text-muted-foreground mt-0.5" > { trendLabel } </p> }
</div>
  </div>
  );
}

// SectionCard
function SectionCard({ title, icon: Icon, children, action }: SectionCardProps) {
  return (
    <div className= "rounded-2xl border bg-card overflow-hidden" >
    <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20" >
      <div className="flex items-center gap-2" >
        <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold" > { title } </h3>
            </div>
  { action }
  </div>
    < div className = "p-5" > { children } </div>
      </div>
  );
}

// StatusPill
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    approved: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    disbursed: "bg-violet-500/10 text-violet-700 border-violet-500/20",
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    failed: "bg-red-500/10 text-red-700 border-red-500/20",
    rejected: "bg-red-500/10 text-red-700 border-red-500/20",
    inactive: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    suspended: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  };
  return (
    <span className= {`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`
}>
  { status.charAt(0).toUpperCase() + status.slice(1) }
  </span>
  );
}

// Main Page
export default function TenantDashboard() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [overview, setOverview] = useState<TenantOverview | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [customerSearch, setCustomerSearch] = useState("");

  const load = useCallback(async (showRefresh = false) => {
    if (!tenantId) return;
    try {
      if (showRefresh) { setIsRefreshing(true); } else { setIsLoading(true); }
      const [tenantRes, modulesRes] = await Promise.all([
        api.getTenant(Number(tenantId)),
        api.getTenantModules(Number(tenantId)),
      ]);
      const t = tenantRes.data;
      const mods: TenantModule[] = modulesRes.data || [];
      setTenant(t);

      // Try real API; fall back to mock
      try {
        type OverviewFn = (id: number) => Promise<{ data: TenantOverview }>;
        const overviewRes = await (api as unknown as Record<string, OverviewFn>).getTenantOverview(Number(tenantId));
        setOverview(overviewRes.data);
      } catch {
        setOverview(generateMockOverview(t, mods));
      }
      setCustomers(generateMockCustomers());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast.error("Failed to load tenant data", { description: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.account_number.includes(customerSearch) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title= "Tenant Dashboard" >
      <div className="flex flex-col items-center justify-center h-96 gap-4" >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground" > Loading tenant dashboard...</p>
            </div>
            </DashboardLayout>
    );
  }

  if (!tenant || !overview) {
    return (
      <DashboardLayout title= "Tenant Dashboard" >
      <div className="flex flex-col items-center justify-center h-96 gap-4" >
        <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="font-medium" > Tenant not found </p>
            < Button onClick = {() => navigate("/tenants")
  } variant = "outline" >
    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
      </Button>
      </div>
      </DashboardLayout>
    );
}

const { stats, module_stats } = overview;
const customerGrowth = pct(stats.new_customers_this_month, stats.new_customers_last_month);
const hasSavings = !!module_stats.savings;
const hasLoans = !!module_stats.loans;
const hasAssets = !!module_stats.asset_finance;
const hasCoops = !!module_stats.cooperatives;
const hasInvestments = !!module_stats.investments;
const hasServices = !!module_stats.services;

const brandBg = tenant.branding
  ? `linear-gradient(135deg, ${tenant.branding.primary_color} 0%, ${tenant.branding.accent_color} 100%)`
  : undefined;

const logoUrl: string | undefined = (tenant as Tenant & { logo_url?: string }).logo_url ?? tenant.logo ?? undefined;

return (
  <DashboardLayout title= {`${tenant.name} — Dashboard`}>
    <div className="space-y-6" >

      {/* Back + Breadcrumb */ }
      < div className = "flex items-center gap-3" >
        <Button variant="ghost" size = "sm" onClick = {() => navigate("/tenants")} className = "shrink-0" >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            < div className = "h-4 w-px bg-border" />
              <p className="text-sm text-muted-foreground truncate" >
                Tenants{ " / " }
<span className="font-medium text-foreground" > { tenant.name } </span>
  </p>
  </div>

{/* Hero Banner */ }
<div
          className="relative rounded-2xl overflow-hidden px-6 py-6 text-white"
style = {{ background: brandBg ?? "linear-gradient(135deg, #0A2540 0%, #1a4a7a 50%, #4F9CF9 100%)" }}
        >
  <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
    <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute top-4 right-48 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-5" >
          {/* Logo */ }
          < div className = "h-16 w-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 overflow-hidden shadow-lg" >
          {
            logoUrl?(
                <img src = { logoUrl } alt = { tenant.name } className = "h-full w-full object-contain p-1" />
              ): (
                <span className = "text-2xl font-black text-white">{tenant.name.slice(0, 2).toUpperCase()
          } </span>
              )}
</div>

{/* Name & meta */ }
<div className="flex-1 min-w-0" >
  <div className="flex items-center gap-3 flex-wrap" >
    <h1 className="text-2xl font-black text-white" > { tenant.name } </h1>
      < span className = {`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tenant.status === "active" ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" : "bg-red-500/20 text-red-200 border-red-400/30"}`}>
        <span className={ `h-1.5 w-1.5 rounded-full ${tenant.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}` } />
{ tenant.status.toUpperCase() }
</span>
  </div>
  < div className = "flex flex-wrap items-center gap-4 mt-2" >
    <span className="flex items-center gap-1.5 text-white/70 text-sm" >
      <Globe className="h-3.5 w-3.5" /> { tenant.subdomain }.fynixcobanking.com
        </span>
{
  tenant.institution_code && (
    <span className="flex items-center gap-1.5 text-white/70 text-sm font-mono" >
      <Shield className="h-3.5 w-3.5" /> { tenant.institution_code }
        </span>
                )
}
<span className="flex items-center gap-1.5 text-white/70 text-sm" >
  <Clock className="h-3.5 w-3.5" /> Last active { fmtTime(stats.last_activity_at) }
</span>
  </div>
  </div>

{/* Quick stat chips */ }
<div className="flex gap-3 shrink-0 flex-wrap" >
  {([
    { label: "Customers", value: fmtNum(stats.total_customers) },
    { label: "Branches", value: String(stats.total_branches) },
    { label: "Staff", value: String(stats.total_staff) },
    { label: "Modules", value: String(overview.modules.filter(m => m.is_active).length) },
  ] as Array<{ label: string; value: string }>).map(({ label, value }) => (
    <div key= { label } className = "text-center px-4 py-2 rounded-xl bg-white/10 border border-white/15" >
    <p className="text-lg font-bold text-white" > { value } </p>
  < p className = "text-[10px] text-white/60 uppercase tracking-wide" > { label } </p>
  </div>
  ))}
</div>

{/* Actions */ }
<div className="flex items-center gap-2 shrink-0" >
  <Button
                variant="outline"
size = "sm"
onClick = {() => load(true)}
disabled = { isRefreshing }
className = "bg-white/10 border-white/20 text-white hover:bg-white/20"
  >
  <RefreshCw className={ `h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}` } />
Refresh
  </Button>
  < Button size = "sm" className = "bg-white text-primary hover:bg-white/90 font-semibold" >
    <Download className="h-4 w-4 mr-1.5" /> Export
      </Button>
      </div>
      </div>
      </div>

{/* KPI Row */ }
<div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
  <StatCard
            title="Total Customers"
value = { fmtNum(stats.total_customers) }
icon = { Users }
color = "bg-blue-500"
trend = { customerGrowth }
trendLabel = {`${stats.new_customers_this_month} new this month`}
          />
  < StatCard
title = "Transaction Volume"
value = { fmt(stats.transaction_volume_this_month) }
sub = "This month"
icon = { Activity }
color = "bg-violet-500"
trend = { 12}
trendLabel = {`${fmtNum(stats.total_transactions)} total txns`}
          />
  < StatCard
title = "Total Savings Balance"
value = { fmt(stats.total_savings_balance) }
icon = { PiggyBank }
color = "bg-emerald-500"
trend = { 8}
trendLabel = "Across all accounts"
  />
  <StatCard
            title="Active Loans"
value = { fmtNum(stats.active_loans) }
sub = { fmt(stats.total_loan_amount) + " disbursed"}
icon = { Landmark }
color = "bg-orange-500"
trend = {- 3}
trendLabel = {`${stats.total_loans_disbursed} total issued`}
          />
  </div>

{/* Tabs */ }
<Tabs value={ activeTab } onValueChange = { setActiveTab } className = "w-full" >
  <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl" >
    <TabsTrigger value="overview" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
      <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Overview
        </TabsTrigger>
        < TabsTrigger value = "customers" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
          <Users className="h-3.5 w-3.5 mr-1.5" /> Customers
            </TabsTrigger>
{
  hasSavings && (
    <TabsTrigger value="savings" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
      <PiggyBank className="h-3.5 w-3.5 mr-1.5" /> Savings
        </TabsTrigger>
            )
}
{
  hasLoans && (
    <TabsTrigger value="loans" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
      <Landmark className="h-3.5 w-3.5 mr-1.5" /> Loans
        </TabsTrigger>
            )
}
{
  hasAssets && (
    <TabsTrigger value="assets" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
      <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Asset Finance
        </TabsTrigger>
            )
}
{
  hasCoops && (
    <TabsTrigger value="cooperatives" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
      <Shield className="h-3.5 w-3.5 mr-1.5" /> Cooperatives
        </TabsTrigger>
            )
}
{
  hasInvestments && (
    <TabsTrigger value="investments" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
      <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Investments
        </TabsTrigger>
            )
}
{
  hasServices && (
    <TabsTrigger value="services" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
      <Zap className="h-3.5 w-3.5 mr-1.5" /> Services
        </TabsTrigger>
            )
}
<TabsTrigger value="modules" className = "rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm" >
  <Package className="h-3.5 w-3.5 mr-1.5" /> Modules
    </TabsTrigger>
    </TabsList>

{/* OVERVIEW */ }
<TabsContent value="overview" className = "mt-5 space-y-5" >
  <div className="grid md:grid-cols-2 gap-5" >
    <SectionCard title="Financial Snapshot" icon = { DollarSign } >
      <div className="space-y-3" >
        {([
          { label: "Total Savings Balance", value: fmt(stats.total_savings_balance), color: "text-emerald-600" },
          { label: "Total Loans Disbursed", value: fmt(stats.total_loan_amount), color: "text-blue-600" },
          { label: "Deposits This Month", value: fmt(stats.total_deposits), color: "text-violet-600" },
          { label: "Withdrawals This Month", value: fmt(stats.total_withdrawals), color: "text-orange-600" },
          { label: "Revenue This Month", value: fmt(stats.revenue_this_month), color: "text-primary" },
        ] as Array<{ label: string; value: string; color: string }>).map(({ label, value, color }) => (
          <div key= { label } className = "flex items-center justify-between py-2 border-b last:border-0" >
          <span className="text-sm text-muted-foreground" > { label } </span>
        < span className = {`text-sm font-bold ${color}`}> { value } </span>
        </div>
        ))}
</div>
  </SectionCard>

  < SectionCard title = "Customer Activity" icon = { Users } >
    <div className="space-y-4" >
      <div className="grid grid-cols-2 gap-3" >
        {([
          { label: "Total", value: fmtNum(stats.total_customers), color: "text-foreground" },
          { label: "Active", value: fmtNum(stats.active_customers), color: "text-emerald-600" },
          { label: "New This Month", value: fmtNum(stats.new_customers_this_month), color: "text-blue-600" },
          { label: "Last Month", value: fmtNum(stats.new_customers_last_month), color: "text-muted-foreground" },
        ] as Array<{ label: string; value: string; color: string }>).map(({ label, value, color }) => (
          <div key= { label } className = "rounded-xl bg-muted/40 p-3 text-center" >
          <p className={`text-xl font-bold ${color}`}> { value } </p>
        < p className = "text-[11px] text-muted-foreground mt-0.5" > { label } </p>
        </div>
        ))}
</div>
  < div className = "space-y-1.5" >
    <div className="flex justify-between text-xs text-muted-foreground" >
      <span>Customer Growth Rate </span>
        < span className = { customerGrowth >= 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
          { customerGrowth >= 0 ? "+" : ""}{ customerGrowth }% MoM
            </span>
            </div>
            < div className = "h-2 rounded-full bg-muted overflow-hidden" >
              <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all"
style = {{ width: `${Math.min(Math.abs(customerGrowth) * 2, 100)}%` }}
                      />
  </div>
  </div>
  < div className = "flex items-center justify-between pt-2 border-t" >
    <span className="text-xs text-muted-foreground" > Active rate </span>
      < span className = "text-sm font-bold text-emerald-600" >
        { Math.round((stats.active_customers / stats.total_customers) * 100) } %
        </span>
        </div>
        </div>
        </SectionCard>
        </div>

        < SectionCard title = "Transaction Overview" icon = { Activity } >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
            {([
              { label: "Total Transactions", value: fmtNum(stats.total_transactions), icon: Activity, color: "bg-blue-500" },
              { label: "Volume This Month", value: fmt(stats.transaction_volume_this_month), icon: TrendingUp, color: "bg-emerald-500" },
              { label: "All-time Volume", value: fmt(stats.transaction_volume), icon: BarChart3, color: "bg-violet-500" },
              { label: "Total Revenue", value: fmt(stats.total_revenue), icon: DollarSign, color: "bg-orange-500" },
            ] as Array<{ label: string; value: string; icon: React.ElementType; color: string }>).map(({ label, value, icon: Icon2, color }) => (
              <div key= { label } className = "rounded-xl border p-4 space-y-2 hover:border-primary/30 transition-colors" >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon2 className="h-4 w-4 text-white" />
            </div>
            < p className = "text-lg font-bold" > { value } </p>
            < p className = "text-xs text-muted-foreground" > { label } </p>
            </div>
            ))}
</div>
  </SectionCard>

  < SectionCard
title = "Active Modules"
icon = { Package }
action = {< Badge variant = "secondary" > { overview.modules.filter(m => m.is_active).length } active </Badge>}
            >
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3" >
  {
    overview.modules.filter(m => m.is_active).map(mod => (
      <div key= { mod.id } className = "flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors" >
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0" >
    <Package className="h-4 w-4 text-primary" />
    </div>
    < div className = "min-w-0" >
    <p className="text-sm font-semibold truncate" > { mod.module_name } </p>
    < p className = "text-[10px] text-muted-foreground capitalize" > { mod.subscription_type } · { fmt(mod.price_at_subscription)
  } </p>
    </div>
    < div className = "h-2 w-2 rounded-full bg-emerald-500 shrink-0 ml-auto" />
      </div>
                ))}
</div>
  </SectionCard>
  </TabsContent>

{/* CUSTOMERS */ }
<TabsContent value="customers" className = "mt-5 space-y-5" >
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
    <StatCard title="Total Registered" value = { fmtNum(stats.total_customers) } icon = { Users } color = "bg-blue-500" />
      <StatCard title="Active Customers" value = { fmtNum(stats.active_customers) } icon = { CheckCircle2 } color = "bg-emerald-500" trend = { customerGrowth } />
        <StatCard title="New This Month" value = { fmtNum(stats.new_customers_this_month) } icon = { Star } color = "bg-violet-500" />
          <StatCard title="Avg Balance" value = { fmt(stats.total_savings_balance / stats.total_customers) } icon = { Wallet } color = "bg-orange-500" />
            </div>

            < div className = "rounded-2xl border bg-card overflow-hidden" >
              <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20" >
                <div className="flex items-center gap-2" >
                  <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold" > Customer List </h3>
                      < Badge variant = "secondary" > { filteredCustomers.length } </Badge>
                        </div>
                        < div className = "flex items-center gap-2" >
                          <div className="relative" >
                            <input
                      placeholder="Search customers..."
value = { customerSearch }
onChange = { e => setCustomerSearch(e.target.value) }
className = "h-8 pl-8 pr-3 rounded-lg border bg-background text-sm w-56 focus:outline-none focus:ring-1 focus:ring-primary"
  />
  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
    < Button variant = "outline" size = "sm" >
      <Download className="h-3.5 w-3.5 mr-1.5" /> Export
        </Button>
        </div>
        </div>
        < div className = "overflow-x-auto" >
          <table className="w-full text-sm" >
            <thead>
            <tr className="border-b bg-muted/10" >
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" > Customer </th>
                < th className = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" > Account No.</th>
                  < th className = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" > Phone </th>
                    < th className = "px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide" > Balance </th>
                      < th className = "px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide" > Status </th>
                        < th className = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" > Joined </th>
                          < th className = "px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide" > View </th>
                            </tr>
                            </thead>
                            <tbody>
{
  filteredCustomers.map(c => (
    <tr key= { c.id } className = "border-b last:border-0 hover:bg-muted/30 transition-colors" >
    <td className="px-5 py-3.5" >
  <div className="flex items-center gap-3" >
  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0" >
  <span className="text-xs font-bold text-primary" > { c.name.slice(0, 2).toUpperCase() } </span>
  </div>
  < div >
  <p className="font-semibold text-sm" > { c.name } </p>
  < p className = "text-xs text-muted-foreground" > { c.email } </p>
  </div>
  </div>
  </td>
  < td className = "px-4 py-3.5" >
  <code className="text-xs bg-muted px-1.5 py-0.5 rounded" > { c.account_number } </code>
  </td>
  < td className = "px-4 py-3.5" >
  <p className="text-xs text-muted-foreground" > { c.phone } </p>
  </td>
  < td className = "px-4 py-3.5 text-right" >
  <p className="text-sm font-semibold" > { fmt(c.total_balance)
} </p>
  </td>
  < td className = "px-4 py-3.5 text-center" >
    <StatusPill status={ c.status } />
      </td>
      < td className = "px-4 py-3.5" >
        <p className="text-xs text-muted-foreground" > { fmtDate(c.joined_at) } </p>
          </td>
          < td className = "px-4 py-3.5 text-center" >
            <Button variant="ghost" size = "sm" className = "h-7 w-7 p-0" >
              <Eye className="h-3.5 w-3.5" />
                </Button>
                </td>
                </tr>
                    ))}
</tbody>
  </table>
  </div>
  < div className = "flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground" >
    <span>Showing { filteredCustomers.length } of { customers.length } customers </span>
      < span className = "italic" > Showing sample data — connect backend API for live data </span>
        </div>
        </div>
        </TabsContent>

          {/* SAVINGS */ }
          {
  hasSavings && (
    <TabsContent value="savings" className = "mt-5 space-y-5" >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
        <StatCard title="Total Accounts" value = { fmtNum(module_stats.savings!.total_accounts) } icon = { PiggyBank } color = "bg-emerald-500" />
          <StatCard title="Active Accounts" value = { fmtNum(module_stats.savings!.active_accounts) } icon = { CheckCircle2 } color = "bg-blue-500" />
            <StatCard title="Total Balance" value = { fmt(module_stats.savings!.total_balance) } icon = { DollarSign } color = "bg-violet-500" trend = { 8} />
              <StatCard title="New Accounts" value = { fmtNum(module_stats.savings!.new_accounts_this_month) } icon = { Star } color = "bg-orange-500" trendLabel = "This month" />
                </div>

                < div className = "grid md:grid-cols-2 gap-5" >
                  <SectionCard title="Deposit vs Withdrawal (This Month)" icon = { TrendingUp } >
                    <div className="space-y-4" >
                      <div className="space-y-2" >
                        <div className="flex justify-between text-sm" >
                          <span className="text-muted-foreground" > Total Deposits </span>
                            < span className = "font-bold text-emerald-600" > { fmt(module_stats.savings!.total_deposits_this_month) } </span>
                              </div>
                              < div className = "h-3 rounded-full bg-muted overflow-hidden" >
                                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style = {{ width: "65%" }
} />
  </div>
  </div>
  < div className = "space-y-2" >
    <div className="flex justify-between text-sm" >
      <span className="text-muted-foreground" > Total Withdrawals </span>
        < span className = "font-bold text-orange-600" > { fmt(module_stats.savings!.total_withdrawals_this_month) } </span>
          </div>
          < div className = "h-3 rounded-full bg-muted overflow-hidden" >
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600" style = {{ width: "48%" }} />
              </div>
              </div>
              < div className = "flex items-center justify-between pt-2 border-t" >
                <span className="text-xs text-muted-foreground" > Net flow </span>
                  < span className = "text-sm font-bold text-emerald-600" >
                    +{ fmt(module_stats.savings!.total_deposits_this_month - module_stats.savings!.total_withdrawals_this_month) }
                    </span>
                    </div>
                    </div>
                    </SectionCard>

                    < SectionCard title = "Top Savings Products" icon = { Star } >
                      <div className="space-y-3" >
                      {
                        module_stats.savings!.top_products.map((p, i) => {
                          const barColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500"];
                          const headerColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500"];
                          return (
                            <div key= { p.name } className = "flex items-center gap-3" >
                              <div className={ `h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${headerColors[i]}` }>
                                { i + 1
                        }
                          </div>
                          < div className = "flex-1 min-w-0" >
                          <div className="flex justify-between items-center" >
                        <p className="text-sm font-medium truncate" > { p.name } </p>
                        < p className = "text-sm font-bold shrink-0 ml-2" > { fmt(p.balance)
                      } </p>
                        </div>
                        < div className = "flex items-center gap-2 mt-1" >
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden" >
                            <div
                                  className={ `h-full rounded-full ${barColors[i]}` }
style = {{ width: `${(p.count / module_stats.savings!.total_accounts) * 100}%` }}
                                />
  </div>
  < span className = "text-[10px] text-muted-foreground" > { p.count } accts </span>
    </div>
    </div>
    </div>
                      );
                    })}
</div>
  </SectionCard>
  </div>

  < SectionCard title = "Recent Transactions" icon = { Activity } >
    <table className="w-full text-sm" >
      <thead>
      <tr className="border-b" >
        <th className="pb-3 text-left text-xs font-semibold text-muted-foreground uppercase" > Customer </th>
          < th className = "pb-3 text-left text-xs font-semibold text-muted-foreground uppercase" > Type </th>
            < th className = "pb-3 text-right text-xs font-semibold text-muted-foreground uppercase" > Amount </th>
              < th className = "pb-3 text-center text-xs font-semibold text-muted-foreground uppercase" > Status </th>
                < th className = "pb-3 text-right text-xs font-semibold text-muted-foreground uppercase" > Time </th>
                  </tr>
                  </thead>
                  <tbody>
{
  module_stats.savings!.recent_transactions.map(t => (
    <tr key= { t.id } className = "border-b last:border-0 hover:bg-muted/20" >
    <td className="py-3 font-medium" > { t.customer_name } </td>
  < td className = "py-3 text-muted-foreground" > { t.type } </td>
  < td className = "py-3 text-right font-bold" > { fmt(t.amount)
} </td>
  < td className = "py-3 text-center" > <StatusPill status={ t.status } /></td >
    <td className="py-3 text-right text-xs text-muted-foreground" > { fmtTime(t.created_at) } </td>
      </tr>
                    ))}
</tbody>
  </table>
  </SectionCard>
  </TabsContent>
          )}

{/* LOANS */ }
{
  hasLoans && (
    <TabsContent value="loans" className = "mt-5 space-y-5" >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
        <StatCard title="Active Loans" value = { fmtNum(module_stats.loans!.active_loans) } icon = { Landmark } color = "bg-blue-500" />
          <StatCard title="Disbursed Amount" value = { fmt(module_stats.loans!.disbursed_amount) } icon = { DollarSign } color = "bg-emerald-500" />
            <StatCard title="Outstanding Balance" value = { fmt(module_stats.loans!.outstanding_balance) } icon = { CreditCard } color = "bg-violet-500" />
              <StatCard title="Overdue Loans" value = { fmtNum(module_stats.loans!.overdue_loans) } sub = { fmt(module_stats.loans!.overdue_amount) } icon = { AlertTriangle } color = "bg-red-500" />
                </div>

                < div className = "grid md:grid-cols-3 gap-4" >
                  <div className="rounded-2xl border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-5" >
                    <div className="flex items-center gap-2 mb-3" >
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-semibold" > NPL Ratio </p>
                          </div>
                          < p className = "text-4xl font-black text-orange-600" > { module_stats.loans!.npl_ratio } % </p>
                            < p className = "text-xs text-muted-foreground mt-1" > Non - performing loans ratio </p>
                              < div className = "mt-3 h-2 rounded-full bg-muted overflow-hidden" >
                                <div
                      className={ `h-full rounded-full ${module_stats.loans!.npl_ratio < 5 ? "bg-emerald-500" : module_stats.loans!.npl_ratio < 10 ? "bg-orange-500" : "bg-red-500"}` }
  style = {{ width: `${Math.min(module_stats.loans!.npl_ratio * 5, 100)}%` }
}
                    />
  </div>
  < p className = "text-[10px] text-muted-foreground mt-1" >
    { module_stats.loans!.npl_ratio < 5 ? "Healthy" : module_stats.loans!.npl_ratio < 10 ? "Watch closely" : "Critical — action needed" }
    </p>
    </div>

    < div className = "rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5" >
      <div className="flex items-center gap-2 mb-3" >
        <TrendingUp className="h-4 w-4 text-emerald-500" />
          <p className="text-sm font-semibold" > Repayments This Month </p>
            </div>
            < p className = "text-3xl font-black text-emerald-600" > { fmt(module_stats.loans!.repayments_this_month) } </p>
              < p className = "text-xs text-muted-foreground mt-1" > Collected from active borrowers </p>
                < div className = "mt-3 flex items-center gap-2" >
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    <p className="text-xs text-emerald-600 font-medium" > On track with targets </p>
                    </div>
                    </div>

                    < div className = "rounded-2xl border p-5" >
                      <div className="flex items-center gap-2 mb-3" >
                        <FileText className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold" > Application Pipeline </p>
                            </div>
{
  ([
    { label: "Total Applications", value: module_stats.loans!.total_applications, color: "bg-blue-500" },
    { label: "Approved", value: module_stats.loans!.approved_loans, color: "bg-emerald-500" },
    { label: "Active / Disbursed", value: module_stats.loans!.active_loans, color: "bg-violet-500" },
    { label: "Overdue", value: module_stats.loans!.overdue_loans, color: "bg-red-500" },
  ] as Array<{ label: string; value: number; color: string }>).map(({ label, value, color }) => (
    <div key= { label } className = "flex items-center justify-between py-1.5 text-sm" >
    <div className="flex items-center gap-2" >
  <div className={`h-2 w-2 rounded-full ${color}`} />
    < span className = "text-muted-foreground" > { label } </span>
      </div>
      < span className = "font-bold" > { fmtNum(value) } </span>
        </div>
                  ))}
</div>
  </div>

  < SectionCard title = "Recent Loan Applications" icon = { FileText } >
    <table className="w-full text-sm" >
      <thead>
      <tr className="border-b" >
        <th className="pb-3 text-left text-xs font-semibold text-muted-foreground uppercase" > Applicant </th>
          < th className = "pb-3 text-left text-xs font-semibold text-muted-foreground uppercase" > Product </th>
            < th className = "pb-3 text-right text-xs font-semibold text-muted-foreground uppercase" > Amount </th>
              < th className = "pb-3 text-center text-xs font-semibold text-muted-foreground uppercase" > Status </th>
                < th className = "pb-3 text-right text-xs font-semibold text-muted-foreground uppercase" > Date </th>
                  </tr>
                  </thead>
                  <tbody>
{
  module_stats.loans!.recent_applications.map(a => (
    <tr key= { a.id } className = "border-b last:border-0 hover:bg-muted/20" >
    <td className="py-3 font-medium" > { a.applicant_name } </td>
  < td className = "py-3 text-muted-foreground" > { a.product } </td>
  < td className = "py-3 text-right font-bold" > { fmt(a.amount)
} </td>
  < td className = "py-3 text-center" > <StatusPill status={ a.status } /></td >
    <td className="py-3 text-right text-xs text-muted-foreground" > { fmtTime(a.created_at) } </td>
      </tr>
                    ))}
</tbody>
  </table>
  </SectionCard>
  </TabsContent>
          )}

{/* ASSET FINANCE */ }
{
  hasAssets && (
    <TabsContent value="assets" className = "mt-5 space-y-5" >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
        <StatCard title="Total Assets" value = { fmtNum(module_stats.asset_finance!.total_assets) } icon = { CreditCard } color = "bg-blue-500" />
          <StatCard title="Active Leases" value = { fmtNum(module_stats.asset_finance!.active_leases) } icon = { CheckCircle2 } color = "bg-emerald-500" />
            <StatCard title="Total Financed" value = { fmt(module_stats.asset_finance!.total_financed) } icon = { DollarSign } color = "bg-violet-500" />
              <StatCard title="Overdue" value = { fmtNum(module_stats.asset_finance!.overdue_count) } icon = { AlertTriangle } color = "bg-red-500" />
                </div>

                < SectionCard title = "Recent Asset Records" icon = { CreditCard } >
                  <table className="w-full text-sm" >
                    <thead>
                    <tr className="border-b" >
                      <th className="pb-3 text-left text-xs font-semibold text-muted-foreground uppercase" > Customer </th>
                        < th className = "pb-3 text-left text-xs font-semibold text-muted-foreground uppercase" > Asset Type </th>
                          < th className = "pb-3 text-right text-xs font-semibold text-muted-foreground uppercase" > Amount </th>
                            < th className = "pb-3 text-center text-xs font-semibold text-muted-foreground uppercase" > Status </th>
                              < th className = "pb-3 text-right text-xs font-semibold text-muted-foreground uppercase" > Date </th>
                                </tr>
                                </thead>
                                <tbody>
  {
    module_stats.asset_finance!.recent_assets.map(a => (
      <tr key= { a.id } className = "border-b last:border-0 hover:bg-muted/20" >
      <td className="py-3 font-medium" > { a.customer_name } </td>
    < td className = "py-3 text-muted-foreground" > { a.asset_type } </td>
    < td className = "py-3 text-right font-bold" > { fmt(a.amount)
  } </td>
    < td className = "py-3 text-center" > <StatusPill status={ a.status } /></td >
      <td className="py-3 text-right text-xs text-muted-foreground" > { fmtTime(a.created_at) } </td>
        </tr>
                    ))
}
</tbody>
  </table>
  </SectionCard>
  </TabsContent>
          )}

{/* COOPERATIVES */ }
{
  hasCoops && (
    <TabsContent value="cooperatives" className = "mt-5 space-y-5" >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" >
        <StatCard title="Groups" value = { fmtNum(module_stats.cooperatives!.total_groups) } icon = { Users } color = "bg-blue-500" />
          <StatCard title="Members" value = { fmtNum(module_stats.cooperatives!.total_members) } icon = { Users } color = "bg-violet-500" />
            <StatCard title="Contributions" value = { fmt(module_stats.cooperatives!.total_contributions) } icon = { PiggyBank } color = "bg-emerald-500" />
              <StatCard title="Payouts" value = { fmt(module_stats.cooperatives!.total_payouts) } icon = { DollarSign } color = "bg-orange-500" />
                <StatCard title="Active Cycles" value = { fmtNum(module_stats.cooperatives!.active_cycles) } icon = { Activity } color = "bg-teal-500" />
                  </div>
                  </TabsContent>
          )
}

{/* INVESTMENTS */ }
{
  hasInvestments && (
    <TabsContent value="investments" className = "mt-5 space-y-5" >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" >
        <StatCard title="Portfolios" value = { fmtNum(module_stats.investments!.total_portfolios) } icon = { BarChart3 } color = "bg-blue-500" />
          <StatCard title="Total Invested" value = { fmt(module_stats.investments!.total_invested) } icon = { DollarSign } color = "bg-violet-500" />
            <StatCard title="Total Returns" value = { fmt(module_stats.investments!.total_returns) } icon = { TrendingUp } color = "bg-emerald-500" />
              <StatCard title="ROI" value = {`${module_stats.investments!.roi_percentage}%`
} icon = { TrendingUp } color = "bg-orange-500" trend = { module_stats.investments!.roi_percentage } />
  <StatCard title="Active Plans" value = { fmtNum(module_stats.investments!.active_plans) } icon = { Activity } color = "bg-teal-500" />
    </div>
    </TabsContent>
          )}

{/* SERVICES */ }
{
  hasServices && (
    <TabsContent value="services" className = "mt-5 space-y-5" >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
        <StatCard title="Total Transactions" value = { fmtNum(module_stats.services!.total_transactions) } icon = { Activity } color = "bg-blue-500" />
          <StatCard title="Total Volume" value = { fmt(module_stats.services!.total_volume) } icon = { DollarSign } color = "bg-emerald-500" />
            <StatCard title="Bills Payments" value = { fmt(module_stats.services!.bills_volume) } icon = { FileText } color = "bg-violet-500" />
              <StatCard title="Transfers" value = { fmt(module_stats.services!.transfers_volume) } icon = { Wallet } color = "bg-orange-500" />
                </div>

                < SectionCard title = "Service Volume Breakdown" icon = { Zap } >
                  <div className="grid grid-cols-2 gap-4" >
                    {([
                      { label: "Airtime Top-up", value: module_stats.services!.airtime_volume, color: "bg-blue-500", w: 24 },
                      { label: "Data Bundles", value: module_stats.services!.data_volume, color: "bg-violet-500", w: 17 },
                      { label: "Bill Payments", value: module_stats.services!.bills_volume, color: "bg-emerald-500", w: 31 },
                      { label: "Fund Transfers", value: module_stats.services!.transfers_volume, color: "bg-orange-500", w: 28 },
                    ] as Array<{ label: string; value: number; color: string; w: number }>).map(({ label, value, color, w }) => (
                      <div key= { label } className = "rounded-xl border p-4" >
                      <div className="flex items-center justify-between mb-2" >
                    <p className="text-xs font-medium text-muted-foreground" > { label } </p>
                    < div className = {`h-2 w-2 rounded-full ${color}`} />
                      </div>
                      < p className = "text-lg font-bold" > { fmt(value) } </p>
                        < div className = "mt-2 h-1.5 rounded-full bg-muted overflow-hidden" >
                          <div className={ `h-full rounded-full ${color}` } style = {{ width: `${w}%` }} />
                            </div>
                            < p className = "text-[10px] text-muted-foreground mt-1" > { w } % of total volume </p>
                              </div>
                  ))}
</div>
  </SectionCard>
  </TabsContent>
          )}

{/* MODULES */ }
<TabsContent value="modules" className = "mt-5 space-y-5" >
  <div className="grid gap-4 md:grid-cols-2" >
  {
    overview.modules.map(mod => (
      <div key= { mod.id } className = {`rounded-2xl border p-5 transition-all ${mod.is_active ? "bg-card hover:border-primary/30 hover:shadow-sm" : "bg-muted/20 opacity-60"}`} >
    <div className="flex items-start justify-between gap-3" >
      <div className="flex items-center gap-3" >
        <div className={ `h-11 w-11 rounded-xl flex items-center justify-center ${mod.is_active ? "bg-primary/10" : "bg-muted"}` }>
          <Package className={ `h-5 w-5 ${mod.is_active ? "text-primary" : "text-muted-foreground"}` } />
            </div>
            < div >
            <div className="flex items-center gap-2" >
              <p className="font-semibold" > { mod.module_name } </p>
{
  mod.is_active
  ? <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-500/20" > Active </span>
                            : <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full" > Disabled </span>
}
</div>
  < p className = "text-xs text-muted-foreground mt-0.5 capitalize" > { mod.subscription_type } · since { fmtDate(mod.activated_at) } </p>
    </div>
    </div>
    < div className = "text-right shrink-0" >
      <p className="text-base font-bold text-primary" > { fmt(mod.price_at_subscription) } </p>
        < p className = "text-[10px] text-muted-foreground" > /{mod.subscription_type === "monthly" ? "mo" : "yr"}</p >
          </div>
          </div>
{
  mod.module_description && (
    <p className="text-xs text-muted-foreground mt-3 leading-relaxed" > { mod.module_description } </p>
                  )
}
</div>
              ))}
</div>

  < div className = "rounded-2xl border bg-gradient-to-r from-primary/5 via-blue-500/5 to-violet-500/5 p-6 flex items-center justify-between" >
    <div className="flex items-center gap-4" >
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center" >
        <Wallet className="h-6 w-6 text-primary" />
          </div>
          < div >
          <p className="font-semibold" > Total Subscription Cost </p>
            < p className = "text-xs text-muted-foreground" > { overview.modules.filter(m => m.is_active).length } active module(s) </p>
              </div>
              </div>
              < div className = "text-right" >
                <p className="text-3xl font-black text-primary" >
                  { fmt(overview.modules.filter(m => m.is_active && m.subscription_type === "monthly").reduce((s, m) => s + m.price_at_subscription, 0)) }
                  </p>
                  < p className = "text-xs text-muted-foreground" > per month </p>
                    </div>
                    </div>
                    </TabsContent>
                    </Tabs>
                    </div>
                    </DashboardLayout>
  );
}
