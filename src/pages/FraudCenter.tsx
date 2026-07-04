import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ShieldAlert, Ban, ScanEye, Gauge, Snowflake, ArrowUpRight, CheckCircle2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}
const CHART = { grid: "hsl(var(--border))", axis: "#71717A" };
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12, color: "hsl(var(--foreground))" } as const;
const INSTITUTIONS = ["Heritage Bank", "Palmpay Ltd", "Moniepoint Inc", "Kuda Microfinance", "Carbon MFB", "Opay Digital", "FairMoney MFB"];
const fmt = (n: number) => n >= 1e6 ? `₦${(n / 1e6).toFixed(2)}M` : `₦${(n / 1e3).toFixed(0)}K`;

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[18px] border border-border bg-card p-5 hover:border-border hover:shadow-md transition-colors ${className}`}>{children}</div>
);
const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-4 flex items-center gap-3 border-l-[3px] border-blue-500 pl-3">
    <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
  </div>
);

export default function FraudCenter() {
  const { riskTrend, fraudTypes, cases, blocked } = useMemo(() => {
    const rnd = sr(3321);
    const riskTrend = Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`, score: Math.round(rnd() * 30 + 35) }));
    const fraudTypes = [
      { type: "Velocity Attack", count: Math.round(rnd() * 40 + 25) },
      { type: "Account Takeover", count: Math.round(rnd() * 30 + 18) },
      { type: "Synthetic Identity", count: Math.round(rnd() * 24 + 12) },
      { type: "AML", count: Math.round(rnd() * 20 + 15) },
      { type: "Chargebacks", count: Math.round(rnd() * 16 + 8) },
    ];
    const levels = ["CRITICAL", "HIGH", "MEDIUM"] as const;
    const types = ["Velocity Attack", "Account Takeover", "AML Flag", "Suspicious Transfer"];
    const investigators = ["A. Okafor", "T. Balogun", "N. Eze", "S. Adeyemi"];
    const cases = Array.from({ length: 5 }, (_, i) => ({
      ref: `FRD-${Math.floor(rnd() * 9000 + 1000)}`,
      institution: INSTITUTIONS[Math.floor(rnd() * INSTITUTIONS.length)],
      level: levels[Math.floor(rnd() * levels.length)],
      type: types[Math.floor(rnd() * types.length)],
      investigator: investigators[i % investigators.length],
      status: rnd() > 0.5 ? "In Review" : "Escalated",
    }));
    const blocked = Array.from({ length: 6 }, () => ({
      ref: `FYX-2026-${Math.floor(rnd() * 90000 + 10000)}`,
      institution: INSTITUTIONS[Math.floor(rnd() * INSTITUTIONS.length)],
      amount: Math.round(rnd() * 8e6 + 1e5),
      reason: types[Math.floor(rnd() * types.length)],
      time: `${Math.floor(rnd() * 58) + 1}m ago`,
    }));
    return { riskTrend, fraudTypes, cases, blocked };
  }, []);

  const summary = [
    { label: "Active Investigations", value: "17", icon: ScanEye, cls: "bg-rose-500/10 text-rose-400" },
    { label: "Blocked Transactions", value: "142", icon: Ban, cls: "bg-amber-500/10 text-amber-400" },
    { label: "AML Alerts", value: "38", icon: ShieldAlert, cls: "bg-violet-500/10 text-violet-400" },
    { label: "Risk Score Avg", value: "42.6", icon: Gauge, cls: "bg-blue-500/10 text-blue-400" },
  ];

  const levelCls: Record<string, string> = {
    CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    HIGH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    MEDIUM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <DashboardLayout title="Fraud Center">
      <div className="space-y-5">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Fraud Center</h1>
          <span className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" /> AI MONITORING: ACTIVE
          </span>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.cls}`}><s.icon className="h-5 w-5" /></div>
              <p className="mt-4 text-[11px] uppercase tracking-widest font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <SectionHeader title="ML Risk Score (7d)" />
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskTrend}>
                    <defs>
                      <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                    <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#gRisk)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <SectionHeader title="Fraud Type Breakdown" />
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fraudTypes} layout="vertical">
                    <CartesianGrid stroke={CHART.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="type" width={130} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="count" fill="#F43F5E" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <SectionHeader title="Active Fraud Cases" />
            <div className="space-y-3">
              {cases.map((c) => (
                <div key={c.ref} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] text-foreground/80">{c.ref}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelCls[c.level]}`}>{c.level}</span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-foreground/90">{c.institution}</p>
                  <p className="text-[11px] text-muted-foreground">{c.type} · {c.investigator} · {c.status}</p>
                  <div className="mt-2 flex gap-1.5">
                    <button className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-500/20"><Snowflake className="h-3 w-3" />Freeze</button>
                    <button className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-400 hover:bg-amber-500/20"><ArrowUpRight className="h-3 w-3" />Escalate</button>
                    <button className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/20"><CheckCircle2 className="h-3 w-3" />Safe</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <SectionHeader title="Recent Blocked Transactions" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  {["Reference", "Institution", "Amount", "Reason", "Time"].map((h) => <th key={h} className="pb-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {blocked.map((b, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-3 font-mono text-foreground/80">{b.ref}</td>
                    <td className="py-3 font-medium text-foreground/90">{b.institution}</td>
                    <td className="py-3 font-mono text-foreground/80">{fmt(b.amount)}</td>
                    <td className="py-3 text-muted-foreground">{b.reason}</td>
                    <td className="py-3 text-muted-foreground">{b.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
