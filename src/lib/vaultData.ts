// ─────────────────────────────────────────────────────────────────────────────
// Vault Banking — shared mock data & generators
// Institutional-grade BaaS vault control center data model.
// All figures are deterministic (seeded) so the UI is stable across renders.
// ─────────────────────────────────────────────────────────────────────────────

export type VaultStatus = "active" | "pending" | "frozen";

export interface RiskDimensions {
  aml: number;          // AML exposure (higher = worse)
  settlement: number;   // Settlement risk
  velocity: number;     // Transaction velocity risk
  counterparty: number; // Counterparty risk
  regulatory: number;   // Regulatory compliance risk
  liquidity: number;    // Liquidity risk
}

export interface Vault {
  id: string;
  name: string;
  code: string;
  status: VaultStatus;
  balance: number;
  availableBalance: number;
  reservedFunds: number;
  pendingSettlement: number;
  overdraftLimit: number;
  successRate: number;      // % successful transactions
  failedTxnCount: number;
  txns24h: number;
  inflow24h: number;
  outflow24h: number;
  tier: string;
  cbnLicense: string;
  ndicInsured: boolean;
  riskScore: number;        // aggregate 0-100 (higher = riskier)
  riskDimensions: RiskDimensions;
  lastSettlement: string;
}

export type FailureReason =
  | "Insufficient funds"
  | "Bank network timeout"
  | "Invalid account"
  | "AML block"
  | "Daily limit exceeded";

export type FailedTxnStatus = "pending_retry" | "investigating" | "written_off";

export interface FailedTransaction {
  id: string;
  reference: string;
  type: "transfer" | "withdrawal" | "payment";
  amount: number;
  failureReason: FailureReason;
  failureTime: string;   // ISO
  attempts: number;
  status: FailedTxnStatus;
  counterparty: string;
}

export interface SettlementDay {
  day: string;           // e.g. "Mon"
  date: string;          // ISO date
  settled: number;
  pending: number;
  failed: number;
}

export interface TransactionOutcome {
  name: "Success" | "Failed" | "Pending" | "Reversed";
  value: number;
  color: string;
}

export interface AnomalyPoint {
  day: number;           // 0..29
  date: string;
  score: number;         // 0..100
}

export interface VelocityPoint {
  hour: string;          // "00:00" .. "23:00"
  txns: number;
  volume: number;
}

export interface SecurityAction {
  id: string;
  action: string;
  actor: string;
  timestamp: string;     // ISO
  reason: string;
  severity: "info" | "warning" | "critical";
}

export interface AccessLogEntry {
  ip: string;
  device: string;
  location: string;
  timestamp: string;
  result: "success" | "blocked";
}

export interface AuditEntry {
  id: string;
  ref: string;
  action: string;
  reason: string;
  notes: string;
  actor: string;
  timestamp: string;
}

// ─── Deterministic PRNG (mulberry32) ────────────────────────────────────────

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rnd: () => number, arr: readonly T[]): T =>
  arr[Math.floor(rnd() * arr.length)];

// ─── Master vault dataset ───────────────────────────────────────────────────

