import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText, FileBarChart, FileSpreadsheet, Receipt, TrendingUp, Wallet, Repeat,
  MessageSquare, Building2, FileWarning, Landmark, CalendarRange, Briefcase, Download,
} from "lucide-react";
import { financeApi } from "@/lib/api";

function fmtNGN(n: number | undefined | null): string {
  const v = n ?? 0;
  const neg = n < 0;
  const a = Math.abs(n);
  const s = `₦${a.toLocaleString()}`;
  return neg ? `(${s})` : s;
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

const reports = [
  { id: "income", title: "Income Statement (P&L)", desc: "Revenue, costs and net profit", icon: FileBarChart },
  { id: "balance", title: "Balance Sheet", desc: "Assets, liabilities and equity", icon: Landmark },
  { id: "cashflow", title: "Cash Flow Statement", desc: "Operating, investing, financing", icon: TrendingUp },
  { id: "trial", title: "Trial Balance", desc: "Debits and credits summary", icon: FileSpreadsheet },
  { id: "revenue", title: "Revenue Report", desc: "Revenue by source & category", icon: Repeat },
  { id: "expense", title: "Expense Report", desc: "Expenses by category", icon: Wallet },
  { id: "sub", title: "Subscription Revenue Report", desc: "Recurring revenue analysis", icon: Repeat },
  { id: "sms", title: "SMS Profit Report", desc: "SMS margin breakdown", icon: MessageSquare },
  { id: "inst", title: "Institution Revenue Report", desc: "Revenue per institution", icon: Building2 },
  { id: "invoice", title: "Outstanding Invoice Report", desc: "Aged receivables", icon: FileWarning },
  { id: "tax", title: "Tax Report", desc: "VAT and tax obligations", icon: Receipt },
  { id: "annual", title: "Annual Financial Summary", desc: "Full year overview", icon: CalendarRange },
  { id: "investor", title: "Investor Report", desc: "Key metrics for investors", icon: Briefcase },
];

function nowDate(): string {
  return new Date().toISOString().split("T")[0];
}
function startOfMonth(): string {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split("T")[0];
}

export default function FinancialReports() {
  const [active, setActive] = useState<string | null>(null);

  const { data: incomeStatement, isLoading: loadingIncome } = useQuery({
    queryKey: ["fin-income-statement"],
    queryFn: () => financeApi.getIncomeStatement(startOfMonth(), nowDate()),
    enabled: active === "income",
    staleTime: 5 * 60_000,
  });
  const { data: balanceSheet, isLoading: loadingBalance } = useQuery({
    queryKey: ["fin-balance-sheet"],
    queryFn: () => financeApi.getBalanceSheet(nowDate()),
    enabled: active === "balance",
    staleTime: 5 * 60_000,
  });

  const exportMutation = useMutation({
    mutationFn: (data: Parameters<typeof financeApi.exportReport>[0]) => financeApi.exportReport(data),
    onSuccess: () => toast.success("Report exported"),
    onError: () => toast.error("Export failed"),
  });

  function openReport(id: string) {
    if (id === "income" || id === "balance") setActive(id);
    else toast.success(`${reports.find((r) => r.id === id)?.title} generation started`);
  }

  const is = incomeStatement;

  return (
    <DashboardLayout title="Financial Reports Center">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Reports Center</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Generate, view and export financial statements</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => exportMutation.mutate({ report_type: "all", format: "pdf", from: startOfMonth(), to: nowDate() })}>
              <Download className="h-4 w-4 mr-1.5" /> Export All
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <button key={r.id} onClick={() => openReport(r.id)}
              className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <r.icon className="h-5 w-5 text-primary" />
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-[14px] font-semibold text-foreground">{r.title}</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Income Statement Dialog */}
      <Dialog open={active === "income"} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Income Statement (P&L)</DialogTitle></DialogHeader>
          {loadingIncome ? <Sk className="h-[300px]" /> : is ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Line Item</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {is.revenue.lines.map((l) => (
                  <tr key={l.source}>
                    <td className="px-4 py-2.5 text-[13px] text-muted-foreground">{l.source}</td>
                    <td className="px-4 py-2.5 text-[13px] text-right text-foreground">{fmtNGN(l.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="px-4 py-2.5 text-[13px] font-bold text-foreground">Total Revenue</td>
                  <td className="px-4 py-2.5 text-[13px] text-right font-bold text-foreground">{fmtNGN(is.revenue.total)}</td>
                </tr>
                {is.cost_of_revenue.lines.map((l) => (
                  <tr key={l.item}>
                    <td className="px-4 py-2.5 text-[13px] text-muted-foreground">{l.item}</td>
                    <td className="px-4 py-2.5 text-[13px] text-right text-rose-600 dark:text-rose-400">{fmtNGN(-l.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="px-4 py-2.5 text-[13px] font-bold text-foreground">Gross Profit</td>
                  <td className="px-4 py-2.5 text-[13px] text-right font-bold text-foreground">{fmtNGN(is.gross_profit)}</td>
                </tr>
                {is.operating_expenses.lines.map((l) => (
                  <tr key={l.item}>
                    <td className="px-4 py-2.5 text-[13px] text-muted-foreground">{l.item}</td>
                    <td className="px-4 py-2.5 text-[13px] text-right text-rose-600 dark:text-rose-400">{fmtNGN(-l.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="px-4 py-2.5 text-[13px] font-bold text-foreground">EBITDA</td>
                  <td className="px-4 py-2.5 text-[13px] text-right font-bold text-foreground">{fmtNGN(is.ebitda)}</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="px-4 py-2.5 text-[13px] font-bold text-foreground">Net Profit</td>
                  <td className={`px-4 py-2.5 text-[13px] text-right font-bold ${is.net_profit < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmtNGN(is.net_profit)}</td>
                </tr>
              </tbody>
            </table>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => exportMutation.mutate({ report_type: "income_statement", format: "xlsx", from: startOfMonth(), to: nowDate() })}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export Excel
            </Button>
            <Button onClick={() => exportMutation.mutate({ report_type: "income_statement", format: "pdf", from: startOfMonth(), to: nowDate() })}>
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Sheet Dialog */}
      <Dialog open={active === "balance"} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Balance Sheet</DialogTitle></DialogHeader>
          {loadingBalance ? <Sk className="h-[300px]" /> : balanceSheet ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-[13px] font-bold text-foreground mb-2">Assets</h4>
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 text-[13px] text-muted-foreground">Cash & Bank</td><td className="py-2 text-[13px] text-right text-foreground">{fmtNGN(balanceSheet.assets.current_assets.cash)}</td></tr>
                    <tr><td className="py-2 text-[13px] text-muted-foreground">Accounts Receivable</td><td className="py-2 text-[13px] text-right text-foreground">{fmtNGN(balanceSheet.assets.current_assets.receivables)}</td></tr>
                    <tr><td className="py-2 text-[13px] text-muted-foreground">Equipment (net)</td><td className="py-2 text-[13px] text-right text-foreground">{fmtNGN(balanceSheet.assets.fixed_assets.equipment)}</td></tr>
                    <tr className="bg-muted/30"><td className="py-2 px-2 text-[13px] font-bold text-foreground">Total Assets</td><td className="py-2 px-2 text-[13px] text-right font-bold text-foreground">{fmtNGN(balanceSheet.assets.total_assets)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-foreground mb-2">Liabilities</h4>
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 text-[13px] text-muted-foreground">Accounts Payable</td><td className="py-2 text-[13px] text-right text-foreground">{fmtNGN(balanceSheet.liabilities.current_liabilities.payables)}</td></tr>
                    <tr><td className="py-2 text-[13px] text-muted-foreground">Tax Payable</td><td className="py-2 text-[13px] text-right text-foreground">{fmtNGN(balanceSheet.liabilities.current_liabilities.tax_payable)}</td></tr>
                    <tr className="bg-muted/30"><td className="py-2 px-2 text-[13px] font-bold text-foreground">Total Liabilities</td><td className="py-2 px-2 text-[13px] text-right font-bold text-foreground">{fmtNGN(balanceSheet.liabilities.total_liabilities)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-foreground mb-2">Equity</h4>
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 text-[13px] text-muted-foreground">Owner's Equity</td><td className="py-2 text-[13px] text-right text-foreground">{fmtNGN(balanceSheet.equity.owners_equity)}</td></tr>
                    <tr><td className="py-2 text-[13px] text-muted-foreground">Retained Earnings</td><td className="py-2 text-[13px] text-right text-foreground">{fmtNGN(balanceSheet.equity.retained_earnings)}</td></tr>
                    <tr className="bg-muted/30"><td className="py-2 px-2 text-[13px] font-bold text-foreground">Total Equity</td><td className="py-2 px-2 text-[13px] text-right font-bold text-foreground">{fmtNGN(balanceSheet.equity.total_equity)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className={`rounded-lg border px-4 py-3 ${balanceSheet.check.balanced ? "border-emerald-500/20 bg-emerald-500/10" : "border-rose-500/20 bg-rose-500/10"}`}>
                <p className={`text-[13px] font-semibold ${balanceSheet.check.balanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {balanceSheet.check.balanced ? "✓" : "✗"} Assets {fmtNGN(balanceSheet.check.assets)} = Liabilities + Equity {fmtNGN(balanceSheet.check.liabilities_and_equity)}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => exportMutation.mutate({ report_type: "balance_sheet", format: "xlsx", as_of: nowDate() })}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export Excel
            </Button>
            <Button onClick={() => exportMutation.mutate({ report_type: "balance_sheet", format: "pdf", as_of: nowDate() })}>
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
