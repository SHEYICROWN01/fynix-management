import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Search, Download, RefreshCw, ArrowUpRight, ArrowDownRight,
  Wallet, Send, Activity, ShieldAlert, Banknote, Building2,
  Settings2, Eye, CreditCard, ChevronLeft, ChevronRight,
  Zap, Clock, Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantSms {
  id: number;
  name: string;
  balance: number;
  totalSent: number;
  totalSpent: number;
  lastActivity: string;
  status: "active" | "low_balance" | "suspended";
  failureRate: number;
  revenue: number;
  profit: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const smsTrend7d = [
  { date: "Apr 21", otp: 8900, transactional: 3550, failed: 234 },
  { date: "Apr 22", otp: 10200, transactional: 5030, failed: 178 },
  { date: "Apr 23", otp: 7800, transactional: 4090, failed: 312 },
  { date: "Apr 24", otp: 13400, transactional: 5350, failed: 198 },
  { date: "Apr 25", otp: 9800, transactional: 4520, failed: 267 },
  { date: "Apr 26", otp: 15600, transactional: 6080, failed: 145 },
  { date: "Apr 27", otp: 7200, transactional: 2640, failed: 98 },
];

const revenueTrend = [
  { month: "Nov", revenue: 1245000, cost: 748000, profit: 497000 },
  { month: "Dec", revenue: 1589000, cost: 954000, profit: 635000 },
  { month: "Jan", revenue: 1380000, cost: 829000, profit: 551000 },
  { month: "Feb", revenue: 1720000, cost: 1033000, profit: 687000 },
  { month: "Mar", revenue: 2140000, cost: 1285000, profit: 855000 },
  { month: "Apr", revenue: 1890000, cost: 1135000, profit: 755000 },
];

const topInstitutions = [
  { name: "Heritage MFB", sms: 45230 },
  { name: "Unity Coop", sms: 38750 },
  { name: "Pinnacle Bank", sms: 32140 },
  { name: "Crown Finance", sms: 28690 },
  { name: "Nova Credit", sms: 24870 },
  { name: "Apex Savings", sms: 19450 },
  { name: "Crest MFB", sms: 15320 },
  { name: "Fidelity Coop", sms: 12890 },
  { name: "Summit Finance", sms: 9870 },
  { name: "Cedar MFB", sms: 7640 },
];

const failureTrend = [
  { date: "Apr 21", rate: 1.88 },
  { date: "Apr 22", rate: 1.17 },
  { date: "Apr 23", rate: 2.62 },
  { date: "Apr 24", rate: 1.06 },
  { date: "Apr 25", rate: 1.86 },
  { date: "Apr 26", rate: 0.67 },
  { date: "Apr 27", rate: 1.0 },
];

const mockTenants: TenantSms[] = [
  { id: 1, name: "Heritage MFB", balance: 45000, totalSent: 45230, totalSpent: 814140, lastActivity: "2 mins ago", status: "active", failureRate: 0.8, revenue: 1356900, profit: 542760 },
  { id: 2, name: "Unity Cooperative", balance: 2800, totalSent: 38750, totalSpent: 697500, lastActivity: "15 mins ago", status: "low_balance", failureRate: 1.2, revenue: 1162500, profit: 465000 },
  { id: 3, name: "Pinnacle Microfinance", balance: 18500, totalSent: 32140, totalSpent: 578520, lastActivity: "1 hr ago", status: "active", failureRate: 0.5, revenue: 964200, profit: 385680 },
  { id: 4, name: "Crown Finance Ltd", balance: 0, totalSent: 28690, totalSpent: 516420, lastActivity: "3 days ago", status: "suspended", failureRate: 3.2, revenue: 860700, profit: 344280 },
  { id: 5, name: "Nova Credit Union", balance: 9200, totalSent: 24870, totalSpent: 447660, lastActivity: "30 mins ago", status: "active", failureRate: 1.5, revenue: 746100, profit: 298440 },
  { id: 6, name: "Apex Savings Bank", balance: 1500, totalSent: 19450, totalSpent: 350100, lastActivity: "2 hrs ago", status: "low_balance", failureRate: 2.1, revenue: 583500, profit: 233400 },
  { id: 7, name: "Crest Microfinance", balance: 22000, totalSent: 15320, totalSpent: 275760, lastActivity: "5 hrs ago", status: "active", failureRate: 0.9, revenue: 459600, profit: 183840 },
  { id: 8, name: "Fidelity Cooperative", balance: 8750, totalSent: 12890, totalSpent: 232020, lastActivity: "1 day ago", status: "active", failureRate: 1.1, revenue: 386700, profit: 154680 },
];

const mockSmsLogs = [
  { id: 1, date: "Apr 27, 10:32 AM", phone: "0803***5621", type: "OTP", status: "sent", reason: "—" },
  { id: 2, date: "Apr 27, 10:28 AM", phone: "0701***8834", type: "Transactional", status: "sent", reason: "—" },
  { id: 3, date: "Apr 27, 10:15 AM", phone: "0905***2210", type: "OTP", status: "failed", reason: "Invalid number" },
  { id: 4, date: "Apr 27, 10:01 AM", phone: "0812***9034", type: "OTP", status: "sent", reason: "—" },
  { id: 5, date: "Apr 27, 09:48 AM", phone: "0703***4421", type: "Transactional", status: "sent", reason: "—" },
  { id: 6, date: "Apr 27, 09:33 AM", phone: "0901***7812", type: "OTP", status: "failed", reason: "Network timeout" },
  { id: 7, date: "Apr 27, 09:20 AM", phone: "0816***3345", type: "Transactional", status: "sent", reason: "—" },
  { id: 8, date: "Apr 27, 09:07 AM", phone: "0708***6678", type: "OTP", status: "sent", reason: "—" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-NG");
const fmtN = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const STATUS_CONFIG = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  low_balance: { label: "Low Balance", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  suspended: { label: "Suspended", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title, value, subtext, icon: Icon, trend, trendValue, iconBg, iconColor,
}: {
  title: string; value: string; subtext: string; icon: React.ElementType;
  trend: "up" | "down" | "neutral"; trendValue: string; iconBg: string; iconColor: string;
}) {
  const isUp = trend === "up";
  const isNeutral = trend === "neutral";
  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {!isNeutral && (
                isUp
                  ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  : <ArrowDownRight className="h-3.5 w-3.5 text-red-500 shrink-0" />
              )}
              <span className={`text-xs font-semibold ${isNeutral ? "text-muted-foreground" : isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                {trendValue}
              </span>
              <span className="text-xs text-muted-foreground">{subtext}</span>
            </div>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SmsManagement() {
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d">("7d");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "low_balance" | "suspended">("all");
  const [fundTenant, setFundTenant] = useState<TenantSms | null>(null);
  const [viewTenant, setViewTenant] = useState<TenantSms | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [pricePerSms, setPricePerSms] = useState("30");
  const [page, setPage] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const PER_PAGE = 6;

  const smsUnitsToCredit = useMemo(() => {
    const amount = parseFloat(fundAmount.replace(/,/g, "")) || 0;
    const price = parseFloat(pricePerSms) || 30;
    return Math.floor(amount / price);
  }, [fundAmount, pricePerSms]);

  const filteredTenants = useMemo(() => {
    return mockTenants.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const paginatedTenants = filteredTenants.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filteredTenants.length / PER_PAGE);

  const lowBalanceCount = mockTenants.filter((t) => t.status === "low_balance").length;
  const suspendedCount = mockTenants.filter((t) => t.status === "suspended").length;
  const highFailureCount = mockTenants.filter((t) => t.failureRate > 2).length;

  return (
    <DashboardLayout title="SMS Management">
      <div className="space-y-6">

        {/* ── Alert Banners ─────────────────────────────────────── */}
        {(lowBalanceCount > 0 || suspendedCount > 0 || highFailureCount > 0) && (
          <div className="space-y-2">
            {lowBalanceCount > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex-1">
                  {lowBalanceCount} institution{lowBalanceCount > 1 ? "s are" : " is"} running low on SMS balance
                </p>
                <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100 shrink-0 h-7 text-xs" onClick={() => setStatusFilter("low_balance")}>
                  View
                </Button>
              </div>
            )}
            {suspendedCount > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3">
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-800 dark:text-red-300 flex-1">
                  {suspendedCount} institution{suspendedCount > 1 ? "s are" : " is"} suspended — SMS delivery halted
                </p>
                <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-100 shrink-0 h-7 text-xs" onClick={() => setStatusFilter("suspended")}>
                  View
                </Button>
              </div>
            )}
            {highFailureCount > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 px-4 py-3">
                <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0" />
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300 flex-1">
                  {highFailureCount} institution{highFailureCount > 1 ? "s are" : " is"} experiencing high SMS failure rates (&gt;2%)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Page Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">SMS Management</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full control over SMS wallets, usage analytics, and delivery performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>

        {/* ── Date Range Tabs ───────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["today", "7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                dateRange === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {r === "today" ? "Today" : r === "7d" ? "Last 7 Days" : "Last 30 Days"}
            </button>
          ))}
          <button className="rounded-full px-4 py-1.5 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
            Custom Range
          </button>
        </div>

        {/* ── Stat Cards Row 1 ──────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="System SMS Balance" value={fmt(284750)} subtext="vs last 7 days" trend="up" trendValue="+12.4%" icon={Wallet} iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-600 dark:text-indigo-400" />
          <StatCard title="Total SMS Sent" value={fmt(1048320)} subtext="all time" trend="up" trendValue="+8.7%" icon={Send} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" />
          <StatCard title="SMS Sent Today" value={fmt(9840)} subtext="vs yesterday" trend="down" trendValue="-4.2%" icon={MessageSquare} iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600 dark:text-violet-400" />
          <StatCard title="Failed SMS Rate" value="1.38%" subtext="last 7 days" trend="down" trendValue="-0.3%" icon={XCircle} iconBg="bg-rose-100 dark:bg-rose-900/30" iconColor="text-rose-600 dark:text-rose-400" />
        </div>

        {/* ── Stat Cards Row 2 ──────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard title="Total Revenue" value={fmtN(10963500)} subtext="vs last month" trend="up" trendValue="+14.2%" icon={TrendingUp} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" />
          <StatCard title="Provider Cost" value={fmtN(6578100)} subtext="vs last month" trend="up" trendValue="+9.8%" icon={Banknote} iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-600 dark:text-orange-400" />
          <StatCard title="Net Profit" value={fmtN(4385400)} subtext="40% margin" trend="up" trendValue="+21.5%" icon={Activity} iconBg="bg-teal-100 dark:bg-teal-900/30" iconColor="text-teal-600 dark:text-teal-400" />
        </div>

        {/* ── Charts Row 1 ──────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">SMS Usage Trend</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Daily OTP vs Transactional volume</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />OTP
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />Transactional
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={smsTrend7d} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradOtp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradTrans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number, name: string) => [fmt(v), name === "otp" ? "OTP" : "Transactional"]}
                    />
                    <Area type="monotone" dataKey="otp" stroke="#6366f1" strokeWidth={2} fill="url(#gradOtp)" name="otp" />
                    <Area type="monotone" dataKey="transactional" stroke="#10b981" strokeWidth={2} fill="url(#gradTrans)" name="transactional" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Failure Rate Trend</CardTitle>
              <CardDescription className="text-xs mt-0.5">Daily % — alert threshold: 2.0%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={failureTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradFail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 4]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => [`${v}%`, "Failure Rate"]}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#f43f5e" strokeWidth={2} fill="url(#gradFail)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-border pt-3">
                <span className="text-muted-foreground">Today: <span className="font-semibold text-foreground">1.00%</span></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />Within threshold
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Charts Row 2 ──────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Revenue · Cost · Profit</CardTitle>
              <CardDescription className="text-xs mt-0.5">6-month financial performance (₦)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number, name: string) => [fmtN(v), name.charAt(0).toUpperCase() + name.slice(1)]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="revenue" />
                    <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} name="cost" />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">SMS Volume by Institution</CardTitle>
              <CardDescription className="text-xs mt-0.5">Top 10 tenants — all time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topInstitutions} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} width={88} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => [fmt(v), "SMS Sent"]}
                    />
                    <Bar dataKey="sms" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tenant SMS Wallets Table ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Institution SMS Wallets</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {filteredTenants.length} institutions — manage balances and view usage
                </CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 self-start sm:self-auto">
                <Zap className="h-3.5 w-3.5" />Bulk Fund
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search institution..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
                <SelectTrigger className="h-9 w-full sm:w-44 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="low_balance">Low Balance</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institution</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">SMS Balance</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Total Sent</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Total Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Last Activity</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{tenant.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`font-semibold tabular-nums ${tenant.balance === 0 ? "text-red-500" : tenant.balance < 3000 ? "text-amber-600" : "text-foreground"}`}>
                          {fmt(tenant.balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums hidden sm:table-cell">{fmt(tenant.totalSent)}</td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums hidden md:table-cell">{fmtN(tenant.totalSpent)}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />{tenant.lastActivity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CONFIG[tenant.status].cls}`}>
                          {STATUS_CONFIG[tenant.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setViewTenant(tenant)}>
                            <Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">View</span>
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10" onClick={() => { setFundTenant(tenant); setFundAmount(""); }}>
                            <CreditCard className="h-3.5 w-3.5" /><span className="hidden sm:inline">Fund</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedTenants.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        No institutions found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredTenants.length)} of {filteredTenants.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium px-2">{page} / {totalPages}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Profit Leaderboard ────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">💰 Profit Leaderboard</CardTitle>
            <CardDescription className="text-xs mt-0.5">Top institutions by net profit contribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...mockTenants]
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 5)
                .map((t, i) => {
                  const max = mockTenants.reduce((m, x) => Math.max(m, x.profit), 0);
                  const pct = Math.round((t.profit / max) * 100);
                  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className="text-base w-6 shrink-0">{medals[i]}</span>
                      <span className="text-sm font-medium text-foreground w-40 shrink-0 truncate">{t.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums w-28 text-right shrink-0">{fmtN(t.profit)}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FUND SMS WALLET MODAL                                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!fundTenant} onOpenChange={(open) => !open && setFundTenant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />Fund SMS Wallet
            </DialogTitle>
            <DialogDescription>Credit SMS units to {fundTenant?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/50 px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Institution</p>
                <p className="text-sm font-semibold text-foreground truncate">{fundTenant?.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="text-sm font-semibold text-foreground">{fmt(fundTenant?.balance ?? 0)} SMS</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Amount to Fund (₦)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₦</span>
                <Input className="pl-7" placeholder="e.g. 100,000" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Price per SMS (₦)</Label>
              <Input value={pricePerSms} onChange={(e) => setPricePerSms(e.target.value)} placeholder="30" />
              <p className="text-xs text-muted-foreground">Platform charge: ₦30/SMS · Provider cost: ₦18/SMS · Margin: 40%</p>
            </div>
            <Separator />
            <div className={`rounded-xl border-2 p-4 text-center transition-all ${smsUnitsToCredit > 0 ? "border-primary/40 bg-primary/5" : "border-dashed border-border"}`}>
              {smsUnitsToCredit > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">You are about to credit</p>
                  <p className="text-4xl font-bold text-primary tabular-nums">{fmt(smsUnitsToCredit)}</p>
                  <p className="text-sm text-muted-foreground mt-1">SMS units to <span className="font-semibold text-foreground">{fundTenant?.name}</span></p>
                  <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>New Balance: <span className="font-semibold text-foreground">{fmt((fundTenant?.balance ?? 0) + smsUnitsToCredit)}</span></span>
                    <span>·</span>
                    <span>Your profit: <span className="font-semibold text-emerald-600">{fmtN(Math.floor(smsUnitsToCredit * (parseFloat(pricePerSms) - 18)))}</span></span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-3">Enter an amount above to see preview</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFundTenant(null)}>Cancel</Button>
            <Button disabled={smsUnitsToCredit === 0} onClick={() => setFundTenant(null)} className="gap-1.5">
              <Zap className="h-3.5 w-3.5" />Confirm Funding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TENANT DETAIL DIALOG                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!viewTenant} onOpenChange={(open) => !open && setViewTenant(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              {viewTenant?.name}
            </DialogTitle>
            <DialogDescription>Full SMS usage, billing breakdown, and delivery logs</DialogDescription>
          </DialogHeader>

          {viewTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "SMS Balance", value: fmt(viewTenant.balance), color: viewTenant.balance < 3000 ? "text-amber-600" : "text-foreground" },
                  { label: "Total Sent", value: fmt(viewTenant.totalSent), color: "text-foreground" },
                  { label: "Total Spent", value: fmtN(viewTenant.totalSpent), color: "text-foreground" },
                  { label: "Failure Rate", value: `${viewTenant.failureRate}%`, color: viewTenant.failureRate > 2 ? "text-red-500" : "text-emerald-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <Tabs defaultValue="logs">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
                  <TabsTrigger value="logs" className="text-xs">SMS Logs</TabsTrigger>
                  <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
                  <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-3 mt-4">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold mb-3">SMS Activity — Last 7 Days</p>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={smsTrend7d} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradTenant" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} formatter={(v: number) => [fmt(Math.floor(v * 0.18)), "SMS"]} />
                          <Area type="monotone" dataKey="otp" stroke="#6366f1" strokeWidth={2} fill="url(#gradTenant)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">OTP SMS</p>
                      <p className="text-xl font-bold">{fmt(Math.floor(viewTenant.totalSent * 0.71))}</p>
                      <p className="text-xs text-muted-foreground mt-1">71% of total volume</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Transactional SMS</p>
                      <p className="text-xl font-bold">{fmt(Math.floor(viewTenant.totalSent * 0.29))}</p>
                      <p className="text-xs text-muted-foreground mt-1">29% of total volume</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border">
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {mockSmsLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-muted/20">
                              <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{log.date}</td>
                              <td className="px-3 py-2.5 font-mono">{log.phone}</td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${log.type === "OTP" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                                  {log.type}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${log.status === "sent" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                  {log.status === "sent" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">{log.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">Showing 8 of {fmt(viewTenant.totalSent)} records</p>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                      <Download className="h-3 w-3" />Export Logs
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="billing" className="space-y-3 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 p-4 text-center">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Total Revenue</p>
                      <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{fmtN(viewTenant.revenue)}</p>
                    </div>
                    <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 p-4 text-center">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">Provider Cost</p>
                      <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{fmtN(viewTenant.totalSpent)}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4 text-center">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Net Profit</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{fmtN(viewTenant.profit)}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Profit Margin</span>
                      <span className="font-bold text-emerald-600">{Math.round((viewTenant.profit / viewTenant.revenue) * 100)}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${Math.round((viewTenant.profit / viewTenant.revenue) * 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>₦18/SMS to provider</span>
                      <span>₦30/SMS charged to tenant</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-3 mt-4">
                  {viewTenant.status === "low_balance" && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Low SMS Balance</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          Balance is {fmt(viewTenant.balance)} SMS — below the 3,000 unit threshold. Fund now to avoid disruption.
                        </p>
                        <Button size="sm" className="mt-2 h-7 text-xs gap-1.5" onClick={() => { setViewTenant(null); setFundTenant(viewTenant); setFundAmount(""); }}>
                          <CreditCard className="h-3.5 w-3.5" />Fund Now
                        </Button>
                      </div>
                    </div>
                  )}
                  {viewTenant.failureRate > 2 && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4">
                      <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">High Failure Rate</p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                          Failure rate is {viewTenant.failureRate}% — above 2% threshold. Check SMS logs for failure reasons.
                        </p>
                      </div>
                    </div>
                  )}
                  {viewTenant.status !== "low_balance" && viewTenant.failureRate <= 2 && (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <p className="text-sm font-medium">No active alerts — all systems normal</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewTenant(null)}>Close</Button>
            <Button onClick={() => { setFundTenant(viewTenant); setViewTenant(null); setFundAmount(""); }} className="gap-1.5">
              <CreditCard className="h-4 w-4" />Fund Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SYSTEM SETTINGS DIALOG                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />SMS System Settings
            </DialogTitle>
            <DialogDescription>Configure pricing, thresholds, and delivery behaviour</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Charge Price (₦/SMS)</Label>
                <Input defaultValue="30" />
                <p className="text-xs text-muted-foreground">What you charge tenants</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Provider Cost (₦/SMS)</Label>
                <Input defaultValue="18" />
                <p className="text-xs text-muted-foreground">What you pay provider</p>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Auto-calculated Margin</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">(30 - 18) / 30 × 100</p>
              </div>
              <span className="text-2xl font-bold text-emerald-600">40%</span>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Low Balance Threshold (units)</Label>
              <Input defaultValue="3000" />
              <p className="text-xs text-muted-foreground">Alert when tenant balance falls below this value</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Default Sender ID</Label>
              <Input defaultValue="FynixBank" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Max SMS Retries</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "retry" : "retries"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Failure Alert Threshold (%)</Label>
                <Input defaultValue="2.0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => setSettingsOpen(false)} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
