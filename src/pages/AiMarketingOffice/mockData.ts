/**
 * FynixCoBanking · AI Marketing Office
 * All people, institutions, messages and metrics in this file are fictional demonstration data.
 * Replace these exports with API responses when the backend is available.
 */

export const STAGES = [
  "Found",
  "Contacted",
  "Replied",
  "Demo Booked",
  "Signed Up",
  "Onboarding",
  "Active",
] as const;

export type PipelineStage = (typeof STAGES)[number];
export type AgentId = "researcher" | "writer" | "sales" | "followup" | "secretary" | "onboarding" | "manager";
export type AgentStatus = "working" | "idle" | "approval" | "done";
export type LeadType = "MFB" | "Cooperative" | "Lender";
export type ActivityKind = "research" | "content" | "outreach" | "reply" | "demo" | "signup" | "onboarding" | "active" | "approval" | "system";
export type Channel = "Email" | "WhatsApp" | "LinkedIn post";

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  initials: string;
  accent: string;
  status: AgentStatus;
  currentTask: string;
  description: string;
  tasksCompleted: number;
  accuracy: number;
  trend: number[];
  position: { x: number; y: number }; // percentage coordinates on the desktop round table
}

export interface Lead {
  id: string;
  institution: string;
  type: LeadType;
  city: string;
  state: string;
  stage: PipelineStage;
  ownerId: AgentId;
  stageEnteredAt: string;
  contact: string;
  email: string;
  priority: "High" | "Medium" | "Normal";
}

export interface Task {
  id: string;
  agentId: AgentId;
  leadId?: string;
  title: string;
  status: "in-progress" | "queued" | "completed" | "waiting-approval";
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId: AgentId;
  kind: ActivityKind;
  text: string;
  leadId?: string;
  approvalId?: string;
}

export interface ApprovalDraft {
  id: string;
  leadId: string;
  agentId: AgentId;
  recipient: string;
  channel: Channel;
  subject: string;
  message: string;
  nextStage: PipelineStage;
  createdAt: string;
}

const ago = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();
const hAgo = (hours: number): string => ago(hours * 60);

export const agents: Agent[] = [
  {
    id: "researcher", name: "Researcher", role: "Lead discovery", initials: "RE", accent: "#60A5FA",
    status: "working", currentTask: "Finding licensed lenders in Oyo…",
    description: "Builds verified prospect lists across Nigerian financial institutions.",
    tasksCompleted: 46, accuracy: 97, trend: [5, 7, 6, 9, 8, 11, 13], position: { x: 50, y: 17 },
  },
  {
    id: "writer", name: "Content Writer", role: "Brand & content", initials: "CW", accent: "#AB8BF5",
    status: "working", currentTask: "Writing a core-banking insight…",
    description: "Produces educational posts, articles and personalised campaign copy.",
    tasksCompleted: 19, accuracy: 96, trend: [3, 4, 5, 4, 7, 8, 9], position: { x: 77, y: 24 },
  },
  {
    id: "sales", name: "Sales Rep", role: "First contact", initials: "SR", accent: "#36BCE9",
    status: "approval", currentTask: "Email draft awaiting approval…",
    description: "Prepares and sends the first institution-specific outreach.",
    tasksCompleted: 34, accuracy: 94, trend: [4, 6, 5, 8, 8, 10, 12], position: { x: 85, y: 55 },
  },
  {
    id: "followup", name: "Follow-up Officer", role: "Lead engagement", initials: "FO", accent: "#F0AC60",
    status: "working", currentTask: "Checking replies from lenders…",
    description: "Keeps conversations moving with thoughtful, timed follow-ups.",
    tasksCompleted: 27, accuracy: 92, trend: [2, 4, 4, 7, 5, 8, 10], position: { x: 71, y: 84 },
  },
  {
    id: "secretary", name: "Secretary", role: "Demo scheduling", initials: "SE", accent: "#F27FA0",
    status: "working", currentTask: "Preparing Thursday's demo slots…",
    description: "Coordinates demonstrations, confirmations and meeting notes.",
    tasksCompleted: 13, accuracy: 99, trend: [1, 2, 2, 3, 3, 4, 6], position: { x: 42, y: 85 },
  },
  {
    id: "onboarding", name: "Onboarding Officer", role: "Client activation", initials: "ON", accent: "#4AD6AF",
    status: "working", currentTask: "Preparing a cooperative workspace…",
    description: "Guides setup, imports, training and first successful usage.",
    tasksCompleted: 11, accuracy: 98, trend: [1, 2, 1, 3, 3, 4, 5], position: { x: 14, y: 72 },
  },
  {
    id: "manager", name: "Manager", role: "Office supervision", initials: "MG", accent: "#B5C7F5",
    status: "working", currentTask: "Reviewing conversion quality…",
    description: "Supervises hand-offs, quality standards and owner-facing reporting.",
    tasksCompleted: 57, accuracy: 99, trend: [6, 7, 7, 8, 9, 10, 12], position: { x: 16, y: 27 },
  },
];

