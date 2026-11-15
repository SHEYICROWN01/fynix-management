import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Activity, ArrowRight, ArrowUp, CalendarCheck, Check, CheckCheck, CheckCircle2, ChevronDown, Clock3, Crown,
  Handshake, Inbox, Mail, Maximize2, MessageCircle, MessageSquareText, PenLine, RefreshCw, Search, Send,
  ShieldCheck, TrendingUp, UserPlus, Users, X, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { initialTasks, kpiTrends, STAGES, type ActivityKind, type Lead, type LeadType } from "../mockData";
import { getAgent, relativeTime, timeInStage, useMarketing } from "../MarketingContext";
import { Robot } from "./Robot";
import { AgentIcons, StatusPill, card, focusRing, stageStyle } from "./shared";

// ── KPI cards ─────────────────────────────────────────────────────────────────

const kpiMeta: Array<{ key: keyof typeof kpiTrends; label: string; icon: LucideIcon; tint: string; color: string }> = [
  { key: "leadsFound", label: "Leads found", icon: Users, tint: "#E8F0FF", color: "#2F6BFF" },
  { key: "messagesSent", label: "Messages sent", icon: Send, tint: "#F0EBFF", color: "#7C5CFC" },
  { key: "replies", label: "Replies", icon: MessageCircle, tint: "#E6F8EC", color: "#16A34A" },
  { key: "demosBooked", label: "Demos booked", icon: CalendarCheck, tint: "#FFF3DF", color: "#E08A00" },
  { key: "clientsConverted", label: "Clients converted", icon: Handshake, tint: "#FFE8F1", color: "#EC4899" },
];

