import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  billingApi,
  type BillingInvoice,
  type BillingConfig,
} from "@/lib/api";
import { toast as showToast } from "sonner";
import {
  Receipt,
  Send,
  Eye,
  AlertTriangle,
  Loader2,
  Banknote,
  Settings2,
  Printer,
  CheckCircle2,
  Clock,
  CircleAlert,
  Mail,
  Check,
  Package,
  Zap,
  Info,
  Search,
  RefreshCw,
  TrendingUp,
  Pencil,
  X,
  Save,
  Building2,
} from "lucide-react";

// ─── Display helpers ──────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);

const monthName = (m: number) =>
  new Date(2000, m - 1).toLocaleString("en-US", { month: "long" });

const fmtIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Company constants (name + email never change; bank details are editable) ─
const CO_FIXED = {
  name: "Fynix CoBank Ltd",
  email: "billing@fynixcobanking.com",
  address: "Lagos, Nigeria",
} as const;

const BANK_DEFAULTS = {
  bankName: "First Bank of Nigeria",
  bankAccount: "0123456789",
  bankAccountName: "Fynix CoBank Ltd",
} as const;

const LS_BANK_KEY = "billing_bank_details";

function loadBankFromStorage() {
  try {
    const raw = localStorage.getItem(LS_BANK_KEY);
    if (raw) return JSON.parse(raw) as typeof BANK_DEFAULTS;
  } catch {
    /* ignore */
  }
  return null;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
type InvoiceStatus = BillingInvoice["status"];

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = {
    pending: {
      label: "Pending",
      icon: <Clock className="h-3 w-3" />,
      cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    },
    sent: {
      label: "Invoice Sent",
      icon: <Mail className="h-3 w-3" />,
      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    },
    paid: {
      label: "Paid",
      icon: <Check className="h-3 w-3" />,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    },
    overdue: {
      label: "Overdue",
      icon: <CircleAlert className="h-3 w-3" />,
      cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    },
  } as const;
  const { label, icon, cls } = cfg[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      {icon} {label}
    </span>
  );
}

