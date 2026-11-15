import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import type { LoginBrand, LoginDesign, LoginFormSlot } from "./types";
import { HeroArt } from "./HeroArt";
import { Chip, DashboardPreview, FeatureTile, FynixMark, Lockup, SignInCard, SupportPill, TrustStrip } from "./parts";
import type { Palette } from "./palette";

/**
 * Every desktop layout is designed on a 1440 × 900 stage. On wider screens the stage grows sideways (`W`):
 * backgrounds stretch to the full width while the content stays centred in its 1440 column.
 */
export const STAGE_W = 1440;
export const STAGE_H = 900;

export interface LayoutProps { design: LoginDesign; brand: LoginBrand; p: Palette; form: LoginFormSlot | null; W?: number }

/** Largest size (≤ max) at which the longer headline line fits `width` on one line. */
const headlineSize = (a: string, b: string, width = 560, max = 62) => {
  const longest = Math.max(a.length, b.length, 8);
  return Math.max(34, Math.min(max, Math.floor(width / (longest * 0.56))));
};

/** The centred 1440-wide content column. */
function Column({ W, children }: { W: number; children: ReactNode }) {
  return <div style={{ position: "absolute", left: (W - STAGE_W) / 2, top: 0, width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ── Showcase (NovaTrust-style) ───────────────────────────────────────────────

export function ShowcaseLayout({ design, brand, p, form, W = STAGE_W }: LayoutProps) {
  const c = design.copy;
  const hs = headlineSize(c.headline, c.headlineAccent, 540, 60);
  return (
    <div style={{ position: "relative", width: W, height: STAGE_H, background: p.page, overflow: "hidden" }}>
      {/* solid brand band across the bottom, with a fine accent line */}
      <svg width={W} height={330} viewBox="0 0 1440 330" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 0 }}>
        <path d="M0 140 C 380 40, 760 60, 1040 150 C 1200 200, 1330 190, 1440 150 V330 H0 Z" fill={p.primary} />
        <path d="M0 128 C 380 28, 760 48, 1040 138 C 1200 188, 1330 178, 1440 138" fill="none" stroke={p.secondary} strokeWidth={6} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* header bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 86, background: "#FFFFFF", borderBottom: `1px solid ${p.line}` }} />

      <Column W={W}>
        {/* hero art behind the text, right of centre */}
        <div style={{ position: "absolute", left: 610, top: 86, width: 420, height: 540, borderRadius: "0 0 0 210px", overflow: "hidden" }}>
          <HeroArt hero={design.hero} brand={brand} p={p} width={420} height={540} />
        </div>

        <div style={{ position: "absolute", left: 64, right: 64, top: 0, height: 86, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Lockup brand={brand} p={p} h={44} />
            <span style={{ width: 1, height: 32, background: p.line }} />
            <span style={{ fontSize: 13.5, color: p.body }}>Staff banking workspace</span>
          </div>
          <SupportPill facts={design.facts} p={p} />
        </div>

        <div style={{ position: "absolute", left: 64, top: 128, width: 540 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9, height: 36, padding: "0 16px", borderRadius: 999, background: p.primarySoft, color: p.primary, fontSize: 12.5, fontWeight: 800, letterSpacing: "0.12em" }}>
            <Lock size={15} /> {c.eyebrow.toUpperCase()}
          </span>
          <h1 style={{ margin: "22px 0 0", fontSize: hs, lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.035em", color: p.ink }}>
            {c.headline}<br /><span style={{ color: p.accentOnLight }}>{c.headlineAccent}</span>
          </h1>
          <p style={{ margin: "18px 0 0", fontSize: 18, lineHeight: 1.55, color: p.body, maxWidth: 500 }}>{c.subheadline}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            {c.features.slice(0, 4).map(f => <FeatureTile key={f.label} f={f} p={p} w={124} />)}
          </div>
        </div>

        {design.showPreview && (
          <div style={{ position: "absolute", left: 64, top: 640 }}>
            <DashboardPreview brand={brand} p={p} width={560} />
          </div>
        )}

        <SignInCard brand={brand} p={p} copy={c} form={form} button={{ bg: p.primary, fg: p.onPrimary }} width={380} style={{ position: "absolute", left: 1000, top: 116 }} />
        <div style={{ position: "absolute", left: 700, top: 640, background: "#FFFFFF", borderRadius: 16, padding: "16px 20px", boxShadow: "0 18px 40px -28px rgba(10,20,40,0.4)" }}>
          <TrustStrip facts={design.facts} p={p} gap={18} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center" }}>
          <FynixMark color={p.onPrimary === "#FFFFFF" ? "rgba(255,255,255,0.85)" : p.ink} />
        </div>
      </Column>
    </div>
  );
}

// ── Community (Crestline-style) ──────────────────────────────────────────────

export function CommunityLayout({ design, brand, p, form, W = STAGE_W }: LayoutProps) {
  const c = design.copy;
  const hs = headlineSize(c.headline, c.headlineAccent, 500, 66);
  return (
    <div style={{ position: "relative", width: W, height: STAGE_H, background: p.deep, overflow: "hidden", color: "#FFFFFF" }}>
      {/* lower white band, full width */}
      <div style={{ position: "absolute", left: 0, top: 640, width: W, height: 260, background: "#FFFFFF" }} />
      <div style={{ position: "absolute", left: 0, top: 640, width: W, height: 6, background: p.secondary }} />

      <Column W={W}>
        <div style={{ position: "absolute", left: 600, top: 96, width: 380, height: 470, borderRadius: 28, overflow: "hidden", outline: `6px solid ${p.secondary}`, outlineOffset: 8 }}>
          <HeroArt hero={design.hero} brand={brand} p={p} width={380} height={470} />
        </div>

        <div style={{ position: "absolute", left: 64, right: 64, top: 26, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Lockup brand={brand} p={p} h={46} light />
          <SupportPill facts={design.facts} p={p} dark />
        </div>

        <div style={{ position: "absolute", left: 64, top: 136, width: 500 }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", color: p.accentOnPrimary }}>{c.eyebrow.toUpperCase()}</div>
          <h1 style={{ margin: "16px 0 0", fontSize: hs, lineHeight: 1.04, fontWeight: 800, letterSpacing: "-0.035em" }}>
            {c.headline}<br /><span style={{ color: p.accentOnPrimary }}>{c.headlineAccent}</span>
          </h1>
          <p style={{ margin: "20px 0 0", fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,0.82)" }}>{c.subheadline}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
            {c.chips.slice(0, 3).map(f => <Chip key={f.label} f={f} p={p} dark />)}
          </div>
        </div>

        <SignInCard brand={brand} p={p} copy={c} form={form} button={{ bg: p.primary, fg: p.onPrimary }} width={392} style={{ position: "absolute", left: 1000, top: 96 }} />

        <div style={{ position: "absolute", left: 64, top: 692, width: 600 }}>
          <div style={{ fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: "-0.025em", color: p.ink }}>{c.closingTitle}</div>
          <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.6, color: p.body }}>{c.closingText}</p>
        </div>
        <div style={{ position: "absolute", left: 740, top: 688, display: "flex", gap: 14 }}>
          {c.features.slice(0, 4).map(f => <FeatureTile key={f.label} f={f} p={p} w={146} />)}
        </div>
        <div style={{ position: "absolute", left: 64, bottom: 30 }}><TrustStrip facts={design.facts} p={p} gap={22} /></div>
        <div style={{ position: "absolute", right: 64, bottom: 40 }}><FynixMark color={p.muted} /></div>
      </Column>
    </div>
  );
}

// ── Split (PrimeFins-style) ──────────────────────────────────────────────────

export function SplitLayout({ design, brand, p, form, W = STAGE_W }: LayoutProps) {
  const c = design.copy;
  const hs = headlineSize(c.headline, c.headlineAccent, 370, 58);
  const ox = (W - STAGE_W) / 2;
  return (
    <div style={{ position: "relative", width: W, height: STAGE_H, background: p.page, overflow: "hidden" }}>
      {/* colour panel and photo/illustration reach the left edge of the screen */}
      <div style={{ position: "absolute", left: 0, top: 0, width: ox + 900, height: STAGE_H, background: p.deep }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: ox + 440, height: STAGE_H, overflow: "hidden" }}>
        <HeroArt hero={design.hero} brand={brand} p={p} width={ox + 440} height={STAGE_H} />
      </div>

      <Column W={W}>
        <svg width={900} height={STAGE_H} viewBox={`0 0 900 ${STAGE_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={`M440 0 C 470 260, 470 640, 440 ${STAGE_H} H480 C 510 640, 510 260, 480 0 Z`} fill={p.deep} />
          <path d={`M200 ${STAGE_H} C 420 780, 700 740, 900 780`} fill="none" stroke={p.secondary} strokeWidth={6} />
        </svg>

        <div style={{ position: "absolute", left: 500, top: 70 }}><Lockup brand={brand} p={p} h={44} light /></div>
        <div style={{ position: "absolute", left: 500, top: 170, width: 370, color: "#FFFFFF" }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.14em", color: p.accentOnPrimary }}>{c.eyebrow.toUpperCase()}</div>
          <h1 style={{ margin: "14px 0 0", fontSize: hs, lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.035em" }}>
            {c.headline}<br /><span style={{ color: p.accentOnPrimary }}>{c.headlineAccent}</span>
          </h1>
          <div style={{ width: 120, height: 5, borderRadius: 3, background: p.secondary, marginTop: 18 }} />
          <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.6, color: "rgba(255,255,255,0.84)" }}>{c.subheadline}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 26 }}>
            {c.features.slice(0, 4).map(f => <FeatureTile key={f.label} f={f} p={p} dark w={175} />)}
          </div>
        </div>

        <div style={{ position: "absolute", left: 900, top: 0, width: 540, height: STAGE_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          <SignInCard brand={brand} p={p} copy={c} form={form} button={{ bg: p.secondary, fg: p.onSecondary }} width={420} />
          <SupportPill facts={design.facts} p={p} />
          <FynixMark color={p.muted} />
        </div>
      </Column>
    </div>
  );
}

// ── Phones and narrow windows (all layouts) ──────────────────────────────────

export function MobileLayout({ design, brand, p, form }: LayoutProps) {
  const c = design.copy;
  const dark = design.layout !== "showcase";
  return (
    <div style={{ minHeight: "100%", background: dark ? p.deep : p.page }}>
      <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: dark ? "transparent" : "#FFFFFF", borderBottom: dark ? "none" : `1px solid ${p.line}` }}>
        <Lockup brand={brand} p={p} h={34} light={dark} />
      </div>
      <div style={{ position: "relative", height: 190, overflow: "hidden" }}>
        <HeroArt hero={design.hero} brand={brand} p={p} width="100%" height={190} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: p.secondary }} />
      </div>
      <div style={{ padding: "22px 20px 0", color: dark ? "#FFFFFF" : p.ink }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.14em", color: dark ? p.accentOnPrimary : p.primary }}>{c.eyebrow.toUpperCase()}</div>
        <h1 style={{ margin: "8px 0 0", fontSize: 30, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.03em" }}>
          {c.headline} <span style={{ color: dark ? p.accentOnPrimary : p.accentOnLight }}>{c.headlineAccent}</span>
        </h1>
      </div>
      <div style={{ padding: "20px 16px 28px" }}>
        <SignInCard brand={brand} p={p} copy={c} form={form} button={{ bg: p.primary, fg: p.onPrimary }} width="100%" showLogo={false} style={{ padding: "24px 20px 22px" }} />
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}><SupportPill facts={design.facts} p={p} dark={dark} /></div>
        <div style={{ marginTop: 14, textAlign: "center" }}><FynixMark color={dark ? "rgba(255,255,255,0.7)" : p.muted} /></div>
      </div>
    </div>
  );
}
