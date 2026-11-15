import { useEffect, useMemo, useRef, useState } from "react";
import type { LoginBrand, LoginDesign, LoginFormSlot } from "./types";
import { buildPalette } from "./palette";
import { DesignStyles, fontStack, useDesignFont } from "./parts";
import { CommunityLayout, MobileLayout, STAGE_H, STAGE_W, ShowcaseLayout, SplitLayout } from "./layouts";
import { shortName } from "./design";

const LAYOUTS = { showcase: ShowcaseLayout, community: CommunityLayout, split: SplitLayout } as const;

/** Below this width the phone layout is used. */
const DESKTOP_MIN_W = 1000;

function useWindowSize() {
  const read = () => ({ w: typeof window === "undefined" ? 1440 : window.innerWidth, h: typeof window === "undefined" ? 900 : window.innerHeight });
  const [s, set] = useState(read);
  useEffect(() => {
    const on = () => set(read());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return s;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Draws an institution's login design.
 * - mode "page": the real login page — fills the window; desktop stage scaled to fit, phone layout on small screens.
 * - mode "preview": fits the parent's width (Login Studio); `device` chooses desktop or phone. No real form.
 */
export function LoginDesignView({ design, brand, form = null, mode = "page", device = "desktop" }: {
  design: LoginDesign; brand: LoginBrand; form?: LoginFormSlot | null; mode?: "page" | "preview"; device?: "desktop" | "phone";
}) {
  useDesignFont(design.font);
  const p = useMemo(() => buildPalette(brand.primary, brand.secondary), [brand.primary, brand.secondary]);
  const b = useMemo(() => ({ ...brand, shortName: brand.shortName || shortName(brand.name) }), [brand]);
  const Layout = LAYOUTS[design.layout] ?? ShowcaseLayout;
  const font = fontStack(design.font);
  const win = useWindowSize();
  const [boxRef, boxW] = useElementWidth<HTMLDivElement>();

  if (mode === "preview") {
    if (device === "phone") {
      return (
        <div style={{ width: 390, maxWidth: "100%", height: 780, overflow: "auto", borderRadius: 28, border: "8px solid #0F172A", fontFamily: font, background: p.page }}>
          <DesignStyles p={p} />
          <MobileLayout design={design} brand={b} p={p} form={null} />
        </div>
      );
    }
    const scale = boxW ? boxW / STAGE_W : 0;
    return (
      <div ref={boxRef} style={{ width: "100%", height: STAGE_H * scale, position: "relative", overflow: "hidden", fontFamily: font }}>
        <DesignStyles p={p} />
        {scale > 0 && (
          <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
            <Layout design={design} brand={b} p={p} form={null} />
          </div>
        )}
      </div>
    );
  }

  if (win.w < DESKTOP_MIN_W) {
    return (
      <div style={{ minHeight: "100dvh", fontFamily: font, background: design.layout === "showcase" ? p.page : p.deep }}>
        <DesignStyles p={p} />
        <MobileLayout design={design} brand={b} p={p} form={form} />
      </div>
    );
  }

  // Fit the stage's height to the window; on wider windows the stage grows sideways (backgrounds stretch,
  // content stays centred). On unusually tall windows, fit the width instead and centre vertically.
  const fitH = win.h / STAGE_H;
  const tall = win.w / fitH < STAGE_W;
  const scale = tall ? win.w / STAGE_W : fitH;
  const W = tall ? STAGE_W : win.w / scale;
  const edge = design.layout === "showcase" ? p.page : p.deep;
  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: edge, position: "relative", fontFamily: font }}>
      <DesignStyles p={p} />
      <div style={{
        width: W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute",
        left: 0, top: tall ? (win.h - STAGE_H * scale) / 2 : 0,
      }}>
        <Layout design={design} brand={b} p={p} form={form} W={W} />
      </div>
    </div>
  );
}

export type { LoginBrand, LoginDesign, LoginFormSlot } from "./types";
export { normaliseDesign, fallbackCopy, defaultsFor, shortName } from "./design";
