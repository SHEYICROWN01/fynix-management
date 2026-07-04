import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { financeApi } from "@/lib/api";
import { ArrowUp, ArrowDown, DollarSign, TrendingUp, Repeat, Coins } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

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

function Sparkbar({ trend }: { trend: number }) {
  const bars = [40, 55, 48, 62, 70, 65, 78];
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((h, i) => (
        <span key={i} className={`w-1.5 rounded-sm ${trend >= 0 ? "bg-emerald-500/60" : "bg-rose-500/60"}`} style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export default function RevenueCenter() {
  const [tab, setTab] = useState("overview");

  const { data: summary, isLoading: loadingSummary } = useQuery({
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
  const { data: sources = [], isLoading: loadingSources } = useQuery({
    queryKey: ["fin-revenue-sources"],
    queryFn: () => financeApi.listRevenueSources(),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 5 * 60_000,
  });
  const { data: entriesPage, isLoading: loadingEntries } = useQuery({
    queryKey: ["fin-revenue-entries"],
    queryFn: () => financeApi.listRevenueEntries({ page: 1 }),
    staleTime: 2 * 60_000,
  });

  const entries = entriesPage?.data ?? [];
  const activeSources = sources.filter((s) => s.status === "active");
  const totalMtd = summary?.month.revenue ?? 0;

  return (
    <DashboardLayout title="Revenue Management">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Revenue Management</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Track active streams, upcoming products, and transactions</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active Streams</TabsTrigger>
            <TabsTrigger value="coming">Coming Soon</TabsTrigger>
            <TabsTrigger value="txns">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {loadingSummary ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-[110px]" />) : (
                <>
                  {[
                    { label: "Total Revenue MTD", value: fmtNGN(totalMtd), icon: DollarSign, sub: `Gross margin ${summary?.gross_margin_percent?.toFixed(1) ?? "—"}%` },
                    { label: "Monthly Recurring", value: fmtNGN(summary?.mrr ?? 0), icon: Repeat, sub: "MRR" },
                    { label: "Projected ARR", value: fmtNGN(summary?.arr ?? 0), icon: Coins, sub: "Annualized" },
                    { label: "YTD Revenue", value: fmtNGN(summary?.year.revenue ?? 0), icon: TrendingUp, sub: "Jan – present" },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                          <k.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{k.value}</p>
                      <p className="text-[12px] text-muted-foreground mt-1">{k.label}</p>
                      <p className="text-[11px] mt-1 font-medium text-emerald-600 dark:text-emerald-400">{k.sub}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h3 className="text-[14px] font-semibold text-foreground">Revenue Trend</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Last 12 months</p>
              </div>
              <div className="h-[300px]">
                {loadingTrend ? <Sk className="h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="rc-rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#71717A" }} />
                      <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                      <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "Revenue"]} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(234, 89%, 54%)" strokeWidth={2} fill="url(#rc-rev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h3 className="text-[14px] font-semibold text-foreground">Revenue Breakdown by Source</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Sorted by MTD amount</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MTD Amount</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">% of Total</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bySource.map((c) => (
                      <tr key={c.source_id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-[13px] font-medium text-foreground">{c.source_name}</td>
                        <td className="px-4 py-3 text-[13px] text-right text-foreground">{fmtNGN(c.amount)}</td>
                        <td className="px-4 py-3 text-[13px] text-right text-muted-foreground">{c.percent.toFixed(1)}%</td>
                        <td className={`px-4 py-3 text-[13px] text-right font-medium ${c.trend_percent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {c.trend_percent >= 0 ? "+" : ""}{c.trend_percent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {loadingSources ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-[120px]" />)}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSources.map((s) => (
                  <div key={s.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-[13px] font-semibold text-foreground">{s.name}</h3>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                    <p className="text-[22px] font-bold tracking-tight text-foreground leading-none">{fmtNGN(s.mtd_revenue)}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-muted-foreground font-mono">{s.gl_account_code}</span>
                      <Sparkbar trend={s.mtd_revenue > 0 ? 1 : 0} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="coming" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sources.filter((s) => s.status === "coming_soon").map((s) => (
                <div key={s.id} className="rounded-xl border border-dashed border-border bg-card/50 p-5 opacity-80">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-muted-foreground">{s.name}</h3>
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">Coming Soon</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground">{s.description}</p>
                  <p className="text-[11px] font-mono text-muted-foreground/60 mt-2">{s.gl_account_code}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="txns" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h3 className="text-[14px] font-semibold text-foreground">Recent Transactions</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Latest revenue events</p>
              </div>
              {loadingEntries ? <Sk className="h-[300px]" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Date", "Source", "Institution", "Amount", "Type", "Reference", "Status"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {entries.map((t) => (
                        <tr key={t.id} className="group hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.payment_date}</td>
                          <td className="px-4 py-3 text-[13px] font-medium text-foreground">{t.source_name}</td>
                          <td className="px-4 py-3 text-[13px] text-foreground">{t.institution_name}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-foreground">{fmtNGN(t.amount)}</td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground capitalize">{t.post_type}</td>
                          <td className="px-4 py-3 text-[12px] text-muted-foreground font-mono">{t.reference}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                              t.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}>{t.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
