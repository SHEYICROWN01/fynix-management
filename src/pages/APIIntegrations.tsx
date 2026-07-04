import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Eye, Zap } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}
const CHART = { grid: "hsl(var(--border))", axis: "#71717A" };
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12, color: "hsl(var(--foreground))" } as const;

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[18px] border border-border bg-card p-5 hover:border-border hover:shadow-md transition-colors ${className}`}>{children}</div>
);
const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-4 flex items-center gap-3 border-l-[3px] border-blue-500 pl-3">
    <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
  </div>
);

const PROVIDERS = [
  { name: "Wema Bank", short: "WB", color: "#7C3AED" },
  { name: "Providus Bank", short: "PB", color: "#2563EB" },
  { name: "NIBSS", short: "NB", color: "#10B981" },
  { name: "Termii", short: "TM", color: "#F59E0B" },
  { name: "Kuda MFB", short: "KU", color: "#8B5CF6" },
  { name: "Paystack", short: "PS", color: "#06B6D4" },
  { name: "Flutterwave", short: "FW", color: "#F97316" },
  { name: "Smile Identity", short: "SI", color: "#F43F5E" },
];

export default function APIIntegrations() {
  const { cards, volume } = useMemo(() => {
    const cards = PROVIDERS.map((p, i) => {
      const r = sr(700 + i * 9);
      const health = r();
      const state = health > 0.82 ? "green" : health > 0.55 ? "amber" : "red";
      return {
        ...p,
        state,
        uptime: (99 + r()).toFixed(2),
        latency: Math.round(r() * 60 + 8),
        calls: Math.round(r() * 900_000 + 120_000),
        errorRate: +(r() * 2.4).toFixed(2),
        spark: Array.from({ length: 7 }, (_, j) => ({ i: j, v: Math.round(sr(700 + i * 9 + j)() * 80 + 20) })),
      };
    });
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const volume = days.map((d, di) => {
      const row: Record<string, number | string> = { day: d };
      PROVIDERS.slice(0, 4).forEach((p, pi) => { row[p.short] = Math.round(sr(50 + di * 4 + pi)() * 400 + 100); });
      return row;
    });
    return { cards, volume };
  }, []);

  return (
    <DashboardLayout title="API Integration Center">
      <div className="space-y-5">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">API Integration Center</h1>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> 8 PARTNERS CONNECTED
          </span>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const dot = c.state === "green" ? "bg-emerald-400" : c.state === "amber" ? "bg-amber-400" : "bg-rose-400";
            const label = c.state === "green" ? "OPERATIONAL" : c.state === "amber" ? "DEGRADED" : "DOWN";
            const labelCls = c.state === "green" ? "text-emerald-400" : c.state === "amber" ? "text-amber-400" : "text-rose-400";
            return (
              <Card key={c.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-bold text-white" style={{ background: c.color }}>{c.short}</div>
                    <span className="text-[13px] font-semibold text-foreground">{c.name}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${labelCls}`}>{label}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Uptime</p><p className="font-mono text-[13px] text-foreground/90">{c.uptime}%</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</p><p className="font-mono text-[13px] text-foreground/90">{c.latency}ms</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Calls</p><p className="font-mono text-[13px] text-foreground/90">{(c.calls / 1000).toFixed(0)}K</p></div>
                </div>
                <div className="mt-3 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={c.spark}>
                      <Line type="monotone" dataKey="v" stroke={c.color} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">Error Rate</span><span className="font-mono text-muted-foreground">{c.errorRate}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(c.errorRate * 25, 100)}%` }} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] text-foreground/80 hover:bg-muted/40"><Eye className="h-3 w-3" />Logs</button>
                  <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1.5 text-[11px] text-blue-400 hover:bg-blue-500/20"><Zap className="h-3 w-3" />Test</button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <SectionHeader title="API Call Volume (7d)" />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}K`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                {PROVIDERS.slice(0, 4).map((p) => (
                  <Bar key={p.short} dataKey={p.short} fill={p.color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
