import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, ArrowLeftRight, TrendingUp, Wallet,
  CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";
import { financeApi, type FinCompanyAccount } from "@/lib/api";

function fmtNGN(n: number | undefined | null): string {
  const v = n ?? 0;
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v.toLocaleString()}`;
}

function fmt(n: number, cur: string): string {
  if (cur === "USD") return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return fmtNGN(n);
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function StatusBadge({ s }: { s: "active" | "frozen" }) {
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${s === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"}`}>
      {s === "active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {s === "active" ? "Active" : "Frozen"}
    </span>
  );
}

export default function CompanyAccounts() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [txnFilter, setTxnFilter] = useState<"all" | "credit" | "debit">("all");
  const [form, setForm] = useState({ from: "", to: "", amount: "", description: "", reference: "" });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["fin-accounts"],
    queryFn: () => financeApi.listCompanyAccounts(),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 2 * 60_000,
  });
  const { data: position, isLoading: loadingPos } = useQuery({
    queryKey: ["fin-account-position"],
    queryFn: () => financeApi.getAccountPosition(),
    staleTime: 2 * 60_000,
  });
  const { data: txnPage, isLoading: loadingTxns } = useQuery({
    queryKey: ["fin-account-txns", selectedId, txnFilter],
    queryFn: () => financeApi.getAccountTransactions(selectedId!, { type: txnFilter === "all" ? undefined : txnFilter, page: 1 }),
    enabled: selectedId !== null,
    staleTime: 60_000,
  });

  const transferMut = useMutation({
    mutationFn: () => financeApi.createTransfer({
      from_account_id: Number(form.from),
      to_account_id: Number(form.to),
      amount: Number(form.amount),
      description: form.description,
      reference: form.reference || undefined,
    }),
    onSuccess: () => {
      toast.success("Transfer initiated successfully");
      setTransferOpen(false);
      setForm({ from: "", to: "", amount: "", description: "", reference: "" });
      qc.invalidateQueries({ queryKey: ["fin-accounts"] });
      qc.invalidateQueries({ queryKey: ["fin-account-position"] });
    },
    onError: () => toast.error("Transfer failed — check details and try again"),
  });

  const selected = accounts.find((a) => a.id === selectedId);
  const txns = txnPage?.data ?? [];

  return (
    <DashboardLayout title="Company Accounts">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Company Accounts</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Manage bank accounts and internal transfers</p>
          </div>
          <Button size="sm" onClick={() => setTransferOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-1.5" /> Internal Transfer
          </Button>
        </div>

        {/* Position summary */}
        <div className="grid gap-4 md:grid-cols-3">
          {loadingPos ? (
            Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-[100px]" />)
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg mb-3 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Wallet className="h-4 w-4" />
                </div>
                <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{fmtNGN(position?.ngn ?? 0)}</p>
                <p className="text-[12px] text-muted-foreground mt-1">Total NGN Position</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg mb-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">${(position?.usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                <p className="text-[12px] text-muted-foreground mt-1">Total USD Position</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg mb-3 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{position?.accounts_count ?? 0}</p>
                <p className="text-[12px] text-muted-foreground mt-1">Active Accounts</p>
              </div>
            </>
          )}
        </div>

        {/* Account cards + transactions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-[14px] font-semibold text-foreground">Bank Accounts</h3>
            {loadingAccounts
              ? Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-[140px]" />)
              : accounts.map((a) => <AccountCard key={a.id} a={a} active={a.id === selectedId} onClick={() => setSelectedId(a.id === selectedId ? null : a.id)} />)}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground">
                <Building2 className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-[13px]">Select an account to view transactions</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">{selected.name}</h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{selected.bank} · {selected.account_number}</p>
                  </div>
                  <div className="flex gap-2">
                    {(["all", "credit", "debit"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTxnFilter(f)}
                        className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors capitalize ${txnFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                {loadingTxns ? <Sk className="h-[300px]" /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {["Date", "Description", "Type", "Amount", "Balance", "Reference"].map((h) => (
                            <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {txns.length === 0 ? (
                          <tr><td colSpan={6} className="px-3 py-10 text-center text-[13px] text-muted-foreground">No transactions found</td></tr>
                        ) : txns.map((t, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-3 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{t.date}</td>
                            <td className="px-3 py-3 text-[13px] text-foreground max-w-[180px] truncate">{t.description}</td>
                            <td className="px-3 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${t.type === "credit" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"}`}>
                                {t.type === "credit" ? "Credit" : "Debit"}
                              </span>
                            </td>
                            <td className={`px-3 py-3 text-[13px] font-semibold text-right ${t.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {t.type === "credit" ? "+" : "-"}{fmt(t.amount, selected.currency)}
                            </td>
                            <td className="px-3 py-3 text-[13px] text-right text-foreground">{fmt(t.balance, selected.currency)}</td>
                            <td className="px-3 py-3 text-[12px] font-mono text-muted-foreground">{t.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Internal Transfer</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[13px]">From Account</Label>
              <Select value={form.from} onValueChange={(v) => setForm((p) => ({ ...p, from: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({fmt(a.available_balance, a.currency)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px]">To Account</Label>
              <Select value={form.to} onValueChange={(v) => setForm((p) => ({ ...p, to: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.filter((a) => String(a.id) !== form.from).map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px]">Amount</Label>
              <Input type="number" placeholder="0.00" className="mt-1.5" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[13px]">Description</Label>
              <Input placeholder="e.g. Salary funding" className="mt-1.5" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[13px]">Reference <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. TRF-2026-001" className="mt-1.5" value={form.reference} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button
              onClick={() => transferMut.mutate()}
              disabled={!form.from || !form.to || !form.amount || !form.description || transferMut.isPending}
            >
              {transferMut.isPending ? "Processing…" : "Initiate Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function AccountCard({ a, active, onClick }: { a: FinCompanyAccount; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${active ? "border-primary/60 bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[13px] font-semibold text-foreground">{a.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{a.bank}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge s={a.status} />
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${active ? "rotate-90" : ""}`} />
        </div>
      </div>
      <p className="text-[20px] font-bold tracking-tight text-foreground leading-none">
        {a.currency === "USD" ? `$${a.available_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `₦${a.available_balance.toLocaleString()}`}
      </p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-muted-foreground">Available · {a.account_number.slice(-4).padStart(a.account_number.length, "•")}</p>
        <p className="text-[11px] text-muted-foreground">{a.txn_count} txns</p>
      </div>
      {a.pending_debits > 0 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">Pending debits: {a.currency === "USD" ? `$${a.pending_debits.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `₦${a.pending_debits.toLocaleString()}`}</p>
      )}
    </button>
  );
}
