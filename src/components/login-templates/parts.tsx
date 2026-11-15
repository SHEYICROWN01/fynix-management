import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Headphones, ShieldCheck, BadgeCheck, LockKeyhole, LayoutDashboard, Users, Banknote, PiggyBank, BarChart3, Search, Bell } from "lucide-react";
import type { FontId, LoginBrand, LoginCopy, LoginFacts, LoginFeature, LoginFormSlot } from "./types";
import { iconFor } from "./icons";
import { mix, type Palette } from "./palette";

// ── Fonts ────────────────────────────────────────────────────────────────────

export const FONTS: Record<FontId, { family: string; css: string }> = {
  jakarta: { family: "'Plus Jakarta Sans'", css: "Plus+Jakarta+Sans:wght@400;500;600;700;800" },
  manrope: { family: "'Manrope'", css: "Manrope:wght@400;500;600;700;800" },
  outfit: { family: "'Outfit'", css: "Outfit:wght@400;500;600;700;800" },
  sora: { family: "'Sora'", css: "Sora:wght@400;500;600;700;800" },
  dmsans: { family: "'DM Sans'", css: "DM+Sans:wght@400;500;600;700;800" },
};

export function fontStack(id: FontId) {
  return `${(FONTS[id] ?? FONTS.jakarta).family}, system-ui, -apple-system, 'Segoe UI', sans-serif`;
}

