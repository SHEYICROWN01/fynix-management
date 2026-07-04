import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Download, Filter } from "lucide-react";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}

const ACTIONS = ["Login", "Edit", "Delete", "Approve", "Generate", "View", "Export", "Freeze", "Override"] as const;
type Action = typeof ACTIONS[number];
const MODULES = ["Settlement", "Institutions", "Vault", "Fraud", "Compliance", "Billing", "Users", "Reports"];
const ACTORS = ["A. Okafor", "T. Balogun", "N. Eze", "S. Adeyemi", "system@quovatech", "K. Musa"];

const SEVERITY: Record<Action, "info" | "warning" | "danger"> = {
  Login: "info", View: "info", Generate: "info", Export: "info",
  Edit: "warning", Approve: "warning",
  Delete: "danger", Freeze: "danger", Override: "danger",
};
const sevCls: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

const Select = ({ label, options }: { label: string; options: string[] }) => (
  <select aria-label={label} className="rounded-xl border border-border bg-card px-3 py-2 text-[12px] text-foreground/80 focus:border-blue-500/40 focus:outline-none">
    <option>{label}</option>
    {options.map((o) => <option key={o}>{o}</option>)}
  </select>
);

export default function AuditLogs() {
  const rows = useMemo(() => {
    const rnd = sr(2288);
    return Array.from({ length: 20 }, (_, i) => {
      const action = ACTIONS[Math.floor(rnd() * ACTIONS.length)];
      const d = new Date(Date.now() - i * 1000 * 60 * 17);
      return {
        ref: `AUD-${Math.floor(rnd() * 900000 + 100000)}`,
        ts: d.toLocaleString("en-GB", { hour12: false }),
        actor: ACTORS[Math.floor(rnd() * ACTORS.length)],
        action,
        module: MODULES[Math.floor(rnd() * MODULES.length)],
        ip: `102.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}`,
        severity: SEVERITY[action],
      };
    });
  }, []);

  return (
    <DashboardLayout title="Audit Logs">
      <div className="space-y-5">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Immutable record of every privileged action</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground/90 hover:bg-muted/40">
            <Download className="h-4 w-4" />Export
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-[18px] border border-border bg-background p-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select label="Date Range" options={["Today", "Last 7 days", "Last 30 days"]} />
          <Select label="User" options={ACTORS} />
          <Select label="Action Type" options={[...ACTIONS]} />
          <Select label="Module" options={MODULES} />
          <Select label="Severity" options={["Info", "Warning", "Danger"]} />
        </div>

        <div className="rounded-[18px] border border-border bg-card p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  {["Ref", "Timestamp", "Actor", "Action", "Module", "IP Address", "Severity", "Details"].map((h) => (
                    <th key={h} className="pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-3 font-mono text-foreground/80">{r.ref}</td>
                    <td className="py-3 font-mono text-muted-foreground">{r.ts}</td>
                    <td className="py-3 font-medium text-foreground/90">{r.actor}</td>
                    <td className="py-3 text-foreground/80">{r.action}</td>
                    <td className="py-3 text-muted-foreground">{r.module}</td>
                    <td className="py-3 font-mono text-muted-foreground">{r.ip}</td>
                    <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${sevCls[r.severity]}`}>{r.severity}</span></td>
                    <td className="py-3"><button className="text-[12px] font-medium text-blue-400 hover:text-blue-300">View</button></td>
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
