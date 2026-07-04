import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard, TrendingUp, Wallet, LineChart,
  BookOpen, FileText, Target, BarChart3,
  ClipboardList, Briefcase, ArrowRight, CheckCircle2,
  Building2, UserCircle, Settings2,
} from "lucide-react";

type ModuleStatus = "active" | "live";

interface FinModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  status: ModuleStatus;
  category: string;
  metric?: { label: string; value: string };
}

const MODULES: FinModule[] = [
  {
    id: "dashboard",
    title: "Executive Dashboard",
    description: "Full financial command center — today's revenue, expenses, profit, MRR/ARR, burn rate, runway, and financial health score in one view.",
    href: "/accounting/dashboard",
    icon: LayoutDashboard,
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    iconColor: "text-emerald-200",
    status: "live",
    category: "Overview",
    metric: { label: "Financial Health Score", value: "82 / 100" },
  },
  {
    id: "revenue",
    title: "Revenue Center",
    description: "Track every income stream — subscription fees, SMS margins, BVN/NIN charges, onboarding fees, and 12 more active revenue sources.",
    href: "/accounting/revenue",
    icon: TrendingUp,
    gradient: "from-blue-600 via-blue-700 to-indigo-800",
    iconColor: "text-blue-200",
    status: "live",
    category: "Revenue",
    metric: { label: "MTD Revenue", value: "₦4.9M" },
  },
  {
    id: "expenses",
    title: "Expense Center",
    description: "Record, categorise, and approve every business expense with vendor tracking, receipt uploads, recurring options, and budget enforcement.",
    href: "/accounting/expenses",
    icon: Wallet,
    gradient: "from-rose-600 via-rose-700 to-red-800",
    iconColor: "text-rose-200",
    status: "live",
    category: "Expenses",
    metric: { label: "MTD Expenses", value: "₦1.42M" },
  },
  {
    id: "cashflow",
    title: "Cash Flow Center",
    description: "Monitor opening and closing balances, cash-in vs cash-out timelines, weekly movements, and a 3-month forward-looking cash forecast.",
    href: "/accounting/cashflow",
    icon: LineChart,
    gradient: "from-cyan-600 via-cyan-700 to-sky-800",
    iconColor: "text-cyan-200",
    status: "live",
    category: "Liquidity",
    metric: { label: "Cash Position", value: "₦8.2M" },
  },
  {
    id: "ledger",
    title: "General Ledger",
    description: "Full double-entry bookkeeping with journal entries, a professional Chart of Accounts (1000s–6000s), and a self-balancing Trial Balance.",
    href: "/accounting/ledger",
    icon: BookOpen,
    gradient: "from-violet-600 via-violet-700 to-purple-800",
    iconColor: "text-violet-200",
    status: "active",
    category: "Accounting",
    metric: { label: "Journal Entries", value: "20 Posted" },
  },
  {
    id: "reports",
    title: "Financial Reports",
    description: "Generate and export Income Statements, Balance Sheets, Cash Flow Statements, P&L, Tax Reports, and Investor-ready summaries.",
    href: "/accounting/reports",
    icon: FileText,
    gradient: "from-amber-600 via-amber-700 to-orange-800",
    iconColor: "text-amber-200",
    status: "active",
    category: "Reporting",
    metric: { label: "Report Types", value: "13 Available" },
  },
  {
    id: "budgets",
    title: "Budget Center",
    description: "Set monthly and annual budgets per department or category, track actual spend vs budget, and get early warnings before overspending.",
    href: "/accounting/budgets",
    icon: Target,
    gradient: "from-lime-600 via-lime-700 to-green-800",
    iconColor: "text-lime-200",
    status: "active",
    category: "Budgeting",
    metric: { label: "Budget Utilization", value: "67.4%" },
  },
  {
    id: "metrics",
    title: "Financial KPIs",
    description: "Deep SaaS financial analytics — MRR, ARR, LTV, CAC, churn rate, gross margin, operating margin, and revenue-per-institution trends.",
    href: "/accounting/metrics",
    icon: BarChart3,
    gradient: "from-indigo-600 via-indigo-700 to-blue-900",
    iconColor: "text-indigo-200",
    status: "live",
    category: "Analytics",
    metric: { label: "Gross Margin", value: "78.4%" },
  },
  {
    id: "audit",
    title: "Financial Audit",
    description: "Immutable audit trail of every financial action — who created it, who approved it, before/after values, IP address, and timestamps.",
    href: "/accounting/audit",
    icon: ClipboardList,
    gradient: "from-slate-600 via-slate-700 to-slate-800",
    iconColor: "text-slate-200",
    status: "active",
    category: "Compliance",
    metric: { label: "Audit Entries", value: "32 Today" },
  },
  {
    id: "investors",
    title: "Investor Center",
    description: "Series A preparation dashboard — company valuation, ARR growth, burn rate, runway, CAC/LTV, milestone timeline, and investor reports.",
    href: "/accounting/investors",
    icon: Briefcase,
    gradient: "from-pink-600 via-pink-700 to-rose-800",
    iconColor: "text-pink-200",
    status: "active",
    category: "Investor Relations",
    metric: { label: "Est. Valuation", value: "₦2.1B" },
  },
  {
    id: "accounts",
    title: "Company Accounts",
    description: "Manage all company bank accounts and wallets — Wema, Moniepoint, OPay, USD domiciliary, and petty cash with live balances and transfers.",
    href: "/accounting/accounts",
    icon: Building2,
    gradient: "from-sky-600 via-sky-700 to-cyan-800",
    iconColor: "text-sky-200",
    status: "live",
    category: "Treasury",
    metric: { label: "Total Cash Position", value: "₦7.7M" },
  },
  {
    id: "owners-draw",
    title: "Owner's Draw",
    description: "Founder withdrawal ledger — properly separates personal draws from business expenses for accurate P&L, audit compliance, and investor reporting.",
    href: "/accounting/owners-draw",
    icon: UserCircle,
    gradient: "from-rose-500 via-rose-600 to-pink-700",
    iconColor: "text-rose-200",
    status: "active",
    category: "Equity",
    metric: { label: "YTD Withdrawals", value: "₦1.23M" },
  },
  {
    id: "revenue-config",
    title: "Revenue Configuration",
    description: "Configure, enable, and map all revenue streams. Add unlimited new revenue sources without touching code — each auto-posts to the GL.",
    href: "/accounting/revenue-config",
    icon: Settings2,
    gradient: "from-violet-600 via-violet-700 to-fuchsia-800",
    iconColor: "text-violet-200",
    status: "active",
    category: "Configuration",
    metric: { label: "Active Streams", value: "16 Sources" },
  },
];

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        LIVE
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/25 px-2.5 py-1 text-[11px] font-semibold text-blue-400">
      <CheckCircle2 className="h-3 w-3" />
      ACTIVE
    </span>
  );
}

