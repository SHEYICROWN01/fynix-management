import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { financeApi } from "@/lib/api";

const TOOLTIP = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px", color: "hsl(var(--foreground))", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 },
};

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

type KpiStatus = "Exceeds" | "On Target" | "Below Target";

function statusCls(s: KpiStatus) {
  if (s === "Exceeds") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
  if (s === "On Target") return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
  return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
}

export default function FinancialMetrics() {
  const [period, setPeriod] = useState("month");

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ["fin-kpis", period],
    queryFn: () => financeApi.getKPIs(period),
    staleTime: 5 * 60_000,
  });
  const { data: trend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ["fin-revenue-trend-24"],
    queryFn: () => financeApi.getRevenueTrend(12),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 5 * 60_000,
  });

  const mrrData = trend.map((t) => ({ month: t.label, mrr: t.revenue }));
  const arrData = trend.map((t) => ({ month: t.label, arr: t.revenue * 12 }));
  const marginData = trend.map((t) => ({
    month: t.label,
    margin: t.revenue > 0 ? ((t.net_profit / t.revenue) * 100) : 0,
  }));

  const kpiCards = kpis ? [
    { label: "MRR", value: fmtNGN(kpis.mrr), change: `+${kpis.mrr_growth_percent?.toFixed(1) ?? "—"}% MoM`, up: (kpis.mrr_growth_percent ?? 0) > 0 },
    { label: "ARR", value: fmtNGN(kpis.arr), change: `+${kpis.arr_growth_percent?.toFixed(1) ?? "—"}% YoY`, up: (kpis.arr_growth_percent ?? 0) > 0 },
    { label: "LTV", value: fmtNGN(kpis.ltv), change: "avg per institution", up: true },
    { label: "CAC", value: fmtNGN(kpis.cac), change: "avg acquisition cost", up: false },
    { label: "Net Margin", value: `${kpis.net_margin_percent?.toFixed(1) ?? "—"}%`, change: "net profit margin", up: (kpis.net_margin_percent ?? 0) > 40 },
    { label: "Gross Margin", value: `${kpis.gross_margin_percent?.toFixed(1) ?? "—"}%`, change: "gross profit margin", up: (kpis.gross_margin_percent ?? 0) > 70 },
    { label: "Operating Margin", value: `${kpis.operating_margin_percent?.toFixed(1) ?? "—"}%`, change: "operating margin", up: (kpis.operating_margin_percent ?? 0) > 0 },
    { label: "Churn Rate", value: `${kpis.churn_rate_percent?.toFixed(2) ?? "—"}%`, change: "monthly churn", up: (kpis.churn_rate_percent ?? 100) < 2 },
  ] : [];

  const kpiTable = kpis ? [
    { name: "Monthly Recurring Revenue", current: fmtNGN(kpis.mrr), target: "₦4.2M", status: (kpis.mrr ?? 0) > 4_200_000 ? "Exceeds" : "On Target" as KpiStatus },
    { name: "Annual Recurring Revenue", current: fmtNGN(kpis.arr), target: "₦50.0M", status: (kpis.arr ?? 0) > 50_000_000 ? "Exceeds" : "On Target" as KpiStatus },
    { name: "LTV:CAC Ratio", current: `${kpis.ltv_cac_ratio?.toFixed(1) ?? "—"}x`, target: "25.0x", status: (kpis.ltv_cac_ratio ?? 0) >= 25 ? "Exceeds" : "Below Target" as KpiStatus },
    { name: "Gross Margin", current: `${kpis.gross_margin_percent?.toFixed(1) ?? "—"}%`, target: "75.0%", status: (kpis.gross_margin_percent ?? 0) >= 75 ? "Exceeds" : "Below Target" as KpiStatus },
    { name: "Net Profit Margin", current: `${kpis.net_margin_percent?.toFixed(1) ?? "—"}%`, target: "48.0%", status: (kpis.net_margin_percent ?? 0) >= 48 ? "On Target" : "Below Target" as KpiStatus },
    { name: "Operating Margin", current: `${kpis.operating_margin_percent?.toFixed(1) ?? "—"}%`, target: "50.0%", status: (kpis.operating_margin_percent ?? 0) >= 50 ? "Exceeds" : "Below Target" as KpiStatus },
    { name: "Monthly Churn Rate", current: `${kpis.churn_rate_percent?.toFixed(2) ?? "—"}%`, target: "1.5%", status: (kpis.churn_rate_percent ?? 100) <= 1.5 ? "Exceeds" : "Below Target" as KpiStatus },
    { name: "Financial Health Score", current: `${kpis.financial_health_score ?? "—"}/100`, target: "80/100", status: (kpis.financial_health_score ?? 0) >= 80 ? "Exceeds" : "On Target" as KpiStatus },
  ] : [];

  return (
    <DashboardLayout title="Financial Analytics & KPIs">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Analytics & KPIs</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Track SaaS metrics and financial performance</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {loadingKpis
            ? Array.from({ length: 8 }).map((_, i) => <Sk key={i} className="h-[90px]" />)
            : kpiCards.map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-5">
                  <p className="text-[12px] text-muted-foreground">{k.label}</p>
                  <p className="text-[24px] font-bold tracking-tight text-foreground leading-none mt-1">{k.value}</p>
                  <p className={`flex items-center gap-0.5 text-[11px] mt-2 font-medium ${k.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {k.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {k.change}
                  </p>
                </div>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">MRR Growth</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Last 12 months</p>
            </div>
            <div className="h-[260px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mrrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717A" }} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "MRR"]} />
                    <Line type="monotone" dataKey="mrr" stroke="hsl(234, 89%, 54%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">ARR Progression</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Annualized run rate</p>
            </div>
            <div className="h-[260px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={arrData}>
                    <defs>
                      <linearGradient id="fm-arr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717A" }} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "ARR"]} />
                    <Area type="monotone" dataKey="arr" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fill="url(#fm-arr)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Profit Margin Trend</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Net margin %</p>
            </div>
            <div className="h-[260px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marginData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717A" }} />
                    <YAxis tickFormatter={(v) => `${(v as number).toFixed(1)}%`} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [`${v.toFixed(1)}%`, "Net Margin"]} />
                    <Line type="monotone" dataKey="margin" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Monthly Net Profit</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Last 12 months</p>
            </div>
            <div className="h-[260px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend.map((t) => ({ month: t.label, profit: t.net_profit }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717A" }} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "Net Profit"]} />
                    <Bar dataKey="profit" fill="hsl(234, 89%, 54%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Financial KPI Scorecard</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Current value vs target</p>
          </div>
          {loadingKpis ? <Sk className="h-[200px]" /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["KPI", "Current", "Target", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kpiTable.map((r) => (
                    <tr key={r.name} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-[13px] font-medium text-foreground">{r.name}</td>
                      <td className="px-4 py-3 text-[13px] text-right text-foreground">{r.current}</td>
                      <td className="px-4 py-3 text-[13px] text-right text-muted-foreground">{r.target}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${statusCls(r.status)}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
