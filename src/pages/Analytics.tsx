import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { DemoDataBanner } from "@/components/ui/DemoDataBanner";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const tenantGrowthData = [
  { month: "Jul", tenants: 98 },
  { month: "Aug", tenants: 104 },
  { month: "Sep", tenants: 108 },
  { month: "Oct", tenants: 112 },
  { month: "Nov", tenants: 118 },
  { month: "Dec", tenants: 122 },
  { month: "Jan", tenants: 124 },
  { month: "Feb", tenants: 127 },
];

const userActivityData = [
  { hour: "00:00", users: 120 },
  { hour: "04:00", users: 85 },
  { hour: "08:00", users: 890 },
  { hour: "12:00", users: 1240 },
  { hour: "16:00", users: 1560 },
  { hour: "20:00", users: 680 },
];

const planDistribution = [
  { name: "Enterprise", value: 45, color: "hsl(234, 89%, 54%)" },
  { name: "Professional", value: 45, color: "hsl(217, 91%, 60%)" },
  { name: "Basic", value: 28, color: "hsl(220, 14%, 70%)" },
  { name: "Trial", value: 9, color: "hsl(38, 92%, 50%)" },
];

const topTenants = [
  { name: "Valley Credit Services", users: 312, growth: "+15%" },
  { name: "Metro Credit Union", users: 234, growth: "+8%" },
  { name: "Acme Financial Corp", users: 156, growth: "+12%" },
  { name: "Summit Cooperative", users: 89, growth: "+22%" },
  { name: "Pine State Bank", users: 45, growth: "-3%" },
];

const performanceMetrics = [
  { name: "API Response Time", value: "142ms", status: "good" },
  { name: "Database Queries", value: "12.4M/day", status: "good" },
  { name: "Error Rate", value: "0.02%", status: "good" },
  { name: "Uptime (30d)", value: "99.97%", status: "good" },
];

export default function Analytics() {
  return (
    <DashboardLayout title= "Platform Analytics" >
    <div className="space-y-6 animate-fade-in" >
      <DemoDataBanner message="All metrics, charts, and tenant activity on this page are demo data. Connect an Analytics API to display live platform statistics." />
        {/* Key Metrics */ }
        < div className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
          <MetricCard
            title="Total Tenants"
  value = "127"
  change = "+12 this month"
  changeType = "positive"
  icon = { Building2 }
    />
    <MetricCard
            title="Active Users"
  value = "4,892"
  change = "+234 this week"
  changeType = "positive"
  icon = { Users }
    />
    <MetricCard
            title="Growth Rate"
  value = "23.5%"
  change = "YoY increase"
  changeType = "positive"
  icon = { TrendingUp }
    />
    <MetricCard
            title="Avg. Session"
  value = "24 min"
  change = "+3 min from last month"
  changeType = "positive"
  icon = { Activity }
    />
    </div>

  {/* Charts Row */ }
  <div className="grid gap-6 lg:grid-cols-2" >
    {/* Tenant Growth */ }
    < div className = "rounded-lg border border-border bg-card p-6" >
      <h3 className="mb-6 text-lg font-semibold" > Tenant Growth </h3>
        < div className = "h-[280px]" >
          <ResponsiveContainer width="100%" height = "100%" >
            <AreaChart data={ tenantGrowthData }>
              <defs>
              <linearGradient id="colorTenants" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                <stop offset="5%" stopColor = "hsl(234, 89%, 54%)" stopOpacity = { 0.2} />
                  <stop offset="95%" stopColor = "hsl(234, 89%, 54%)" stopOpacity = { 0} />
                    </linearGradient>
                    </defs>
                    < CartesianGrid strokeDasharray = "3 3" stroke = "hsl(220, 13%, 91%)" />
                      <XAxis
                    dataKey="month"
  tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }
}
                  />
  < YAxis tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
    < Tooltip
contentStyle = {{
  backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(220, 13%, 91%)",
      borderRadius: "8px",
                    }}
                  />
  < Area
type = "monotone"
dataKey = "tenants"
stroke = "hsl(234, 89%, 54%)"
strokeWidth = { 2}
fill = "url(#colorTenants)"
  />
  </AreaChart>
  </ResponsiveContainer>
  </div>
  </div>

