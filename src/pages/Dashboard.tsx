import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Landmark, ArrowDownRight, ArrowUpRight, ShieldCheck, Coins, Building2,
  AlertTriangle, Snowflake, Gauge, ShieldAlert, Clock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Seeded random ────────────────────────────────────────────────────────────
function sr(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}

const CHART = { grid: "hsl(var(--border))", axis: "#71717A" };
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12, color: "hsl(var(--foreground))" } as const;

const INSTITUTIONS = [
  "Heritage Bank", "Palmpay Ltd", "Moniepoint Inc", "Kuda Microfinance",
  "Carbon MFB", "Branch Intl", "FairMoney MFB", "Opay Digital", "VFD MFB", "Sparkle MFB",
];

const fmtNaira = (n: number) => {
  if (n >= 1e9) return `₦${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `₦${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `₦${(n / 1e3).toFixed(1)}K`;
  return `₦${n.toFixed(0)}`;
};

// ── Mock data generators ─────────────────────────────────────────────────────
function useMockData() {
  return useMemo(() => {
    const rnd = sr(88_442);

    const hourly = Array.from({ length: 24 }, (_, h) => {
      const base = Math.sin((h - 6) / 24 * Math.PI * 2) * 0.5 + 0.6;
      const wave = Math.max(0.15, base + rnd() * 0.25);
      return {
        hour: `${String(h).padStart(2, "0")}:00`,
        credits: Math.round(wave * 620_000_000 + rnd() * 90_000_000),
        debits: Math.round(wave * 510_000_000 + rnd() * 70_000_000),
      };
    });

    const revenueBreakdown = [
      { name: "Subscriptions", value: 820_000, color: "#2563EB" },
      { name: "SMS", value: 460_000, color: "#10B981" },
      { name: "Identity", value: 390_000, color: "#8B5CF6" },
      { name: "API Fees", value: 340_000, color: "#F59E0B" },
      { name: "Transaction Fees", value: 390_000, color: "#F43F5E" },
    ];

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const settlement = days.map((d) => {
      const settled = Math.round(1200 + rnd() * 900);
      return {
        day: d,
        settled,
        pending: Math.round(rnd() * 90 + 20),
        failed: Math.round(rnd() * 40 + 5),
      };
    });

    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    let count = 118;
    const growth = months.map((m) => {
      count += Math.round(rnd() * 18 + 6);
      return { month: m, institutions: count };
    });

    const sparkFor = (seed: number) =>
      Array.from({ length: 7 }, (_, i) => ({ i, v: Math.round(sr(seed + i * 13)() * 100 + 20) }));

    const eventTypes = [
      { type: "settlement_completed", color: "#10B981", label: "Settlement completed" },
      { type: "fraud_alert", color: "#F43F5E", label: "Fraud alert triggered" },
      { type: "vault_funded", color: "#2563EB", label: "Vault funded" },
      { type: "institution_onboarded", color: "#8B5CF6", label: "Institution onboarded" },
      { type: "api_failure", color: "#F59E0B", label: "API failure detected" },
      { type: "account_frozen", color: "#F43F5E", label: "Account frozen" },
      { type: "sms_exhausted", color: "#F59E0B", label: "SMS balance exhausted" },
      { type: "large_transaction", color: "#F59E0B", label: "Large transaction flagged" },
    ];
    const feed = Array.from({ length: 12 }, (_, i) => {
      const ev = eventTypes[i % eventTypes.length];
      return {
        id: i,
        color: ev.color,
        label: ev.label,
        institution: INSTITUTIONS[Math.floor(rnd() * INSTITUTIONS.length)],
        time: `${Math.floor(rnd() * 58) + 1}m ago`,
      };
    });

    const fraudAlerts = [
      { severity: "CRITICAL", institution: "Opay Digital", type: "Velocity Attack", amount: 42_800_000, time: "3m ago" },
      { severity: "HIGH", institution: "Moniepoint Inc", type: "AML Flag", amount: 18_400_000, time: "11m ago" },
      { severity: "HIGH", institution: "Palmpay Ltd", type: "Suspicious Transfer", amount: 9_250_000, time: "24m ago" },
      { severity: "MEDIUM", institution: "Carbon MFB", type: "Multiple Login", amount: 1_120_000, time: "38m ago" },
    ];

    const topInstitutions = INSTITUTIONS.slice(0, 6).map((name, i) => {
      const r = sr(1000 + i * 7);
      const statuses = ["active", "active", "warning", "active", "active", "danger"] as const;
      const risks = ["Low", "Low", "Medium", "Low", "High", "Medium"] as const;
      return {
        name,
        vault: Math.round(r() * 8e9 + 1.2e9),
        volume: Math.round(r() * 2.4e9 + 3e8),
        status: statuses[i],
        risk: risks[i],
      };
    });

    const apis = [
      "Wema", "Providus", "NIBSS", "Termii", "Kuda", "Paystack", "Flutterwave", "Smile Identity",
    ].map((name, i) => {
      const r = sr(500 + i * 11);
      const health = r();
      const state = health > 0.85 ? "green" : health > 0.6 ? "amber" : "red";
      return {
        name,
        state,
        uptime: (99 + r()).toFixed(2),
        latency: Math.round(r() * 60 + 8),
      };
    });

    return { hourly, revenueBreakdown, settlement, growth, feed, fraudAlerts, topInstitutions, apis, sparkFor };
  }, []);
}

// ── Small components ─────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: { i: number; v: number }[]; color: string }) {
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  icon: typeof Landmark;
  iconColor: string;
  sub?: string;
  subColor?: string;
  spark?: { i: number; v: number }[];
  sparkColor?: string;
}
function KpiCard({ label, value, icon: Icon, iconColor, sub, subColor, spark, sparkColor }: KpiProps) {
  return (
    <div className="rounded-[18px] border border-border bg-card p-5 hover:border-border hover:shadow-md transition-colors">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-widest font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className={`mt-0.5 text-[11px] ${subColor ?? "text-muted-foreground"}`}>{sub}</p>}
      {spark && (
        <div className="mt-3">
          <Sparkline data={spark} color={sparkColor ?? "#2563EB"} />
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3 border-l-[3px] border-blue-500 pl-3">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
      </div>
      {right}
    </div>
  );
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[18px] border border-border bg-card p-5 hover:border-border hover:shadow-md transition-colors ${className}`}>
    {children}
  </div>
);

function statusBadge(status: "active" | "warning" | "danger") {
  const map = {
    active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  };
  const label = { active: "Active", warning: "Review", danger: "Frozen" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[status]}`}>{label[status]}</span>
  );
}

