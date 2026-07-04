import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, MoreHorizontal, Eye, PauseCircle, ArrowDownRight, ArrowUpRight } from "lucide-react";

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
const BANK_PARTNERS = ["Wema Bank", "Providus Bank", "Sterling Bank", "GTBank", "Zenith Bank", "Access Bank"];
const NAMES = [
  "Jane Adeyemi",
  "Chukwuemeka Ltd",
  "Ibrahim Musa",
  "Ngozi Okafor",
  "Tunde Bakare",
  "Amara Nwosu",
  "Emeka Obi Ent.",
  "Fatima Bello",
  "Segun Ade Corp",
  "Blessing Eze",
  "Yusuf Danladi",
  "Chidinma Nwankwo",
];
const STATUSES = ["active", "suspended", "pending"] as const;

const ngn = (n: number) => `₦${Math.round(n).toLocaleString()}`;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active:
      "rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400",
    suspended:
      "rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400",
    pending:
      "rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400",
    closed:
      "rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400",
  };
  return map[status] ?? map.pending;
}

const PIE_COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#F43F5E"];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 10,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

export default function VirtualAccounts() {
  const rand = useMemo(() => sr(4021), []);

  const accounts = useMemo(() => {
    const r = sr(1201);
    return Array.from({ length: 12 }).map((_, i) => {
      const van = Array.from({ length: 10 })
        .map(() => Math.floor(r() * 10))
        .join("");
      return {
        van,
        institution: INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)],
        partner: BANK_PARTNERS[Math.floor(r() * BANK_PARTNERS.length)],
        name: NAMES[i],
        balance: Math.floor(r() * 8_000_000) + 50_000,
        limit: (Math.floor(r() * 5) + 1) * 1_000_000,
        status: STATUSES[Math.floor(r() * STATUSES.length)],
        created: `${Math.floor(r() * 27) + 1}d ago`,
      };
    });
  }, []);

  const byInstitution = useMemo(
    () =>
      INSTITUTIONS.slice(0, 8).map((name) => ({
        name: name.replace(/ (Ltd|Inc|MFB|Digital|Intl)$/, ""),
        count: Math.floor(sr(name.length * 97 + name.charCodeAt(0))() * 320) + 40,
      })),
    []
  );

  const statusData = useMemo(
    () => [
      { name: "Active", value: 1612 },
      { name: "Suspended", value: 48 },
      { name: "Pending", value: 132 },
      { name: "Closed", value: 55 },
    ],
    []
  );

  const trend = useMemo(() => {
    const r = sr(7788);
    return Array.from({ length: 14 }).map((_, i) => ({
      day: `D${i + 1}`,
      accounts: Math.floor(r() * 40) + 10,
    }));
  }, []);

  const transactions = useMemo(() => {
    const r = sr(3312);
    return Array.from({ length: 10 }).map(() => {
      const type = r() > 0.5 ? "credit" : "debit";
      return {
        ref: `VTX${Math.floor(r() * 900000 + 100000)}`,
        van: Array.from({ length: 10 })
          .map(() => Math.floor(r() * 10))
          .join(""),
        institution: INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)],
        amount: Math.floor(r() * 2_000_000) + 5000,
        type,
        status: r() > 0.15 ? "success" : "failed",
        time: `${Math.floor(r() * 59) + 1}m ago`,
      };
    });
  }, []);

  const kpis = [
    { label: "TOTAL VANS", value: "1,847", note: "across all institutions", noteClass: "text-muted-foreground" },
    { label: "ACTIVE", value: "1,612", note: "▲ 23 this week", noteClass: "text-emerald-500" },
    { label: "SUSPENDED", value: "48", note: "under review", noteClass: "text-amber-500" },
    { label: "TODAY'S VOLUME", value: "₦4.2B", note: "▲ 8.3%", noteClass: "text-emerald-500" },
    { label: "REVENUE TODAY", value: "₦84,000", note: "₦0.02 per txn", noteClass: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout title="Virtual Accounts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Virtual Accounts</h1>
            <p className="text-sm text-muted-foreground">Provision and manage virtual account numbers</p>
          </div>
          <Button onClick={() => rand()}>
            <Plus className="mr-2 h-4 w-4" /> Provision New Account
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Accounts table */}
          <div className="rounded-[18px] border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Provisioned Accounts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">VAN</th>
                    <th className="pb-2 pr-3 font-medium">Institution</th>
                    <th className="pb-2 pr-3 font-medium">Bank Partner</th>
                    <th className="pb-2 pr-3 font-medium">Account Name</th>
                    <th className="pb-2 pr-3 text-right font-medium">Balance</th>
                    <th className="pb-2 pr-3 text-right font-medium">Daily Limit</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Created</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.van} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                      <td className="py-2.5 pr-3 font-mono text-[12px] text-foreground">{a.van}</td>
                      <td className="py-2.5 pr-3 text-foreground">{a.institution}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{a.partner}</td>
                      <td className="py-2.5 pr-3 text-foreground">{a.name}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-foreground">{ngn(a.balance)}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-muted-foreground">{ngn(a.limit)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={statusBadge(a.status)}>{a.status}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{a.created}</td>
                      <td className="py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <PauseCircle className="mr-2 h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts column */}
          <div className="space-y-6">
            <div className="rounded-[18px] border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
                <h2 className="text-sm font-semibold text-foreground">VANs by Institution</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byInstitution} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#71717A", fontSize: 10 }}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-[18px] border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
                <h2 className="text-sm font-semibold text-foreground">Status Breakdown</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
                <h2 className="text-sm font-semibold text-foreground">Provisioning Trend</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="accounts" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="rounded-[18px] border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
            <h2 className="text-sm font-semibold text-foreground">Recent VAN Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Reference</th>
                  <th className="pb-2 pr-3 font-medium">VAN</th>
                  <th className="pb-2 pr-3 font-medium">Institution</th>
                  <th className="pb-2 pr-3 text-right font-medium">Amount</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.ref} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-foreground">{t.ref}</td>
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-muted-foreground">{t.van}</td>
                    <td className="py-2.5 pr-3 text-foreground">{t.institution}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-foreground">{ngn(t.amount)}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[12px] ${
                          t.type === "credit" ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {t.type === "credit" ? (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={statusBadge(t.status === "success" ? "active" : "closed")}>{t.status}</span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{t.time}</td>
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
