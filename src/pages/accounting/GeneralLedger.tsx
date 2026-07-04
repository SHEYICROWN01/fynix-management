import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { financeApi, type FinJournalEntry, type FinChartOfAccount } from "@/lib/api";

function fmtNGN(n: number | undefined | null): string {
  const v = n ?? 0;
  return `₦${v.toLocaleString()}`;
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function JournalRow({ e }: { e: FinJournalEntry }) {
  const [open, setOpen] = useState(false);
  const totalDebit = e.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = e.lines.reduce((s, l) => s + l.credit, 0);
  return (
    <>
      <tr className="group hover:bg-muted/30 transition-colors border-b border-border">
        <td className="px-3 py-3">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[13px] font-mono font-medium text-foreground">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {e.entry_id}
          </button>
        </td>
        <td className="px-3 py-3 text-[12px] text-muted-foreground">{e.date}</td>
        <td className="px-3 py-3 text-[13px] text-foreground">{e.description}</td>
        <td className="px-3 py-3 text-[12px] text-muted-foreground">{e.lines[0]?.account_name ?? "—"}</td>
        <td className="px-3 py-3 text-[13px] text-right text-foreground">{totalDebit ? fmtNGN(totalDebit) : "—"}</td>
        <td className="px-3 py-3 text-[13px] text-right text-foreground">{totalCredit ? fmtNGN(totalCredit) : "—"}</td>
        <td className="px-3 py-3 text-[12px] text-muted-foreground">{e.posted_by}</td>
      </tr>
      {open && (
        <tr className="bg-muted/20 border-b border-border">
          <td colSpan={7} className="px-10 py-3">
            <div className="grid grid-cols-1 gap-2">
              {e.lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-[13px]">
                  <span className="text-muted-foreground">{l.debit ? "Dr." : "Cr."} {l.account_code} — {l.account_name}</span>
                  <span className="font-medium text-foreground">{fmtNGN(l.debit || l.credit)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface AccountGroup {
  group: string;
  accounts: FinChartOfAccount[];
}

function groupAccounts(accounts: FinChartOfAccount[]): AccountGroup[] {
  const groups: Record<string, FinChartOfAccount[]> = {};
  for (const a of accounts) {
    if (!a?.code) continue;
    const prefix = a.code[0] + "000s";
    const groupName = {
      "1000s": "1000s — Assets",
      "2000s": "2000s — Liabilities",
      "3000s": "3000s — Equity",
      "4000s": "4000s — Revenue",
      "5000s": "5000s — Expenses",
      "6000s": "6000s — Cost of Sales",
    }[prefix] ?? `${prefix}`;
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(a);
  }
  return Object.entries(groups).map(([group, accts]) => ({ group, accounts: accts }));
}

function AccountAccordion({ g }: { g: AccountGroup }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-muted/30">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-[14px] font-semibold text-foreground">{g.group}</span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.accounts.length} accounts</span>
      </button>
      {open && (
        <table className="w-full border-t border-border">
          <tbody className="divide-y divide-border">
            {g.accounts.map((a) => (
              <tr key={a.code} className="hover:bg-muted/20">
                <td className="px-5 py-2.5 text-[12px] font-mono text-muted-foreground w-20">{a.code}</td>
                <td className="px-3 py-2.5 text-[13px] font-medium text-foreground">{a.name}</td>
                <td className="px-3 py-2.5 text-[12px] text-muted-foreground">{a.type}</td>
                <td className={`px-5 py-2.5 text-[13px] text-right font-medium ${a.balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>{fmtNGN(a.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function GeneralLedger() {
  const [tab, setTab] = useState("journal");

  const { data: journalPage, isLoading: loadingJournal } = useQuery({
    queryKey: ["fin-journal"],
    queryFn: () => financeApi.listJournalEntries({ page: 1 }),
    staleTime: 5 * 60_000,
  });
  const { data: coaRaw = [], isLoading: loadingCoa } = useQuery({
    queryKey: ["fin-coa"],
    queryFn: () => financeApi.getChartOfAccounts(),
    staleTime: 10 * 60_000,
  });
  const { data: trial, isLoading: loadingTrial } = useQuery({
    queryKey: ["fin-trial-balance"],
    queryFn: () => financeApi.getTrialBalance(),
    staleTime: 5 * 60_000,
  });

  const entries = journalPage?.data ?? [];
  const grouped = groupAccounts(Array.isArray(coaRaw) ? coaRaw : []);

  return (
    <DashboardLayout title="General Ledger">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">General Ledger</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Journal entries, chart of accounts and trial balance</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="journal">Journal Entries</TabsTrigger>
            <TabsTrigger value="coa">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="trial">Trial Balance</TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Journal Entries</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{entries.length} entries · expand to view lines</p>
                </div>
              </div>
              {loadingJournal ? <Sk className="h-[300px]" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["Entry #", "Date", "Description", "Account", "Debit", "Credit", "Posted By"].map((h) => (
                          <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => <JournalRow key={e.entry_id} e={e} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="coa" className="mt-6 space-y-4">
            {loadingCoa
              ? Array.from({ length: 5 }).map((_, i) => <Sk key={i} className="h-[120px]" />)
              : grouped.map((g) => <AccountAccordion key={g.group} g={g} />)
            }
          </TabsContent>

          <TabsContent value="trial" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Trial Balance</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Current balances</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success("Trial balance exported")}>
                  <Download className="h-4 w-4 mr-1.5" /> Export
                </Button>
              </div>
              {loadingTrial ? <Sk className="h-[300px]" /> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {["Account Code", "Account Name", "Debit", "Credit"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(trial?.accounts ?? []).map((r, i) => (
                          <tr key={`${r.code}-${i}`} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-[12px] font-mono text-muted-foreground">{r.code}</td>
                            <td className="px-4 py-3 text-[13px] font-medium text-foreground">{r.name}</td>
                            <td className="px-4 py-3 text-[13px] text-right text-foreground">{r.debit ? fmtNGN(r.debit) : "—"}</td>
                            <td className="px-4 py-3 text-[13px] text-right text-foreground">{r.credit ? fmtNGN(r.credit) : "—"}</td>
                          </tr>
                        ))}
                        <tr className="bg-muted/40 border-t-2 border-border">
                          <td colSpan={2} className="px-4 py-3 text-[13px] font-bold text-foreground">Total</td>
                          <td className="px-4 py-3 text-[13px] text-right font-bold text-foreground">{fmtNGN(trial?.totals?.debit ?? 0)}</td>
                          <td className="px-4 py-3 text-[13px] text-right font-bold text-foreground">{fmtNGN(trial?.totals?.credit ?? 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {trial?.balanced && (
                    <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mt-3">
                      ✓ Debits and credits balance at {fmtNGN(trial?.totals?.debit ?? 0)}
                    </p>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