export function KpiRow() {
  const { kpis } = useMarketing();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {kpiMeta.map(({ key, label, icon: Icon, tint, color }) => (
        <div key={key} className={`${card} flex items-center gap-3.5 px-4 py-3.5`}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: tint, color }}>
            <Icon size={22} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-medium text-[#475569]">{label}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-2">
              <strong className="text-[24px] font-extrabold leading-none tracking-[-0.03em] text-[#0F1B3D] tabular-nums">{kpis[key]}</strong>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#E7F8EE] px-1.5 py-0.5 text-[10px] font-bold text-[#15803D]"><ArrowUp size={10} />{kpiTrends[key]}</span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Live activity feed ───────────────────────────────────────────────────────

const activityIcon: Record<ActivityKind, { icon: LucideIcon; tint: string; color: string }> = {
  research: { icon: Search, tint: "#E8F0FF", color: "#2F6BFF" },
  content: { icon: PenLine, tint: "#E8F0FF", color: "#3B82F6" },
  outreach: { icon: Send, tint: "#EEF2FF", color: "#4F46E5" },
  reply: { icon: RefreshCw, tint: "#FFE8F1", color: "#EC4899" },
  demo: { icon: CalendarCheck, tint: "#FFF3DF", color: "#E08A00" },
  signup: { icon: Handshake, tint: "#F3EDFF", color: "#8B5CF6" },
  onboarding: { icon: UserPlus, tint: "#E6F8EC", color: "#16A34A" },
  active: { icon: CheckCircle2, tint: "#E6F8EC", color: "#16A34A" },
  approval: { icon: ShieldCheck, tint: "#FFF3D6", color: "#D97706" },
  system: { icon: Crown, tint: "#FFF6DC", color: "#D4A017" },
};

export function ActivityFeedCard({ limit = 6, className = "" }: { limit?: number; className?: string }) {
  const { events, now } = useMarketing();
  return (
    <section className={`${card} flex flex-col p-4 ${className}`} aria-label="Live activity feed">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-[#0F1B3D]"><Activity size={19} className="text-[#2250CC]" />Live Activity Feed</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F8EE] px-2 py-0.5 text-[11px] font-bold text-[#15803D]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />Live</span>
      </div>
      <div className="flex-1 divide-y divide-[#EEF2F8]" aria-live="polite">
        <AnimatePresence initial={false}>
          {events.slice(0, limit).map((event) => {
            const meta = activityIcon[event.kind];
            const Icon = meta.icon;
            const agent = getAgent(event.agentId);
            return (
              <motion.div key={event.id} layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: meta.tint, color: meta.color }}><Icon size={16} /></span>
                <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-[#334155]"><strong className="font-bold text-[#0F1B3D]">{agent.name}</strong> {event.text.charAt(0).toLowerCase() + event.text.slice(1)}</p>
                <time className="shrink-0 pt-0.5 text-[11px] text-[#94A3B8]" dateTime={event.timestamp}>{relativeTime(event.timestamp, now)}</time>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Approval inbox (compact card) ────────────────────────────────────────────

export function ApprovalInboxCard({ className = "" }: { className?: string }) {
  const { approvals, approveDraft, rejectDraft, openDraftEditor, setApprovalOpen, now, mode } = useMarketing();
  const first = approvals[0];
  return (
    <section className={`${card} p-4 ${className}`} aria-label="Approval inbox">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-[#0F1B3D]">
          <Inbox size={19} className="text-[#2250CC]" />Approval Inbox
          {approvals.length > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-[12px] font-bold text-white">{approvals.length}</span>}
        </h2>
        <button onClick={() => setApprovalOpen(true)} className={`flex items-center gap-1 rounded-md text-[13px] font-semibold text-[#2250CC] hover:underline ${focusRing}`}>View All <ArrowRight size={14} /></button>
      </div>
      {first ? (
        <div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FF] text-[#2250CC]"><Mail size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="truncate text-[14px] font-bold text-[#0F1B3D]">{first.subject}</div>
                <span className="shrink-0 text-[11px] text-[#94A3B8]">{relativeTime(first.createdAt, now)}</span>
              </div>
              <div className="text-[12px] text-[#64748B]">{first.channel} · Drafted by {getAgent(first.agentId).name} · {first.recipient.split(" · ")[0]}</div>
            </div>
          </div>
          <p className="mt-3 line-clamp-3 rounded-xl bg-[#F4F7FC] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#334155]">"{first.message}"</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={() => approveDraft(first.id)} className={`flex items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(180deg,#34D399,#16A34A)] py-2 text-[13px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(22,163,74,0.7)] hover:brightness-105 ${focusRing}`}><Check size={15} />Approve</button>
            <button onClick={() => openDraftEditor(first.id)} className={`flex items-center justify-center gap-1.5 rounded-xl border border-[#D9E2F2] bg-[#F5F7FF] py-2 text-[13px] font-bold text-[#2250CC] hover:bg-[#EBF0FF] ${focusRing}`}><PenLine size={14} />Edit</button>
            <button onClick={() => rejectDraft(first.id)} className={`flex items-center justify-center gap-1.5 rounded-xl border border-[#FBD0D0] bg-[#FFF5F5] py-2 text-[13px] font-bold text-[#DC2626] hover:bg-[#FFECEC] ${focusRing}`}><X size={14} />Reject</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#E7F8EE] text-[#16A34A]"><CheckCheck size={22} /></span>
          <div className="text-[14px] font-bold text-[#0F1B3D]">All caught up</div>
          <p className="mt-0.5 text-[12px] text-[#64748B]">{mode === "autopilot" ? "Autopilot is on: messages go out without review." : "New drafts appear here for your approval."}</p>
        </div>
      )}
    </section>
  );
}

// ── Sales pipeline ───────────────────────────────────────────────────────────

type RangeFilter = "today" | "week" | "all";
const rangeMs: Record<RangeFilter, number> = { today: 86_400_000, week: 7 * 86_400_000, all: Infinity };

function SelectPill<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: Array<[T, string]>; label: string }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={`appearance-none rounded-xl border border-[#DCE4F2] bg-white py-2 pl-3 pr-8 text-[13px] font-medium text-[#1E293B] ${focusRing}`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-2.5 text-[#64748B]" />
    </label>
  );
}

function LeadChip({ lead }: { lead: Lead }) {
  const { now, setSelectedLeadId } = useMarketing();
  const agent = getAgent(lead.ownerId);
  return (
    <motion.button
      layout="position" layoutId={`lead-${lead.id}`}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      onClick={() => setSelectedLeadId(lead.id)}
      className={`flex w-full items-center gap-2 rounded-[12px] border border-[#EDF1F8] bg-white px-3 py-2.5 text-left shadow-[0_2px_8px_rgba(30,58,138,0.05)] hover:border-[#C7D6F5] ${focusRing}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-bold text-[#0F1B3D]">{lead.institution}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[#64748B]"><span className="truncate">{lead.type} · {lead.state}</span><span className="flex shrink-0 items-center gap-0.5"><Clock3 size={11} />{timeInStage(lead.stageEnteredAt, now)}</span></span>
      </span>
      {lead.stage === "Active"
        ? <Check size={18} className="shrink-0 text-[#16A34A]" strokeWidth={3} />
        : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: agent.accent }} title={agent.name}>{agent.name[0]}</span>}
    </motion.button>
  );
}

/** Pipeline board. `perColumn` limits cards per column (with a "+N more" link) for the compact office view. */
export function PipelineBoard({ perColumn, expandable = true }: { perColumn?: number; expandable?: boolean }) {
  const { leads, now } = useMarketing();
  const navigate = useNavigate();
  const [type, setType] = useState<"all" | LeadType>("all");
  const [range, setRange] = useState<RangeFilter>("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => leads.filter((lead) =>
    (type === "all" || lead.type === type)
    && now - new Date(lead.stageEnteredAt).getTime() <= rangeMs[range]
    && (!query || `${lead.institution} ${lead.city} ${lead.state}`.toLowerCase().includes(query.toLowerCase()))), [leads, type, range, query, now]);
  return (
    <section className={`${card} p-4 sm:p-5`} aria-labelledby="pipeline-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FF] text-[#2250CC]"><Handshake size={20} /></span>
          <div>
            <h2 id="pipeline-title" className="text-[18px] font-extrabold text-[#0F1B3D]">Sales Pipeline</h2>
            <p className="text-[13px] text-[#64748B]">{filtered.length} institutions across your sales journey</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!perColumn && (
            <label className="relative">
              <span className="sr-only">Search institutions</span>
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search institution or state" className={`w-56 rounded-xl border border-[#DCE4F2] bg-white py-2 pl-8 pr-3 text-[13px] ${focusRing}`} />
            </label>
          )}
          <SelectPill label="Institution type" value={type} onChange={setType} options={[["all", "All Institution Types"], ["MFB", "Microfinance Banks"], ["Cooperative", "Cooperatives"], ["Lender", "Lenders"]]} />
          <SelectPill label="Time range" value={range} onChange={setRange} options={[["all", "All time"], ["week", "This Week"], ["today", "Today"]]} />
          {expandable && perColumn && (
            <button onClick={() => navigate("/marketing/leads")} className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE4F2] bg-white text-[#475569] hover:text-[#2250CC] ${focusRing}`} aria-label="Open full pipeline"><Maximize2 size={16} /></button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto pb-1">
        <LayoutGroup id="pipeline">
          <div className="grid min-w-[1180px] grid-cols-7 gap-3">
            {STAGES.map((stage) => {
              const style = stageStyle[stage];
              const Icon = style.icon;
              const stageLeads = filtered.filter((lead) => lead.stage === stage);
              const shown = perColumn ? stageLeads.slice(0, perColumn) : stageLeads;
              const hidden = stageLeads.length - shown.length;
              return (
                <div key={stage} className="flex flex-col rounded-[16px] border border-[#EDF1F8] p-2" style={{ background: `${style.tint}80` }}>
                  <div className="mb-2 flex items-center justify-between rounded-[12px] px-2 py-2" style={{ background: style.tint }}>
                    <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#0F1B3D]"><Icon size={16} style={{ color: style.color }} />{stage}</span>
                    <span className="text-[13px] font-bold" style={{ color: style.color }}>{stageLeads.length}</span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence initial={false} mode="popLayout">{shown.map((lead) => <LeadChip key={lead.id} lead={lead} />)}</AnimatePresence>
                  </div>
                  {stageLeads.length === 0 && <div className="grid h-16 place-items-center text-[11px] text-[#94A3B8]">No leads</div>}
                  {hidden > 0 && <button onClick={() => navigate("/marketing/leads")} className={`mt-2 self-start rounded px-1 text-[12px] font-bold text-[#2250CC] hover:underline ${focusRing}`}>+ {hidden} more</button>}
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </section>
  );
}

// ── Drawers (opened from any marketing page) ────────────────────────────────

export function AgentSheet() {
  const { selectedAgentId, setSelectedAgentId, agentState, leads, events, approvals, now } = useMarketing();
  const agent = selectedAgentId ? getAgent(selectedAgentId) : null;
  const assigned = agent ? leads.filter((lead) => lead.ownerId === agent.id) : [];
  const tasks = agent ? initialTasks.filter((task) => task.agentId === agent.id) : [];
  const recent = agent ? events.filter((event) => event.agentId === agent.id).slice(0, 5) : [];
  const drafts = agent ? approvals.filter((draft) => draft.agentId === agent.id) : [];
  const state = agent ? agentState(agent) : null;
  const Icon = agent ? AgentIcons[agent.id] : Users;
  return (
    <Sheet open={Boolean(agent)} onOpenChange={(open) => !open && setSelectedAgentId(null)}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[#F8FAFF] sm:max-w-[440px]">
        {agent && state && <>
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <Robot accent={agent.accent} status={state.status} crown={agent.id === "manager"} size={72} />
              <div>
                <SheetTitle className="flex items-center gap-2 text-[20px] font-extrabold text-[#0F1B3D]"><Icon size={18} style={{ color: agent.accent }} />{agent.name}</SheetTitle>
                <SheetDescription>{agent.role} · AI team member</SheetDescription>
                <div className="mt-1"><StatusPill status={state.status} /></div>
              </div>
            </div>
          </SheetHeader>
          <div className="mt-5 rounded-2xl border border-[#DCE6FA] bg-white p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Current assignment</div>
            <div className="mt-1 text-[14px] font-semibold text-[#0F1B3D]">{state.task}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-[#64748B]">{agent.description}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[["Completed", agent.tasksCompleted], ["Quality", `${agent.accuracy}%`], ["Assigned", assigned.length]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-[#E3EAF6] bg-white p-3"><div className="text-[20px] font-extrabold text-[#0F1B3D]">{v}</div><div className="text-[11px] text-[#64748B]">{l}</div></div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-[#E3EAF6] bg-white p-4">
            <div className="flex items-center justify-between"><h3 className="text-[13px] font-bold text-[#0F1B3D]">7-day activity</h3><span className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A]"><TrendingUp size={12} />Trending up</span></div>
            <div className="mt-3 flex h-24 items-end gap-1.5">
              {agent.trend.map((v, i) => <motion.span key={i} initial={{ height: 4 }} animate={{ height: `${(v / Math.max(...agent.trend)) * 100}%` }} transition={{ delay: i * 0.04 }} className="flex-1 rounded-t-md" style={{ background: agent.accent, opacity: i === agent.trend.length - 1 ? 1 : 0.55 }} />)}
            </div>
          </div>
          <h3 className="mb-2 mt-5 text-[13px] font-bold text-[#0F1B3D]">Task queue</h3>
          <div className="space-y-2">
            {[...assigned.slice(0, 4).map((lead) => ({ id: lead.id, title: `Work on ${lead.institution}`, status: "queued" })), ...tasks].map((task) => (
              <div key={task.id} className="flex items-start gap-2 rounded-xl border border-[#E3EAF6] bg-white p-3 text-[12.5px]"><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: task.status === "waiting-approval" ? "#F59E0B" : agent.accent }} /><span className="flex-1 text-[#1E293B]">{task.title}</span><span className="text-[11px] capitalize text-[#94A3B8]">{task.status.replace("-", " ")}</span></div>
            ))}
          </div>
          <h3 className="mb-2 mt-5 text-[13px] font-bold text-[#0F1B3D]">Recent actions</h3>
          {recent.length ? recent.map((event) => <div key={event.id} className="flex justify-between gap-3 border-b border-[#E8EDF5] py-2 text-[12.5px]"><span className="text-[#334155]">{event.text}</span><span className="shrink-0 text-[11px] text-[#94A3B8]">{relativeTime(event.timestamp, now)}</span></div>) : <p className="text-[12px] text-[#64748B]">No recent actions.</p>}
          {drafts.length > 0 && <>
            <h3 className="mb-2 mt-5 text-[13px] font-bold text-[#0F1B3D]">Drafts waiting for you</h3>
            {drafts.map((draft) => <div key={draft.id} className="mb-2 rounded-xl border border-[#F5D38B] bg-[#FFFAEB] p-3"><div className="text-[11px] font-bold text-[#B45309]">{draft.channel} · Pending approval</div><div className="mt-1 text-[13px] font-semibold text-[#0F1B3D]">{draft.subject}</div><p className="mt-1 line-clamp-3 text-[12px] text-[#57534E]">{draft.message}</p></div>)}
          </>}
        </>}
      </SheetContent>
    </Sheet>
  );
}

export function ApprovalSheet() {
  const { approvalOpen, setApprovalOpen, approvals, editingId, setEditingId, approveDraft, rejectDraft, saveDraft } = useMarketing();
  const [text, setText] = useState("");
  useEffect(() => { const draft = approvals.find((a) => a.id === editingId); if (draft) setText(draft.message); }, [editingId, approvals]);
  return (
    <Sheet open={approvalOpen} onOpenChange={setApprovalOpen}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[#F8FAFF] sm:max-w-[500px]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-[20px] font-extrabold text-[#0F1B3D]"><ShieldCheck className="text-[#D97706]" />Approval inbox</SheetTitle>
          <SheetDescription>Messages the AI team has drafted. Nothing goes out until you approve it.</SheetDescription>
        </SheetHeader>
        {approvals.length === 0 && <div className="mt-8 flex flex-col items-center text-center"><span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F8EE] text-[#16A34A]"><CheckCheck /></span><div className="font-bold text-[#0F1B3D]">All caught up</div></div>}
        <div className="mt-5 space-y-3">
          {approvals.map((draft) => (
            <div key={draft.id} className="overflow-hidden rounded-2xl border border-[#E3EAF6] bg-white">
              <div className="flex items-start justify-between gap-2 border-b border-[#EEF2F8] px-4 py-3">
                <div><div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2250CC]">{draft.channel === "WhatsApp" ? <MessageSquareText size={12} /> : <Mail size={12} />}{draft.channel} · {getAgent(draft.agentId).name}</div><div className="mt-0.5 text-[13px] font-bold text-[#0F1B3D]">{draft.recipient}</div></div>
                <span className="shrink-0 rounded-full bg-[#FFF3D6] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">Awaiting review</span>
              </div>
              <div className="px-4 py-3">
                <div className="text-[12.5px] font-bold text-[#0F1B3D]">{draft.subject}</div>
                {editingId === draft.id ? (
                  <div className="mt-2">
                    <label htmlFor={`edit-${draft.id}`} className="sr-only">Edit message</label>
                    <Textarea id={`edit-${draft.id}`} value={text} onChange={(e) => setText(e.target.value)} className="min-h-[120px] text-[13px]" />
                    <div className="mt-2 flex gap-2"><Button size="sm" className="bg-[#2250CC] hover:bg-[#3B6FE8]" onClick={() => { saveDraft(draft.id, text); setEditingId(null); }}>Save draft</Button><Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button></div>
                  </div>
                ) : <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-[#475569]">{draft.message}</p>}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-[#EEF2F8] px-4 py-3">
                <Button size="sm" onClick={() => approveDraft(draft.id)} className="bg-[#16A34A] hover:bg-[#15803D]"><Check size={14} className="mr-1" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(draft.id)}><PenLine size={13} className="mr-1" />Edit</Button>
                <Button size="sm" variant="outline" onClick={() => rejectDraft(draft.id)} className="border-[#FBD0D0] text-[#DC2626] hover:bg-[#FFF5F5] hover:text-[#DC2626]"><X size={13} className="mr-1" />Reject</Button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-[#94A3B8]">Demo mode: approving only moves the simulated pipeline. Nothing is sent.</p>
      </SheetContent>
    </Sheet>
  );
}

export function LeadSheet() {
  const { selectedLeadId, setSelectedLeadId, leads, now } = useMarketing();
  const lead = leads.find((item) => item.id === selectedLeadId) ?? null;
  const agent = lead ? getAgent(lead.ownerId) : null;
  const style = lead ? stageStyle[lead.stage] : null;
  return (
    <Sheet open={Boolean(lead)} onOpenChange={(open) => !open && setSelectedLeadId(null)}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[#F8FAFF] sm:max-w-[420px]">
        {lead && agent && style && <>
          <SheetHeader className="text-left">
            <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#2250CC]"><Search size={20} /></span>
            <SheetTitle className="text-[21px] font-extrabold text-[#0F1B3D]">{lead.institution}</SheetTitle>
            <SheetDescription>{lead.city}, {lead.state} · {lead.type}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex gap-2">
            <span className="rounded-lg px-2.5 py-1 text-[12px] font-bold" style={{ background: style.tint, color: style.color }}>{lead.stage}</span>
            <span className="rounded-lg bg-[#EEF2F8] px-2.5 py-1 text-[12px] font-bold text-[#475569]">{lead.priority} priority</span>
          </div>
          <dl className="mt-4 space-y-3 rounded-2xl border border-[#E3EAF6] bg-white p-4">
            {[["Primary contact", lead.contact], ["Email", lead.email], ["Time in current stage", timeInStage(lead.stageEnteredAt, now)], ["Assigned agent", agent.name]].map(([k, v]) => (
              <div key={k}><dt className="text-[11px] text-[#64748B]">{k}</dt><dd className="text-[13.5px] font-semibold text-[#0F1B3D]">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 rounded-xl bg-[#EAF2FF] p-3 text-[12px] text-[#2250CC]">This is a fictional demo institution. No real organisation is contacted.</p>
        </>}
      </SheetContent>
    </Sheet>
  );
}
