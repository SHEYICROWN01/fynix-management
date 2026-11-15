import type { BusinessType, FontId, HeroScene, HeroTime, IconKey, LayoutId, LoginCopy, LoginDesign, LoginFeature } from "./types";
import { ICON_KEYS } from "./icons";

const LAYOUT_IDS: LayoutId[] = ["showcase", "community", "split"];
const FONT_IDS: FontId[] = ["jakarta", "manrope", "outfit", "sora", "dmsans"];
const SCENES: HeroScene[] = ["branch", "tower", "community", "market"];
const TIMES: HeroTime[] = ["morning", "golden", "evening"];
const TYPES: BusinessType[] = ["microfinance_bank", "cooperative", "savings_and_loans", "lending_company", "finance_house", "mortgage_bank"];

const str = (v: unknown, max: number, fallback = "") => {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  return (s || fallback).slice(0, max);
};
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
/** Only https images (or same-origin paths / blob previews) may be shown. */
const safeUrl = (v: unknown) => (typeof v === "string" && /^(https:\/\/|\/|blob:)/.test(v) ? v : null);

function features(v: unknown, n: number, fallback: LoginFeature[], max = 24): LoginFeature[] {
  const list = Array.isArray(v) ? v : [];
  const out = list
    .map(x => ({ icon: pick((x as LoginFeature)?.icon, ICON_KEYS, "shield" as IconKey), label: str((x as LoginFeature)?.label, max) }))
    .filter(f => f.label);
  for (const f of fallback) if (out.length < n && !out.some(o => o.label === f.label)) out.push(f);
  return out.slice(0, n);
}

/**
 * Turns anything (server data, older versions, partial objects) into a complete, safe design.
 * Every string is length-capped and every choice is checked against an allow-list, so a bad record can
 * never break the login page.
 */
export function normaliseDesign(raw: unknown, brandName: string): LoginDesign | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<LoginDesign> & { copy?: Partial<LoginCopy> };
  const type = pick(d.businessType, TYPES, "microfinance_bank");
  const base = fallbackCopy(type, brandName, 0);
  const c: Partial<LoginCopy> = d.copy ?? {};
  return {
    version: 1,
    layout: pick(d.layout, LAYOUT_IDS, "showcase"),
    font: pick(d.font, FONT_IDS, "jakarta"),
    businessType: type,
    copy: {
      eyebrow: str(c.eyebrow, 32, base.eyebrow),
      headline: str(c.headline, 34, base.headline),
      headlineAccent: str(c.headlineAccent, 34, base.headlineAccent),
      subheadline: str(c.subheadline, 190, base.subheadline),
      features: features(c.features, 4, base.features),
      cardTitle: str(c.cardTitle, 34, base.cardTitle),
      cardSubtitle: str(c.cardSubtitle, 60, base.cardSubtitle),
      buttonLabel: str(c.buttonLabel, 24, base.buttonLabel),
      chips: features(c.chips, 3, base.chips, 22),
      closingTitle: str(c.closingTitle, 60, base.closingTitle),
      closingText: str(c.closingText, 200, base.closingText),
    },
    hero: {
      kind: d.hero?.kind === "photo" && safeUrl(d.hero?.photoUrl) ? "photo" : "illustration",
      scene: pick(d.hero?.scene, SCENES, "branch"),
      time: pick(d.hero?.time, TIMES, "morning"),
      variant: Math.max(0, Math.min(2, Math.round(Number(d.hero?.variant) || 0))),
      photoUrl: safeUrl(d.hero?.photoUrl),
    },
    facts: {
      licenceLine: str(d.facts?.licenceLine, 70) || null,
      supportPhone: str(d.facts?.supportPhone, 24) || null,
      supportEmail: str(d.facts?.supportEmail, 60) || null,
    },
    showPreview: d.showPreview !== false,
    generatedBy: d.generatedBy === "ai" ? "ai" : "template",
    generatedAt: str(d.generatedAt, 40, new Date().toISOString()),
  };
}

