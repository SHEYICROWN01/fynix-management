import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Book,
  Download,
  Zap,
  FlaskConical,
  Copy,
  MoreHorizontal,
  RotateCw,
  Ban,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

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

function envBadge(env: string) {
  return env === "Production"
    ? "rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400"
    : "rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400";
}
function activeBadge(active: boolean) {
  return active
    ? "rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
    : "rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400";
}
function methodBadge(m: string) {
  const map: Record<string, string> = {
    GET: "rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400",
    POST: "rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400",
    PUT: "rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400",
    DELETE: "rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400",
  };
  return map[m] ?? map.GET;
}
function statusColor(s: number) {
  if (s < 300) return "text-emerald-500";
  if (s < 500) return "text-amber-500";
  return "text-rose-500";
}

interface QuickLink {
  title: string;
  desc: string;
  cta: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}
const QUICK_LINKS: QuickLink[] = [
  { title: "API Documentation", desc: "Full REST API reference", cta: "View Docs →", icon: Book, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "SDK Downloads", desc: "Node.js, Python, PHP SDKs", cta: "Download →", icon: Download, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Webhooks", desc: "Configure event webhooks", cta: "Manage →", icon: Zap, color: "text-violet-500", bg: "bg-violet-500/10" },
  { title: "Sandbox", desc: "Test without real data", cta: "Enter Sandbox →", icon: FlaskConical, color: "text-amber-500", bg: "bg-amber-500/10" },
];

const EVENTS = ["transfer.completed", "vault.funded", "kyc.verified", "settlement.done", "webhook.retry", "account.created"];

export default function DeveloperCenter() {
  const [env, setEnv] = useState<"production" | "sandbox">("production");

  const apiKeys = useMemo(() => {
    const r = sr(3301);
    return Array.from({ length: 12 }).map(() => {
      const inst = INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)];
      const isProd = r() > 0.4;
      const tail = Math.floor(r() * 0xffff)
        .toString(16)
        .padStart(4, "0");
      return {
        name: `${inst} ${isProd ? "Production" : "Sandbox"}`,
        key: `sk_${isProd ? "live" : "test"}_••••••••••••${tail}`,
        institution: inst,
        env: isProd ? "Production" : "Sandbox",
        created: `${Math.floor(r() * 300) + 10}d ago`,
        lastUsed: `${Math.floor(r() * 12) + 1}h ago`,
        active: r() > 0.15,
      };
    });
  }, []);

  const webhooks = useMemo(() => {
    const r = sr(8812);
    return Array.from({ length: 10 }).map(() => {
      const inst = INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)];
      const failed = r() > 0.8;
      const slug = inst.toLowerCase().replace(/[^a-z]/g, "");
      return {
        url: `https://api.${slug}.ng/webhooks/fynix`,
        institution: inst,
        events: [EVENTS[Math.floor(r() * EVENTS.length)], EVENTS[Math.floor(r() * EVENTS.length)]],
        failed,
        fails: Math.floor(r() * 5) + 1,
        last: `${Math.floor(r() * 30) + 1}m ago`,
      };
    });
  }, []);

  const activity = useMemo(() => {
    const r = sr(1177);
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}:00`,
      Production: Math.floor(r() * 8000) + 2000,
      Sandbox: Math.floor(r() * 2000) + 200,
    }));
  }, []);

  const logs = useMemo(() => {
    const r = sr(6420);
    const methods = ["GET", "POST", "PUT", "DELETE"];
    const endpoints = ["/v1/transfers", "/v1/accounts", "/v1/kyc/bvn", "/v1/vault/fund", "/v1/webhooks", "/v1/settlements"];
    const statuses = [200, 200, 200, 201, 400, 500];
    return Array.from({ length: 10 }).map(() => ({
      ts: `${Math.floor(r() * 59) + 1}s ago`,
      method: methods[Math.floor(r() * methods.length)],
      endpoint: endpoints[Math.floor(r() * endpoints.length)],
      institution: INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)],
      status: statuses[Math.floor(r() * statuses.length)],
      latency: `${Math.floor(r() * 200) + 12}ms`,
      ip: `102.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`,
    }));
  }, []);

  const kpis = [
    { label: "API KEYS ACTIVE", value: "24", note: "across 18 institutions", noteClass: "text-muted-foreground" },
    { label: "WEBHOOKS CONFIGURED", value: "67", note: "89% healthy", noteClass: "text-emerald-500" },
    { label: "API CALLS TODAY", value: "142,847", note: "▲ 18.3%", noteClass: "text-emerald-500" },
    { label: "ERROR RATE", value: "0.08%", note: "SLA: < 0.5%", noteClass: "text-emerald-500" },
    { label: "AVG LATENCY", value: "48ms", note: "P99: 124ms", noteClass: "text-muted-foreground" },
  ];

  const copyKey = () => toast.success("API key copied to clipboard");

  return (
    <DashboardLayout title="Developer Center">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Developer Center</h1>
            <p className="text-sm text-muted-foreground">API keys, webhooks, and integration tools</p>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-muted p-1">
            <button
              onClick={() => setEnv("production")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                env === "production" ? "bg-blue-500 text-white" : "text-muted-foreground"
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setEnv("sandbox")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                env === "sandbox" ? "bg-amber-500 text-white" : "text-muted-foreground"
              }`}
            >
              Sandbox
            </button>
          </div>
        </div>

        {env === "sandbox" && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            You are viewing Sandbox environment — data is not real
          </div>
        )}

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

        {/* API keys + quick links */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[18px] border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">API Keys</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Key Name</th>
                    <th className="pb-2 pr-3 font-medium">Key</th>
                    <th className="pb-2 pr-3 font-medium">Environment</th>
                    <th className="pb-2 pr-3 font-medium">Created</th>
                    <th className="pb-2 pr-3 font-medium">Last Used</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k, i) => (
                    <tr key={i} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                      <td className="py-2.5 pr-3 font-medium text-foreground">{k.name}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-muted-foreground">{k.key}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyKey}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={envBadge(k.env)}>{k.env}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{k.created}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{k.lastUsed}</td>
                      <td className="py-2.5 pr-3">
                        <span className={activeBadge(k.active)}>{k.active ? "Active" : "Revoked"}</span>
                      </td>
                      <td className="py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <RotateCw className="mr-2 h-4 w-4" /> Rotate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Ban className="mr-2 h-4 w-4" /> Revoke
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

          {/* Quick links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {QUICK_LINKS.map((q) => {
              const Icon = q.icon;
              return (
                <div key={q.title} className="rounded-[18px] border border-border bg-card p-5 transition-shadow hover:shadow-md">
                  <div className={`mb-3 inline-flex rounded-lg p-2 ${q.bg}`}>
                    <Icon className={`h-5 w-5 ${q.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{q.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{q.desc}</p>
                  <p className={`mt-3 text-xs font-medium ${q.color}`}>{q.cta}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Webhooks */}
        <div className="rounded-[18px] border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
            <h2 className="text-sm font-semibold text-foreground">Webhooks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Endpoint URL</th>
                  <th className="pb-2 pr-3 font-medium">Institution</th>
                  <th className="pb-2 pr-3 font-medium">Events</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Last Triggered</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w, i) => (
                  <tr key={i} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-foreground">{w.url}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{w.institution}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {w.events.map((e, j) => (
                          <span
                            key={j}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      {w.failed ? (
                        <span className={activeBadge(false)}>{w.fails} fails</span>
                      ) : (
                        <span className={activeBadge(true)}>Active</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{w.last}</td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          Test
                        </Button>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity chart + logs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">API Activity (24h)</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={{ stroke: "hsl(var(--border))" }} interval={3} />
                <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={48} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="Production" stroke="#3B82F6" fill="url(#prodGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="Sandbox" stroke="#F59E0B" fill="url(#sandGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Recent API Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Time</th>
                    <th className="pb-2 pr-3 font-medium">Method</th>
                    <th className="pb-2 pr-3 font-medium">Endpoint</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Latency</th>
                    <th className="pb-2 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={i} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                      <td className="py-2.5 pr-3 text-muted-foreground">{l.ts}</td>
                      <td className="py-2.5 pr-3">
                        <span className={methodBadge(l.method)}>{l.method}</span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-foreground">{l.endpoint}</td>
                      <td className={`py-2.5 pr-3 font-mono font-medium ${statusColor(l.status)}`}>{l.status}</td>
                      <td className="py-2.5 pr-3 font-mono text-muted-foreground">{l.latency}</td>
                      <td className="py-2.5 font-mono text-[11px] text-muted-foreground">{l.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
