import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ConfirmActionModal, type ConfirmActionConfig, type ConfirmActionPayload,
} from "@/components/vault/ConfirmActionModal";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from "recharts";
import {
  MOCK_VAULTS, aggregateRiskDimensions, riskToRadar, generateFailedTransactions,
  fmtCompact, fmtNum, timeAgo, type Vault, type VaultStatus,
} from "@/lib/vaultData";
import {
  ShieldCheck, Lock, Vault as VaultIcon, AlertTriangle, Activity,
  TrendingUp, ArrowRight, Snowflake, CircleDollarSign, Radar as RadarIcon,
  ShieldAlert, ChevronRight, Landmark,
} from "lucide-react";
import { toast } from "sonner";

// ─── Small primitives ───────────────────────────────────────────────────────

const STATUS_META: Record<VaultStatus, { label: string; dot: string; border: string; text: string }> = {
  active: { label: "ACTIVE", dot: "bg-emerald-400", border: "border-l-emerald-500", text: "text-emerald-400" },
  pending: { label: "PENDING REVIEW", dot: "bg-amber-400", border: "border-l-amber-500", text: "text-amber-400" },
  frozen: { label: "FROZEN", dot: "bg-red-400", border: "border-l-red-500", text: "text-red-400" },
};

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

// success/failure stacked bar
function SuccessBar({ rate }: { rate: number }) {
  const fail = 100 - rate;
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Success / Failure</Label>
        <span className="font-mono text-[11px] text-foreground/80">
          <span className="text-emerald-400">{rate.toFixed(1)}%</span>
          <span className="mx-1 text-muted-foreground/50">/</span>
          <span className="text-red-400">{fail.toFixed(1)}%</span>
        </span>
      </div>
      <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div className="h-full bg-emerald-500" style={{ width: `${rate}%` }} />
        <div className="h-full bg-red-500" style={{ width: `${fail}%` }} />
      </div>
    </div>
  );
}

// ─── KPI command strip ──────────────────────────────────────────────────────

