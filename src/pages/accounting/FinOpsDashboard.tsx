import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api";
import {
  ArrowUp, ArrowDown, ArrowRight, RefreshCw,
  TrendingUp, Wallet, DollarSign, Users, MessageSquare, FileText,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const TOOLTIP = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px", color: "hsl(var(--foreground))", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 },
};
const PIE_COLORS = ["hsl(234, 89%, 54%)", "hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)", "hsl(38, 92%, 50%)", "hsl(271, 81%, 56%)"];

function fmtNGN(n: number | undefined | null): string {
  const v = n ?? 0;
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v.toLocaleString()}`;
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function HealthGauge({ score }: { score: number }) {
  const r = 54, cx = 70, cy = 70;
  const circ = Math.PI * r;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 140 90" className="w-full">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score / 100) * circ} ${circ}`} />
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 24, fontWeight: 700, fill: color }}>{score}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 10, fill: "#71717A" }}>/ 100</text>
    </svg>
  );
}

type Period = "Today" | "This Month" | "This Quarter" | "This Year";

const toneMap: Record<string, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-600 dark:text-rose-400" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-600 dark:text-orange-400" },
};

export default function FinOpsDashboard() {
  const [period, setPeriod] = useState<Period>("This Month");
  const periods: Period[] = ["Today", "This Month", "This Quarter", "This Year"];

  const { data: summary, isLoading: loadingSummary, refetch } = useQuery({
    queryKey: ["fin-revenue-summary"],
    queryFn: () => financeApi.getRevenueSummary(),
    staleTime: 60_000,
  });
  const { data: trend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ["fin-revenue-trend"],
    queryFn: () => financeApi.getRevenueTrend(12),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 5 * 60_000,
  });
  const { data: bySource = [] } = useQuery({
    queryKey: ["fin-revenue-by-source"],
    queryFn: () => financeApi.getRevenueBySource("month"),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 5 * 60_000,
  });

  const periodData = period === "Today" ? summary?.today
    : period === "This Month" ? summary?.month
    : period === "This Quarter" ? summary?.month  // backend can extend later
    : summary?.year;

  const miniKpis = [
    { label: "Revenue", value: fmtNGN(periodData?.revenue ?? 0), sub: `${period}`, icon: DollarSign, tone: "emerald", dir: "up" as const },
    { label: "Expenses", value: fmtNGN(periodData?.expenses ?? 0), sub: `${period}`, icon: Wallet, tone: "rose", dir: "down" as const },
    { label: "Net Profit", value: fmtNGN(periodData?.net_profit ?? 0), sub: `${period}`, icon: TrendingUp, tone: "violet", dir: "up" as const },
    { label: "Owner's Draw", value: fmtNGN(periodData?.owner_draw ?? 0), sub: "Equity withdrawal", icon: Users, tone: "amber", dir: "right" as const },
    { label: "MRR", value: fmtNGN(summary?.mrr ?? 0), sub: "Monthly recurring", icon: MessageSquare, tone: "blue", dir: "up" as const },
    { label: "Outstanding", value: fmtNGN(summary?.outstanding_invoices?.amount ?? 0), sub: `${summary?.outstanding_invoices?.count ?? 0} invoices`, icon: FileText, tone: "orange", dir: "right" as const },
  ];

  const pieData = bySource.map((s, i) => ({ name: s.source_name, value: s.percent, color: PIE_COLORS[i % PIE_COLORS.length] }));
  const profitData = trend.slice(-6).map((t) => ({ month: t.label, profit: t.net_profit }));
  const healthScore = summary?.financial_health_score ?? 82;

  return (
    <DashboardLayout title="FinOps Center">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[12px] font-medium text-muted-foreground">QuovaTech BOC · Finance</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">FinOps Center</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Executive financial command center</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-card p-1">
              {periods.map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {p}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Row 1 — Period KPIs */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {loadingSummary
            ? Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-[110px]" />)
            : miniKpis.map((k) => {
                const tone = toneMap[k.tone];
                return (
                  <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.bg}`}>
                        <k.icon className={`h-4 w-4 ${tone.text}`} />
                      </div>
                      <span className={`text-[11px] font-semibold ${tone.text}`}>
                        {k.dir === "up" ? <ArrowUp className="h-3 w-3 inline" /> : k.dir === "down" ? <ArrowDown className="h-3 w-3 inline" /> : <ArrowRight className="h-3 w-3 inline" />}
                      </span>
                    </div>
                    <p className="text-[20px] font-bold tracking-tight text-foreground leading-none">{k.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{k.label}</p>
                    <p className={`text-[11px] mt-1 font-medium ${tone.text}`}>{k.sub}</p>
                  </div>
                );
              })}
        </div>

        {/* Row 2 — Monthly KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loadingSummary ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-[96px]" />) : (<>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[12px] text-muted-foreground">Annual Recurring Revenue</p>
              <p className="text-[26px] font-bold tracking-tight text-foreground leading-none mt-1">{fmtNGN(summary?.arr ?? 0)}</p>
              <p className="text-[11px] mt-2 font-medium text-muted-foreground">Projected · {summary?.mrr ? `${fmtNGN(summary.mrr)} MRR` : "—"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[12px] text-muted-foreground">Gross Margin</p>
              <p className="text-[26px] font-bold tracking-tight text-foreground leading-none mt-1">{summary?.gross_margin_percent?.toFixed(1) ?? "—"}%</p>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${summary?.gross_margin_percent ?? 0}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[12px] text-muted-foreground">Net Margin</p>
              <p className="text-[26px] font-bold tracking-tight text-foreground leading-none mt-1">{summary?.net_margin_percent?.toFixed(1) ?? "—"}%</p>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${summary?.net_margin_percent ?? 0}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[12px] text-muted-foreground">Overdue Invoices</p>
              <p className="text-[26px] font-bold tracking-tight text-foreground leading-none mt-1 text-rose-600 dark:text-rose-400">{fmtNGN(summary?.overdue_invoices?.amount ?? 0)}</p>
              <p className="text-[11px] mt-2 font-medium text-rose-600 dark:text-rose-400">{summary?.overdue_invoices?.count ?? 0} overdue</p>
            </div>
          </>)}
        </div>

        {/* Row 3 — Main charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Last 12 months</p>
            </div>
            <div className="h-[280px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 54%)" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Income vs Expenses</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Monthly comparison</p>
            </div>
            <div className="h-[280px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP} formatter={(v: number, name: string) => [fmtNGN(v), name === "revenue" ? "Revenue" : "Expenses"]} />
                    <Bar dataKey="revenue" fill="hsl(234, 89%, 54%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Row 4 — Secondary charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Revenue by Source</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Share of MTD total</p>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP} formatter={(v: number) => [`${v.toFixed(1)}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {pieData.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-foreground truncate max-w-[120px]">{s.name}</span>
                  </div>
                  <span className="font-medium text-muted-foreground">{s.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Monthly Net Profit</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Last 6 months</p>
            </div>
            <div className="h-[240px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "Net Profit"]} />
                    <Bar dataKey="profit" fill="hsl(271, 81%, 56%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Financial Health Score</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Composite index</p>
            </div>
            {loadingSummary ? <Sk className="h-[90px]" /> : <HealthGauge score={healthScore} />}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[13px] font-bold text-foreground">{fmtNGN(summary?.outstanding_invoices?.amount ?? 0)}</p>
                <p className="text-[10px] text-muted-foreground">Outstanding</p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">{fmtNGN(summary?.burn_rate ?? 0)}/mo</p>
                <p className="text-[10px] text-muted-foreground">Burn Rate</p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">{summary?.runway_months?.toFixed(1) ?? "—"} mo</p>
                <p className="text-[10px] text-muted-foreground">Runway</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 5 — Bottom */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Top Revenue Sources</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Month to date</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Source", "Revenue", "% of Total", "Trend"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bySource.slice(0, 8).map((r) => (
                    <tr key={r.source_id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 text-[13px] font-medium text-foreground">{r.source_name}</td>
                      <td className="px-4 py-3.5 text-[13px] text-right text-foreground">{fmtNGN(r.amount)}</td>
                      <td className="px-4 py-3.5 text-[13px] text-right text-muted-foreground">{r.percent.toFixed(1)}%</td>
                      <td className={`px-4 py-3.5 text-[13px] text-right font-medium ${r.trend_percent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {r.trend_percent >= 0 ? "+" : ""}{r.trend_percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[12px] text-muted-foreground">ARR</p>
              <p className="text-[22px] font-bold text-foreground leading-none mt-1">{fmtNGN(summary?.arr ?? 0)}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Annual recurring revenue</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[12px] text-muted-foreground">Owner's Draw (Month)</p>
              <p className="text-[22px] font-bold text-foreground leading-none mt-1">{fmtNGN(summary?.month?.owner_draw ?? 0)}</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">Equity withdrawal · not an expense</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[12px] text-muted-foreground">Investor Readiness</p>
              <p className="text-[22px] font-bold text-foreground leading-none mt-1">{summary?.investor_readiness_score ?? 74}/100</p>
              <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${summary?.investor_readiness_score ?? 74}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
