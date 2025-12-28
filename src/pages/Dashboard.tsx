import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Building2,
  CreditCard,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 42000 },
  { month: "Feb", revenue: 45000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 52000 },
  { month: "May", revenue: 58000 },
  { month: "Jun", revenue: 62000 },
  { month: "Jul", revenue: 68000 },
];

const recentTenants = [
  { name: "Acme Financial", status: "active" as const, plan: "Enterprise", users: 156 },
  { name: "TechStart Bank", status: "trial" as const, plan: "Professional", users: 42 },
  { name: "Metro Credit", status: "active" as const, plan: "Enterprise", users: 234 },
  { name: "Coastal Savings", status: "suspended" as const, plan: "Basic", users: 18 },
  { name: "Summit Cooperative", status: "active" as const, plan: "Professional", users: 89 },
];

const systemHealth = [
  { name: "API Services", status: "operational", uptime: "99.98%" },
  { name: "Database", status: "operational", uptime: "99.99%" },
  { name: "Authentication", status: "operational", uptime: "99.97%" },
  { name: "Payment Gateway", status: "degraded", uptime: "98.50%" },
];

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Tenants"
            value="127"
            change="+12% from last month"
            changeType="positive"
            icon={Building2}
          />
          <MetricCard
            title="Active Subscriptions"
            value="118"
            change="92.9% active rate"
            changeType="positive"
            icon={CreditCard}
          />
          <MetricCard
            title="Monthly Revenue"
            value="$68,420"
            change="+9.8% from last month"
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Total Users"
            value="4,892"
            change="+234 this week"
            changeType="positive"
            icon={Users}
          />
        </div>

        {/* Charts and Tables Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Revenue Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Monthly recurring revenue trend
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>+23.5% YTD</span>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
                    axisLine={{ stroke: "hsl(220, 13%, 91%)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
                    axisLine={{ stroke: "hsl(220, 13%, 91%)" }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 13%, 91%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(234, 89%, 54%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Health */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold">System Health</h3>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {systemHealth.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    {service.status === "operational" ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {service.uptime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tenants Table */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-6">
            <h3 className="text-lg font-semibold">Recent Tenants</h3>
            <p className="text-sm text-muted-foreground">
              Latest tenant activity and status
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant Name</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((tenant) => (
                  <tr key={tenant.name}>
                    <td className="font-medium">{tenant.name}</td>
                    <td>
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="text-muted-foreground">{tenant.plan}</td>
                    <td className="text-muted-foreground">{tenant.users}</td>
                    <td className="text-right">
                      <button className="text-sm text-primary hover:underline">
                        View Details
                      </button>
                    </td>
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
