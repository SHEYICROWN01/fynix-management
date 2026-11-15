import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, BrainCircuit,
  CalendarCheck2, CalendarDays, Check, CheckCheck, CheckCircle2,
  CircleDot, Clock3, Command, Layers3, Mail,
  MessageCircle, MessageSquareText, Pause, PenLine, Play,
  Radio, RefreshCw, Search, Send, ShieldCheck, Sparkles,
  TrendingUp, UserCheck, Users, X, Home, Megaphone, Building2, BarChart3, Settings, ChevronDown, Rocket, PanelLeft, Bot, Inbox, ExternalLink, Sun, Moon, MoreHorizontal,
  ArrowLeft, Handshake, MessageCircleMore, UserPlus, Crown, ScrollText,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import officeScene from "./assets/fynix-office-scene.webp";
import { LiveOffice, canWalk, hasSprites, liveReadyCount, type HeadMap } from "./LiveOffice";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  agents, agentForStage, destinationAgentFor, initialApprovals, initialEvents,
  initialLeads, initialTasks, nextStageOf, startingKpis, STAGES,
  type ActivityEvent, type ActivityKind, type Agent, type AgentId,
  type AgentStatus, type ApprovalDraft, type Lead, type PipelineStage,
} from "./mockData";

/**
 * AI Marketing Office — single-page client-only demo.
 * All emails, outreach, appointments, approvals and lead movements are simulated.
 * No messages are sent, no real institutions are contacted, and no backend is used.
 */

type OfficeMode = "approval" | "autopilot";
type Kpis = typeof startingKpis;
interface Handoff {
  id: string;
  leadId?: string;
  label: string;
  from: AgentId;
  to: AgentId;
  nextStage: PipelineStage | null;
  startedAt: number;
}
interface AgentPulse {
  status: AgentStatus;
  task: string;
  until: number;
}

const AgentIcons: Record<AgentId, LucideIcon> = {
  researcher: Search,
  writer: PenLine,
  sales: Send,
  followup: MessageSquareText,
  secretary: CalendarDays,
  onboarding: UserCheck,
  manager: BrainCircuit,
};
const ActivityIcons: Record<ActivityKind, LucideIcon> = {
  research: Search, content: PenLine, outreach: Send, reply: MessageCircle,
  demo: CalendarCheck2, signup: CheckCheck, onboarding: Users,
  active: CheckCircle2, approval: ShieldCheck, system: Activity,
};
/**
 * Exact boxes (in % of the 1033 × 509 scene image) of the name cards printed in
 * fynix-office-scene.webp. Live cards are laid precisely over them so the robots'
 * faces beside each card stay visible.
 */
const deskBoxes: Record<AgentId, {left:number;top:number;width:number;height:number}> = {
  researcher: { left: 29.8, top: 27.9, width: 13.2, height: 13.9 },
  manager:    { left: 44.4, top: 32.2, width: 16.5, height: 14.4 },
  writer:     { left: 64.3, top: 28.0, width: 13.4, height: 14.0 },
  onboarding: { left: 22.1, top: 47.4, width: 14.8, height: 14.6 },
  sales:      { left: 70.0, top: 46.6, width: 12.6, height: 15.2 },
  secretary:  { left: 12.6, top: 72.4, width: 15.5, height: 15.4 },
  followup:   { left: 79.6, top: 72.7, width: 15.5, height: 15.0 },
};
/** Centre of each desk card, used as the start/end point for flying hand-off cards. */
const deskPositions: Record<AgentId, {x:number;y:number}> = Object.fromEntries(
  Object.entries(deskBoxes).map(([id, b]) => [id, { x: b.left + b.width / 2, y: b.top + b.height / 2 }]),
) as Record<AgentId, {x:number;y:number}>;

// ── Collaboration room: conversations (Level 1) ──────────────────────────────
// Simulated dialogue only. Nothing here talks to a real AI or sends any message.

/** Robot head centres (% of the scene image), measured on fynix-office-scene.webp. */
const robotHeads: Record<AgentId, {x:number;y:number}> = {
  researcher: { x: 25.4, y: 29.1 }, manager: { x: 53.2, y: 19.3 }, writer: { x: 81.1, y: 29.5 },
  onboarding: { x: 18.2, y: 49.1 }, sales: { x: 86.2, y: 49.5 },
  secretary: { x: 31.8, y: 73.1 }, followup: { x: 74.1, y: 73.3 },
};
/** Where "You" speak from when giving the Manager an instruction (bottom centre of the room). */
const YOU_POS = { x: 50, y: 90 };

type Speaker = AgentId | "you";
type TalkKind = "chat" | "call" | "standup" | "ask";
interface TalkLine { speaker: Speaker; to?: Speaker; text: string }
/** `visit`: in the live office, `visitor` walks over to `host` before talking and walks back after. */
interface Conversation { id: string; kind: TalkKind; title: string; lines: TalkLine[]; visit?: { visitor: AgentId; host: AgentId } }
interface MeetingNote extends Conversation { at: string }
interface ActiveTalk { conv: Conversation; index: number; phase: "arriving" | "typing" | "speaking" | "leaving" }
type OfficeView = "classic" | "live";
/** The line currently being said (none while robots are still walking). */
const currentLine = (talk: ActiveTalk | null) => (talk && (talk.phase === "typing" || talk.phase === "speaking") ? talk.conv.lines[talk.index] : null);
interface RoomProps {
  talk: ActiveTalk | null; notesCount: number; onStandup: () => void; onNotes: () => void;
  onAsk: (text: string) => void; onRaiseHand: () => void;
  officeView: OfficeView; setOfficeView: (view: OfficeView) => void;
  onArrived: (convId: string) => void; onReturned: (convId: string) => void;
}

const TALK_TYPING_MS = 900;
const TALK_SPEAK_MS = 2800;
const talkKindLabel: Record<TalkKind, string> = { chat: "Hand-off chat", call: "Manager call", standup: "Daily stand-up", ask: "Your instruction" };
const speakerName = (s: Speaker) => (s === "you" ? "You" : getAgent(s).name);
const speakerPos = (s: Speaker) => (s === "you" ? YOU_POS : robotHeads[s]);
const countStage = (leads: Lead[], stage: PipelineStage) => leads.filter((l) => l.stage === stage).length;

function statusReport(id: AgentId, leads: Lead[]): string {
  switch (id) {
    case "researcher": return `${countStage(leads, "Found")} new institutions are ready for first contact.`;
    case "writer": return "Next up: a LinkedIn post on modernising MFB operations.";
    case "sales": return `${countStage(leads, "Contacted")} intros are out. Waiting on replies.`;
    case "followup": return `${countStage(leads, "Replied")} have replied. I'm nudging the quiet ones.`;
    case "secretary": return `${countStage(leads, "Demo Booked")} demos on the calendar. Next one Thursday, 10:00.`;
    case "onboarding": return `${countStage(leads, "Onboarding")} clients in setup, no blockers.`;
    case "manager": return `${leads.filter((l) => l.stage !== "Active").length} leads in motion.`;
  }
}
const managerQuestion: Record<AgentId, string> = {
  researcher: "Researcher, how is prospecting going?",
  writer: "Content Writer, what are you publishing next?",
  sales: "Sales Rep, how many intros are out?",
  followup: "Follow-up Officer, any replies yet?",
  secretary: "Secretary, what's on the demo calendar?",
  onboarding: "Onboarding Officer, how are our new clients doing?",
  manager: "",
};
/** Two-line chat played when a task card lands on the next desk. */
function handoffChat(from: AgentId, to: AgentId, stage: PipelineStage | null, name: string): TalkLine[] {
  const scripts: Partial<Record<PipelineStage, [string, string]>> = {
    Contacted: [`${getAgent(to).name}, ${name} looks promising. All yours.`, "Thanks! Drafting a personalised intro now."],
    Replied: [`${name} has my intro. Can you keep the conversation going?`, "On it. I'll follow up in 3 days if they go quiet."],
    "Demo Booked": [`${name} replied and wants a demo!`, "Great, sending them Thursday's slots now."],
    "Signed Up": [`The demo with ${name} went well. Over to you to close.`, "Preparing the proposal and pricing."],
    Onboarding: [`${name} signed! Please start their setup.`, "Creating their workspace and training plan."],
    Active: [`${name} is fully set up and live.`, "Excellent work. Adding them to this week's report."],
  };
  const pair = stage ? scripts[stage] : ["New campaign copy is ready for you.", "Perfect, I'll use it in today's outreach."];
  return pair ? [{ speaker: from, to, text: pair[0] }, { speaker: to, to: from, text: pair[1] }] : [];
}
/** Which agents the Manager assigns an instruction to, based on its wording. */
const askRoutes: Array<[AgentId, RegExp]> = [
  ["researcher", /find|research|prospect|lead|state|kano|lagos|abuja|oyo|cooperative|mfb|microfinance|lender/i],
  ["writer", /post|content|article|linkedin|campaign|write|blog/i],
  ["sales", /email|outreach|intro|contact|sell|price|pricing|proposal|offer/i],
  ["followup", /follow|remind|chase|reply|nudge/i],
  ["secretary", /demo|meeting|schedule|calendar|book/i],
  ["onboarding", /onboard|setup|set up|training|activate|go live/i],
];
const askAck: Record<AgentId, string> = {
  researcher: "On it. I'll adjust my search to match.",
  writer: "Got it. I'll write content for that focus.",
  sales: "Understood. I'll tailor my outreach.",
  followup: "Noted. I'll prioritise those follow-ups.",
  secretary: "I'll keep demo slots open for this.",
  onboarding: "Ready. I'll prepare setup plans for them.",
  manager: "",
};
function routeInstruction(text: string): AgentId[] {
  const hits = askRoutes.filter(([, re]) => re.test(text)).map(([id]) => id);
  return hits.length ? hits.slice(0, 3) : ["researcher", "sales"];
}
const stageColors: Record<PipelineStage, string> = {
  Found: "#73A9FC", Contacted: "#86A5F3", Replied: "#AF9AF2",
  "Demo Booked": "#F7B874", "Signed Up": "#5AD2BD",
  Onboarding: "#65D3AB", Active: "#4CF08A",
};
const stageMessages: Record<PipelineStage, (name: string) => string> = {
  Found: (name) => `Researched ${name}`,
  Contacted: (name) => `Sent first outreach to ${name}`,
  Replied: (name) => `Received an interested reply from ${name}`,
  "Demo Booked": (name) => `Booked a product demo with ${name}`,
  "Signed Up": (name) => `${name} agreed to start with FynixCoBanking`,
  Onboarding: (name) => `Started onboarding for ${name}`,
  Active: (name) => `${name} completed activation`,
};
const compactMoney = (n: number) => new Intl.NumberFormat("en-NG").format(n);
const getAgent = (id: AgentId): Agent => agents.find((agent) => agent.id === id)!;
const nowIso = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

function relativeTime(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / (24 * 60))}d ago`;
}
function timeInStage(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} hr`;
  return `${Math.floor(minutes / 1440)} days`;
}
function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}
function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((v) => v[0]).join("").toUpperCase();
}
function activityKindForStage(stage: PipelineStage): ActivityKind {
  return ({ Found: "research", Contacted: "outreach", Replied: "reply", "Demo Booked": "demo",
    "Signed Up": "signup", Onboarding: "onboarding", Active: "active" } as const)[stage];
}
function statusText(status: AgentStatus): string {
  return ({ working: "Working", idle: "Idle", approval: "Needs approval", done: "Done" } as const)[status];
}
const surface = "rounded-[22px] border border-[#E5EAF4] bg-white shadow-[0_12px_35px_-25px_rgba(19,35,81,0.22)] dark:border-white/[0.085] dark:bg-[#131D33] dark:shadow-[0_18px_54px_-34px_rgba(0,0,0,0.6)]";
const micro = "text-[10px] font-bold uppercase tracking-[0.17em]";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6FE8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131D33]";