function riskBadge(risk: string) {
  const map: Record<string, string> = {
    Low: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    High: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[risk]}`}>{risk}</span>;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const data = useMockData();
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = clock.toLocaleTimeString("en-GB", { hour12: false });
  const dateStr = clock.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const securityChips = [
    { label: "SECURE SESSION", color: "text-emerald-400" },
    { label: "AML: LIVE", color: "text-blue-400" },
    { label: "CBN REGULATED", color: "text-foreground/80" },
    { label: "NDIC INSURED", color: "text-foreground/80" },
    { label: "2FA REQUIRED", color: "text-amber-400" },
  ];

  return (
    <DashboardLayout title="Banking Operations Center">
      <div className="space-y-5">
        {/* Security bar */}
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-background px-4 py-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          {securityChips.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${c.color.replace("text-", "bg-")}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${c.color}`}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Banking Operations Center</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="font-mono text-lg font-bold tabular-nums text-foreground">{timeStr}</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">WAT</span>
          </div>
        </div>

        {/* Row 1: 5 KPIs */}
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard label="Total Vault Balance" value="₦48.3B" icon={Landmark} iconColor="bg-blue-500/10 text-blue-400"
            sub="across 247 institutions" spark={data.sparkFor(1)} sparkColor="#2563EB" />
          <KpiCard label="Today's Credits" value="₦12.4B" icon={ArrowUpRight} iconColor="bg-emerald-500/10 text-emerald-400"
            sub="▲ 18.2% vs yesterday" subColor="text-emerald-400" spark={data.sparkFor(2)} sparkColor="#10B981" />
          <KpiCard label="Today's Debits" value="₦9.8B" icon={ArrowDownRight} iconColor="bg-rose-500/10 text-rose-400"
            sub="▲ 11.4% vs yesterday" subColor="text-rose-400" spark={data.sparkFor(3)} sparkColor="#F43F5E" />
          <KpiCard label="Settlement Success" value="99.2%" icon={ShieldCheck} iconColor="bg-emerald-500/10 text-emerald-400"
            sub="4 pending review" subColor="text-amber-400" spark={data.sparkFor(4)} sparkColor="#10B981" />
          <KpiCard label="Revenue Today" value="₦2.4M" icon={Coins} iconColor="bg-violet-500/10 text-violet-400"
            sub="▲ 22.1% vs yesterday" subColor="text-emerald-400" spark={data.sparkFor(5)} sparkColor="#8B5CF6" />
        </div>

        {/* Row 2: 4 KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard label="Active Institutions" value="187/247" icon={Building2} iconColor="bg-blue-500/10 text-blue-400"
            sub="75.7% online" subColor="text-blue-400" />
          <KpiCard label="Failed Transactions" value="23" icon={AlertTriangle} iconColor="bg-rose-500/10 text-rose-400"
            sub="requires attention" subColor="text-rose-400" />
          <KpiCard label="Frozen Accounts" value="4" icon={Snowflake} iconColor="bg-amber-500/10 text-amber-400"
            sub="under review" subColor="text-amber-400" />
          <KpiCard label="Platform Uptime" value="99.97%" icon={Gauge} iconColor="bg-emerald-500/10 text-emerald-400"
            sub="SLA: 99.9%" subColor="text-emerald-400" />
        </div>

        {/* Row 3: Hourly Volume + Revenue Breakdown */}
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionHeader title="Hourly Transaction Volume" right={
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Credits</span>
                <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-rose-400" /> Debits</span>
              </div>
            } />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourly}>
                  <defs>
                    <linearGradient id="gCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDebits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: CHART.axis, fontSize: 11 }} interval={3} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtNaira(v)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtNaira(v)} labelStyle={{ color: "#71717A" }} />
                  <Area type="monotone" dataKey="credits" stroke="#10B981" strokeWidth={2} fill="url(#gCredits)" name="Credits" />
                  <Area type="monotone" dataKey="debits" stroke="#F43F5E" strokeWidth={2} fill="url(#gDebits)" name="Debits" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Revenue Breakdown" />
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.revenueBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {data.revenueBreakdown.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtNaira(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {data.revenueBreakdown.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />{r.name}
                  </span>
                  <span className="font-mono text-foreground/90">{fmtNaira(r.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 4: Settlement Status + Institution Growth */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Settlement Status (7d)" />
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.settlement}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="settled" stackId="s" fill="#10B981" name="Settled" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" stackId="s" fill="#F59E0B" name="Pending" />
                  <Bar dataKey="failed" stackId="s" fill="#F43F5E" name="Failed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Institution Growth (12mo)" />
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.growth}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="institutions" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3, fill: "#8B5CF6" }} name="Institutions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Row 5: Live Activity + Fraud Alerts */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Live Activity Feed" right={
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> LIVE
              </span>
            } />
            <div className="space-y-3">
              {data.feed.map((f) => (
                <div key={f.id} className="flex items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: f.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-foreground/80">{f.label}</p>
                    <p className="text-[11px] text-muted-foreground">{f.institution}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{f.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Fraud Alerts" right={
              <span className="flex items-center gap-1.5 text-[11px] text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" /> {data.fraudAlerts.length} active
              </span>
            } />
            <div className="space-y-3">
              {data.fraudAlerts.map((a, i) => {
                const sevColor = a.severity === "CRITICAL"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : a.severity === "HIGH"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20";
                return (
                  <div key={i} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${sevColor}`}>{a.severity}</span>
                      <span className="text-[11px] text-muted-foreground">{a.time}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-foreground/90">{a.institution}</p>
                        <p className="text-[11px] text-muted-foreground">{a.type} · <span className="font-mono text-muted-foreground">{fmtNaira(a.amount)}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:bg-muted/40">Review</button>
                        <button className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/20">Freeze</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Row 6: Top Institutions + API Health */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionHeader title="Top Institutions" />
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                    <th className="pb-3 font-medium">Institution</th>
                    <th className="pb-3 font-medium">Vault Balance</th>
                    <th className="pb-3 font-medium">Today's Volume</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Risk</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topInstitutions.map((inst) => (
                    <tr key={inst.name} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="py-3 font-medium text-foreground/90">{inst.name}</td>
                      <td className="py-3 font-mono text-foreground/80">{fmtNaira(inst.vault)}</td>
                      <td className="py-3 font-mono text-foreground/80">{fmtNaira(inst.volume)}</td>
                      <td className="py-3">{statusBadge(inst.status)}</td>
                      <td className="py-3">{riskBadge(inst.risk)}</td>
                      <td className="py-3 text-right">
                        <button className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:bg-muted/40">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionHeader title="API Health" />
            <div className="grid grid-cols-2 gap-3">
              {data.apis.map((api) => {
                const dot = api.state === "green" ? "bg-emerald-400" : api.state === "amber" ? "bg-amber-400" : "bg-rose-400";
                return (
                  <div key={api.name} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[12px] font-medium text-foreground/90">{api.name}</span>
                      <span className={`h-2 w-2 rounded-full ${dot}`} />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{api.uptime}% uptime</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{api.latency}ms latency</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
