import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Landmark, ArrowLeftRight, Activity, CreditCard,
  ShieldAlert, Scale, Fingerprint, Plug,
  ScrollText, FileBarChart, Code2, Headphones,
  ArrowRight, CheckCircle2, Clock,
} from "lucide-react";

// ─── Module definitions ─────────────────────────────────────────────────────

type ModuleStatus = "active" | "live" | "coming_soon";

interface Module {
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

const MODULES: Module[] = [
  {
    id: "vault",
    title: "Vault Management",
    description: "Manage institution custodial vaults, real-time balances, freeze controls, and emergency vault actions.",
    href: "/vault-banking",
    icon: Landmark,
    gradient: "from-blue-600 via-blue-700 to-indigo-800",
    iconColor: "text-blue-200",
    status: "live",
    category: "Core Banking",
    metric: { label: "Managed Vaults", value: "5 Active" },
  },
  {
    id: "settlement",
    title: "Settlement Center",
    description: "Process and monitor NIBSS settlement queues, partner bank performance, and reconciliation.",
    href: "/settlement",
    icon: ArrowLeftRight,
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    iconColor: "text-emerald-200",
    status: "live",
    category: "Settlement",
    metric: { label: "Success Rate", value: "99.2%" },
  },
  {
    id: "transactions",
    title: "Transaction Monitoring",
    description: "Real-time transaction feed with AI risk scoring, geo-location tracking, and velocity analysis.",
    href: "/transactions",
    icon: Activity,
    gradient: "from-violet-600 via-violet-700 to-purple-800",
    iconColor: "text-violet-200",
    status: "live",
    category: "Monitoring",
    metric: { label: "Today's Volume", value: "₦22.1B" },
  },
  {
    id: "virtual-accounts",
    title: "Virtual Accounts",
    description: "Provision and manage virtual account numbers for institutions and their end customers.",
    href: "/virtual-accounts",
    icon: CreditCard,
    gradient: "from-sky-600 via-sky-700 to-cyan-800",
    iconColor: "text-sky-200",
    status: "active",
    category: "Accounts",
    metric: { label: "Total VANs", value: "1,847" },
  },
  {
    id: "fraud",
    title: "Fraud Center",
    description: "AI-powered fraud detection with case management, AML alerts, velocity attack monitoring, and SAR generation.",
    href: "/fraud",
    icon: ShieldAlert,
    gradient: "from-rose-600 via-rose-700 to-red-800",
    iconColor: "text-rose-200",
    status: "live",
    category: "Risk",
    metric: { label: "Active Alerts", value: "3 Critical" },
  },
  {
    id: "compliance",
    title: "Compliance Center",
    description: "KYC, AML, PEP screening, sanction checks, document verification and CBN regulatory compliance.",
    href: "/compliance",
    icon: Scale,
    gradient: "from-amber-600 via-amber-700 to-orange-800",
    iconColor: "text-amber-200",
    status: "live",
    category: "Compliance",
    metric: { label: "Pending KYC", value: "12 Reviews" },
  },
  {
    id: "bvn-nin",
    title: "BVN / NIN Services",
    description: "Bank Verification Number and National Identity Number lookup, validation and verification services.",
    href: "/bvn-nin",
    icon: Fingerprint,
    gradient: "from-indigo-600 via-indigo-700 to-blue-900",
    iconColor: "text-indigo-200",
    status: "active",
    category: "Identity",
    metric: { label: "Verifications Today", value: "3,847" },
  },
  {
    id: "api",
    title: "API Integrations",
    description: "Monitor Wema, Providus, NIBSS, Termii, Paystack and partner API health, latency, and error rates.",
    href: "/api-integrations",
    icon: Plug,
    gradient: "from-orange-600 via-orange-700 to-amber-800",
    iconColor: "text-orange-200",
    status: "active",
    category: "Platform",
    metric: { label: "APIs Online", value: "8 / 8" },
  },
  {
    id: "audit",
    title: "Audit Logs",
    description: "Immutable audit trail of every system action — every click, approval, deletion, and login is recorded.",
    href: "/audit-logs",
    icon: ScrollText,
    gradient: "from-slate-600 via-slate-700 to-slate-800",
    iconColor: "text-slate-200",
    status: "active",
    category: "Compliance",
    metric: { label: "Today's Entries", value: "284 Logs" },
  },
  {
    id: "reports",
    title: "Reports",
    description: "Generate CBN regulatory reports, revenue reports, settlement summaries, and operational analytics.",
    href: "/reports",
    icon: FileBarChart,
    gradient: "from-teal-600 via-teal-700 to-cyan-900",
    iconColor: "text-teal-200",
    status: "active",
    category: "Analytics",
    metric: { label: "Reports This Month", value: "53 Generated" },
  },
  {
    id: "developer",
    title: "Developer Center",
    description: "API documentation, webhook management, sandbox environment, and SDK downloads for partner institutions.",
    href: "/developer",
    icon: Code2,
    gradient: "from-purple-600 via-purple-700 to-violet-900",
    iconColor: "text-purple-200",
    status: "active",
    category: "Developer",
    metric: { label: "API Calls Today", value: "142,847" },
  },
  {
    id: "support",
    title: "Support Center",
    description: "Internal support ticket management, escalation workflows, and institution issue resolution.",
    href: "/support",
    icon: Headphones,
    gradient: "from-pink-600 via-pink-700 to-rose-900",
    iconColor: "text-pink-200",
    status: "active",
    category: "Support",
    metric: { label: "Open Tickets", value: "23 Active" },
  },
];

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/25 px-2.5 py-1 text-[11px] font-semibold text-blue-400">
        <CheckCircle2 className="h-3 w-3" />
        ACTIVE
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-muted/50 border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      <Clock className="h-3 w-3" />
      COMING SOON
    </span>
  );
}

// ─── Module card ─────────────────────────────────────────────────────────────

function ModuleCard({ mod }: { mod: Module }) {
  const navigate = useNavigate();
  const isAvailable = mod.status !== "coming_soon";

  return (
    <div
      onClick={() => isAvailable && navigate(mod.href)}
      className={[
        "group rounded-[18px] overflow-hidden border transition-all duration-200 flex flex-col",
        isAvailable
          ? "border-border hover:border-border hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          : "border-border/50 opacity-70 cursor-not-allowed",
      ].join(" ")}
    >
      {/* Gradient visual area */}
      <div className={`relative bg-gradient-to-br ${mod.gradient} h-44 flex items-center justify-center p-5`}>
        {/* Category tag */}
        <span className="absolute top-3 left-3 rounded-md bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          {mod.category}
        </span>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={mod.status} />
        </div>

        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
          <mod.icon className={`h-10 w-10 ${mod.iconColor}`} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 bg-card p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[15px] font-bold tracking-tight text-foreground leading-snug">{mod.title}</h3>
          {isAvailable && (
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all mt-0.5" />
          )}
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

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OperationsHub() {
  const liveCount = MODULES.filter((m) => m.status === "live").length;
  const activeCount = MODULES.filter((m) => m.status === "active").length;

  return (
    <DashboardLayout title="Banking Operations">
      <div className="space-y-5">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground/70 mb-1">
                QuovaTech BOC · Banking Operations
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Banking Operations Center
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xl">
                Access and manage all core banking infrastructure modules. Click a module to enter its dedicated management interface.
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

          {/* Divider */}
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground/50">
          All actions within these modules are logged and auditable · QuovaTech BOC v2.0
        </p>
      </div>
    </DashboardLayout>
  );
}