/** Short name for "Sign in to …": drops words like "Microfinance Bank", "Cooperative Society", "Limited". */
export function shortName(name: string): string {
  const cut = name
    .replace(/\b(micro\s*finance|microfinance|mfb|bank|cooperative|co-?operative|multipurpose|multi-purpose|society|societies|thrift|credit|savings|and|&|loans?|limited|ltd|plc|nigeria|finance|company|services|investment|investments)\b\.?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cut && cut.length >= 2 ? cut : name.trim();
}

// ── Built-in wording (used when the AI is unavailable, and as a safety net) ───

type Words = { eyebrow: string; lines: [string, string][]; sub: string; features: LoginFeature[]; chips: LoginFeature[]; closing: [string, string] };

const WORDS: Record<BusinessType, Words> = {
  microfinance_bank: {
    eyebrow: "Private banking workspace",
    lines: [["Welcome to {name}", "Banking Workspace"], ["Serving customers", "with confidence"], ["Every branch,", "one workspace"]],
    sub: "A secure workspace for {name} staff to manage customers, loans, savings and daily branch operations.",
    features: [{ icon: "loans", label: "Lending operations" }, { icon: "customers", label: "Customer management" }, { icon: "savings", label: "Savings & deposits" }, { icon: "reports", label: "Reports & insight" }],
    chips: [{ icon: "building", label: "Licensed bank" }, { icon: "customers", label: "Customer-first" }, { icon: "growth", label: "Local growth" }],
    closing: ["Banking that keeps up with your customers", "Every account, loan and repayment in one place — so your team spends less time on paperwork and more time with customers."],
  },
  cooperative: {
    eyebrow: "Members' workspace",
    lines: [["Banking for", "our members"], ["Stronger together,", "every season"], ["Your society,", "well run"]],
    sub: "Manage member contributions, savings and loans for {name} in one secure, transparent workspace.",
    features: [{ icon: "contributions", label: "Member contributions" }, { icon: "loans", label: "Member loans" }, { icon: "savings", label: "Savings & dividends" }, { icon: "reports", label: "Clear records" }],
    chips: [{ icon: "members", label: "Member-owned" }, { icon: "handshake", label: "Built on trust" }, { icon: "growth", label: "Growing together" }],
    closing: ["Every member's money, properly kept", "Contributions, loans and repayments recorded the moment they happen — so every member can trust the books."],
  },
  savings_and_loans: {
    eyebrow: "Savings & loans workspace",
    lines: [["Small savings,", "big futures"], ["Saving made", "simple and safe"], ["Every naira", "accounted for"]],
    sub: "Run daily, weekly and target savings, contributions and loans for {name} — with every collection recorded.",
    features: [{ icon: "savings", label: "Daily & target savings" }, { icon: "contributions", label: "Collections" }, { icon: "loans", label: "Quick loans" }, { icon: "reports", label: "Daily reports" }],
    chips: [{ icon: "handshake", label: "Trusted locally" }, { icon: "calendar", label: "Daily collections" }, { icon: "growth", label: "Steady growth" }],
    closing: ["Collections you can count on", "Every deposit and withdrawal is recorded with a receipt, so your customers always know where they stand."],
  },
  lending_company: {
    eyebrow: "Lending workspace",
    lines: [["Fast, fair lending", "for real people"], ["Lend with", "confidence"], ["From application", "to repayment"]],
    sub: "Approve, disburse and recover loans for {name} with clear schedules, reminders and real-time repayment tracking.",
    features: [{ icon: "loans", label: "Loan applications" }, { icon: "wallet", label: "Disbursements" }, { icon: "calendar", label: "Repayment tracking" }, { icon: "target", label: "Recoveries" }],
    chips: [{ icon: "clock", label: "Quick decisions" }, { icon: "handshake", label: "Fair terms" }, { icon: "shield", label: "Licensed lender" }],
    closing: ["Every loan, from first request to last payment", "Know what is due today, who is late and what was collected — without chasing spreadsheets."],
  },
  finance_house: {
    eyebrow: "Finance workspace",
    lines: [["Finance that", "moves business"], ["Funding growth,", "deal by deal"], ["Your portfolio,", "in clear view"]],
    sub: "Manage deposits, asset finance and business loans for {name} from one secure, well-organised workspace.",
    features: [{ icon: "briefcase", label: "Business finance" }, { icon: "card", label: "Asset financing" }, { icon: "savings", label: "Deposits" }, { icon: "reports", label: "Portfolio reports" }],
    chips: [{ icon: "briefcase", label: "Business-focused" }, { icon: "shield", label: "Well regulated" }, { icon: "growth", label: "Built for growth" }],
    closing: ["A clear view of every facility", "Track deposits, facilities and repayments across your portfolio with reports your board can rely on."],
  },
  mortgage_bank: {
    eyebrow: "Mortgage workspace",
    lines: [["Helping families", "own their homes"], ["Home ownership,", "made possible"], ["From savings", "to front door"]],
    sub: "Manage mortgage savings, home loans and repayments for {name} customers in one secure workspace.",
    features: [{ icon: "home", label: "Home loans" }, { icon: "savings", label: "Mortgage savings" }, { icon: "customers", label: "Customer files" }, { icon: "calendar", label: "Repayment plans" }],
    chips: [{ icon: "home", label: "Home ownership" }, { icon: "handshake", label: "Long-term partner" }, { icon: "shield", label: "Licensed lender" }],
    closing: ["Every home loan, carefully managed", "Savings plans, approvals and monthly repayments kept in order for every customer."],
  },
};

export function fallbackCopy(type: BusinessType, name: string, variant: number): LoginCopy {
  const w = WORDS[type] ?? WORDS.microfinance_bank;
  const s = shortName(name);
  const [l1, l2] = w.lines[((variant % w.lines.length) + w.lines.length) % w.lines.length];
  const fill = (t: string) => t.replace(/\{name\}/g, s);
  return {
    eyebrow: w.eyebrow,
    headline: fill(l1).slice(0, 34),
    headlineAccent: fill(l2).slice(0, 34),
    subheadline: fill(w.sub),
    features: w.features,
    cardTitle: `Sign in to ${s}`.slice(0, 34),
    cardSubtitle: "Access your banking workspace",
    buttonLabel: "Sign in to dashboard",
    chips: w.chips,
    closingTitle: w.closing[0],
    closingText: w.closing[1],
  };
}

/** Default layout and scene for a business type. */
export function defaultsFor(type: BusinessType): { layout: LayoutId; scene: HeroScene; font: FontId } {
  if (type === "cooperative" || type === "savings_and_loans") return { layout: "community", scene: "community", font: "outfit" };
  if (type === "lending_company") return { layout: "split", scene: "branch", font: "manrope" };
  if (type === "finance_house") return { layout: "split", scene: "tower", font: "sora" };
  return { layout: "showcase", scene: "branch", font: "jakarta" };
}