function AgentAvatar({ agent, small = false, glow = false }: { agent: Agent; small?: boolean; glow?: boolean }) {
  const Icon = AgentIcons[agent.id];
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl border ${small ? "h-8 w-8 rounded-xl" : "h-11 w-11"}`}
      style={{
        color: agent.accent,
        background: `linear-gradient(145deg, ${agent.accent}28, ${agent.accent}09)`,
        borderColor: `${agent.accent}40`,
        boxShadow: glow ? `0 0 25px ${agent.accent}30` : "none",
      }}
      aria-hidden="true"
    >
      <Icon size={small ? 15 : 19} strokeWidth={2.2} />
    </span>
  );
}
function StatusMark({ status }: { status: AgentStatus }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center" aria-hidden="true">
      {status === "working" && <span className="absolute h-3 w-3 animate-ping rounded-full bg-[#4CF08A]/45" />}
      {status === "approval" && <span className="absolute h-3 w-3 animate-pulse rounded-full bg-amber-400/40" />}
      {status === "done" ? <Check size={12} className="text-[#4DD69A]" strokeWidth={3.5} /> : (
        <span className={`relative h-[7px] w-[7px] rounded-full ${status === "working" ? "bg-[#4CF08A]" : status === "approval" ? "bg-amber-400" : "bg-[#8994A9]"}`} />
      )}
    </span>
  );
}
function MiniBars({ values, accent = "#3B6FE8", tall = false }: { values: number[]; accent?: string; tall?: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div className={`flex items-end gap-1.5 ${tall ? "h-[100px]" : "h-10"}`} aria-label="Performance trend over the last seven days" role="img">
      {values.map((value, i) => (
        <motion.span
          key={i}
          initial={{ height: 3, opacity: 0.45 }}
          animate={{ height: `${Math.max(15, (value / max) * 100)}%`, opacity: i === values.length - 1 ? 1 : 0.55 }}
          transition={{ duration: 0.55, delay: i * 0.035 }}
          className="min-w-0 flex-1 rounded-t-[5px]"
          style={{ background: `linear-gradient(180deg, ${accent}, ${accent}65)` }}
        />
      ))}
    </div>
  );
}

// Integration: menu items are real links to the marketing section, plus a way back to the admin portal.
function OfficeSidebar() {
  const menu = [
    {name:"Overview", icon:Home, href:"/marketing/overview"}, {name:"AI Marketing Office",icon:Sparkles, href:"/marketing", end:true},
    {name:"Leads & Pipeline",icon:Users, href:"/marketing/leads"}, {name:"Campaigns",icon:Megaphone, href:"/marketing/campaigns"},
    {name:"Institutions",icon:Building2, href:"/marketing/institutions"}, {name:"Reports",icon:BarChart3, href:"/marketing/reports"},
    {name:"Settings",icon:Settings, href:"/marketing/settings"},
  ];
  return <aside className="amo-sidebar hidden w-[218px] shrink-0 flex-col border-r border-[#E6EBF7] bg-white px-3 py-6 xl:flex dark:border-white/10 dark:bg-[#111A30]">
    <div className="mb-11 flex items-center gap-2 px-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1978FF] to-[#2750D9] text-[25px] font-black italic text-white shadow-[0_8px_22px_rgba(28,105,242,.25)]">F</span><span><span className="block text-[15px] font-black leading-tight tracking-tight text-[#101A40] dark:text-white">FynixCoBanking</span><span className="block text-[9px] font-medium text-[#8191B1]">Core banking growth suite</span></span></div>
    <nav className="space-y-2" aria-label="Main navigation">{menu.map(({name,icon:Icon,href,end})=><NavLink key={name} to={href} end={end} className={({isActive})=>`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[12px] font-bold ${focusRing} ${isActive?"bg-gradient-to-r from-[#1559EC] to-[#4C54ED] text-white shadow-[0_8px_18px_rgba(25,86,230,.24)]":"text-[#56698E] hover:bg-[#F0F4FF] dark:text-[#A9BAD9] dark:hover:bg-white/5"}`}><Icon size={17}/>{name}</NavLink>)}</nav>
    <NavLink to="/dashboard" className={`mt-6 flex items-center gap-2 rounded-xl border border-[#E2E8F5] px-3 py-2.5 text-[11px] font-bold text-[#56698E] hover:border-[#AFC8FF] hover:text-[#2250CC] dark:border-white/10 dark:text-[#A9BAD9] ${focusRing}`}><ArrowLeft size={15}/>Back to Admin Portal</NavLink>
    <div className="mt-auto overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1365FC] via-[#544CF4] to-[#26C9E8] p-4 text-white shadow-[0_10px_30px_rgba(48,83,210,.18)]"><Sparkles size={22}/><div className="mt-4 text-[15px] font-black leading-snug">Your AI growth team<br/>never clocks out.</div><p className="mt-2 text-[10px] leading-relaxed text-white/85">Find the next financial institution, start a conversation and bring them on board.</p><div className="mt-6 flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3 py-2.5 text-[10px] font-bold"><span className="h-2 w-2 rounded-full bg-[#62FF9A]"/>7 agents online<Rocket size={14} className="ml-auto"/></div></div>
    <p className="mt-5 px-2 text-[10px] font-medium text-[#93A2BF]">FynixCoBanking · Demo environment</p>
  </aside>;
}
const kpiStyles = [
  {icon:Users, tone:"blue",trend:"+24%"}, {icon:Send,tone:"purple",trend:"+37%"},
  {icon:MessageCircleMore,tone:"mint",trend:"+44%"}, {icon:CalendarDays,tone:"gold",trend:"+50%"},
  {icon:Handshake,tone:"pink",trend:"+200%"},
];
function StatChip({ index, label, value }: {index:number;label:string;value:number}) {
 const Icon=kpiStyles[index].icon;
 return <div className={`amo-kpi amo-kpi--${kpiStyles[index].tone} flex min-w-[130px] flex-1 items-center gap-3 rounded-[17px] border p-3 shadow-[0_8px_26px_rgba(35,60,130,.06)] transition-transform hover:-translate-y-1`}>
   <div className="amo-kpi-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px]"><Icon size={21} strokeWidth={2.2}/></div>
   <div className="min-w-0"><div className="truncate text-[10px] font-bold text-[#667799] dark:text-[#B3C2DD]">{label}</div><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"><strong className="text-[22px] font-black leading-none tracking-[-.06em] tabular-nums text-[#172447] dark:text-white">{compactMoney(value)}</strong><span className="rounded-full bg-[#DDF8E8] px-1.5 py-0.5 text-[9px] font-black text-[#159754]">↑ {kpiStyles[index].trend}</span></div></div>
 </div>;
}
function Header({ kpis, mode, setMode, paused, setPaused, darkMode, setDarkMode, approvalCount, onApprovals, onReset }: {
  kpis: Kpis; mode: OfficeMode; setMode: (mode: OfficeMode) => void;
  paused: boolean; setPaused: (paused: boolean) => void; darkMode: boolean; setDarkMode: (dark: boolean) => void;
  approvalCount: number; onApprovals: () => void; onReset: () => void;
}) {
  const chips = [["Leads found", kpis.leadsFound],["Messages sent",kpis.messagesSent],["Replies",kpis.replies],["Demos booked",kpis.demosBooked],["Clients converted",kpis.clientsConverted]] as const;
  return <>
    <header className="amo-toolbar relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#E8ECF7] bg-white/90 px-5 py-3.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#111A30]/95 lg:px-6">
      <div className="flex min-w-0 items-center gap-3"><div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[#F1EBFF] text-[#7157ED] sm:flex"><Sparkles size={24}/></div><div><div className="flex flex-wrap items-center gap-2.5"><h1 className="text-[24px] font-black leading-none tracking-[-.05em] text-[#14214A] dark:text-white md:text-[27px]">AI Marketing Office</h1><span className="inline-flex items-center gap-1.5 rounded-full border border-[#C3F4DB] bg-[#E5FAEF] px-2.5 py-1 text-[10px] font-bold text-[#138E53]"><span className="relative h-1.5 w-1.5 rounded-full bg-[#29C878]">{!paused&&<span className="absolute inset-0 animate-ping rounded-full bg-[#29C878]"/>}</span>{paused ? "Office paused" : "Office open · 7 agents working"}</span></div><p className="mt-1 text-[11px] font-medium text-[#8090AF] dark:text-[#AAB8D3]">Your AI sales team — from discovery to client activation.</p></div></div>
      <div className="flex items-center gap-2"><div className="flex rounded-full border border-[#DFE7F8] bg-[#F0F4FF] p-1 dark:border-white/10 dark:bg-[#202D49]" role="group" aria-label="Operating mode"><button onClick={()=>setMode("approval")} aria-pressed={mode==="approval"} className={`rounded-full px-3 py-2 text-[10px] font-extrabold transition ${focusRing} ${mode==="approval"?"bg-white text-[#2250CC] shadow-sm dark:bg-[#344B77] dark:text-white":"text-[#6F7F9E] dark:text-[#AEC0DF]"}`}>Approval mode</button><button onClick={()=>setMode("autopilot")} aria-pressed={mode==="autopilot"} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-extrabold transition ${focusRing} ${mode==="autopilot"?"bg-gradient-to-r from-[#1F67ED] to-[#504BEB] text-white shadow-[0_4px_14px_rgba(31,103,237,.22)]":"text-[#6F7F9E] dark:text-[#AEC0DF]"}`}><Rocket size={13}/>Autopilot</button></div><button onClick={()=>setPaused(!paused)} className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F5] bg-white text-[#50679E] dark:border-white/10 dark:bg-[#23304A] ${focusRing}`} title={paused?"Resume":"Pause"} aria-label={paused?"Resume simulation":"Pause simulation"}>{paused?<Play size={15}/>:<Pause size={15}/>}</button><button onClick={()=>setDarkMode(!darkMode)} className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F5] bg-white text-[#50679E] dark:border-white/10 dark:bg-[#23304A] ${focusRing}`} aria-label={darkMode?"Switch to light mode":"Switch to dark mode"}>{darkMode?<Sun size={16}/>:<Moon size={16}/>}</button><button onClick={onApprovals} className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F5] bg-white text-[#50679E] dark:border-white/10 dark:bg-[#23304A] ${focusRing}`} aria-label={`Open approval inbox, ${approvalCount} awaiting review`}><Bell size={17}/>{approvalCount>0&&<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF426F] px-1 text-[9px] font-black text-white">{approvalCount}</span>}</button><div className="hidden items-center gap-2 rounded-xl border border-[#E2E8F5] bg-white px-2 py-1 dark:border-white/10 dark:bg-[#23304A] sm:flex"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7944E9] to-[#3B6FE8] text-[10px] font-black text-white">AD</span><span className="text-[10px] font-bold">Admin</span><ChevronDown size={12} className="text-[#A6B1C6]"/></div></div>
    </header>
    <div className="relative z-10 px-4 py-4 lg:px-5"><div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">{chips.map(([label,value],index)=><StatChip key={label} index={index} label={label} value={value}/>)}</div></div>
  </>;
}

function DesktopAgentCard({ agent, status, task, onClick, called = false, talking = false }: { agent: Agent; status: AgentStatus; task: string; onClick: () => void; called?: boolean; talking?: boolean }) {
  // Integration: card sized and placed exactly over the printed card in the scene image.
  // Sizes use cqw (1% of the scene width) so the card scales together with the picture.
  const box=deskBoxes[agent.id];
  const statusLabel=status==="approval"?"Approval needed":statusText(status);
  const Icon=AgentIcons[agent.id];
  return <div className="pointer-events-none absolute z-20" style={{left:`${box.left}%`,top:`${box.top}%`,width:`${box.width}%`,height:`${box.height}%`}}>
    {called && <span className="pointer-events-none absolute -top-[1.9cqw] right-[0.4cqw] z-10 inline-flex items-center gap-[0.3cqw] whitespace-nowrap rounded-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-[0.7cqw] py-[0.2cqw] text-[clamp(8px,0.8cqw,11px)] font-extrabold text-white shadow-[0_0.3cqw_1cqw_rgba(249,115,22,.45)]">📞 Called by Manager</span>}
    <motion.button onClick={onClick} initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}}
    whileHover={{y:-4,scale:1.03}} whileTap={{scale:.97}} transition={{type:"spring",stiffness:260,damping:21}}
    className={`amo-desk pointer-events-auto flex h-full w-full flex-col justify-center overflow-hidden rounded-[1.1cqw] border px-[0.9cqw] py-[0.55cqw] text-left ${status==="approval"?"border-[#F6B95E] bg-[#FFFBF3]":"border-white bg-white hover:border-[#AFC8FF]"} shadow-[0_0.6cqw_1.8cqw_rgba(40,62,154,.22)] ${focusRing}`}
    style={{boxShadow:talking?`0 0 0 0.22cqw ${agent.accent}, 0 0 2.4cqw ${agent.accent}AA`:status==="working"?`0 0.6cqw 1.8cqw ${agent.accent}40`:undefined,transition:"box-shadow .35s ease"}}
    aria-label={`${agent.name}, ${statusLabel}. ${task}. Open agent details`}>
    <div className="flex min-w-0 items-center gap-[0.5cqw]"><span className="flex h-[1.9cqw] w-[1.9cqw] shrink-0 items-center justify-center rounded-[0.5cqw]" style={{color:agent.accent,background:`${agent.accent}18`}}><Icon className="h-[1.15cqw] w-[1.15cqw]"/></span><strong className="truncate text-[1.12cqw] font-black leading-tight text-[#172447]">{agent.name}</strong></div>
    <div className={`mt-[0.4cqw] inline-flex w-fit items-center gap-[0.35cqw] rounded-full px-[0.6cqw] py-[0.15cqw] text-[0.82cqw] font-extrabold ${status==="approval"?"bg-[#FFF0D6] text-[#B66C1D]":status==="done"?"bg-[#DFF9ED] text-[#11915A]":"bg-[#E2FAEC] text-[#149454]"}`}><StatusMark status={status}/>{statusLabel}</div>
    <p className="mt-[0.4cqw] line-clamp-2 text-[0.88cqw] font-medium leading-[1.3] text-[#5B6C8A]" title={task}>{task}</p>
  </motion.button></div>;
}

