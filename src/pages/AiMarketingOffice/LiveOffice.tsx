import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import officeEmpty from "./assets/level2/office-empty.webp";
import { agents, type AgentId, type AgentStatus } from "./mockData";

/**
 * Level 2 "live office": robots are separate sprites over an empty office, so they can
 * turn to face each other, stand up and walk around the table.
 *
 * Sprites are picked up automatically from ./assets/level2/robots/<agent>-<pose>.webp
 * (e.g. manager-seated-front.webp). A robot without artwork simply isn't drawn yet.
 */

export type Pose = "seated-front" | "seated-left" | "seated-right" | "seated-back" | "stand" | "walk-1" | "walk-2";
type Pt = { x: number; y: number };

const spriteFiles = import.meta.glob("./assets/level2/robots/*.webp", { eager: true, import: "default" }) as Record<string, string>;
const sprites: Partial<Record<AgentId, Partial<Record<Pose, string>>>> = {};
for (const [path, url] of Object.entries(spriteFiles)) {
  const match = path.match(/\/([a-z]+)-([a-z0-9-]+)\.webp$/);
  if (!match) continue;
  const id = match[1] as AgentId;
  (sprites[id] ??= {})[match[2] as Pose] = url;
}
/** The robot has at least its main seated pose, so it can be shown. */
export const hasSprites = (id: AgentId) => Boolean(sprites[id]?.["seated-front"]);
/** The robot can stand up and walk. */
export const canWalk = (id: AgentId) => Boolean(sprites[id]?.stand && sprites[id]?.["walk-1"] && sprites[id]?.["walk-2"]);
export const liveReadyCount = () => agents.filter((a) => hasSprites(a.id)).length;

// ── Room geometry, in pixels of the 1786 × 880 office image ──────────────────
const W = 1786;
const H = 880;
/**
 * Walking ring around the table. It hugs the table at the back (between the back chairs),
 * swings wide at the sides (around the side chairs) and runs along the floor in front.
 */
const RING = { cx: 928, cy: 548, rxBack: 650, rxSide: 790, ryBack: 228, ryFront: 290 };
type SeatView = "front" | "left" | "right" | "back";
/** Where each robot sits (bottom-centre of the sprite), its angle on the ring, and which way the chair faces. */
const seats: Record<AgentId, { x: number; y: number; angle: number; view: SeatView }> = {
  manager:    { x: 940,  y: 346, angle: -90,  view: "front" },
  researcher: { x: 455,  y: 382, angle: -134, view: "front" },
  writer:     { x: 1405, y: 382, angle: -46,  view: "front" },
  onboarding: { x: 262,  y: 562, angle: 180,  view: "right" },
  sales:      { x: 1600, y: 562, angle: 0,    view: "left" },
  secretary:  { x: 505,  y: 740, angle: 128,  view: "back" },
  followup:   { x: 1355, y: 740, angle: 52,   view: "back" },
};
const DISC = { x: 937, y: 517 };
/** Standing robot height grows as it comes toward the camera (perspective). */
const standHeight = (y: number) => 210 + (y - 342) * 0.318;
const SEATED_RATIO = 0.74;
const WALK_SPEED = 190; // image px per second
function ringPoint(deg: number): Pt {
  const rad = (deg * Math.PI) / 180;
  const sin = Math.sin(rad);
  const rx = RING.rxBack + (RING.rxSide - RING.rxBack) * (1 - Math.abs(sin));
  return { x: RING.cx + rx * Math.cos(rad), y: RING.cy + (sin < 0 ? RING.ryBack : RING.ryFront) * sin };
}
const shortestDelta = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;
function ringPath(from: number, to: number): Pt[] {
  const d = shortestDelta(from, to);
  const steps = Math.max(2, Math.ceil(Math.abs(d) / 4));
  return Array.from({ length: steps + 1 }, (_, i) => ringPoint(from + (d * i) / steps));
}
/** Where a visitor stops: beside the host's seat, on the side the visitor came from. */
const visitAngle = (visitor: AgentId, host: AgentId) => seats[host].angle + (shortestDelta(seats[host].angle, seats[visitor].angle) >= 0 ? 18 : -18);

// ── Robot motion (requestAnimationFrame loop while anyone is walking) ─────────
interface Bot { mode: "seated" | "standing" | "walking"; x: number; y: number; facing: "left" | "right" | "front"; path?: Pt[]; onDone?: () => void }

