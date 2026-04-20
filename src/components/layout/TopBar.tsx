import { useState, useEffect, useCallback } from "react";
import { Bell, Search, ChevronDown, WifiOff, AlertTriangle, CheckCircle2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";
import type { HealthCheckResponse } from "@/lib/api";

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Health Status Polling (every 30s)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.getHealthCheck();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const healthStatus = health?.status;
  const isOnline = healthStatus === "ok";
  const isDegraded = healthStatus === "degraded";

  const handleLogout = async () => {
    try {
      await logout();
      toast("Signed out successfully", {
        description: "You have been logged out of your account.",
      });
      navigate("/");
    } catch (error) {
      toast("Sign out failed", {
        description: "There was an error signing out. Please try again.",
      });
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format role name
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header className= "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6" >
    <div className="flex items-center gap-3" >
      {/* Mobile hamburger */ }
      < button
  onClick = { onMenuClick }
  className = "lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground"
    >
    <Menu className="h-5 w-5" />
      </button>

      < h1 className = "text-base md:text-xl font-semibold text-foreground truncate max-w-[160px] sm:max-w-none" > { title } </h1>

  {/* Live Health Status Indicator */ }
  <button
        onClick={ () => navigate("/system-health") }
  className = "hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted cursor-pointer"
  title = { health? `Uptime: ${health.uptime}` : "System status unknown"
}
      >
{
  isOnline?(
          <>
  <span className="relative flex h-2 w-2" >
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        < span className = "text-emerald-600 dark:text-emerald-400" > Online </span>
          </>
        ) : isDegraded ? (
  <>
  <AlertTriangle className= "h-3 w-3 text-amber-500" />
  <span className="text-amber-600 dark:text-amber-400" > Degraded </span>
    </>
        ) : (
  <>
  <WifiOff className= "h-3 w-3 text-destructive" />
  <span className="text-destructive" > Offline </span>
    </>
        )}
</button>
  </div>

  < div className = "flex items-center gap-2" >
    {/* Search */ } < div className = "relative hidden md:block" >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
            placeholder="Search..."
className = "w-64 pl-9 bg-background"
  />
  </div>

{/* Theme Toggle */ }
<ThemeToggle />

{/* Notifications */ }
<DropdownMenu>
  <DropdownMenuTrigger asChild >
  <Button variant="ghost" size = "icon" className = "relative" >
    <Bell className="h-5 w-5 text-muted-foreground" />
      { isDegraded && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500" />
      )}
</Button>
  </DropdownMenuTrigger>
  < DropdownMenuContent align = "end" className = "w-80 bg-card" >
    <DropdownMenuLabel>Notifications </DropdownMenuLabel>
    < DropdownMenuSeparator />
    {
      isDegraded?(
      <DropdownMenuItem className = "flex items-start gap-3 py-3 cursor-default focus:bg-amber-50 dark:focus:bg-amber-950/30" >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
    <div className="flex flex-col gap-0.5" >
      <span className="font-medium text-amber-700 dark:text-amber-400" > System Degraded </span>
        < span className = "text-xs text-muted-foreground" >
          One or more health checks are failing.Check System Health for details.
          </span>
            </div>
            </DropdownMenuItem>
    ) : (
    <div className= "flex flex-col items-center gap-2 py-8 text-center" >
    <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground" > All caught up </p>
        < p className = "text-xs text-muted-foreground/70" > No new notifications </p>
          </div>
    )}
<DropdownMenuSeparator />
  < DropdownMenuItem
className = "justify-center text-xs text-muted-foreground"
onClick = {() => navigate("/system-health")}
    >
  View System Health
    </DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>

{/* User Menu */ }
<DropdownMenu>
  <DropdownMenuTrigger asChild >
  <Button variant="ghost" className = "flex items-center gap-2" >
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground" >
      { user? getInitials(user.name) : "??"}
      </div>
      < div className = "hidden text-left md:block" >
        <p className="text-sm font-medium" > { user?.name || "Loading..."
} </p>
  < p className = "text-xs text-muted-foreground" >
    { user? formatRole(user.role) : ""}
    </p>
    </div>
    < ChevronDown className = "h-4 w-4 text-muted-foreground" />
      </Button>
      </DropdownMenuTrigger>
      < DropdownMenuContent align = "end" className = "w-56 bg-card" >
        <DropdownMenuLabel>My Account </DropdownMenuLabel>
          < DropdownMenuSeparator />
          <DropdownMenuItem>Profile Settings </DropdownMenuItem>
            < DropdownMenuItem > Security </DropdownMenuItem>
            < DropdownMenuItem > Activity Log </DropdownMenuItem>
              < DropdownMenuSeparator />
              <DropdownMenuItem 
              className="text-destructive"
onClick = { handleLogout }
  >
  Sign out
    </DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>
    </div>
    </header>
  );
}