// ─── In-app invoice preview ────────────────────────────────────────────────────
interface BankInfo {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

function InvoiceDocument({
  inv,
  bank,
}: {
  inv: BillingInvoice;
  bank: BankInfo;
}) {
  return (
    <div className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-8 py-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 shrink-0">
                <span className="text-xs font-black text-white">FC</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{CO_FIXED.name}</p>
                <p className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider">
                  Cooperative Banking Platform
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-xs">{CO_FIXED.email}</p>
            <p className="text-slate-500 text-xs">{CO_FIXED.address}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[44px] font-black text-white/[0.05] tracking-[0.3em] leading-none mb-1 font-serif">
              INVOICE
            </p>
            <p className="text-white font-mono text-sm font-bold">{inv.id}</p>
            <div className="mt-4 space-y-2 text-right">
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Issued</p>
                <p className="text-slate-300 text-xs font-semibold mt-0.5">
                  {fmtIso(inv.issued_date)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Due</p>
                <p className="text-amber-400 text-xs font-bold mt-0.5">
                  {fmtIso(inv.due_date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill From / To */}
      <div className="grid grid-cols-2 gap-5 px-8 py-5 border-b border-gray-100">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400 mb-2.5">
            Bill From
          </p>
          <p className="text-sm font-bold text-gray-900">{CO_FIXED.name}</p>
          <p className="text-xs text-gray-500 mt-1">{CO_FIXED.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">{CO_FIXED.address}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400 mb-2.5">
            Bill To
          </p>
          <p className="text-sm font-bold text-gray-900">{inv.tenant_name}</p>
          <p className="text-xs text-gray-500 mt-1">{inv.tenant_email}</p>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
            {inv.tenant_slug}.fynixcobanking.com
          </p>
        </div>
      </div>

      {/* Period */}
      <div className="flex items-center justify-between px-8 py-3 bg-gray-50 border-b border-gray-100">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
            Billing Period
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{inv.period}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
            Billing Mode
          </p>
          <p className="text-xs font-semibold text-indigo-600 mt-0.5 capitalize">
            {inv.billing_mode.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="px-8 py-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100">
              {["Description", "Qty", "Unit Price", "Total"].map((h, i) => (
                <th
                  key={h}
                  className={`pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400
                    ${i === 0 ? "text-left" : i === 1 ? "text-center w-10" : "text-right w-28"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-4 pr-4">
                <p className="text-sm font-bold text-gray-800">
                  Fynix CoBank Platform Access
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Monthly {inv.billing_mode.replace("_", " ")} fee — {inv.period}.
                  Includes all active modules and unlimited cooperative member access.
                </p>
              </td>
              <td className="py-4 text-center text-sm text-gray-600">1</td>
              <td className="py-4 text-right text-sm text-gray-600 font-mono">
                {fmt(inv.amount)}
              </td>
              <td className="py-4 text-right text-sm font-black text-gray-900 font-mono">
                {fmt(inv.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col items-end gap-1 mt-4 border-t-2 border-gray-100 pt-3">
          {(
            [
              ["Subtotal", fmt(inv.amount), false],
              ["VAT (0%)", "₦0", false],
              ["Total Due", fmt(inv.amount), true],
            ] as [string, string, boolean][]
          ).map(([label, val, big]) => (
            <div
              key={label}
              className={`flex justify-between ${
                big ? "w-48 mt-1 pt-2 border-t-2 border-gray-200" : "w-44"
              }`}
            >
              <span className={big ? "text-base font-black text-gray-900" : "text-sm text-gray-500"}>
                {label}
              </span>
              <span
                className={`font-mono ${
                  big ? "text-base font-black text-indigo-700" : "text-sm text-gray-500"
                }`}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment details */}
      <div className="mx-8 mb-6 rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-4">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-indigo-500 mb-3">
          Payment Details
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-700">
          {(
            [
              ["Bank", bank.bankName],
              ["Account Name", bank.bankAccountName],
              ["Account No", bank.bankAccount],
              ["Reference", inv.id],
            ] as [string, string][]
          ).map(([k, v]) => (
            <p key={k}>
              <span className="text-gray-400">{k}: </span>
              <span
                className={`font-semibold ${
                  k === "Reference" ? "text-indigo-700 font-mono" : ""
                }`}
              >
                {v}
              </span>
            </p>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">
          Thank you for your business. Questions?{" "}
          <span className="font-medium">{CO_FIXED.email}</span>
        </p>
        <p className="text-[10px] text-gray-300 font-mono">{inv.id}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Billing() {
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);

  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [config, setConfig] = useState<BillingConfig>({
    billing_mode: "flat_rate",
    flat_rate_ngn: 35_000,
    due_days: 5,
    currency: "NGN",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Per-invoice loading states
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [markingPaidIds, setMarkingPaidIds] = useState<Set<string>>(new Set());
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Preview modal
  const [selInvoice, setSelInvoice] = useState<BillingInvoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ── Per-tenant amount editing ──────────────────────────────────────────────
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [savingAmountId, setSavingAmountId] = useState<string | null>(null);

  // ── Bank details editing (Settings tab) ───────────────────────────────────
  const [bankDetails, setBankDetails] = useState<typeof BANK_DEFAULTS>(() => {
    return loadBankFromStorage() ?? { ...BANK_DEFAULTS };
  });
  const [bankEdit, setBankEdit] = useState(false);
  const [bankDraft, setBankDraft] = useState<typeof BANK_DEFAULTS>({ ...BANK_DEFAULTS });
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankIsLocal, setBankIsLocal] = useState(() => !!loadBankFromStorage());

  // Sync bankDetails from config if backend returns them
  useEffect(() => {
    if (config.bank_name && config.bank_account && config.bank_account_name) {
      setBankDetails({
        bankName: config.bank_name,
        bankAccount: config.bank_account,
        bankAccountName: config.bank_account_name,
      });
      setBankIsLocal(false);
    }
  }, [config]);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const [data, cfg] = await Promise.all([
        billingApi.listInvoices(selYear, selMonth),
        billingApi.getConfig(),
      ]);
      setInvoices(data);
      setConfig(cfg);
    } catch (e: unknown) {
      showToast.error("Failed to load billing data", {
        description: (e as { message?: string }).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selYear, selMonth]);

  // ── Send one invoice ──────────────────────────────────────────────────────
  const handleSend = async (inv: BillingInvoice) => {
    console.log("[Billing] handleSend fired", { id: inv.id, status: inv.status });
    setSendingIds((p) => new Set(p).add(inv.id));
    try {
      const result = await billingApi.sendInvoice(inv.id);
      console.log("[Billing] sendInvoice response", result);
      setInvoices((p) =>
        p.map((i) => (i.id === inv.id ? { ...i, status: "sent" } : i))
      );
      setSelInvoice((p) => (p?.id === inv.id ? { ...p, status: "sent" } : p));
      showToast.success(`Invoice sent to ${inv.tenant_name}`, {
        description: `${inv.id} delivered to ${inv.tenant_email}`,
      });
    } catch (e: unknown) {
      console.error("[Billing] sendInvoice error", e);
      showToast.error("Failed to send invoice", {
        description: (e as { message?: string }).message,
      });
    } finally {
      setSendingIds((p) => {
        const s = new Set(p);
        s.delete(inv.id);
        return s;
      });
    }
  };

  // ── Mark paid ─────────────────────────────────────────────────────────────
  const handleMarkPaid = async (inv: BillingInvoice) => {
    setMarkingPaidIds((p) => new Set(p).add(inv.id));
    try {
      const { paid_date } = await billingApi.markPaid(inv.id);
      setInvoices((p) =>
        p.map((i) => (i.id === inv.id ? { ...i, status: "paid", paid_date } : i))
      );
      setSelInvoice((p) =>
        p?.id === inv.id ? { ...p, status: "paid", paid_date } : p
      );
      showToast.success(`Payment confirmed — ${inv.tenant_name}`, {
        description: `Confirmation email sent to ${inv.tenant_email}`,
      });
    } catch (e: unknown) {
      showToast.error("Failed to mark as paid", {
        description: (e as { message?: string }).message,
      });
    } finally {
      setMarkingPaidIds((p) => {
        const s = new Set(p);
        s.delete(inv.id);
        return s;
      });
    }
  };

  // ── Send all ──────────────────────────────────────────────────────────────
  const handleSendAll = async () => {
    const targets = invoices.filter(
      (i) => i.status === "pending" || i.status === "overdue"
    );
    if (!targets.length) {
      showToast.info("No pending invoices to send");
      return;
    }
    setIsSendingAll(true);
    try {
      await billingApi.sendAllInvoices(selYear, selMonth);
      showToast.success(
        `${targets.length} invoice${targets.length > 1 ? "s" : ""} sent successfully`,
        { description: "All tenants will receive their invoice email shortly." }
      );
      await loadInvoices();
    } catch (e: unknown) {
      showToast.error("Batch send failed", {
        description: (e as { message?: string }).message,
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  // ── Per-tenant amount editing ─────────────────────────────────────────────
  const openAmountEdit = (inv: BillingInvoice) => {
    setEditingAmountId(inv.id);
    setAmountDraft(String(inv.amount));
  };

  const cancelAmountEdit = () => {
    setEditingAmountId(null);
    setAmountDraft("");
  };

  const saveAmount = async (inv: BillingInvoice) => {
    const parsed = Number(amountDraft.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      showToast.error("Enter a valid amount");
      return;
    }
    setSavingAmountId(inv.id);
    try {
      const updated = await billingApi.updateInvoiceAmount(inv.id, parsed);
      setInvoices((p) =>
        p.map((i) => (i.id === inv.id ? { ...i, amount: updated.amount } : i))
      );
      setSelInvoice((p) =>
        p?.id === inv.id ? { ...p, amount: updated.amount } : p
      );
      setEditingAmountId(null);
      showToast.success(`Amount updated — ${fmt(updated.amount)}`, {
        description: `${inv.tenant_name}'s invoice has been adjusted.`,
      });
    } catch (e: unknown) {
      showToast.error("Failed to update amount", {
        description: (e as { message?: string }).message,
      });
    } finally {
      setSavingAmountId(null);
    }
  };

  // ── Bank details editing ──────────────────────────────────────────────────
  const openBankEdit = () => {
    setBankDraft({ ...bankDetails });
    setBankEdit(true);
  };

  const saveBankDetails = async () => {
    setIsSavingBank(true);
    try {
      try {
        const updated = await billingApi.updateConfig({
          bank_name: bankDraft.bankName,
          bank_account: bankDraft.bankAccount,
          bank_account_name: bankDraft.bankAccountName,
        });
        setConfig(updated);
        setBankDetails({
          bankName: updated.bank_name ?? bankDraft.bankName,
          bankAccount: updated.bank_account ?? bankDraft.bankAccount,
          bankAccountName: updated.bank_account_name ?? bankDraft.bankAccountName,
        });
        setBankIsLocal(false);
      } catch {
        // Backend PATCH not yet available — persist locally
        localStorage.setItem(LS_BANK_KEY, JSON.stringify(bankDraft));
        setBankDetails({ ...bankDraft });
        setBankIsLocal(true);
      }
      setBankEdit(false);
      showToast.success("Payment details updated");
    } finally {
      setIsSavingBank(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return invoices;
    return invoices.filter(
      (i) =>
        i.tenant_name.toLowerCase().includes(q) ||
        i.tenant_slug.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid");
    const sent = invoices.filter((i) => i.status === "sent").length;
    const overdue = invoices.filter((i) => i.status === "overdue").length;
    const pending = invoices.filter((i) => i.status === "pending").length;
    const total = invoices.reduce((acc, i) => acc + i.amount, 0);
    const collected = paid.reduce((acc, i) => acc + i.amount, 0);
    return {
      total,
      collected,
      outstanding: total - collected,
      count: invoices.length,
      paidCount: paid.length,
      sent,
      overdue,
      pending,
    };
  }, [invoices]);

  const collectedPct =
    stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0;

  const period = `${monthName(selMonth)} ${selYear}`;
  const monthOpts = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, l: monthName(i + 1) }));
  const yearOpts = [now.getFullYear(), now.getFullYear() - 1];

  type BillingMode = BillingConfig["billing_mode"];

  return (
    <DashboardLayout title="Billing & Revenue">
      <div className="space-y-5">

        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-indigo-600/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  {config.billing_mode.replace("_", " ")} Active
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">Billing & Revenue</h1>
              <p className="text-slate-400 text-sm mt-1">
                {period} · {stats.count} tenant{stats.count !== 1 ? "s" : ""} ·{" "}
                {fmt(config.flat_rate_ngn)}/month base rate
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Select value={String(selMonth)} onValueChange={(v) => setSelMonth(Number(v))}>
                <SelectTrigger className="w-28 h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOpts.map((m) => (
                    <SelectItem key={m.v} value={String(m.v)}>{m.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selYear)} onValueChange={(v) => setSelYear(Number(v))}>
                <SelectTrigger className="w-20 h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOpts.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadInvoices}
                disabled={isLoading}
                className="h-8 w-8 p-0 bg-white/10 border-white/20 text-white hover:bg-white/15 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                onClick={handleSendAll}
                disabled={isSendingAll || isLoading}
                className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-900/40"
              >
                {isSendingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send All Invoices
              </Button>
            </div>
          </div>

          {/* Collection progress */}
          <div className="relative mt-5 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Collection progress for {period}</span>
              <span className="text-xs font-bold text-white">{collectedPct}% collected</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${collectedPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
              <span>{fmt(stats.collected)} collected</span>
              <span>{fmt(stats.outstanding)} outstanding</span>
            </div>
          </div>
        </div>

        {/* ── Stats cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              {
                label: "Monthly Revenue",
                value: isLoading ? "—" : fmt(stats.total),
                sub: `${stats.count} tenant${stats.count !== 1 ? "s" : ""} (incl. custom rates)`,
                Icon: Banknote,
                color: "from-indigo-500/20 to-indigo-600/10 text-indigo-600",
                dot: "bg-indigo-500",
              },
              {
                label: "Collected",
                value: isLoading ? "—" : fmt(stats.collected),
                sub: `${stats.paidCount} invoice${stats.paidCount !== 1 ? "s" : ""} confirmed paid`,
                Icon: CheckCircle2,
                color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600",
                dot: "bg-emerald-500",
              },
              {
                label: "Outstanding",
                value: isLoading ? "—" : fmt(stats.outstanding),
                sub: `${stats.pending + stats.sent + stats.overdue} awaiting payment`,
                Icon: Clock,
                color: "from-amber-500/20 to-amber-600/10 text-amber-600",
                dot: "bg-amber-500",
              },
              {
                label: "Overdue",
                value: isLoading ? "—" : String(stats.overdue),
                sub:
                  stats.overdue > 0
                    ? "Needs immediate attention"
                    : "All invoices current",
                Icon: AlertTriangle,
                color:
                  stats.overdue > 0
                    ? "from-red-500/20 to-red-600/10 text-red-600"
                    : "from-slate-500/10 to-slate-600/5 text-muted-foreground",
                dot: stats.overdue > 0 ? "bg-red-500" : "bg-slate-300",
              },
            ] as const
          ).map(({ label, value, sub, Icon, color, dot }) => (
            <div key={label} className="relative rounded-xl border bg-card p-4 overflow-hidden">
              <div
                className={`absolute top-0 right-0 h-16 w-16 rounded-bl-[32px] bg-gradient-to-br ${color} opacity-50`}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                </div>
                <p className="text-2xl font-black leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
                <Icon
                  className={`absolute bottom-0 right-0 h-6 w-6 ${
                    color.split(" ").find((c) => c.startsWith("text-")) ??
                    "text-muted-foreground"
                  } opacity-20`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs defaultValue="invoices">
          <TabsList className="h-9 bg-muted/60">
            <TabsTrigger value="invoices" className="gap-1.5 text-xs">
              <Receipt className="h-3.5 w-3.5" /> Invoices — {period}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" /> Billing Settings
            </TabsTrigger>
          </TabsList>

          {/* ══ INVOICES TAB ════════════════════════════════════════════ */}
          <TabsContent value="invoices" className="mt-3">
            <div className="rounded-xl border bg-card">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9 text-sm"
                    placeholder="Search by name or invoice #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:ml-auto text-xs text-muted-foreground">
                  {(
                    [
                      ["paid", stats.paidCount, "bg-emerald-500"],
                      ["sent", stats.sent, "bg-blue-500"],
                      ["pending", stats.pending, "bg-amber-400"],
                      ["overdue", stats.overdue, "bg-red-500"],
                    ] as [string, number, string][]
                  )
                    .filter(([, count]) => count > 0)
                    .map(([key, count, dot]) => (
                      <span key={key} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${dot}`} />
                        {count} {key}
                      </span>
                    ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      {["Organization", "Invoice #", "Status", "Amount", "Due Date", "Actions"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground
                              ${i === 5 ? "text-right" : "text-left"}
                              ${i === 3 ? "text-right" : ""}
                              ${i === 4 ? "hidden sm:table-cell" : ""}`}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Loading billing data...</p>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <Receipt className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                          <p className="font-medium text-sm">No invoices found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {search
                              ? "Try a different search term"
                              : "No active tenants for this period"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((inv) => {
                        const isSending = sendingIds.has(inv.id);
                        const isMarkingPaid = markingPaidIds.has(inv.id);
                        const isEditingAmount = editingAmountId === inv.id;
                        const isSavingAmount = savingAmountId === inv.id;

                        return (
                          <tr
                            key={inv.id}
                            className={`border-b last:border-0 hover:bg-muted/30 transition-colors group ${
                              inv.status === "overdue"
                                ? "bg-red-50/50 dark:bg-red-950/10"
                                : ""
                            }`}
                          >
                            {/* Org */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 font-bold text-xs text-primary">
                                  {inv.tenant_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm leading-tight truncate max-w-[140px]">
                                    {inv.tenant_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {inv.tenant_slug}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Invoice # */}
                            <td className="px-4 py-3">
                              <code className="text-[11px] bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                                {inv.id}
                              </code>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <InvoiceStatusBadge status={inv.status} />
                            </td>

                            {/* Amount — inline editable */}
                            <td className="px-4 py-3 text-right">
                              {isEditingAmount ? (
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs text-muted-foreground shrink-0">₦</span>
                                  <Input
                                    className="h-7 w-28 text-xs text-right font-mono px-2"
                                    value={amountDraft}
                                    onChange={(e) => setAmountDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveAmount(inv);
                                      if (e.key === "Escape") cancelAmountEdit();
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => saveAmount(inv)}
                                    disabled={isSavingAmount}
                                    title="Save"
                                  >
                                    {isSavingAmount ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground"
                                    onClick={cancelAmountEdit}
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="font-mono font-bold text-sm whitespace-nowrap">
                                    {fmt(inv.amount)}
                                  </span>
                                  {inv.status !== "paid" && (
                                    <button
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground rounded p-0.5 hover:bg-muted"
                                      onClick={() => openAmountEdit(inv)}
                                      title="Edit amount for this client"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Due Date */}
                            <td
                              className={`px-4 py-3 text-xs whitespace-nowrap hidden sm:table-cell ${
                                inv.status === "overdue"
                                  ? "text-red-600 font-semibold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {fmtIso(inv.due_date)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  title="Preview invoice"
                                  onClick={() => {
                                    setSelInvoice(inv);
                                    setIsPreviewOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                {inv.status !== "paid" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => handleSend(inv)}
                                    disabled={isSending}
                                  >
                                    {isSending ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Send className="h-3.5 w-3.5" />
                                    )}
                                    {inv.status === "sent" ? "Resend" : "Send"}
                                  </Button>
                                )}

                                {inv.status !== "paid" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                    onClick={() => handleMarkPaid(inv)}
                                    disabled={isMarkingPaid}
                                  >
                                    {isMarkingPaid ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    {isMarkingPaid ? "..." : "Mark Paid"}
                                  </Button>
                                )}

                                {inv.status === "paid" && (
                                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 px-1 whitespace-nowrap">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {inv.paid_date ? `Paid ${fmtIso(inv.paid_date)}` : "Confirmed"}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!isLoading && filtered.length > 0 && (
                <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-muted-foreground bg-muted/20 rounded-b-xl">
                  <span>
                    {filtered.length} tenant{filtered.length !== 1 ? "s" : ""} · {period}
                  </span>
                  <span className="font-semibold text-foreground font-mono">
                    <TrendingUp className="h-3 w-3 inline mr-1 text-primary" />
                    {fmt(filtered.reduce((a, i) => a + i.amount, 0))} total
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══ SETTINGS TAB ════════════════════════════════════════════ */}
          <TabsContent value="settings" className="mt-3 space-y-4">

            {/* Billing Modes */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold">Billing Mode</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    How tenants are charged each billing cycle
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {config.billing_mode.replace("_", " ")} Active
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    {
                      mode: "flat_rate" as BillingMode,
                      Icon: Banknote,
                      title: "Flat Rate",
                      desc: "One fixed monthly fee per tenant — with per-client overrides supported.",
                    },
                    {
                      mode: "per_module" as BillingMode,
                      Icon: Package,
                      title: "Per Module",
                      desc: "Charge per module the tenant subscribes to.",
                    },
                    {
                      mode: "per_usage" as BillingMode,
                      Icon: Zap,
                      title: "Per Usage",
                      desc: "Charge based on actual usage: transactions, members, or API calls.",
                    },
                  ]
                ).map(({ mode, Icon, title, desc }) => {
                  const active = config.billing_mode === mode;
                  return (
                    <div
                      key={mode}
                      className={`relative rounded-xl border-2 p-4 transition-all ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 opacity-55"
                      }`}
                    >
                      {active && (
                        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <Icon className={`h-5 w-5 mb-3 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`text-sm font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                        {title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
                      <span
                        className={`mt-3 inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {active ? "Currently Active" : "Coming Soon"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rate Config */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold">Current Rate Configuration</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Base rates from the billing API — edit per-client amounts directly in the invoice table
                  </p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-mono">
                  GET /admin/billing/config
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Base Flat Rate", value: fmt(config.flat_rate_ngn), sub: "default per tenant / month", highlight: true },
                  { label: "Invoice Due", value: `${config.due_days} working days`, sub: "from invoice issue date", highlight: false },
                  { label: "Currency", value: config.currency, sub: "Nigerian Naira", highlight: false },
                ].map((r) => (
                  <div key={r.label} className="rounded-lg bg-muted/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                    <p className={`text-2xl font-black ${r.highlight ? "text-primary" : ""}`}>
                      {r.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.sub}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-4 py-3 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  To assign a custom amount to a specific client, hover their invoice row in the Invoices tab and click the <Pencil className="inline h-3 w-3 mx-0.5" /> pencil icon next to the amount. Paid invoices cannot be edited.
                </p>
              </div>
            </div>

            {/* Payment Collection Details — EDITABLE */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold">Payment Collection Details</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Bank account tenants should pay into — shown on every invoice
                  </p>
                </div>
                {!bankEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 shrink-0"
                    onClick={openBankEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Details
                  </Button>
                )}
              </div>

              {bankIsLocal && !bankEdit && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    These details are saved in this browser only. Once the backend supports{" "}
                    <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                      PATCH /admin/billing/config
                    </code>
                    , they will persist globally and reflect in emails sent to tenants.
                  </p>
                </div>
              )}

              {bankEdit ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        value={bankDraft.bankName}
                        onChange={(e) => setBankDraft((p) => ({ ...p, bankName: e.target.value }))}
                        placeholder="e.g. First Bank of Nigeria"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="bank-account-name">Account Name</Label>
                      <Input
                        id="bank-account-name"
                        value={bankDraft.bankAccountName}
                        onChange={(e) => setBankDraft((p) => ({ ...p, bankAccountName: e.target.value }))}
                        placeholder="e.g. Fynix CoBank Ltd"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="bank-account">Account Number</Label>
                      <Input
                        id="bank-account"
                        value={bankDraft.bankAccount}
                        onChange={(e) => setBankDraft((p) => ({ ...p, bankAccount: e.target.value }))}
                        placeholder="10-digit account number"
                        maxLength={20}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Payment Reference</Label>
                      <Input
                        value="Invoice number (auto-set)"
                        disabled
                        className="text-muted-foreground text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Always set to the invoice ID — cannot be changed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={saveBankDetails}
                      disabled={isSavingBank}
                    >
                      {isSavingBank ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save Details
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBankEdit(false)}
                      disabled={isSavingBank}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                  {[
                    ["Bank", bankDetails.bankName],
                    ["Account Name", bankDetails.bankAccountName],
                    ["Account Number", bankDetails.bankAccount],
                    ["Payment Reference", "Invoice number (e.g. INV-2026-07-0012)"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                      <p className={`font-semibold text-sm ${k === "Account Number" ? "font-mono" : ""}`}>
                        {v}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Company info (read-only) */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-bold">Company Information</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded ml-auto">
                  Read-only
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-y-4 gap-x-8">
                {[
                  ["Company Name", CO_FIXED.name],
                  ["Billing Email", CO_FIXED.email],
                  ["Address", CO_FIXED.address],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                    <p className="font-semibold text-sm">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Invoice Preview Modal ─────────────────────────────────────── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[92vh] overflow-hidden p-0 gap-0 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-background shrink-0">
            <DialogTitle className="text-sm font-mono font-semibold">
              {selInvoice?.id}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {selInvoice?.status !== "paid" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    disabled={sendingIds.has(selInvoice?.id ?? "")}
                    onClick={() => selInvoice && handleSend(selInvoice)}
                  >
                    {sendingIds.has(selInvoice?.id ?? "") ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {selInvoice?.status === "sent" ? "Resend Invoice" : "Send Invoice"}
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={markingPaidIds.has(selInvoice?.id ?? "")}
                    onClick={() => selInvoice && handleMarkPaid(selInvoice)}
                  >
                    {markingPaidIds.has(selInvoice?.id ?? "") ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Mark Paid & Notify
                  </Button>
                </>
              )}
              {selInvoice?.status === "paid" && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Paid & Confirmed
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-5 bg-gray-100 dark:bg-muted/40">
            {selInvoice && (
              <InvoiceDocument inv={selInvoice} bank={bankDetails} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
