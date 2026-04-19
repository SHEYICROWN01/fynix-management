import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DemoDataBanner } from "@/components/ui/DemoDataBanner";
import { api } from "@/lib/api";
import type { Tenant } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import {
  Building2,
  CreditCard,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Zap,
  Target,
  Award,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 42000, expenses: 28000 },
  { month: "Feb", revenue: 45000, expenses: 29000 },
  { month: "Mar", revenue: 48000, expenses: 30000 },
  { month: "Apr", revenue: 52000, expenses: 31000 },
  { month: "May", revenue: 58000, expenses: 32000 },
  { month: "Jun", revenue: 62000, expenses: 33000 },
  { month: "Jul", revenue: 68000, expenses: 34000 },
];

const planDistribution = [
  { name: "Enterprise", value: 45, color: "hsl(234, 89%, 54%)" },
  { name: "Professional", value: 45, color: "hsl(168, 76%, 42%)" },
  { name: "Basic", value: 37, color: "hsl(48, 96%, 53%)" },
];

const weeklyActivity = [
  { day: "Mon", logins: 245, transactions: 1890 },
  { day: "Tue", logins: 312, transactions: 2240 },
  { day: "Wed", logins: 298, transactions: 2100 },
  { day: "Thu", logins: 335, transactions: 2450 },
  { day: "Fri", logins: 378, transactions: 2680 },
  { day: "Sat", logins: 156, transactions: 980 },
  { day: "Sun", logins: 134, transactions: 850 },
];

const recentTenants = [
  { name: "Acme Financial", status: "active" as const, plan: "Enterprise", users: 156, growth: "+12%" },
  { name: "TechStart Bank", status: "trial" as const, plan: "Professional", users: 42, growth: "New" },
  { name: "Metro Credit", status: "active" as const, plan: "Enterprise", users: 234, growth: "+8%" },
  { name: "Coastal Savings", status: "suspended" as const, plan: "Basic", users: 18, growth: "-5%" },
  { name: "Summit Cooperative", status: "active" as const, plan: "Professional", users: 89, growth: "+15%" },
];

const quickStats = [
  { label: "Trial Conversions", value: "87.5%", trend: "up", change: "+5.2%" },
  { label: "Avg. Revenue/Tenant", value: "₦538K", trend: "up", change: "+12%" },
  { label: "Churn Rate", value: "2.1%", trend: "down", change: "-0.8%" },
  { label: "Support Tickets", value: "23", trend: "down", change: "-15%" },
];

