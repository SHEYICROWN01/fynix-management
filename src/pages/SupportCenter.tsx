import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus } from "lucide-react";

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
const SUBJECTS = [
  "Settlement stuck for 48h",
  "API key not working",
  "KYC verification failing",
  "Vault balance discrepancy",
  "SMS OTP not delivering",
  "Webhook timeout errors",
];
const ASSIGNEES = ["Sarah O.", "James K.", "Amara N.", "System"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
const STATUSES = ["Open", "Pending", "Resolved", "Escalated"] as const;

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 10,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    Critical: "rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400",
    High: "rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400",
    Medium: "rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400",
    Low: "rounded-full bg-slate-500/10 border border-slate-500/20 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400",
  };
  return map[p] ?? map.Low;
}
function statusBadge(s: string) {
  const map: Record<string, string> = {
    Open: "rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400",
    Pending: "rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400",
    Resolved: "rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400",
    Escalated: "rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400",
  };
  return map[s] ?? map.Open;
}

const TABS = ["All", "Open", "Pending", "Resolved", "Escalated"];

export default function SupportCenter() {
  const [tab, setTab] = useState("All");

  const tickets = useMemo(() => {
    const r = sr(7712);
    return Array.from({ length: 18 }).map((_, i) => {
      const status = STATUSES[Math.floor(r() * STATUSES.length)];
      let sla: { text: string; cls: string };
      if (status === "Resolved") {
        sla = { text: `Resolved in ${(r() * 3 + 0.5).toFixed(1)}h`, cls: "text-emerald-500" };
      } else if (r() > 0.75) {
        sla = { text: "BREACHED", cls: "text-rose-500" };
      } else {
        sla = { text: `${Math.floor(r() * 4) + 1}h remaining`, cls: "text-emerald-500" };
      }
      return {
        id: `TKT-2026-${String(8472 - i).padStart(5, "0")}`,
        institution: INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)],
        subject: SUBJECTS[Math.floor(r() * SUBJECTS.length)],
        priority: PRIORITIES[Math.floor(r() * PRIORITIES.length)],
        status,
        assignee: ASSIGNEES[Math.floor(r() * ASSIGNEES.length)],
        created: `${Math.floor(r() * 47) + 1}h ago`,
        sla,
      };
    });
  }, []);

  const filtered = useMemo(
    () => (tab === "All" ? tickets : tickets.filter((t) => t.status === tab)),
    [tab, tickets]
  );

  const priorityBars = [
    { label: "Critical", value: 3, color: "bg-rose-500" },
    { label: "High", value: 8, color: "bg-amber-500" },
    { label: "Medium", value: 9, color: "bg-blue-500" },
    { label: "Low", value: 3, color: "bg-slate-500" },
  ];
  const maxPri = Math.max(...priorityBars.map((p) => p.value));

  const categories = [
    { label: "Settlement", value: 6 },
    { label: "API/Integration", value: 5 },
    { label: "KYC/Compliance", value: 4 },
    { label: "SMS", value: 3 },
    { label: "Billing", value: 3 },
    { label: "Other", value: 2 },
  ];

  const assignees = [
    { name: "Sarah O.", count: 8 },
    { name: "James K.", count: 6 },
    { name: "Amara N.", count: 5 },
  ];

  const slaTrend = useMemo(() => {
    const r = sr(3391);
    return Array.from({ length: 14 }).map((_, i) => ({
      day: `D${i + 1}`,
      sla: +(r() * 8 + 90).toFixed(1),
    }));
  }, []);

  const feed = [
    { text: "TKT-08471 escalated to L2", color: "bg-violet-500", time: "2m ago" },
    { text: "TKT-08469 resolved by Sarah O.", color: "bg-emerald-500", time: "8m ago" },
    { text: "New ticket from Heritage Bank", color: "bg-blue-500", time: "14m ago" },
    { text: "SLA breach on TKT-08465", color: "bg-rose-500", time: "22m ago" },
    { text: "TKT-08463 assigned to James K.", color: "bg-blue-500", time: "31m ago" },
    { text: "TKT-08460 resolved by Amara N.", color: "bg-emerald-500", time: "44m ago" },
    { text: "New ticket from Kuda MFB", color: "bg-blue-500", time: "51m ago" },
    { text: "TKT-08458 escalated to L2", color: "bg-violet-500", time: "1h ago" },
    { text: "TKT-08455 pending institution response", color: "bg-amber-500", time: "1h ago" },
    { text: "SLA breach on TKT-08451", color: "bg-rose-500", time: "2h ago" },
    { text: "TKT-08449 resolved by Sarah O.", color: "bg-emerald-500", time: "2h ago" },
    { text: "New ticket from Opay Digital", color: "bg-blue-500", time: "3h ago" },
  ];

  const kpis = [
    { label: "OPEN TICKETS", value: "23", note: "requires attention", noteClass: "text-rose-500" },
    { label: "PENDING RESPONSE", value: "8", note: "awaiting institution", noteClass: "text-amber-500" },
    { label: "RESOLVED TODAY", value: "14", note: "▲ 3 vs yesterday", noteClass: "text-emerald-500" },
    { label: "AVG RESPONSE TIME", value: "2.4h", note: "SLA: 4h", noteClass: "text-emerald-500" },
    { label: "SLA COMPLIANCE", value: "94.2%", note: "Target: 95%", noteClass: "text-amber-500" },
  ];

  return (
    <DashboardLayout title="Support Center">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Support Center</h1>
            <p className="text-sm text-muted-foreground">Institution support ticket management and escalations</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Ticket
          </Button>
        </div>

        {/* KPI strip */}
        <div className="rounded-[18px] border border-border bg-card">
          <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
            {kpis.map((k) => (
              <div key={k.label} className="p-5">
                <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">{k.label}</p>
                <p className="font-mono text-2xl font-bold text-foreground">{k.value}</p>
                <p className={`text-[11px] ${k.noteClass}`}>{k.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Queue + sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="rounded-[18px] border border-border bg-card p-5 lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    tab === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Ticket ID</th>
                    <th className="pb-2 pr-3 font-medium">Institution</th>
                    <th className="pb-2 pr-3 font-medium">Subject</th>
                    <th className="pb-2 pr-3 font-medium">Priority</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Assigned</th>
                    <th className="pb-2 pr-3 font-medium">Created</th>
                    <th className="pb-2 pr-3 font-medium">SLA</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                      <td className="py-2.5 pr-3 font-mono text-[12px] text-foreground">{t.id}</td>
                      <td className="py-2.5 pr-3 text-foreground">{t.institution}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{t.subject}</td>
                      <td className="py-2.5 pr-3">
                        <span className={priorityBadge(t.priority)}>{t.priority}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={statusBadge(t.status)}>{t.status}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-foreground">{t.assignee}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{t.created}</td>
                      <td className={`py-2.5 pr-3 text-[12px] font-medium ${t.sla.cls}`}>{t.sla.text}</td>
                      <td className="py-2.5">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                        No tickets in this category
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-6">
            <div className="rounded-[18px] border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
                <h2 className="text-sm font-semibold text-foreground">Priority Breakdown</h2>
              </div>
              <div className="space-y-3">
                {priorityBars.map((p) => (
                  <div key={p.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">{p.label}</span>
                      <span className="font-mono text-foreground">{p.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${p.color}`} style={{ width: `${(p.value / maxPri) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
                <h2 className="text-sm font-semibold text-foreground">Category Breakdown</h2>
              </div>
              <div className="space-y-2">
                {categories.map((c) => (
                  <div key={c.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-mono text-foreground">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
                <h2 className="text-sm font-semibold text-foreground">Top Assignees</h2>
              </div>
              <div className="space-y-3">
                {assignees.map((a) => (
                  <div key={a.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {a.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 text-sm text-foreground">{a.name}</div>
                    <span className="text-xs text-muted-foreground">{a.count} tickets</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SLA chart + activity feed */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[18px] border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">SLA Compliance (14 days)</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={slaTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                <YAxis domain={[85, 100]} tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                <ReferenceLine
                  y={95}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: "SLA Target", fill: "#F59E0B", fontSize: 11 }}
                />
                <Line type="monotone" dataKey="sla" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {feed.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${f.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{f.text}</p>
                    <p className="text-[11px] text-muted-foreground">{f.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
