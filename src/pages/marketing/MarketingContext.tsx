import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  agentForStage, agents, destinationAgentFor, initialApprovals, initialEvents, initialLeads,
  nextStageOf, startingKpis,
  type ActivityEvent, type ActivityKind, type Agent, type AgentId, type AgentStatus,
  type ApprovalDraft, type Lead, type PipelineStage,
} from "./mockData";

/**
 * Client-side simulation of the AI marketing team.
 * Nothing here sends messages or contacts anyone. Phase 1 replaces this provider's
 * internals with API calls + live events, keeping the same context shape.
 */

export type OfficeMode = "approval" | "autopilot";
export type Kpis = typeof startingKpis;
export interface Handoff {
  id: string;
  leadId?: string;
  label: string;
  from: AgentId;
  to: AgentId;
  nextStage: PipelineStage | null;
  startedAt: number;
}
export interface AgentPulse { status: AgentStatus; task: string; until: number }

/** How long a task card takes to travel between two agents. */
export const FLIGHT_MS = 2600;

export const getAgent = (id: AgentId): Agent => agents.find((agent) => agent.id === id)!;
const nowIso = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

const stageMessages: Record<PipelineStage, (name: string) => string> = {
  Found: (name) => `Researched ${name}`,
  Contacted: (name) => `Sent first outreach to ${name}`,
  Replied: (name) => `Received an interested reply from ${name}`,
  "Demo Booked": (name) => `Booked a product demo with ${name}`,
  "Signed Up": (name) => `${name} agreed to start with FynixCoBanking`,
  Onboarding: (name) => `Started onboarding for ${name}`,
  Active: (name) => `${name} completed activation`,
};
const activityKindForStage = (stage: PipelineStage): ActivityKind => ({
  Found: "research", Contacted: "outreach", Replied: "reply", "Demo Booked": "demo",
  "Signed Up": "signup", Onboarding: "onboarding", Active: "active",
} as const)[stage];

const replacementInstitutions: Array<[string, Lead["type"], string, string, string]> = [
  ["Orchardline Community MFB", "MFB", "Ibadan", "Oyo", "Bola Ajayi"],
  ["Keystonevale Farmers Cooperative", "Cooperative", "Sokoto", "Sokoto", "Aisha Mohammed"],
  ["Prairiebridge Credit Services", "Lender", "Ikeja", "Lagos", "Kunle Eze"],
  ["Goldhaven Workers Cooperative", "Cooperative", "Zaria", "Kaduna", "Chinedu Usman"],
  ["Meadowlight Microfinance Bank", "MFB", "Umuahia", "Abia", "Zainab Obi"],
];

interface MarketingContextValue {
  mode: OfficeMode;
  setMode: (mode: OfficeMode) => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  leads: Lead[];
  events: ActivityEvent[];
  approvals: ApprovalDraft[];
  kpis: Kpis;
  handoffs: Handoff[];
  now: number;
  agentState: (agent: Agent) => { status: AgentStatus; task: string };
  approveDraft: (id: string) => void;
  rejectDraft: (id: string) => void;
  saveDraft: (id: string, message: string) => void;
  resetDemo: () => void;
  // shared UI state (sheets live in the layout so every marketing page can open them)
  selectedAgentId: AgentId | null;
  setSelectedAgentId: (id: AgentId | null) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  approvalOpen: boolean;
  setApprovalOpen: (open: boolean) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  openDraftEditor: (id: string) => void;
}

const MarketingContext = createContext<MarketingContextValue | null>(null);

export function useMarketing() {
  const ctx = useContext(MarketingContext);
  if (!ctx) throw new Error("useMarketing must be used inside <MarketingProvider>");
  return ctx;
}

