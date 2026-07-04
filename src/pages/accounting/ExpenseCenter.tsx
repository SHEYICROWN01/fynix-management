import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Eye, Wallet, Layers, Calendar, Gauge, Upload } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { financeApi, type FinExpense } from "@/lib/api";

const TOOLTIP = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px", color: "hsl(var(--foreground))", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 },
};

const CATEGORY_COLORS = [
  "hsl(234, 89%, 54%)", "hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)", "hsl(271, 81%, 56%)", "hsl(0, 84%, 60%)",
  "hsl(190, 90%, 45%)", "hsl(330, 81%, 56%)",
];

const CATEGORIES = [
  "Office Rent", "Electricity", "Fuel", "Internet", "Cloud Hosting", "Domain", "SSL",
  "Email Services", "SMS Purchase Cost", "API Purchase Cost", "Staff Salary", "Developer Salary",
  "Marketing", "Facebook Ads", "Google Ads", "Transportation", "Meals", "Office Equipment",
  "Laptop Purchase", "Software Licenses", "Legal Fees", "Government Compliance", "Tax",
  "Insurance", "Miscellaneous", "Emergency", "Investor Meeting Costs", "Training",
];

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

function statusBadge(status: FinExpense["status"]) {
  const cls = status === "approved"
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
    : status === "pending"
    ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
    : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${cls} capitalize`}>{status}</span>;
}

export default function ExpenseCenter() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [form, setForm] = useState({ description: "", vendor: "", amount: "", reference: "", notes: "", date: "" });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["fin-expense-summary"],
    queryFn: () => financeApi.getExpenseSummary(),
    staleTime: 60_000,
  });
  const { data: expensesPage, isLoading: loadingExpenses } = useQuery({
    queryKey: ["fin-expenses"],
    queryFn: () => financeApi.listExpenses({ page: 1 }),
    staleTime: 2 * 60_000,
  });
  const expenses = expensesPage?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof financeApi.createExpense>[0]) => financeApi.createExpense(data),
    onSuccess: () => {
      toast.success("Expense recorded.");
      qc.invalidateQueries({ queryKey: ["fin-expenses"] });
      qc.invalidateQueries({ queryKey: ["fin-expense-summary"] });
      setOpen(false);
      setCategory(""); setMethod(""); setRecurring(false);
      setForm({ description: "", vendor: "", amount: "", reference: "", notes: "", date: "" });
    },
    onError: () => toast.error("Failed to save expense."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteExpense(id, "Deleted by admin"),
    onSuccess: () => { toast.success("Expense deleted."); qc.invalidateQueries({ queryKey: ["fin-expenses"] }); },
    onError: () => toast.error("Failed to delete."),
  });

  function handleSave() {
    if (!category || !method || !form.amount || !form.description || !form.vendor || !form.date) {
      toast.error("Please fill all required fields.");
      return;
    }
    createMutation.mutate({
      description: form.description, category, vendor: form.vendor,
      amount: Number(form.amount), payment_method: method, company_account_id: 1,
      expense_date: form.date, reference: form.reference || undefined,
      notes: form.notes || undefined, is_recurring: recurring,
    });
  }

  const byCategory = (summary?.by_category ?? []).map((c, i) => ({
    name: c.category, value: c.amount, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <DashboardLayout title="Expense Management">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Expense Management</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Track, categorize and approve business expenses</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Record Expense
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loadingSummary ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-[110px]" />) : (
            <>
              {[
                { label: "Total Expenses MTD", value: fmtNGN(summary?.mtd_total ?? 0), icon: Wallet },
                { label: "Largest Category", value: summary?.largest_category?.name ?? "—", icon: Layers, small: true },
                { label: "Avg Daily Expense", value: fmtNGN(summary?.avg_daily), icon: Calendar },
                { label: "Budget Utilization", value: `${summary?.budget_utilization_percent?.toFixed(1) ?? "0"}%`, icon: Gauge },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
                      <k.icon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                  <p className={`${(k as { small?: boolean }).small ? "text-[18px]" : "text-[26px]"} font-bold tracking-tight text-foreground leading-none`}>{k.value}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{k.label}</p>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-foreground">Expense Records</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">{expenses.length} expenses</p>
            </div>
            {loadingExpenses ? <Sk className="h-[300px]" /> : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      {["Date", "Description", "Category", "Vendor", "Amount", "Method", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.map((e) => (
                      <tr key={e.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{e.expense_date}</td>
                        <td className="px-3 py-3 text-[13px] font-medium text-foreground">{e.description}</td>
                        <td className="px-3 py-3 text-[12px] text-muted-foreground">{e.category}</td>
                        <td className="px-3 py-3 text-[12px] text-muted-foreground">{e.vendor}</td>
                        <td className="px-3 py-3 text-[13px] text-right text-foreground whitespace-nowrap">{fmtNGN(e.amount)}</td>
                        <td className="px-3 py-3 text-[12px] text-muted-foreground">{e.payment_method}</td>
                        <td className="px-3 py-3">{statusBadge(e.status)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => toast.info(`Viewing ${e.id}`)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(e.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-rose-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4"><h3 className="text-[14px] font-semibold text-foreground">Expenses by Category</h3></div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                      {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip {...TOOLTIP} formatter={(v: number) => [fmtNGN(v), "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {byCategory.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-foreground truncate max-w-[110px]">{c.name}</span>
                    </div>
                    <span className="font-medium text-muted-foreground">{fmtNGN(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4"><h3 className="text-[14px] font-semibold text-foreground">Budget vs Actual</h3></div>
              <div className="space-y-3">
                {byCategory.slice(0, 6).map((b) => {
                  const pct = Math.min(100, (b.value / (b.value * 1.3)) * 100);
                  const over = pct >= 90;
                  return (
                    <div key={b.name}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="text-foreground truncate mr-2">{b.name}</span>
                        <span className="text-muted-foreground">{fmtNGN(b.value)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${over ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">Category *</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Amount (₦) *</label>
              <Input type="number" placeholder="0.00" className="mt-1" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[12px] font-medium text-foreground">Description *</label>
              <Input placeholder="What is this expense for?" className="mt-1" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Vendor *</label>
              <Input placeholder="Vendor name" className="mt-1" value={form.vendor} onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Payment Method *</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Reference</label>
              <Input placeholder="REF-000000" className="mt-1" value={form.reference} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Expense Date *</label>
              <Input type="date" className="mt-1" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[12px] font-medium text-foreground">Notes</label>
              <Input placeholder="Additional notes (optional)" className="mt-1" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="recurring" type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 rounded border-border" />
              <label htmlFor="recurring" className="text-[12px] font-medium text-foreground">Recurring expense</label>
            </div>
            <div className="md:col-span-2">
              <label className="text-[12px] font-medium text-foreground">Receipt</label>
              <div className="mt-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                <Upload className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-[12px] text-muted-foreground">Drag & drop or click to upload receipt</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving…" : "Save Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
