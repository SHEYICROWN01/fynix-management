import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Filter, Globe } from "lucide-react";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}

const INSTITUTIONS = ["Heritage Bank", "Palmpay Ltd", "Moniepoint Inc", "Kuda Microfinance", "Carbon MFB", "Branch Intl", "FairMoney MFB", "Opay Digital", "VFD MFB", "Sparkle MFB"];
const CHANNELS = ["NIP Transfer", "USSD", "POS", "Card", "API", "Web"];
const CITIES = ["Lagos, NG", "Abuja, NG", "Kano, NG", "Port Harcourt, NG", "Ibadan, NG"];
const RISKS = ["Low", "Medium", "High", "Critical"] as const;
type Risk = typeof RISKS[number];
const STATUSES = ["Success", "Pending", "Failed"] as const;
type TxStatus = typeof STATUSES[number];

const fmt = (n: number) => n >= 1e6 ? `₦${(n / 1e6).toFixed(2)}M` : `₦${(n / 1e3).toFixed(0)}K`;

const riskBadge = (r: Risk) => {
  const map: Record<Risk, string> = {
    Low: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    High: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    Critical: "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[r]}`}>{r}</span>;
};
const statusBadge = (s: TxStatus) => {
  const map: Record<TxStatus, string> = {
    Success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Failed: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[s]}`}>{s}</span>;
};

const Select = ({ label, options }: { label: string; options: string[] }) => (
  <select aria-label={label} className="rounded-xl border border-border bg-card px-3 py-2 text-[12px] text-foreground/80 focus:border-blue-500/40 focus:outline-none">
    <option>{label}</option>
    {options.map((o) => <option key={o}>{o}</option>)}
  </select>
);

export default function TransactionMonitoring() {
  const [count] = useState(48213);

  const rows = useMemo(() => {
    const rnd = sr(9911);
    return Array.from({ length: 20 }, () => ({
      ref: `FYX-2026-${Math.floor(rnd() * 90000 + 10000)}`,
      institution: INSTITUTIONS[Math.floor(rnd() * INSTITUTIONS.length)],
      amount: Math.round(rnd() * 3.8e6 + 5e3),
      channel: CHANNELS[Math.floor(rnd() * CHANNELS.length)],
      status: STATUSES[Math.floor(rnd() * STATUSES.length)],
      risk: RISKS[Math.floor(rnd() * RISKS.length)],
      geo: CITIES[Math.floor(rnd() * CITIES.length)],
      time: `${Math.floor(rnd() * 59)}s ago`,
    }));
  }, []);

  const highRisk = rows.filter((r) => r.risk === "High" || r.risk === "Critical").length;
  const avg = Math.round(rows.reduce((a, r) => a + r.amount, 0) / rows.length);

  const stats = [
    { label: "Total Txns", value: count.toLocaleString(), color: "text-foreground" },
    { label: "Avg Amount", value: fmt(avg), color: "text-blue-400" },
    { label: "High Risk", value: String(highRisk), color: "text-rose-400" },
    { label: "Processing", value: String(rows.filter((r) => r.status === "Pending").length), color: "text-amber-400" },
  ];

  return (
    <DashboardLayout title="Transaction Monitoring">
      <div className="space-y-5">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              Transaction Monitoring
              <span className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> LIVE
              </span>
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground"><span className="font-mono text-foreground/90">{count.toLocaleString()}</span> transactions processed today</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-[18px] border border-border bg-background p-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select label="Today" options={["Yesterday", "This Week"]} />
          <Select label="Status" options={[...STATUSES]} />
          <Select label="Channel" options={CHANNELS} />
          <Select label="Amount Range" options={["< ₦100K", "₦100K – ₦1M", "> ₦1M"]} />
          <Select label="Institution" options={INSTITUTIONS} />
          <Select label="Risk Score" options={[...RISKS]} />
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-[18px] border border-border bg-card p-4">
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">{s.label}</p>
              <p className={`mt-1 font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-[18px] border border-border bg-card p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  {["Reference", "Institution", "Amount", "Channel", "Status", "Risk Score", "Geo", "Time"].map((h) => (
                    <th key={h} className="pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-3 font-mono text-foreground/80">{r.ref}</td>
                    <td className="py-3 font-medium text-foreground/90">{r.institution}</td>
                    <td className="py-3 font-mono text-foreground/80">{fmt(r.amount)}</td>
                    <td className="py-3 text-muted-foreground">{r.channel}</td>
                    <td className="py-3">{statusBadge(r.status)}</td>
                    <td className="py-3">{riskBadge(r.risk)}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{r.geo}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">{r.time}</td>
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