// Institution names are invented and are only used to demonstrate the interface.
const leadSeed: Array<[string, LeadType, string, string, PipelineStage, AgentId, number, string, "High" | "Medium" | "Normal"]> = [
  ["Sunrise Microfinance Bank", "MFB", "Ibadan", "Oyo", "Found", "researcher", 2, "Ada Balogun", "High"],
  ["Grovecrest Cooperative", "Cooperative", "Ilorin", "Kwara", "Found", "researcher", 5, "Musa Salami", "Normal"],
  ["Marigold Community MFB", "MFB", "Abeokuta", "Ogun", "Found", "researcher", 9, "Chioma Oladele", "Medium"],
  ["Northfield Credit Partners", "Lender", "Kaduna", "Kaduna", "Found", "researcher", 15, "Yusuf Bello", "High"],
  ["Bridgeway Traders Cooperative", "Cooperative", "Makurdi", "Benue", "Found", "researcher", 26, "Grace Ade", "Normal"],
  ["Prime Lenders Ltd", "Lender", "Abuja", "FCT", "Contacted", "sales", 7, "Tomi Adebayo", "High"],
  ["Elmstone Microfinance Bank", "MFB", "Akure", "Ondo", "Contacted", "followup", 12, "Hassan Alli", "Medium"],
  ["Riverlane Thrift Cooperative", "Cooperative", "Osogbo", "Osun", "Contacted", "followup", 21, "Oluwaseun Akin", "Normal"],
  ["Bayrise Credit House", "Lender", "Uyo", "Akwa Ibom", "Contacted", "followup", 29, "Ima Essien", "Medium"],
  ["Olivebend Market Cooperative", "Cooperative", "Kano", "Kano", "Contacted", "followup", 39, "Nura Ibrahim", "Normal"],
  ["Unity Farmers Cooperative", "Cooperative", "Kano", "Kano", "Replied", "followup", 6, "Rabi Ismail", "High"],
  ["Cedarpoint Microfinance Bank", "MFB", "Enugu", "Enugu", "Replied", "followup", 13, "Ifeanyi Obi", "High"],
  ["Palmbridge Credit Union", "Cooperative", "Port Harcourt", "Rivers", "Replied", "followup", 20, "Emeka Okon", "Medium"],
  ["Fjordline Lending Services", "Lender", "Jos", "Plateau", "Replied", "followup", 31, "Maryam Yakubu", "Normal"],
  ["Clearhaven MFB", "MFB", "Lagos", "Lagos", "Demo Booked", "secretary", 4, "Dele Afolabi", "High"],
  ["Greenharbour Cooperative", "Cooperative", "Owerri", "Imo", "Demo Booked", "secretary", 18, "Chika Eze", "Medium"],
  ["Silveroak Lending Group", "Lender", "Asaba", "Delta", "Demo Booked", "secretary", 25, "Ovie Alao", "Normal"],
  ["Coralpath Microfinance Bank", "MFB", "Calabar", "Cross River", "Signed Up", "sales", 8, "Bassey Duke", "High"],
  ["Highmeadow Workers Cooperative", "Cooperative", "Minna", "Niger", "Signed Up", "sales", 21, "Sarah Sule", "Medium"],
  ["Stonecrest Finance Ltd", "Lender", "Ado-Ekiti", "Ekiti", "Signed Up", "sales", 32, "Femi Adekunle", "Normal"],
  ["Brightglen Cooperative", "Cooperative", "Katsina", "Katsina", "Onboarding", "onboarding", 5, "Fatima Lawal", "High"],
  ["Westpine Community MFB", "MFB", "Benin City", "Edo", "Onboarding", "onboarding", 16, "Osemwen Aigbe", "High"],
  ["Bluegate Lending Collective", "Lender", "Lokoja", "Kogi", "Onboarding", "onboarding", 23, "Ibrahim Sani", "Medium"],
  ["Mapleford Microfinance Bank", "MFB", "Lafia", "Nasarawa", "Active", "manager", 30, "Ijeoma Okafor", "High"],
  ["Hillcrest Savings Cooperative", "Cooperative", "Yola", "Adamawa", "Active", "manager", 48, "Binta Bello", "Medium"],
];

