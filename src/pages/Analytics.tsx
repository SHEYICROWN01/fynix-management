import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    analyticsApi,
    type AnalyticsPeriod,
} from "@/lib/api";
import { Building2, Users, TrendingUp, Activity, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import {
    AreaChart, Area,
    LineChart, Line,
    XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";

const PLAN_COLORS = [
    "hsl(234, 89%, 54%)",
    "hsl(217, 91%, 60%)",
    "hsl(220, 14%, 70%)",
    "hsl(38, 92%, 50%)",
    "hsl(262, 83%, 58%)",
];

const TOOLTIP_STYLE = {
    contentStyle: {
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "10px",
        fontSize: "12px",
        color: "hsl(var(--foreground))",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
    },
    labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 },
};

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
    { value: "12m", label: "12 months" },
];

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

export default function Analytics() {
    const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
    const growthPeriod: AnalyticsPeriod = "12m";

    const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
        queryKey: ["analytics-summary", period],
        queryFn: () => analyticsApi.getSummary(period),
        staleTime: 2 * 60 * 1000,
    });

    const { data: tenantGrowth, isLoading: loadingGrowth } = useQuery({
        queryKey: ["analytics-tenant-growth", growthPeriod],
        queryFn: () => analyticsApi.getTenantGrowth(growthPeriod),
        staleTime: 5 * 60 * 1000,
    });

    const { data: userActivity, isLoading: loadingActivity } = useQuery({
        queryKey: ["analytics-user-activity", period],
        queryFn: () => analyticsApi.getUserActivity(period),
        staleTime: 2 * 60 * 1000,
    });

    const { data: planDist, isLoading: loadingPlan } = useQuery({
        queryKey: ["analytics-plan-distribution"],
        queryFn: () => analyticsApi.getPlanDistribution(),
        staleTime: 10 * 60 * 1000,
    });

    const { data: topTenants, isLoading: loadingTop } = useQuery({
        queryKey: ["analytics-top-tenants", period],
        queryFn: () => analyticsApi.getTopTenants(period, 5),
        staleTime: 2 * 60 * 1000,
    });

    const { data: sysPerf, isLoading: loadingPerf } = useQuery({
        queryKey: ["analytics-system-performance"],
        queryFn: () => analyticsApi.getSystemPerformance(),
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
    });

    const growthSeries = tenantGrowth?.series ?? [];
    const activityData = userActivity ?? [];
    const planData = (planDist ?? []).map((p, i) => ({
        name: p.plan_name,
        value: p.tenant_count,
        color: PLAN_COLORS[i % PLAN_COLORS.length],
    }));
    const topMax = (topTenants?.[0]?.active_users ?? 1);

    const kpiCards = summary
        ? [
              {
                  title: "Total Tenants",
                  value: summary.total_tenants.value.toLocaleString(),
                  change: `+${summary.total_tenants.change_value} ${summary.total_tenants.label}`,
                  up: summary.total_tenants.direction === "up",
                  icon: Building2,
                  accent: "bg-primary/10",
                  iconColor: "text-primary",
              },
              {
                  title: "Active Users",
                  value: summary.active_users.value.toLocaleString(),
                  change: `+${summary.active_users.change_value} ${summary.active_users.label}`,
                  up: summary.active_users.direction === "up",
                  icon: Users,
                  accent: "bg-emerald-500/10",
                  iconColor: "text-emerald-600 dark:text-emerald-400",
              },
              {
                  title: "Growth Rate",
                  value: `${summary.growth_rate.value}%`,
                  change: summary.growth_rate.label,
                  up: summary.growth_rate.direction === "up",
                  icon: TrendingUp,
                  accent: "bg-violet-500/10",
                  iconColor: "text-violet-600 dark:text-violet-400",
              },
              {
                  title: "Avg. Session",
                  value: `${summary.avg_session_minutes.value} min`,
                  change: `${summary.avg_session_minutes.direction === "up" ? "+" : "-"}${summary.avg_session_minutes.change_value} min ${summary.avg_session_minutes.direction === "up" ? "improvement" : "decrease"}`,
                  up: summary.avg_session_minutes.direction === "up",
                  icon: Activity,
                  accent: "bg-amber-500/10",
                  iconColor: "text-amber-600 dark:text-amber-400",
              },
          ]
        : null;

    const perfRows = sysPerf
        ? [
              { name: "API Response Time", value: `${sysPerf.api_response_time_ms.value}ms`, status: sysPerf.api_response_time_ms.status },
              { name: "Database Queries", value: sysPerf.database_queries_per_day.display, status: sysPerf.database_queries_per_day.status },
              { name: "Error Rate", value: sysPerf.error_rate_percent.display, status: sysPerf.error_rate_percent.status },
              { name: "Uptime (30d)", value: sysPerf.uptime_30d_percent.display, status: sysPerf.uptime_30d_percent.status },
          ]
        : null;

    const overallStatus = sysPerf?.overall_status ?? "operational";
    const statusStyles = {
        operational: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
        degraded: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
        outage: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
    };
    const statusStyle = statusStyles[overallStatus];
    const statusLabel = { operational: "All systems operational", degraded: "Degraded performance", outage: "Service disruption" }[overallStatus];

    const metricDotColor = (status: string) => {
        if (status === "warning") return "bg-amber-500";
        if (status === "critical") return "bg-rose-500";
        return "bg-emerald-500";
    };

    return (
        <DashboardLayout title="Platform Analytics">
            <div className="space-y-5">
                {/* Header + Period selector */}
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground/70">
                            QuovaTech BOC · Insights
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Platform Analytics</h1>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                            Tenant growth, user activity, and system performance metrics
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 rounded-lg bg-muted/60 border border-border p-1">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
                                        period === opt.value
                                            ? "bg-card shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => refetchSummary()}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {loadingSummary || !kpiCards
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="rounded-xl border border-border bg-card p-5">
                                  <div className="flex items-center justify-between mb-3">
                                      <Skeleton className="h-9 w-9" />
                                      <Skeleton className="h-4 w-10" />
                                  </div>
                                  <Skeleton className="h-7 w-24 mb-1" />
                                  <Skeleton className="h-3 w-20 mb-1" />
                                  <Skeleton className="h-3 w-28" />
                              </div>
                          ))
                        : kpiCards.map((card) => {
                              const Icon = card.icon;
                              return (
                                  <div key={card.title} className="rounded-xl border border-border bg-card p-5">
                                      <div className="flex items-center justify-between mb-3">
                                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.accent}`}>
                                              <Icon className={`h-4 w-4 ${card.iconColor}`} />
                                          </div>
                                          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${card.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                              {card.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                              {card.up ? "Up" : "Down"}
                                          </span>
                                      </div>
                                      <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{card.value}</p>
                                      <p className="text-[12px] text-muted-foreground mt-1">{card.title}</p>
                                      <p className={`text-[11px] mt-1 font-medium ${card.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                          {card.change}
                                      </p>
                                  </div>
                              );
                          })}
                </div>

                {/* Charts Row */}
                <div className="grid gap-5 lg:grid-cols-2">
                    {/* Tenant Growth */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-4">
                            <h3 className="text-[14px] font-semibold text-foreground">Tenant Growth</h3>
                            <p className="text-[12px] text-muted-foreground mt-0.5">Cumulative institutions on the platform</p>
                        </div>
                        <div className="h-[220px]">
                            {loadingGrowth ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthSeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gTenants" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="hsl(234, 89%, 54%)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                                        <Tooltip {...TOOLTIP_STYLE} />
                                        <Area type="monotone" dataKey="total" name="Tenants" stroke="hsl(234, 89%, 54%)" strokeWidth={2} fill="url(#gTenants)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Daily User Activity */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-4">
                            <h3 className="text-[14px] font-semibold text-foreground">Daily User Activity</h3>
                            <p className="text-[12px] text-muted-foreground mt-0.5">Avg. active users across all institutions by hour (WAT)</p>
                        </div>
                        <div className="h-[220px]">
                            {loadingActivity ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} interval={3} />
                                        <YAxis tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                                        <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString(), "Avg. Users"]} />
                                        <Line type="monotone" dataKey="avg_users" name="Avg. Users" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: "hsl(217, 91%, 60%)", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Plan Distribution */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-4">
                            <h3 className="text-[14px] font-semibold text-foreground">Plan Distribution</h3>
                            <p className="text-[12px] text-muted-foreground mt-0.5">Tenants by subscription plan</p>
                        </div>
                        {loadingPlan ? (
                            <div className="space-y-3">
                                <Skeleton className="h-[160px] w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ) : (
                            <>
                                <div className="h-[160px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                                                {planData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, _n: string, props: { payload?: { name: string } }) => [v, props.payload?.name ?? ""]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {planData.map((plan) => (
                                        <div key={plan.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: plan.color }} />
                                                <span className="text-[12px] text-muted-foreground">{plan.name}</span>
                                            </div>
                                            <span className="text-[12px] font-semibold text-foreground">{plan.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Top Tenants */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-4">
                            <h3 className="text-[14px] font-semibold text-foreground">Top Tenants by Users</h3>
                            <p className="text-[12px] text-muted-foreground mt-0.5">Most active institutions this period</p>
                        </div>
                        <div className="space-y-3">
                            {loadingTop
                                ? Array.from({ length: 5 }).map((_, i) => (
                                      <div key={i} className="flex items-center gap-3">
                                          <Skeleton className="h-6 w-6 rounded-full" />
                                          <div className="flex-1 space-y-1.5">
                                              <Skeleton className="h-3 w-3/4" />
                                              <Skeleton className="h-1.5 w-full rounded-full" />
                                          </div>
                                          <Skeleton className="h-8 w-10" />
                                      </div>
                                  ))
                                : (topTenants ?? []).map((tenant, i) => (
                                      <div key={tenant.tenant_id} className="flex items-center gap-3">
                                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                              {i + 1}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                              <p className="text-[12px] font-medium text-foreground truncate">{tenant.tenant_name}</p>
                                              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                                  <div
                                                      className="h-full rounded-full bg-primary/60"
                                                      style={{ width: `${(tenant.active_users / topMax) * 100}%` }}
                                                  />
                                              </div>
                                          </div>
                                          <div className="shrink-0 text-right">
                                              <p className="text-[12px] font-semibold text-foreground">{tenant.active_users.toLocaleString()}</p>
                                              <p className={`text-[10px] font-medium ${tenant.direction === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                  {tenant.direction === "up" ? "+" : "-"}{tenant.active_users_change_percent}%
                                              </p>
                                          </div>
                                      </div>
                                  ))}
                        </div>
                    </div>

                    {/* System Performance */}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-4">
                            <h3 className="text-[14px] font-semibold text-foreground">System Performance</h3>
                            <p className="text-[12px] text-muted-foreground mt-0.5">Real-time platform health indicators</p>
                        </div>
                        <div className="space-y-3">
                            {loadingPerf || !perfRows
                                ? Array.from({ length: 4 }).map((_, i) => (
                                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                                  ))
                                : perfRows.map((metric) => (
                                      <div key={metric.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
                                          <span className="text-[12px] text-muted-foreground">{metric.name}</span>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[12px] font-semibold text-foreground font-mono">{metric.value}</span>
                                              <span className={`h-2 w-2 rounded-full ${metricDotColor(metric.status)}`} />
                                          </div>
                                      </div>
                                  ))}
                        </div>
                        {!loadingPerf && sysPerf && (
                            <div className={`mt-4 rounded-lg border px-3.5 py-2.5 flex items-center justify-between ${statusStyle.bg}`}>
                                <span className={`text-[12px] font-medium ${statusStyle.text}`}>{statusLabel}</span>
                                <span className={`h-2 w-2 rounded-full animate-pulse ${statusStyle.dot}`} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
