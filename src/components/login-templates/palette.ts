/**
 * Builds a full, readable colour scheme from the institution's two brand colours.
 * Solid colours only — no gradients anywhere in the login designs.
 */

export interface Palette {
  primary: string;
  secondary: string;
  /** Text/icons on a primary background. */
  onPrimary: string;
  onSecondary: string;
  /** Very dark brand-tinted colour for headings. */
  ink: string;
  /** Body text. */
  body: string;
  muted: string;
  /** Page background (near-white with a hint of the brand). */
  page: string;
  /** Light tint of the primary (badges, tiles). */
  primarySoft: string;
  secondarySoft: string;
  /** Secondary colour adjusted so it reads on white (headline accent). */
  accentOnLight: string;
  /** Secondary colour adjusted so it reads on the primary (accent on dark panels). */
  accentOnPrimary: string;
  /** Deep version of the primary for full-bleed dark backgrounds. */
  deep: string;
  line: string;
  card: string;
}

type RGB = [number, number, number];

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return [10, 37, 64];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = ([r, g, b]: RGB) => "#" + [r, g, b].map(v => clamp(v).toString(16).padStart(2, "0")).join("").toUpperCase();

/** Mix `a` toward `b` by t (0 = a, 1 = b). */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Darken (toward ink) or lighten (toward white) `c` until it reaches `ratio` against `bg`. */
function ensureContrast(c: string, bg: string, ratio: number): string {
  if (contrast(c, bg) >= ratio) return c;
  const towards = luminance(bg) > 0.4 ? "#0A0F1A" : "#FFFFFF";
  for (let t = 0.08; t <= 1; t += 0.08) {
    const m = mix(c, towards, t);
    if (contrast(m, bg) >= ratio) return m;
  }
  return towards;
}

const isHex = (s: string | undefined | null): s is string => !!s && /^#?[0-9a-fA-F]{6}$/.test(s.trim());

export function buildPalette(primaryIn: string, secondaryIn: string): Palette {
  const primary = isHex(primaryIn) ? (primaryIn.startsWith("#") ? primaryIn : `#${primaryIn}`).toUpperCase() : "#0A2540";
  let secondary = isHex(secondaryIn) ? (secondaryIn.startsWith("#") ? secondaryIn : `#${secondaryIn}`).toUpperCase() : "#C99A2E";
  // Two near-identical brand colours would make the accent invisible — pick a warm gold instead.
  if (contrast(primary, secondary) < 1.25) secondary = "#C99A2E";

  const white = "#FFFFFF";
  const ink = mix(primary, "#06090F", contrast(primary, white) > 9 ? 0.15 : 0.62);
  const page = mix(primary, white, 0.955);
  const deep = contrast(primary, white) >= 7 ? primary : mix(primary, "#06090F", 0.45);
  return {
    primary,
    secondary,
    onPrimary: contrast(white, primary) >= 3.2 ? white : "#0A0F1A",
    onSecondary: contrast(white, secondary) >= 3.2 ? white : "#0A0F1A",
    ink,
    body: mix(ink, "#5B6475", 0.55),
    muted: mix(ink, "#9AA3B2", 0.7),
    page,
    primarySoft: mix(primary, white, 0.88),
    secondarySoft: mix(secondary, white, 0.84),
    accentOnLight: ensureContrast(secondary, page, 3.1),
    accentOnPrimary: ensureContrast(secondary, deep, 3.1),
    deep,
    line: mix(primary, "#D9DEE6", 0.86),
    card: white,
  };
}