export default function Dashboard() {
  const [totalTenants, setTotalTenants] = useState<number | null>(null);
  const [activeTenants, setActiveTenants] = useState<number | null>(null);
  const [totalModules, setTotalModules] = useState<number | null>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [tenantsRes, modulesRes] = await Promise.all([
          api.listTenants({ per_page: 5, page: 1 }),
          api.listModules({ per_page: 1 }),
        ]);
        setTotalTenants(tenantsRes.pagination.total);
        setActiveTenants(
          tenantsRes.data.filter((t: Tenant) => t.status === "active").length
        );
        setRecentTenants(tenantsRes.data);
        setTotalModules(modulesRes.pagination.total);
      } catch (err: unknown) {
        console.error("Dashboard load error:", getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dotPattern = {
    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
    backgroundSize: '40px 40px'
  };

  return (
    <DashboardLayout title= "Dashboard" >
    <div className="space-y-6 animate-fade-in" >
      {/* Welcome Banner with Gradient */ }
      < div className = "relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-lg" >
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10" >
          <div className="h-full w-full" style = { dotPattern } />
            </div>
            < div className = "relative z-10 flex items-center justify-between" >
              <div className="space-y-2" >
                <div className="flex items-center gap-2" >
                  <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90" > Welcome back! </span>
                      </div>
                      < h2 className = "text-3xl font-bold" > Platform Overview </h2>
                        < p className = "text-sm opacity-90" > { formattedDate } </p>
                          </div>
                          < Button
  variant = "secondary"
  className = "hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
    >
    <Calendar className="h-4 w-4" />
      View Reports
        </Button>
        </div>
        </div>

  {/* Main Metrics Grid */ }
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
    <MetricCard
            title="Total Tenants"
  value = { isLoading? "—": String(totalTenants ?? 0) }
  change = "Live from API"
  changeType = "positive"
  icon = { Building2 }
    />
    <MetricCard
            title="Active Tenants"
  value = { isLoading? "—": String(activeTenants ?? 0) }
  change = "Current page sample"
  changeType = "positive"
  icon = { CreditCard }
    />
    <MetricCard
            title="Total Modules"
  value = { isLoading? "—": String(totalModules ?? 0) }
  change = "Live from API"
  changeType = "positive"
  icon = { DollarSign }
    />
    <MetricCard
            title="Total Users"
  value = "—"
  change = "API coming soon"
  changeType = "neutral"
  icon = { Users }
    />
    </div>

  {/* Demo data warning for all charts / stats below */ }
  <DemoDataBanner message="Revenue, activity charts, quick stats, and plan distribution below use demo data. A dedicated analytics API endpoint is needed to display live figures." />

    {/* Quick Stats Grid */ }
    < div className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
    {
      quickStats.map((stat, index) => (
        <div
              key= { index }
              className = "relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-1"
        >
        <div className="flex items-start justify-between" >
      <div className="space-y-1" >
      <p className="text-sm text-muted-foreground" > { stat.label } </p>
      < p className = "text-2xl font-bold" > { stat.value } </p>
      </div>
      < div className = {`rounded-full p-2 ${stat.trend === "up"
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
        }`} >
      {
        stat.trend === "up" ? (
          <ArrowUpRight className= "h-4 w-4" />
                  ) : (
            <ArrowDownRight className="h-4 w-4" />
                  )
}
</div>
  </div>
  < div className = "mt-3 flex items-center gap-1 text-sm" >
    <span className={ stat.trend === "up" ? "text-success" : "text-destructive" }>
      { stat.change }
      </span>
      < span className = "text-muted-foreground" > vs last period </span>
        </div>
        </div>
          ))}
</div>

{/* Charts Row */ }
<div className="grid gap-6 lg:grid-cols-3" >
  {/* Revenue vs Expenses Chart */ }
  < div className = "lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm" >
    <div className="mb-6 flex items-center justify-between" >
      <div>
      <h3 className="text-lg font-semibold" > Revenue & Expenses </h3>
        < p className = "text-sm text-muted-foreground" >
          Financial performance over the last 7 months
            </p>
            </div>
            < div className = "flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success" >
              <TrendingUp className="h-4 w-4" />
                <span>+23.5 % Growth </span>
                </div>
                </div>
                < div className = "h-[300px]" >
                  <ResponsiveContainer width="100%" height = "100%" >
                    <AreaChart data={ revenueData }>
                      <defs>
                      <linearGradient id="colorRevenue" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                        <stop offset="5%" stopColor = "hsl(234, 89%, 54%)" stopOpacity = { 0.3} />
                          <stop offset="95%" stopColor = "hsl(234, 89%, 54%)" stopOpacity = { 0} />
                            </linearGradient>
                            < linearGradient id = "colorExpenses" x1 = "0" y1 = "0" x2 = "0" y2 = "1" >
                              <stop offset="5%" stopColor = "hsl(0, 84%, 60%)" stopOpacity = { 0.3} />
                                <stop offset="95%" stopColor = "hsl(0, 84%, 60%)" stopOpacity = { 0} />
                                  </linearGradient>
                                  </defs>
                                  < CartesianGrid strokeDasharray = "3 3" stroke = "hsl(220, 13%, 91%)" />
                                    <XAxis
                    dataKey="month"
tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
axisLine = {{ stroke: "hsl(220, 13%, 91%)" }}
                  />
  < YAxis
tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
axisLine = {{ stroke: "hsl(220, 13%, 91%)" }}
tickFormatter = {(value) => `₦${value / 1000}k`}
                  />
  < Tooltip
contentStyle = {{
  backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(220, 13%, 91%)",
      borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
formatter = {(value: number) => `₦${value.toLocaleString()}`}
                  />
  < Legend
verticalAlign = "top"
height = { 36}
iconType = "circle"
  />
  <Area
                    type="monotone"
dataKey = "revenue"
stroke = "hsl(234, 89%, 54%)"
strokeWidth = { 2}
fillOpacity = { 1}
fill = "url(#colorRevenue)"
name = "Revenue"
  />
  <Area
                    type="monotone"
dataKey = "expenses"
stroke = "hsl(0, 84%, 60%)"
strokeWidth = { 2}
fillOpacity = { 1}
fill = "url(#colorExpenses)"
name = "Expenses"
  />
  </AreaChart>
  </ResponsiveContainer>
  </div>
  </div>

{/* Plan Distribution Pie Chart */ }
<div className="rounded-lg border border-border bg-card p-6 shadow-sm" >
  <div className="mb-4 flex items-center justify-between" >
    <h3 className="text-lg font-semibold" > Plan Distribution </h3>
      < Target className = "h-5 w-5 text-muted-foreground" />
        </div>
        < div className = "h-[220px]" >
          <ResponsiveContainer width="100%" height = "100%" >
            <PieChart>
            <Pie
                    data={ planDistribution }
cx = "50%"
cy = "50%"
innerRadius = { 60}
outerRadius = { 80}
paddingAngle = { 5}
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
  < div className = "mt-4 space-y-3" >
    {
      planDistribution.map((plan, index) => (
        <div key= { index } className = "flex items-center justify-between" >
        <div className="flex items-center gap-2" >
      <div 
                      className="h-3 w-3 rounded-full" 
                      style = {{ backgroundColor: plan.color }}
    />
    <span className="text-sm text-muted-foreground" > { plan.name } </span>
      </div>
      < span className = "text-sm font-medium" > { plan.value } tenants </span>
        </div>
              ))}
</div>
  </div>
  </div>

{/* Weekly Activity Chart */ }
<div className="rounded-lg border border-border bg-card p-6 shadow-sm" >
  <div className="mb-6 flex items-center justify-between" >
    <div>
    <h3 className="text-lg font-semibold" > Weekly Activity </h3>
      < p className = "text-sm text-muted-foreground" >
        User logins and transaction volumes
          </p>
          </div>
          < div className = "flex items-center gap-2" >
            <Zap className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium text-warning" > Peak: Friday </span>
                </div>
                </div>
                < div className = "h-[280px]" >
                  <ResponsiveContainer width="100%" height = "100%" >
                    <BarChart data={ weeklyActivity }>
                      <CartesianGrid strokeDasharray="3 3" stroke = "hsl(220, 13%, 91%)" />
                        <XAxis
                  dataKey="day"
tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
axisLine = {{ stroke: "hsl(220, 13%, 91%)" }}
                />
  < YAxis
tick = {{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }}
axisLine = {{ stroke: "hsl(220, 13%, 91%)" }}
                />
  < Tooltip
contentStyle = {{
  backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(220, 13%, 91%)",
      borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
formatter = {(value: number) => value.toLocaleString()}
                />
  < Legend
verticalAlign = "top"
height = { 36}
iconType = "circle"
  />
  <Bar 
                  dataKey="logins"
fill = "hsl(168, 76%, 42%)"
radius = { [8, 8, 0, 0]}
name = "User Logins"
  />
  <Bar 
                  dataKey="transactions"
fill = "hsl(234, 89%, 54%)"
radius = { [8, 8, 0, 0]}
name = "Transactions"
  />
  </BarChart>
  </ResponsiveContainer>
  </div>
  </div>

{/* Recent Tenants Table with Enhanced Design */ }
<div className="rounded-lg border border-border bg-card shadow-sm" >
  <div className="border-b border-border p-6" >
    <div className="flex items-center justify-between" >
      <div>
      <h3 className="text-lg font-semibold" > Recent Tenants </h3>
        < p className = "text-sm text-muted-foreground" >
          Latest tenant activity and performance
            </p>
            </div>
            < Button variant = "outline" size = "sm" className = "gap-2" >
              <Award className="h-4 w-4" />
                View All
                  </Button>
                  </div>
                  </div>
                  < div className = "overflow-x-auto" >
                    {
                      isLoading?(
              <div className = "p-8 text-center text-sm text-muted-foreground" > Loading tenants…</ div >
            ) : recentTenants.length === 0 ? (
  <div className= "p-8 text-center text-sm text-muted-foreground" > No tenants found.</div>
            ) : (
  <table className= "data-table" >
  <thead>
  <tr>
  <th>Tenant Name </th>
    < th > Status </th>
    < th > Subdomain </th>
    < th > Created </th>
    < th className = "text-right" > Actions </th>
      </tr>
      </thead>
      <tbody>
{
  recentTenants.map((tenant) => (
    <tr key= { tenant.id } className = "hover:bg-muted/50 transition-colors" >
    <td className="font-medium" > { tenant.name } </td>
    < td >
  <StatusBadge status={ tenant.status as "active" | "suspended" | "trial" } />
  </td>
  < td className = "text-muted-foreground font-mono text-xs" > { tenant.subdomain } </td>
  < td className = "text-muted-foreground" >
  <div className="flex items-center gap-2" >
  <Clock className="h-3.5 w-3.5" />
  { new Date(tenant.created_at).toLocaleDateString() }
  </div>
  </td>
  < td className = "text-right" >
  <Button variant="ghost" size = "sm" className = "text-primary hover:text-primary/80" >
  View Details
  </Button>
  </td>
  </tr>
  ))
}
</tbody>
  </table>
            )}
</div>
  </div>
  </div>
  </DashboardLayout>
  );
}