{/* User Activity */ }
<div className="rounded-lg border border-border bg-card p-6" >
  <h3 className="mb-6 text-lg font-semibold" > Daily User Activity </h3>
    < div className = "h-[280px]" >
      <ResponsiveContainer width="100%" height = "100%" >
        <LineChart data={ userActivityData }>
          <CartesianGrid strokeDasharray="3 3" stroke = "hsl(220, 13%, 91%)" />
            <XAxis
                    dataKey="hour"
tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
                  />
  < YAxis tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
    < Tooltip
contentStyle = {{
  backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(220, 13%, 91%)",
      borderRadius: "8px",
                    }}
                  />
  < Line
type = "monotone"
dataKey = "users"
stroke = "hsl(217, 91%, 60%)"
strokeWidth = { 2}
dot = {{ fill: "hsl(217, 91%, 60%)", r: 4 }}
                  />
  </LineChart>
  </ResponsiveContainer>
  </div>
  </div>
  </div>

{/* Plan Distribution & Top Tenants */ }
<div className="grid gap-6 lg:grid-cols-3" >
  {/* Plan Distribution */ }
  < div className = "rounded-lg border border-border bg-card p-6" >
    <h3 className="mb-6 text-lg font-semibold" > Plan Distribution </h3>
      < div className = "h-[200px]" >
        <ResponsiveContainer width="100%" height = "100%" >
          <PieChart>
          <Pie
                    data={ planDistribution }
cx = "50%"
cy = "50%"
innerRadius = { 60}
outerRadius = { 80}
paddingAngle = { 2}
dataKey = "value"
  >
{
  planDistribution.map((entry, index) => (
    <Cell key= {`cell-${index}`} fill = { entry.color } />
                    ))}
</Pie>
  < Tooltip
contentStyle = {{
  backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(220, 13%, 91%)",
      borderRadius: "8px",
                    }}
                  />
  </PieChart>
  </ResponsiveContainer>
  </div>
  < div className = "mt-4 space-y-2" >
    {
      planDistribution.map((plan) => (
        <div key= { plan.name } className = "flex items-center justify-between" >
        <div className="flex items-center gap-2" >
      <div
                      className="h-3 w-3 rounded-full"
                      style = {{ backgroundColor: plan.color }}
    />
    <span className="text-sm" > { plan.name } </span>
      </div>
      < span className = "text-sm font-medium" > { plan.value } </span>
        </div>
              ))}
</div>
  </div>

{/* Top Tenants */ }
<div className="rounded-lg border border-border bg-card p-6" >
  <h3 className="mb-6 text-lg font-semibold" > Top Tenants by Users </h3>
    < div className = "space-y-4" >
    {
      topTenants.map((tenant, index) => (
        <div
                  key= { tenant.name }
                  className = "flex items-center justify-between"
        >
        <div className="flex items-center gap-3" >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium" >
      { index + 1}
      </span>
      < span className = "text-sm font-medium" > { tenant.name } </span>
        </div>
        < div className = "flex items-center gap-2" >
          <span className="text-sm text-muted-foreground" >
            { tenant.users }
            </span>
            < span
className = {`flex items-center text-xs font-medium ${tenant.growth.startsWith("+")
    ? "text-success"
    : "text-destructive"
  }`}
                    >
  {
    tenant.growth.startsWith("+") ? (
      <ArrowUp className= "h-3 w-3" />
                      ) : (
        <ArrowDown className="h-3 w-3" />
                      )}
{ tenant.growth }
</span>
  </div>
  </div>
              ))}
</div>
  </div>

{/* Performance Metrics */ }
<div className="rounded-lg border border-border bg-card p-6" >
  <h3 className="mb-6 text-lg font-semibold" > System Performance </h3>
    < div className = "space-y-4" >
    {
      performanceMetrics.map((metric) => (
        <div
                  key= { metric.name }
                  className = "flex items-center justify-between rounded-lg border border-border bg-background p-3"
        >
        <span className="text-sm text-muted-foreground" >
        { metric.name }
        </span>
      < div className = "flex items-center gap-2" >
      <span className="text-sm font-medium" > { metric.value } </span>
      < span className = "h-2 w-2 rounded-full bg-success" />
      </div>
      </div>
      ))
    }
      </div>
      </div>
      </div>
      </div>
      </DashboardLayout>
  );
}
