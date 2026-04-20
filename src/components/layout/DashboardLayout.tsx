import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  title: string;
  children?: React.ReactNode;
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className= "min-h-screen bg-background" >
    {/* Mobile overlay backdrop */ }
  {
    mobileSidebarOpen && (
      <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
    onClick = {() => setMobileSidebarOpen(false)
  }
        />
      )
}

<AppSidebar
        collapsed={ sidebarCollapsed }
onToggle = {() => setSidebarCollapsed(!sidebarCollapsed)}
mobileOpen = { mobileSidebarOpen }
onMobileClose = {() => setMobileSidebarOpen(false)}
      />

{/* Main content — offset only on desktop */ }
<div
        className={
  cn(
    "transition-all duration-300 ease-in-out",
    "lg:ml-64",
    sidebarCollapsed && "lg:ml-16"
  )
}
      >
  <TopBar
          title={ title }
onMenuClick = {() => setMobileSidebarOpen(true)}
        />
  < main className = "p-4 md:p-6" > { children } </main>
    </div>
    </div>
  );
}
