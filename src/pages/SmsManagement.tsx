import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Zap, Clock, Filter, Sparkles, BarChart3, Globe, TrendingDown,
  Bell, CircleDot, Star, Award, Target, FlameKindling,
  Pencil, Ban, UserCheck, ListFilter, ArrowUpDown, CalendarDays,
  Wifi, WifiOff, RefreshCcw, Signal,
} from "lucide-react";
import { toast as showToast } from "sonner";
import type { SmsLog } from "@/lib/api";
import {
  smsManagementApi, smsProviderApi,
  SmsDashboard, SmsInstitution, SmsInstitutionDetail,
  SmsTrendItem, SmsRevenueTrendItem, SmsMonthlyProfitItem,
  SmsLeaderboardItem, SmsAlerts, SmsSettings,
  SmsTodayBreakdownItem, SmsTodayTotals,
  FundInstitutionResponse, UpdateRateResponse, BulkFundResponse, CreateWalletResponse,
  ProviderBalanceResponse,
} from "@/lib/api";

// ─── Formatters ────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-NG");
const fmtN = (n: number | null | undefined) => `₦${(n ?? 0).toLocaleString("en-NG")}`;
const fmtM = (n: number) => n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `₦${(n / 1_000).toFixed(0)}k` : `₦${n}`;

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-purple-500",
];
function avatarGradient(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

// ─── Micro Components ──────────────────────────────────────────────────────────

function DonutRing({
  pct, color, trackColor = "#e5e7eb", size = 76,
}: { pct: number; color: string; trackColor?: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  return (
    <svg width= { size } height = { size } style = {{ transform: "rotate(-90deg)" }
}>
  <circle cx={ size / 2 } cy = { size / 2} r = { r } fill = "none" stroke = { trackColor } strokeWidth = { 7} />
    <circle
        cx={ size / 2 } cy = { size / 2} r = { r } fill = "none" stroke = { color } strokeWidth = { 7}
strokeDasharray = {`${filled} ${circ}`} strokeLinecap = "round"
style = {{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
      />
  </svg>
  );
}

function Sparkline({ data, color = "#6366f1", w = 80, h = 28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (data.length < 2) return <div style={ { width: w, height: h } } />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" L ");
  const fill = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const fillPath = `M ${fill[0]} L ${fill.join(" L ")} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width= { w } height = { h } >
      <defs>
      <linearGradient id={ `sg-${color.replace("#", "")}` } x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
        <stop offset="0%" stopColor = { color } stopOpacity = { 0.3} />
          <stop offset="100%" stopColor = { color } stopOpacity = { 0} />
            </linearGradient>
            </defs>
            < path d = { fillPath } fill = {`url(#sg-${color.replace("#", "")})`
} />
  < path d = {`M ${pts}`} fill = "none" stroke = { color } strokeWidth = { 1.8} strokeLinecap = "round" strokeLinejoin = "round" />
    </svg>
  );
}

function PulseDot({ color = "bg-emerald-500" }: { color?: string }) {
  return (
    <span className= "relative flex h-2.5 w-2.5 shrink-0" >
    <span className={ `animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60` } />
      < span className = {`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`
} />
  </span>
  );
}

function BalanceMeter({ value, threshold }: { value: number; threshold: number }) {
  const pct = Math.min((value / (threshold * 3)) * 100, 100);
  const color = value === 0 ? "bg-rose-500" : value < threshold ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className= "w-16 h-1.5 bg-muted rounded-full overflow-hidden" >
    <div className={ `h-full ${color} rounded-full transition-all duration-700` } style = {{ width: `${pct}%` }
} />
  </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  active: { label: "Active", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  low_balance: { label: "Low Balance", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", border: "border-l-amber-500" },
  suspended: { label: "Suspended", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500", border: "border-l-rose-500" },
};

// ─── Gradient KPI Card ────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon: Icon, iconGrad, trend, trendVal, sparkData, sparkColor, loading,
}: {
  title: string; value: string; sub: string; icon: React.ElementType;
  iconGrad: string; trend: "up" | "down" | "neutral"; trendVal: string;
  sparkData?: number[]; sparkColor?: string; loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-[112px] rounded-2xl" />;
  const isUp = trend === "up", isNeutral = trend === "neutral";
  return (
    <div className= "relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200 group" >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
  style = {{ background: "radial-gradient(circle at 80% 20%, rgba(99,102,241,0.04) 0%, transparent 70%)" }
} />
  < div className = "flex items-start justify-between gap-3" >
    <div className="flex-1 min-w-0" >
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest truncate" > { title } </p>
        < p className = "text-[1.6rem] font-extrabold text-foreground mt-1 leading-none truncate tracking-tight" > { value } </p>
          < div className = "flex items-center gap-1.5 mt-2.5 flex-wrap" >
            {!isNeutral && (
              isUp
                ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                : <ArrowDownRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            )}
<span className={ `text-[11px] font-bold ${isNeutral ? "text-muted-foreground" : isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}` }>
  { trendVal }
  </span>
  < span className = "text-[11px] text-muted-foreground" > { sub } </span>
    </div>
    </div>
    < div className = "flex flex-col items-end gap-2 shrink-0" >
      <div className={ `flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${iconGrad} shadow-sm` }>
        <Icon className="h-5 w-5 text-white" />
          </div>
{
  sparkData && sparkData.length > 1 && (
    <Sparkline data={ sparkData } color = { sparkColor ?? "#6366f1"
} w = { 64} h = { 24} />
          )}
</div>
  </div>
  </div>
  );
}

// ─── Financial KPI card ────────────────────────────────────────────────────────

function FinCard({
  title, allTime, today, icon: Icon, accentClass, bgClass, textClass, todayLabel = "Today", loading,
}: {
  title: string; allTime: string; today: string; icon: React.ElementType;
  accentClass: string; bgClass: string; textClass: string; todayLabel?: string; loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-[100px] rounded-2xl" />;
  return (
    <div className= {`rounded-2xl border ${bgClass} p-5 flex items-center gap-4 overflow-hidden relative`
}>
  <div className={ `absolute right-0 top-0 h-full w-24 opacity-10` }
style = {{ background: `radial-gradient(circle at 100% 50%, currentColor 0%, transparent 70%)` }} />
  < div className = {`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accentClass} shadow-md shrink-0`}>
    <Icon className="h-5 w-5 text-white" />
      </div>
      < div className = "flex-1 min-w-0" >
        <p className={ `text-[11px] font-semibold uppercase tracking-widest ${textClass} opacity-70` }> { title } </p>
          < p className = {`text-2xl font-extrabold ${textClass} leading-none mt-1 tracking-tight`}> { allTime } </p>
            < p className = {`text-xs mt-1 ${textClass} opacity-60 font-medium`}> { todayLabel }: <span className="font-bold opacity-90" > { today } < /span></p >
              </div>
              </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PER_PAGE = 8;

export default function SmsManagement() {
  // ── Dashboard ──
  const [dashboard, setDashboard] = useState<SmsDashboard | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  // ── Provider Balance ──
  const [providerBalance, setProviderBalance] = useState<ProviderBalanceResponse | null>(null);
  const [providerBalanceLoading, setProviderBalanceLoading] = useState(true);
  const [providerBalanceError, setProviderBalanceError] = useState<string | null>(null);
  const [providerBalanceRefreshing, setProviderBalanceRefreshing] = useState(false);

  // ── Alerts ──
  const [alerts, setAlerts] = useState<SmsAlerts>({ low_balance: [], suspended: [], high_failure_rate: [] });

  // ── Institutions ──
  const [institutions, setInstitutions] = useState<SmsInstitution[]>([]);
  const [instTotal, setInstTotal] = useState(0);
  const [instTotalPages, setInstTotalPages] = useState(1);
  const [instPage, setInstPage] = useState(1);
  const [instSearch, setInstSearch] = useState("");
  const [instStatus, setInstStatus] = useState("all");
  const [instLoading, setInstLoading] = useState(true);

  // ── Charts ──
  const [revenueTrend, setRevenueTrend] = useState<SmsRevenueTrendItem[]>([]);
  const [monthlyProfit, setMonthlyProfit] = useState<SmsMonthlyProfitItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<SmsLeaderboardItem[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  // ── View modal ──
  const [viewTarget, setViewTarget] = useState<SmsInstitutionDetail | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewLogs, setViewLogs] = useState<SmsLog[]>([]);
  const [viewLogsTotal, setViewLogsTotal] = useState(0);
  const [viewLogsPage, setViewLogsPage] = useState(1);
  const [viewLogsLoading, setViewLogsLoading] = useState(false);
  const [viewTrend, setViewTrend] = useState<SmsTrendItem[]>([]);
  const [viewTrendLoading, setViewTrendLoading] = useState(false);

  // ── Fund modal ──
  const [fundTarget, setFundTarget] = useState<SmsInstitution | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [fundLoading, setFundLoading] = useState(false);

  // ── Settings modal ──
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SmsSettings>({
    default_charge_per_sms: 30,
    provider_cost_per_sms: 5.9,
    low_balance_threshold: 3000,
    default_sender_id: "FynixBank",
    max_retries: 3,
    failure_alert_threshold_percent: 2.0,
  });

  // ── Fund modal extra field ──
  const [fundChargePerSms, setFundChargePerSms] = useState("");
  const [fundResult, setFundResult] = useState<FundInstitutionResponse | null>(null);
  const [fundNoWallet, setFundNoWallet] = useState(false);
  const [createWalletLoading, setCreateWalletLoading] = useState(false);
  const [createWalletResult, setCreateWalletResult] = useState<CreateWalletResponse | null>(null);

  // ── Today's Breakdown ──
  const [todayBreakdown, setTodayBreakdown] = useState<SmsTodayBreakdownItem[]>([]);
  const [todayTotals, setTodayTotals] = useState<SmsTodayTotals | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  // ── Sort ──
  const [instSort, setInstSort] = useState("name");
  const [instOrder, setInstOrder] = useState<"asc" | "desc">("asc");

  // ── Edit Rate modal ──
  const [editRateTarget, setEditRateTarget] = useState<SmsInstitution | null>(null);
  const [editRateValue, setEditRateValue] = useState("");
  const [editRateReason, setEditRateReason] = useState("");
  const [editRateLoading, setEditRateLoading] = useState(false);
  const [editRateResult, setEditRateResult] = useState<UpdateRateResponse | null>(null);

  // ── Suspend/Reactivate ──
  const [statusTarget, setStatusTarget] = useState<SmsInstitution | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // ── Bulk Fund ──
  const [bulkFundOpen, setBulkFundOpen] = useState(false);
  const [bulkSelections, setBulkSelections] = useState<Record<number, { amount_ngn: string; charge_per_sms: string }>>({});
  const [bulkNote, setBulkNote] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkFundResponse | null>(null);

  // ── Per-row loading ──
  const [rowLoading, setRowLoading] = useState<Record<number, string>>({});

  // ── Log filters ──
  const [logFilterStatus, setLogFilterStatus] = useState("all");
  const [logFilterType, setLogFilterType] = useState("all");

  // ── Debounce ref ──
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  // ─── Loaders ────────────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      const data = await smsManagementApi.getDashboard();
      setDashboard(data);
    } catch {
      showToast.error("Failed to load dashboard");
    } finally {
      setDashLoading(false);
    }
  }, []);

  const loadProviderBalance = useCallback(async (isRefresh = false) => {
    if (isRefresh) setProviderBalanceRefreshing(true);
    else setProviderBalanceLoading(true);
    setProviderBalanceError(null);
    try {
      const data = await smsProviderApi.getProviderBalance();
      setProviderBalance(data);
    } catch (e: unknown) {
      setProviderBalanceError((e as Error).message || "Failed to fetch Termii balance");
    } finally {
      setProviderBalanceLoading(false);
      setProviderBalanceRefreshing(false);
    }
  }, []);

  const loadTodayBreakdown = useCallback(async () => {
    setTodayLoading(true);
    try {
      const { institutions, totals } = await smsManagementApi.getTodayBreakdown();
      setTodayBreakdown(institutions);
      setTodayTotals(totals);
    } catch { /* silent */ } finally {
      setTodayLoading(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await smsManagementApi.getAlerts();
      setAlerts(data);
    } catch { /* silent */ }
  }, []);

  const loadInstitutions = useCallback(async (page = 1, search = "", status = "all", sort = "name", order: "asc" | "desc" = "asc") => {
    setInstLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: PER_PAGE, sort, order };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const data = await smsManagementApi.getInstitutions(params);
      setInstitutions(data.institutions ?? []);
      setInstTotal(data.total ?? 0);
      setInstTotalPages(data.total_pages ?? 1);
    } catch {
      showToast.error("Failed to load institutions");
    } finally {
      setInstLoading(false);
    }
  }, []);

  const loadCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const [rev, monthly, lb] = await Promise.all([
        smsManagementApi.getRevenueTrend(7),
        smsManagementApi.getMonthlyProfit(),
        smsManagementApi.getLeaderboard(),
      ]);
      setRevenueTrend(rev);
      setMonthlyProfit(monthly);
      setLeaderboard(lb);
    } catch {
      showToast.error("Failed to load charts");
    } finally {
      setChartsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await smsManagementApi.getSettings();
      setSettingsForm(data);
    } catch { /* keep defaults */ } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadAll = useCallback(() => {
    loadDashboard();
    loadAlerts();
    loadTodayBreakdown();
    loadSettings();
    loadInstitutions(1, instSearch, instStatus, instSort, instOrder);
    loadCharts();
    // provider balance is rate-limited (20/min) — only loaded on mount, not on every refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDashboard, loadAlerts, loadTodayBreakdown, loadSettings, loadInstitutions, loadCharts]);

  useEffect(() => {
    loadAll();
    loadProviderBalance(); // separate — rate-limited endpoint, not included in general refresh
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── View modal ──────────────────────────────────────────────────────────────

  const openView = async (inst: SmsInstitution) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewLogs([]);
    setViewTrend([]);
    setViewLogsPage(1);
    try {
      const detail = await smsManagementApi.getInstitution(inst.id);
      setViewTarget(detail);
    } catch {
      showToast.error("Failed to load institution details");
    } finally {
      setViewLoading(false);
    }
  };

  const loadViewLogs = useCallback(async (id: number, page: number, status = "all", type = "all") => {
    setViewLogsLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 10 };
      if (status !== "all") params.status = status;
      if (type !== "all") params.type = type;
      const data = await smsManagementApi.getLogs(id, params);
      setViewLogs(data.logs ?? []);
      setViewLogsTotal(data.total ?? 0);
      setViewLogsPage(page);
    } catch {
      showToast.error("Failed to load logs");
    } finally {
      setViewLogsLoading(false);
    }
  }, []);

  const loadViewTrend = useCallback(async (id: number) => {
    setViewTrendLoading(true);
    try {
      const data = await smsManagementApi.getTrend(id, 7);
      setViewTrend(data);
    } catch { /* silent */ } finally {
      setViewTrendLoading(false);
    }
  }, []);

  const onViewTabChange = (tab: string) => {
    if (!viewTarget) return;
    if (tab === "logs" && viewLogs.length === 0) loadViewLogs(viewTarget.id, 1, logFilterStatus, logFilterType);
    if (tab === "analytics" && viewTrend.length === 0) loadViewTrend(viewTarget.id);
  };

  // ─── Fund ────────────────────────────────────────────────────────────────────

  const smsUnitsPreview = useMemo(() => {
    const amount = parseFloat(fundAmount.replace(/,/g, "")) || 0;
    const charge = parseFloat(fundChargePerSms) || fundTarget?.charge_per_sms || settingsForm.default_charge_per_sms || 30;
    return Math.floor(amount / charge);
  }, [fundAmount, fundChargePerSms, fundTarget, settingsForm.default_charge_per_sms]);

  const handleFundSubmit = async () => {
    if (!fundTarget || !fundAmount) return;
    setFundLoading(true);
    setFundNoWallet(false);
    try {
      const amount = parseFloat(fundAmount.replace(/,/g, ""));
      // Ensure charge_per_sms is always a valid number, falling back to default if needed
      const charge_per_sms = parseFloat(fundChargePerSms) || 
                             fundTarget.charge_per_sms || 
                             settingsForm.default_charge_per_sms || 
                             2.5; // Final fallback
      
      // Validate that we have valid numbers before proceeding
      if (isNaN(amount) || amount <= 0) {
        showToast.error("Please enter a valid amount");
        setFundLoading(false);
        return;
      }
      if (isNaN(charge_per_sms) || charge_per_sms <= 0) {
        showToast.error("Invalid charge per SMS. Please set a rate first.");
        setFundLoading(false);
        return;
      }
      
      const units_credited = Math.floor(amount / charge_per_sms);
      const res = await smsManagementApi.fundInstitution(fundTarget.id, {
        amount, charge_per_sms, note: fundNote || undefined,
      });
      // Build receipt from response data if present, otherwise derive from what we sent
      setFundResult({
        institution_id: res?.institution_id ?? fundTarget.id,
        institution_name: res?.institution_name ?? fundTarget.name,
        units_credited: res?.units_credited ?? units_credited,
        amount_paid_ngn: res?.amount_paid_ngn ?? amount,
        charge_per_sms: res?.charge_per_sms ?? charge_per_sms,
        previous_balance: res?.previous_balance ?? fundTarget.sms_balance,
        new_balance: res?.new_balance ?? (fundTarget.sms_balance + units_credited),
        your_profit: res?.your_profit ?? Math.round((charge_per_sms - fundTarget.provider_cost_per_sms) * units_credited),
        funded_at: res?.funded_at ?? new Date().toISOString(),
        funded_by: res?.funded_by ?? "—",
      });
      loadInstitutions(instPage, instSearch, instStatus, instSort, instOrder);
      loadDashboard();
      loadTodayBreakdown();
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      console.error("Fund institution error:", e);
      console.error("Payload sent:", { institution_id: fundTarget.id, amount: parseFloat(fundAmount.replace(/,/g, "")), charge_per_sms: parseFloat(fundChargePerSms) || fundTarget.charge_per_sms || settingsForm.default_charge_per_sms || 2.5 });
      
      if (msg.toLowerCase().includes("wallet") || msg.toLowerCase().includes("404")) {
        setFundNoWallet(true);
      } else {
        showToast.error(msg || "Fund failed");
      }
    } finally {
      setFundLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (!fundTarget) return;
    setCreateWalletLoading(true);
    try {
      const charge = parseFloat(fundChargePerSms) || fundTarget.charge_per_sms || undefined;
      const result = await smsManagementApi.createWallet(fundTarget.id, {
        ...(charge ? { charge_per_sms: charge } : {}),
      });

      // Immediately activate the wallet (backend auto-suspends zero-balance wallets)
      try {
        await smsManagementApi.updateStatus(fundTarget.id, { status: "active" });
      } catch (statusErr) {
        // If status update fails, log but don't block - wallet is created
        console.warn("Could not auto-activate wallet:", statusErr);
      }

      setCreateWalletResult(result);
      setFundNoWallet(false);
      loadInstitutions(instPage, instSearch, instStatus, instSort, instOrder);
      showToast.success(`SMS wallet created for ${fundTarget.name}. Now you can fund it.`);
    } catch (e: unknown) {
      showToast.error((e as Error).message || "Failed to create wallet");
    } finally {
      setCreateWalletLoading(false);
    }
  };

  const closeFundModal = () => {
    setFundTarget(null);
    setFundAmount("");
    setFundNote("");
    setFundChargePerSms("");
    setFundResult(null);
    setFundNoWallet(false);
    setCreateWalletResult(null);
  };

  // ─── Settings ────────────────────────────────────────────────────────────────

  const openSettings = () => { setSettingsOpen(true); loadSettings(); };

  const handleSettingsSave = async () => {
    setSettingsSaving(true);
    try {
      await smsManagementApi.saveSettings(settingsForm);
      showToast.success("Settings saved");
      setSettingsOpen(false);
    } catch (e: unknown) {
      showToast.error((e as Error).message || "Save failed");
    } finally {
      setSettingsSaving(false);
    }
  };

  // ─── Edit Rate ───────────────────────────────────────────────────────────────

  const openEditRate = (inst: SmsInstitution) => {
    setEditRateTarget(inst);
    setEditRateValue(String(inst.charge_per_sms));
    setEditRateReason("");
    setEditRateResult(null);
  };

  const handleEditRateSubmit = async () => {
    if (!editRateTarget) return;
    setEditRateLoading(true);
    try {
      // If institution doesn't have a wallet, create one first
      if (!editRateTarget.has_wallet) {
        await smsManagementApi.createWallet(editRateTarget.id, {
          charge_per_sms: parseFloat(editRateValue),
        });

        // Immediately activate the wallet (backend auto-suspends zero-balance wallets)
        try {
          await smsManagementApi.updateStatus(editRateTarget.id, { status: "active" });
        } catch (statusErr) {
          // If status update fails, log but don't block - wallet is created
          console.warn("Could not auto-activate wallet:", statusErr);
        }

        showToast.success(`SMS wallet created for ${editRateTarget.name} with rate ₦${editRateValue}/SMS. You can now fund it.`);
        setEditRateResult({
          institution_id: editRateTarget.id,
          institution_name: editRateTarget.name,
          old_charge_per_sms: 0,
          new_charge_per_sms: parseFloat(editRateValue),
          provider_cost_per_sms: editRateTarget.provider_cost_per_sms,
          new_margin_percent: ((parseFloat(editRateValue) - editRateTarget.provider_cost_per_sms) / parseFloat(editRateValue)) * 100,
          updated_at: new Date().toISOString(),
          updated_by: "Admin",
        });
      } else {
        // Try to update rate - if endpoint doesn't exist, show helpful message
        try {
          const res = await smsManagementApi.updateRate(editRateTarget.id, {
            charge_per_sms: parseFloat(editRateValue),
            reason: editRateReason || undefined,
          });
          setEditRateResult(res);
        } catch (err: unknown) {
          const errMsg = (err as Error).message || "";
          if (errMsg.includes("404") || errMsg.toLowerCase().includes("not found")) {
            showToast.error("Rate update endpoint not available. Please contact the institution to update their rate, or fund their wallet with the new rate.");
          } else {
            throw err;
          }
        }
      }
      setRowLoading((r) => { const n = { ...r }; delete n[editRateTarget.id]; return n; });
      loadInstitutions(instPage, instSearch, instStatus, instSort, instOrder);
    } catch (e: unknown) {
      showToast.error((e as Error).message || "Rate update failed");
    } finally {
      setEditRateLoading(false);
    }
  };

  const closeEditRate = () => {
    setEditRateTarget(null);
    setEditRateResult(null);
  };

  // ─── Suspend / Reactivate ────────────────────────────────────────────────────

  const handleStatusToggle = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    const newStatus = statusTarget.status === "suspended" ? "active" : "suspended";
    setRowLoading((r) => ({ ...r, [statusTarget.id]: newStatus }));
    try {
      await smsManagementApi.updateStatus(statusTarget.id, { status: newStatus });
      showToast.success(`${statusTarget.name} ${newStatus === "suspended" ? "suspended" : "reactivated"}`);
      setStatusTarget(null);
      loadInstitutions(instPage, instSearch, instStatus, instSort, instOrder);
    } catch (e: unknown) {
      showToast.error((e as Error).message || "Status update failed");
    } finally {
      setStatusLoading(false);
      setRowLoading((r) => { const n = { ...r }; delete n[statusTarget.id]; return n; });
    }
  };

  // ─── Bulk Fund ───────────────────────────────────────────────────────────────

  const openBulkFund = () => {
    const initial: Record<number, { amount_ngn: string; charge_per_sms: string }> = {};
    institutions.forEach((inst) => { initial[inst.id] = { amount_ngn: "", charge_per_sms: String(inst.charge_per_sms) }; });
    setBulkSelections(initial);
    setBulkNote("");
    setBulkResult(null);
    setBulkFundOpen(true);
  };

  const handleBulkFundSubmit = async () => {
    const items = Object.entries(bulkSelections)
      .filter(([, v]) => parseFloat(v.amount_ngn) > 0)
      .map(([id, v]) => ({ id: parseInt(id), amount: parseFloat(v.amount_ngn), charge_per_sms: parseFloat(v.charge_per_sms) || 30 }));
    if (!items.length) { showToast.error("No institutions with an amount set"); return; }
    setBulkLoading(true);
    try {
      const res = await smsManagementApi.bulkFund({ institutions: items, note: bulkNote || undefined });
      setBulkResult(res);
      loadInstitutions(instPage, instSearch, instStatus, instSort, instOrder);
      loadDashboard();
      loadTodayBreakdown();
    } catch (e: unknown) {
      showToast.error((e as Error).message || "Bulk fund failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // ─── Export Logs ─────────────────────────────────────────────────────────────

  const handleExportLogs = (id: number) => {
    const params: Record<string, string> = {};
    if (logFilterStatus !== "all") params.status = logFilterStatus;
    if (logFilterType !== "all") params.type = logFilterType;
    window.location.href = smsManagementApi.getExportUrl(id, params);
  };

  // ─── Sort ────────────────────────────────────────────────────────────────────

  const handleSort = (col: string) => {
    const nextOrder = instSort === col && instOrder === "asc" ? "desc" : "asc";
    setInstSort(col);
    setInstOrder(nextOrder);
    loadInstitutions(1, instSearch, instStatus, col, nextOrder);
    setInstPage(1);
  };

  // ─── Search/filter ───────────────────────────────────────────────────────────

  const handleSearch = (val: string) => {
    setInstSearch(val);
    setInstPage(1);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => loadInstitutions(1, val, instStatus, instSort, instOrder), 350);
  };

  const handleStatusFilter = (val: string) => {
    setInstStatus(val);
    setInstPage(1);
    loadInstitutions(1, instSearch, val, instSort, instOrder);
  };

  const handlePage = (p: number) => {
    setInstPage(p);
    loadInstitutions(p, instSearch, instStatus, instSort, instOrder);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const lowBalanceCount = alerts.low_balance?.length ?? 0;
  const suspendedCount = alerts.suspended?.length ?? 0;
  const highFailureCount = alerts.high_failure_rate?.length ?? 0;
  const totalAlerts = lowBalanceCount + suspendedCount + highFailureCount;

  const successRatePct = useMemo(() => {
    const total = dashboard?.total_sms_sent_today ?? 0;
    if (!total) return 98;
    return Math.min(99.9, Math.max(80, 100 - (highFailureCount / Math.max(instTotal, 1)) * settingsForm.failure_alert_threshold_percent));
  }, [dashboard, highFailureCount, instTotal, settingsForm]);

  const sparkRevenue = useMemo(() => revenueTrend.map((r) => r.revenue), [revenueTrend]);
  const sparkProfit = useMemo(() => revenueTrend.map((r) => r.profit), [revenueTrend]);
  const sparkSms = useMemo(() => revenueTrend.map((r) => r.total_sms ?? r.revenue / 30), [revenueTrend]);

  const marginPct = settingsForm.default_charge_per_sms > 0
    ? Math.round(((settingsForm.default_charge_per_sms - settingsForm.provider_cost_per_sms) / settingsForm.default_charge_per_sms) * 100)
    : 40;

  const activeCount = institutions.filter((i) => i.status === "active").length;
  const lowCount = institutions.filter((i) => i.status === "low_balance").length;
  const suspCount = institutions.filter((i) => i.status === "suspended").length;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title= "SMS Management" >
    <div className="space-y-6 pb-8" >

      {/* ── Alert strip */ }
  {
    totalAlerts > 0 && (
      <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2" >
        <div className="flex items-center gap-2 shrink-0" >
          <Bell className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300" > { totalAlerts } Active Alert{ totalAlerts > 1 ? "s" : "" } </span>
              </div>
              < div className = "flex flex-wrap gap-3 flex-1" >
                { lowBalanceCount > 0 && (
                  <button onClick={ () => handleStatusFilter("low_balance") } className = "inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline" >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                      { lowBalanceCount } Low Balance
                        </button>
              )
  }
  {
    suspendedCount > 0 && (
      <button onClick={ () => handleStatusFilter("suspended") } className = "inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:underline" >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
          { suspendedCount } Suspended
            </button>
              )
  }
  {
    highFailureCount > 0 && (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-400" >
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 inline-block" />
          { highFailureCount } High Failure Rate
            </span>
              )
  }
  </div>
    < Button size = "sm" variant = "outline" className = "h-7 text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100" onClick = {() => handleStatusFilter("all")
}>
  View All
    </Button>
    </div>
        )}

{/* ── Page header */ }
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" >
  <div className="flex items-center gap-3" >
    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md" >
      <MessageSquare className="h-5 w-5 text-white" />
        </div>
        < div >
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight" > SMS Management </h2>
          < p className = "text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5" >
            <PulseDot color="bg-emerald-500" />
              Live monitoring · { fmt(instTotal) } institutions
                </p>
                </div>
                </div>
                < div className = "flex items-center gap-2 flex-wrap" >
                  <Button variant="outline" size = "sm" className = "h-9 gap-1.5 rounded-xl" onClick = { loadAll } >
                    <RefreshCw className="h-3.5 w-3.5" /> <span className="hidden sm:inline" > Refresh </span>
                      </Button>
                      < Button variant = "outline" size = "sm" className = "h-9 gap-1.5 rounded-xl" >
                        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline" > Export </span>
                          </Button>
                          < Button size = "sm" className = "h-9 gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 shadow-md" onClick = { openSettings } >
                            <Settings2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline" > Settings </span>
                              </Button>
                              </div>
                              </div>

{/* ── KPI Row 1 — volume & institutions */ }
<div className="grid gap-4 grid-cols-2 lg:grid-cols-4" >
  <KpiCard loading={ dashLoading } title = "System SMS Balance" value = { fmt(dashboard?.total_wallet_balance) }
sub = "across all institutions" trend = "neutral" trendVal = {`${dashboard?.low_balance_count ?? 0} low`}
icon = { Wallet } iconGrad = "from-indigo-500 to-violet-600"
sparkData = { sparkSms } sparkColor = "#6366f1" />
  <KpiCard loading={ dashLoading } title = "Sent All-Time" value = { fmt(dashboard?.total_sms_sent_all_time) }
sub = "cumulative" trend = "up" trendVal = {`+${fmt(dashboard?.total_sms_sent_today)} today`}
icon = { Send } iconGrad = "from-blue-500 to-cyan-500"
sparkData = { sparkSms } sparkColor = "#06b6d4" />
  <KpiCard loading={ dashLoading } title = "Sent Today" value = { fmt(dashboard?.total_sms_sent_today) }
sub = "real-time" trend = "neutral" trendVal = "live"
icon = { Zap } iconGrad = "from-violet-500 to-purple-600"
sparkData = { sparkSms } sparkColor = "#8b5cf6" />
  <KpiCard loading={ dashLoading } title = "Institutions" value = { String(instTotal || 0)}
sub = {`${suspendedCount} suspended`} trend = { suspendedCount > 0 ? "down" : "neutral"}
trendVal = {`${activeCount} active`}
icon = { Building2 } iconGrad = "from-rose-500 to-pink-600" />
  </div>

{/* ── Financial Row */ }
<div className="grid gap-4 grid-cols-1 sm:grid-cols-3" >
  <FinCard loading={ dashLoading }
title = "Total Revenue" allTime = { fmtN(dashboard?.total_revenue_all_time) } today = { fmtN(dashboard?.total_revenue_today) }
icon = { TrendingUp } accentClass = "from-emerald-500 to-teal-500"
bgClass = "border-emerald-200/60 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/10"
textClass = "text-emerald-800 dark:text-emerald-300" />
  <FinCard loading={ dashLoading }
title = "Provider Cost" allTime = { fmtN(dashboard?.total_provider_cost_all_time) } today = { fmtN(dashboard?.total_provider_cost_today) }
icon = { Banknote } accentClass = "from-orange-500 to-amber-500"
bgClass = "border-orange-200/60 dark:border-orange-800/30 bg-gradient-to-br from-orange-50/80 to-amber-50/40 dark:from-orange-950/30 dark:to-amber-950/10"
textClass = "text-orange-800 dark:text-orange-300" />
  <FinCard loading={ dashLoading }
title = "Net Profit" allTime = { fmtN(dashboard?.total_net_profit_all_time) } today = { fmtN(dashboard?.total_net_profit_today) }
icon = { Activity } accentClass = "from-violet-500 to-indigo-600"
bgClass = "border-violet-200/60 dark:border-violet-800/30 bg-gradient-to-br from-violet-50/80 to-indigo-50/40 dark:from-violet-950/30 dark:to-indigo-950/10"
textClass = "text-violet-800 dark:text-violet-300" />
  </div>

{/* ── Termii Provider Balance ─────────────────────────────────────────── */ }
<div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm" >
  {/* Background gradient */ }
  < div className = "absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
    <div className="absolute inset-0 opacity-20"
style = {{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />

  < div className = "relative flex flex-col sm:flex-row sm:items-center gap-5 px-6 py-5" >
    {/* Provider logo / icon */ }
    < div className = "flex items-center gap-4 flex-1 min-w-0" >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner shrink-0 border border-white/30" >
        <Signal className="h-7 w-7 text-white" />
          </div>
          < div className = "min-w-0" >
            <div className="flex items-center gap-2 flex-wrap" >
              <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest" > SMS Provider </p>
                < span className = "inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/20" >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> TERMII
                    </span>
                    </div>
                    < p className = "text-[13px] font-semibold text-indigo-100 mt-0.5 truncate" > Account Balance — live from Termii API </p>
                      </div>
                      </div>

{/* Balance display */ }
<div className="flex items-center gap-6 shrink-0" >
  {
    providerBalanceLoading?(
                <div className = "space-y-1.5" >
        <div className="h-8 w-40 rounded-xl bg-white/20 animate-pulse" />
  <div className="h-3.5 w-24 rounded-lg bg-white/10 animate-pulse" />
    </div>
              ) : providerBalanceError ? (
  <div className= "flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-400/30 px-4 py-2.5" >
  <WifiOff className="h-4 w-4 text-rose-300 shrink-0" />
    <div>
    <p className="text-xs font-bold text-rose-200" > Balance unavailable </p>
      < p className = "text-[10px] text-rose-300 mt-0.5 max-w-[200px] truncate" > { providerBalanceError } </p>
        </div>
        </div>
              ) : providerBalance ? (
  <div>
  <div className= "flex items-baseline gap-2" >
  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide" > { providerBalance.currency } </span>
    < span className = "text-4xl font-black text-white tabular-nums tracking-tight" >
      { providerBalance.balance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
      </span>
      </div>
      < div className = "flex items-center gap-1.5 mt-1" >
        <Wifi className="h-3 w-3 text-emerald-400" />
          <p className="text-[10px] text-indigo-300 font-medium" >
            Fetched { providerBalance.fetched_at ? new Date(providerBalance.fetched_at).toLocaleTimeString() : "—" }
</p>
  </div>
  </div>
              ) : null}

{/* Refresh button */ }
<button
                onClick={ () => loadProviderBalance(true) }
disabled = { providerBalanceRefreshing }
className = "flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200 disabled:opacity-50 shrink-0"
title = "Refresh Termii balance"
  >
  <RefreshCcw className={ `h-4 w-4 text-white ${providerBalanceRefreshing ? "animate-spin" : ""}` } />
    </button>
    </div>
    </div>

{/* Bottom strip — cost comparison */ }
{
  !providerBalanceLoading && !providerBalanceError && providerBalance && (
    <div className="relative border-t border-white/10 bg-black/10 px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1" >
      <span className="text-[11px] text-indigo-200 font-medium" >
        Provider cost: <span className="font-bold text-white" >₦{ settingsForm.provider_cost_per_sms } /SMS</span >
          </span>
          < span className = "text-[11px] text-indigo-200 font-medium" >
            Approx.SMS units remaining: <span className="font-bold text-emerald-300" >
            {
              settingsForm.provider_cost_per_sms > 0
                ? Math.floor(providerBalance.balance / settingsForm.provider_cost_per_sms).toLocaleString()
                : "—"
            }
              </span>
              </span>
              < span className = "text-[11px] text-indigo-200 font-medium ml-auto" >
                <span className="text-white font-bold" > { providerBalance.provider?.toUpperCase() ?? "TERMII" } </span> · Rate-limited refresh
                  </span>
                  </div>
          )
}
</div>

{/* ── Delivery Health + Margin Overview */ }
<div className="grid gap-4 lg:grid-cols-3" >
  {/* Delivery Health Rings */ }
  < Card className = "rounded-2xl border-border shadow-sm" >
    <CardHeader className="pb-2 pt-5 px-5" >
      <div className="flex items-center justify-between" >
        <div>
        <CardTitle className="text-sm font-bold" > Delivery Health </CardTitle>
          < CardDescription className = "text-xs mt-0.5" > System - wide performance </CardDescription>
            </div>
            < div className = "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600" >
              <Activity className="h-4 w-4 text-white" />
                </div>
                </div>
                </CardHeader>
                < CardContent className = "px-5 pb-5" >
                  { dashLoading?<Skeleton className = "h-36" /> : (
                    <div className= "flex items-center gap-5" >
                    <div className="relative shrink-0" >
                      <DonutRing pct={ successRatePct } color = "#10b981" trackColor = "rgba(16,185,129,0.15)" size = { 88} />
                        <div className="absolute inset-0 flex items-center justify-center flex-col" >
                          <span className="text-lg font-extrabold text-emerald-600 leading-none" > { successRatePct.toFixed(1) } % </span>
                            < span className = "text-[9px] text-muted-foreground font-semibold uppercase tracking-wide mt-0.5" > Success </span>
                              </div>
                              </div>
                              < div className = "flex-1 space-y-3" >
                                <div>
                                <div className="flex items-center justify-between text-xs mb-1" >
                                  <span className="text-muted-foreground" > Active </span>
                                    < span className = "font-bold text-emerald-600" > { activeCount } </span>
                                      </div>
                                      < div className = "h-1.5 rounded-full bg-muted overflow-hidden" >
                                        <div className="h-full bg-emerald-500 rounded-full" style = {{ width: `${instTotal ? (activeCount / instTotal) * 100 : 0}%` }} />
                                          </div>
                                          </div>
                                          < div >
                                          <div className="flex items-center justify-between text-xs mb-1" >
                                            <span className="text-muted-foreground" > Low Balance </span>
                                              < span className = "font-bold text-amber-600" > { lowCount } </span>
                                                </div>
                                                < div className = "h-1.5 rounded-full bg-muted overflow-hidden" >
                                                  <div className="h-full bg-amber-400 rounded-full" style = {{ width: `${instTotal ? (lowCount / instTotal) * 100 : 0}%` }} />
                                                    </div>
                                                    </div>
                                                    < div >
                                                    <div className="flex items-center justify-between text-xs mb-1" >
                                                      <span className="text-muted-foreground" > Suspended </span>
                                                        < span className = "font-bold text-rose-500" > { suspCount } </span>
                                                          </div>
                                                          < div className = "h-1.5 rounded-full bg-muted overflow-hidden" >
                                                            <div className="h-full bg-rose-500 rounded-full" style = {{ width: `${instTotal ? (suspCount / instTotal) * 100 : 0}%` }} />
                                                              </div>
                                                              </div>
                                                              </div>
                                                              </div>
              )}
</CardContent>
  </Card>

{/* Profit Margin Ring */ }
<Card className="rounded-2xl border-border shadow-sm" >
  <CardHeader className="pb-2 pt-5 px-5" >
    <div className="flex items-center justify-between" >
      <div>
      <CardTitle className="text-sm font-bold" > Profit Margin </CardTitle>
        < CardDescription className = "text-xs mt-0.5" > Revenue vs cost efficiency </CardDescription>
          </div>
          < div className = "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600" >
            <Target className="h-4 w-4 text-white" />
              </div>
              </div>
              </CardHeader>
              < CardContent className = "px-5 pb-5" >
                { dashLoading?<Skeleton className = "h-36" /> : (
                  <div className= "flex items-center gap-5" >
                  <div className="relative shrink-0" >
                    <DonutRing pct={ dashboard?.avg_profit_margin_percent ?? marginPct } color = "#8b5cf6" trackColor = "rgba(139,92,246,0.15)" size = { 88} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col" >
                        <span className="text-lg font-extrabold text-violet-600 leading-none" > {(dashboard?.avg_profit_margin_percent ?? marginPct).toFixed(1)}% </span>
                          < span className = "text-[9px] text-muted-foreground font-semibold uppercase tracking-wide mt-0.5" > Margin </span>
                            </div>
                            </div>
                            < div className = "flex-1 space-y-2.5" >
                              <div className="flex items-center justify-between" >
                                <span className="text-xs text-muted-foreground" > Charge / SMS </span>
                                  < span className = "text-xs font-bold text-foreground" >₦{ settingsForm.default_charge_per_sms } </span>
                                    </div>
                                    < div className = "flex items-center justify-between" >
                                      <span className="text-xs text-muted-foreground" > Cost / SMS </span>
                                        < span className = "text-xs font-bold text-foreground" >₦{ settingsForm.provider_cost_per_sms } </span>
                                          </div>
                                          < Separator />
                                          <div className="flex items-center justify-between" >
                                            <span className="text-xs text-muted-foreground" > Net Profit </span>
                                              < span className = "text-xs font-bold text-violet-600" > { fmtM(dashboard?.total_net_profit_all_time ?? 0)}</span>
                                                </div>
                                                < div className = "flex items-center justify-between" >
                                                  <span className="text-xs text-muted-foreground" > Today </span>
                                                    < span className = "text-xs font-bold text-violet-600" > { fmtM(dashboard?.total_net_profit_today ?? 0)}</span>
                                                      </div>
                                                      </div>
                                                      </div>
              )}
</CardContent>
  </Card>

{/* 7-day Revenue Sparkline summary */ }
<Card className="rounded-2xl border-border shadow-sm" >
  <CardHeader className="pb-2 pt-5 px-5" >
    <div className="flex items-center justify-between" >
      <div>
      <CardTitle className="text-sm font-bold" > 7 - Day Snapshot </CardTitle>
        < CardDescription className = "text-xs mt-0.5" > Revenue trend overview </CardDescription>
          </div>
          < div className = "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600" >
            <BarChart3 className="h-4 w-4 text-white" />
              </div>
              </div>
              </CardHeader>
              < CardContent className = "px-5 pb-5" >
                { chartsLoading?<Skeleton className = "h-36" /> : (
                  <div className= "space-y-3" >
                  <div className="flex items-end justify-between gap-2" >
                    <div>
                    <p className="text-xs text-muted-foreground" > Total 7 - day </p>
                      < p className = "text-xl font-extrabold text-foreground leading-none mt-0.5" >
                        { fmtM(revenueTrend.reduce((s, r) => s + r.revenue, 0)) }
                        </p>
                        </div>
                        < Sparkline data = { sparkRevenue } color = "#10b981" w = { 100} h = { 40} />
                          </div>
                          < Separator />
                          <div className="grid grid-cols-3 gap-2 text-center" >
                            <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold" > Revenue </p>
                              < p className = "text-sm font-bold text-emerald-600 mt-0.5" > { fmtM(revenueTrend.reduce((s, r) => s + r.revenue, 0)) } </p>
                                </div>
                                < div >
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold" > Cost </p>
                                  < p className = "text-sm font-bold text-orange-500 mt-0.5" > { fmtM(revenueTrend.reduce((s, r) => s + r.cost, 0)) } </p>
                                    </div>
                                    < div >
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold" > Profit </p>
                                      < p className = "text-sm font-bold text-violet-600 mt-0.5" > { fmtM(revenueTrend.reduce((s, r) => s + r.profit, 0)) } </p>
                                        </div>
                                        </div>
                                        </div>
              )}
</CardContent>
  </Card>
  </div>

{/* ── Charts Row */ }
<div className="grid gap-4 lg:grid-cols-2" >
  <Card className="rounded-2xl border-border shadow-sm" >
    <CardHeader className="pb-2 pt-5 px-5" >
      <div className="flex items-center justify-between" >
        <div>
        <CardTitle className="text-sm font-bold" > Monthly Financial Performance </CardTitle>
          < CardDescription className = "text-xs mt-0.5" > Revenue · Cost · Profit(₦) </CardDescription>
            </div>
            < div className = "flex items-center gap-1.5" >
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted" >
                6 Months
                  </span>
                  </div>
                  </div>
                  </CardHeader>
                  < CardContent className = "px-4 pb-5" >
                    { chartsLoading?<Skeleton className = "h-[240px] rounded-xl" /> : (
                      <div className= "h-[240px]" >
                      <ResponsiveContainer width="100%" height = "100%" >
                        <BarChart data={ monthlyProfit } margin = {{ top: 5, right: 5, left: 0, bottom: 5 }} barCategoryGap = "32%" >
                          <CartesianGrid strokeDasharray="3 3" stroke = "hsl(220,13%,91%)" vertical = { false} />
                            <XAxis dataKey="month" tick = {{ fontSize: 10, fill: "hsl(220,9%,46%)" }} axisLine = { false} tickLine = { false} />
                              <YAxis tick={ { fontSize: 10, fill: "hsl(220,9%,46%)" } } axisLine = { false} tickLine = { false} tickFormatter = {(v) => `₦${(v / 1000000).toFixed(1)}M`} />
                                < Tooltip
contentStyle = {{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "10px", fontSize: "11px", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
formatter = {(v: number, name: string) => [fmtN(v), name.charAt(0).toUpperCase() + name.slice(1)]}
                      />
  < Legend iconType = "circle" iconSize = { 7} wrapperStyle = {{ fontSize: "11px", paddingTop: "8px" }} />
    < Bar dataKey = "revenue" fill = "url(#barRev)" radius = { [5, 5, 0, 0]} name = "revenue" />
      <Bar dataKey="cost" fill = "url(#barCost)" radius = { [5, 5, 0, 0]} name = "cost" />
        <Bar dataKey="profit" fill = "url(#barProfit)" radius = { [5, 5, 0, 0]} name = "profit" />
          <defs>
          <linearGradient id="barRev" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
            <stop offset="0%" stopColor = "#6366f1" /> <stop offset="100%" stopColor = "#8b5cf6" />
              </linearGradient>
              < linearGradient id = "barCost" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                <stop offset="0%" stopColor = "#f97316" /> <stop offset="100%" stopColor = "#fb923c" />
                  </linearGradient>
                  < linearGradient id = "barProfit" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                    <stop offset="0%" stopColor = "#10b981" /> <stop offset="100%" stopColor = "#34d399" />
                      </linearGradient>
                      </defs>
                      </BarChart>
                      </ResponsiveContainer>
                      </div>
              )}
</CardContent>
  </Card>

  < Card className = "rounded-2xl border-border shadow-sm" >
    <CardHeader className="pb-2 pt-5 px-5" >
      <div className="flex items-center justify-between" >
        <div>
        <CardTitle className="text-sm font-bold" > 7 - Day Revenue Trend </CardTitle>
          < CardDescription className = "text-xs mt-0.5" > Daily revenue vs cost vs profit </CardDescription>
            </div>
            < div className = "flex items-center gap-1.5" >
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30" >
                <PulseDot color="bg-emerald-500" /> Live
                  </span>
                  </div>
                  </div>
                  </CardHeader>
                  < CardContent className = "px-4 pb-5" >
                    { chartsLoading?<Skeleton className = "h-[240px] rounded-xl" /> : (
                      <div className= "h-[240px]" >
                      <ResponsiveContainer width="100%" height = "100%" >
                        <AreaChart data={ revenueTrend } margin = {{ top: 5, right: 5, left: 0, bottom: 5 }}>
                          <defs>
                          <linearGradient id="areaRev" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                            <stop offset="5%" stopColor = "#10b981" stopOpacity = { 0.3} />
                              <stop offset="95%" stopColor = "#10b981" stopOpacity = { 0} />
                                </linearGradient>
                                < linearGradient id = "areaProfit" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                                  <stop offset="5%" stopColor = "#6366f1" stopOpacity = { 0.3} />
                                    <stop offset="95%" stopColor = "#6366f1" stopOpacity = { 0} />
                                      </linearGradient>
                                      < linearGradient id = "areaCost" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                                        <stop offset="5%" stopColor = "#f97316" stopOpacity = { 0.2} />
                                          <stop offset="95%" stopColor = "#f97316" stopOpacity = { 0} />
                                            </linearGradient>
                                            </defs>
                                            < CartesianGrid strokeDasharray = "3 3" stroke = "hsl(220,13%,91%)" vertical = { false} />
                                              <XAxis dataKey="date" tick = {{ fontSize: 10, fill: "hsl(220,9%,46%)" }} axisLine = { false} tickLine = { false} />
                                                <YAxis tick={ { fontSize: 10, fill: "hsl(220,9%,46%)" } } axisLine = { false} tickLine = { false} tickFormatter = {(v) => `₦${(v / 1000).toFixed(0)}k`} />
                                                  < Tooltip
contentStyle = {{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "10px", fontSize: "11px", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
formatter = {(v: number) => [fmtN(v)]}
                      />
  < Legend iconType = "circle" iconSize = { 7} wrapperStyle = {{ fontSize: "11px", paddingTop: "8px" }} />
    < Area type = "monotone" dataKey = "revenue" stroke = "#10b981" strokeWidth = { 2.5} fill = "url(#areaRev)" name = "revenue" dot = { false} />
      <Area type="monotone" dataKey = "cost" stroke = "#f97316" strokeWidth = { 2} fill = "url(#areaCost)" name = "cost" dot = { false} />
        <Area type="monotone" dataKey = "profit" stroke = "#6366f1" strokeWidth = { 2.5} fill = "url(#areaProfit)" name = "profit" dot = { false} />
          </AreaChart>
          </ResponsiveContainer>
          </div>
              )}
</CardContent>
  </Card>
  </div>

{/* ── Institution Wallets Table */ }
<Card className="rounded-2xl border-border shadow-sm overflow-hidden" >
  <CardHeader className="pb-0 pt-5 px-5" >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" >
      <div>
      <CardTitle className="text-base font-bold flex items-center gap-2" >
        <Globe className="h-4 w-4 text-indigo-500" />
          Institution SMS Wallets
            </CardTitle>
            < CardDescription className = "text-xs mt-0.5" >
              { instTotal } institution{ instTotal !== 1 ? "s" : "" } · real - time balance and usage
                </CardDescription>
                </div>
                < Button size = "sm" className = "gap-1.5 self-start sm:self-auto h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 shadow-sm" onClick = { openBulkFund } >
                  <Zap className="h-3.5 w-3.5" /> Bulk Fund
                    </Button>
                    </div>
                    < div className = "flex flex-col sm:flex-row gap-2 mt-4 pb-4" >
                      <div className="relative flex-1" >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                  placeholder="Search institution..."
value = { instSearch }
onChange = {(e) => handleSearch(e.target.value)}
className = "pl-8 h-9 text-sm rounded-xl border-border"
  />
  </div>
  < Select value = { instStatus } onValueChange = { handleStatusFilter } >
    <SelectTrigger className="h-9 w-full sm:w-48 text-sm rounded-xl border-border" >
      <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          < SelectContent >
          <SelectItem value="all" > All Status </SelectItem>
            < SelectItem value = "active" > Active </SelectItem>
              < SelectItem value = "low_balance" > Low Balance </SelectItem>
                < SelectItem value = "suspended" > Suspended </SelectItem>
                  </SelectContent>
                  </Select>
                  </div>
                  </CardHeader>

                  < div className = "overflow-x-auto" >
                    <table className="w-full text-sm" >
                      <thead>
                      <tr className="border-t border-border bg-muted/30" >
                        <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" >
                          <button onClick={ () => handleSort("name") } className = "flex items-center gap-1 hover:text-foreground transition-colors" >
                            Institution < ArrowUpDown className = "h-3 w-3" />
                              </button>
                              </th>
                              < th className = "px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" >
                                <button onClick={ () => handleSort("sms_balance") } className = "flex items-center gap-1 ml-auto hover:text-foreground transition-colors" >
                                  Balance < ArrowUpDown className = "h-3 w-3" />
                                    </button>
                                    </th>
                                    < th className = "px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell" >
                                      <button onClick={ () => handleSort("total_sms_sent") } className = "flex items-center gap-1 ml-auto hover:text-foreground transition-colors" >
                                        Total Sent < ArrowUpDown className = "h-3 w-3" />
                                          </button>
                                          </th>
                                          < th className = "px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell" >
                                            <button onClick={ () => handleSort("sms_sent_today") } className = "flex items-center gap-1 ml-auto hover:text-foreground transition-colors" >
                                              Today < ArrowUpDown className = "h-3 w-3" />
                                                </button>
                                                </th>
                                                < th className = "px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell" >
                                                  <button onClick={ () => handleSort("total_revenue") } className = "flex items-center gap-1 ml-auto hover:text-foreground transition-colors" >
                                                    Revenue < ArrowUpDown className = "h-3 w-3" />
                                                      </button>
                                                      </th>
                                                      < th className = "px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell" >
                                                        <button onClick={ () => handleSort("total_profit") } className = "flex items-center gap-1 ml-auto hover:text-foreground transition-colors" >
                                                          Profit < ArrowUpDown className = "h-3 w-3" />
                                                            </button>
                                                            </th>
                                                            < th className = "px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell" > Last Activity </th>
                                                              < th className = "px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" > Status </th>
                                                                < th className = "px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" > Actions </th>
                                                                  </tr>
                                                                  </thead>
                                                                  < tbody className = "divide-y divide-border" >
                                                                  {
                                                                    instLoading?(
                                                                      Array.from({ length: PER_PAGE }).map((_, i) => (
                                                                        <tr key= { i } > <td colSpan={ 9} className = "px-5 py-3" > <Skeleton className="h-10 rounded-lg" /> </td></tr >
                  ))
                ) : institutions.map((inst) => {
                                                                          const sc = STATUS_CFG[inst.status] ?? STATUS_CFG.active;
                                                                          const isRowLoading = !!rowLoading[inst.id];
                                                                          return (
                                                                            <tr key= { inst.id } className = {`hover:bg-muted/20 transition-colors border-l-[3px] ${sc.border} ${isRowLoading ? "opacity-60 pointer-events-none" : ""}`
                                                                        }>
                                                                        <td className="px-5 py-3.5" >
                                                                        <div className="flex items-center gap-3" >
                                                                        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${avatarGradient(inst.name)} flex items-center justify-center shrink-0 shadow-sm`} >
                                                                    <span className="text-xs font-bold text-white" > { initials(inst.name) } </span>
                                                                      </div>
                                                                      < div className = "min-w-0" >
                                                                        <p className="font-semibold text-foreground text-sm truncate" > { inst.name } </p>
                                                                          < p className = "text-[10px] text-muted-foreground" >₦{ inst.charge_per_sms } /SMS · {inst.margin_percent?.toFixed(0) ?? 0}% margin</p >
                                                                            </div>
                                                                            </div>
                                                                            </td>
                                                                            < td className = "px-4 py-3.5 text-right" >
                                                                              <div className="flex flex-col items-end gap-1.5" >
                                                                                <span className={ `font-bold tabular-nums text-sm ${inst.sms_balance === 0 ? "text-rose-500" : inst.sms_balance < settingsForm.low_balance_threshold ? "text-amber-600" : "text-foreground"}` }>
                                                                                  { fmt(inst.sms_balance) }
                                                                                  </span>
                                                                                  < BalanceMeter value = { inst.sms_balance } threshold = { settingsForm.low_balance_threshold } />
                                                                                    </div>
                                                                                    </td>
                                                                                    < td className = "px-4 py-3.5 text-right hidden sm:table-cell" >
                                                                                      <span className="font-medium text-muted-foreground tabular-nums" > { fmt(inst.total_sms_sent) } </span>
                                                                                        </td>
                                                                                        < td className = "px-4 py-3.5 text-right hidden md:table-cell" >
                                                                                          <span className="font-semibold text-blue-600 tabular-nums text-sm" > { fmt(inst.sms_sent_today) } </span>
                                                                                            </td>
                                                                                            < td className = "px-4 py-3.5 text-right hidden md:table-cell" >
                                                                                              <span className="font-semibold text-emerald-600 tabular-nums" > { fmtM(inst.total_revenue) } </span>
                                                                                                </td>
                                                                                                < td className = "px-4 py-3.5 text-right hidden lg:table-cell" >
                                                                                                  <span className="font-semibold text-violet-600 tabular-nums" > { fmtM(inst.total_profit) } </span>
                                                                                                    </td>
                                                                                                    < td className = "px-4 py-3.5 hidden xl:table-cell" >
                                                                                                      <span className="flex items-center gap-1.5 text-muted-foreground text-xs" >
                                                                                                        <Clock className="h-3 w-3" /> { timeAgo(inst.last_activity_at) }
                                                                                                          </span>
                                                                                                          </td>
                                                                                                          < td className = "px-4 py-3.5 text-center" >
                                                                                                            <span className={ `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${sc.bg} ${sc.text}` }>
                                                                                                              <span className={ `h-1.5 w-1.5 rounded-full ${sc.dot} shrink-0` } />
{ sc.label }
</span>
  </td>
  < td className = "px-4 py-3.5" >
    <div className="flex items-center justify-end gap-1" >
      <Button size="sm" variant = "ghost" className = "h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30" title = "View details" onClick = {() => openView(inst)}>
        <Eye className="h-3.5 w-3.5" />
          </Button>
{
  inst.has_wallet === false ? (
    <Button size= "sm" variant = "ghost" title = "Setup SMS wallet" className = "h-8 px-2 rounded-lg text-[11px] font-bold hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 text-amber-600 gap-1"
  onClick = {() => { setFundTarget(inst); setFundAmount(""); setFundNote(""); setFundChargePerSms(""); setFundResult(null); setFundNoWallet(true); setCreateWalletResult(null); }
}>
  <Zap className="h-3 w-3" /> Setup
    </Button>
                          ) : (
  <Button size= "sm" variant = "ghost" className = "h-8 w-8 p-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30" title = "Fund wallet" onClick = {() => { setFundTarget(inst); setFundAmount(""); setFundNote(""); setFundChargePerSms(""); setFundResult(null); setCreateWalletResult(null); }}>
    <CreditCard className="h-3.5 w-3.5" />
      </Button>
                          )}
<Button size="sm" variant = "ghost" className = "h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30" title = "Edit rate" onClick = {() => openEditRate(inst)}>
  <Pencil className="h-3.5 w-3.5" />
    </Button>
    < Button size = "sm" variant = "ghost" title = { inst.status === "suspended" ? "Reactivate" : "Suspend" }
className = {`h-8 w-8 p-0 rounded-lg ${inst.status === "suspended" ? "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30" : "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"}`}
onClick = {() => setStatusTarget(inst)}>
  { inst.status === "suspended" ? <UserCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" / >}
  </Button>
  </div>
  </td>
  </tr>
                  );
                })}
{
  !instLoading && institutions.length === 0 && (
    <tr>
    <td colSpan={ 9 } className = "px-4 py-16 text-center" >
      <div className="flex flex-col items-center gap-2" >
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center" >
          <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            < p className = "text-sm font-medium text-muted-foreground" > No institutions found </p>
              < p className = "text-xs text-muted-foreground" > Try adjusting your search or filters </p>
                </div>
                </td>
                </tr>
                )
}
</tbody>
  </table>
  </div>

{
  instTotalPages > 1 && (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20" >
      <p className="text-xs text-muted-foreground" >
        Showing < span className = "font-semibold text-foreground" > {(instPage - 1) * PER_PAGE + 1
}–{ Math.min(instPage * PER_PAGE, instTotal) } </span> of <span className="font-semibold text-foreground">{instTotal}</span >
  </p>
  < div className = "flex items-center gap-1" >
    <Button variant="ghost" size = "icon" className = "h-8 w-8 rounded-lg" disabled = { instPage === 1} onClick = {() => handlePage(instPage - 1)}>
      <ChevronLeft className="h-4 w-4" />
        </Button>
{
  Array.from({ length: Math.min(instTotalPages, 5) }, (_, i) => {
    const p = i + 1;
    return (
      <button key= { p } onClick = {() => handlePage(p)
  }
                      className = {`h-8 w-8 text-xs font-semibold rounded-lg transition-colors ${instPage === p ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-muted text-muted-foreground"}`}>
  { p }
  </button>
                  );
                })}
<Button variant="ghost" size = "icon" className = "h-8 w-8 rounded-lg" disabled = { instPage === instTotalPages} onClick = {() => handlePage(instPage + 1)}>
  <ChevronRight className="h-4 w-4" />
    </Button>
    </div>
    </div>
          )}
</Card>

{/* ── Today's Breakdown */ }
<Card className="rounded-2xl border-border shadow-sm overflow-hidden" >
  <CardHeader className="pb-0 pt-5 px-5" >
    <div className="flex items-center justify-between pb-4 border-b border-border" >
      <div>
      <CardTitle className="text-base font-bold flex items-center gap-2" >
        <CalendarDays className="h-4 w-4 text-blue-500" />
          Today's Breakdown
            </CardTitle>
            < CardDescription className = "text-xs mt-0.5" > Per - institution SMS activity for today </CardDescription>
              </div>
              < span className = "text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full flex items-center gap-1" >
              <PulseDot color= "bg-blue-500" /> Live
              </span>
              </div>
              </CardHeader>
              < div className = "overflow-x-auto" >
                <table className="w-full text-sm" >
                  <thead>
                  <tr className="bg-muted/30" >
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" > Institution </th>
                      < th className = "px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" > SMS Today </th>
                        < th className = "px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell" > Rate </th>
                          < th className = "px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell" > Revenue </th>
                            < th className = "px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell" > Cost </th>
                              < th className = "px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" > Profit </th>
                                < th className = "px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell" > Margin </th>
                                  </tr>
                                  </thead>
                                  < tbody className = "divide-y divide-border" >
                                    {
                                      todayLoading?(
                                        Array.from({ length: 4 }).map((_, i) => (
                                          <tr key= { i } > <td colSpan={ 7} className = "px-5 py-2.5" > <Skeleton className="h-8 rounded-lg" /> </td></tr >
                  ))
                ) : todayBreakdown.length === 0 ? (
                                        <tr><td colSpan= { 7} className="px-5 py-10 text-center text-muted-foreground text-sm" > No activity yet today</ td > </tr>
                ) : todayBreakdown.map((row) => (
                                          <tr key= { row.institution_id } className = "hover:bg-muted/20 transition-colors" >
                                          <td className="px-5 py-3" >
                                        <div className="flex items-center gap-2.5" >
                                        <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${avatarGradient(row.institution_name)} flex items-center justify-center shrink-0`}>
                                        <span className="text-[10px] font-bold text-white" > { initials(row.institution_name)}</span>
                                          </div>
                                          < span className = "font-semibold text-sm text-foreground truncate max-w-[160px]" > { row.institution_name } </span>
                                            </div>
                                            </td>
                                            < td className = "px-4 py-3 text-right font-bold tabular-nums text-blue-600" > { fmt(row.sms_sent_today) } </td>
                                              < td className = "px-4 py-3 text-right text-muted-foreground tabular-nums hidden sm:table-cell" >₦{ row.charge_per_sms } </td>
                                                < td className = "px-4 py-3 text-right text-emerald-600 font-semibold tabular-nums hidden md:table-cell" > { fmtN(row.revenue_today) } </td>
                                                  < td className = "px-4 py-3 text-right text-orange-500 font-semibold tabular-nums hidden md:table-cell" > { fmtN(row.cost_today) } </td>
                                                    < td className = "px-4 py-3 text-right text-violet-600 font-bold tabular-nums" > { fmtN(row.profit_today) } </td>
                                                      < td className = "px-4 py-3 text-right hidden lg:table-cell" >
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full" >
                                                          {(row.margin_percent ?? 0).toFixed(1)}%
                                                            </span>
                                                            </td>
                                                            </tr>
                ))}
{
  todayTotals && !todayLoading && todayBreakdown.length > 0 && (
    <tr className="bg-muted/30 font-bold border-t-2 border-border" >
      <td className="px-5 py-3 text-sm text-foreground" > Totals </td>
        < td className = "px-4 py-3 text-right text-blue-600 tabular-nums" > { fmt(todayTotals.sms_sent_today) } </td>
          < td className = "px-4 py-3 hidden sm:table-cell" />
            <td className="px-4 py-3 text-right text-emerald-600 tabular-nums hidden md:table-cell" > { fmtN(todayTotals.revenue_today) } </td>
              < td className = "px-4 py-3 text-right text-orange-500 tabular-nums hidden md:table-cell" > { fmtN(todayTotals.cost_today) } </td>
                < td className = "px-4 py-3 text-right text-violet-600 tabular-nums" > { fmtN(todayTotals.profit_today) } </td>
                  < td className = "px-4 py-3 hidden lg:table-cell" />
                    </tr>
                )
}
</tbody>
  </table>
  </div>
  </Card>

{/* ── Profit Leaderboard */ }
<Card className="rounded-2xl border-border shadow-sm" >
  <CardHeader className="pb-3 pt-5 px-5" >
    <div className="flex items-center justify-between" >
      <div>
      <CardTitle className="text-base font-bold flex items-center gap-2" >
        <Award className="h-4 w-4 text-amber-500" />
          Profit Leaderboard
            </CardTitle>
            < CardDescription className = "text-xs mt-0.5" > Top institutions by net profit contribution </CardDescription>
              </div>
              < span className = "text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full" > All Time </span>
                </div>
                </CardHeader>
                < CardContent className = "px-5 pb-5" >
                  { chartsLoading?<Skeleton className = "h-40 rounded-xl" /> : leaderboard.length === 0 ? (
                    <div className= "flex items-center justify-center py-10 text-muted-foreground text-sm" > No leaderboard data yet </div>
            ) : (
  <div className= "space-y-3" >
  {
    leaderboard.slice(0, 5).map((item, i) => {
      const medals = ["🥇", "🥈", "🥉", "4th", "5th"];
      const barColors = ["bg-gradient-to-r from-amber-500 to-yellow-400", "bg-gradient-to-r from-slate-400 to-zinc-300", "bg-gradient-to-r from-orange-500 to-amber-400", "bg-gradient-to-r from-indigo-500 to-violet-500", "bg-gradient-to-r from-sky-500 to-blue-400"];
      return (
        <div key= { item.institution_id } className = "flex items-center gap-3 group" >
          <span className="text-base w-7 shrink-0 text-center" > { medals[i] ?? String(i + 1) } </span>
            < div className = {`h-8 w-8 rounded-xl bg-gradient-to-br ${avatarGradient(item.institution_name)} flex items-center justify-center shrink-0 shadow-sm`
    }>
    <span className="text-[10px] font-bold text-white" > { initials(item.institution_name)
  } </span>
  </div>
  < span className = "text-sm font-semibold text-foreground w-36 shrink-0 truncate" > { item.institution_name } </span>
    < div className = "flex-1 h-2 bg-muted rounded-full overflow-hidden" >
      <div className={ `h-full ${barColors[i] ?? barColors[3]} rounded-full transition-all duration-700` } style = {{ width: `${item.profit_percent_of_max ?? 0}%` }} />
        </div>
        < span className = "text-sm font-bold text-foreground tabular-nums w-28 text-right shrink-0" > { fmtN(item.total_profit) } </span>
          </div>
                  );
                })}
</div>
            )}
</CardContent>
  </Card>
  </div>

{/* ══════════════════════════════════════════
          FUND SMS WALLET MODAL
      ══════════════════════════════════════════ */}
<Dialog open={ !!fundTarget } onOpenChange = {(open) => !open && closeFundModal()}>
  <DialogContent className="max-w-md rounded-2xl" >
    <DialogHeader>
    <DialogTitle className="flex items-center gap-2.5" >
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md" >
        <CreditCard className="h-4 w-4 text-white" />
          </div>
          < div >
          <p className="text-base font-bold" > Fund SMS Wallet </p>
            < p className = "text-xs font-normal text-muted-foreground" > Credit SMS units to institution </p>
              </div>
              </DialogTitle>
              </DialogHeader>

{
  fundResult ? (
    /* ── Success receipt */
    <div className= "space-y-4 py-2" >
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 p-5 text-center space-y-1" >
      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide" > Funding Successful </p>
          < p className = "text-4xl font-black text-emerald-600 tabular-nums" > +{ fmt(fundResult.units_credited) } </p>
            < p className = "text-sm text-muted-foreground" > SMS units credited to < span className = "font-bold text-foreground" > { fundResult.institution_name } < /span></p >
              </div>
              < div className = "grid grid-cols-2 gap-3 text-sm" >
                <div className="rounded-xl bg-muted/40 p-3" >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > Amount Paid </p>
                    < p className = "font-bold text-foreground" > { fmtN(fundResult.amount_paid_ngn) } </p>
                      </div>
                      < div className = "rounded-xl bg-muted/40 p-3" >
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > Rate Used </p>
                          < p className = "font-bold text-foreground" >₦{ fundResult.charge_per_sms } /SMS</p >
                            </div>
                            < div className = "rounded-xl bg-muted/40 p-3" >
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > Previous Balance </p>
                                < p className = "font-bold text-foreground" > { fmt(fundResult.previous_balance) } SMS </p>
                                  </div>
                                  < div className = "rounded-xl bg-muted/40 p-3" >
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > New Balance </p>
                                      < p className = "font-bold text-emerald-600" > { fmt(fundResult.new_balance) } SMS </p>
                                        </div>
                                        </div>
                                        < div className = "rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200/60 px-4 py-3 flex items-center justify-between" >
                                          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300" > Your Profit </span>
                                            < span className = "text-lg font-extrabold text-violet-600" > { fmtN(fundResult.your_profit) } </span>
                                              </div>
                                              < p className = "text-[11px] text-center text-muted-foreground" > Funded by < span className = "font-semibold" > { fundResult.funded_by } < /span> · {new Date(fundResult.funded_at).toLocaleString()}</p >
                                                <DialogFooter>
                                                <Button className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 border-0" onClick = { closeFundModal } > Done </Button>
                                                  </DialogFooter>
                                                  </div>
          ) : (
    /* ── Fund form */
    <>
    <div className= "space-y-4 py-2" >
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center gap-3" >
      <div className={ `h-10 w-10 rounded-xl bg-gradient-to-br ${fundTarget ? avatarGradient(fundTarget.name) : "from-indigo-500 to-violet-500"} flex items-center justify-center shrink-0 shadow-sm` }>
        <span className="text-sm font-bold text-white" > { fundTarget? initials(fundTarget.name) : ""} </span>
          </div>
          < div className = "flex-1 min-w-0" >
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide" > Institution </p>
              < p className = "text-sm font-bold text-foreground truncate" > { fundTarget?.name } </p>
                </div>
                < div className = "text-right shrink-0" >
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide" > Balance </p>
                    < p className = "text-sm font-bold text-foreground" > { fmt(fundTarget?.sms_balance) } SMS </p>
                      </div>
                      </div>

  {
    createWalletResult && (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 flex items-center gap-3" >
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0" >
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300" > Wallet Created! </p>
              < p className = "text-xs text-emerald-600 dark:text-emerald-400" > Rate: ₦{ createWalletResult.charge_per_sms } /SMS · Now fill in the amount to fund it.</p >
                </div>
                </div>
              )
  }

  {
    fundNoWallet && (
      <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-4 space-y-3" >
        <div className="flex items-start gap-3" >
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300" > No SMS Wallet Found </p>
              < p className = "text-xs text-amber-700 dark:text-amber-400 mt-0.5" >
                <span className="font-semibold" > { fundTarget?.name } </span> does not have an SMS wallet yet. Create one first, then fund it.
                  </p>
                  </div>
                  </div>
                  < Button size = "sm" onClick = { handleCreateWallet } disabled = { createWalletLoading }
    className = "w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-sm gap-1.5 text-white" >
      <Zap className="h-3.5 w-3.5" />
        { createWalletLoading? "Creating wallet...": "Create SMS Wallet" }
        </Button>
        </div>
              )
  }

  <div className="grid grid-cols-2 gap-3" >
    <div className="space-y-1.5" >
      <Label className="text-sm font-semibold" > Amount(₦) </Label>
        < div className = "relative" >
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold" >₦</span>
            < Input className = "pl-7 h-10 rounded-xl text-sm font-medium" placeholder = "e.g. 100,000" value = { fundAmount } onChange = {(e) => setFundAmount(e.target.value)
} />
  </div>
  </div>
  < div className = "space-y-1.5" >
    <Label className="text-sm font-semibold" > Rate(₦/SMS)</Label >
      <Input className="h-10 rounded-xl text-sm font-medium" placeholder = { String(fundTarget?.charge_per_sms ?? settingsForm.default_charge_per_sms)} value = { fundChargePerSms } onChange = {(e) => setFundChargePerSms(e.target.value)} />
        </div>
        </div>

        < div className = "space-y-1.5" >
          <Label className="text-sm font-semibold" > Note < span className = "text-muted-foreground font-normal" > (optional) < /span></Label >
            <Input className="h-10 rounded-xl text-sm" placeholder = "e.g. Monthly top-up" value = { fundNote } onChange = {(e) => setFundNote(e.target.value)} />
              </div>

              < div className = {`rounded-xl border-2 p-4 transition-all duration-300 ${smsUnitsPreview > 0 ? "border-emerald-400/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20" : "border-dashed border-border"}`}>
                { smsUnitsPreview > 0 ? (
                  <div className= "text-center space-y-1" >
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide" > You are crediting </p>
                < p className = "text-5xl font-black text-emerald-600 tabular-nums" > { fmt(smsUnitsPreview) } </p>
                  < p className = "text-sm text-muted-foreground" > SMS units to < span className = "font-bold text-foreground" > { fundTarget?.name } < /span></p >
                    <Separator className="my-2" />
                      <div className="flex items-center justify-center gap-6 text-xs" >
                        <span className="text-muted-foreground" > Current: <span className="font-bold text-foreground" > { fmt(fundTarget?.sms_balance) } < /span></span >
                          <span className="text-emerald-600 font-bold" >→</span>
                            < span className = "text-emerald-600 font-bold" > New: ~{ fmt((fundTarget?.sms_balance ?? 0) + smsUnitsPreview)}</span>
                              </div>
                              </div>
                  ) : (
  <p className= "text-center text-sm text-muted-foreground py-4" > Enter an amount to preview units </p>
                  )}
</div>
  </div>
  < DialogFooter className = "gap-2" >
    <Button variant="outline" className = "rounded-xl" onClick = { closeFundModal } disabled = { fundLoading } > Cancel </Button>
      < Button disabled = { smsUnitsPreview === 0 || fundLoading} onClick = { handleFundSubmit }
className = "gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-md" >
  <Zap className="h-3.5 w-3.5" /> { fundLoading? "Processing...": "Confirm Funding" }
    </Button>
    </DialogFooter>
    </>
          )}
</DialogContent>
  </Dialog>

{/* ══════════════════════════════════════════
          INSTITUTION DETAIL MODAL
      ══════════════════════════════════════════ */}
<Dialog open={ viewOpen } onOpenChange = {(open) => { if (!open) { setViewOpen(false); setViewTarget(null); } }}>
  <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl" >
    <DialogHeader>
    <DialogTitle className="flex items-center gap-3" >
      { viewLoading?<Skeleton className = "h-10 w-10 rounded-xl" /> : (
        <div className= {`h-10 w-10 rounded-xl bg-gradient-to-br ${viewTarget ? avatarGradient(viewTarget.name ?? "") : "from-indigo-500 to-violet-500"} flex items-center justify-center shadow-md shrink-0`}>
          <span className="text-sm font-bold text-white" > { viewTarget? initials(viewTarget.name ?? "") : ""} </span>
            </div>
              )}
<div className="flex-1 min-w-0" >
  { viewLoading?<Skeleton className = "h-5 w-48" /> : (
    <>
    <p className= "text-base font-bold truncate" > { viewTarget?.name } </p>
    < p className = "text-xs text-muted-foreground font-normal" > SMS usage, billing & delivery logs </p>
      </>
                )}
</div>
  </DialogTitle>
  </DialogHeader>

{
  viewLoading ? (
    <div className= "space-y-3 py-4" >
    <div className="grid grid-cols-4 gap-3" > { Array.from({ length: 4 }).map((_, i) => <Skeleton key={ i } className = "h-20 rounded-xl" />) } </div>
      < Skeleton className = "h-52 rounded-xl" />
        </div>
          ) : viewTarget && (
    <div className="space-y-4" >
      {/* Mini KPIs */ }
      < div className = "grid grid-cols-2 md:grid-cols-4 gap-3" >
      {
        [
        { label: "SMS Balance", value: fmt(viewTarget.sms_balance), sub: "units", color: (viewTarget.sms_balance ?? 0) < 3000 ? "text-amber-600" : "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
        { label: "Total Sent", value: fmt(viewTarget.total_sms_sent), sub: "all time", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
        { label: "Revenue", value: fmtM(viewTarget.total_revenue), sub: "earned", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
        { label: "Failure Rate", value: `${(viewTarget.failure_rate_percent ?? 0).toFixed(1)}%`, sub: "delivery", color: (viewTarget.failure_rate_percent ?? 0) > 2 ? "text-rose-500" : "text-emerald-600", bg: (viewTarget.failure_rate_percent ?? 0) > 2 ? "bg-rose-50 dark:bg-rose-950/20" : "bg-emerald-50 dark:bg-emerald-950/20" },
                ].map((s) => (
          <div key= { s.label } className = {`rounded-xl ${s.bg} p-3.5 text-center`} >
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide" > { s.label } </p>
          < p className = {`text-xl font-extrabold mt-1 ${s.color}`
}> { s.value } </p>
  < p className = "text-[10px] text-muted-foreground mt-0.5" > { s.sub } </p>
    </div>
                ))}
</div>

  < Tabs defaultValue = "billing" onValueChange = { onViewTabChange } >
    <TabsList className="w-full grid grid-cols-3 rounded-xl h-10" >
      <TabsTrigger value="analytics" className = "text-xs rounded-lg" > Analytics </TabsTrigger>
        < TabsTrigger value = "logs" className = "text-xs rounded-lg" > SMS Logs </TabsTrigger>
          < TabsTrigger value = "billing" className = "text-xs rounded-lg" > Billing </TabsTrigger>
            </TabsList>

{/* Analytics Tab */ }
<TabsContent value="analytics" className = "space-y-3 mt-4" >
  { viewTrendLoading?<Skeleton className = "h-52 rounded-xl" /> : viewTrend.length > 0 ? (
    <div className= "rounded-xl border border-border bg-card p-4" >
    <p className="text-sm font-bold mb-3" > SMS Activity — Last 7 Days </p>
      < div className = "h-[180px]" >
        <ResponsiveContainer width="100%" height = "100%" >
          <AreaChart data={ viewTrend } margin = {{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
            <linearGradient id="gradTenantV2" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
              <stop offset="5%" stopColor = "#6366f1" stopOpacity = { 0.25} />
                <stop offset="95%" stopColor = "#6366f1" stopOpacity = { 0} />
                  </linearGradient>
                  </defs>
                  < CartesianGrid strokeDasharray = "3 3" stroke = "hsl(220,13%,91%)" vertical = { false} />
                    <XAxis dataKey="date" tick = {{ fontSize: 10 }} axisLine = { false} tickLine = { false} />
                      <YAxis tick={ { fontSize: 10 } } axisLine = { false} tickLine = { false} />
                        <Tooltip contentStyle={ { fontSize: "11px", borderRadius: "8px" } } />
                          < Area type = "monotone" dataKey = "sms_sent" stroke = "#6366f1" strokeWidth = { 2.5} fill = "url(#gradTenantV2)" name = "SMS Sent" dot = { false} />
                            </AreaChart>
                            </ResponsiveContainer>
                            </div>
                            </div>
                  ) : (
  <div className= "flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground" >
  <BarChart3 className="h-8 w-8 opacity-30" />
    <p className="text-sm" > No trend data available </p>
      </div>
                  )}
</TabsContent>

{/* Logs Tab */ }
<TabsContent value="logs" className = "mt-4 space-y-3" >
  {/* Filters + Export */ }
  < div className = "flex flex-wrap items-center gap-2" >
    <Select value={ logFilterStatus } onValueChange = {(v) => { setLogFilterStatus(v); loadViewLogs(viewTarget.id, 1, v, logFilterType); setViewLogsPage(1); }}>
      <SelectTrigger className="h-8 w-36 text-xs rounded-xl border-border" >
        <ListFilter className="h-3 w-3 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="Status" />
            </SelectTrigger>
            < SelectContent >
            <SelectItem value="all" > All Status </SelectItem>
              < SelectItem value = "sent" > Sent </SelectItem>
                < SelectItem value = "delivered" > Delivered </SelectItem>
                  < SelectItem value = "failed" > Failed </SelectItem>
                    < SelectItem value = "expired" > Expired </SelectItem>
                      < SelectItem value = "rejected" > Rejected </SelectItem>
                        </SelectContent>
                        </Select>
                        < Select value = { logFilterType } onValueChange = {(v) => { setLogFilterType(v); loadViewLogs(viewTarget.id, 1, logFilterStatus, v); setViewLogsPage(1); }}>
                          <SelectTrigger className="h-8 w-40 text-xs rounded-xl border-border" >
                            <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              < SelectContent >
                              <SelectItem value="all" > All Types </SelectItem>
                                < SelectItem value = "otp" > OTP </SelectItem>
                                  < SelectItem value = "transactional" > Transactional </SelectItem>
                                    </SelectContent>
                                    </Select>
                                    < Button size = "sm" variant = "outline" className = "h-8 gap-1.5 rounded-xl text-xs ml-auto" onClick = {() => handleExportLogs(viewTarget.id)}>
                                      <Download className="h-3 w-3" /> Export CSV
                                        </Button>
                                        </div>

{
  viewLogsLoading ? <Skeleton className="h-52 rounded-xl" /> : (
    <>
    <div className= "rounded-xl border border-border overflow-hidden" >
    <div className="overflow-x-auto" >
      <table className="w-full text-xs" >
        <thead>
        <tr className="bg-muted/40 border-b border-border" >
          <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider" > Phone </th>
            < th className = "px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider" > Type </th>
              < th className = "px-3 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wider" > Status </th>
                < th className = "px-3 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell" > Charge </th>
                  < th className = "px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell" > Sent At </th>
                    < th className = "px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider" > Reason </th>
                      </tr>
                      </thead>
                      < tbody className = "divide-y divide-border" >
                      {
                        viewLogs.map((log) => {
                          const logStatusCfg: Record<SmsLog["status"], { bg: string; text: string; icon: React.ReactNode }> = {
                            delivered: { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", text: "", icon: <CheckCircle2 className="h-3 w-3" /> },
                            sent: { bg: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400", text: "", icon: <CheckCircle2 className="h-3 w-3" /> },
                            failed: { bg: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400", text: "", icon: <XCircle className="h-3 w-3" /> },
                            expired: { bg: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400", text: "", icon: <XCircle className="h-3 w-3" /> },
                            rejected: { bg: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400", text: "", icon: <XCircle className="h-3 w-3" /> },
                          };
                          const lsc = logStatusCfg[log.status];
                          return (
                            <tr key= { log.id } className = "hover:bg-muted/20" >
                              <td className="px-3 py-2.5 font-mono text-foreground" > { log.phone } </td>
                                < td className = "px-3 py-2.5" >
                                  <span className={ `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${log.type?.toLowerCase() === "otp" ? "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"}` }>
                                    { log.type ?? "—" }
                                    </span>
                                    </td>
                                    < td className = "px-3 py-2.5 text-center" >
                                      <span className={ `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${lsc.bg}` }>
                                        { lsc.icon }{ log.status }
                          </span>
                            </td>
                            < td className = "px-3 py-2.5 text-right tabular-nums text-muted-foreground hidden sm:table-cell" >₦{ log.charge } </td>
                              < td className = "px-3 py-2.5 text-muted-foreground hidden sm:table-cell" > { log.sent_at ? new Date(log.sent_at).toLocaleString() : "—" } </td>
                                < td className = "px-3 py-2.5 text-muted-foreground" > { log.failure_reason ?? "—" } </td>
                                  </tr>
                                );
                      })
}
{
  viewLogs.length === 0 && (
    <tr><td colSpan={ 6 } className = "px-3 py-10 text-center text-muted-foreground" > No logs found < /td></tr >
                              )
}
</tbody>
  </table>
  </div>
  </div>
  < div className = "flex items-center justify-between" >
    <p className="text-xs text-muted-foreground" > { viewLogs.length } of { fmt(viewLogsTotal) } records </p>
      < div className = "flex gap-1" >
        <Button size="sm" variant = "ghost" className = "h-7 w-7 p-0 rounded-lg" disabled = { viewLogsPage <= 1} onClick = {() => loadViewLogs(viewTarget.id, viewLogsPage - 1, logFilterStatus, logFilterType)}>
          <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            < Button size = "sm" variant = "ghost" className = "h-7 w-7 p-0 rounded-lg" disabled = { viewLogsPage * 10 >= viewLogsTotal} onClick = {() => loadViewLogs(viewTarget.id, viewLogsPage + 1, logFilterStatus, logFilterType)}>
              <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                </div>
                </div>
                </>
                  )}
</TabsContent>

{/* Billing Tab */ }
<TabsContent value="billing" className = "space-y-3 mt-4" >
  <div className="grid grid-cols-3 gap-3" >
    <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/10 border border-indigo-100 dark:border-indigo-800/30 p-4 text-center" >
      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wide mb-1" > Revenue </p>
        < p className = "text-xl font-extrabold text-indigo-700 dark:text-indigo-300" > { fmtM(viewTarget.total_revenue) } </p>
          </div>
          < div className = "rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-100 dark:border-orange-800/30 p-4 text-center" >
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wide mb-1" > Provider Cost </p>
              < p className = "text-xl font-extrabold text-orange-700 dark:text-orange-300" > { fmtM(viewTarget.total_cost) } </p>
                </div>
                < div className = "rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-100 dark:border-emerald-800/30 p-4 text-center" >
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide mb-1" > Net Profit </p>
                    < p className = "text-xl font-extrabold text-emerald-700 dark:text-emerald-300" > { fmtM(viewTarget.total_profit) } </p>
                      </div>
                      </div>
                      < div className = "rounded-xl border border-border bg-card p-4 space-y-3" >
                        <div className="flex items-center justify-between" >
                          <span className="text-sm text-muted-foreground font-medium" > Profit Margin </span>
                            < div className = "flex items-center gap-2" >
                              <DonutRing pct={ viewTarget.margin_percent ?? 0 } color = "#8b5cf6" trackColor = "rgba(139,92,246,0.15)" size = { 40} />
                                <span className="text-xl font-extrabold text-violet-600" > {(viewTarget.margin_percent ?? 0).toFixed(1)}% </span>
                                  </div>
                                  </div>
                                  < div className = "h-2.5 bg-muted rounded-full overflow-hidden" >
                                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700 shadow-sm" style = {{ width: `${Math.min(viewTarget.margin_percent ?? 0, 100)}%` }} />
                                      </div>
                                      < div className = "flex items-center justify-between text-xs text-muted-foreground" >
                                        <span className="font-medium" >₦{ viewTarget.provider_cost_per_sms ?? 18 } /SMS → provider</span >
                                          <span className="font-medium" >₦{ viewTarget.charge_per_sms ?? 30 } /SMS → tenant</span >
                                            </div>
                                            </div>
                                            </TabsContent>
                                            </Tabs>
                                            </div>
          )}

<DialogFooter className="gap-2 mt-2" >
  <Button variant="outline" className = "rounded-xl" onClick = {() => { setViewOpen(false); setViewTarget(null); }}> Close </Button>
{
  viewTarget && (
    <Button onClick={ () => { setFundTarget(viewTarget); setViewOpen(false); setFundAmount(""); setFundNote(""); setFundChargePerSms(""); setFundResult(null); } }
  className = "gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-md" >
    <CreditCard className="h-4 w-4" /> Fund Wallet
      </Button>
            )
}
</DialogFooter>
  </DialogContent>
  </Dialog>

{/* ══════════════════════════════════════════
          EDIT RATE MODAL
      ══════════════════════════════════════════ */}
<Dialog open={ !!editRateTarget } onOpenChange = {(open) => !open && closeEditRate()}>
  <DialogContent className="max-w-md rounded-2xl" >
    <DialogHeader>
    <DialogTitle className="flex items-center gap-2.5" >
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md" >
        <Pencil className="h-4 w-4 text-white" />
          </div>
          < div >
          <p className="text-base font-bold" > Edit SMS Rate </p>
            < p className = "text-xs font-normal text-muted-foreground" > Update charge per SMS for this institution </p>
              </div>
              </DialogTitle>
              </DialogHeader>

          {
    editRateResult?(
            <div className = "space-y-4 py-2" >
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 p-5 text-center space-y-2">
  <CheckCircle2 className= "h-10 w-10 text-amber-500 mx-auto" />
    <p className="text-sm font-bold text-foreground" > { editRateResult.institution_name } </p>
      < div className = "flex items-center justify-center gap-4 text-sm" >
        <span className="text-muted-foreground line-through" >₦{ editRateResult.old_charge_per_sms } /SMS</span >
          <span className="text-amber-600 font-bold" >→</span>
            < span className = "text-amber-600 font-extrabold text-lg" >₦{ editRateResult.new_charge_per_sms } /SMS</span >
              </div>
              </div>
              < div className = "grid grid-cols-2 gap-3 text-sm" >
                <div className="rounded-xl bg-muted/40 p-3" >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > Provider Cost </p>
                    < p className = "font-bold" >₦{ editRateResult.provider_cost_per_sms } /SMS</p >
                      </div>
                      < div className = "rounded-xl bg-muted/40 p-3" >
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > New Margin </p>
                          < p className = "font-bold text-emerald-600" > { editRateResult.new_margin_percent.toFixed(1) } % </p>
                            </div>
                            </div>
                            < p className = "text-[11px] text-center text-muted-foreground" > Updated by < span className = "font-semibold" > { editRateResult.updated_by } < /span> · {new Date(editRateResult.updated_at).toLocaleString()}</p >
                              <DialogFooter><Button className="w-full rounded-xl" onClick = { closeEditRate } > Done < /Button></DialogFooter >
                                </div>
          ) : (
  <>
  <div className= "space-y-4 py-2" >
  { editRateTarget && (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center gap-3" >
      <div className={ `h-9 w-9 rounded-xl bg-gradient-to-br ${avatarGradient(editRateTarget.name)} flex items-center justify-center shrink-0` }>
        <span className="text-xs font-bold text-white" > { initials(editRateTarget.name) } </span>
          </div>
          < div className = "flex-1 min-w-0" >
            <p className="text-sm font-bold text-foreground truncate" > { editRateTarget.name } </p>
              < p className = "text-[10px] text-muted-foreground" > Current: ₦{ editRateTarget.charge_per_sms } /SMS · Provider cost: ₦{editRateTarget.provider_cost_per_sms}/SMS </p>
                </div>
                </div>
                )}
<div className="space-y-1.5" >
  <Label className="text-sm font-semibold" > New Charge(₦/SMS)</Label >
    <Input className="h-10 rounded-xl text-sm font-medium" placeholder = "e.g. 35" value = { editRateValue } onChange = {(e) => setEditRateValue(e.target.value)} />
  </div>
                { editRateTarget && editRateValue && parseFloat(editRateValue) > 0 && (
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/60 px-4 py-3 flex items-center justify-between" >
  <div>
  <p className="text-xs text-muted-foreground font-medium" > New margin </p>
  < p className = "text-xs text-muted-foreground" > ({ editRateValue } − { editRateTarget.provider_cost_per_sms }) ÷ { editRateValue } </p>
    </div>
    < span className = "text-2xl font-extrabold text-emerald-600" >
      { Math.max(0, Math.round(((parseFloat(editRateValue) - editRateTarget.provider_cost_per_sms) / parseFloat(editRateValue)) * 100)) } %
      </span>
      </div>
                )}
<div className="space-y-1.5" >
  <Label className="text-sm font-semibold" > Reason < span className = "text-muted-foreground font-normal" > (optional) < /span></Label >
    <Input className="h-10 rounded-xl text-sm" placeholder = "e.g. Q2 pricing adjustment" value = { editRateReason } onChange = {(e) => setEditRateReason(e.target.value)} />
      </div>
      </div>
      < DialogFooter className = "gap-2" >
        <Button variant="outline" className = "rounded-xl" onClick = { closeEditRate } disabled = { editRateLoading } > Cancel </Button>
          < Button disabled = {!editRateValue || parseFloat(editRateValue) <= 0 || editRateLoading} onClick = { handleEditRateSubmit }
className = "gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-md text-white" >
  <Pencil className="h-3.5 w-3.5" /> { editRateLoading? "Saving...": "Update Rate" }
    </Button>
    </DialogFooter>
    </>
          )}
</DialogContent>
  </Dialog>

{/* ══════════════════════════════════════════
          SUSPEND / REACTIVATE CONFIRM
      ══════════════════════════════════════════ */}
<Dialog open={ !!statusTarget } onOpenChange = {(open) => !open && setStatusTarget(null)}>
  <DialogContent className="max-w-sm rounded-2xl" >
    <DialogHeader>
    <DialogTitle className="flex items-center gap-2.5" >
      <div className={ `h-9 w-9 rounded-xl flex items-center justify-center shadow-md ${statusTarget?.status === "suspended" ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-rose-500 to-red-600"}` }>
        { statusTarget?.status === "suspended" ? <UserCheck className="h-4 w-4 text-white" /> : <Ban className="h-4 w-4 text-white" />}
</div>
  < div >
  <p className="text-base font-bold" > { statusTarget?.status === "suspended" ? "Reactivate" : "Suspend"} Institution </p>
    < p className = "text-xs font-normal text-muted-foreground" > { statusTarget?.name } </p>
      </div>
      </DialogTitle>
      < DialogDescription className = "text-sm pt-2" >
        { statusTarget?.status === "suspended"
        ? "This will reactivate the institution and allow SMS sending to resume."
        : "This will suspend the institution and prevent any new SMS from being sent."}
</DialogDescription>
  </DialogHeader>
  < DialogFooter className = "gap-2 mt-2" >
    <Button variant="outline" className = "rounded-xl" onClick = {() => setStatusTarget(null)} disabled = { statusLoading } > Cancel </Button>
      < Button disabled = { statusLoading } onClick = { handleStatusToggle }
className = {`rounded-xl border-0 shadow-md gap-1.5 ${statusTarget?.status === "suspended" ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"}`}>
  { statusTarget?.status === "suspended" ? <UserCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
{ statusLoading ? "Processing..." : statusTarget?.status === "suspended" ? "Reactivate" : "Suspend" }
</Button>
  </DialogFooter>
  </DialogContent>
  </Dialog>

{/* ══════════════════════════════════════════
          BULK FUND MODAL
      ══════════════════════════════════════════ */}
<Dialog open={ bulkFundOpen } onOpenChange = {(open) => { if (!open) { setBulkFundOpen(false); setBulkResult(null); } }}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" >
    <DialogHeader>
    <DialogTitle className="flex items-center gap-2.5" >
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md" >
        <Zap className="h-4 w-4 text-white" />
          </div>
          < div >
          <p className="text-base font-bold" > Bulk Fund Wallets </p>
            < p className = "text-xs font-normal text-muted-foreground" > Fund multiple institutions in one transaction </p>
              </div>
              </DialogTitle>
              </DialogHeader>

{
  bulkResult ? (
    <div className= "space-y-4 py-2" >
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-200/60 p-5 text-center space-y-1" >
      <CheckCircle2 className="h-10 w-10 text-indigo-500 mx-auto mb-2" />
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide" > Bulk Fund Complete </p>
          < p className = "text-3xl font-black text-indigo-600 tabular-nums" > +{ fmt(bulkResult.total_units_credited) } units </p>
            </div>
            < div className = "grid grid-cols-3 gap-3" >
              <div className="rounded-xl bg-muted/40 p-3 text-center" >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > Total Paid </p>
                  < p className = "font-bold" > { fmtN(bulkResult.total_amount_ngn) } </p>
                    </div>
                    < div className = "rounded-xl bg-muted/40 p-3 text-center" >
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1" > Units Credited </p>
                        < p className = "font-bold text-indigo-600" > { fmt(bulkResult.total_units_credited) } </p>
                          </div>
                          < div className = "rounded-xl bg-violet-50 dark:bg-violet-950/20 p-3 text-center" >
                            <p className="text-[10px] text-violet-600 uppercase tracking-wide font-semibold mb-1" > Your Profit </p>
                              < p className = "font-bold text-violet-600" > { fmtN(bulkResult.total_your_profit) } </p>
                                </div>
                                </div>
                                < div className = "space-y-2" >
                                {
                                  bulkResult.results.map((r) => {
                                    const inst = institutions.find((i) => i.id === r.institution_id);
                                    return (
                                      <div key= { r.institution_id } className = "flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5 text-sm" >
                                        <div className="flex items-center gap-2" >
                                          { inst && <div className={ `h-6 w-6 rounded-lg bg-gradient-to-br ${avatarGradient(inst.name)} flex items-center justify-center` }> <span className="text-[9px] font-bold text-white" > { initials(inst.name)
                                } < /span></div >}
<span className="font-medium text-foreground" > { inst?.name ?? `#${r.institution_id}`}</span>
  </div>
  < div className = "flex items-center gap-4 text-xs" >
    <span className="text-emerald-600 font-bold" > +{ fmt(r.units_credited) } units </span>
      < span className = "text-muted-foreground" >→ { fmt(r.new_balance) } bal </span>
        </div>
        </div>
                  );
                })}
</div>
  < DialogFooter > <Button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 border-0" onClick = {() => { setBulkFundOpen(false); setBulkResult(null); }}> Done < /Button></DialogFooter >
    </div>
          ) : (
  <>
  <div className= "space-y-3 py-2" >
  <p className="text-xs text-muted-foreground" > Enter amount for each institution you want to fund.Leave blank to skip.</p>
    < div className = "space-y-2 max-h-[40vh] overflow-y-auto pr-1" >
    {
      institutions.map((inst) => {
        const sel = bulkSelections[inst.id] ?? { amount_ngn: "", charge_per_sms: String(inst.charge_per_sms) };
        const units = parseFloat(sel.amount_ngn) > 0 && parseFloat(sel.charge_per_sms) > 0
          ? Math.floor(parseFloat(sel.amount_ngn) / parseFloat(sel.charge_per_sms)) : 0;
        return (
          <div key= { inst.id } className = "flex items-center gap-3 rounded-xl border border-border px-3 py-2.5" >
            <div className={ `h-8 w-8 rounded-xl bg-gradient-to-br ${avatarGradient(inst.name)} flex items-center justify-center shrink-0` }>
              <span className="text-[10px] font-bold text-white" > { initials(inst.name)
    } </span>
      </div>
      < div className = "flex-1 min-w-0" >
        <p className="text-sm font-semibold text-foreground truncate" > { inst.name } </p>
          < p className = "text-[10px] text-muted-foreground" > Balance: { fmt(inst.sms_balance) } SMS </p>
            </div>
            < div className = "flex items-center gap-2 shrink-0" >
              <div className="relative" >
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold" >₦</span>
                  < Input className = "pl-5 h-8 w-28 rounded-lg text-xs" placeholder = "Amount"
value = { sel.amount_ngn }
onChange = {(e) => setBulkSelections((prev) => ({ ...prev, [inst.id]: { ...sel, amount_ngn: e.target.value } }))} />
  </div>
  < Input className = "h-8 w-20 rounded-lg text-xs" placeholder = "Rate"
value = { sel.charge_per_sms }
onChange = {(e) => setBulkSelections((prev) => ({ ...prev, [inst.id]: { ...sel, charge_per_sms: e.target.value } }))} />
{ units > 0 && <span className="text-xs text-emerald-600 font-bold w-20 shrink-0" > +{ fmt(units) } SMS </span> }
</div>
  </div>
                    );
                  })}
</div>
  < div className = "space-y-1.5" >
    <Label className="text-sm font-semibold" > Note < span className = "text-muted-foreground font-normal" > (optional) < /span></Label >
      <Input className="h-10 rounded-xl text-sm" placeholder = "e.g. Monthly batch top-up" value = { bulkNote } onChange = {(e) => setBulkNote(e.target.value)} />
        </div>
{/* Summary */ }
{
  Object.values(bulkSelections).some((v) => parseFloat(v.amount_ngn) > 0) && (
    <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/10 border border-indigo-200/60 px-4 py-3 flex items-center justify-between" >
      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300" >
        { Object.values(bulkSelections).filter((v) => parseFloat(v.amount_ngn) > 0).length } institutions · { fmtN(Object.values(bulkSelections).reduce((s, v) => s + (parseFloat(v.amount_ngn) || 0), 0)) } total
          </span>
          </div>
                )
}
</div>
  < DialogFooter className = "gap-2" >
    <Button variant="outline" className = "rounded-xl" onClick = {() => setBulkFundOpen(false)} disabled = { bulkLoading } > Cancel </Button>
      < Button disabled = { bulkLoading || !Object.values(bulkSelections).some((v) => parseFloat(v.amount_ngn) > 0)} onClick = { handleBulkFundSubmit }
className = "gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 shadow-md" >
  <Zap className="h-3.5 w-3.5" /> { bulkLoading? "Processing...": "Fund Selected" }
    </Button>
    </DialogFooter>
    </>
          )}
</DialogContent>
  </Dialog>

{/* ══════════════════════════════════════════
          SETTINGS MODAL
      ══════════════════════════════════════════ */}
<Dialog open={ settingsOpen } onOpenChange = { setSettingsOpen } >
  <DialogContent className="max-w-lg rounded-2xl" >
    <DialogHeader>
    <DialogTitle className="flex items-center gap-2.5" >
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md" >
        <Settings2 className="h-4 w-4 text-white" />
          </div>
          < div >
          <p className="text-base font-bold" > SMS System Settings </p>
            < p className = "text-xs font-normal text-muted-foreground" > Pricing, thresholds & delivery configuration </p>
              </div>
              </DialogTitle>
              </DialogHeader>
{
  settingsLoading ? (
    <div className= "space-y-3 py-4" > { Array.from({ length: 5 }).map((_, i) => <Skeleton key={ i } className = "h-12 rounded-xl" />) } </div>
          ) : (
    <div className= "space-y-5 py-2" >
    {/* Pricing */ }
    < div className = "space-y-3" >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest" > Pricing </p>
        < div className = "grid grid-cols-2 gap-3" >
          <div className="space-y-1.5" >
            <Label className="text-sm font-semibold" > Charge Price(₦/SMS)</Label >
              <Input className="h-10 rounded-xl" value = { settingsForm.default_charge_per_sms } onChange = {(e) => setSettingsForm(f => ({ ...f, default_charge_per_sms: parseFloat(e.target.value) || 0 }))} />
                < p className = "text-[11px] text-muted-foreground" > What you charge tenants </p>
                  </div>
                  < div className = "space-y-1.5" >
                    <Label className="text-sm font-semibold" > Provider Cost(₦/SMS)</Label >
                      <Input className="h-10 rounded-xl" value = { settingsForm.provider_cost_per_sms } onChange = {(e) => setSettingsForm(f => ({ ...f, provider_cost_per_sms: parseFloat(e.target.value) || 0 }))} />
                    < p className = "text-[11px] text-muted-foreground" > What you pay provider </p>
                    </div>
                    </div>
                {/* Auto margin */ }
                      < div className = "rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/60 dark:border-emerald-800/30 px-4 py-3 flex items-center justify-between" >
                      <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300" > Auto - calculated Margin </p>
                    < p className = "text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5" >
                    ({ settingsForm.default_charge_per_sms } − { settingsForm.provider_cost_per_sms }) ÷ { settingsForm.default_charge_per_sms } × 100
                      </p>
                      </div>
                      < div className = "flex items-center gap-2" >
                        <DonutRing pct={ settingsForm.default_charge_per_sms > 0 ? Math.round(((settingsForm.default_charge_per_sms - settingsForm.provider_cost_per_sms) / settingsForm.default_charge_per_sms) * 100) : 0 }
color = "#10b981" trackColor = "rgba(16,185,129,0.2)" size = { 44} />
  <span className="text-2xl font-extrabold text-emerald-600" >
    {
      settingsForm.default_charge_per_sms > 0
        ? Math.round(((settingsForm.default_charge_per_sms - settingsForm.provider_cost_per_sms) / settingsForm.default_charge_per_sms) * 100)
        : 0
    } %
    </span>
    </div>
    </div>
    </div>

    < Separator />

    {/* Thresholds */ }
    < div className = "space-y-3" >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest" > Thresholds & Delivery </p>
        < div className = "space-y-1.5" >
          <Label className="text-sm font-semibold" > Low Balance Threshold(units) </Label>
            < Input className = "h-10 rounded-xl" value = { settingsForm.low_balance_threshold } onChange = {(e) => setSettingsForm(f => ({ ...f, low_balance_threshold: parseFloat(e.target.value) || 0 }))} />
              < p className = "text-[11px] text-muted-foreground" > Alert when balance falls below this value </p>
                </div>
                < div className = "space-y-1.5" >
                  <Label className="text-sm font-semibold" > Default Sender ID </Label>
                    < Input className = "h-10 rounded-xl" value = { settingsForm.default_sender_id } onChange = {(e) => setSettingsForm(f => ({ ...f, default_sender_id: e.target.value }))} />
                      </div>
                      < div className = "grid grid-cols-2 gap-3" >
                        <div className="space-y-1.5" >
                          <Label className="text-sm font-semibold" > Max SMS Retries </Label>
                            < Select value = { String(settingsForm.max_retries) } onValueChange = {(v) => setSettingsForm(f => ({ ...f, max_retries: parseInt(v) }))}>
                              <SelectTrigger className="h-10 rounded-xl" > <SelectValue /></SelectTrigger >
                                <SelectContent>
                                {
                                  [1, 2, 3, 4, 5].map((n) => (
                                    <SelectItem key= { n } value = { String(n) } > { n } { n === 1 ? "retry" : "retries"} </SelectItem>
                        ))}
</SelectContent>
  </Select>
  </div>
  < div className = "space-y-1.5" >
    <Label className="text-sm font-semibold" > Failure Alert(%) </Label>
      < Input className = "h-10 rounded-xl" value = { settingsForm.failure_alert_threshold_percent } onChange = {(e) => setSettingsForm(f => ({ ...f, failure_alert_threshold_percent: parseFloat(e.target.value) || 0 }))} />
        </div>
        </div>
        </div>
        </div>
          )}
<DialogFooter className="gap-2" >
  <Button variant="outline" className = "rounded-xl" onClick = {() => setSettingsOpen(false)} disabled = { settingsSaving } > Cancel </Button>
    < Button onClick = { handleSettingsSave } disabled = { settingsSaving || settingsLoading}
className = "gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 shadow-md" >
  <CheckCircle2 className="h-4 w-4" /> { settingsSaving? "Saving...": "Save Settings" }
    </Button>
    </DialogFooter>
    </DialogContent>
    </Dialog>
    </DashboardLayout>
  );
}