export const initialLeads: Lead[] = leadSeed.map(([institution, type, city, state, stage, ownerId, hours, contact, priority], i) => ({
  id: `lead-${String(i + 1).padStart(2, "0")}`,
  institution, type, city, state, stage, ownerId, contact, priority,
  email: `${contact.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, "")}@example.invalid`,
  stageEnteredAt: hAgo(hours),
}));

export const initialTasks: Task[] = [
  { id: "task-1", agentId: "researcher", leadId: "lead-04", title: "Verify Northfield Credit Partners decision-maker", status: "in-progress", createdAt: ago(4) },
  { id: "task-2", agentId: "researcher", leadId: "lead-03", title: "Find Marigold MFB product lead", status: "queued", createdAt: ago(14) },
  { id: "task-3", agentId: "writer", title: "Write: What modern loan servicing should feel like", status: "in-progress", createdAt: ago(9) },
  { id: "task-4", agentId: "writer", title: "Prepare November cooperative campaign post", status: "queued", createdAt: ago(26) },
  { id: "task-5", agentId: "sales", leadId: "lead-06", title: "Approve Prime Lenders' reply", status: "waiting-approval", createdAt: ago(3) },
  { id: "task-6", agentId: "sales", leadId: "lead-01", title: "Draft Sunrise MFB introduction", status: "queued", createdAt: ago(11) },
  { id: "task-7", agentId: "followup", leadId: "lead-08", title: "Follow up with Riverlane Cooperative", status: "in-progress", createdAt: ago(6) },
  { id: "task-8", agentId: "followup", leadId: "lead-07", title: "Check Elmstone MFB reply", status: "queued", createdAt: ago(18) },
  { id: "task-9", agentId: "secretary", leadId: "lead-11", title: "Confirm Unity Farmers demo time", status: "in-progress", createdAt: ago(12) },
  { id: "task-10", agentId: "secretary", leadId: "lead-12", title: "Share Cedarpoint MFB demo agenda", status: "queued", createdAt: ago(19) },
  { id: "task-11", agentId: "onboarding", leadId: "lead-21", title: "Complete Brightglen workspace setup", status: "in-progress", createdAt: ago(7) },
  { id: "task-12", agentId: "onboarding", leadId: "lead-22", title: "Schedule Westpine MFB operator training", status: "queued", createdAt: ago(20) },
  { id: "task-13", agentId: "manager", title: "Review current conversion forecast", status: "in-progress", createdAt: ago(8) },
  { id: "task-14", agentId: "manager", title: "Audit sales message quality", status: "queued", createdAt: ago(22) },
];

