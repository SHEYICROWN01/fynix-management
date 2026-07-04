import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Landmark } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { financeApi } from "@/lib/api";

const TOOLTIP = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px", color: "hsl(var(--foreground))", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 },
};

function fmtNGN(n: number | undefined | null): string {
  const v = n ?? 0;
  const neg = n < 0;
  const a = Math.abs(n);
  let s: string;
  if (a >= 1_000_000_000) s = `₦${(a / 1_000_000_000).toFixed(1)}B`;
  else if (a >= 1_000_000) s = `₦${(a / 1_000_000).toFixed(1)}M`;
  else if (a >= 1_000) s = `₦${(a / 1_000).toFixed(0)}K`;
  else s = `₦${a.toLocaleString()}`;
  return neg ? `(${s})` : s;
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

interface Section {
  title: string;
  rows: { label: string; amount: number }[];
}

const STATEMENT_DEMO: Section[] = [
  {
    title: "Operating Activities",
    rows: [
      { label: "Cash from Subscriptions", amount: 2240000 },
      { label: "Cash from SMS Margins", amount: 892000 },
      { label: "Cash from BVN/NIN Verification", amount: 504000 },
      { label: "Cash from Onboarding & Setup", amount: 930000 },
      { label: "Payments to Suppliers (SMS/API)", amount: -530000 },
      { label: "Salaries & Wages", amount: -1540000 },
      { label: "Operating Expenses", amount: -680000 },
    ],
  },
  {
    title: "Investing Activities",
    rows: [
      { label: "Purchase of Equipment", amount: -1660000 },
      { label: "Software & Licenses (capitalized)", amount: -220000 },
    ],
  },
  {
    title: "Financing Activities",
    rows: [
      { label: "Capital Injection (Founders)", amount: 2000000 },
      { label: "Loan Repayment", amount: -350000 },
    ],
  },
];

function SectionRow({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);
  const total = section.rows.reduce((s, r) => s + r.amount, 0);
  return (
    <>
      <tr className="border-b border-border bg-muted/30">
        <td colSpan={2} className="px-4 py-2.5">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {section.title}
          </button>
        </td>
        <td className="px-4 py-2.5 text-right text-[13px] font-bold text-foreground">{fmtNGN(total)}</td>
      </tr>
      {open && section.rows.map((r) => (
        <tr key={r.label} className="border-b border-border hover:bg-muted/20">
          <td className="px-4 py-2.5 pl-10 text-[13px] text-muted-foreground" colSpan={2}>{r.label}</td>
          <td className={`px-4 py-2.5 text-right text-[13px] ${r.amount < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>{fmtNGN(r.amount)}</td>
        </tr>
      ))}
    </>
  );
}

export default function CashFlowCenter() {
  const [period, setPeriod] = useState("month");

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["fin-cashflow-summary", period],
    queryFn: () => financeApi.getCashFlowSummary(period),
    staleTime: 5 * 60_000,
  });
  const { data: trend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ["fin-cashflow-trend"],
    queryFn: () => financeApi.getCashFlowTrend(),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 5 * 60_000,
  });

  const netTotal = STATEMENT_DEMO.reduce((s, sec) => s + sec.rows.reduce((a, r) => a + r.amount, 0), 0);

  const toneMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  const kpis = [
    { label: "Opening Balance", value: fmtNGN(summary?.opening_balance ?? 0), icon: Landmark, tone: "blue" },
    { label: "Cash In", value: fmtNGN(summary?.cash_in ?? 0), icon: ArrowDownCircle, tone: "emerald" },
    { label: "Cash Out", value: fmtNGN(summary?.cash_out ?? 0), icon: ArrowUpCircle, tone: "rose" },
    { label: "Net Cash Flow", value: fmtNGN(summary?.net_cash_flow ?? 0), icon: TrendingUp, tone: "violet" },
    { label: "Closing Balance", value: fmtNGN(summary?.closing_balance ?? 0), icon: Wallet, tone: "amber" },
  ];

  return (
    <DashboardLayout title="Cash Flow Center">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cash Flow Center</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Monitor liquidity, movement and forecasts</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5">
              {loadingSummary ? <Sk className="h-[70px]" /> : (
                <>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${toneMap[k.tone]}`}>
                    <k.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[20px] font-bold tracking-tight text-foreground leading-none">{k.value}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{k.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Cash Flow Timeline</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Cash in vs cash out</p>
            </div>
            <div className="h-[280px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="cf-in" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cf-out" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717A" }} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v)]} />
                    <Area type="monotone" dataKey="cash_in" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fill="url(#cf-in)" name="Cash In" />
                    <Area type="monotone" dataKey="cash_out" stroke="hsl(0, 84%, 60%)" strokeWidth={2} fill="url(#cf-out)" name="Cash Out" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Monthly Net Cash Flow</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Net movement per month</p>
            </div>
            <div className="h-[280px]">
              {loadingTrend ? <Sk className="h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717A" }} />
                    <YAxis tickFormatter={(v) => fmtNGN(v as number)} tick={{ fontSize: 12, fill: "#71717A" }} />
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "Net"]} />
                    <Bar dataKey="net" fill="hsl(234, 89%, 54%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Cash Flow Statement</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Operating, investing & financing activities</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" colSpan={2}>Activity</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {STATEMENT_DEMO.map((s) => <SectionRow key={s.title} section={s} />)}
                <tr className="bg-muted/40">
                  <td colSpan={2} className="px-4 py-3 text-[13px] font-bold text-foreground">Net Change in Cash</td>
                  <td className={`px-4 py-3 text-right text-[13px] font-bold ${netTotal < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmtNGN(netTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Running balance table from trend data */}
        {trend.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Monthly Cash Balance</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Running balance from trend data</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Month", "Cash In", "Cash Out", "Net", "Balance"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trend.slice(-6).map((t) => (
                    <tr key={t.month} className="hover:bg-muted/30">
                      <td className="px-3 py-3 text-[13px] font-medium text-foreground">{t.month}</td>
                      <td className="px-3 py-3 text-[13px] text-right text-emerald-600 dark:text-emerald-400">{fmtNGN(t.cash_in)}</td>
                      <td className="px-3 py-3 text-[13px] text-right text-rose-600 dark:text-rose-400">{fmtNGN(t.cash_out)}</td>
                      <td className="px-3 py-3 text-[13px] text-right text-foreground">{fmtNGN(t.net)}</td>
                      <td className="px-3 py-3 text-[13px] text-right font-medium text-foreground">{fmtNGN(t.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