function MobileAgentCard({ agent, status, task, onClick }: { agent: Agent; status: AgentStatus; task: string; onClick: () => void }) {
  return (
    <motion.button layout whileTap={{ scale: 0.99 }} onClick={onClick} aria-label={`${agent.name}, ${statusText(status)}. ${task}. Open agent details`} className={`relative z-10 flex h-[88px] w-full items-center gap-3 rounded-[16px] border bg-white/95 p-3 text-left dark:bg-[#1B2942]/95 ${status === "approval" ? "border-amber-400/65" : "border-[#E4EAF6] dark:border-white/10"} ${focusRing}`}>
      <AgentAvatar agent={agent} glow={status === "working"} />
      <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[12px] font-extrabold"><span className="truncate">{agent.name}</span><StatusMark status={status} /></span><span className="mt-0.5 block text-[10px] text-[#8A97AC]">{agent.role}</span><span className="mt-1 block truncate text-[10px] font-medium text-[#60728E] dark:text-[#ACBCD4]">{task}</span></span>
      <ArrowUpRight size={15} className="shrink-0 text-[#A4B0C5]" />
    </motion.button>
  );
}

/** Pure transform animations (compositor-friendly) along a quadratic Bézier path. */
function FlyingTask({ handoff, position, onComplete, reducedMotion }: {
  handoff: Handoff; position: (agentId: AgentId) => { x: number; y: number };
  onComplete: (id: string) => void; reducedMotion: boolean;
}) {
  const progress = useMotionValue(0);
  const from = position(handoff.from);
  const to = position(handoff.to);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const ctrl = { x: mid.x + (to.y - from.y) * (distance > 250 ? 0.2 : 0.11), y: mid.y - (to.x - from.x) * (distance > 250 ? 0.2 : 0.11) };
  const x = useTransform(progress, (p: number) => reducedMotion ? to.x : (1 - p) ** 2 * from.x + 2 * (1 - p) * p * ctrl.x + p ** 2 * to.x);
  const y = useTransform(progress, (p: number) => reducedMotion ? to.y : (1 - p) ** 2 * from.y + 2 * (1 - p) * p * ctrl.y + p ** 2 * to.y);
  const scale = useTransform(progress, [0, 0.45, 1], [0.78, 1.08, 0.85]);
  const opacity = useTransform(progress, [0, 0.12, 0.86, 1], [0, 1, 1, 0.05]);
  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: reducedMotion ? 0.55 : 2.65, ease: "easeInOut",
      onComplete: () => onComplete(handoff.id),
    });
    return () => controls.stop();
    // Deliberately keyed to handoff ID. A resize should not restart an active flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff.id, reducedMotion]);
  return (
    <motion.div className="pointer-events-none absolute left-0 top-0 z-30" style={{ x, y, opacity, scale }} aria-hidden="true">
      <div className="-translate-x-1/2 -translate-y-1/2">
        <div className="relative flex max-w-[clamp(120px,15cqw,175px)] items-center gap-[clamp(4px,0.6cqw,8px)] rounded-xl border border-[#8FB1FF] bg-[#EAF2FF]/95 px-[clamp(8px,0.9cqw,12px)] py-[clamp(4px,0.6cqw,8px)] text-[clamp(9px,1cqw,11px)] font-bold text-[#1A3F98] shadow-[0_0_36px_rgba(59,111,232,0.45)] backdrop-blur-xl dark:border-[#6A98EE] dark:bg-[#25447B]/95 dark:text-white">
          <span className="absolute inset-0 -z-10 animate-pulse rounded-xl bg-[#3B6FE8]/15 blur-lg" />
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4CF08A]" />
          <span className="truncate">{handoff.label}</span>
          <ArrowRight size={12} className="shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 900, height: 620 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, size };
}
function TransferOverlay({ handoffs, onComplete, mobile, reducedMotion, points }: {
  handoffs: Handoff[]; onComplete: (id: string) => void; mobile: boolean;
  reducedMotion: boolean; points?: HeadMap;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const positions = useCallback((id: AgentId) => {
    const p = points ? points[id] : deskPositions[id];
    if (!mobile) return { x: p.x / 100 * size.width, y: p.y / 100 * size.height };
    return { x: size.width * 0.55, y: 12 + agents.findIndex((item) => item.id === id) * 102 + 44 };
  }, [mobile, size.height, size.width, points]);
  return <div ref={ref} className="pointer-events-none absolute inset-0 z-30 overflow-hidden"><AnimatePresence>{handoffs.map((handoff) => <FlyingTask key={handoff.id} handoff={handoff} position={positions} onComplete={onComplete} reducedMotion={reducedMotion} />)}</AnimatePresence></div>;
}

/** Caption panel, chat icon over the speaker, talking rings, the beam between speakers and raised hands. */
function TalkLayer({ talk, handsUp, onRaiseHand, reduce, heads = robotHeads }: {
  talk: ActiveTalk | null; handsUp: AgentId[]; onRaiseHand: () => void; reduce: boolean; heads?: HeadMap;
}) {
  const line = currentLine(talk);
  const speakerPos = (s: Speaker) => (s === "you" ? YOU_POS : heads[s]);
  const key = talk ? `${talk.conv.id}-${talk.index}` : "none";
  const robots = line ? [line.speaker, line.to].filter((s): s is AgentId => !!s && s !== "you") : [];
  const from = line ? speakerPos(line.speaker) : null;
  const to = line?.to ? speakerPos(line.to) : null;
  const isYou = line?.speaker === "you";
  const accent = line && !isYou ? getAgent(line.speaker as AgentId).accent : "#3B6FE8";
  return <>
    {/* Beam between speaker and listener */}
    {from && to && (
      <motion.svg key={`beam-${key}`} className="pointer-events-none absolute inset-0 z-[25] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#7CC4FF" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={reduce ? "" : "amo-beam"} strokeDasharray="6 9" style={{ filter: "drop-shadow(0 0 4px rgba(96,165,250,.95))" }} />
      </motion.svg>
    )}
    {/* Talking rings around the speaker's head */}
    {from && !isYou && talk?.phase === "speaking" && !reduce && (
      <div key={`ring-${key}`} className="pointer-events-none absolute z-[25] h-[6.5cqw] w-[6.5cqw] -translate-x-1/2 -translate-y-1/2" style={{ left: `${from.x}%`, top: `${from.y}%` }} aria-hidden="true">
        {[0, 1].map((i) => <motion.span key={i} className="absolute inset-0 rounded-full border-2" style={{ borderColor: accent }} initial={{ scale: 0.7, opacity: 0.9 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }} />)}
      </div>
    )}
    {/* Raised hands: agents waiting for your decision */}
    {handsUp.map((id) => { const h = heads[id]; return (
      <div key={`hand-${id}`} className="absolute z-[26]" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
        <motion.button onClick={onRaiseHand} className={`pointer-events-auto flex -translate-y-[4.6cqw] translate-x-[1.2cqw] items-center gap-[0.3cqw] whitespace-nowrap rounded-full border border-[#FCD34D] bg-[#FFFBEB] px-[0.7cqw] py-[0.25cqw] text-[clamp(8px,0.85cqw,11px)] font-extrabold text-[#B45309] shadow-[0_0.4cqw_1.2cqw_rgba(245,158,11,.4)] ${focusRing}`} animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} aria-label={`${getAgent(id).name} needs your decision. Open approval inbox`}>
          <span aria-hidden="true">✋</span>Needs you
        </motion.button>
      </div>
    ); })}
    {/* Small chat icon above the speaking robot's head (shows typing dots while it "thinks") */}
    <AnimatePresence mode="wait">{line && from && !isYou && (
      <motion.div key={`tag-${key}`} className="pointer-events-none absolute z-[35]" style={{ left: `${from.x}%`, top: `${from.y}%` }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} aria-hidden="true">
        <div className="flex h-[2.6cqw] min-w-[3.4cqw] -translate-x-1/2 -translate-y-[5.6cqw] items-center justify-center gap-[0.25cqw] rounded-full border-2 bg-white px-[0.6cqw] shadow-[0_0.4cqw_1.2cqw_rgba(20,40,110,.3)]" style={{ borderColor: accent }}>
          {talk!.phase === "typing"
            ? [0, 1, 2].map((i) => <motion.span key={i} className="h-[0.5cqw] w-[0.5cqw] rounded-full" style={{ background: accent }} animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />)
            : <MessageCircleMore className="h-[1.5cqw] w-[1.5cqw]" style={{ color: accent }} />}
        </div>
      </motion.div>
    )}</AnimatePresence>
    {/* Caption panel over the empty ceiling area, so conversations never cover cards or faces */}
    <AnimatePresence mode="wait">{line && (
      <motion.div key={`caption-${key}`} className="pointer-events-none absolute left-1/2 top-[2.2%] z-[35] w-[44%] -translate-x-1/2" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} aria-live="polite">
        <div className={`rounded-[1.1cqw] border px-[1.2cqw] py-[0.7cqw] shadow-[0_0.6cqw_2.2cqw_rgba(20,40,110,.28)] backdrop-blur-md ${isYou ? "border-[#93B4FF] bg-gradient-to-br from-[#2F63F0]/95 to-[#5B47E8]/95 text-white" : "border-white bg-white/95 text-[#1E2B4D]"}`} style={{ borderLeft: isYou ? undefined : `0.4cqw solid ${accent}` }}>
          <div className={`flex flex-wrap items-center gap-[0.5cqw] text-[clamp(9px,0.85cqw,12px)] font-extrabold ${isYou ? "text-white/85" : "text-[#64748B]"}`}>
            <span>{speakerName(line.speaker)}{line.to ? ` → ${speakerName(line.to)}` : ""}</span>
            <span className={`rounded-full px-[0.5cqw] ${isYou ? "bg-white/20" : "bg-[#EEF2FF] text-[#4F46E5]"}`}>{talkKindLabel[talk!.conv.kind]}</span>
          </div>
          {talk!.phase === "typing"
            ? <div className="mt-[0.45cqw] flex gap-[0.35cqw] py-[0.25cqw]" aria-label="typing">{[0, 1, 2].map((i) => <motion.span key={i} className={`h-[0.55cqw] w-[0.55cqw] rounded-full ${isYou ? "bg-white" : "bg-[#94A3B8]"}`} animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />)}</div>
            : <p className="mt-[0.3cqw] text-[clamp(11px,1.2cqw,16px)] font-semibold leading-snug">{line.text}</p>}
        </div>
      </motion.div>
    )}</AnimatePresence>
  </>;
}