function KpiCell({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="border-r border-border px-5 py-4 last:border-r-0">
      <Label>{label}</Label>
      <p className={`mt-1 font-mono text-xl font-semibold ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Vault card ─────────────────────────────────────────────────────────────

function VaultCard({ vault, failedTotal, onOpen, onFreeze }: {
  vault: Vault;
  failedTotal: number;
  onOpen: () => void;
  onFreeze: () => void;
}) {
  const meta = STATUS_META[vault.status];
  return (
    <div className={`rounded-lg border border-border/60 border-l-2 ${meta.border} bg-card p-4 transition hover:border-border hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground/90">
            {vault.code}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{vault.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{vault.id} · {vault.tier}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <span className={`text-[10px] font-semibold tracking-wider ${meta.text}`}>{meta.label}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <Label>Balance</Label>
          <p className="font-mono text-sm font-semibold text-foreground">{fmtCompact(vault.balance)}</p>
        </div>
        <div>
          <Label>Settlement Pending</Label>
          <p className="font-mono text-sm font-semibold text-amber-300">{fmtCompact(vault.pendingSettlement)}</p>
        </div>
        <div>
          <Label>Failed Txns</Label>
          <p className={`font-mono text-sm font-semibold ${failedTotal > 8 ? "text-red-400" : "text-foreground"}`}>{failedTotal}</p>
        </div>
      </div>

      <div className="mt-3">
        <SuccessBar rate={vault.successRate} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          Risk <span className={vault.riskScore > 60 ? "text-red-400" : vault.riskScore > 35 ? "text-amber-400" : "text-emerald-400"}>{vault.riskScore}</span>/100
        </span>
        <div className="flex items-center gap-2">
          {vault.status !== "frozen" && (
            <button
              onClick={onFreeze}
              className="flex items-center gap-1 rounded-md border border-red-500/40 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/10"
            >
              <Snowflake className="h-3 w-3" /> Freeze
            </button>
          )}
          <button
            onClick={onOpen}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
          >
            Open <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function VaultBanking() {
  const navigate = useNavigate();

  // pre-compute failed transaction counts per vault
  const failedByVault = useMemo(
    () => MOCK_VAULTS.map((_, i) => generateFailedTransactions(i).filter((t) => t.status !== "written_off").length),
    []
  );

  const totals = useMemo(() => {
    const managed = MOCK_VAULTS.reduce((s, v) => s + v.balance, 0);
    const totalTxn = MOCK_VAULTS.reduce((s, v) => s + v.txns24h, 0);
    const weightedSuccess = MOCK_VAULTS.reduce((s, v) => s + v.successRate * v.txns24h, 0);
    const systemSuccess = totalTxn > 0 ? weightedSuccess / totalTxn : 0;
    const failedPending = failedByVault.reduce((s, n) => s + n, 0);
    const frozen = MOCK_VAULTS.filter((v) => v.status === "frozen").length;
    const settlementPending = MOCK_VAULTS.reduce((s, v) => s + v.pendingSettlement, 0);
    return { managed, systemSuccess, failedPending, frozen, settlementPending };
  }, [failedByVault]);

  const radarData = useMemo(() => riskToRadar(aggregateRiskDimensions()), []);

  const alerts = useMemo(() => {
    const list: { id: string; sev: "critical" | "warning"; text: string; vault: string }[] = [];
    MOCK_VAULTS.forEach((v, i) => {
      if (v.status === "frozen") list.push({ id: `${v.id}-fz`, sev: "critical", text: `${v.name} vault is FROZEN`, vault: v.id });
      if (v.riskScore > 55) list.push({ id: `${v.id}-rk`, sev: "critical", text: `${v.name} elevated risk score ${v.riskScore}`, vault: v.id });
      if (failedByVault[i] > 8) list.push({ id: `${v.id}-ft`, sev: "warning", text: `${v.name} has ${failedByVault[i]} failed txns pending`, vault: v.id });
      if (v.successRate < 95) list.push({ id: `${v.id}-sr`, sev: "warning", text: `${v.name} success rate below SLA (${v.successRate}%)`, vault: v.id });
    });
    return list;
  }, [failedByVault]);

  // confirm modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ConfirmActionConfig | null>(null);

  function requestFreeze(v: Vault) {
    setModalConfig({
      vaultId: v.id,
      title: `Freeze Vault — ${v.name}`,
      severity: "critical",
      impact: "This will immediately halt ALL inflows and outflows for this vault until manually lifted. Settlement obligations remain due. This action is reported to CBN.",
      confirmLabel: "Freeze Vault",
    });
    setModalOpen(true);
  }

  function handleConfirm(payload: ConfirmActionPayload) {
    setModalOpen(false);
    toast.success("Vault frozen — audit entry recorded", {
      description: `Ref ${payload.auditRef} · Reason: ${payload.reason}`,
    });
    setModalConfig(null);
  }

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
            <span className="text-muted-foreground">TLS 1.3 · mTLS to CBN NIBSS gateway</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Landmark className="h-3.5 w-3.5 text-blue-400" /> CBN Regulated</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> NDIC Insured</span>
            <span className="font-mono text-muted-foreground/70">Operator: ops.lead@fynix</span>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10">
              <VaultIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Vault Control Center</h1>
              <p className="text-[12px] text-muted-foreground">
                Master oversight across {MOCK_VAULTS.length} custodial vaults · Real-time settlement, risk & reconciliation
              </p>
            </div>
          </div>
        </div>

        {/* KPI command strip */}
        <div className="mb-5 grid grid-cols-2 divide-border rounded-lg border border-border bg-card md:grid-cols-5 md:divide-x">
          <KpiCell label="Total Managed Funds" value={fmtCompact(totals.managed)} accent="text-foreground" sub="across all vaults" />
          <KpiCell label="System Success Rate" value={`${totals.systemSuccess.toFixed(1)}%`} accent="text-emerald-400" sub="vol-weighted 24h" />
          <KpiCell label="Failed Txns Pending" value={fmtNum(totals.failedPending)} accent={totals.failedPending > 20 ? "text-red-400" : "text-amber-400"} sub="requires treatment" />
          <KpiCell label="Frozen Vaults" value={fmtNum(totals.frozen)} accent={totals.frozen > 0 ? "text-red-400" : "text-foreground"} sub="restricted" />
          <KpiCell label="Active Alerts" value={fmtNum(alerts.length)} accent={alerts.length > 0 ? "text-amber-400" : "text-emerald-400"} sub="open items" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: vault grid */}
          <div className="lg:col-span-2">
            <SectionHeader icon={CircleDollarSign} title="Custodial Vaults" sub="Color-coded by operational status" />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {MOCK_VAULTS.map((v, i) => (
                <VaultCard
                  key={v.id}
                  vault={v}
                  failedTotal={failedByVault[i]}
                  onOpen={() => navigate(`/vault-banking/${v.id}`)}
                  onFreeze={() => requestFreeze(v)}
                />
              ))}
            </div>
          </div>

          {/* Right: risk radar + alerts + failed queue */}
          <div className="space-y-5">
            {/* Risk radar */}
            <div className="rounded-lg border border-border bg-card p-4">
              <SectionHeader icon={RadarIcon} title="Aggregate Risk Radar" sub="6-dimension portfolio exposure" />
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: "#71717A", fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#71717A", fontSize: 9 }} axisLine={false} />
                    <Radar dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts */}
            <div className="rounded-lg border border-border bg-card p-4">
              <SectionHeader icon={AlertTriangle} title="Active Alerts" sub={`${alerts.length} open`} />
              <div className="space-y-2">
                {alerts.length === 0 && <p className="text-sm text-muted-foreground">No active alerts.</p>}
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-2 rounded-md border px-3 py-2 text-[12px] ${
                      a.sev === "critical" ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"
                    }`}
                  >
                    <ShieldAlert className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${a.sev === "critical" ? "text-red-400" : "text-amber-400"}`} />
                    <span className="flex-1">{a.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Failed transaction queue */}
            <div className="rounded-lg border border-border bg-card p-4">
              <SectionHeader icon={Activity} title="Failed Transactions" sub="pending treatment by vault" />
              <div className="space-y-2">
                {MOCK_VAULTS.map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{v.code}</span>
                      <span className={`font-mono text-sm font-semibold ${failedByVault[i] > 8 ? "text-red-400" : "text-foreground/90"}`}>{failedByVault[i]}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/vault-banking/${v.id}?tab=failed`)}
                      className="flex items-center gap-1 rounded border border-blue-500/40 px-2 py-0.5 text-[11px] text-blue-300 hover:bg-blue-500/10"
                    >
                      Treat <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* System pulse */}
            <div className="rounded-lg border border-border bg-card p-4">
              <SectionHeader icon={TrendingUp} title="Settlement Pending" />
              <p className="font-mono text-2xl font-semibold text-amber-300">{fmtCompact(totals.settlementPending)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Last cut-off {timeAgo(MOCK_VAULTS[0].lastSettlement)} · Next NIBSS window 14:00 WAT
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={modalOpen}
        config={modalConfig}
        onCancel={() => { setModalOpen(false); setModalConfig(null); }}
        onConfirm={handleConfirm}
      />
    </DashboardLayout>
  );
}