export const MOCK_VAULTS: Vault[] = [
  {
    id: "VLT-001",
    name: "Sterling Microfinance Bank",
    code: "SMB",
    status: "active",
    balance: 4_820_450_000,
    availableBalance: 4_120_450_000,
    reservedFunds: 700_000_000,
    pendingSettlement: 218_400_000,
    overdraftLimit: 500_000_000,
    successRate: 98.6,
    failedTxnCount: 4,
    txns24h: 18_420,
    inflow24h: 612_300_000,
    outflow24h: 548_900_000,
    tier: "Tier 1",
    cbnLicense: "MFB/CBN/0142",
    ndicInsured: true,
    riskScore: 22,
    riskDimensions: { aml: 18, settlement: 24, velocity: 30, counterparty: 20, regulatory: 12, liquidity: 26 },
    lastSettlement: "2026-07-02T13:00:00Z",
  },
  {
    id: "VLT-002",
    name: "Kobo Digital Bank",
    code: "KDB",
    status: "active",
    balance: 2_140_800_000,
    availableBalance: 1_890_800_000,
    reservedFunds: 250_000_000,
    pendingSettlement: 96_700_000,
    overdraftLimit: 200_000_000,
    successRate: 96.9,
    failedTxnCount: 7,
    txns24h: 31_205,
    inflow24h: 402_100_000,
    outflow24h: 448_600_000,
    tier: "Tier 2",
    cbnLicense: "PSB/CBN/0088",
    ndicInsured: true,
    riskScore: 41,
    riskDimensions: { aml: 44, settlement: 38, velocity: 62, counterparty: 40, regulatory: 28, liquidity: 34 },
    lastSettlement: "2026-07-02T13:00:00Z",
  },
  {
    id: "VLT-003",
    name: "Harbour Trust MFB",
    code: "HTM",
    status: "pending",
    balance: 986_300_000,
    availableBalance: 812_300_000,
    reservedFunds: 174_000_000,
    pendingSettlement: 143_900_000,
    overdraftLimit: 100_000_000,
    successRate: 94.2,
    failedTxnCount: 12,
    txns24h: 8_940,
    inflow24h: 128_400_000,
    outflow24h: 96_200_000,
    tier: "Tier 3",
    cbnLicense: "MFB/CBN/0311",
    ndicInsured: true,
    riskScore: 58,
    riskDimensions: { aml: 52, settlement: 66, velocity: 48, counterparty: 60, regulatory: 70, liquidity: 54 },
    lastSettlement: "2026-07-01T13:00:00Z",
  },
  {
    id: "VLT-004",
    name: "Anchor Union Bank",
    code: "AUB",
    status: "active",
    balance: 7_310_900_000,
    availableBalance: 6_610_900_000,
    reservedFunds: 700_000_000,
    pendingSettlement: 310_200_000,
    overdraftLimit: 900_000_000,
    successRate: 99.1,
    failedTxnCount: 3,
    txns24h: 42_780,
    inflow24h: 1_204_500_000,
    outflow24h: 1_098_700_000,
    tier: "Tier 1",
    cbnLicense: "CMB/CBN/0021",
    ndicInsured: true,
    riskScore: 18,
    riskDimensions: { aml: 14, settlement: 20, velocity: 26, counterparty: 16, regulatory: 10, liquidity: 22 },
    lastSettlement: "2026-07-02T13:00:00Z",
  },
  {
    id: "VLT-005",
    name: "Palmpay Reserve Vault",
    code: "PRV",
    status: "frozen",
    balance: 1_502_600_000,
    availableBalance: 0,
    reservedFunds: 1_502_600_000,
    pendingSettlement: 402_800_000,
    overdraftLimit: 0,
    successRate: 88.4,
    failedTxnCount: 21,
    txns24h: 0,
    inflow24h: 0,
    outflow24h: 0,
    tier: "Tier 2",
    cbnLicense: "PSB/CBN/0057",
    ndicInsured: true,
    riskScore: 84,
    riskDimensions: { aml: 88, settlement: 74, velocity: 80, counterparty: 82, regulatory: 90, liquidity: 78 },
    lastSettlement: "2026-06-29T13:00:00Z",
  },
];

// ─── Aggregate risk across all vaults (for master radar) ────────────────────

export function aggregateRiskDimensions(): RiskDimensions {
  const n = MOCK_VAULTS.length;
  const sum = MOCK_VAULTS.reduce(
    (acc, v) => ({
      aml: acc.aml + v.riskDimensions.aml,
      settlement: acc.settlement + v.riskDimensions.settlement,
      velocity: acc.velocity + v.riskDimensions.velocity,
      counterparty: acc.counterparty + v.riskDimensions.counterparty,
      regulatory: acc.regulatory + v.riskDimensions.regulatory,
      liquidity: acc.liquidity + v.riskDimensions.liquidity,
    }),
    { aml: 0, settlement: 0, velocity: 0, counterparty: 0, regulatory: 0, liquidity: 0 }
  );
  return {
    aml: Math.round(sum.aml / n),
    settlement: Math.round(sum.settlement / n),
    velocity: Math.round(sum.velocity / n),
    counterparty: Math.round(sum.counterparty / n),
    regulatory: Math.round(sum.regulatory / n),
    liquidity: Math.round(sum.liquidity / n),
  };
}

export function riskToRadar(dims: RiskDimensions): { dimension: string; value: number; fullMark: number }[] {
  return [
    { dimension: "AML Exposure", value: dims.aml, fullMark: 100 },
    { dimension: "Settlement", value: dims.settlement, fullMark: 100 },
    { dimension: "Velocity", value: dims.velocity, fullMark: 100 },
    { dimension: "Counterparty", value: dims.counterparty, fullMark: 100 },
    { dimension: "Regulatory", value: dims.regulatory, fullMark: 100 },
    { dimension: "Liquidity", value: dims.liquidity, fullMark: 100 },
  ];
}

