import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BarChart3, Bell, ChevronDown, Home, Landmark, LogOut, Megaphone, Menu, Pause, Play,
  RefreshCw, Rocket, Settings, Sparkles, Workflow, type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { MarketingProvider, useMarketing } from "./MarketingContext";
import { AgentSheet, ApprovalSheet, LeadSheet } from "./components/Panels";
import { focusRing } from "./components/shared";

interface NavItem { title: string; href: string; icon: LucideIcon; end?: boolean; subtitle: string }

export const marketingNav: NavItem[] = [
  { title: "Overview", href: "/marketing/overview", icon: Home, subtitle: "Today's results from your AI marketing team at a glance." },
  { title: "AI Marketing Office", href: "/marketing", icon: Sparkles, end: true, subtitle: "A team of AI agents that find, engage, follow up and onboard new client institutions for FynixCoBanking." },
  { title: "Leads & Pipeline", href: "/marketing/leads", icon: Workflow, subtitle: "Every institution your AI team is working with, stage by stage." },
  { title: "Campaigns", href: "/marketing/campaigns", icon: Megaphone, subtitle: "Posts, articles and outreach sequences created by the Content Writer." },
  { title: "Institutions", href: "/marketing/institutions", icon: Landmark, subtitle: "Prospect database of MFBs, cooperatives and lenders." },
  { title: "Reports", href: "/marketing/reports", icon: BarChart3, subtitle: "Conversion, response and channel performance over time." },
  { title: "Settings", href: "/marketing/settings", icon: Settings, subtitle: "Targets, channels, approval rules and daily limits for the AI team." },
];

function currentNav(pathname: string): NavItem {
  const clean = pathname.replace(/\/+$/, "") || "/marketing";
  return marketingNav.find((item) => item.href === clean) ?? marketingNav[1];
}

function Brand() {
  return (
    <div className="flex items-start gap-2.5 px-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#3B6FE8,#1A3A9C)] text-[22px] font-black italic text-white shadow-[0_8px_18px_-8px_rgba(34,80,204,0.8)]">F</span>
      <div>
        <div className="text-[19px] font-extrabold leading-tight tracking-[-0.03em] text-[#0F1B3D]">FynixCoBanking</div>
        <div className="mt-0.5 text-[11.5px] leading-snug text-[#64748B]">Core-Banking for MFBs, Cooperatives &amp; Lenders</div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="mt-7 space-y-1" aria-label="Marketing">
      {marketingNav.map(({ title, href, icon: Icon, end }) => (
        <NavLink
          key={href} to={href} end={end} onClick={onNavigate}
          className={({ isActive }) => `flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[14.5px] font-medium transition ${focusRing} ${isActive
            ? "bg-[linear-gradient(90deg,#2250CC,#3B6FE8)] font-semibold text-white shadow-[0_10px_22px_-10px_rgba(34,80,204,0.8)]"
            : "text-[#1E293B] hover:bg-[#EEF3FF]"}`}
        >
          <Icon size={19} />{title}
        </NavLink>
      ))}
    </nav>
  );
}

function PromoCard() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(150deg,#3B6FE8,#1F45B8)] p-4 text-white shadow-[0_18px_36px_-18px_rgba(34,80,204,0.9)]">
      <Sparkles size={26} className="mb-2" />
      <div className="text-[17px] font-extrabold leading-tight">AI Marketing Office</div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-white/85">Your always-on AI sales team for Nigerian financial institutions.</p>
      <Landmark size={64} strokeWidth={1.4} className="ml-auto mt-2 text-white/80" />
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Brand />
      <NavList onNavigate={onNavigate} />
      <div className="mt-auto space-y-3 pt-6">
        <NavLink to="/dashboard" onClick={onNavigate} className={`flex items-center gap-2 rounded-xl border border-[#DCE4F2] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#334155] hover:border-[#9DB8F5] hover:text-[#2250CC] ${focusRing}`}>
          <ArrowLeft size={16} />Back to Admin Portal
        </NavLink>
        <PromoCard />
      </div>
    </div>
  );
}