export const initialApprovals: ApprovalDraft[] = [
  {
    id: "approval-1", leadId: "lead-06", agentId: "sales", recipient: "Prime Lenders Ltd · Tomi Adebayo",
    channel: "Email", subject: "Re: Streamlining your lending operations",
    message: "Hello Tomi, thank you for your interest. FynixCoBanking can bring loan origination, repayments and reporting into one workspace. Would a 20-minute product walkthrough on Thursday be convenient?",
    nextStage: "Replied", createdAt: ago(3),
  },
  {
    id: "approval-2", leadId: "lead-01", agentId: "sales", recipient: "Sunrise Microfinance Bank · Ada Balogun",
    channel: "Email", subject: "A simpler way to manage loans and savings",
    message: "Hello Ada, I came across your institution in Ibadan. We help microfinance teams manage loans, savings, daily collections and reporting in one secure platform. Could I send you a brief overview?",
    nextStage: "Contacted", createdAt: ago(11),
  },
  {
    id: "approval-3", leadId: "lead-08", agentId: "followup", recipient: "Riverlane Thrift Cooperative · Oluwaseun Akin",
    channel: "WhatsApp", subject: "Product introduction follow-up",
    message: "Good afternoon. Just following up on the FynixCoBanking overview I sent. Is there a convenient time this week for a quick demonstration of the cooperative management features?",
    nextStage: "Replied", createdAt: ago(17),
  },
];

export const initialEvents: ActivityEvent[] = [
  { id: "event-1", timestamp: ago(1), agentId: "researcher", kind: "research", text: "Found 3 potential MFBs in Oyo State" },
  { id: "event-2", timestamp: ago(3), agentId: "sales", kind: "approval", text: "Approval needed: reply to Prime Lenders Ltd", leadId: "lead-06", approvalId: "approval-1" },
  { id: "event-3", timestamp: ago(6), agentId: "secretary", kind: "demo", text: "Confirmed Unity Farmers Cooperative demo · Thu, 10:00", leadId: "lead-11" },
  { id: "event-4", timestamp: ago(9), agentId: "writer", kind: "content", text: "Published article: 5 ways to modernise MFB operations" },
  { id: "event-5", timestamp: ago(14), agentId: "sales", kind: "outreach", text: "Sent introduction to Elmstone Microfinance Bank", leadId: "lead-07" },
  { id: "event-6", timestamp: ago(18), agentId: "followup", kind: "reply", text: "Received a response from Cedarpoint MFB", leadId: "lead-12" },
  { id: "event-7", timestamp: ago(23), agentId: "onboarding", kind: "onboarding", text: "Completed Brightglen Cooperative data checklist", leadId: "lead-21" },
  { id: "event-8", timestamp: ago(28), agentId: "manager", kind: "system", text: "Morning sales performance review completed" },
];

export const startingKpis = {
  leadsFound: 18,
  messagesSent: 31,
  replies: 12,
  demosBooked: 6,
  clientsConverted: 2,
};

/** A single source of truth for lead state, queue movements and task hand-offs. */
export const nextStageOf = (stage: PipelineStage): PipelineStage | null => {
  const index = STAGES.indexOf(stage);
  return index < STAGES.length - 1 ? STAGES[index + 1] : null;
};

/** The agent completing a stage hands its work to this agent. */
export const destinationAgentFor = (stage: PipelineStage): AgentId => ({
  Found: "sales", Contacted: "followup", Replied: "secretary",
  "Demo Booked": "sales", "Signed Up": "onboarding", Onboarding: "manager", Active: "manager",
} as const)[stage];

export const agentForStage = (stage: PipelineStage): AgentId => ({
  Found: "researcher", Contacted: "sales", Replied: "followup",
  "Demo Booked": "secretary", "Signed Up": "sales", Onboarding: "onboarding", Active: "manager",
} as const)[stage];