// ─── Generators ─────────────────────────────────────────────────────────────

const FAILURE_REASONS: FailureReason[] = [
  "Insufficient funds",
  "Bank network timeout",
  "Invalid account",
  "AML block",
  "Daily limit exceeded",
];

const TXN_TYPES: FailedTransaction["type"][] = ["transfer", "withdrawal", "payment"];
const COUNTERPARTIES = [
  "GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank",
  "Kuda MFB", "Opay", "Moniepoint", "Fidelity Bank", "Wema Bank",
];

export function getVaultByIndex(idx: number): Vault | undefined {
  return MOCK_VAULTS[idx];
}

export function getVaultById(id: string): { vault: Vault; index: number } | undefined {
  const index = MOCK_VAULTS.findIndex((v) => v.id === id);
  if (index === -1) return undefined;
  return { vault: MOCK_VAULTS[index], index };
}

export function generateFailedTransactions(vaultIdx: number): FailedTransaction[] {
  const rnd = seeded(9001 + vaultIdx * 131);
  const count = 5 + Math.floor(rnd() * 4); // 5-8
  const statuses: FailedTxnStatus[] = ["pending_retry", "investigating", "written_off"];
  const now = Date.now();
  const out: FailedTransaction[] = [];
  for (let i = 0; i < count; i++) {
    const minutesAgo = Math.floor(rnd() * 60 * 42) + 5; // up to ~42h
    out.push({
      id: `FTX-${vaultIdx}-${i}`,
      reference: `FYX${(100000 + Math.floor(rnd() * 899999)).toString()}`,
      type: pick(rnd, TXN_TYPES),
      amount: Math.floor((rnd() * 4_800_000 + 12_000) / 100) * 100,
      failureReason: pick(rnd, FAILURE_REASONS),
      failureTime: new Date(now - minutesAgo * 60_000).toISOString(),
      attempts: 1 + Math.floor(rnd() * 4),
      status: statuses[Math.floor(rnd() * (rnd() > 0.6 ? 3 : 1))],
      counterparty: pick(rnd, COUNTERPARTIES),
    });
  }
  return out.sort((a, b) => new Date(a.failureTime).getTime() - new Date(b.failureTime).getTime());
}

export function generateSettlementData(vaultIdx: number): SettlementDay[] {
  const rnd = seeded(4200 + vaultIdx * 77);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  return days.map((day, i) => {
    const date = new Date(now.getTime() - (6 - i) * 86_400_000);
    return {
      day,
      date: date.toISOString().slice(0, 10),
      settled: Math.floor(rnd() * 480_000_000 + 120_000_000),
      pending: Math.floor(rnd() * 90_000_000 + 10_000_000),
      failed: Math.floor(rnd() * 24_000_000),
    };
  });
}

export function generateTransactionOutcomes(vault: Vault): TransactionOutcome[] {
  const total = Math.max(vault.txns24h, 1000);
  const success = Math.round(total * (vault.successRate / 100));
  const failed = vault.failedTxnCount * 40;
  const reversed = Math.round(total * 0.004);
  const pending = Math.max(total - success - failed - reversed, 0);
  return [
    { name: "Success", value: success, color: "#10B981" },
    { name: "Failed", value: failed, color: "#EF4444" },
    { name: "Pending", value: pending, color: "#F59E0B" },
    { name: "Reversed", value: reversed, color: "#3B82F6" },
  ];
}

export function generateAnomalyTimeline(vaultIdx: number, baseScore: number): AnomalyPoint[] {
  const rnd = seeded(7700 + vaultIdx * 53);
  const now = new Date();
  const out: AnomalyPoint[] = [];
  let score = Math.max(10, baseScore - 20);
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 86_400_000);
    const drift = (rnd() - 0.45) * 14;
    score = Math.min(100, Math.max(4, score + drift));
    // trend toward the vault's current base score
    score = score + (baseScore - score) * 0.08;
    out.push({ day: 29 - d, date: date.toISOString().slice(0, 10), score: Math.round(score) });
  }
  return out;
}

export function generateVelocity(vaultIdx: number): VelocityPoint[] {
  const rnd = seeded(3300 + vaultIdx * 41);
  const out: VelocityPoint[] = [];
  for (let h = 0; h < 24; h++) {
    // business-hours weighted curve
    const dayWeight = 0.4 + 0.6 * Math.sin((Math.max(h - 6, 0) / 16) * Math.PI);
    const base = Math.max(0, dayWeight) * (600 + rnd() * 900);
    out.push({
      hour: `${h.toString().padStart(2, "0")}:00`,
      txns: Math.round(base),
      volume: Math.round(base * (18_000 + rnd() * 40_000)),
    });
  }
  return out;
}

