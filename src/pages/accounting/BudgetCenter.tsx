import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Wallet, TrendingDown, PiggyBank, Gauge } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { financeApi, type FinBudget } from "@/lib/api";

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

function statusOf(b: FinBudget): { label: string; cls: string } {
  if (b.status === "over_budget") return { label: "Over Budget", cls: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400" };
  if (b.status === "warning") return { label: "Warning", cls: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" };
  return { label: "On Track", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" };
}

export default function BudgetCenter() {
  const [year, setYear] = useState("2026");

  const { data: budgetsRaw, isLoading } = useQuery({
    queryKey: ["fin-budgets", year],
    queryFn: () => financeApi.listBudgets(Number(year)),
    staleTime: 5 * 60_000,
  });
  const budgets = Array.isArray(budgetsRaw) ? budgetsRaw : [];

  const annualBudget = budgets.reduce((s, b) => s + b.ytd_budget, 0);
  const ytdSpend = budgets.reduce((s, b) => s + b.ytd_actual, 0);
  const remaining = annualBudget - ytdSpend;
  const health = annualBudget > 0 ? Math.round((remaining / annualBudget) * 100) : 0;

  const chartData = budgets.slice(0, 8).map((b) => ({
    name: b.category.length > 12 ? b.category.slice(0, 11) + "…" : b.category,
    Budget: b.ytd_budget,
    Actual: b.ytd_actual,
  }));

  return (
    <DashboardLayout title="Budget Management">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Budget Management</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Plan, allocate and track spend against budget</p>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-[110px]" />) : (
            <>
              {[
                { label: "Annual Budget (YTD)", value: fmtNGN(annualBudget), icon: Wallet, tone: "blue" },
                { label: "YTD Spend", value: fmtNGN(ytdSpend), icon: TrendingDown, tone: "rose" },
                { label: "Remaining", value: fmtNGN(remaining), icon: PiggyBank, tone: "emerald" },
                { label: "Budget Health", value: `${health}%`, icon: Gauge, tone: "violet" },
              ].map((k) => {
                const tone: Record<string, string> = {
                  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                };
                return (
                  <div key={k.label} className="rounded-xl border border-border bg-card p-5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${tone[k.tone]}`}>
                      <k.icon className="h-4 w-4" />
                    </div>
                    <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{k.value}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">{k.label}</p>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Budget vs Actual</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">By category · {year}</p>
            </div>
            {isLoading ? <Sk className="h-[300px]" /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Category", "Budget", "Actual", "Variance", "% Used", "Status"].map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {budgets.map((b) => {
                      const st = statusOf(b);
                      return (
                        <tr key={b.category} className="group hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-3 text-[13px] font-medium text-foreground">{b.category}</td>
                          <td className="px-3 py-3 text-[13px] text-right text-foreground">{fmtNGN(b.ytd_budget)}</td>
                          <td className="px-3 py-3 text-[13px] text-right text-foreground">{fmtNGN(b.ytd_actual)}</td>
                          <td className={`px-3 py-3 text-[13px] text-right ${b.variance < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmtNGN(b.variance)}</td>
                          <td className="px-3 py-3 text-[13px] text-right text-muted-foreground">{b.utilization_percent.toFixed(0)}%</td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${st.cls}`}>{st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h3 className="text-[14px] font-semibold text-foreground">Utilization</h3>
              </div>
              <div className="space-y-3">
                {budgets.slice(0, 7).map((b) => {
                  const used = Math.min(120, b.utilization_percent);
                  const over = used >= 100;
                  const warn = used >= 80;
                  return (
                    <div key={b.category}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="text-foreground truncate mr-2">{b.category}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{used.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${over ? "bg-rose-500" : warn ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, used)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4"><h3 className="text-[14px] font-semibold text-foreground">Budget vs Actual Chart</h3></div>
              <div className="h-[240px]">
                {isLoading ? <Sk className="h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 10, fill: "#71717A" }} />
                      <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10, fill: "#71717A" }} />
                      <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v)]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Budget" fill="hsl(234, 89%, 54%)" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="Actual" fill="hsl(160, 84%, 39%)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
