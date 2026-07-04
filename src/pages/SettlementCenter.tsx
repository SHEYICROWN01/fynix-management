import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}
const CHART = { grid: "hsl(var(--border))", axis: "#71717A" };
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12, color: "hsl(var(--foreground))" } as const;

const INSTITUTIONS = ["Heritage Bank", "Palmpay Ltd", "Moniepoint Inc", "Kuda Microfinance", "Carbon MFB", "Branch Intl", "FairMoney MFB", "Opay Digital", "VFD MFB", "Sparkle MFB"];
const BANKS = ["Wema Bank", "Providus Bank", "Sterling Bank", "GTBank", "Zenith Bank"];
const STATUSES = ["Pending", "Successful", "Failed", "Manual Review", "Reversed"] as const;
type SettlementStatus = typeof STATUSES[number];

const fmt = (n: number) => n >= 1e9 ? `₦${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `₦${(n / 1e6).toFixed(2)}M` : `₦${(n / 1e3).toFixed(0)}K`;

const badgeFor = (s: SettlementStatus) => {
  const map: Record<SettlementStatus, string> = {
    Successful: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Failed: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    "Manual Review": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Reversed: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[s]}`}>{s}</span>;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[18px] border border-border bg-card p-5 hover:border-border hover:shadow-md transition-colors ${className}`}>{children}</div>
);
const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-4 flex items-center gap-3 border-l-[3px] border-blue-500 pl-3">
    <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
  </div>
);

const FILTERS = ["All", "Pending", "Failed", "Manual Review", "Reversed"] as const;

export default function SettlementCenter() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");

  const { rows, speed, bankPerf, byBank } = useMemo(() => {
    const rnd = sr(4477);
    const rows = Array.from({ length: 15 }, (_, i) => {
      const status = STATUSES[Math.floor(rnd() * STATUSES.length)];
      return {
        ref: `FYX-2026-${Math.floor(rnd() * 90000 + 10000)}`,
        institution: INSTITUTIONS[Math.floor(rnd() * INSTITUTIONS.length)],
        amount: Math.round(rnd() * 4.2e8 + 5e5),
        bank: BANKS[Math.floor(rnd() * BANKS.length)],
        status,
        retries: status === "Failed" ? Math.floor(rnd() * 4) : 0,
        processor: rnd() > 0.5 ? "NIBSS" : "NIP",
        time: `${Math.floor(rnd() * 58) + 1}m ago`,
      };
    });
    const speed = Array.from({ length: 12 }, (_, h) => ({ hour: `${String(h * 2).padStart(2, "0")}:00`, seconds: Math.round(rnd() * 40 + 8) }));
    const bankPerf = BANKS.map((b, i) => ({ bank: b.replace(" Bank", ""), rate: +(96 + sr(200 + i)() * 3.8).toFixed(1) }));
    const byBank = BANKS.map((b, i) => ({ bank: b, pct: Math.round(60 + sr(300 + i)() * 38) }));
    return { rows, speed, bankPerf, byBank };
  }, []);

  const shown = filter === "All" ? rows : rows.filter((r) => r.status === filter);
  const kpis = [
    { label: "Pending", value: rows.filter((r) => r.status === "Pending").length, color: "text-amber-400" },
    { label: "Successful", value: rows.filter((r) => r.status === "Successful").length, color: "text-emerald-400" },
    { label: "Failed", value: rows.filter((r) => r.status === "Failed").length, color: "text-rose-400" },
    { label: "Manual Review", value: rows.filter((r) => r.status === "Manual Review").length, color: "text-blue-400" },
    { label: "Total Volume", value: "₦4.82B", color: "text-foreground" },
    { label: "Success Rate", value: "99.2%", color: "text-emerald-400" },
  ];

  return (
    <DashboardLayout title="Settlement Center">
      <div className="space-y-5">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settlement Center</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> NIBSS Gateway: LIVE
          </span>
        </div>

        {/* KPI strip */}
        <div className="mb-6 grid grid-cols-2 divide-x divide-border overflow-hidden rounded-[18px] border border-border bg-card md:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="p-4">
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">{k.label}</p>
              <p className={`mt-1 font-mono text-xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Queue */}
        <Card className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionHeader title="Settlement Queue" />
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${filter === f ? "bg-blue-600/15 text-blue-300 border border-blue-500/20" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  {["Reference", "Institution", "Amount", "Destination Bank", "Status", "Retries", "Processor", "Time", "Actions"].map((h) => (
                    <th key={h} className="pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-3 font-mono text-foreground/80">{r.ref}</td>
                    <td className="py-3 font-medium text-foreground/90">{r.institution}</td>
                    <td className="py-3 font-mono text-foreground/80">{fmt(r.amount)}</td>
                    <td className="py-3 text-muted-foreground">{r.bank}</td>
                    <td className="py-3">{badgeFor(r.status)}</td>
                    <td className="py-3 font-mono text-muted-foreground">{r.retries}</td>
                    <td className="py-3 text-muted-foreground">{r.processor}</td>
                    <td className="py-3 text-muted-foreground">{r.time}</td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        <button className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-foreground/80 hover:bg-muted/40"><RefreshCw className="h-3 w-3" />Retry</button>
                        <button className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/20"><CheckCircle2 className="h-3 w-3" />Approve</button>
                        <button className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-500/20"><XCircle className="h-3 w-3" />Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Charts + sidebar */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <SectionHeader title="Settlement Speed (hourly)" />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speed}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: CHART.axis, fontSize: 11 }} interval={2} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}s`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}s`} />
                  <Line type="monotone" dataKey="seconds" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <SectionHeader title="Partner Bank Performance" />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bankPerf}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="bank" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis domain={[90, 100]} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="rate" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <SectionHeader title="By Partner Bank" />
            <div className="space-y-4">
              {byBank.map((b) => (
                <div key={b.bank}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="text-foreground/80">{b.bank}</span>
                    <span className="font-mono text-muted-foreground">{b.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
