import {
  CalendarDays, CheckCircle2, FileText, Handshake, Layers, MessageCircle, RefreshCw, Search, Send, Users,
  type LucideIcon,
} from "lucide-react";
import type { AgentId, AgentStatus, PipelineStage } from "../mockData";

export const AgentIcons: Record<AgentId, LucideIcon> = {
  researcher: Search,
  writer: FileText,
  sales: Send,
  followup: RefreshCw,
  secretary: CalendarDays,
  onboarding: Layers,
  manager: Users,
};

export const stageStyle: Record<PipelineStage, { icon: LucideIcon; tint: string; color: string }> = {
  Found: { icon: Search, tint: "#EAF1FF", color: "#2F6BFF" },
  Contacted: { icon: Send, tint: "#F1ECFF", color: "#7C5CFC" },
  Replied: { icon: MessageCircle, tint: "#E8F8EE", color: "#16A34A" },
  "Demo Booked": { icon: CalendarDays, tint: "#FFF4E0", color: "#E08A00" },
  "Signed Up": { icon: Handshake, tint: "#F3EDFF", color: "#8B5CF6" },
  Onboarding: { icon: Layers, tint: "#E8F0FF", color: "#2250CC" },
  Active: { icon: CheckCircle2, tint: "#E6F8EC", color: "#16A34A" },
};

export function StatusPill({ status }: { status: AgentStatus }) {
  const styles: Record<AgentStatus, { label: string; cls: string; dot: string }> = {
    working: { label: "Working", cls: "bg-[#E7F8EE] text-[#15803D]", dot: "bg-[#22C55E]" },
    idle: { label: "Idle", cls: "bg-[#EEF1F6] text-[#64748B]", dot: "bg-[#94A3B8]" },
    approval: { label: "Waiting for approval", cls: "bg-[#FFF3D6] text-[#B45309]", dot: "bg-[#F59E0B]" },
    done: { label: "Done", cls: "bg-[#E7F8EE] text-[#15803D]", dot: "bg-[#22C55E]" },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] text-[10px] font-semibold ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === "working" ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
}

export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6FE8] focus-visible:ring-offset-2";
export const card = "rounded-[20px] border border-[#E6ECF7] bg-white shadow-[0_10px_30px_-18px_rgba(30,58,138,0.25)]";
