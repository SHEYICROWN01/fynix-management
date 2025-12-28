import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Settings,
  Key,
  Download,
} from "lucide-react";

const auditLogs = [
  {
    id: "1",
    action: "Tenant suspended",
    actor: "John Doe",
    target: "Coastal Savings Bank",
    category: "tenant",
    timestamp: "Mar 12, 2024 14:32:18",
    ip: "192.168.1.1",
    severity: "warning",
  },
  {
    id: "2",
    action: "System admin added",
    actor: "John Doe",
    target: "sarah.johnson@fynix.com",
    category: "admin",
    timestamp: "Mar 12, 2024 11:15:42",
    ip: "192.168.1.1",
    severity: "info",
  },
  {
    id: "3",
    action: "Plan pricing updated",
    actor: "Jane Smith",
    target: "Professional Plan",
    category: "billing",
    timestamp: "Mar 11, 2024 16:45:03",
    ip: "192.168.1.2",
    severity: "info",
  },
  {
    id: "4",
    action: "Tenant reactivated",
    actor: "John Doe",
    target: "TechStart Bank",
    category: "tenant",
    timestamp: "Mar 11, 2024 10:22:51",
    ip: "192.168.1.1",
    severity: "info",
  },
  {
    id: "5",
    action: "Failed login attempt",
    actor: "unknown",
    target: "admin@fynix.com",
    category: "security",
    timestamp: "Mar 10, 2024 23:14:07",
    ip: "203.45.67.89",
    severity: "error",
  },
  {
    id: "6",
    action: "API key rotated",
    actor: "System",
    target: "Production API",
    category: "security",
    timestamp: "Mar 10, 2024 08:00:00",
    ip: "Internal",
    severity: "info",
  },
  {
    id: "7",
    action: "New tenant created",
    actor: "Jane Smith",
    target: "Horizon Finance Group",
    category: "tenant",
    timestamp: "Mar 09, 2024 14:55:22",
    ip: "192.168.1.2",
    severity: "info",
  },
];

const securityEvents = [
  {
    id: "1",
    type: "Failed Login",
    description: "Multiple failed login attempts detected",
    source: "203.45.67.89",
    timestamp: "Mar 10, 2024 23:14:07",
    status: "resolved",
  },
  {
    id: "2",
    type: "Unusual Activity",
    description: "API rate limit exceeded",
    source: "Acme Financial Corp",
    timestamp: "Mar 08, 2024 15:30:00",
    status: "resolved",
  },
  {
    id: "3",
    type: "Permission Change",
    description: "Admin role modified",
    source: "System",
    timestamp: "Mar 05, 2024 09:12:33",
    status: "reviewed",
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "tenant":
      return Building2;
    case "admin":
      return User;
    case "billing":
      return Settings;
    case "security":
      return Key;
    default:
      return Shield;
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "error":
      return "bg-destructive/10 text-destructive";
    case "warning":
      return "bg-warning/10 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Security() {
  return (
    <DashboardLayout title="Security & Audit Logs">
      <div className="space-y-6 animate-fade-in">
        {/* Security Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-success/10 p-3">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">Secure</p>
              <p className="text-sm text-muted-foreground">System Status</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">1,247</p>
              <p className="text-sm text-muted-foreground">Events Today</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-warning/10 p-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">0</p>
              <p className="text-sm text-muted-foreground">Active Threats</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="rounded-lg bg-muted p-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold">30 days</p>
              <p className="text-sm text-muted-foreground">Log Retention</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security Events</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search logs..." className="w-64 pl-9" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Target</th>
                      <th>Category</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const CategoryIcon = getCategoryIcon(log.category);
                      return (
                        <tr key={log.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${getSeverityStyles(
                                  log.severity
                                )}`}
                              >
                                <CategoryIcon className="h-3 w-3" />
                              </span>
                              <span className="font-medium">{log.action}</span>
                            </div>
                          </td>
                          <td className="text-muted-foreground">{log.actor}</td>
                          <td className="text-muted-foreground">{log.target}</td>
                          <td>
                            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
                              {log.category}
                            </span>
                          </td>
                          <td className="font-mono text-sm text-muted-foreground">
                            {log.ip}
                          </td>
                          <td className="text-muted-foreground">
                            {log.timestamp}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-6">
                <h3 className="text-lg font-semibold">Security Events</h3>
                <p className="text-sm text-muted-foreground">
                  Unusual activities and potential security threats
                </p>
              </div>
              <div className="divide-y divide-border">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-6">
                    <div
                      className={`rounded-lg p-2 ${
                        event.status === "resolved"
                          ? "bg-success/10"
                          : "bg-muted"
                      }`}
                    >
                      {event.status === "resolved" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <Shield className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{event.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                            event.status === "resolved"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Source: {event.source}</span>
                        <span>•</span>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Access Control Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all system admins
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                    Enabled
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <span className="text-sm font-medium">30 minutes</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">IP Allowlist</p>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Password Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Minimum requirements for passwords
                    </p>
                  </div>
                  <span className="text-sm font-medium">Strong</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