function ModuleCard({ mod }: { mod: FinModule }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(mod.href)}
      className="group rounded-[18px] overflow-hidden border border-border hover:border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Gradient header */}
      <div className={`relative bg-gradient-to-br ${mod.gradient} h-44 flex items-center justify-center p-5`}>
        <span className="absolute top-3 left-3 rounded-md bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          {mod.category}
        </span>
        <div className="absolute top-3 right-3">
          <StatusBadge status={mod.status} />
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
          <mod.icon className={`h-10 w-10 ${mod.iconColor}`} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 bg-card p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[15px] font-bold tracking-tight text-foreground leading-snug">{mod.title}</h3>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all mt-0.5" />
        </div>
        <p className="text-[12px] leading-relaxed text-muted-foreground flex-1">{mod.description}</p>
        {mod.metric && (
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{mod.metric.label}</span>
            <span className="font-mono text-[12px] font-semibold text-foreground/80">{mod.metric.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinanceHub() {
  const liveCount = MODULES.filter((m) => m.status === "live").length;
  const activeCount = MODULES.filter((m) => m.status === "active").length;

  return (
    <DashboardLayout title="Finance Center">
      <div className="space-y-5">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground/70 mb-1">
                QuovaTech BOC · Finance
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Financial Operations Center
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xl">
                The financial brain of QuovaTech — manage revenue, expenses, ledger, budgets, and investor reporting from one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Live</p>
                <p className="font-mono text-xl font-bold text-emerald-400">{liveCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Active</p>
                <p className="font-mono text-xl font-bold text-blue-400">{activeCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Modules</p>
                <p className="font-mono text-xl font-bold text-foreground">{MODULES.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/50">
          All financial actions are logged and auditable · QuovaTech FinOps v1.0
        </p>
      </div>
    </DashboardLayout>
  );
}
