import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Fingerprint, IdCard, UserCheck, ShieldCheck, Scale, Landmark } from "lucide-react";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}
const INSTITUTIONS = ["Heritage Bank", "Palmpay Ltd", "Moniepoint Inc", "Kuda Microfinance", "Carbon MFB", "Opay Digital", "FairMoney MFB", "VFD MFB"];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[18px] border border-border bg-card p-5 hover:border-border hover:shadow-md transition-colors ${className}`}>{children}</div>
);
const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-4 flex items-center gap-3 border-l-[3px] border-blue-500 pl-3">
    <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
  </div>
);

export default function ComplianceCenter() {
  const { events } = useMemo(() => {
    const rnd = sr(6612);
    const actions = ["BVN Verified", "NIN Matched", "KYC Approved", "AML Cleared", "PEP Flagged", "Sanction Hit"];
    const results = ["Passed", "Passed", "Passed", "Flagged", "Failed"];
    const events = Array.from({ length: 8 }, () => {
      const res = results[Math.floor(rnd() * results.length)];
      return {
        ref: `CMP-${Math.floor(rnd() * 9000 + 1000)}`,
        institution: INSTITUTIONS[Math.floor(rnd() * INSTITUTIONS.length)],
        action: actions[Math.floor(rnd() * actions.length)],
        result: res,
        time: `${Math.floor(rnd() * 58) + 1}m ago`,
      };
    });
    return { events };
  }, []);

  const summary = [
    { label: "Pending Verification", value: "312", color: "text-amber-400" },
    { label: "Failed Verification", value: "27", color: "text-rose-400" },
    { label: "Approved Today", value: "1,847", color: "text-emerald-400" },
    { label: "Expiring Documents", value: "63", color: "text-blue-400" },
  ];

  const checklist = [
    { name: "BVN Verification", icon: Fingerprint, value: "24,318", status: "Operational", pct: 98, scan: "2m ago", cls: "bg-blue-500/10 text-blue-400" },
    { name: "NIN Verification", icon: IdCard, value: "21,904", status: "Operational", pct: 96, scan: "4m ago", cls: "bg-emerald-500/10 text-emerald-400" },
    { name: "KYC Status", icon: UserCheck, value: "19,552", status: "Operational", pct: 92, scan: "1m ago", cls: "bg-violet-500/10 text-violet-400" },
    { name: "AML Screening", icon: ShieldCheck, value: "18,401", status: "Live", pct: 99, scan: "just now", cls: "bg-amber-500/10 text-amber-400" },
    { name: "PEP Check", icon: Scale, value: "4,213", status: "Operational", pct: 88, scan: "9m ago", cls: "bg-rose-500/10 text-rose-400" },
    { name: "Sanction Screening", icon: Landmark, value: "3,908", status: "Operational", pct: 94, scan: "6m ago", cls: "bg-blue-500/10 text-blue-400" },
  ];

  const resultCls: Record<string, string> = {
    Passed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Flagged: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Failed: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  };

  return (
    <DashboardLayout title="Compliance Center">
      <div className="space-y-5">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Compliance Center</h1>
          <div className="flex gap-2">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-400">CBN REGULATED</span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">NDIC INSURED</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label}>
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">{s.label}</p>
              <p className={`mt-1 font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checklist.map((c) => (
            <Card key={c.name}>
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.cls}`}><c.icon className="h-5 w-5" /></div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">{c.status}</span>
              </div>
              <p className="mt-4 text-[13px] font-semibold text-foreground">{c.name}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">{c.value}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/50">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${c.pct}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Last scan {c.scan}</p>
            </Card>
          ))}
        </div>

        <Card>
          <SectionHeader title="Recent Compliance Events" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  {["Reference", "Institution", "Action", "Result", "Time"].map((h) => <th key={h} className="pb-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-3 font-mono text-foreground/80">{e.ref}</td>
                    <td className="py-3 font-medium text-foreground/90">{e.institution}</td>
                    <td className="py-3 text-muted-foreground">{e.action}</td>
                    <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${resultCls[e.result]}`}>{e.result}</span></td>
                    <td className="py-3 text-muted-foreground">{e.time}</td>
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
