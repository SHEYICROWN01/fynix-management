import { motion, useReducedMotion } from "framer-motion";
import type { AgentStatus } from "../mockData";

const eyeColor: Record<AgentStatus, string> = {
  working: "#5EEBFF",
  idle: "#9DB3D9",
  approval: "#FFC24D",
  done: "#5CF29A",
};

/**
 * Friendly robot agent seated behind a laptop. Drawn in SVG so it can react to status:
 * eye colour follows the agent's status, it bobs gently while working and blinks.
 */
export function Robot({ accent, status, crown = false, size = 96, delay = 0 }: {
  accent: string; status: AgentStatus; crown?: boolean; size?: number; delay?: number;
}) {
  const reduce = useReducedMotion();
  const eye = eyeColor[status];
  const gid = `rb-${accent.replace("#", "")}`;
  const bob = !reduce && status === "working";
  return (
    <motion.div
      style={{ width: size, height: size * 1.08 }}
      animate={bob ? { y: [0, -3, 0] } : { y: 0 }}
      transition={bob ? { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay } : { duration: 0.3 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 130" width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id={`${gid}-shell`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#DCE5F7" />
          </linearGradient>
          <linearGradient id={`${gid}-visor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1C2B55" />
            <stop offset="1" stopColor="#0A1430" />
          </linearGradient>
          <linearGradient id={`${gid}-laptop`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5B8BFF" />
            <stop offset="1" stopColor="#2250CC" />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* soft shadow */}
        <ellipse cx="60" cy="126" rx="40" ry="4" fill="#1B2D66" opacity="0.12" />

        {/* body */}
        <rect x="30" y="70" width="60" height="44" rx="20" fill={`url(#${gid}-shell)`} stroke="#C9D6EE" strokeWidth="1" />
        <rect x="52" y="76" width="16" height="5" rx="2.5" fill={accent} opacity="0.85" />

        {/* headphones band */}
        <path d="M18 44 Q60 -4 102 44" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" />

        {/* head */}
        <rect x="20" y="10" width="80" height="62" rx="28" fill={`url(#${gid}-shell)`} stroke="#C9D6EE" strokeWidth="1" />
        <rect x="29" y="22" width="62" height="38" rx="18" fill={`url(#${gid}-visor)`} />
        <ellipse cx="45" cy="28" rx="10" ry="3" fill="#FFFFFF" opacity="0.12" />

        {/* eyes + smile */}
        <motion.g
          filter={`url(#${gid}-glow)`}
          style={{ originY: "40px" }}
          animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1] }}
          transition={reduce ? undefined : { duration: 4.5, times: [0, 0.9, 0.95, 1], repeat: Infinity, delay: delay * 1.7 }}
        >
          <path d="M40 41 Q46 33 52 41" stroke={eye} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M68 41 Q74 33 80 41" stroke={eye} strokeWidth="4" fill="none" strokeLinecap="round" />
        </motion.g>
        <path d="M54 49 Q60 54 66 49" stroke={eye} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />

        {/* ear cups */}
        <rect x="11" y="32" width="14" height="26" rx="7" fill={accent} />
        <rect x="95" y="32" width="14" height="26" rx="7" fill={accent} />

        {crown && (
          <g transform="translate(40 -14)">
            <path d="M0 18 L4 2 L13 11 L20 0 L27 11 L36 2 L40 18 Z" fill="#FFC53D" stroke="#E9A21B" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="20" cy="4" r="2.5" fill="#FF6B6B" />
          </g>
        )}

        {/* laptop (back of screen faces the viewer) */}
        <path d="M24 92 H96 L100 124 H20 Z" fill={`url(#${gid}-laptop)`} />
        <path d="M24 92 H96 L97 98 H23 Z" fill="#FFFFFF" opacity="0.18" />
        <path d="M55 101 h12 v3.5 h-8 v3 h6 v3.5 h-6 v6 h-4 z" fill="#FFFFFF" />
      </svg>
    </motion.div>
  );
}