export function generateSecurityActions(vaultIdx: number, vaultId: string): SecurityAction[] {
  const rnd = seeded(5100 + vaultIdx * 29);
  const now = Date.now();
  const templates: { action: string; reason: string; severity: SecurityAction["severity"] }[] = [
    { action: "AML screening completed", reason: "Scheduled daily scan", severity: "info" },
    { action: "Velocity threshold raised", reason: "Approved merchant onboarding", severity: "warning" },
    { action: "Manual settlement executed", reason: "Bank network timeout recovery", severity: "info" },
    { action: "Outflow limit override", reason: "Regulatory Order", severity: "critical" },
    { action: "Device fingerprint flagged", reason: "New unrecognized device", severity: "warning" },
    { action: "Transaction reversed", reason: "Customer Request", severity: "warning" },
    { action: "Vault reconciliation passed", reason: "End-of-day close", severity: "info" },
    { action: "AML flag raised on counterparty", reason: "Sanctions list hit", severity: "critical" },
    { action: "Overdraft limit adjusted", reason: "Internal Compliance", severity: "warning" },
    { action: "Access policy updated", reason: "Quarterly security review", severity: "info" },
  ];
  const actors = ["compliance@fynix", "ops.lead@fynix", "risk.desk@fynix", "system.auto", "cfo@fynix"];
  return templates.map((t, i) => ({
    id: `SEC-${vaultId}-${i}`,
    action: t.action,
    actor: pick(rnd, actors),
    timestamp: new Date(now - (i * 3.5 + rnd() * 2) * 3_600_000).toISOString(),
    reason: t.reason,
    severity: t.severity,
  }));
}

export function generateAccessLog(vaultIdx: number): AccessLogEntry[] {
  const rnd = seeded(6200 + vaultIdx * 19);
  const now = Date.now();
  const rows: Omit<AccessLogEntry, "timestamp">[] = [
    { ip: "102.89.34.12", device: "MacBook Pro · Chrome 128", location: "Lagos, NG", result: "success" },
    { ip: "197.210.76.88", device: "Windows 11 · Edge", location: "Abuja, NG", result: "success" },
    { ip: "45.227.253.109", device: "Unknown · curl/8.4", location: "Amsterdam, NL", result: "blocked" },
    { ip: "102.89.34.12", device: "iPhone 15 · Safari", location: "Lagos, NG", result: "success" },
    { ip: "5.188.206.14", device: "Linux · Python-requests", location: "Moscow, RU", result: "blocked" },
    { ip: "154.113.9.201", device: "Windows 10 · Firefox", location: "Port Harcourt, NG", result: "success" },
  ];
  return rows.map((r, i) => ({
    ...r,
    timestamp: new Date(now - (i * 1.7 + rnd()) * 3_600_000).toISOString(),
  }));
}

// ─── Reason options for the accountability modal ────────────────────────────

export const ACTION_REASONS = [
  "Suspicious Activity",
  "AML Flag",
  "Customer Request",
  "Regulatory Order",
  "Internal Compliance",
  "Technical Error",
  "Court Order",
  "Other",
] as const;

export type ActionReason = (typeof ACTION_REASONS)[number];

export function generateAuditRef(vaultId: string): string {
  return `ACT-${vaultId}-${Date.now().toString(36).toUpperCase()}`;
}

// ─── Emergency escalation contacts ──────────────────────────────────────────

export const EMERGENCY_CONTACTS = [
  { label: "CBN Financial Crimes Hotline", value: "+234 700 225 5226", tag: "CBN" },
  { label: "NDIC Depositor Support", value: "+234 809 660 0700", tag: "NDIC" },
  { label: "Internal Risk Escalation (L1)", value: "risk.desk@fynix.io", tag: "Internal" },
  { label: "Chief Compliance Officer", value: "cco@fynix.io", tag: "Escalation" },
] as const;

// ─── Formatters ─────────────────────────────────────────────────────────────

export const fmtNaira = (n: number): string => `₦${Math.round(n).toLocaleString("en-NG")}`;

export const fmtCompact = (n: number): string => {
  if (Math.abs(n) >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
};

export const fmtNum = (n: number): string => n.toLocaleString("en-NG");

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
