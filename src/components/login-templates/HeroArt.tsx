import { useId } from "react";
import type { LoginBrand, LoginHero } from "./types";
import { mix, type Palette } from "./palette";

/**
 * Hero artwork. "illustration" heroes are drawn here in crisp, solid shapes (no gradients) with the institution's
 * real logo on the sign — so the logo is never misspelt or redrawn. "photo" heroes show an uploaded or AI image.
 */
export function HeroArt({ hero, brand, p, width, height, radius = 0, frame = false }: {
  hero: LoginHero; brand: LoginBrand; p: Palette; width: number | string; height: number | string; radius?: number; frame?: boolean;
}) {
  if (hero.kind === "photo" && hero.photoUrl) {
    return (
      <div style={{ width, height, borderRadius: radius, overflow: "hidden", background: p.primarySoft, boxShadow: frame ? "0 30px 60px -28px rgba(10,20,40,0.45)" : undefined }}>
        <img src={hero.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  const Art = hero.scene === "community" || hero.scene === "market" ? CommunityArt : BuildingArt;
  return (
    <div style={{ width, height, borderRadius: radius, overflow: "hidden" }}>
      <Art hero={hero} brand={brand} p={p} />
    </div>
  );
}

// ── Shared bits ──────────────────────────────────────────────────────────────

function sky(time: LoginHero["time"], p: Palette) {
  if (time === "evening") return { sky: mix(p.deep, "#1A2238", 0.55), far: mix(p.deep, "#2A3550", 0.4), sun: "#F6D28B", cloud: mix(p.deep, "#FFFFFF", 0.18), lit: true };
  if (time === "golden") return { sky: "#FBE6CC", far: "#F3D3AE", sun: "#F4B03E", cloud: "#FFF6EA", lit: true };
  return { sky: "#DDEBF8", far: "#CBDDF0", sun: "#FFFFFF", cloud: "#FFFFFF", lit: false };
}

const GREENS = ["#2E7A4C", "#3B9259", "#55AC6C", "#2A6B45"];

function Tree({ x, y, s = 1, shade = 0 }: { x: number; y: number; s?: number; shade?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-3} y={-6} width={6} height={30} rx={2} fill="#6B4E36" />
      <circle cx={0} cy={-26} r={22} fill={GREENS[(shade + 3) % 4]} />
      <circle cx={-14} cy={-14} r={16} fill={GREENS[shade % 4]} />
      <circle cx={14} cy={-12} r={17} fill={GREENS[(shade + 1) % 4]} />
      <circle cx={2} cy={-40} r={14} fill={GREENS[(shade + 2) % 4]} />
    </g>
  );
}

function Planter({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={-16} r={13} fill={GREENS[1]} />
      <circle cx={-8} cy={-10} r={9} fill={GREENS[2]} />
      <circle cx={8} cy={-9} r={9} fill={GREENS[0]} />
      <path d="M-13 -4 L13 -4 L10 14 L-10 14 Z" fill={color} />
    </g>
  );
}

function Clouds({ c }: { c: string }) {
  return (
    <g fill={c}>
      <rect x={60} y={70} width={120} height={22} rx={11} />
      <rect x={92} y={56} width={64} height={24} rx={12} />
      <rect x={470} y={44} width={110} height={20} rx={10} />
      <rect x={500} y={32} width={50} height={20} rx={10} />
    </g>
  );
}

/** The real logo on a sign; falls back to the name in the brand's ink colour. */
function Sign({ x, y, w, h, brand, p, clipId }: { x: number; y: number; w: number; h: number; brand: LoginBrand; p: Palette; clipId: string }) {
  const name = brand.shortName || brand.name;
  const fs = Math.max(11, Math.min(22, (w - 24) / Math.max(4, name.length) * 1.7));
  return (
    <g>
      <rect x={x + 3} y={y + 4} width={w} height={h} rx={8} fill="rgba(10,20,35,0.18)" />
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#FFFFFF" />
      {brand.logoUrl ? (
        <>
          <clipPath id={clipId}><rect x={x + 8} y={y + 6} width={w - 16} height={h - 12} rx={4} /></clipPath>
          <image href={brand.logoUrl} x={x + 8} y={y + 6} width={w - 16} height={h - 12} preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clipId})`} />
        </>
      ) : (
        <text x={x + w / 2} y={y + h / 2 + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight={800} fill={p.ink} style={{ fontFamily: "inherit", letterSpacing: "-0.01em" }}>
          {name}
        </text>
      )}
    </g>
  );
}

// ── Building ─────────────────────────────────────────────────────────────────

function BuildingArt({ hero, brand, p }: { hero: LoginHero; brand: LoginBrand; p: Palette }) {
  const uid = useId().replace(/:/g, "");
  const s = sky(hero.time, p);
  const v = ((hero.variant % 3) + 3) % 3;
  // Facade geometry per style: 0 glass tower · 1 low-rise branch · 2 two-tone block
  const top = v === 0 ? 92 : v === 1 ? 196 : 140;
  const fx = v === 1 ? 92 : 140, fw = v === 1 ? 392 : 330;
  const base = 452;
  const side = 74;
  const glass = s.lit ? "#3E5A78" : "#9DBCD3";
  const glassAlt = s.lit ? "#4A6A8C" : "#B7CFE0";
  const litWin = "#FFD98E";
  const stone = "#F3F1EC";
  const stoneSide = "#DAD6CD";
  const frame = p.primary;
  const frameSide = mix(p.primary, "#000000", 0.28);

  const rows = Math.floor((base - 70 - top) / 34);
  const sideWindows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      const y = top + 20 + r * 34 + c * 3;
      sideWindows.push(<path key={`${r}-${c}`} d={`M${fx + fw + 10 + c * 31} ${y + c * 6} l26 7 v24 l-26 -7 Z`} fill={s.lit && (r + c) % 3 === 0 ? litWin : (r + c) % 2 ? glass : glassAlt} />);
    }
  }
  const frontCols = v === 1 ? 7 : 5;
  const glassX = fx + (v === 2 ? 0 : 34), glassW = fw - (v === 2 ? 0 : 34);
  const glassTop = v === 2 ? top + 18 : top + 92, glassBottom = v === 2 ? top + 120 : base - 86;
  const colW = glassW / frontCols;
  const frontWindows = [];
  for (let c = 0; c < frontCols; c++) {
    frontWindows.push(<rect key={`f${c}`} x={glassX + c * colW + 3} y={glassTop} width={colW - 6} height={glassBottom - glassTop} fill={s.lit && c % 2 === 0 ? litWin : c % 2 ? glass : glassAlt} />);
  }
  const floorLines = [];
  for (let y = glassTop + 34; y < glassBottom; y += 34) floorLines.push(<rect key={`l${y}`} x={glassX} y={y} width={glassW} height={3} fill={stone} opacity={0.85} />);

  const signW = v === 1 ? 210 : 176, signH = v === 1 ? 64 : 58;
  const signX = v === 1 ? fx + fw / 2 - signW / 2 : fx + 44;
  const signY = v === 2 ? top + 150 : top + 22;

  return (
    <svg viewBox="0 0 640 560" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width="640" height="560" fill={s.sky} />
      <circle cx={520} cy={120} r={44} fill={s.sun} opacity={hero.time === "morning" ? 0.9 : 1} />
      <Clouds c={s.cloud} />
      {/* distant city */}
      <g fill={s.far}>
        <rect x={12} y={300} width={52} height={170} />
        <rect x={70} y={262} width={40} height={210} />
        <rect x={548} y={286} width={44} height={190} />
        <rect x={596} y={320} width={44} height={150} />
      </g>
      {/* plaza */}
      <rect x={0} y={base} width={640} height={108} fill={hero.time === "evening" ? "#3A4256" : "#E9E5DD"} />
      <path d={`M0 ${base + 30} H640`} stroke={hero.time === "evening" ? "#454E64" : "#DCD7CC"} strokeWidth={2} />
      <path d={`M0 ${base + 66} H640`} stroke={hero.time === "evening" ? "#454E64" : "#DCD7CC"} strokeWidth={2} />

      {/* side face */}
      <path d={`M${fx + fw} ${top} L${fx + fw + side} ${top + 22} L${fx + fw + side} ${base - 6} L${fx + fw} ${base} Z`} fill={stoneSide} />
      {sideWindows}
      {/* front face */}
      <rect x={fx} y={top} width={fw} height={base - top} fill={stone} />
      {frontWindows}
      {floorLines}
      {/* brand frame: thick primary L-frame + roof fin */}
      <rect x={fx - 14} y={top - 16} width={fw + 28} height={18} fill={frame} />
      <path d={`M${fx + fw + 14} ${top - 16} L${fx + fw + side + 8} ${top + 8} L${fx + fw + side + 8} ${top + 24} L${fx + fw + 14} ${top + 2} Z`} fill={frameSide} />
      {v !== 1 && <rect x={fx - 14} y={top - 16} width={22} height={base - top + 16} fill={frame} />}
      {v === 2 && [0, 1, 2, 3].map(i => <rect key={i} x={fx + 60 + i * 72} y={top + 18} width={7} height={102} fill={frame} />)}
      {/* accent stripe */}
      <rect x={fx - 14} y={top + 2} width={fw + 28} height={4} fill={p.secondary} />

      <Sign x={signX} y={signY} w={signW} h={signH} brand={brand} p={p} clipId={`sign-${uid}`} />

      {/* canopy + entrance */}
      <rect x={fx + fw / 2 - 120} y={base - 96} width={240} height={14} fill={mix(stone, "#000", 0.08)} />
      <rect x={fx + fw / 2 - 120} y={base - 84} width={240} height={5} fill={p.secondary} />
      {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={fx + fw / 2 - 96 + i * 48} cy={base - 76} r={3} fill="#FFE7B0" />)}
      <rect x={fx + fw / 2 - 92} y={base - 74} width={184} height={74} fill={s.lit ? "#F7D49A" : "#EAD9B8"} />
      {[0, 1, 2, 3].map(i => <rect key={i} x={fx + fw / 2 - 92 + i * 46} y={base - 74} width={3} height={74} fill="#5B6577" />)}
      <rect x={fx + fw / 2 - 92} y={base - 74} width={184} height={3} fill="#5B6577" />
      {/* steps */}
      <rect x={fx + fw / 2 - 130} y={base} width={260} height={7} fill="#D3CEC3" />
      <rect x={fx + fw / 2 - 140} y={base + 7} width={280} height={7} fill="#C9C3B6" />

      <Planter x={fx + fw / 2 - 118} y={base - 2} color="#3F4757" />
      <Planter x={fx + fw / 2 + 118} y={base - 2} color="#3F4757" />
      <Tree x={60} y={base + 2} s={1.25} shade={0} />
      <Tree x={112} y={base + 14} s={0.9} shade={2} />
      <Tree x={fx + fw + side + 40} y={base + 10} s={1.15} shade={1} />
      <Tree x={604} y={base + 18} s={0.95} shade={3} />
    </svg>
  );
}

// ── Community scene ──────────────────────────────────────────────────────────

function House({ x, y, w, roof, door }: { x: number; y: number; w: number; roof: string; door: string }) {
  const h = w * 0.62;
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} fill="#FBF7F0" />
      <path d={`M${x - 6} ${y - h} L${x + w / 2} ${y - h - w * 0.42} L${x + w + 6} ${y - h} Z`} fill={roof} />
      <rect x={x + w * 0.4} y={y - h * 0.55} width={w * 0.2} height={h * 0.55} fill={door} />
      <rect x={x + w * 0.12} y={y - h * 0.7} width={w * 0.16} height={w * 0.14} fill="#A9C6DA" />
      <rect x={x + w * 0.72} y={y - h * 0.7} width={w * 0.16} height={w * 0.14} fill="#A9C6DA" />
    </g>
  );
}

function CommunityArt({ hero, brand, p }: { hero: LoginHero; brand: LoginBrand; p: Palette }) {
  const uid = useId().replace(/:/g, "");
  const s = sky(hero.time, p);
  const hillFar = mix(hero.time === "evening" ? p.deep : "#7FA88A", p.primary, 0.18);
  const hillMid = mix("#4E8C5E", p.primary, 0.12);
  const hillNear = mix("#3A7A4C", p.primary, 0.1);
  return (
    <svg viewBox="0 0 640 560" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width="640" height="560" fill={s.sky} />
      <circle cx={430} cy={170} r={58} fill={hero.time === "morning" ? "#FFF3C9" : s.sun} />
      <Clouds c={s.cloud} />
      <path d="M0 300 C 90 230, 170 250, 250 285 C 330 240, 430 215, 520 260 C 570 240, 610 245, 640 255 V560 H0 Z" fill={hillFar} />
      <path d="M0 360 C 120 300, 220 330, 320 350 C 420 310, 520 300, 640 330 V560 H0 Z" fill={hillMid} />
      {/* river */}
      <path d="M380 560 C 360 500, 420 460, 380 420 C 350 395, 420 380, 470 372 L520 372 C 470 384, 410 396, 430 420 C 470 462, 420 500, 460 560 Z" fill={hero.time === "evening" ? "#4C6A8E" : "#9CC9E4"} />
      <path d="M0 430 C 130 392, 250 405, 350 420 C 300 450, 300 500, 330 560 H0 Z" fill={hillNear} />
      <path d="M470 560 C 450 500, 500 460, 640 440 V560 Z" fill={hillNear} />
      {/* village */}
      <House x={70} y={430} w={54} roof={p.secondary} door={p.primary} />
      <House x={140} y={420} w={46} roof={p.primary} door={p.secondary} />
      <House x={530} y={446} w={50} roof={p.primary} door={p.secondary} />
      {/* community hall with the institution's sign */}
      <g>
        <rect x={196} y={350} width={158} height={86} fill="#FBF7F0" />
        <path d="M186 352 L275 300 L364 352 Z" fill={p.primary} />
        <rect x={186} y={348} width={178} height={6} fill={p.secondary} />
        <rect x={258} y={392} width={34} height={44} fill={s.lit ? "#F7D49A" : p.deep} />
        <rect x={212} y={392} width={28} height={22} fill="#A9C6DA" />
        <rect x={310} y={392} width={28} height={22} fill="#A9C6DA" />
        <Sign x={215} y={358} w={120} h={28} brand={brand} p={p} clipId={`hall-${uid}`} />
      </g>
      {/* market stalls */}
      {[0, 1, 2].map(i => (
        <g key={i} transform={`translate(${392 + i * 46} 470)`}>
          <rect x={0} y={-30} width={40} height={30} fill="#F3EDE3" />
          {[0, 1, 2, 3].map(k => <rect key={k} x={k * 10} y={-42} width={10} height={14} fill={k % 2 ? "#FFFFFF" : i % 2 ? p.secondary : p.primary} />)}
        </g>
      ))}
      <Tree x={36} y={470} s={1.1} shade={0} />
      <Tree x={170} y={486} s={1.25} shade={2} />
      <Tree x={600} y={478} s={1.1} shade={1} />
      <Tree x={372} y={500} s={0.9} shade={3} />
      <path d="M0 520 H640 V560 H0 Z" fill={mix(hillNear, "#000", 0.15)} />
    </svg>
  );
}
