import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import type { HealthCheckResponse, DetailedHealthCheck } from "@/lib/api";
import { toast as showToast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import {
    Activity,
    Server,
    Database,
    HardDrive,
    MemoryStick,
    RefreshCw,
    Wifi,
    WifiOff,
    Clock,
    Gauge,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Building2,
    FileText,
    Layers,
    Cpu,
    Loader2,
} from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StatusIcon({ status }: { status: string }) {
    if (status === "connected" || status === "ok" || status === "writable" || status === "configured") {
        return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    if (status === "degraded" || status === "sync") {
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
}

function ServiceStatusRow({ label, status, icon: Icon, detail }: {
    label: string;
    status: string;
    icon: React.ElementType;
    detail?: string;
}) {
    return (
        <div className= "flex items-center justify-between py-3 border-b border-border last:border-0" >
        <div className="flex items-center gap-3" >
            <div className="rounded-lg bg-primary/10 p-2" >
                <Icon className="h-4 w-4 text-primary" />
                    </div>
                    < div >
                    <p className="text-sm font-medium" > { label } </p>
    { detail && <p className="text-xs text-muted-foreground" > { detail } </p> }
    </div>
        </div>
        < div className = "flex items-center gap-2" >
            <StatusIcon status={ status } />
                < span className = "text-sm capitalize" > { status } </span>
                    </div>
                    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function SystemHealth() {
    const [basicHealth, setBasicHealth] = useState<HealthCheckResponse | null>(null);
    const [detailedHealth, setDetailedHealth] = useState<DetailedHealthCheck | null>(null);
    const [isLoadingBasic, setIsLoadingBasic] = useState(true);
    const [isLoadingDetailed, setIsLoadingDetailed] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch basic health (public)
    const fetchBasicHealth = useCallback(async () => {
        try {
            const data = await api.getHealthCheck();
            setBasicHealth(data);
        } catch {
            setBasicHealth(null);
        } finally {
            setIsLoadingBasic(false);
        }
    }, []);

    // Fetch detailed health (authenticated)
    const fetchDetailedHealth = useCallback(async () => {
        try {
            setIsLoadingDetailed(true);
            const data = await api.getDetailedHealth();
            setDetailedHealth(data);
        } catch (error: unknown) {
            console.error("Detailed health error:", error);
            const apiError = error as Record<string, unknown>;
            // Only show toast for unexpected errors, not auth issues or rate limits
            if (apiError?.code !== "RATE_LIMIT_EXCEEDED" && !String(apiError?.message ?? "").includes("Unauthorized")) {
                showToast.error(getErrorMessage(error) || "Failed to load detailed health metrics");
            }
        } finally {
            setIsLoadingDetailed(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchBasicHealth();
        fetchDetailedHealth();
    }, [fetchBasicHealth, fetchDetailedHealth]);

    // Auto-poll basic health every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchBasicHealth();
            setLastRefreshed(new Date());
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, fetchBasicHealth]);

    // Manual refresh
    const handleRefresh = () => {
        setIsLoadingBasic(true);
        setIsLoadingDetailed(true);
        fetchBasicHealth();
        fetchDetailedHealth();
        setLastRefreshed(new Date());
        showToast.success("Health data refreshed");
    };

    // Parse disk usage percentage for progress bar
    const diskUsedPercent = detailedHealth?.checks?.disk?.used_pct
        ? parseFloat(detailedHealth.checks.disk.used_pct.replace("%", ""))
        : 0;

    // Parse memory for display
    const memCurrent = detailedHealth?.checks?.memory?.current || "—";
    const memPeak = detailedHealth?.checks?.memory?.peak || "—";
    const memLimit = detailedHealth?.checks?.memory?.limit || "—";

    // Overall status
    const overallStatus = basicHealth?.status || "unknown";
    const isOnline = overallStatus === "ok";
    const isDegraded = overallStatus === "degraded";

    return (
        <DashboardLayout title= "System Monitoring" >
        <div className="space-y-6 animate-fade-in" >
            {/* Header / Status Banner */ }
            < div className = {`relative overflow-hidden rounded-xl p-6 text-white shadow-lg ${isOnline
                ? "bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500"
                : isDegraded
                    ? "bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500"
                    : "bg-gradient-to-br from-red-600 via-red-500 to-rose-500"
                }`
}>
    <div className="flex items-center justify-between" >
        <div className="flex items-center gap-4" >
            <div className="rounded-full bg-white/20 p-3" >
                {
                    isOnline?(
                  <Wifi className = "h-7 w-7" />
                ): isDegraded ? (
                        <AlertTriangle className="h-7 w-7" />
                ) : (
    <WifiOff className= "h-7 w-7" />
                )}
</div>
    < div >
    <h2 className="text-2xl font-bold" >
        { isOnline? "All Systems Operational": isDegraded ? "System Degraded" : "System Offline" }
        </h2>
        < p className = "text-white/80 text-sm mt-1" >
            Uptime: { basicHealth?.uptime || "—" } • Last checked: { " " }
{ lastRefreshed.toLocaleTimeString() }
</p>
    </div>
    </div>
    < div className = "flex items-center gap-3" >
        <Button
                variant="secondary"
size = "sm"
onClick = {() => setAutoRefresh(!autoRefresh)}
className = "bg-white/20 hover:bg-white/30 text-white border-0"
    >
    { autoRefresh? "Auto-refresh ON": "Auto-refresh OFF" }
    </Button>
    < Button
variant = "secondary"
size = "sm"
onClick = { handleRefresh }
disabled = { isLoadingBasic && isLoadingDetailed}
className = "bg-white/20 hover:bg-white/30 text-white border-0"
    >
    <RefreshCw className={ `h-4 w-4 mr-2 ${(isLoadingBasic || isLoadingDetailed) ? "animate-spin" : ""}` } />
Refresh
    </Button>
    </div>
    </div>
    </div>

{/* Quick Service Checks (from basic health) */ }
{
    basicHealth && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
            <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3" >
                <div className={ `rounded-full p-2 ${basicHealth.checks.system_db === "connected" ? "bg-success/10" : "bg-destructive/10"}` }>
                    <Database className={ `h-5 w-5 ${basicHealth.checks.system_db === "connected" ? "text-success" : "text-destructive"}` } />
                        </div>
                        < div >
                        <p className="text-sm font-medium" > Database </p>
                            < p className = {`text-xs capitalize ${basicHealth.checks.system_db === "connected" ? "text-success" : "text-destructive"}`
}>
    { basicHealth.checks.system_db }
    </p>
    </div>
    </div>

    < div className = "rounded-lg border border-border bg-card p-4 flex items-center gap-3" >
        <div className={ `rounded-full p-2 ${basicHealth.checks.cache === "connected" ? "bg-success/10" : "bg-destructive/10"}` }>
            <Cpu className={ `h-5 w-5 ${basicHealth.checks.cache === "connected" ? "text-success" : "text-destructive"}` } />
                </div>
                < div >
                <p className="text-sm font-medium" > Cache </p>
                    < p className = {`text-xs capitalize ${basicHealth.checks.cache === "connected" ? "text-success" : "text-destructive"}`}>
                        { basicHealth.checks.cache }
                        </p>
                        </div>
                        </div>

                        < div className = "rounded-lg border border-border bg-card p-4 flex items-center gap-3" >
                            <div className={ `rounded-full p-2 ${basicHealth.checks.queue === "configured" ? "bg-success/10" : "bg-warning/10"}` }>
                                <Layers className={ `h-5 w-5 ${basicHealth.checks.queue === "configured" ? "text-success" : "text-warning"}` } />
                                    </div>
                                    < div >
                                    <p className="text-sm font-medium" > Queue </p>
                                        < p className = {`text-xs capitalize ${basicHealth.checks.queue === "configured" ? "text-success" : "text-warning"}`}>
                                            { basicHealth.checks.queue }
                                            </p>
                                            </div>
                                            </div>

                                            < div className = "rounded-lg border border-border bg-card p-4 flex items-center gap-3" >
                                                <div className={ `rounded-full p-2 ${basicHealth.checks.storage === "writable" ? "bg-success/10" : "bg-destructive/10"}` }>
                                                    <HardDrive className={ `h-5 w-5 ${basicHealth.checks.storage === "writable" ? "text-success" : "text-destructive"}` } />
                                                        </div>
                                                        < div >
                                                        <p className="text-sm font-medium" > Storage </p>
                                                            < p className = {`text-xs capitalize ${basicHealth.checks.storage === "writable" ? "text-success" : "text-destructive"}`}>
                                                                { basicHealth.checks.storage }
                                                                </p>
                                                                </div>
                                                                </div>
                                                                </div>
        )}

{/* Detailed Metrics */ }
{
    isLoadingDetailed ? (
        <div className= "flex items-center justify-center py-16" >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground" > Loading detailed metrics…</span>
                </div>
        ) : detailedHealth ? (
        <>
        {/* Top Metric Cards */ }
        < div className = "grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
            <MetricCard
                title="Response Time"
    value = { detailedHealth.response_time }
    change = "API latency"
    changeType = "neutral"
    icon = { Gauge }
        />
        <MetricCard
                title="DB Latency"
    value = { detailedHealth.checks.system_db.latency }
    change = {`Status: ${detailedHealth.checks.system_db.status}`
}
changeType = { detailedHealth.checks.system_db.status === "connected" ? "positive" : "negative" }
icon = { Database }
    />
    <MetricCard
                title="Total Tenants"
value = { detailedHealth.checks.tenants.total.toString() }
change = {`${detailedHealth.checks.tenants.active} active`}
changeType = "positive"
icon = { Building2 }
    />
    <MetricCard
                title="Cache Latency"
value = { detailedHealth.checks.cache.latency }
change = {`Driver: ${detailedHealth.checks.cache.driver}`}
changeType = { detailedHealth.checks.cache.status === "connected" ? "positive" : "negative" }
icon = { Activity }
    />
    </div>

{/* Disk & Memory & Services - Two Columns */ }
<div className="grid gap-6 lg:grid-cols-2" >
    {/* Disk Usage */ }
    < div className = "rounded-lg border border-border bg-card p-6" >
        <div className="flex items-center gap-3 mb-6" >
            <div className="rounded-lg bg-primary/10 p-2" >
                <HardDrive className="h-5 w-5 text-primary" />
                    </div>
                    < div >
                    <h3 className="text-lg font-semibold" > Disk Usage </h3>
                        < p className = "text-sm text-muted-foreground" >
                            { detailedHealth.checks.disk.free } free of { detailedHealth.checks.disk.total }
</p>
    </div>
    </div>
    < div className = "space-y-3" >
        <div className="flex items-center justify-between text-sm" >
            <span className="text-muted-foreground" > Used </span>
                < span className = "font-medium" > { detailedHealth.checks.disk.used_pct } </span>
                    </div>
                    < Progress
value = { diskUsedPercent }
className = "h-3"
    />
    <div className="flex items-center justify-between text-xs text-muted-foreground" >
        <span>0 % </span>
        <span>
{
    diskUsedPercent > 80 ? (
        <Badge variant= "destructive" className = "text-xs" > High Usage </Badge>
                      ) : diskUsedPercent > 60 ? (
        <Badge className= "bg-warning/10 text-warning text-xs" > Moderate </Badge>
                      ) : (
        <Badge className= "bg-success/10 text-success text-xs" > Healthy </Badge>
                      )
}
</span>
    < span > 100 % </span>
    </div>
    </div>
    </div>

{/* Memory Usage */ }
<div className="rounded-lg border border-border bg-card p-6" >
    <div className="flex items-center gap-3 mb-6" >
        <div className="rounded-lg bg-primary/10 p-2" >
            <MemoryStick className="h-5 w-5 text-primary" />
                </div>
                < div >
                <h3 className="text-lg font-semibold" > Memory Usage </h3>
                    < p className = "text-sm text-muted-foreground" >
                        Limit: { memLimit }
</p>
    </div>
    </div>
    < div className = "grid grid-cols-2 gap-4" >
        <div className="rounded-lg bg-muted/50 p-4 text-center" >
            <p className="text-2xl font-semibold" > { memCurrent } </p>
                < p className = "text-xs text-muted-foreground mt-1" > Current </p>
                    </div>
                    < div className = "rounded-lg bg-muted/50 p-4 text-center" >
                        <p className="text-2xl font-semibold" > { memPeak } </p>
                            < p className = "text-xs text-muted-foreground mt-1" > Peak </p>
                                </div>
                                </div>
                                </div>
                                </div>

{/* Service Details + System Info */ }
<div className="grid gap-6 lg:grid-cols-2" >
    {/* Service Details */ }
    < div className = "rounded-lg border border-border bg-card p-6" >
        <div className="flex items-center gap-3 mb-4" >
            <div className="rounded-lg bg-primary/10 p-2" >
                <Server className="h-5 w-5 text-primary" />
                    </div>
                    < h3 className = "text-lg font-semibold" > Service Status </h3>
                        </div>
                        < div >
                        <ServiceStatusRow
                    label="System Database"
status = { detailedHealth.checks.system_db.status }
icon = { Database }
detail = {`Latency: ${detailedHealth.checks.system_db.latency}`}
                  />
    < ServiceStatusRow
label = "Cache"
status = { detailedHealth.checks.cache.status }
icon = { Cpu }
detail = {`Driver: ${detailedHealth.checks.cache.driver} • Latency: ${detailedHealth.checks.cache.latency}`}
                  />
    < ServiceStatusRow
label = "Queue"
status = { detailedHealth.checks.queue.driver === "database" ? "connected" : "configured" }
icon = { Layers }
detail = {`Driver: ${detailedHealth.checks.queue.driver} • Connection: ${detailedHealth.checks.queue.connection}`}
                  />
    < ServiceStatusRow
label = "Log File"
status = { detailedHealth.checks.log_file.exists ? "connected" : "disconnected" }
icon = { FileText }
detail = {`Size: ${detailedHealth.checks.log_file.size}`}
                  />
    </div>
    </div>

{/* System Info */ }
<div className="rounded-lg border border-border bg-card p-6" >
    <div className="flex items-center gap-3 mb-4" >
        <div className="rounded-lg bg-primary/10 p-2" >
            <Activity className="h-5 w-5 text-primary" />
                </div>
                < h3 className = "text-lg font-semibold" > System Information </h3>
                    </div>
                    < div className = "space-y-4" >
                        { basicHealth?.checks?.php_version && (
                            <div className="flex items-center justify-between py-2 border-b border-border" >
                                <span className="text-sm text-muted-foreground" > PHP Version </span>
                                    < Badge variant = "outline" > { basicHealth.checks.php_version } </Badge>
                                        </div>
                  )}
{
    basicHealth?.checks?.laravel_version && (
        <div className="flex items-center justify-between py-2 border-b border-border" >
            <span className="text-sm text-muted-foreground" > Laravel Version </span>
                < Badge variant = "outline" > { basicHealth.checks.laravel_version } </Badge>
                    </div>
                  )
}
{
    basicHealth?.checks?.environment && (
        <div className="flex items-center justify-between py-2 border-b border-border" >
            <span className="text-sm text-muted-foreground" > Environment </span>
                < Badge className = {
                    basicHealth.checks.environment === "production"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                } >
                    { basicHealth.checks.environment }
                    </Badge>
                    </div>
                  )
}
<div className="flex items-center justify-between py-2 border-b border-border" >
    <span className="text-sm text-muted-foreground" > Overall Status </span>
        < Badge className = {
            overallStatus === "ok"
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive"
                    }>
    { overallStatus.toUpperCase() }
    </Badge>
    </div>
    < div className = "flex items-center justify-between py-2 border-b border-border" >
        <span className="text-sm text-muted-foreground" > Uptime </span>
            < span className = "text-sm font-medium flex items-center gap-1" >
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    { basicHealth?.uptime || "—"}
</span>
    </div>
    < div className = "flex items-center justify-between py-2" >
        <span className="text-sm text-muted-foreground" > Timestamp </span>
            < span className = "text-sm font-medium" >
            {
                detailedHealth.timestamp
                    ? new Date(detailedHealth.timestamp).toLocaleString()
                    : "—"
            }
                </span>
                </div>
                </div>
                </div>
                </div>
                </>
        ) : (
    <div className= "rounded-lg border border-border bg-card p-12 text-center" >
    <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2" > Unable to Load Detailed Metrics </h3>
            < p className = "text-muted-foreground text-sm mb-4" >
                The detailed health endpoint may be unavailable or you may need to reauthenticate.
            </p>
                    < Button onClick = { handleRefresh } variant = "outline" >
                        <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                                </Button>
                                </div>
        )}
</div>
    </DashboardLayout>
  );
}
