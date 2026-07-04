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
import { Wallet, TrendingDown, CalendarDays, ClipboardList, Plus, CheckCircle2, Clock } from "lucide-react";
import { financeApi } from "@/lib/api";

function fmtNGN(n: number | undefined | null): string {
  const v = n ?? 0;
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v.toLocaleString()}`;
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

const CATEGORIES = ["Personal Expenses", "Business Travel", "Medical", "Education", "Investment", "Emergency", "Other"];

export default function OwnersDraw() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    owner_name: "", amount: "", purpose: "", notes: "",
    withdrawal_date: new Date().toISOString().split("T")[0],
  });
  const [category, setCategory] = useState("Personal Expenses");
  const [accountId, setAccountId] = useState("1");

  const { data: draws = [], isLoading: loadingDraws } = useQuery({
    queryKey: ["fin-owner-draws"],
    queryFn: () => financeApi.listOwnerDraws(),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 2 * 60_000,
  });
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["fin-owner-draw-summary"],
    queryFn: () => financeApi.getOwnerDrawSummary(),
    staleTime: 2 * 60_000,
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["fin-accounts"],
    queryFn: () => financeApi.listCompanyAccounts(),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 5 * 60_000,
  });

  const createMut = useMutation({
    mutationFn: () => financeApi.createOwnerDraw({
      owner_name: form.owner_name,
      amount: Number(form.amount),
      purpose: form.purpose,
      category,
      company_account_id: Number(accountId),
      withdrawal_date: form.withdrawal_date,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      toast.success("Withdrawal recorded successfully");
      setOpen(false);
      setForm({ owner_name: "", amount: "", purpose: "", notes: "", withdrawal_date: new Date().toISOString().split("T")[0] });
      setCategory("Personal Expenses");
      qc.invalidateQueries({ queryKey: ["fin-owner-draws"] });
      qc.invalidateQueries({ queryKey: ["fin-owner-draw-summary"] });
    },
    onError: () => toast.error("Failed to record withdrawal"),
  });

  const kpiCards = [
    { label: "MTD Withdrawals", value: fmtNGN(summary?.mtd ?? 0), icon: Wallet, tone: "blue" },
    { label: "YTD Total", value: fmtNGN(summary?.ytd ?? 0), icon: TrendingDown, tone: "rose" },
    { label: "Avg Monthly", value: fmtNGN(summary?.avg_monthly ?? 0), icon: CalendarDays, tone: "violet" },
    { label: "Total Records", value: String(summary?.total_records ?? draws.length), icon: ClipboardList, tone: "amber" },
  ];

  const toneMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <DashboardLayout title="Owner's Draw">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Owner's Draw</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Track founder and owner withdrawals</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Record Withdrawal
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loadingSummary
            ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-[110px]" />)
            : kpiCards.map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${toneMap[k.tone]}`}>
                    <k.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{k.value}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{k.label}</p>
                </div>
              ))}
        </div>

        {/* Draws table */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Withdrawal History</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{draws.length} records</p>
          </div>
          {loadingDraws ? <Sk className="h-[300px]" /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Owner", "Purpose", "Category", "Account", "Amount", "Approved By", "Status"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {draws.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-12 text-center text-[13px] text-muted-foreground">No withdrawals recorded yet</td></tr>
                  ) : draws.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{d.withdrawal_date}</td>
                      <td className="px-3 py-3 text-[13px] font-medium text-foreground">{d.owner_name}</td>
                      <td className="px-3 py-3 text-[13px] text-foreground max-w-[160px] truncate">{d.purpose}</td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">{d.category}</td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">{d.account_name}</td>
                      <td className="px-3 py-3 text-[13px] font-semibold text-right text-foreground">{fmtNGN(d.amount)}</td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">{d.approved_by || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border w-fit ${d.status === "approved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
                          {d.status === "approved" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {d.status === "approved" ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Withdrawal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[13px]">Owner Name</Label>
              <Input placeholder="e.g. John Doe" className="mt-1.5" value={form.owner_name} onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[13px]">Amount (₦)</Label>
                <Input type="number" placeholder="0" className="mt-1.5" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <Label className="text-[13px]">Date</Label>
                <Input type="date" className="mt-1.5" value={form.withdrawal_date} onChange={(e) => setForm((p) => ({ ...p, withdrawal_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-[13px]">Purpose</Label>
              <Input placeholder="Brief description of withdrawal" className="mt-1.5" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[13px]">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[13px]">Debit Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0
                      ? <SelectItem value="1">Account #1</SelectItem>
                      : accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[13px]">Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="Additional context" className="mt-1.5" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={!form.owner_name || !form.amount || !form.purpose || createMut.isPending}
            >
              {createMut.isPending ? "Saving…" : "Record Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
