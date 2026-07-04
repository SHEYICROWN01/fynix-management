import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ConfirmActionModal, type ConfirmActionConfig, type ConfirmActionPayload,
} from "@/components/vault/ConfirmActionModal";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  getVaultById, generateFailedTransactions, generateSettlementData,
  generateTransactionOutcomes, generateAnomalyTimeline, generateVelocity,
  generateSecurityActions, generateAccessLog, riskToRadar,
  fmtNaira, fmtCompact, fmtNum, timeAgo,
  EMERGENCY_CONTACTS,
  type FailedTransaction, type FailedTxnStatus, type AuditEntry,
} from "@/lib/vaultData";
import {
  ArrowLeft, ShieldCheck, Lock, Landmark, Activity, Wallet,
  AlertTriangle, RotateCw, Search, Ban, Undo2, Clock, Snowflake,
  ShieldAlert, FileText, PhoneCall, Gauge, TrendingUp, ListChecks,
  CheckCircle2, XCircle, Timer, ScrollText, Fingerprint, Radar as RadarIcon,
  PieChart as PieIcon, SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

// ─── Primitives ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function SectionHeader({ icon: Icon, title, sub }: { icon: typeof Activity; title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 border-l-2 border-blue-500 pl-3">
      <Icon className="h-4 w-4 text-blue-400" />
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-card p-4 ${className}`}>{children}</div>;
}

const chartTooltip = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" },
  labelStyle: { color: "#71717A" },
  itemStyle: { color: "hsl(var(--foreground))" },
};

// ─── Failed txn action config ───────────────────────────────────────────────

type FailedAction = "retry" | "investigate" | "writeoff" | "reverse";

const FAILED_ACTION_META: Record<FailedAction, { label: string; sev: "critical" | "warning" | "info"; impact: string; next: FailedTxnStatus }> = {
  retry: { label: "Retry Transaction", sev: "info", impact: "Re-submits this transaction to the NIBSS settlement rail. Funds may debit if the original failure has cleared.", next: "pending_retry" },
  investigate: { label: "Open Investigation", sev: "warning", impact: "Flags this transaction for the risk desk. It will be held and excluded from auto-retry until resolved.", next: "investigating" },
  writeoff: { label: "Write Off Transaction", sev: "critical", impact: "Permanently marks the funds as unrecoverable. This posts a loss to the reconciliation ledger and cannot be undone.", next: "written_off" },
  reverse: { label: "Reverse Transaction", sev: "info", impact: "Initiates a reversal to return funds to the originating account. A NIBSS reversal instruction will be issued.", next: "written_off" },
};

const STATUS_BADGE: Record<FailedTxnStatus, { label: string; cls: string }> = {
  pending_retry: { label: "PENDING RETRY", cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  investigating: { label: "INVESTIGATING", cls: "bg-blue-500/15 text-blue-300 border-blue-500/40" },
  written_off: { label: "WRITTEN OFF", cls: "bg-red-500/15 text-red-300 border-red-500/40" },
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function VaultDetail() {
  const { vaultId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "overview";

  const found = getVaultById(vaultId);

  // hooks must run unconditionally
  const idx = found?.index ?? 0;
  const vault = found?.vault;

  const [failedTxns, setFailedTxns] = useState<FailedTransaction[]>(() => generateFailedTransactions(idx));
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [controls, setControls] = useState({ blockOutflows: false, blockInflows: false, requireDualAuth: true, amlAutoBlock: true });

  const settlementData = useMemo(() => generateSettlementData(idx), [idx]);
  const outcomes = useMemo(() => (vault ? generateTransactionOutcomes(vault) : []), [vault]);
  const anomaly = useMemo(() => generateAnomalyTimeline(idx, vault?.riskScore ?? 30), [idx, vault]);
  const velocity = useMemo(() => generateVelocity(idx), [idx]);
  const secActions = useMemo(() => generateSecurityActions(idx, vaultId), [idx, vaultId]);
  const accessLog = useMemo(() => generateAccessLog(idx), [idx]);
  const radarData = useMemo(() => (vault ? riskToRadar(vault.riskDimensions) : []), [vault]);

  // confirm modal machinery
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ConfirmActionConfig | null>(null);
  const [pendingAction, setPendingAction] = useState<{ kind: "failed"; txnId: string; action: FailedAction } | { kind: "control"; key: keyof typeof controls; nextVal: boolean; title: string } | { kind: "generic"; label: string } | null>(null);

  if (!vault) {
    return (
      <DashboardLayout title="Vault Banking">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <ShieldAlert className="h-10 w-10 text-red-400" />
          <p className="text-sm">Vault <span className="font-mono text-foreground">{vaultId}</span> not found.</p>
          <button onClick={() => navigate("/vault-banking")} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">Back to Control Center</button>
        </div>
      </DashboardLayout>
    );
  }

  function pushAudit(payload: ConfirmActionPayload, action: string) {
    const entry: AuditEntry = {
      id: payload.auditRef,
      ref: payload.auditRef,
      action,
      reason: payload.reason,
      notes: payload.notes,
      actor: "ops.lead@fynix",
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [entry, ...prev]);
  }

  function requestFailedAction(txn: FailedTransaction, action: FailedAction) {
    const meta = FAILED_ACTION_META[action];
    setPendingAction({ kind: "failed", txnId: txn.id, action });
    setModalConfig({
      vaultId: vault!.id,
      title: `${meta.label} — ${txn.reference}`,
      severity: meta.sev,
      impact: `${meta.impact} Amount: ${fmtNaira(txn.amount)} · Reason: ${txn.failureReason}.`,
      confirmLabel: meta.label,
    });
    setModalOpen(true);
  }

  function requestControlToggle(key: keyof typeof controls, title: string, impact: string) {
    const nextVal = !controls[key];
    setPendingAction({ kind: "control", key, nextVal, title });
    setModalConfig({
      vaultId: vault!.id,
      title: `${title} → ${nextVal ? "ENABLE" : "DISABLE"}`,
      severity: nextVal ? "critical" : "warning",
      impact,
      confirmLabel: nextVal ? "Enable Restriction" : "Disable Restriction",
    });
    setModalOpen(true);
  }

  function requestGeneric(label: string, impact: string, sev: "critical" | "warning" | "info") {
    setPendingAction({ kind: "generic", label });
    setModalConfig({ vaultId: vault!.id, title: label, severity: sev, impact, confirmLabel: label });
    setModalOpen(true);
  }

  function handleConfirm(payload: ConfirmActionPayload) {
    if (pendingAction?.kind === "failed") {
      const meta = FAILED_ACTION_META[pendingAction.action];
      setFailedTxns((prev) => prev.map((t) => (t.id === pendingAction.txnId ? { ...t, status: meta.next, attempts: t.attempts + (pendingAction.action === "retry" ? 1 : 0) } : t)));
      pushAudit(payload, meta.label);
      toast.success(`${meta.label} recorded`, { description: `Ref ${payload.auditRef} · ${payload.reason}` });
    } else if (pendingAction?.kind === "control") {
      setControls((prev) => ({ ...prev, [pendingAction.key]: pendingAction.nextVal }));
      pushAudit(payload, `${pendingAction.title} ${pendingAction.nextVal ? "enabled" : "disabled"}`);
      toast.success("Control state changed — audit recorded", { description: `Ref ${payload.auditRef} · ${payload.reason}` });
    } else if (pendingAction?.kind === "generic") {
      pushAudit(payload, pendingAction.label);
      toast.success(`${pendingAction.label} submitted`, { description: `Ref ${payload.auditRef} · ${payload.reason}` });
    }
    setModalOpen(false);
    setModalConfig(null);
    setPendingAction(null);
  }

  // failed txn summary
  const failedSummary = useMemo(() => {
    const active = failedTxns.filter((t) => t.status !== "written_off");
    const stuck = active.reduce((s, t) => s + t.amount, 0);
    const oldest = active.length ? active.reduce((a, b) => (new Date(a.failureTime) < new Date(b.failureTime) ? a : b)) : null;
    return { count: active.length, stuck, oldest };
  }, [failedTxns]);

  const kpis = [
    { label: "Total Balance", value: fmtCompact(vault.balance), accent: "text-foreground" },
    { label: "Available Balance", value: fmtCompact(vault.availableBalance), accent: "text-emerald-400" },
    { label: "Pending Settlement", value: fmtCompact(vault.pendingSettlement), accent: "text-amber-400" },
    { label: "Reserved Funds", value: fmtCompact(vault.reservedFunds), accent: "text-blue-400" },
    { label: "Overdraft Limit", value: fmtCompact(vault.overdraftLimit), accent: "text-foreground/80" },
  ];

  return (
    <DashboardLayout title="Vault Banking">
      <div className="min-h-screen">
        {/* Security bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold tracking-wide text-emerald-300">SECURE SESSION</span>
            <span className="text-muted-foreground/50">·</span>
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">TLS 1.3 · mTLS gateway</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Landmark className="h-3.5 w-3.5 text-blue-400" /> {vault.cbnLicense}</span>
            {vault.ndicInsured && <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> NDIC Insured</span>}
          </div>
        </div>

        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/vault-banking")} className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground/90">{vault.code}</div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{vault.name}</h1>
              <p className="font-mono text-[12px] text-muted-foreground">{vault.id} · {vault.tier} · Risk {vault.riskScore}/100</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded border px-2 py-1 text-[11px] font-semibold tracking-wider ${
              vault.status === "active" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : vault.status === "pending" ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}>{vault.status.toUpperCase()}</span>
            {vault.status !== "frozen" && (
              <button
                onClick={() => requestGeneric(`Freeze Vault — ${vault.name}`, "This will immediately halt ALL inflows and outflows until manually lifted. Reported to CBN.", "critical")}
                className="flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1.5 text-[12px] font-medium text-red-300 hover:bg-red-500/10"
              >
                <Snowflake className="h-3.5 w-3.5" /> Freeze Vault
              </button>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.map((k) => (
            <Panel key={k.label} className="p-3">
              <Label>{k.label}</Label>
              <p className={`mt-1 font-mono text-lg font-semibold ${k.accent}`}>{k.value}</p>
            </Panel>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="mb-4 flex w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
            {[
              { v: "overview", l: "Overview" },
              { v: "transactions", l: "Transactions" },
              { v: "failed", l: "Failed Txns" },
              { v: "security", l: "Security" },
              { v: "controls", l: "Controls" },
              { v: "compliance", l: "Compliance" },
            ].map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                {t.l}
                {t.v === "failed" && failedSummary.count > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-300">{failedSummary.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── OVERVIEW ── */}
          <TabsContent value="overview" className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Panel>
                <SectionHeader icon={PieIcon} title="Transaction Outcomes" sub="last 24h" />
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={outcomes} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                        {outcomes.map((o) => <Cell key={o.name} fill={o.color} stroke="hsl(var(--card))" />)}
                      </Pie>
                      <Tooltip {...chartTooltip} formatter={(v: number) => fmtNum(v)} />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#71717A" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel className="lg:col-span-2">
                <SectionHeader icon={TrendingUp} title="Settlement Status" sub="settled vs pending vs failed · last 7 days" />
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={settlementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis tickFormatter={(v) => fmtCompact(v)} tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={54} />
                      <Tooltip {...chartTooltip} formatter={(v: number) => fmtNaira(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="settled" stackId="a" fill="#10B981" name="Settled" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                      <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Panel className="p-3"><Label>24h Inflow</Label><p className="mt-1 font-mono text-lg font-semibold text-emerald-400">{fmtCompact(vault.inflow24h)}</p></Panel>
              <Panel className="p-3"><Label>24h Outflow</Label><p className="mt-1 font-mono text-lg font-semibold text-red-400">{fmtCompact(vault.outflow24h)}</p></Panel>
              <Panel className="p-3"><Label>24h Txns</Label><p className="mt-1 font-mono text-lg font-semibold text-foreground">{fmtNum(vault.txns24h)}</p></Panel>
              <Panel className="p-3"><Label>Success Rate</Label><p className="mt-1 font-mono text-lg font-semibold text-emerald-400">{vault.successRate}%</p></Panel>
            </div>
          </TabsContent>

          {/* ── TRANSACTIONS + SETTLEMENT MGMT ── */}
          <TabsContent value="transactions" className="space-y-5">
            <Panel>
              <div className="flex items-center justify-between">
                <SectionHeader icon={ListChecks} title="Settlement Management" sub="daily NIBSS cut-off 14:00 WAT" />
                <button
                  onClick={() => requestGeneric("Request Manual Settlement", `Forces an off-cycle settlement of ${fmtNaira(vault.pendingSettlement)} pending obligations to the NIBSS rail ahead of the scheduled window.`, "warning")}
                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-500"
                >
                  <Timer className="h-3.5 w-3.5" /> Request Manual Settlement
                </button>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3"><Label>Settled Today</Label><p className="mt-1 font-mono text-base font-semibold text-emerald-400">{fmtCompact(settlementData[settlementData.length - 1].settled)}</p></div>
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3"><Label>Pending Settlement</Label><p className="mt-1 font-mono text-base font-semibold text-amber-400">{fmtCompact(vault.pendingSettlement)}</p></div>
                <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3"><Label>Failed Settlement</Label><p className="mt-1 font-mono text-base font-semibold text-red-400">{fmtCompact(settlementData[settlementData.length - 1].failed)}</p></div>
                <div className="rounded-md border border-border bg-muted/40 p-3"><Label>Last Cut-off</Label><p className="mt-1 font-mono text-base font-semibold text-foreground/90">{timeAgo(vault.lastSettlement)}</p></div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Day</th>
                      <th className="py-2 pr-3 font-medium">Settled</th>
                      <th className="py-2 pr-3 font-medium">Pending</th>
                      <th className="py-2 pr-3 font-medium">Failed</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-foreground/80">
                    {settlementData.map((d) => {
                      const ok = d.failed < 5_000_000;
                      return (
                        <tr key={d.date} className="border-b border-border/60">
                          <td className="py-2 pr-3 font-sans text-muted-foreground">{d.day} · {d.date.slice(5)}</td>
                          <td className="py-2 pr-3 text-emerald-400">{fmtCompact(d.settled)}</td>
                          <td className="py-2 pr-3 text-amber-400">{fmtCompact(d.pending)}</td>
                          <td className="py-2 pr-3 text-red-400">{fmtCompact(d.failed)}</td>
                          <td className="py-2 pr-3">
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] ${ok ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-300"}`}>
                              {ok ? "RECONCILED" : "REVIEW"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </TabsContent>

          {/* ── FAILED TXNS ── */}
          <TabsContent value="failed" className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Panel className="p-3"><Label>Total Failed</Label><p className="mt-1 font-mono text-lg font-semibold text-red-400">{failedSummary.count}</p></Panel>
              <Panel className="p-3"><Label>Amount Stuck</Label><p className="mt-1 font-mono text-lg font-semibold text-amber-400">{fmtCompact(failedSummary.stuck)}</p></Panel>
              <Panel className="p-3"><Label>Oldest Pending</Label><p className="mt-1 font-mono text-lg font-semibold text-foreground/90">{failedSummary.oldest ? timeAgo(failedSummary.oldest.failureTime) : "—"}</p></Panel>
              <Panel className="p-3"><Label>Auto-Retry</Label><p className="mt-1 font-mono text-lg font-semibold text-emerald-400">ENABLED</p></Panel>
            </div>

            <Panel>
              <SectionHeader icon={AlertTriangle} title="Failed Transaction Queue" sub="each action requires an accountability entry" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Reference</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Amount</th>
                      <th className="py-2 pr-3 font-medium">Failure Reason</th>
                      <th className="py-2 pr-3 font-medium">Time</th>
                      <th className="py-2 pr-3 font-medium">Attempts</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedTxns.map((t) => {
                      const disabled = t.status === "written_off";
                      return (
                        <tr key={t.id} className="border-b border-border/60 hover:bg-muted/30">
                          <td className="py-2.5 pr-3 font-mono text-foreground/90">{t.reference}</td>
                          <td className="py-2.5 pr-3 capitalize text-muted-foreground">{t.type}</td>
                          <td className="py-2.5 pr-3 font-mono text-foreground">{fmtNaira(t.amount)}</td>
                          <td className="py-2.5 pr-3">
                            <span className={`inline-flex items-center gap-1 ${t.failureReason === "AML block" ? "text-red-300" : "text-foreground/80"}`}>
                              {t.failureReason}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-muted-foreground">{timeAgo(t.failureTime)}</td>
                          <td className="py-2.5 pr-3 font-mono text-foreground/80">{t.attempts}</td>
                          <td className="py-2.5 pr-3">
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[t.status].cls}`}>{STATUS_BADGE[t.status].label}</span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center justify-end gap-1">
                              <button disabled={disabled} onClick={() => requestFailedAction(t, "retry")} title="Retry" className="rounded border border-emerald-500/40 p-1 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-30"><RotateCw className="h-3.5 w-3.5" /></button>
                              <button disabled={disabled} onClick={() => requestFailedAction(t, "investigate")} title="Investigate" className="rounded border border-amber-500/40 p-1 text-amber-300 hover:bg-amber-500/10 disabled:opacity-30"><Search className="h-3.5 w-3.5" /></button>
                              <button disabled={disabled} onClick={() => requestFailedAction(t, "reverse")} title="Reverse" className="rounded border border-blue-500/40 p-1 text-blue-300 hover:bg-blue-500/10 disabled:opacity-30"><Undo2 className="h-3.5 w-3.5" /></button>
                              <button disabled={disabled} onClick={() => requestFailedAction(t, "writeoff")} title="Write Off" className="rounded border border-red-500/40 p-1 text-red-300 hover:bg-red-500/10 disabled:opacity-30"><Ban className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </TabsContent>

          {/* ── SECURITY ── */}
          <TabsContent value="security" className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Panel className="lg:col-span-2">
                <SectionHeader icon={Gauge} title="Hourly Transaction Velocity" sub="24h · txn count per hour" />
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={velocity}>
                      <defs>
                        <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: "#71717A", fontSize: 9 }} interval={3} axisLine={{ stroke: "hsl(var(--border))" }} />
                      <YAxis tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={40} />
                      <Tooltip {...chartTooltip} />
                      <Area dataKey="txns" stroke="#3B82F6" strokeWidth={2} fill="url(#velGrad)" name="Txns" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel>
                <SectionHeader icon={RadarIcon} title="Risk Profile" sub="6-dimension" />
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: "#71717A", fontSize: 9 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#71717A", fontSize: 9 }} axisLine={false} />
                      <Radar dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <Panel>
              <SectionHeader icon={Activity} title="Anomaly Score Timeline" sub="risk score · last 30 days" />
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={anomaly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#71717A", fontSize: 10 }} axisLine={{ stroke: "hsl(var(--border))" }} tickFormatter={(v) => `D${v}`} interval={4} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#71717A", fontSize: 10 }} axisLine={false} width={32} />
                    <Tooltip {...chartTooltip} />
                    <Line dataKey="score" stroke="#F59E0B" strokeWidth={2} dot={false} name="Anomaly Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel>
                <SectionHeader icon={ScrollText} title="Security Actions Log" sub="last 10 events · who / when / why" />
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {secActions.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${a.severity === "critical" ? "bg-red-400" : a.severity === "warning" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <div className="flex-1">
                        <p className="text-[12px] text-foreground/90">{a.action}</p>
                        <p className="text-[11px] text-muted-foreground"><span className="font-mono">{a.actor}</span> · {a.reason} · {timeAgo(a.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="space-y-5">
                <Panel>
                  <SectionHeader icon={ShieldCheck} title="AML Screening" />
                  <div className="flex items-center justify-between rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span className="text-[12px] text-emerald-200">Clear · No sanctions hits</span></div>
                    <span className="font-mono text-[11px] text-muted-foreground">last scan {timeAgo(secActions[0].timestamp)}</span>
                  </div>
                </Panel>
                <Panel>
                  <SectionHeader icon={Fingerprint} title="IP / Device Access Log" />
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {accessLog.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          {r.result === "blocked" ? <XCircle className="h-3.5 w-3.5 text-red-400" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                          <span className="font-mono text-foreground/80">{r.ip}</span>
                          <span className="text-muted-foreground">{r.location}</span>
                        </div>
                        <span className="text-muted-foreground/70">{timeAgo(r.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          </TabsContent>

          {/* ── CONTROLS ── */}
          <TabsContent value="controls" className="space-y-5">
            <Panel>
              <SectionHeader icon={SlidersHorizontal} title="Vault Restrictions" sub="every change requires an accountability entry" />
              <div className="space-y-3">
                {([
                  { key: "blockOutflows" as const, title: "Block All Outflows", impact: "Blocks every outgoing transfer from this vault while inflows continue. Customers cannot withdraw or send funds." },
                  { key: "blockInflows" as const, title: "Block All Inflows", impact: "Rejects all incoming credits to this vault. Senders will receive an automatic reversal." },
                  { key: "requireDualAuth" as const, title: "Require Dual Authorization", impact: "Transactions above ₦5M will require a second operator approval before settlement." },
                  { key: "amlAutoBlock" as const, title: "AML Auto-Block", impact: "Automatically holds any transaction matching AML risk heuristics pending manual review." },
                ]).map((c) => {
                  const on = controls[c.key];
                  const lastAudit = auditLog.find((a) => a.action.startsWith(c.title));
                  return (
                    <div key={c.key} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-foreground/90">{c.title}: <span className={on ? "text-red-400" : "text-muted-foreground"}>{on ? "ON" : "OFF"}</span></p>
                        <p className="text-[11px] text-muted-foreground">
                          {lastAudit ? <>Last changed {timeAgo(lastAudit.timestamp)} by {lastAudit.actor} · Reason: {lastAudit.reason}</> : "No changes recorded this session"}
                        </p>
                      </div>
                      <Switch checked={on} onCheckedChange={() => requestControlToggle(c.key, c.title, c.impact)} className="data-[state=checked]:bg-red-500" />
                    </div>
                  );
                })}
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Panel>
                <SectionHeader icon={FileText} title="Regulatory Actions" />
                <div className="space-y-2">
                  <button onClick={() => requestGeneric("Transaction Limit Override", `Temporarily raises the per-transaction ceiling for ${vault.name}. Requires documented justification.`, "warning")} className="flex w-full items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2.5 text-[12px] text-foreground/90 hover:bg-muted">
                    <span className="flex items-center gap-2"><SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" /> Transaction Limit Override</span>
                    <span className="text-muted-foreground/50">→</span>
                  </button>
                  <button onClick={() => requestGeneric("Request CBN Report", "Generates and dispatches the mandatory transaction & suspicious-activity report to the CBN regulatory portal.", "warning")} className="flex w-full items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2.5 text-[12px] text-foreground/90 hover:bg-muted">
                    <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-blue-400" /> Request CBN Report</span>
                    <span className="text-muted-foreground/50">→</span>
                  </button>
                </div>
              </Panel>

              <Panel>
                <SectionHeader icon={PhoneCall} title="Emergency Escalation" sub="incident response chain" />
                <div className="space-y-2">
                  {EMERGENCY_CONTACTS.map((c) => (
                    <div key={c.label} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                      <div>
                        <p className="text-[12px] text-foreground/90">{c.label}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{c.value}</p>
                      </div>
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{c.tag}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </TabsContent>

          {/* ── COMPLIANCE / AUDIT LOG ── */}
          <TabsContent value="compliance" className="space-y-5">
            <Panel>
              <SectionHeader icon={ScrollText} title="Session Audit Log" sub="immutable · every accountable action taken this session" />
              {auditLog.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-muted-foreground">No accountable actions recorded yet. Actions taken in Failed Txns and Controls tabs appear here with their audit reference.</p>
              ) : (
                <div className="space-y-2">
                  {auditLog.map((a) => (
                    <div key={a.id} className="rounded-md border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-foreground">{a.action}</span>
                        <span className="font-mono text-[11px] text-blue-300">{a.ref}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">Reason: <span className="text-foreground/80">{a.reason}</span> · {a.actor} · {timeAgo(a.timestamp)}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{a.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmActionModal
        open={modalOpen}
        config={modalConfig}
        onCancel={() => { setModalOpen(false); setModalConfig(null); setPendingAction(null); }}
        onConfirm={handleConfirm}
      />
    </DashboardLayout>
  );
}