function AskManagerBar({ onAsk }: { onAsk: (text: string) => void }) {
  const [text, setText] = useState("");
  return <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (!t) return; onAsk(t); setText(""); }}>
    <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF6D6] text-[#CA8A04] sm:flex" aria-hidden="true"><Crown size={16} /></span>
    <label htmlFor="amo-ask" className="sr-only">Give the Manager an instruction</label>
    <input id="amo-ask" value={text} maxLength={160} onChange={(e) => setText(e.target.value)} placeholder='Ask the Manager, e.g. "Focus on cooperatives in Kano this week"' className={`h-9 min-w-0 flex-1 rounded-xl border border-[#DCE4F2] bg-[#F8FAFF] px-3 text-[12px] text-[#1E293B] placeholder:text-[#94A3B8] dark:border-white/10 dark:bg-[#22314E] dark:text-white ${focusRing}`} />
    <button type="submit" disabled={!text.trim()} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1F67ED] to-[#504BEB] px-3 text-[12px] font-bold text-white shadow-[0_4px_14px_rgba(31,103,237,.25)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}><Send size={13} />Send</button>
  </form>;
}

function NotesSheet({ open, setOpen, notes, now, darkMode }: { open: boolean; setOpen: (open: boolean) => void; notes: MeetingNote[]; now: number; darkMode: boolean }) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className={`${darkMode ? "dark !border-white/10 !bg-[#121D32] !text-white" : ""} amo-scrollbar w-full overflow-y-auto border-l border-[#DCE5F2] bg-[#F8FAFE] px-5 pb-10 pt-7 text-[#263858] sm:max-w-[500px]`}>
        <SheetHeader className="text-left"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8ECFF] text-[#4A54E7]"><ScrollText size={19} /></span><div><SheetTitle className="text-[21px] font-black tracking-[-0.04em] text-[#20385E] dark:text-white">Meeting notes</SheetTitle><SheetDescription className="text-[11px] text-[#8997AC]">Every conversation in the collaboration room today, newest first.</SheetDescription></div></div></SheetHeader>
        {notes.length === 0 && <p className="mt-8 text-center text-[12px] text-[#8997AD]">No conversations yet. They'll appear here as the team talks.</p>}
        <div className="mt-5 space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-[#E3EAF5] bg-white p-4 dark:border-white/10 dark:bg-[#1B2A45]">
              <div className="flex items-start justify-between gap-2"><div><span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#4F46E5]">{talkKindLabel[note.kind]}</span><div className="mt-1 text-[13px] font-extrabold">{note.title}</div></div><span className="shrink-0 text-[10px] text-[#94A3B8]">{relativeTime(note.at, now)}</span></div>
              <div className="mt-2 space-y-1.5">{note.lines.map((l, i) => <p key={i} className="text-[12px] leading-relaxed text-[#475569] dark:text-[#C5D3E9]"><strong className="text-[#1E2B4D] dark:text-white">{speakerName(l.speaker)}{l.to ? ` → ${speakerName(l.to)}` : ""}:</strong> {l.text}</p>)}</div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[10px] text-[#94A1B4]">Simulated conversations. No real AI or messaging is used yet.</p>
      </SheetContent>
    </Sheet>
  );
}

function RoundTable({ leads, handoffs, pulse, approvals, onAgent, onHandoffComplete, paused, now, kpis, room }: {
  leads: Lead[]; handoffs: Handoff[]; pulse: Partial<Record<AgentId, AgentPulse>>;
  approvals: ApprovalDraft[]; onAgent: (id: AgentId) => void; onHandoffComplete: (id: string) => void;
  paused: boolean; now: number; kpis: Kpis; room: RoomProps;
}) {
 const talkLine = currentLine(room.talk);
 const inTalk = new Set<Speaker>(talkLine ? [talkLine.speaker, ...(talkLine.to ? [talkLine.to] : [])] : []);
 const managerLed = !!room.talk && room.talk.conv.kind !== "chat";
 const handsUp = Array.from(new Set(approvals.map((a) => a.agentId)));
 const lagosTime = new Date(now).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
 const desktop=useElementSize<HTMLDivElement>();
 const mobile=useElementSize<HTMLDivElement>();
 const reduce=Boolean(useReducedMotion());
 const agentState=(agent:Agent):{status:AgentStatus;task:string}=>{
   const recent=pulse[agent.id];
   if(recent && recent.until>now)return {status:recent.status,task:recent.task};
   if(approvals.some(d=>d.agentId===agent.id))return {status:"approval",task:"Draft waiting for your approval…"};
   return {status:agent.status==="approval"?"idle":agent.status,task:agent.currentTask};
 };
 const activeCount=leads.filter(l=>l.stage!=="Active").length;
 return <section className="min-w-0 overflow-hidden rounded-[19px] border border-[#C9D9FB] bg-white shadow-[0_12px_38px_rgba(50,82,160,.10)] dark:border-[#3E4F86] dark:bg-[#17233E]" aria-labelledby="coordination-title">
   <div className="flex flex-wrap items-center justify-between gap-2 bg-white/95 px-4 py-3 dark:bg-[#17233E]"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8ECFF] text-[#4A54E7]"><Bot size={16}/></span><div><h2 id="coordination-title" className="text-[13px] font-black tracking-tight">The collaboration room</h2><p className="text-[10px] text-[#8997B1] dark:text-[#AAB8D2]">Seven agents. One connected growth workflow.</p></div></div><div className="flex flex-wrap items-center gap-2"><div className="hidden rounded-full border border-[#DDE3FB] bg-[#F3F5FF] p-0.5 md:flex dark:border-white/10 dark:bg-[#23304A]" role="group" aria-label="Office view">{(["classic","live"] as const).map((v)=><button key={v} onClick={()=>room.setOfficeView(v)} aria-pressed={room.officeView===v} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${focusRing} ${room.officeView===v?"bg-white text-[#2250CC] shadow-sm dark:bg-[#344B77] dark:text-white":"text-[#6F7F9E] dark:text-[#AEC0DF]"}`}>{v==="classic"?"Classic office":`Live office${liveReadyCount()<agents.length?" · preview":""}`}</button>)}</div><span className="flex items-center gap-1.5 rounded-full bg-[#F1F5FD] px-2.5 py-1.5 text-[10px] font-bold text-[#475569] dark:bg-white/10 dark:text-[#C5D3E9]" title="Office time (Lagos)"><Clock3 size={12}/>{lagosTime} · Lagos</span><button onClick={room.onStandup} className={`flex items-center gap-1.5 rounded-full border border-[#DDE3FB] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#4A54E7] hover:bg-[#F3F5FF] dark:border-white/10 dark:bg-[#23304A] dark:text-[#AFC0FF] ${focusRing}`}><Users size={12}/>Start stand-up</button><button onClick={room.onNotes} className={`flex items-center gap-1.5 rounded-full border border-[#DDE3FB] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#4A54E7] hover:bg-[#F3F5FF] dark:border-white/10 dark:bg-[#23304A] dark:text-[#AFC0FF] ${focusRing}`}><ScrollText size={12}/>Meeting notes{room.notesCount>0?` · ${room.notesCount}`:""}</button><span className="flex items-center gap-1.5 rounded-full bg-[#E7FBF0] px-2.5 py-1.5 text-[10px] font-bold text-[#13915D]"><span className={`h-1.5 w-1.5 rounded-full bg-[#20C77C] ${paused?"":"animate-pulse"}`}/>{paused?"Paused":"Live office"}</span></div></div>
   {room.officeView==="live" && <div className="hidden md:block"><LiveOffice talk={room.talk} statusOf={(id)=>agentState(getAgent(id))} onAgent={onAgent} onArrived={room.onArrived} onReturned={room.onReturned} paused={paused} activeCount={activeCount} demos={kpis.demosBooked}
     calledIds={new Set(agents.filter(a=>managerLed&&a.id!=="manager"&&inTalk.has(a.id)).map(a=>a.id))}
     renderOverlays={(heads)=><><TalkLayer talk={room.talk} handsUp={handsUp.filter(hasSprites)} onRaiseHand={room.onRaiseHand} reduce={reduce} heads={heads}/><TransferOverlay handoffs={handoffs} onComplete={onHandoffComplete} mobile={false} reducedMotion={reduce} points={heads}/></>}/></div>}
   <div ref={desktop.ref} className={`amo-scene relative hidden w-full overflow-hidden bg-[#BED6FF] ${room.officeView==="live"?"":"md:block"}`} style={{containerType:"inline-size",aspectRatio:"1033 / 509",backgroundImage:`linear-gradient(90deg, rgba(16,51,140,.06), transparent 28%, transparent 72%,rgba(16,51,140,.05)),url(${officeScene})`,backgroundSize:"cover",backgroundPosition:"center"}}>
     <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#9DBEFF]/25 to-transparent"/>
     {/* Integration: sized and centred over the "Active Leads" disc printed in the image. */}
     <div className="pointer-events-none absolute left-[52.4%] top-[60.3%] z-10 h-[20%] w-[29%] -translate-x-1/2 -translate-y-1/2">
       {/* Ambient: the table disc slowly "breathes" */}
       <motion.div className="flex h-full w-full flex-col items-center justify-center rounded-[50%] border-2 border-[#6CCEFF]/60 bg-[radial-gradient(ellipse_at_50%_40%,#2771F2,#1144BF)] text-center text-white" animate={reduce||paused?{boxShadow:"0 0 3cqw rgba(29,100,255,.52), inset 0 0 2.5cqw rgba(92,208,255,.32)"}:{boxShadow:["0 0 2.4cqw rgba(29,100,255,.45), inset 0 0 2cqw rgba(92,208,255,.28)","0 0 4.4cqw rgba(29,100,255,.75), inset 0 0 3.2cqw rgba(92,208,255,.45)","0 0 2.4cqw rgba(29,100,255,.45), inset 0 0 2cqw rgba(92,208,255,.28)"]}} transition={{duration:4,repeat:Infinity,ease:"easeInOut"}}><div className="text-[2.1cqw] font-black leading-none tracking-tight">{activeCount} Active Leads</div><div className="mt-[0.5cqw] text-[1.15cqw] font-bold text-[#D9EAFF]">• {kpis.demosBooked} Demos This Week</div></motion.div>
     </div>
     {agents.map(agent=>{const state=agentState(agent);return <DesktopAgentCard key={agent.id} agent={agent} status={state.status} task={state.task} onClick={()=>onAgent(agent.id)} called={managerLed&&agent.id!=="manager"&&inTalk.has(agent.id)} talking={inTalk.has(agent.id)}/>;})}
     <TalkLayer talk={room.talk} handsUp={handsUp} onRaiseHand={room.onRaiseHand} reduce={reduce}/>
     <TransferOverlay handoffs={handoffs} onComplete={onHandoffComplete} mobile={false} reducedMotion={reduce}/>
     <div className="pointer-events-none absolute bottom-2 left-3 z-30 hidden items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#5570A5] shadow-lg backdrop-blur-sm lg:flex"><CircleDot size={11} className="text-[#337BFF]"/>Click an agent to open their desk</div>
   </div>
   <div ref={mobile.ref} className="relative bg-gradient-to-br from-[#EEF5FF] via-[#F5F2FF] to-[#E9FBFF] p-3 dark:from-[#162846] dark:via-[#1E234D] dark:to-[#132D47] md:hidden"><div className="mb-3 rounded-2xl bg-gradient-to-r from-[#265DF1] to-[#764AF4] p-4 text-white"><div className="text-xs font-bold">FYNIX AI OFFICE</div><div className="mt-2 text-2xl font-black">{activeCount} active leads</div><div className="text-xs text-[#D9E6FF]">{kpis.demosBooked} demos booked today</div></div>{talkLine&&<div className="mb-3 rounded-2xl border border-[#DDE3FB] bg-white p-3 text-[12px] leading-snug text-[#334155] shadow-sm dark:border-white/10 dark:bg-[#1B2942] dark:text-[#D1DBED]" aria-live="polite"><div className="mb-1 text-[10px] font-extrabold text-[#4F46E5]">{talkKindLabel[room.talk!.conv.kind]} · {speakerName(talkLine.speaker)}{talkLine.to?` → ${speakerName(talkLine.to)}`:""}</div>{room.talk!.phase==="typing"?"…":talkLine.text}</div>}<div className="relative space-y-2">{agents.map(agent=>{const current=agentState(agent);return <MobileAgentCard key={agent.id} agent={agent} status={current.status} task={current.task} onClick={()=>onAgent(agent.id)}/>;})}</div><TransferOverlay handoffs={handoffs} onComplete={onHandoffComplete} mobile reducedMotion={reduce}/></div>
   <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-white px-4 py-2.5 text-[10px] font-medium text-[#7388B0] dark:bg-[#17233E] dark:text-[#A3B6D9]"><AskManagerBar onAsk={room.onAsk}/><span className="font-bold text-[#5379CB]">Simulation · No messages sent</span></div>
 </section>;
}

// Integration: restyled to match the design: coloured round icons, bold agent name, time on the right.
const feedIcon: Record<ActivityKind, { icon: LucideIcon; bg: string; fg: string }> = {
  research:   { icon: Search,       bg: "#E6F0FF", fg: "#2563EB" },
  content:    { icon: PenLine,      bg: "#F0EBFF", fg: "#7C3AED" },
  outreach:   { icon: Send,         bg: "#E8EDFF", fg: "#3B5BDB" },
  reply:      { icon: RefreshCw,    bg: "#FDE8F1", fg: "#DB2777" },
  demo:       { icon: CalendarDays, bg: "#FFF1D9", fg: "#D97706" },
  signup:     { icon: Handshake,    bg: "#F3E8FF", fg: "#9333EA" },
  onboarding: { icon: UserPlus,     bg: "#E3F8EC", fg: "#16A34A" },
  active:     { icon: CheckCircle2, bg: "#E3F8EC", fg: "#16A34A" },
  approval:   { icon: ShieldCheck,  bg: "#FFF1D9", fg: "#D97706" },
  system:     { icon: Crown,        bg: "#FFF6D6", fg: "#CA8A04" },
};

function ActivityFeed({ events, now }: {
  events: ActivityEvent[]; approvals: ApprovalDraft[]; now: number;
  onApprove: (id: string) => void; onReject: (id: string) => void;
  onEdit: (id: string) => void; onOpenInbox: () => void;
}) {
  return (
    <aside className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[19px] border border-[#E1E7F8] bg-white/95 shadow-[0_9px_28px_rgba(55,83,150,.08)] dark:border-[#364665] dark:bg-[#1B2942]" aria-label="Live activity feed">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3.5">
        <h2 className="flex items-center gap-2 text-[16px] font-black tracking-[-0.02em] text-[#14214A] dark:text-white"><Activity size={18} className="text-[#3B5BDB] dark:text-[#9DBBFF]" />Live Activity Feed</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5FAEF] px-2.5 py-1 text-[10px] font-bold text-[#138E53]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />Live</span>
      </div>
      <div className="amo-scrollbar max-h-[360px] min-h-0 flex-1 overflow-y-auto px-3 pb-2 2xl:max-h-none" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {events.slice(0, 15).map((event) => {
            const meta = feedIcon[event.kind]; const Icon = meta.icon; const agent = getAgent(event.agentId);
            return (
              <motion.div key={event.id} layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex items-start gap-3 border-b border-[#EEF1F8] px-1 py-2.5 last:border-b-0 dark:border-white/[0.06]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: meta.bg, color: meta.fg }}><Icon size={16} strokeWidth={2.3} /></span>
                <p className="min-w-0 flex-1 text-[12px] leading-[1.4] text-[#334155] dark:text-[#D1DBED]"><strong className="font-extrabold text-[#14214A] dark:text-white">{agent.name}</strong> {event.text.charAt(0).toLowerCase() + event.text.slice(1)}</p>
                <time className="shrink-0 pt-0.5 text-[10px] text-[#94A3B8]" dateTime={event.timestamp}>{relativeTime(event.timestamp, now)}</time>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function ApprovalPreview({ approvals, onApprove, onReject, onEdit, onOpenInbox, now }: {
 approvals:ApprovalDraft[];onApprove:(id:string)=>void;onReject:(id:string)=>void;onEdit:(id:string)=>void;onOpenInbox:()=>void;now:number;
}){
 const draft=approvals[0];
 return <div className="shrink-0 overflow-hidden rounded-[19px] border border-[#E1E7F8] bg-white/95 shadow-[0_9px_28px_rgba(55,83,150,.08)] dark:border-[#364665] dark:bg-[#1B2942]">
 <div className="flex items-center justify-between px-4 pb-2 pt-3.5"><h3 className="flex items-center gap-2 text-[16px] font-black tracking-[-0.02em] text-[#14214A] dark:text-white"><Inbox size={18} className="text-[#3B5BDB] dark:text-[#9DBBFF]"/>Approval Inbox{approvals.length>0&&<span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#E53E3E] px-1.5 text-[11px] font-black text-white">{approvals.length}</span>}</h3><button onClick={onOpenInbox} className={`flex items-center gap-1 text-[12px] font-bold text-[#2C65E6] dark:text-[#A4BAFF] ${focusRing}`}>View All <ArrowRight size={13}/></button></div>
 {draft?<div className="px-4 pb-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E6F0FF] text-[#235FE6]"><Mail size={17}/></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="truncate text-[13px] font-extrabold text-[#14214A] dark:text-white">{draft.subject}</div><span className="shrink-0 text-[10px] text-[#94A3B8]">{relativeTime(draft.createdAt, now)}</span></div><div className="mt-0.5 truncate text-[11px] text-[#8997B1]">{draft.channel} · Drafted by {getAgent(draft.agentId).name} · {draft.recipient.split(" · ")[0]}</div></div></div><p className="mt-3 line-clamp-2 rounded-xl bg-[#F3F5FD] px-3 py-2.5 text-[12px] leading-relaxed text-[#475569] dark:bg-[#253658] dark:text-[#C1D1ED]">“{draft.message}”</p><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={()=>onApprove(draft.id)} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#34D399] to-[#16A34A] text-[12px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(22,163,74,.7)] ${focusRing}`}><Check size={14}/>Approve</button><button onClick={()=>onEdit(draft.id)} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#ECEAFF] text-[12px] font-bold text-[#4F46E5] ${focusRing}`}><PenLine size={13}/>Edit</button><button onClick={()=>onReject(draft.id)} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#FBCFD4] bg-[#FFF3F4] text-[12px] font-bold text-[#DC2626] ${focusRing}`}><X size={14}/>Reject</button></div></div>:<div className="flex flex-col items-center gap-2 px-4 py-6 text-center"><CheckCircle2 size={26} className="text-[#20C88A]"/><b className="text-xs">All caught up</b><p className="text-[10px] text-[#8D9DB8]">No messages waiting for review.</p></div>}
 </div>;
}

function LeadCard({ lead, now, onInspect }: { lead: Lead; now: number; onInspect: (lead: Lead) => void }) {
  const agent = getAgent(lead.ownerId);
  return (
    <motion.button layout="position" layoutId={`amo-lead-${lead.id}`} onClick={() => onInspect(lead)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className={`group w-full rounded-[12px] border border-[#E6ECF6] bg-white p-2.5 text-left shadow-[0_3px_10px_rgba(44,68,113,0.025)] transition-colors hover:border-[#9FB8EE] hover:shadow-[0_8px_18px_rgba(41,74,141,0.08)] dark:border-white/[0.085] dark:bg-[#1B2942] dark:hover:border-[#7398ED] ${focusRing}`}>
      <div className="mb-2.5 flex items-start justify-between gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#E9EFFC] text-[11px] font-black text-[#3664C9] dark:bg-[#30466C] dark:text-[#B7CFFF]">{initials(lead.institution)}</span><span className={`rounded-md px-1.5 py-1 text-[9px] font-extrabold ${lead.type === "MFB" ? "bg-[#E7F0FF] text-[#3472D9] dark:bg-[#2A4468] dark:text-[#ABCCFF]" : lead.type === "Cooperative" ? "bg-[#E5F7F0] text-[#209A76] dark:bg-[#1E514A] dark:text-[#9AF4CD]" : "bg-[#F3EBFF] text-[#8866C6] dark:bg-[#453765] dark:text-[#CBB8FF]"}`}>{lead.type}</span></div>
      <div className="line-clamp-2 min-h-[34px] text-[11px] font-extrabold leading-[1.45] text-[#283A5C] dark:text-[#E3E9F5]">{lead.institution}</div>
      <div className="mt-1 text-[10px] text-[#93A0B4]">{lead.city}, {lead.state}</div>
      <div className="mt-3 flex items-center justify-between border-t border-[#EDF1F7] pt-2.5 dark:border-white/[0.075]"><span className="flex items-center gap-1.5 text-[9px] font-medium text-[#8998AF]"><Clock3 size={11} />{timeInStage(lead.stageEnteredAt, now)}</span><span className="flex items-center gap-1.5"><span className="text-[9px] font-medium text-[#9BA8BD]">{agent.initials}</span><span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black" style={{ background: `${agent.accent}24`, color: agent.accent }}>{agent.initials}</span></span></div>
    </motion.button>
  );
}
function PipelineBoard({ leads, now, onInspect }: { leads: Lead[]; now: number; onInspect: (lead: Lead) => void }) {
  return (
    <section className={`${surface} mt-5 overflow-hidden`} aria-labelledby="pipeline-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9EEF6] px-5 py-5 dark:border-white/10 sm:px-6"><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EAF0FF] text-[#3565D8] dark:bg-[#28426D] dark:text-[#98B6FF]"><Layers3 size={16} /></span><h2 id="pipeline-title" className="text-[15px] font-extrabold tracking-[-0.025em]">Live sales pipeline</h2><span className="rounded-full bg-[#EDF2FA] px-2 py-0.5 text-[10px] font-extrabold text-[#667C9F] dark:bg-[#2B3D58] dark:text-[#B1C3DE]">{leads.length} leads</span></div><p className="mt-1.5 pl-[42px] text-[11px] text-[#8D9BB1]">Same leads, same hand-offs. Drag-free updates as agents complete their work.</p></div><div className="flex items-center gap-2 text-[10px] text-[#8393AC]"><span className="h-1.5 w-1.5 rounded-full bg-[#36CD8F]" />Live synchronized <span className="mx-2 h-4 w-px bg-[#E3E9F4] dark:bg-white/10" /><span>Scroll to explore <ArrowRight className="inline" size={12} /></span></div></div>
      <div className="amo-scrollbar overflow-x-auto bg-[#F7F9FD] p-4 dark:bg-[#111B30] sm:p-5">
        <LayoutGroup id="amo-pipeline"><div className="grid min-w-[1250px] grid-cols-7 gap-2.5">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.stage === stage);
            return <div key={stage} className="min-h-[265px] rounded-[14px] border border-[#E8EDF6] bg-[#F3F6FD]/70 p-2 dark:border-white/[0.055] dark:bg-[#18243B]">
              <div className="mb-3 flex items-center justify-between gap-2 px-1 py-1.5"><div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: stageColors[stage] }} /><h3 className="whitespace-nowrap text-[11px] font-extrabold text-[#3B4D6E] dark:text-[#D0DDF0]">{stage}</h3></div><span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1 text-[10px] font-extrabold text-[#7A8BA8] dark:bg-[#2A3C58] dark:text-[#C4D3E9]">{stageLeads.length}</span></div>
              <div className="space-y-2.5"><AnimatePresence initial={false} mode="popLayout">{stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} now={now} onInspect={onInspect} />)}</AnimatePresence></div>
              {stageLeads.length === 0 && <div className="grid h-28 place-items-center rounded-xl border border-dashed border-[#DCE5F2] text-[10px] text-[#93A3BC] dark:border-white/10">No leads in this stage</div>}
            </div>;
          })}
        </div></LayoutGroup>
      </div>
    </section>
  );
}

function AgentSheet({ agentId, onClose, events, leads, approvals, pulse, now, darkMode }: {
  agentId: AgentId | null; onClose: () => void; events: ActivityEvent[]; leads: Lead[];
  approvals: ApprovalDraft[]; pulse: Partial<Record<AgentId, AgentPulse>>; now: number; darkMode: boolean;
}) {
  const agent = agentId ? getAgent(agentId) : null;
  const assignedLeads = agentId ? leads.filter((lead) => lead.ownerId === agentId) : [];
  const roleVerb: Record<AgentId, string> = {
    researcher: "Qualify", writer: "Prepare campaign for", sales: "Contact", followup: "Engage",
    secretary: "Coordinate demo with", onboarding: "Activate", manager: "Monitor",
  };
  const liveQueue = assignedLeads.slice(0, 4).map((lead) => ({
    id: `live-queue-${lead.id}`, agentId: lead.ownerId, leadId: lead.id,
    title: `${roleVerb[lead.ownerId]} ${lead.institution}`,
    status: "queued" as const, createdAt: lead.stageEnteredAt,
  }));
  const relevantTasks = [...liveQueue, ...(agentId ? initialTasks.filter((task) => task.agentId === agentId) : [])];
  const relevantEvents = agentId ? events.filter((event) => event.agentId === agentId).slice(0, 5) : [];
  const drafts = agentId ? approvals.filter((draft) => draft.agentId === agentId) : [];
  return (
    <Sheet open={Boolean(agentId)} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className={`${darkMode ? "dark !border-white/10 !bg-[#121D32] !text-white" : ""} amo-scrollbar w-full overflow-y-auto border-l border-[#DCE5F2] bg-[#F8FAFE] px-5 pb-8 pt-7 text-[#263858] sm:max-w-[460px]`}>
        {agent && <>
          <SheetHeader className="text-left"><div className="mb-4 flex items-center gap-3"><AgentAvatar agent={agent} /><div><SheetTitle className="text-[20px] font-black tracking-[-0.04em] text-[#20385E] dark:text-white">{agent.name}</SheetTitle><SheetDescription className="mt-1 text-[12px] text-[#8290AA]">{agent.role} · AI team member</SheetDescription></div></div></SheetHeader>
          <div className="mb-5 rounded-2xl border border-[#DCE8F9] bg-gradient-to-br from-[#EAF1FF] to-white p-4 dark:border-[#35517C] dark:from-[#223C65] dark:to-[#182942]"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#4675C5] dark:text-[#B7CEFF]"><StatusMark status={pulse[agent.id]?.until && pulse[agent.id]!.until > now ? pulse[agent.id]!.status : agent.status} />Current assignment</div><div className="mt-2 text-[13px] font-bold text-[#2D4672] dark:text-[#E7F0FF]">{pulse[agent.id]?.until && pulse[agent.id]!.until > now ? pulse[agent.id]!.task : agent.currentTask}</div><p className="mt-2 text-[11px] leading-relaxed text-[#8293B2] dark:text-[#B0C3E1]">{agent.description}</p></div>
          <div className="grid grid-cols-3 gap-2"><div className="rounded-xl border border-[#E3EAF4] bg-white p-3 dark:border-white/10 dark:bg-[#1B2A45]"><div className="text-[21px] font-black">{agent.tasksCompleted}</div><div className="mt-1 text-[10px] text-[#8796B0]">Completed</div></div><div className="rounded-xl border border-[#E3EAF4] bg-white p-3 dark:border-white/10 dark:bg-[#1B2A45]"><div className="text-[21px] font-black">{agent.accuracy}%</div><div className="mt-1 text-[10px] text-[#8796B0]">Quality</div></div><div className="rounded-xl border border-[#E3EAF4] bg-white p-3 dark:border-white/10 dark:bg-[#1B2A45]"><div className="text-[21px] font-black">{assignedLeads.length}</div><div className="mt-1 text-[10px] text-[#8796B0]">Assigned</div></div></div>
          <div className="my-5 rounded-2xl border border-[#E3EAF4] bg-white p-4 dark:border-white/10 dark:bg-[#1B2A45]"><div className="flex items-center justify-between"><h3 className="text-[12px] font-extrabold">7-day activity</h3><span className="flex items-center gap-1 text-[10px] font-bold text-[#18A878]"><TrendingUp size={12} />Trending up</span></div><div className="mt-4"><MiniBars values={agent.trend} accent={agent.accent} tall /></div><div className="mt-2 flex justify-between text-[9px] font-medium text-[#9CA9BC]"><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span><span>MON</span><span>TUE</span><span>WED</span></div></div>
          <div className="mb-5"><div className="mb-2 flex items-center justify-between"><h3 className="text-[12px] font-extrabold">Task queue</h3><span className="rounded-full bg-[#E7EEF9] px-2 py-0.5 text-[10px] font-bold text-[#5F759E] dark:bg-[#273B5B] dark:text-[#C3D3EA]">{relevantTasks.length}</span></div><div className="space-y-2">{relevantTasks.map((task) => <div key={task.id} className="flex gap-2.5 rounded-xl border border-[#E2E9F3] bg-white p-3 dark:border-white/10 dark:bg-[#1B2A45]"><span className="mt-0.5"><CircleDot size={15} className={task.status === "waiting-approval" ? "text-amber-500" : "text-[#3B6FE8]"} /></span><div><p className="text-[11px] font-semibold leading-relaxed">{task.title}</p><span className="mt-1 block text-[10px] capitalize text-[#95A3B9]">{task.status.replace("-", " ")}</span></div></div>)}</div></div>
          <div className="mb-5"><h3 className="mb-2 text-[12px] font-extrabold">Recent actions</h3><div className="space-y-2">{relevantEvents.length ? relevantEvents.map((event) => <div key={event.id} className="flex justify-between gap-3 border-b border-[#E8EDF5] pb-2.5 text-[11px] dark:border-white/10"><span className="font-medium text-[#62738E] dark:text-[#C5D3E9]">{event.text}</span><span className="shrink-0 text-[10px] text-[#9AA8BB]">{relativeTime(event.timestamp, now)}</span></div>) : <p className="text-[11px] text-[#8B9AB3]">No recent actions.</p>}</div></div>
          <div><h3 className="mb-2 text-[12px] font-extrabold">Drafted messages</h3>{drafts.length ? drafts.map((draft) => <div key={draft.id} className="mb-2 rounded-xl border border-amber-300/50 bg-[#FFF9EF] p-3 dark:bg-[#3A332B]"><span className="text-[10px] font-extrabold text-[#A57931]">{draft.channel} · Pending approval</span><div className="mt-1 text-[11px] font-bold">{draft.subject}</div><p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-[#7E786F] dark:text-[#D0C4B2]">{draft.message}</p></div>) : <p className="text-[11px] text-[#8B9AB3]">No drafts waiting for approval.</p>}</div>
        </>}
      </SheetContent>
    </Sheet>
  );
}

function ApprovalSheet({ open, setOpen, approvals, editingId, setEditingId, onApprove, onReject, onSaveDraft, darkMode }: {
  open: boolean; setOpen: (open: boolean) => void; approvals: ApprovalDraft[];
  editingId: string | null; setEditingId: (id: string | null) => void;
  onApprove: (id: string) => void; onReject: (id: string) => void;
  onSaveDraft: (id: string, message: string) => void; darkMode: boolean;
}) {
  const [text, setText] = useState("");
  useEffect(() => { const draft = approvals.find((a) => a.id === editingId); if (draft) setText(draft.message); }, [editingId, approvals]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className={`${darkMode ? "dark !border-white/10 !bg-[#121D32] !text-white" : ""} amo-scrollbar w-full overflow-y-auto border-l border-[#DCE5F2] bg-[#F8FAFE] px-5 pb-10 pt-7 text-[#263858] sm:max-w-[520px]`}>
        <SheetHeader className="text-left"><div className="mb-1 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1D6] text-[#BE8434] dark:bg-[#57432A] dark:text-[#FFC97F]"><ShieldCheck size={20} /></span><div><SheetTitle className="text-[21px] font-black tracking-[-0.04em] text-[#20385E] dark:text-white">Approval inbox</SheetTitle><SheetDescription className="mt-0.5 text-[11px] text-[#8997AC]">AI-drafted content, reviewed by you before sending</SheetDescription></div></div></SheetHeader>
        <div className="my-5 flex items-center justify-between rounded-[14px] border border-[#E2EAF6] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1B2A45]"><span className="flex items-center gap-2 text-[12px] font-bold"><span className="h-2 w-2 animate-pulse rounded-full bg-[#E8A54A]" />Awaiting your decision</span><span className="rounded-full bg-[#FFF2D8] px-2.5 py-1 text-[11px] font-black text-[#B77819] dark:bg-[#62482B] dark:text-[#FFD089]">{approvals.length} pending</span></div>
        {approvals.length === 0 && <div className="flex flex-col items-center rounded-[22px] border border-dashed border-[#DCE5F2] bg-white py-14 text-center dark:border-white/10 dark:bg-[#18253C]"><span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F8EF] text-[#23AB75] dark:bg-[#1E4C3E]"><CheckCheck size={27} /></span><div className="text-[14px] font-extrabold">All caught up</div><p className="mt-1 max-w-[250px] text-[11px] leading-relaxed text-[#8997AD]">New drafts will appear here when an agent needs your approval.</p></div>}
        <div className="space-y-3">
          {approvals.map((draft) => <div key={draft.id} className="overflow-hidden rounded-[18px] border border-[#E3EAF5] bg-white dark:border-white/10 dark:bg-[#1B2A45]">
            <div className="flex items-start justify-between gap-2 border-b border-[#EDF1F7] px-4 py-3.5 dark:border-white/10"><div><span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#4E72B1] dark:text-[#A1BAE9]"><Mail size={12} />{draft.channel}</span><div className="mt-1 text-[12px] font-extrabold">{draft.recipient}</div></div><span className="shrink-0 rounded-full bg-[#FFF4DC] px-2 py-1 text-[9px] font-bold text-[#BE872E] dark:bg-[#514028] dark:text-[#F5C787]">Awaiting review</span></div>
            <div className="px-4 py-4"><div className="text-[11px] font-bold">{draft.subject}</div>{editingId === draft.id ? <div className="mt-3"><label htmlFor={`edit-${draft.id}`} className="mb-1.5 block text-[10px] font-semibold text-[#6E7F9E]">Edit message</label><Textarea id={`edit-${draft.id}`} value={text} onChange={(e: { target: { value: string } }) => setText(e.target.value)} className="min-h-[128px] border-[#D7E1F1] bg-[#FAFCFF] text-[12px] leading-relaxed dark:border-white/15 dark:bg-[#233552]" /><div className="mt-2 flex gap-2"><Button size="sm" className="h-8 bg-[#2250CC] text-[11px] hover:bg-[#3B6FE8]" onClick={() => { onSaveDraft(draft.id, text); setEditingId(null); }}>Save draft</Button><Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => setEditingId(null)}>Cancel</Button></div></div> : <p className="mt-2 whitespace-pre-line text-[11px] leading-[1.7] text-[#657793] dark:text-[#C1CEE1]">{draft.message}</p>}</div>
            <div className="flex flex-wrap gap-2 border-t border-[#EDF1F7] px-4 py-3 dark:border-white/10"><Button onClick={() => onApprove(draft.id)} size="sm" className="h-8 bg-[#2250CC] text-[11px] font-bold text-white hover:bg-[#3B6FE8]"><Check size={13} className="mr-1.5" />Approve</Button><Button onClick={() => { setEditingId(draft.id); setText(draft.message); }} size="sm" variant="outline" className="h-8 border-[#DCE5F2] bg-white text-[11px] font-bold text-[#506488] dark:border-white/15 dark:bg-[#273754] dark:text-[#D3E0F0]"><PenLine size={12} className="mr-1.5" />Edit</Button><Button onClick={() => onReject(draft.id)} size="sm" variant="outline" className="h-8 border-[#F2D6D6] bg-white text-[11px] font-bold text-[#C46E6E] dark:border-[#765051] dark:bg-[#273754] dark:text-[#FFB0B0]"><X size={12} className="mr-1.5" />Reject</Button></div>
          </div>)}
        </div>
        <p className="mt-5 text-center text-[10px] leading-relaxed text-[#94A1B4]">Demo mode: Approve updates the simulated pipeline only. Nothing is sent externally.</p>
      </SheetContent>
    </Sheet>
  );
}

function LeadSheet({ lead, onClose, now, darkMode }: { lead: Lead | null; onClose: () => void; now: number; darkMode: boolean }) {
  const agent = lead ? getAgent(lead.ownerId) : null;
  return <Sheet open={Boolean(lead)} onOpenChange={(open: boolean) => !open && onClose()}><SheetContent side="right" className={`${darkMode ? "dark !border-white/10 !bg-[#121D32] !text-white" : ""} amo-scrollbar w-full overflow-y-auto border-[#E0E7F2] bg-[#F8FAFE] p-6 text-[#263858] sm:max-w-[420px]`}>{lead && agent && <><SheetHeader className="mb-6 text-left"><div className="mb-2 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#E8EFFD] text-lg font-black text-[#2250CC] dark:bg-[#2B4575] dark:text-[#B6CCFF]">{initials(lead.institution)}</div><SheetTitle className="text-[22px] font-black leading-tight tracking-[-0.035em] text-[#26395A] dark:text-white">{lead.institution}</SheetTitle><SheetDescription className="text-[12px] text-[#8290AA]">{lead.city}, {lead.state} · {lead.type}</SheetDescription></SheetHeader><div className="mb-4 flex gap-2"><span className="rounded-lg px-3 py-1.5 text-[11px] font-bold" style={{ color: stageColors[lead.stage], background: `${stageColors[lead.stage]}1E` }}>{lead.stage}</span><span className="rounded-lg bg-[#EDF2FA] px-3 py-1.5 text-[11px] font-bold text-[#657B9F] dark:bg-[#293B5B] dark:text-[#C3D3E8]">{lead.priority} priority</span></div><div className="space-y-4 rounded-2xl border border-[#E2E9F4] bg-white p-4 dark:border-white/10 dark:bg-[#1C2A44]">{[["Primary contact", lead.contact], ["Demo contact", lead.email], ["Time in current stage", timeInStage(lead.stageEnteredAt, now)], ["Assigned agent", agent.name]].map(([title, value]) => <div key={title}><div className="text-[10px] font-semibold text-[#8D9BB1]">{title}</div><div className="mt-1 break-words text-[12px] font-extrabold">{value}</div></div>)}</div><div className="mt-5 rounded-xl border border-[#D9E6FA] bg-[#EAF2FE] p-4 text-[11px] leading-relaxed text-[#5473A9] dark:border-[#35517E] dark:bg-[#22385A] dark:text-[#ADC5ED]"><ShieldCheck size={15} className="mb-2" />This is a fictional demonstration institution. This portal does not contact or store real leads.</div></>}</SheetContent></Sheet>;
}

const replacementInstitutions: Array<[string, Lead["type"], string, string, string]> = [
  ["Orchardline Community MFB", "MFB", "Ibadan", "Oyo", "Bola Ajayi"],
  ["Keystonevale Farmers Cooperative", "Cooperative", "Sokoto", "Sokoto", "Aisha Mohammed"],
  ["Prairiebridge Credit Services", "Lender", "Ikeja", "Lagos", "Kunle Eze"],
  ["Goldhaven Workers Cooperative", "Cooperative", "Zaria", "Kaduna", "Chinedu Usman"],
  ["Meadowlight Microfinance Bank", "MFB", "Umuahia", "Abia", "Zainab Obi"],
];

export default function AiMarketingOffice() {
  // Integration: light-first, as requested. The dark-mode toggle in the header still works.
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState<OfficeMode>("approval");
  const [paused, setPaused] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(() => initialLeads.map((lead) => ({ ...lead })));
  const [events, setEvents] = useState<ActivityEvent[]>(() => initialEvents.map((event) => ({ ...event })));
  const [approvals, setApprovals] = useState<ApprovalDraft[]>(() => initialApprovals.map((draft) => ({ ...draft })));
  const [kpis, setKpis] = useState<Kpis>({ ...startingKpis });
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [pulse, setPulse] = useState<Partial<Record<AgentId, AgentPulse>>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const turn = useRef(0);
  const inFlight = useRef<Handoff[]>([]);
  const leadsRef = useRef(leads);
  const approvalsRef = useRef(approvals);
  const modeRef = useRef(mode);
  const completedFlights = useRef<Set<string>>(new Set());

  useEffect(() => { leadsRef.current = leads; }, [leads]);
  useEffect(() => { approvalsRef.current = approvals; }, [approvals]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  const addEvent = useCallback((event: Omit<ActivityEvent, "id" | "timestamp">) => {
    setEvents((previous) => [{ ...event, id: `event-${uid()}`, timestamp: nowIso() }, ...previous].slice(0, 85));
  }, []);
  const pulseAgent = useCallback((id: AgentId, status: AgentStatus, task: string, duration = 4800) => {
    setPulse((previous) => ({ ...previous, [id]: { status, task, until: Date.now() + duration } }));
  }, []);

  // ── Collaboration room conversation engine (simulated) ─────────────────────
  const [talk, setTalk] = useState<ActiveTalk | null>(null);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [queueTick, setQueueTick] = useState(0);
  const talkQueue = useRef<Conversation[]>([]);
  // Office view: the Level 2 live office becomes the default once every robot has artwork.
  const [officeView, setOfficeViewState] = useState<OfficeView>(() => {
    try { const saved = localStorage.getItem("amo-office-view"); if (saved === "classic" || saved === "live") return saved; } catch { /* storage unavailable */ }
    return liveReadyCount() === agents.length ? "live" : "classic";
  });
  const setOfficeView = useCallback((view: OfficeView) => { setOfficeViewState(view); try { localStorage.setItem("amo-office-view", view); } catch { /* ignore */ } }, []);
  const liveRef = useRef(officeView === "live");
  useEffect(() => { liveRef.current = officeView === "live"; }, [officeView]);
  const walks = (conv: Conversation) => Boolean(conv.visit) && liveRef.current;
  const onArrived = useCallback((convId: string) => setTalk((t) => (t && t.conv.id === convId && t.phase === "arriving" ? { ...t, phase: "typing" } : t)), []);
  const onReturned = useCallback((convId: string) => setTalk((t) => (t && t.conv.id === convId && t.phase === "leaving" ? null : t)), []);
  /** Queue a conversation. Your instructions and stand-ups jump the queue; casual chats are dropped if the room is busy. */
  const enqueueTalk = useCallback((conv: Conversation, priority = false) => {
    if (!conv.lines.length) return;
    if (priority) talkQueue.current = [conv, ...talkQueue.current.filter((c) => c.kind !== "chat")];
    else if (talkQueue.current.length < 2) talkQueue.current = [...talkQueue.current, conv];
    else return;
    setQueueTick((t) => t + 1);
  }, []);
  useEffect(() => {
    if (talk || paused) return;
    const next = talkQueue.current.shift();
    if (next) setTalk({ conv: next, index: 0, phase: walks(next) ? "arriving" : "typing" });
  }, [talk, paused, queueTick]);
  useEffect(() => {
    if (!talk || paused) return;
    // "arriving"/"leaving" normally end when the walking robot reports back; the timeout is a safety net.
    const ms = talk.phase === "typing" ? TALK_TYPING_MS : talk.phase === "speaking" ? TALK_SPEAK_MS : 12_000;
    const timer = window.setTimeout(() => {
      if (talk.phase === "arriving") { setTalk({ ...talk, phase: "typing" }); return; }
      if (talk.phase === "leaving") { setTalk(null); return; }
      if (talk.phase === "typing") { setTalk({ ...talk, phase: "speaking" }); return; }
      if (talk.index + 1 < talk.conv.lines.length) { setTalk({ ...talk, index: talk.index + 1, phase: "typing" }); return; }
      setNotes((previous) => [{ ...talk.conv, at: nowIso() }, ...previous].slice(0, 60));
      setTalk(walks(talk.conv) ? { ...talk, phase: "leaving" } : null);
    }, ms);
    return () => window.clearTimeout(timer);
  }, [talk, paused]);

  const startStandup = useCallback(() => {
    const team = agents.filter((a) => a.id !== "manager");
    enqueueTalk({
      id: `standup-${uid()}`, kind: "standup", title: "Daily stand-up",
      lines: [
        { speaker: "manager", text: "Good morning team! Stand-up time. Quick updates, please." },
        ...team.map((a): TalkLine => ({ speaker: a.id, to: "manager", text: statusReport(a.id, leadsRef.current) })),
        { speaker: "manager", text: "Thanks, all. Today's priority: book more demos." },
      ],
    }, true);
  }, [enqueueTalk]);
  // Hold a stand-up shortly after the office opens.
  useEffect(() => { const t = window.setTimeout(startStandup, 2500); return () => window.clearTimeout(t); }, [startStandup]);
  // Every so often the Manager calls an agent for a quick update.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const team = agents.filter((a) => a.id !== "manager");
      const a = team[Math.floor(Math.random() * team.length)];
      const visitor: AgentId | undefined = canWalk(a.id) ? a.id : canWalk("manager") ? "manager" : undefined;
      const visit = visitor ? { visitor, host: visitor === "manager" ? a.id : "manager" as AgentId } : undefined;
      enqueueTalk({ id: `call-${uid()}`, kind: "call", visit, title: visitor === "manager" ? `Manager visited ${a.name}'s desk` : `Manager called ${a.name}`, lines: [
        { speaker: "manager", to: a.id, text: managerQuestion[a.id] },
        { speaker: a.id, to: "manager", text: statusReport(a.id, leadsRef.current) },
      ] });
    }, 20_000);
    return () => window.clearInterval(id);
  }, [paused, enqueueTalk]);
  const askManager = useCallback((text: string) => {
    const team = routeInstruction(text);
    const names = team.map((id) => getAgent(id).name).join(" and ");
    enqueueTalk({ id: `ask-${uid()}`, kind: "ask", title: `You: "${text}"`, lines: [
      { speaker: "you", to: "manager", text },
      { speaker: "manager", text: `Understood. ${names}, please take this on.` },
      ...team.map((id): TalkLine => ({ speaker: id, to: "manager", text: askAck[id] })),
    ] }, true);
    addEvent({ agentId: "manager", kind: "system", text: `Received your instruction: "${text}" · assigned to ${names}` });
  }, [enqueueTalk, addEvent]);
  const beginHandoff = useCallback((lead: Lead, nextStage: PipelineStage) => {
    if (inFlight.current.some((flight) => flight.leadId === lead.id)) return;
    const flight: Handoff = { id: `flight-${uid()}`, leadId: lead.id, label: lead.institution, from: agentForStage(lead.stage), to: destinationAgentFor(lead.stage), nextStage, startedAt: Date.now() };
    inFlight.current = [...inFlight.current, flight];
    setHandoffs([...inFlight.current]);
    pulseAgent(flight.from, "working", `Passing ${lead.institution} to ${getAgent(flight.to).name}…`, 3200);
  }, [pulseAgent]);
  const beginContentHandoff = useCallback(() => {
    const flight: Handoff = { id: `content-${uid()}`, label: "Fresh campaign copy", from: "writer", to: "sales", nextStage: null, startedAt: Date.now() };
    inFlight.current = [...inFlight.current, flight]; setHandoffs([...inFlight.current]);
    pulseAgent("writer", "working", "Sending new outreach copy to Sales…", 3000);
  }, [pulseAgent]);

  const completeHandoff = useCallback((id: string) => {
    if (completedFlights.current.has(id)) return;
    const flight = inFlight.current.find((item) => item.id === id);
    if (!flight) return;
    completedFlights.current.add(id);
    inFlight.current = inFlight.current.filter((item) => item.id !== id);
    setHandoffs([...inFlight.current]);
    pulseAgent(flight.from, "done", "Hand-off completed successfully", 1700);
    if (!flight.leadId || !flight.nextStage) {
      pulseAgent("sales", "working", "Using the latest campaign copy…", 5500);
      addEvent({ agentId: "writer", kind: "content", text: "Passed a new campaign email draft to Sales Rep" });
      enqueueTalk({ id: `chat-${uid()}`, kind: "chat", title: "Content Writer → Sales Rep", lines: handoffChat("writer", "sales", null, "") });
      return;
    }
    const lead = leadsRef.current.find((item) => item.id === flight.leadId);
    if (!lead || nextStageOf(lead.stage) !== flight.nextStage) return;
    const stage = flight.nextStage;
    setLeads((previous) => previous.map((item) => item.id === lead.id ? { ...item, stage, ownerId: destinationAgentFor(lead.stage), stageEnteredAt: nowIso() } : item));
    pulseAgent(flight.to, "working", `Working on ${lead.institution}…`, 5800);
    addEvent({ agentId: flight.to, kind: activityKindForStage(stage), text: stageMessages[stage](lead.institution), leadId: lead.id });
    enqueueTalk({ id: `chat-${uid()}`, kind: "chat", title: `${getAgent(flight.from).name} → ${getAgent(flight.to).name}: ${lead.institution}`, lines: handoffChat(flight.from, flight.to, stage, lead.institution) });
    setKpis((previous) => ({ ...previous,
      messagesSent: previous.messagesSent + (stage === "Contacted" ? 1 : 0),
      replies: previous.replies + (stage === "Replied" ? 1 : 0),
      demosBooked: previous.demosBooked + (stage === "Demo Booked" ? 1 : 0),
      clientsConverted: previous.clientsConverted + (stage === "Signed Up" ? 1 : 0),
    }));
  }, [addEvent, pulseAgent, enqueueTalk]);

  const approveDraft = useCallback((id: string) => {
    const draft = approvalsRef.current.find((item) => item.id === id);
    if (!draft) return;
    const lead = leadsRef.current.find((item) => item.id === draft.leadId);
    setApprovals((previous) => previous.filter((item) => item.id !== id));
    if (lead && nextStageOf(lead.stage) === draft.nextStage) {
      beginHandoff(lead, draft.nextStage);
      addEvent({ agentId: draft.agentId, kind: "system", leadId: lead.id, text: `Approved ${draft.channel.toLowerCase()} draft for ${lead.institution}` });
    } else addEvent({ agentId: draft.agentId, kind: "system", text: `Archived outdated draft for ${draft.recipient.split(" · ")[0]}` });
  }, [addEvent, beginHandoff]);
  const rejectDraft = useCallback((id: string) => {
    const draft = approvalsRef.current.find((item) => item.id === id); if (!draft) return;
    setApprovals((previous) => previous.filter((item) => item.id !== id));
    addEvent({ agentId: draft.agentId, kind: "system", leadId: draft.leadId, text: `Draft rejected for ${draft.recipient.split(" · ")[0]}; lead kept in queue` });
  }, [addEvent]);
  const saveDraft = useCallback((id: string, message: string) => {
    setApprovals((previous) => previous.map((draft) => draft.id === id ? { ...draft, message } : draft));
    const draft = approvalsRef.current.find((item) => item.id === id);
    if (draft) addEvent({ agentId: draft.agentId, kind: "system", text: `Human edited ${draft.channel.toLowerCase()} draft for ${draft.recipient.split(" · ")[0]}` });
  }, [addEvent]);
  const openDraftEditor = useCallback((id: string) => { setEditingId(id); setApprovalOpen(true); }, []);
  const changeMode = (next: OfficeMode) => {
    setMode(next);
    modeRef.current = next;
    if (next === "autopilot") {
      const queued = approvalsRef.current;
      if (queued.length) {
        // This is only a simulation: releasing drafts does not send anything externally.
        approvalsRef.current = [];
        setApprovals([]);
        queued.slice(0, 3).forEach((draft) => {
          const lead = leadsRef.current.find((item) => item.id === draft.leadId);
          if (lead && nextStageOf(lead.stage) === draft.nextStage) beginHandoff(lead, draft.nextStage);
        });
        addEvent({ agentId: "manager", kind: "system", text: `Autopilot started · ${queued.length} review drafts released to the simulated queue` });
      }
    } else {
      addEvent({ agentId: "manager", kind: "system", text: "Human approval required for every new outbound message" });
    }
  };

  useEffect(() => {
    if (paused) return;
    const run = () => {
      if (inFlight.current.length >= 3) return;
      turn.current += 1;
      if (turn.current % 7 === 0 && !inFlight.current.some((flight) => flight.from === "writer")) {
        beginContentHandoff(); return;
      }
      const activeIds = new Set(inFlight.current.map((flight) => flight.leadId));
      const pendingIds = new Set(approvalsRef.current.map((draft) => draft.leadId));
      const eligible = leadsRef.current.filter((lead) => nextStageOf(lead.stage) && !activeIds.has(lead.id) && !pendingIds.has(lead.id));
      if (!eligible.length) {
        // Keep the long-running demo alive after every lead eventually activates.
        const recycled = leadsRef.current.find((lead) => lead.stage === "Active" && !activeIds.has(lead.id));
        if (recycled) {
          const seed = replacementInstitutions[turn.current % replacementInstitutions.length];
          setLeads((previous) => previous.map((lead) => lead.id === recycled.id ? { ...lead, institution: seed[0], type: seed[1], city: seed[2], state: seed[3], contact: seed[4], email: "demo@example.invalid", stage: "Found", ownerId: "researcher", stageEnteredAt: nowIso() } : lead));
          setKpis((previous) => ({ ...previous, leadsFound: previous.leadsFound + 1 }));
          addEvent({ agentId: "researcher", kind: "research", text: `Discovered a new potential client: ${seed[0]}` });
        }
        return;
      }
      // A rotating selection avoids repeatedly favouring the first card in the board.
      const lead = eligible[(turn.current * 3) % eligible.length];
      const nextStage = nextStageOf(lead.stage)!;
      const requiresReview = modeRef.current === "approval" && ["Found", "Contacted"].includes(lead.stage);
      if (requiresReview) {
        // In Approval mode, EVERY outbound message requires review; do not bypass a full inbox.
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
      } else beginHandoff(lead, nextStage);
    };
    const initial = window.setTimeout(run, 650);
    const interval = window.setInterval(run, 1_250);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [paused, addEvent, beginContentHandoff, beginHandoff, pulseAgent]);

  const resetDemo = () => {
    inFlight.current = []; completedFlights.current = new Set(); turn.current = 0;
    setHandoffs([]); setLeads(initialLeads.map((lead) => ({ ...lead })));
    setEvents(initialEvents.map((event) => ({ ...event })));
    setApprovals(initialApprovals.map((draft) => ({ ...draft })));
    setKpis({ ...startingKpis }); setPulse({}); setSelectedAgentId(null); setSelectedLead(null);
    setPaused(false); setMode("approval"); setApprovalOpen(false); setEditingId(null);
    talkQueue.current = []; setTalk(null); setNotes([]); setNotesOpen(false);
  };
  const room: RoomProps = {
    talk, notesCount: notes.length, onStandup: startStandup, onNotes: () => setNotesOpen(true),
    onAsk: askManager, onRaiseHand: () => setApprovalOpen(true),
    officeView, setOfficeView, onArrived, onReturned,
  };
  const currentLead = useMemo(() => selectedLead ? leads.find((item) => item.id === selectedLead.id) ?? selectedLead : null, [selectedLead, leads]);

  return (
    <div className={darkMode ? "dark" : ""}>
      <main className="amo-root relative min-h-screen bg-[#F5F7FF] text-[#233451] antialiased transition-colors duration-300 dark:bg-[#0D1428] dark:text-[#ECF2FF]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <style>{`.amo-root * {box-sizing:border-box}.amo-scrollbar{scrollbar-width:thin;scrollbar-color:#9CAED4 transparent}.amo-scrollbar::-webkit-scrollbar{width:6px;height:8px}.amo-scrollbar::-webkit-scrollbar-thumb{background:#A8B8D8;border-radius:40px}.dark .amo-scrollbar{scrollbar-color:#3D5175 transparent}.dark .amo-scrollbar::-webkit-scrollbar-thumb{background:#354B70}.amo-root button{touch-action:manipulation}.amo-kpi--blue{background:linear-gradient(135deg,#F6FAFF,#EAF3FF);border-color:#DCEBFF}.amo-kpi--purple{background:linear-gradient(135deg,#FAF9FF,#F0EDFF);border-color:#E9E1FF}.amo-kpi--mint{background:linear-gradient(135deg,#F6FFFD,#E7FCF5);border-color:#D5F7ED}.amo-kpi--gold{background:linear-gradient(135deg,#FFFCF8,#FFF2DB);border-color:#FAE9CC}.amo-kpi--pink{background:linear-gradient(135deg,#FFF9FD,#F9EAFE);border-color:#F0DDF8}.amo-kpi--blue .amo-kpi-icon{background:#DFECFF;color:#1869ED}.amo-kpi--purple .amo-kpi-icon{background:#EBE2FF;color:#7452EC}.amo-kpi--mint .amo-kpi-icon{background:#D8F8E9;color:#0BBA78}.amo-kpi--gold .amo-kpi-icon{background:#FFEACC;color:#D38919}.amo-kpi--pink .amo-kpi-icon{background:#F9DDFA;color:#CD36CB}.dark .amo-kpi{background:#1A2947;border-color:#354A70}.amo-beam{animation:amo-dash 1s linear infinite}@keyframes amo-dash{to{stroke-dashoffset:-30}}.amo-scene:after{content:"";pointer-events:none;position:absolute;inset:0;box-shadow:inset 0 0 18px rgba(50,85,195,.22)}@media(prefers-reduced-motion:reduce){.amo-root *{animation-duration:0.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}`}</style>
        <div className="pointer-events-none absolute left-1/2 top-0 h-[460px] w-full max-w-[1100px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(58,111,232,0.075),transparent_65%)] dark:bg-[radial-gradient(ellipse,rgba(58,111,232,0.10),transparent_65%)]" />
        <div className="relative flex min-h-screen"><OfficeSidebar/><div className="min-w-0 flex-1">
          <Header kpis={kpis} mode={mode} setMode={changeMode} paused={paused} setPaused={setPaused} darkMode={darkMode} setDarkMode={setDarkMode} approvalCount={approvals.length} onApprovals={() => setApprovalOpen(true)} onReset={resetDemo} />
          <div className="relative mx-auto max-w-[1740px] pb-10">
            {/* Integration: the office spans the full width so the scene is larger and more spacious;
                the activity feed and approval inbox sit side by side underneath it. */}
            <section className="grid min-w-0 grid-cols-1 gap-3 px-4 lg:px-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <RoundTable kpis={kpis} leads={leads} handoffs={handoffs} pulse={pulse} approvals={approvals} onAgent={setSelectedAgentId} onHandoffComplete={completeHandoff} paused={paused} now={now} room={room} />
              {/* On wide screens the side column is pinned to the office height (absolute inset-0), so no empty gap appears. */}
              <div className="relative min-w-0"><div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start 2xl:absolute 2xl:inset-0 2xl:flex 2xl:flex-col"><ActivityFeed events={events} approvals={approvals} now={now} onApprove={approveDraft} onReject={rejectDraft} onEdit={openDraftEditor} onOpenInbox={() => setApprovalOpen(true)} /><ApprovalPreview approvals={approvals} onApprove={approveDraft} onReject={rejectDraft} onEdit={openDraftEditor} onOpenInbox={() => setApprovalOpen(true)} now={now}/></div></div>
            </section>
            <div className="px-4 lg:px-5"><PipelineBoard leads={leads} now={now} onInspect={setSelectedLead} /></div>
            <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 text-[10px] text-[#9BA8BC] dark:text-[#7F91AE]"><span>© FynixCoBanking · AI Marketing Office</span><span>Fictional institutions · Local simulation · React / TypeScript</span></footer>
          </div>
        </div></div>
        <AgentSheet darkMode={darkMode} agentId={selectedAgentId} onClose={() => setSelectedAgentId(null)} events={events} leads={leads} approvals={approvals} pulse={pulse} now={now} />
        <ApprovalSheet darkMode={darkMode} open={approvalOpen} setOpen={setApprovalOpen} approvals={approvals} editingId={editingId} setEditingId={setEditingId} onApprove={approveDraft} onReject={rejectDraft} onSaveDraft={saveDraft} />
        <LeadSheet darkMode={darkMode} lead={currentLead} onClose={() => setSelectedLead(null)} now={now} />
        <NotesSheet open={notesOpen} setOpen={setNotesOpen} notes={notes} now={now} darkMode={darkMode} />
      </main>
    </div>
  );
}

export { AiMarketingOffice };
