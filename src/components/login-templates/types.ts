/**
 * Institution login designs — shared by the management portal (Login Studio previews) and the core banking app
 * (the real login page). This folder is copied byte-for-byte into fynix-corebanking/src/components/login-templates;
 * change it in one place and copy it to the other.
 *
 * A design is DATA only (layout + wording + picture choices). Colours and the logo are not stored in it: they come
 * from the institution's branding at render time, so a later colour or logo change applies automatically.
 */

export type LayoutId = "showcase" | "community" | "split";

export type BusinessType =
  | "microfinance_bank"
  | "cooperative"
  | "savings_and_loans"
  | "lending_company"
  | "finance_house"
  | "mortgage_bank";

/** Icons the copywriter may choose from (mapped to real icons in icons.tsx). */
export type IconKey =
  | "loans" | "savings" | "customers" | "members" | "reports" | "operations" | "wallet" | "shield"
  | "growth" | "handshake" | "building" | "calendar" | "contributions" | "farm" | "home" | "briefcase"
  | "card" | "phone" | "clock" | "target";

export type HeroScene = "branch" | "tower" | "community" | "market";
export type HeroTime = "morning" | "golden" | "evening";
export type FontId = "jakarta" | "manrope" | "outfit" | "sora" | "dmsans";

export interface LoginFeature { icon: IconKey; label: string }

export interface LoginCopy {
  /** Small capitals label above the headline, e.g. "PRIVATE BANKING WORKSPACE". */
  eyebrow: string;
  /** Headline, first line (dark). */
  headline: string;
  /** Headline, second line (brand accent colour). */
  headlineAccent: string;
  subheadline: string;
  /** Exactly 4. */
  features: LoginFeature[];
  /** Card heading, e.g. "Sign in to NovaTrust". */
  cardTitle: string;
  cardSubtitle: string;
  buttonLabel: string;
  /** Community layout: 3 short value chips, e.g. "Member-owned". */
  chips: LoginFeature[];
  /** Community layout: closing section. */
  closingTitle: string;
  closingText: string;
}

export interface LoginHero {
  /** "illustration" = drawn by us with the real logo on the building; "photo" = uploaded or AI-generated image. */
  kind: "illustration" | "photo";
  scene: HeroScene;
  time: HeroTime;
  /** 0–2: building style for the illustration. */
  variant: number;
  photoUrl?: string | null;
}

export interface LoginFacts {
  /** Shown as written — must be true. e.g. "Licensed by the CBN · RC 1234567". */
  licenceLine?: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
}

export interface LoginDesign {
  version: 1;
  layout: LayoutId;
  font: FontId;
  businessType: BusinessType;
  copy: LoginCopy;
  hero: LoginHero;
  facts: LoginFacts;
  /** Show the decorative dashboard preview (sample figures, clearly marked). */
  showPreview: boolean;
  generatedBy: "ai" | "template";
  generatedAt: string;
}

/** Branding the design is drawn with (from the institution record, not the design). */
export interface LoginBrand {
  name: string;
  /** Short name for the card title fallback, e.g. "NovaTrust". */
  shortName?: string;
  logoUrl?: string | null;
  primary: string;
  secondary: string;
}

/** The working sign-in form, supplied by the page that owns the login logic. */
export interface LoginFormSlot {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  rememberMe: boolean;
  toggleRememberMe: () => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
}

export const BUSINESS_TYPES: { id: BusinessType; label: string }[] = [
  { id: "microfinance_bank", label: "Microfinance bank" },
  { id: "cooperative", label: "Cooperative society" },
  { id: "savings_and_loans", label: "Savings & loans / thrift" },
  { id: "lending_company", label: "Lending company" },
  { id: "finance_house", label: "Finance house" },
  { id: "mortgage_bank", label: "Mortgage bank" },
];

export const LAYOUTS: { id: LayoutId; label: string; note: string }[] = [
  { id: "showcase", label: "Showcase", note: "Headline, building, dashboard preview" },
  { id: "community", label: "Community", note: "Warm, member-focused, landscape" },
  { id: "split", label: "Split", note: "Bold colour panel with building" },
];
