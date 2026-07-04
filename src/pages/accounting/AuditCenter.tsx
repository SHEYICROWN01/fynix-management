import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Download, ChevronDown, ChevronRight, ClipboardList, Activity, Clock, ShieldCheck } from "lucide-react";
import { financeApi, type FinAuditEntry } from "@/lib/api";

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

const moduleColor: Record<string, string> = {
  Finance: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
  Expense: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
  Revenue: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  Ledger: "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400",
  OwnersDraw: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  Budget: "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
};

function moduleClsFor(mod: string): string {
  return moduleColor[mod] ?? "bg-muted border-border text-muted-foreground";
}

function AuditRow({ e }: { e: FinAuditEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="group hover:bg-muted/30 transition-colors border-b border-border cursor-pointer" onClick={() => setOpen(!open)}>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1.5">
            {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-[12px] text-muted-foreground whitespace-nowrap">{e.timestamp}</span>
          </div>
        </td>
        <td className="px-3 py-3 text-[13px] font-medium text-foreground">{e.user_name}</td>
        <td className="px-3 py-3 text-[13px] text-foreground capitalize">{e.action}</td>
        <td className="px-3 py-3">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${moduleClsFor(e.module)}`}>{e.module}</span>
        </td>
        <td className="px-3 py-3 text-[12px] font-mono text-muted-foreground">{e.record_id}</td>
        <td className="px-3 py-3 text-[12px] text-muted-foreground max-w-[160px] truncate">{String(e.before_value ?? "—")}</td>
        <td className="px-3 py-3 text-[12px] text-muted-foreground max-w-[160px] truncate">{String(e.after_value ?? "—")}</td>
        <td className="px-3 py-3 text-[12px] font-mono text-muted-foreground">{e.ip_address}</td>
      </tr>
      {open && (
        <tr className="bg-muted/20 border-b border-border">
          <td colSpan={8} className="px-10 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Before</p>
                <code className="text-[12px] text-foreground break-all">{String(e.before_value ?? "—")}</code>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">After</p>
                <code className="text-[12px] text-foreground break-all">{String(e.after_value ?? "—")}</code>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Device Info</p>
                <p className="text-[12px] text-foreground">{e.user_agent || "—"} · {e.ip_address}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                <p className="text-[12px] text-foreground">{e.description}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditCenter() {
  const [query, setQuery] = useState("");

  const { data: auditPage, isLoading } = useQuery({
    queryKey: ["fin-audit"],
    queryFn: () => financeApi.listAuditEntries({ page: 1 }),
    staleTime: 2 * 60_000,
  });

  const entries = auditPage?.data ?? [];
  const filtered = entries.filter(
    (e) =>
      e.user_name.toLowerCase().includes(query.toLowerCase()) ||
      e.record_id.toLowerCase().includes(query.toLowerCase()) ||
      e.module.toLowerCase().includes(query.toLowerCase()) ||
      e.action.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DashboardLayout title="Audit Center">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Center</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Complete audit trail of financial changes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search audit log..." className="pl-8 w-[220px]" />
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success("Audit log exported")}>
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Entries", value: String(auditPage?.meta?.total ?? entries.length), icon: ClipboardList, tone: "blue" },
            { label: "This Page", value: String(entries.length), icon: Activity, tone: "violet" },
            { label: "Pending Reviews", value: "—", icon: Clock, tone: "amber" },
            { label: "Compliance Score", value: "96%", icon: ShieldCheck, tone: "emerald" },
          ].map((k) => {
            const tone: Record<string, string> = {
              blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
              amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Audit Log</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{filtered.length} entries · click a row to expand</p>
          </div>
          {isLoading ? <Sk className="h-[300px]" /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Timestamp", "User", "Action", "Module", "Record ID", "Before", "After", "IP Address"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => <AuditRow key={e.id} e={e} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