function useBots(paused: boolean) {
  const bots = useRef<Record<AgentId, Bot>>(
    Object.fromEntries(agents.map((a) => [a.id, { mode: "seated", x: seats[a.id].x, y: seats[a.id].y, facing: "front" }])) as Record<AgentId, Bot>,
  );
  const [, setFrame] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const tick = useCallback((t: number) => {
    const dt = last.current ? Math.min(0.05, (t - last.current) / 1000) : 0;
    last.current = t;
    const done: Array<() => void> = [];
    for (const b of Object.values(bots.current)) {
      if (b.mode !== "walking" || !b.path || pausedRef.current) continue;
      let budget = WALK_SPEED * dt;
      while (budget > 0 && b.path.length) {
        const target = b.path[0];
        const dx = target.x - b.x, dy = target.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (Math.abs(dx) > 0.4) b.facing = dx < 0 ? "left" : "right";
        if (dist <= budget) { b.x = target.x; b.y = target.y; budget -= dist; b.path.shift(); }
        else { b.x += (dx / dist) * budget; b.y += (dy / dist) * budget; budget = 0; }
      }
      if (!b.path.length) {
        b.mode = "standing"; b.facing = "front"; b.path = undefined;
        if (b.onDone) { done.push(b.onDone); b.onDone = undefined; }
      }
    }
    setFrame((f) => f + 1);
    done.forEach((cb) => cb());
    const walking = Object.values(bots.current).some((b) => b.mode === "walking");
    raf.current = walking ? requestAnimationFrame(tick) : null;
    if (!walking) last.current = 0;
  }, []);

  const kick = useCallback(() => {
    if (raf.current == null) { last.current = 0; raf.current = requestAnimationFrame(tick); }
  }, [tick]);
  useEffect(() => () => { if (raf.current != null) cancelAnimationFrame(raf.current); }, []);

  const walk = useCallback((id: AgentId, path: Pt[], onDone?: () => void) => {
    const b = bots.current[id];
    b.mode = "walking"; b.path = [...path]; b.onDone = onDone;
    kick();
  }, [kick]);
  const stand = useCallback((id: AgentId) => { bots.current[id].mode = "standing"; bots.current[id].facing = "front"; setFrame((f) => f + 1); }, []);
  const sit = useCallback((id: AgentId) => {
    const b = bots.current[id];
    Object.assign(b, { mode: "seated", x: seats[id].x, y: seats[id].y, facing: "front", path: undefined, onDone: undefined });
    setFrame((f) => f + 1);
  }, []);
  return { bots: bots.current, walk, stand, sit };
}

// ── Component ────────────────────────────────────────────────────────────────

/** Minimal shape of the conversation engine's state that the live office reacts to. */
export interface LiveTalk {
  conv: { id: string; kind: string; lines: Array<{ speaker: AgentId | "you"; to?: AgentId | "you" }>; visit?: { visitor: AgentId; host: AgentId } };
  index: number;
  phase: "arriving" | "typing" | "speaking" | "leaving";
}
export type HeadMap = Record<AgentId, Pt>;

const statusStyle: Record<AgentStatus, { label: string; dot: string; text: string }> = {
  working: { label: "Working", dot: "bg-[#22C55E]", text: "text-[#15803D]" },
  idle: { label: "Idle", dot: "bg-[#94A3B8]", text: "text-[#64748B]" },
  approval: { label: "Needs approval", dot: "bg-[#F59E0B]", text: "text-[#B45309]" },
  done: { label: "Done", dot: "bg-[#22C55E]", text: "text-[#15803D]" },
};

