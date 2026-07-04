import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Search, ShieldCheck, X, Fingerprint, IdCard } from "lucide-react";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const INSTITUTIONS = [
  "Heritage Bank",
  "Palmpay Ltd",
  "Moniepoint Inc",
  "Kuda MFB",
  "Carbon MFB",
  "FairMoney MFB",
  "Opay Digital",
  "VFD MFB",
  "Sparkle MFB",
  "Branch Intl",
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 10,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};
const PIE_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

function statusBadge(ok: boolean) {
  return ok
    ? "rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
    : "rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400";
}
function typeBadge(t: string) {
  return t === "BVN"
    ? "rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
    : "rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400";
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function BVNNINServices() {
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [showBvn, setShowBvn] = useState(false);
  const [showNin, setShowNin] = useState(false);

  const daily = useMemo(() => {
    const r = sr(2201);
    return Array.from({ length: 14 }).map((_, i) => ({
      day: `D${i + 1}`,
      BVN: Math.floor(r() * 1400) + 800,
      NIN: Math.floor(r() * 1000) + 500,
    }));
  }, []);

  const successFailed = useMemo(() => {
    const r = sr(9931);
    return Array.from({ length: 7 }).map((_, i) => ({
      day: `D${i + 1}`,
      Success: Math.floor(r() * 2500) + 1500,
      Failed: Math.floor(r() * 90) + 10,
    }));
  }, []);

  const revenue = useMemo(
    () => [
      { name: "BVN", value: 112050 },
      { name: "NIN", value: 80300 },
      { name: "Face Match", value: 34200 },
      { name: "Address Verify", value: 18500 },
    ],
    []
  );

  const verifications = useMemo(() => {
    const r = sr(5540);
    return Array.from({ length: 15 }).map(() => {
      const type = r() > 0.5 ? "BVN" : "NIN";
      const ok = r() > 0.05;
      return {
        ref: `VF${Math.floor(r() * 900000 + 100000)}`,
        type,
        institution: INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)],
        ok,
        score: (r() * 6 + 94).toFixed(1),
        rt: `${Math.floor(r() * 400 + 120)}ms`,
        ts: `${Math.floor(r() * 59) + 1}m ago`,
      };
    });
  }, []);

  const kpis = [
    { label: "VERIFICATIONS TODAY", value: "3,847", note: "▲ 12.4%", noteClass: "text-emerald-500" },
    { label: "BVN CHECKS", value: "2,241", note: "58.3%", noteClass: "text-muted-foreground" },
    { label: "NIN CHECKS", value: "1,606", note: "41.7%", noteClass: "text-muted-foreground" },
    { label: "SUCCESS RATE", value: "97.8%", note: "healthy", noteClass: "text-emerald-500" },
    { label: "FAILED / ERRORS", value: "84", note: "needs review", noteClass: "text-rose-500" },
    { label: "REVENUE TODAY", value: "₦192,350", note: "₦50 per check", noteClass: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout title="BVN / NIN Identity Services">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">BVN / NIN Identity Services</h1>
            <p className="text-sm text-muted-foreground">Identity verification service management and lookup</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Revenue Today: ₦192,350
          </span>
        </div>

        {/* KPI strip */}
        <div className="rounded-[18px] border border-border bg-card">
          <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6 lg:divide-x">
            {kpis.map((k) => (
              <div key={k.label} className="p-5">
                <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">{k.label}</p>
                <p className="font-mono text-2xl font-bold text-foreground">{k.value}</p>
                <p className={`text-[11px] ${k.noteClass}`}>{k.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lookup panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* BVN */}
          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-emerald-500" />
                <h2 className="text-sm font-semibold text-foreground">BVN Verification</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                NIBSS
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter BVN (11 digits)"
                value={bvn}
                maxLength={11}
                onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              />
              <Button onClick={() => setShowBvn(true)} disabled={bvn.length !== 11}>
                <Search className="mr-2 h-4 w-4" /> Verify
              </Button>
            </div>
            {showBvn && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-semibold">BVN VERIFIED</span>
                </div>
                <ResultRow label="Name" value="Adeyemi Oluwaseun" />
                <ResultRow label="DOB" value="14/03/1989" />
                <ResultRow label="Phone" value="080****4521" />
                <ResultRow label="Gender" value="Male" />
                <ResultRow label="LGA" value="Ikeja, Lagos" />
                <ResultRow label="Enrollment Bank" value="GTBank" />
                <ResultRow label="Match Score" value="98.4%" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setShowBvn(false);
                    setBvn("");
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            )}
          </div>

          {/* NIN */}
          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-blue-500" />
                <h2 className="text-sm font-semibold text-foreground">NIN Verification</h2>
              </div>
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                NIMC
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter NIN (11 digits)"
                value={nin}
                maxLength={11}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
              />
              <Button onClick={() => setShowNin(true)} disabled={nin.length !== 11}>
                <Search className="mr-2 h-4 w-4" /> Verify
              </Button>
            </div>
            {showNin && (
              <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-semibold">NIN VERIFIED</span>
                </div>
                <ResultRow label="Full Name" value="Chukwuemeka Obi" />
                <ResultRow label="DOB" value="22/07/1992" />
                <ResultRow label="Gender" value="Male" />
                <ResultRow label="LGA" value="Enugu North" />
                <ResultRow label="State" value="Enugu" />
                <ResultRow label="Nationality" value="Nigerian" />
                <ResultRow label="Match Score" value="96.1%" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setShowNin(false);
                    setNin("");
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Daily Verifications</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="bvnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ninGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="BVN" stroke="#10B981" fill="url(#bvnGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="NIN" stroke="#3B82F6" fill="url(#ninGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Success vs Failed</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={successFailed}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="Success" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Failed" stackId="a" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Revenue by Service</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenue} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {revenue.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `₦${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
              {revenue.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent verifications */}
        <div className="rounded-[18px] border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Verifications</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Reference</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Institution</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 text-right font-medium">Match Score</th>
                  <th className="pb-2 pr-3 text-right font-medium">Response Time</th>
                  <th className="pb-2 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => (
                  <tr key={v.ref} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-foreground">{v.ref}</td>
                    <td className="py-2.5 pr-3">
                      <span className={typeBadge(v.type)}>{v.type}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-foreground">{v.institution}</td>
                    <td className="py-2.5 pr-3">
                      <span className={statusBadge(v.ok)}>{v.ok ? "verified" : "failed"}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-foreground">{v.score}%</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-muted-foreground">{v.rt}</td>
                    <td className="py-2.5 text-muted-foreground">{v.ts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