function initialsOf(name?: string) {
  return (name ?? "FynixCoBanking Admin").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Header({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, setMode, approvals, setApprovalOpen, paused, setPaused, resetDemo } = useMarketing();
  const nav = currentNav(pathname);
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <button onClick={onMenu} className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE4F2] bg-white lg:hidden ${focusRing}`} aria-label="Open marketing menu"><Menu size={19} /></button>
        <Sparkles className="mt-1 hidden shrink-0 text-[#6D5BFF] sm:block" size={38} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-[#0F1B3D] sm:text-[32px]">{nav.title}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F8EE] px-3 py-1 text-[13px] font-semibold text-[#15803D]">
              <span className={`h-2 w-2 rounded-full bg-[#22C55E] ${paused ? "" : "animate-pulse"}`} />{paused ? "Office paused" : "Office Open, 7 agents working"}
            </span>
            <span className="rounded-full border border-[#DCE4F2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B]" title="All institutions and numbers on these pages are simulated">Demo data</span>
          </div>
          <p className="mt-1 max-w-3xl text-[14px] text-[#475569]">{nav.subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex rounded-[16px] border border-[#DCE4F2] bg-white p-1 shadow-sm" role="group" aria-label="Operating mode">
          <button onClick={() => setMode("approval")} aria-pressed={mode === "approval"} className={`rounded-[12px] px-4 py-2 text-[13.5px] font-semibold transition ${focusRing} ${mode === "approval" ? "bg-[linear-gradient(90deg,#2250CC,#3B6FE8)] text-white shadow" : "text-[#1E293B] hover:bg-[#F1F5FF]"}`}>Approval mode</button>
          <button onClick={() => setMode("autopilot")} aria-pressed={mode === "autopilot"} className={`flex items-center gap-1.5 rounded-[12px] px-4 py-2 text-[13.5px] font-semibold transition ${focusRing} ${mode === "autopilot" ? "bg-[linear-gradient(90deg,#2250CC,#3B6FE8)] text-white shadow" : "text-[#1E293B] hover:bg-[#F1F5FF]"}`}><Rocket size={15} />Autopilot</button>
        </div>
        <button onClick={() => setPaused(!paused)} className={`flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#DCE4F2] bg-white text-[#475569] shadow-sm hover:text-[#2250CC] ${focusRing}`} aria-label={paused ? "Resume office" : "Pause office"} title={paused ? "Resume" : "Pause"}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
        <button onClick={() => setApprovalOpen(true)} className={`relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#DCE4F2] bg-white text-[#475569] shadow-sm hover:text-[#2250CC] ${focusRing}`} aria-label={`Approval inbox, ${approvals.length} waiting`}>
          <Bell size={19} />
          {approvals.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#EF4444]" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className={`flex items-center gap-2.5 rounded-[16px] border border-[#DCE4F2] bg-white py-1.5 pl-1.5 pr-3 shadow-sm ${focusRing}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(145deg,#7C5CFC,#3B6FE8)] text-[13px] font-bold text-white">{initialsOf(user?.name)}</span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[160px] truncate text-[13.5px] font-bold text-[#0F1B3D]">{user?.name ?? "FynixCoBanking"}</span>
              <span className="block text-[12px] capitalize text-[#64748B]">{(user?.role ?? "admin").replace(/_/g, " ")}</span>
            </span>
            <ChevronDown size={16} className="text-[#64748B]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard")}><ArrowLeft size={15} className="mr-2" />Back to Admin Portal</DropdownMenuItem>
            <DropdownMenuItem onClick={resetDemo}><RefreshCw size={15} className="mr-2" />Reset demo data</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }} className="text-[#DC2626] focus:text-[#DC2626]"><LogOut size={15} className="mr-2" />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  // The AI Marketing Office page (/marketing) ships with its own sidebar and header,
  // so this layout steps aside there to avoid double navigation.
  if (pathname.replace(/\/+$/, "") === "/marketing") {
    return (
      <Suspense fallback={<div className="grid h-screen place-items-center text-sm text-[#64748B]">Loading…</div>}>
        <Outlet />
      </Suspense>
    );
  }
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#F5F8FF_0%,#EEF3FF_50%,#F3EFFF_100%)] text-[#0F1B3D] antialiased">
      <aside className="fixed inset-y-0 left-0 hidden w-[264px] overflow-y-auto border-r border-[#E3EAF6] bg-white/80 px-4 py-6 backdrop-blur lg:block">
        <SidebarContent />
      </aside>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] bg-white px-4 py-6">
          <SheetTitle className="sr-only">Marketing menu</SheetTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-[264px]">
        <div className="mx-auto max-w-[1920px] space-y-5 px-4 py-5 sm:px-6 lg:py-6">
          <Header onMenu={() => setMenuOpen(true)} />
          <Suspense fallback={<div className="grid h-64 place-items-center text-sm text-[#64748B]">Loading…</div>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <AgentSheet />
      <ApprovalSheet />
      <LeadSheet />
    </div>
  );
}

/** Stand-alone layout for the marketing area: own menu, own header, shared simulation state. */
export default function MarketingLayout() {
  return (
    <MarketingProvider>
      <Shell />
    </MarketingProvider>
  );
}