export function MarketingProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OfficeMode>("approval");
  const [paused, setPaused] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(() => initialLeads.map((lead) => ({ ...lead })));
  const [events, setEvents] = useState<ActivityEvent[]>(() => initialEvents.map((event) => ({ ...event })));
  const [approvals, setApprovals] = useState<ApprovalDraft[]>(() => initialApprovals.map((draft) => ({ ...draft })));
  const [kpis, setKpis] = useState<Kpis>({ ...startingKpis });
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [pulse, setPulse] = useState<Partial<Record<AgentId, AgentPulse>>>({});
  const [now, setNow] = useState(Date.now());
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const turn = useRef(0);
  const inFlight = useRef<Handoff[]>([]);
  const timers = useRef<number[]>([]);
  const completedFlights = useRef<Set<string>>(new Set());
  const leadsRef = useRef(leads);
  const approvalsRef = useRef(approvals);
  const modeRef = useRef(mode);

  useEffect(() => { leadsRef.current = leads; }, [leads]);
  useEffect(() => { approvalsRef.current = approvals; }, [approvals]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const addEvent = useCallback((event: Omit<ActivityEvent, "id" | "timestamp">) => {
    setEvents((previous) => [{ ...event, id: `event-${uid()}`, timestamp: nowIso() }, ...previous].slice(0, 85));
  }, []);
  const pulseAgent = useCallback((id: AgentId, status: AgentStatus, task: string, duration = 4800) => {
    setPulse((previous) => ({ ...previous, [id]: { status, task, until: Date.now() + duration } }));
  }, []);

  const completeHandoff = useCallback((id: string) => {
    if (completedFlights.current.has(id)) return;
    const flight = inFlight.current.find((item) => item.id === id);
    if (!flight) return;
    completedFlights.current.add(id);
    inFlight.current = inFlight.current.filter((item) => item.id !== id);
    setHandoffs([...inFlight.current]);
    pulseAgent(flight.from, "done", "Hand-off completed", 1700);
    if (!flight.leadId || !flight.nextStage) {
      pulseAgent("sales", "working", "Using the latest campaign copy…", 5500);
      addEvent({ agentId: "writer", kind: "content", text: "Passed a new campaign email draft to Sales Rep" });
      return;
    }
    const lead = leadsRef.current.find((item) => item.id === flight.leadId);
    if (!lead || nextStageOf(lead.stage) !== flight.nextStage) return;
    const stage = flight.nextStage;
    setLeads((previous) => previous.map((item) => item.id === lead.id
      ? { ...item, stage, ownerId: destinationAgentFor(lead.stage), stageEnteredAt: nowIso() } : item));
    pulseAgent(flight.to, "working", `Working on ${lead.institution}…`, 5800);
    addEvent({ agentId: flight.to, kind: activityKindForStage(stage), text: stageMessages[stage](lead.institution), leadId: lead.id });
    setKpis((previous) => ({
      ...previous,
      messagesSent: previous.messagesSent + (stage === "Contacted" ? 1 : 0),
      replies: previous.replies + (stage === "Replied" ? 1 : 0),
      demosBooked: previous.demosBooked + (stage === "Demo Booked" ? 1 : 0),
      clientsConverted: previous.clientsConverted + (stage === "Signed Up" ? 1 : 0),
    }));
  }, [addEvent, pulseAgent]);

  /** Starts a flight. Completion is timer-driven so it works even when the office scene isn't on screen. */
  const launch = useCallback((flight: Handoff) => {
    inFlight.current = [...inFlight.current, flight];
    setHandoffs([...inFlight.current]);
    timers.current.push(window.setTimeout(() => completeHandoff(flight.id), FLIGHT_MS));
  }, [completeHandoff]);

  const beginHandoff = useCallback((lead: Lead, nextStage: PipelineStage) => {
    if (inFlight.current.some((flight) => flight.leadId === lead.id)) return;
    const from = agentForStage(lead.stage);
    const to = destinationAgentFor(lead.stage);
    launch({ id: `flight-${uid()}`, leadId: lead.id, label: lead.institution, from, to, nextStage, startedAt: Date.now() });
    pulseAgent(from, "working", `Passing ${lead.institution} to ${getAgent(to).name}…`, 3200);
  }, [launch, pulseAgent]);

  const beginContentHandoff = useCallback(() => {
    launch({ id: `content-${uid()}`, label: "Fresh campaign copy", from: "writer", to: "sales", nextStage: null, startedAt: Date.now() });
    pulseAgent("writer", "working", "Sending new outreach copy to Sales…", 3000);
  }, [launch, pulseAgent]);

  const approveDraft = useCallback((id: string) => {
    const draft = approvalsRef.current.find((item) => item.id === id);
    if (!draft) return;
    const lead = leadsRef.current.find((item) => item.id === draft.leadId);
    setApprovals((previous) => previous.filter((item) => item.id !== id));
    if (lead && nextStageOf(lead.stage) === draft.nextStage) {
      beginHandoff(lead, draft.nextStage);
      addEvent({ agentId: draft.agentId, kind: "system", leadId: lead.id, text: `Approved ${draft.channel.toLowerCase()} draft for ${lead.institution}` });
    } else {
      addEvent({ agentId: draft.agentId, kind: "system", text: `Archived outdated draft for ${draft.recipient.split(" · ")[0]}` });
    }
  }, [addEvent, beginHandoff]);

  const rejectDraft = useCallback((id: string) => {
    const draft = approvalsRef.current.find((item) => item.id === id);
    if (!draft) return;
    setApprovals((previous) => previous.filter((item) => item.id !== id));
    addEvent({ agentId: draft.agentId, kind: "system", leadId: draft.leadId, text: `Draft rejected for ${draft.recipient.split(" · ")[0]}; lead kept in queue` });
  }, [addEvent]);

  const saveDraft = useCallback((id: string, message: string) => {
    setApprovals((previous) => previous.map((draft) => draft.id === id ? { ...draft, message } : draft));
    const draft = approvalsRef.current.find((item) => item.id === id);
    if (draft) addEvent({ agentId: draft.agentId, kind: "system", text: `Human edited ${draft.channel.toLowerCase()} draft for ${draft.recipient.split(" · ")[0]}` });
  }, [addEvent]);

  const openDraftEditor = useCallback((id: string) => { setEditingId(id); setApprovalOpen(true); }, []);

  const setMode = useCallback((next: OfficeMode) => {
    setModeState(next);
    modeRef.current = next;
    if (next === "autopilot") {
      const queued = approvalsRef.current;
      if (queued.length) {
        approvalsRef.current = [];
        setApprovals([]);
        queued.slice(0, 3).forEach((draft) => {
          const lead = leadsRef.current.find((item) => item.id === draft.leadId);
          if (lead && nextStageOf(lead.stage) === draft.nextStage) beginHandoff(lead, draft.nextStage);
        });
        addEvent({ agentId: "manager", kind: "system", text: `Autopilot started · ${queued.length} drafts released to the simulated queue` });
      }
    } else {
      addEvent({ agentId: "manager", kind: "system", text: "Human approval required for every new outbound message" });
    }
  }, [addEvent, beginHandoff]);

  useEffect(() => {
    if (paused) return;
    const run = () => {
      if (inFlight.current.length >= 3) return;
      turn.current += 1;
      if (turn.current % 7 === 0 && !inFlight.current.some((flight) => flight.from === "writer")) {
        beginContentHandoff();
        return;
      }
      const activeIds = new Set(inFlight.current.map((flight) => flight.leadId));
      const pendingIds = new Set(approvalsRef.current.map((draft) => draft.leadId));
      const eligible = leadsRef.current.filter((lead) => nextStageOf(lead.stage) && !activeIds.has(lead.id) && !pendingIds.has(lead.id));
      if (!eligible.length) {
        const recycled = leadsRef.current.find((lead) => lead.stage === "Active" && !activeIds.has(lead.id));
        if (recycled) {
          const seed = replacementInstitutions[turn.current % replacementInstitutions.length];
          setLeads((previous) => previous.map((lead) => lead.id === recycled.id
            ? { ...lead, institution: seed[0], type: seed[1], city: seed[2], state: seed[3], contact: seed[4], email: "demo@example.invalid", stage: "Found", ownerId: "researcher", stageEnteredAt: nowIso() }
            : lead));
          setKpis((previous) => ({ ...previous, leadsFound: previous.leadsFound + 1 }));
          addEvent({ agentId: "researcher", kind: "research", text: `Discovered a new potential client: ${seed[0]}` });
        }
        return;
      }
      const lead = eligible[(turn.current * 3) % eligible.length];
      const nextStage = nextStageOf(lead.stage)!;
      const requiresReview = modeRef.current === "approval" && (lead.stage === "Found" || lead.stage === "Contacted");
      if (requiresReview) {
        if (approvalsRef.current.length >= 7) return;
        const assigned = destinationAgentFor(lead.stage);
        const draft: ApprovalDraft = {
          id: `approval-${uid()}`, leadId: lead.id, agentId: assigned,
          recipient: `${lead.institution} · ${lead.contact}`,
          channel: lead.stage === "Contacted" ? "WhatsApp" : "Email",
          subject: lead.stage === "Found" ? "Introducing FynixCoBanking" : "A quick follow-up from FynixCoBanking",
          message: `Hello ${lead.contact.split(" ")[0]}, we'd love to show you how FynixCoBanking can simplify loan processing, savings collections and accurate reporting for ${lead.institution}. Would you be open to a short product demo this week?`,
          nextStage, createdAt: nowIso(),
        };
        setApprovals((previous) => [...previous, draft]);
        pulseAgent(assigned, "approval", `Approval needed: ${lead.institution}`, 5500);
        addEvent({ agentId: assigned, kind: "approval", leadId: lead.id, approvalId: draft.id, text: `Needs approval: ${draft.subject.toLowerCase()} · ${lead.institution}` });
      } else {
        beginHandoff(lead, nextStage);
      }
    };
    const initial = window.setTimeout(run, 650);
    const interval = window.setInterval(run, 1_250);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [paused, addEvent, beginContentHandoff, beginHandoff, pulseAgent]);

  const resetDemo = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    inFlight.current = [];
    completedFlights.current = new Set();
    turn.current = 0;
    setHandoffs([]);
    setLeads(initialLeads.map((lead) => ({ ...lead })));
    setEvents(initialEvents.map((event) => ({ ...event })));
    setApprovals(initialApprovals.map((draft) => ({ ...draft })));
    setKpis({ ...startingKpis });
    setPulse({});
    setSelectedAgentId(null);
    setSelectedLeadId(null);
    setPaused(false);
    setModeState("approval");
    setApprovalOpen(false);
    setEditingId(null);
  }, []);

  const agentState = useCallback((agent: Agent) => {
    const recent = pulse[agent.id];
    if (recent && recent.until > now) return { status: recent.status, task: recent.task };
    if (approvals.some((draft) => draft.agentId === agent.id)) return { status: "approval" as AgentStatus, task: "Draft waiting for your approval…" };
    return { status: agent.status === "approval" ? "idle" as AgentStatus : agent.status, task: agent.currentTask };
  }, [pulse, now, approvals]);

  const value = useMemo<MarketingContextValue>(() => ({
    mode, setMode, paused, setPaused, leads, events, approvals, kpis, handoffs, now, agentState,
    approveDraft, rejectDraft, saveDraft, resetDemo,
    selectedAgentId, setSelectedAgentId, selectedLeadId, setSelectedLeadId,
    approvalOpen, setApprovalOpen, editingId, setEditingId, openDraftEditor,
  }), [mode, setMode, paused, leads, events, approvals, kpis, handoffs, now, agentState, approveDraft, rejectDraft,
    saveDraft, resetDemo, selectedAgentId, selectedLeadId, approvalOpen, editingId, openDraftEditor]);

  return <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>;
}

// ── small shared helpers ───────────────────────────────────────────────────────

export function relativeTime(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / (24 * 60))}d ago`;
}
export function timeInStage(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}
export function statusText(status: AgentStatus): string {
  return ({ working: "Working", idle: "Idle", approval: "Waiting for approval", done: "Done" } as const)[status];
}
