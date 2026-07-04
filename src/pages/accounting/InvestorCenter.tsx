import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, CheckCircle2, Circle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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

const milestones = [
  { date: "Jan 2025", title: "Company Founded", done: true },
  { date: "Mar 2025", title: "First Tenant Onboarded", done: true },
  { date: "Jun 2025", title: "₦1M MRR Achieved", done: true },
  { date: "Sep 2025", title: "50 Institutions", done: true },
  { date: "Dec 2025", title: "₦100M ARR Run Rate", done: true },
  { date: "Mar 2026", title: "100+ Institutions", done: true },
  { date: "Q3 2026", title: "Series A Target", done: false },
];

const funding = [
  { round: "Founders", amount: "₦25M", date: "Jan 2025", investors: "Founding Team", valuation: "₦120M" },
  { round: "Pre-Seed", amount: "₦80M", date: "May 2025", investors: "Ventures Platform, Angels", valuation: "₦450M" },
  { round: "Seed", amount: "₦320M", date: "Nov 2025", investors: "Microtraction, LoftyInc", valuation: "₦1.2B" },
  { round: "Series A (Target)", amount: "₦1.5B", date: "Q3 2026", investors: "TBD", valuation: "₦2.1B" },
];

export default function InvestorCenter() {
  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ["fin-kpis-year"],
    queryFn: () => financeApi.getKPIs("year"),
    staleTime: 5 * 60_000,
  });
  const { data: trend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ["fin-revenue-trend-24"],
    queryFn: () => financeApi.getRevenueTrend(24),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 5 * 60_000,
  });

  const arrGrowth = trend.map((t) => ({ month: t.label, arr: t.revenue * 12 }));
  const valuation = kpis ? kpis.arr * 5 : 0;

  const revComposition = trend.slice(-6).map((t) => ({
    period: t.label,
    Revenue: t.revenue,
    Profit: t.net_profit,
  }));

  const kpiRows = kpis ? [
    [
      { label: "MRR", value: fmtNGN(kpis.mrr) },
      { label: "ARR", value: fmtNGN(kpis.arr) },
      { label: "MoM Growth", value: `+${kpis.mrr_growth_percent?.toFixed(1) ?? "—"}%` },
      { label: "YoY Growth", value: `+${kpis.arr_growth_percent?.toFixed(1) ?? "—"}%` },
    ],
    [
      { label: "LTV:CAC Ratio", value: `${kpis.ltv_cac_ratio?.toFixed(1) ?? "—"}x` },
      { label: "CAC", value: fmtNGN(kpis.cac) },
      { label: "Gross Margin", value: `${kpis.gross_margin_percent?.toFixed(1) ?? "—"}%` },
      { label: "Burn Rate", value: `${fmtNGN(kpis.burn_rate)}/mo` },
    ],
    [
      { label: "Runway", value: `${kpis.runway_months?.toFixed(1) ?? "—"} mo` },
      { label: "Net Margin", value: `${kpis.net_margin_percent?.toFixed(1) ?? "—"}%` },
      { label: "Health Score", value: `${kpis.financial_health_score ?? "—"}/100` },
      { label: "Investor Score", value: `${kpis.investor_readiness_score ?? "—"}/100` },
    ],
  ] : [];

  return (
    <DashboardLayout title="Investor Relations Center">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Investor Relations Center</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Company performance and fundraising overview</p>
          </div>
          <Button size="sm" onClick={() => toast.success("Investor report downloaded")}>
            <Download className="h-4 w-4 mr-1.5" /> Download Investor Report
          </Button>
        </div>

        {/* Valuation hero */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-violet-500/10 via-card to-blue-500/10 p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground">Estimated Company Valuation</p>
              {loadingKpis ? <Sk className="h-[52px] w-[220px] mt-1" /> : (
                <p className="text-[42px] font-bold tracking-tight text-foreground leading-none mt-1">{fmtNGN(valuation)}</p>
              )}
              <p className="text-[12px] text-muted-foreground mt-2">Methodology: 5× ARR multiple applied to {fmtNGN(kpis?.arr ?? 0)} ARR run rate</p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-[18px] font-bold text-foreground">5.0×</p>
                <p className="text-[11px] text-muted-foreground">Revenue Multiple</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-emerald-600 dark:text-emerald-400">
                  {kpis ? `+${kpis.arr_growth_percent?.toFixed(1) ?? "—"}%` : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">YoY Growth</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-foreground">{kpis?.investor_readiness_score ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">Investor Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="space-y-4">
          {loadingKpis
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="grid gap-4 grid-cols-2 md:grid-cols-4">{Array.from({ length: 4 }).map((_, j) => <Sk key={j} className="h-[90px]" />)}</div>)
            : kpiRows.map((row, ri) => (
                <div key={ri} className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  {row.map((k) => (
                    <div key={k.label} className="rounded-xl border border-border bg-card p-5">
                      <p className="text-[12px] text-muted-foreground">{k.label}</p>
                      <p className="text-[24px] font-bold tracking-tight text-foreground leading-none mt-1">{k.value}</p>
                    </div>
                  ))}
                </div>
              ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">ARR Growth</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Last 24 months</p>
            </div>
            <div className="h-[280px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={arrGrowth}>
                    <defs>
                      <linearGradient id="ic-arr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#71717A" }} interval={3} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "ARR"]} />
                    <Area type="monotone" dataKey="arr" stroke="hsl(271, 81%, 56%)" strokeWidth={2} fill="url(#ic-arr)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Revenue & Profit Trend</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Last 6 months</p>
            </div>
            <div className="h-[280px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revComposition}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#71717A" }} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v)]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Revenue" fill="hsl(234, 89%, 54%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Profit" fill="hsl(160, 84%, 39%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Milestones + Funding */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Financial Milestones</h3>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />
              <div className="space-y-5">
                {milestones.map((m) => (
                  <div key={m.title} className="relative">
                    <div className="absolute -left-6 top-0.5">
                      {m.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground">{m.date}</p>
                    <p className={`text-[13px] font-semibold ${m.done ? "text-foreground" : "text-muted-foreground"}`}>{m.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Funding History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Round", "Amount", "Date", "Investors", "Valuation"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {funding.map((f) => (
                    <tr key={f.round} className="hover:bg-muted/30">
                      <td className="px-3 py-3 text-[13px] font-medium text-foreground">{f.round}</td>
                      <td className="px-3 py-3 text-[13px] text-right text-foreground">{f.amount}</td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">{f.date}</td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">{f.investors}</td>
                      <td className="px-3 py-3 text-[13px] text-right text-foreground">{f.valuation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Investor Report Package</h3>
            <p className="text-[13px] text-muted-foreground mt-1">
              ARR {fmtNGN(kpis?.arr ?? 0)} · Growth +{kpis?.arr_growth_percent?.toFixed(1) ?? "—"}% YoY · Runway {kpis?.runway_months?.toFixed(1) ?? "—"} months · Est. Valuation {fmtNGN(valuation)}
            </p>
          </div>
          <Button onClick={() => toast.success("Investor report downloaded")}>
            <Download className="h-4 w-4 mr-1.5" /> Download Full Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