/** Loads the design's Google font once per page. */
export function useDesignFont(id: FontId) {
  useEffect(() => {
    const f = FONTS[id] ?? FONTS.jakarta;
    const key = `ld-font-${id}`;
    if (typeof document === "undefined" || document.getElementById(key)) return;
    const link = document.createElement("link");
    link.id = key;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${f.css}&display=swap`;
    document.head.appendChild(link);
  }, [id]);
}

/** Focus styles for the form fields (inline styles can't express :focus-within). */
export function DesignStyles({ p }: { p: Palette }) {
  return (
    <style>{`
      .ld-field{transition:border-color .15s, box-shadow .15s}
      .ld-field:focus-within{border-color:${p.primary}!important;box-shadow:0 0 0 4px ${mix(p.primary, "#FFFFFF", 0.82)}}
      .ld-input{all:unset;flex:1;min-width:0;height:100%;font-size:15px;font-weight:500;color:${p.ink}}
      .ld-input::placeholder{color:${p.muted};font-weight:400}
      .ld-btn{transition:transform .12s, filter .15s}
      .ld-btn:hover{filter:brightness(1.07)}
      .ld-btn:active{transform:scale(.985)}
      .ld-link{background:none;border:0;padding:0;cursor:pointer;min-height:0!important;line-height:1.2}
      .ld-link:hover{text-decoration:underline}
    `}</style>
  );
}

// ── Brand lockup ─────────────────────────────────────────────────────────────

export function Monogram({ brand, p, size, light = false }: { brand: LoginBrand; p: Palette; size: number; light?: boolean }) {
  const letters = (brand.shortName || brand.name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, background: light ? "#FFFFFF" : p.primary, color: light ? p.primary : p.onPrimary, display: "grid", placeItems: "center", fontWeight: 800, fontSize: size * 0.4, letterSpacing: "-0.02em", flexShrink: 0 }}>
      {letters || "F"}
    </div>
  );
}

/** Logo (or monogram) + name. `light` = on a dark background. */
export function Lockup({ brand, p, h = 44, light = false, showName = true }: { brand: LoginBrand; p: Palette; h?: number; light?: boolean; showName?: boolean }) {
  const [broken, setBroken] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: h * 0.3, minWidth: 0 }}>
      {brand.logoUrl && !broken ? (
        <div style={{ height: h, maxWidth: h * 3.4, display: "flex", alignItems: "center", flexShrink: 0, ...(light ? { background: "#FFFFFF", borderRadius: h * 0.22, padding: `${h * 0.12}px ${h * 0.2}px` } : {}) }}>
          <img src={brand.logoUrl} alt="" onError={() => setBroken(true)} style={{ height: light ? h * 0.76 : h, maxWidth: "100%", objectFit: "contain", display: "block" }} />
        </div>
      ) : (
        <Monogram brand={brand} p={p} size={h} light={light} />
      )}
      {showName && (
        <span style={{ fontSize: h * 0.44, fontWeight: 800, letterSpacing: "-0.02em", color: light ? "#FFFFFF" : p.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {brand.name}
        </span>
      )}
    </div>
  );
}

export function FynixMark({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span style={{ fontSize: size, color, display: "inline-flex", alignItems: "center", gap: 6 }}>
      Powered by <b style={{ fontWeight: 800, letterSpacing: "0.04em" }}>FYNIX</b> Core Banking
    </span>
  );
}

// ── Sign-in card ─────────────────────────────────────────────────────────────

/** In previews there is no real form: fields show sample values and nothing can be submitted. */
const PREVIEW_FORM: LoginFormSlot = {
  email: "", setEmail: () => {}, password: "", setPassword: () => {}, showPassword: false, toggleShowPassword: () => {},
  rememberMe: true, toggleRememberMe: () => {}, isLoading: false, onSubmit: e => e.preventDefault(), onForgot: () => {},
};

export function SignInCard({ brand, p, copy, form, button, width, showLogo = true, style }: {
  brand: LoginBrand; p: Palette; copy: LoginCopy; form: LoginFormSlot | null; button: { bg: string; fg: string };
  width: number | string; showLogo?: boolean; style?: CSSProperties;
}) {
  const f = form ?? PREVIEW_FORM;
  const preview = !form;
  return (
    <div style={{ width, background: p.card, borderRadius: 24, padding: "30px 32px 26px", boxShadow: "0 30px 70px -30px rgba(10,20,40,0.35), 0 0 0 1px rgba(10,20,40,0.05)", ...style }}>
      {showLogo && <div style={{ marginBottom: 18 }}><Lockup brand={brand} p={p} h={40} showName={false} /></div>}
      <h2 style={{ margin: 0, fontSize: 26, lineHeight: "32px", fontWeight: 800, letterSpacing: "-0.02em", color: p.ink }}>{copy.cardTitle}</h2>
      <p style={{ margin: "4px 0 0", fontSize: 14.5, color: p.body }}>{copy.cardSubtitle}</p>

      <form onSubmit={f.onSubmit} style={{ marginTop: 22, display: "grid", gap: 14 }} noValidate={preview}>
        <FieldBox label="Email address" icon={<Mail size={18} />} p={p}>
          <input
            className="ld-input" id="ld-email" type="email" autoComplete="email" placeholder={preview ? "admin@yourbank.com" : "you@institution.com"}
            value={f.email} onChange={e => f.setEmail(e.target.value)} disabled={f.isLoading || preview}
          />
        </FieldBox>
        <FieldBox
          label="Password" icon={<Lock size={18} />} p={p}
          right={<button type="button" className="ld-link" onClick={f.onForgot} style={{ fontSize: 13, fontWeight: 600, color: p.primary }}>Forgot password?</button>}
          trailing={
            <button type="button" className="ld-link" onClick={f.toggleShowPassword} aria-label={f.showPassword ? "Hide password" : "Show password"} style={{ color: p.muted, display: "flex" }}>
              {f.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        >
          <input
            className="ld-input" id="ld-password" type={f.showPassword ? "text" : "password"} autoComplete="current-password"
            placeholder={preview ? "••••••••••" : "Enter your password"}
            value={f.password} onChange={e => f.setPassword(e.target.value)} disabled={f.isLoading || preview}
          />
        </FieldBox>
        <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: p.body, cursor: "pointer", userSelect: "none" }}>
          <span
            role="checkbox" aria-checked={f.rememberMe} tabIndex={0}
            onClick={f.toggleRememberMe} onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); f.toggleRememberMe(); } }}
            style={{ width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", background: f.rememberMe ? p.primary : "#FFFFFF", border: `1.5px solid ${f.rememberMe ? p.primary : p.line}`, color: p.onPrimary, fontSize: 12, fontWeight: 900 }}
          >
            {f.rememberMe ? "✓" : ""}
          </span>
          Keep me signed in on this device
        </label>
        <button
          type="submit" className="ld-btn" disabled={f.isLoading}
          style={{ height: 50, border: 0, borderRadius: 12, background: button.bg, color: button.fg, fontSize: 15.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: preview ? "default" : "pointer", marginTop: 4, fontFamily: "inherit" }}
        >
          {f.isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
          {f.isLoading ? "Signing in…" : copy.buttonLabel}
          {!f.isLoading && <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  );
}

function FieldBox({ label, icon, right, trailing, p, children }: { label: string; icon: ReactNode; right?: ReactNode; trailing?: ReactNode; p: Palette; children: ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: 650, color: p.ink }}>{label}</span>
        {right}
      </div>
      <div className="ld-field" style={{ height: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", borderRadius: 12, border: `1.5px solid ${p.line}`, background: "#FFFFFF", color: p.muted }}>
        {icon}
        {children}
        {trailing}
      </div>
    </div>
  );
}

// ── Tiles, chips, trust ──────────────────────────────────────────────────────

export function FeatureTile({ f, p, dark = false, w = 132 }: { f: LoginFeature; p: Palette; dark?: boolean; w?: number }) {
  const Icon = iconFor(f.icon);
  return (
    <div style={{
      width: w, padding: "16px 12px 14px", borderRadius: 16, textAlign: "center",
      background: dark ? "rgba(255,255,255,0.09)" : "#FFFFFF",
      border: `1px solid ${dark ? "rgba(255,255,255,0.16)" : p.line}`,
      boxShadow: dark ? "none" : "0 10px 24px -18px rgba(10,20,40,0.35)",
    }}>
      <Icon size={28} strokeWidth={1.8} color={dark ? p.accentOnPrimary : p.primary} style={{ display: "block", margin: "0 auto 9px" }} />
      <div style={{ fontSize: 13.5, lineHeight: "17px", fontWeight: 700, color: dark ? "#FFFFFF" : p.ink }}>{f.label}</div>
    </div>
  );
}

export function Chip({ f, p, dark }: { f: LoginFeature; p: Palette; dark?: boolean }) {
  const Icon = iconFor(f.icon);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 9, height: 42, padding: "0 18px", borderRadius: 999, fontSize: 14.5, fontWeight: 650,
      color: dark ? "#FFFFFF" : p.ink, background: dark ? "rgba(255,255,255,0.08)" : "#FFFFFF", border: `1px solid ${dark ? "rgba(255,255,255,0.22)" : p.line}`,
    }}>
      <Icon size={18} color={dark ? p.accentOnPrimary : p.primary} />{f.label}
    </span>
  );
}

/** Only true statements: the institution's own licence line (if given) + facts about this sign-in page. */
export function trustItems(facts: LoginFacts) {
  const items: { icon: typeof ShieldCheck; title: string; sub: string }[] = [];
  if (facts.licenceLine) items.push({ icon: BadgeCheck, title: "Licensed institution", sub: facts.licenceLine });
  items.push({ icon: LockKeyhole, title: "Encrypted sign-in", sub: "Secure connection (HTTPS)" });
  items.push({ icon: ShieldCheck, title: "Staff-only access", sub: "Every sign-in is logged" });
  return items.slice(0, 3);
}

export function TrustStrip({ facts, p, dark = false, gap = 26 }: { facts: LoginFacts; p: Palette; dark?: boolean; gap?: number }) {
  const items = trustItems(facts);
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      {items.map((t, i) => (
        <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 11, paddingLeft: i ? gap : 0, borderLeft: i ? `1px solid ${dark ? "rgba(255,255,255,0.18)" : p.line}` : "none" }}>
          <span style={{ width: 40, height: 40, borderRadius: 999, display: "grid", placeItems: "center", background: dark ? "rgba(255,255,255,0.1)" : p.primarySoft, color: dark ? p.accentOnPrimary : p.primary, flexShrink: 0 }}>
            <t.icon size={20} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 750, color: dark ? "#FFFFFF" : p.ink, whiteSpace: "nowrap" }}>{t.title}</span>
            <span style={{ display: "block", fontSize: 12, color: dark ? "rgba(255,255,255,0.72)" : p.body, whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{t.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function SupportPill({ facts, p, dark = false }: { facts: LoginFacts; p: Palette; dark?: boolean }) {
  const contact = facts.supportPhone || facts.supportEmail;
  if (!contact) return null;
  const href = facts.supportPhone ? `tel:${facts.supportPhone.replace(/\s+/g, "")}` : `mailto:${facts.supportEmail}`;
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 9, height: 42, padding: "0 18px", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 650,
      color: dark ? "#FFFFFF" : p.ink, border: `1.5px solid ${dark ? p.accentOnPrimary : p.secondary}`, background: dark ? "transparent" : "#FFFFFF",
    }}>
      <Headphones size={18} color={dark ? p.accentOnPrimary : p.accentOnLight} /> Support · {contact}
    </a>
  );
}

// ── Decorative dashboard preview (sample figures only) ───────────────────────

export function DashboardPreview({ brand, p, width }: { brand: LoginBrand; p: Palette; width: number }) {
  const stats = [
    { icon: Users, label: "Customers", value: "12,480", tone: p.primary },
    { icon: Banknote, label: "Active loans", value: "₦2.4B", tone: p.accentOnLight },
    { icon: PiggyBank, label: "Savings", value: "₦3.1B", tone: p.primary },
    { icon: BarChart3, label: "Repaid on time", value: "96%", tone: p.accentOnLight },
  ];
  const nav = [LayoutDashboard, Users, Banknote, PiggyBank, BarChart3];
  return (
    <div style={{ width, borderRadius: 18, overflow: "hidden", background: "#FFFFFF", boxShadow: "0 28px 60px -30px rgba(10,20,40,0.45), 0 0 0 1px rgba(10,20,40,0.06)", position: "relative" }}>
      <div style={{ height: 46, background: p.primary, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
        <Lockup brand={brand} p={p} h={26} light />
        <div style={{ display: "flex", gap: 12, color: p.onPrimary, opacity: 0.85 }}><Search size={15} /><Bell size={15} /></div>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ width: 52, padding: "12px 0", display: "grid", gap: 14, justifyItems: "center", borderRight: `1px solid ${p.line}` }}>
          {nav.map((I, i) => <I key={i} size={17} color={i === 0 ? p.primary : p.muted} />)}
        </div>
        <div style={{ flex: 1, padding: "12px 14px 14px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: p.ink }}>Good morning 👋</div>
          <div style={{ fontSize: 10.5, color: p.body, marginBottom: 10 }}>Here's how {brand.shortName || brand.name} is doing today.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {stats.map(s => (
              <div key={s.label} style={{ border: `1px solid ${p.line}`, borderRadius: 10, padding: "8px 9px" }}>
                <s.icon size={14} color={s.tone} />
                <div style={{ fontSize: 9.5, color: p.body, marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: p.ink, letterSpacing: "-0.02em" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span style={{ position: "absolute", right: 10, bottom: 8, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: p.muted }}>SAMPLE PREVIEW</span>
    </div>
  );
}
