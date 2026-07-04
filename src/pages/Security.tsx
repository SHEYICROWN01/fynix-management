import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoDataBanner } from "@/components/ui/DemoDataBanner";
import {
  Search,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Settings,
  Key,
  Download,
  Lock,
  Activity,
  XCircle,
} from "lucide-react";

const auditLogs = [
  { id: "1", action: "Tenant suspended", actor: "John Doe", target: "Coastal Savings Bank", category: "tenant", timestamp: "Mar 12, 2024 14:32:18", ip: "192.168.1.1", severity: "warning" },
  { id: "2", action: "System admin added", actor: "John Doe", target: "sarah.johnson@fynix.com", category: "admin", timestamp: "Mar 12, 2024 11:15:42", ip: "192.168.1.1", severity: "info" },
  { id: "3", action: "Plan pricing updated", actor: "Jane Smith", target: "Professional Plan", category: "billing", timestamp: "Mar 11, 2024 16:45:03", ip: "192.168.1.2", severity: "info" },
  { id: "4", action: "Tenant reactivated", actor: "John Doe", target: "TechStart Bank", category: "tenant", timestamp: "Mar 11, 2024 10:22:51", ip: "192.168.1.1", severity: "info" },
  { id: "5", action: "Failed login attempt", actor: "unknown", target: "admin@fynix.com", category: "security", timestamp: "Mar 10, 2024 23:14:07", ip: "203.45.67.89", severity: "error" },
  { id: "6", action: "API key rotated", actor: "System", target: "Production API", category: "security", timestamp: "Mar 10, 2024 08:00:00", ip: "Internal", severity: "info" },
  { id: "7", action: "New tenant created", actor: "Jane Smith", target: "Horizon Finance Group", category: "tenant", timestamp: "Mar 09, 2024 14:55:22", ip: "192.168.1.2", severity: "info" },
];

const securityEvents = [
  { id: "1", type: "Failed Login", description: "Multiple failed login attempts detected", source: "203.45.67.89", timestamp: "Mar 10, 2024 23:14:07", status: "resolved" },
  { id: "2", type: "Unusual Activity", description: "API rate limit exceeded", source: "Acme Financial Corp", timestamp: "Mar 08, 2024 15:30:00", status: "resolved" },
  { id: "3", type: "Permission Change", description: "Admin role modified", source: "System", timestamp: "Mar 05, 2024 09:12:33", status: "reviewed" },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "tenant": return Building2;
    case "admin": return User;
    case "billing": return Settings;
    case "security": return Key;
    default: return Shield;
  }
};

const getCategoryStyle = (category: string) => {
  switch (category) {
    case "tenant": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "admin": return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
    case "billing": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "security": return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    default: return "bg-muted text-muted-foreground";
  }
};

const getSeverityDot = (severity: string) => {
  switch (severity) {
    case "error": return "bg-rose-500";
    case "warning": return "bg-amber-500";
    default: return "bg-emerald-500";
  }
};

const accessControls = [
  { label: "Two-Factor Authentication", desc: "Required for all system admins", value: "Enabled", valueStyle: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { label: "Session Timeout", desc: "Auto-logout after inactivity", value: "30 minutes", valueStyle: "text-foreground bg-muted border-border" },
  { label: "Password Policy", desc: "Minimum requirements for passwords", value: "Strong", valueStyle: "text-foreground bg-muted border-border" },
  { label: "Audit Log Retention", desc: "How long logs are stored", value: "30 days", valueStyle: "text-foreground bg-muted border-border" },
];

export default function Security() {
  const [logSearch, setLogSearch] = useState("");

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.actor.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.target.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <DashboardLayout title="Security & Audit Logs">
      <div className="space-y-5">
        <DemoDataBanner message="Audit logs and security events on this page are demo data. Connect an Audit Log API to display real security activity." />

        {/* Header */}
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground/70">
            QuovaTech BOC · System
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Security & Audit Logs</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Monitor system activity, security events, and access controls
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[22px] font-bold tracking-tight text-foreground leading-none">Secure</p>
            <p className="text-[12px] text-muted-foreground mt-1">System Status</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">1,247</p>
            <p className="text-[12px] text-muted-foreground mt-1">Events Today</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">0</p>
            <p className="text-[12px] text-muted-foreground mt-1">Active Threats</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[22px] font-bold tracking-tight text-foreground leading-none">30 days</p>
            <p className="text-[12px] text-muted-foreground mt-1">Log Retention</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="audit">
          <TabsList className="h-9 bg-muted/60 border border-border p-1 rounded-lg">
            <TabsTrigger value="audit" className="text-[12px] rounded-md">Audit Logs</TabsTrigger>
            <TabsTrigger value="security" className="text-[12px] rounded-md">Security Events</TabsTrigger>
            <TabsTrigger value="access" className="text-[12px] rounded-md">Access Control</TabsTrigger>
          </TabsList>

          {/* ── Audit Logs ────────────────────────────────────────────── */}
          <TabsContent value="audit" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="pl-9 h-9 w-56 text-[13px]"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 self-start sm:self-auto">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actor</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Target</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">IP Address</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[13px] text-muted-foreground">
                          No logs match your search
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const Icon = getCategoryIcon(log.category);
                        return (
                          <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                            {/* Action */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${getCategoryStyle(log.category)}`}>
                                  <Icon className="h-3 w-3" />
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getSeverityDot(log.severity)}`} />
                                  <span className="text-[13px] font-medium text-foreground whitespace-nowrap">{log.action}</span>
                                </div>
                              </div>
                            </td>
                            {/* Actor */}
                            <td className="px-5 py-3.5">
                              <span className="text-[12px] text-muted-foreground">{log.actor}</span>
                            </td>
                            {/* Target */}
                            <td className="px-5 py-3.5">
                              <span className="text-[12px] text-muted-foreground">{log.target}</span>
                            </td>
                            {/* Category */}
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getCategoryStyle(log.category)}`}>
                                {log.category}
                              </span>
                            </td>
                            {/* IP */}
                            <td className="px-5 py-3.5">
                              <code className="text-[11px] font-mono text-muted-foreground">{log.ip}</code>
                            </td>
                            {/* Timestamp */}
                            <td className="px-5 py-3.5">
                              <span className="text-[12px] text-muted-foreground whitespace-nowrap">{log.timestamp}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border px-5 py-3 bg-muted/20">
                <p className="text-[12px] text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filteredLogs.length}</span> of{" "}
                  <span className="font-medium text-foreground">{auditLogs.length}</span> log entries
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ── Security Events ───────────────────────────────────────── */}
          <TabsContent value="security" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-[14px] font-semibold text-foreground">Security Events</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Unusual activities and potential security threats</p>
              </div>
              <div className="divide-y divide-border">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      event.status === "resolved" ? "bg-emerald-500/10" : "bg-amber-500/10"
                    }`}>
                      {event.status === "resolved"
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        : <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{event.type}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{event.description}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          event.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Source: {event.source}</span>
                        <span className="text-border">·</span>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Access Control ────────────────────────────────────────── */}
          <TabsContent value="access" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-[14px] font-semibold text-foreground">Access Control Settings</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">System-wide security configuration</p>
              </div>
              <div className="divide-y divide-border">
                {accessControls.map((ctrl) => (
                  <div key={ctrl.label} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{ctrl.label}</p>
                        <p className="text-[12px] text-muted-foreground">{ctrl.desc}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ctrl.valueStyle}`}>
                      {ctrl.value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">IP Allowlist</p>
                      <p className="text-[12px] text-muted-foreground">Restrict access to specific IP addresses</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