export function LiveOffice({ talk, statusOf, onAgent, onArrived, onReturned, paused, activeCount, demos, calledIds, renderOverlays }: {
  talk: LiveTalk | null;
  statusOf: (id: AgentId) => { status: AgentStatus; task: string };
  onAgent: (id: AgentId) => void;
  onArrived: (convId: string) => void;
  onReturned: (convId: string) => void;
  paused: boolean;
  activeCount: number;
  demos: number;
  calledIds: Set<AgentId>;
  /** Caption, beams, hands and flying task cards, positioned on the robots' current heads (in %). */
  renderOverlays: (heads: HeadMap) => ReactNode;
}) {
  const { bots, walk, stand, sit } = useBots(paused);
  const [glance, setGlance] = useState<Partial<Record<AgentId, Pose>>>({});
  const visit = useRef<{ convId: string; walker: AgentId; host: AgentId; stage: "going" | "there" | "returning" } | null>(null);
  const line = talk && (talk.phase === "typing" || talk.phase === "speaking") ? talk.conv.lines[talk.index] : null;

  // Visits: walk over before the conversation, walk back after it.
  useEffect(() => {
    if (!talk?.conv.visit) return;
    const { visitor, host } = talk.conv.visit;
    if (talk.phase === "arriving" && visit.current?.convId !== talk.conv.id) {
      visit.current = { convId: talk.conv.id, walker: visitor, host, stage: "going" };
      const from = seats[visitor].angle;
      const to = visitAngle(visitor, host);
      const convId = talk.conv.id;
      stand(visitor);
      window.setTimeout(() => {
        walk(visitor, [ringPoint(from), ...ringPath(from, to).slice(1)], () => {
          if (visit.current?.convId === convId) visit.current.stage = "there";
          onArrived(convId);
        });
      }, 450);
    }
    if (talk.phase === "leaving" && visit.current?.convId === talk.conv.id && visit.current.stage !== "returning") {
      visit.current.stage = "returning";
      const { walker } = visit.current;
      const from = visitAngle(walker, host);
      const convId = talk.conv.id;
      walk(walker, [...ringPath(from, seats[walker].angle).slice(1), { x: seats[walker].x, y: seats[walker].y }], () => {
        sit(walker);
        visit.current = null;
        onReturned(convId);
      });
    }
  }, [talk?.conv.id, talk?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Anyone left standing (e.g. after a reset or a timed-out visit) walks back to their seat.
  useEffect(() => {
    if (talk?.conv.visit) return;
    for (const a of agents) {
      const b = bots[a.id];
      if (b.mode === "standing" && !(b.x === seats[a.id].x && b.y === seats[a.id].y)) {
        const here = Math.atan2((b.y - RING.cy) / (b.y < RING.cy ? RING.ryBack : RING.ryFront), (b.x - RING.cx) / RING.rxSide) * (180 / Math.PI);
        walk(a.id, [...ringPath(here, seats[a.id].angle).slice(1), { x: seats[a.id].x, y: seats[a.id].y }], () => sit(a.id));
        visit.current = null;
      } else if (b.mode === "standing") sit(a.id);
    }
  }, [talk?.conv.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Idle life: now and then a seated robot glances around.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const idle = agents.filter((a) => hasSprites(a.id) && bots[a.id].mode === "seated");
      if (!idle.length) return;
      const a = idle[Math.floor(Math.random() * idle.length)];
      const pose: Pose = Math.random() < 0.5 ? "seated-left" : "seated-right";
      setGlance((g) => ({ ...g, [a.id]: pose }));
      window.setTimeout(() => setGlance((g) => { const next = { ...g }; delete next[a.id]; return next; }), 1600);
    }, 5200);
    return () => window.clearInterval(id);
  }, [paused, bots]);

  const inLine = (id: AgentId) => !!line && (line.speaker === id || line.to === id);
  /** Seated robots turn toward whoever they're talking to; in a stand-up everyone faces the Manager. */
  function seatedPose(id: AgentId): Pose {
    let other: AgentId | undefined;
    if (line) {
      if (line.speaker === id && line.to && line.to !== "you") other = line.to;
      else if (line.to === id && line.speaker !== "you") other = line.speaker;
    }
    if (!other && talk?.conv.kind === "standup" && talk.phase !== "arriving" && id !== "manager") other = "manager";
    if (other) return bots[other].x < bots[id].x ? "seated-left" : "seated-right";
    if (glance[id]) return glance[id]!;
    const view = seats[id].view;
    return view === "left" ? "seated-left" : view === "right" ? "seated-right" : view === "back" ? "seated-back" : "seated-front";
  }

  const now = performance.now();
  // Head positions follow the robots (recomputed every render, i.e. every frame while someone walks).
  const heads = Object.fromEntries(agents.map((a) => {
    const b = bots[a.id];
    const seated = b.mode === "seated";
    const h = standHeight(b.y) * (seated ? SEATED_RATIO : 1);
    return [a.id, { x: (b.x / W) * 100, y: ((b.y - h * (seated ? 0.7 : 0.8)) / H) * 100 }];
  })) as HeadMap;

  const ready = liveReadyCount();
  const order = [...agents].sort((a, b) => bots[a.id].y - bots[b.id].y);

  return (
    <div className="relative w-full overflow-hidden" style={{ containerType: "inline-size", aspectRatio: `${W} / ${H}`, backgroundImage: `url(${officeEmpty})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      {/* Live numbers on the glowing table disc */}
      <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center text-white [text-shadow:0_0.2cqw_1.2cqw_rgba(10,30,120,.8)]" style={{ left: `${(DISC.x / W) * 100}%`, top: `${(DISC.y / H) * 100}%` }}>
        <div className="text-[2.2cqw] font-black leading-none tracking-tight">{activeCount} Active Leads</div>
        <div className="mt-[0.5cqw] text-[1.15cqw] font-bold text-[#D9EAFF]">• {demos} Demos This Week</div>
      </div>

      {/* Robots, drawn back to front so nearer robots overlap farther ones */}
      {order.map((a) => {
        const set = sprites[a.id];
        if (!set || !hasSprites(a.id)) return null;
        const b = bots[a.id];
        let pose: Pose; let mirror = false;
        if (b.mode === "walking") { pose = Math.floor(now / 210) % 2 ? "walk-2" : "walk-1"; mirror = b.facing === "right"; }
        else if (b.mode === "standing") pose = "stand";
        else pose = seatedPose(a.id);
        const src = set[pose] ?? set["seated-front"]!;
        const h = standHeight(b.y) * (b.mode === "seated" ? SEATED_RATIO : 1);
        const bob = b.mode === "walking" ? -Math.abs(Math.sin(now / 210 * Math.PI)) * 0.35 : 0;
        const talking = inLine(a.id);
        return (
          <button key={a.id} onClick={() => onAgent(a.id)} aria-label={`Open ${a.name}'s desk`}
            className="absolute -translate-x-1/2 -translate-y-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3B6FE8]"
            style={{ left: `${(b.x / W) * 100}%`, top: `${(b.y / H) * 100}%`, height: `${(h / H) * 100}%`, zIndex: 20 + Math.round(b.y / 10) }}>
            {/* soft floor shadow */}
            <span className="pointer-events-none absolute bottom-[-2%] left-1/2 h-[9%] w-[70%] -translate-x-1/2 rounded-[50%] bg-[#0B1A55]/30 blur-[0.4cqw]" aria-hidden="true" />
            <img src={src} alt="" draggable={false} className="relative h-full w-auto max-w-none select-none"
              style={{ transform: `translateY(${bob}cqw) ${mirror ? "scaleX(-1)" : ""}`, filter: talking ? `drop-shadow(0 0 1cqw ${a.accent})` : "drop-shadow(0 0.4cqw 0.6cqw rgba(10,25,80,.25))", transition: "filter .3s ease" }} />
          </button>
        );
      })}

      {/* Name tags under each robot (or seat) */}
      {agents.map((a) => {
        const b = bots[a.id];
        const st = statusStyle[statusOf(a.id).status];
        const away = b.mode !== "seated";
        const talking = inLine(a.id);
        return (
          <button key={`tag-${a.id}`} onClick={() => onAgent(a.id)}
            className="absolute z-[150] flex -translate-x-1/2 translate-y-[0.4cqw] items-center gap-[0.4cqw] whitespace-nowrap rounded-full border bg-white/95 px-[0.7cqw] py-[0.25cqw] text-[clamp(8px,0.85cqw,12px)] font-extrabold text-[#172447] shadow-[0_0.3cqw_1cqw_rgba(20,40,110,.25)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#3B6FE8]"
            style={{ left: `${(b.x / W) * 100}%`, top: `${(b.y / H) * 100}%`, borderColor: talking ? a.accent : "#FFFFFF", boxShadow: talking ? `0 0 0 0.15cqw ${a.accent}, 0 0 1.4cqw ${a.accent}AA` : undefined }}
            aria-label={`${a.name}, ${st.label}. Open desk`}>
            <span className="h-[0.6cqw] w-[0.6cqw] shrink-0 rounded-full" style={{ background: a.accent }} />
            {a.name}
            <span className={`flex items-center gap-[0.25cqw] font-bold ${st.text}`}><span className={`h-[0.45cqw] w-[0.45cqw] rounded-full ${st.dot}`} />{away ? (b.mode === "walking" ? "Walking" : "Visiting") : st.label}</span>
            {calledIds.has(a.id) && <span aria-hidden="true">📞</span>}
          </button>
        );
      })}

      {/* Shared overlays (caption, beams, hands, flying cards) */}
      <div className="pointer-events-none absolute inset-0 z-[200]">{renderOverlays(heads)}</div>

      {ready < agents.length && (
        <div className="pointer-events-none absolute right-[1.2cqw] top-[1.2cqw] z-[210] rounded-full bg-white/90 px-[0.9cqw] py-[0.35cqw] text-[clamp(8px,0.85cqw,12px)] font-bold text-[#4A54E7] shadow">
          Preview · {ready} of {agents.length} robots ready. The rest arrive with the Round 2 artwork.
        </div>
      )}
    </div>
  );
}
