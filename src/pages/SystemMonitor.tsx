import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle, Smartphone, Building2, LayoutDashboard, Users,
  RefreshCw, Radio, Activity, Zap, Clock, ShieldCheck,
  ChevronRight, AlertCircle, CheckCircle2, Flame, Eye,
  Layers, TrendingUp, TrendingDown, BookOpen, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus  = "healthy" | "degraded" | "down" | "coming_soon";
type HttpMethod     = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
type EndpointStatus = "healthy" | "slow" | "erroring";
type Grade          = "A" | "B" | "C" | "D" | "F";
type Priority       = "critical" | "high" | "medium" | "planned";
type InsightType    = "critical" | "warning" | "info" | "success";

type View =
  | { mode: "overview" }
  | { mode: "service";  serviceId: string }
  | { mode: "endpoint"; serviceId: string; endpointId: string };

interface StatusCodeBucket { code: number; label: string; count: number; pct: number; }
interface HourlyPoint      { hour: string; requests: number; errors: number; avg_ms: number; }
interface RecentError      { id: string; ts: string; code: number; message: string; duration_ms: number; trace: string; }
interface Insight          { type: InsightType; title: string; desc: string; action?: string; }

interface EndpointDetail {
  id: string; service_id: string;
  method: HttpMethod; path: string; description: string;
  calls_today: number; calls_yesterday: number; calls_7d: number; calls_lifetime: number;
  avg_ms: number; p50: number; p95: number; p99: number;
  error_rate: number; apdex: number; status: EndpointStatus;
  status_codes: StatusCodeBucket[];
  errors: RecentError[];
  hourly: HourlyPoint[];
}

interface ServiceHealth {
  id: string; name: string; short: string; description: string;
  icon: string; status: ServiceStatus; priority: Priority;
  uptime_24h: number; avg_response_ms: number;
  requests_today: number; calls_7d: number; calls_lifetime: number;
  error_rate: number; last_checked: string; sparkline: number[];
  apdex: number; sla_target: number; p50: number; p95: number; p99: number;
  mttr_minutes: number; mtbf_hours: number; error_budget_used_pct: number;
  endpoints: EndpointDetail[];
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function mkHourly(total: number, errPct: number, baseMs: number): HourlyPoint[] {
  const f = [0.20,0.15,0.10,0.10,0.10,0.18,0.45,0.75,0.95,1.00,1.00,0.92,0.82,0.88,0.92,1.00,0.82,0.68,0.52,0.42,0.33,0.28,0.22,0.18];
  return f.map((fv, h) => {
    const requests = Math.max(1, Math.round((total / 24) * fv * (0.88 + (h % 3) * 0.08)));
    const errors   = Math.round(requests * errPct / 100);
    const noise    = 0.82 + Math.abs(Math.sin(h / 3.2)) * 0.36;
    return { hour:`${String(h).padStart(2,"0")}:00`, requests, errors, avg_ms:Math.max(8, Math.round(baseMs * noise)) };
  });
}

function mkCodes(...entries: [number, string, number][]): StatusCodeBucket[] {
  const total = entries.reduce((s, [,, n]) => s + n, 0);
  return entries.map(([code, label, count]) => ({ code, label, count, pct:+((count / total) * 100).toFixed(1) }));
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INSTITUTION_ENDPOINTS: EndpointDetail[] = [
  {
    id:"inst-list-customers",   service_id:"institution",
    method:"GET",  path:"/api/v1/customers",           description:"List & search all customers",
    calls_today:3241, calls_yesterday:2980, calls_7d:21_847, calls_lifetime:4_280_441,
    avg_ms:145, p50:120, p95:280, p99:420, error_rate:0.2, apdex:0.96, status:"healthy",
    status_codes: mkCodes([200,"OK",3234],[401,"Unauthorized",4],[500,"Server Error",3]),
    errors:[{ id:"e1", ts:"11:42:18", code:500, message:"SQLSTATE[HY000]: General error — max_connections reached", duration_ms:4891, trace:"tr_a1b2c3" }],
    hourly: mkHourly(3241, 0.2, 145),
  },
  {
    id:"inst-create-customer",  service_id:"institution",
    method:"POST", path:"/api/v1/customers",           description:"Register new customer in institution",
    calls_today:312, calls_yesterday:287, calls_7d:2_184, calls_lifetime:312_840,
    avg_ms:387, p50:290, p95:720, p99:1240, error_rate:1.9, apdex:0.89, status:"healthy",
    status_codes: mkCodes([201,"Created",296],[422,"Validation Failed",9],[400,"Bad Request",4],[500,"Server Error",3]),
    errors:[
      { id:"e1", ts:"14:21:07", code:422, message:"Validation failed: phone must be a valid Nigerian mobile number (+234xxxxxxxxxx)", duration_ms:89, trace:"tr_c9d8e7" },
      { id:"e2", ts:"13:55:31", code:422, message:"Validation failed: bvn_number has already been taken", duration_ms:112, trace:"tr_f6g5h4" },
      { id:"e3", ts:"13:12:44", code:500, message:"SQLSTATE[23000]: Duplicate entry '2348012345678' for key 'customers_phone_unique'", duration_ms:187, trace:"tr_i3j2k1" },
    ],
    hourly: mkHourly(312, 1.9, 387),
  },
  {
    id:"inst-get-customer",     service_id:"institution",
    method:"GET",  path:"/api/v1/customers/:id",       description:"Get single customer record",
    calls_today:2890, calls_yesterday:2654, calls_7d:19_230, calls_lifetime:3_841_200,
    avg_ms:98, p50:82, p95:180, p99:290, error_rate:0.1, apdex:0.98, status:"healthy",
    status_codes: mkCodes([200,"OK",2887],[404,"Not Found",2],[401,"Unauthorized",1]),
    errors:[{ id:"e1", ts:"09:17:22", code:404, message:"No query results for model [Customer] 99999", duration_ms:14, trace:"tr_l9m8n7" }],
    hourly: mkHourly(2890, 0.1, 98),
  },
  {
    id:"inst-onboard-customer", service_id:"institution",
    method:"POST", path:"/api/v1/customers/onboard",   description:"Full onboarding: BVN verify, account create, welcome SMS",
    calls_today:89, calls_yesterday:104, calls_7d:651, calls_lifetime:48_210,
    avg_ms:1240, p50:890, p95:2800, p99:4200, error_rate:3.4, apdex:0.61, status:"slow",
    status_codes: mkCodes([201,"Created",83],[422,"Validation Failed",3],[500,"Server Error",2],[408,"Timeout",1]),
    errors:[
      { id:"e1", ts:"14:08:33", code:500, message:"BVN verification service timeout after 10s — external provider unreachable", duration_ms:10012, trace:"tr_o6p5q4" },
      { id:"e2", ts:"13:41:19", code:422, message:"Validation failed: nin_number does not match provided BVN record", duration_ms:2340, trace:"tr_r3s2t1" },
      { id:"e3", ts:"12:55:08", code:408, message:"Request timeout — synchronous account creation exceeded 8s limit", duration_ms:8001, trace:"tr_u9v8w7" },
    ],
    hourly: mkHourly(89, 3.4, 1240),
  },
  {
    id:"inst-deposit",          service_id:"institution",
    method:"POST", path:"/api/v1/savings/deposit",     description:"Post a deposit transaction",
    calls_today:1240, calls_yesterday:1120, calls_7d:8_421, calls_lifetime:1_240_882,
    avg_ms:218, p50:180, p95:420, p99:780, error_rate:0.4, apdex:0.93, status:"healthy",
    status_codes: mkCodes([201,"Created",1235],[422,"Validation Failed",3],[500,"Server Error",2]),
    errors:[{ id:"e1", ts:"10:34:56", code:422, message:"Insufficient funds in source wallet — cannot process debit of ₦50,000", duration_ms:78, trace:"tr_x6y5z4" }],
    hourly: mkHourly(1240, 0.4, 218),
  },
  {
    id:"inst-withdrawal",       service_id:"institution",
    method:"POST", path:"/api/v1/savings/withdrawal",  description:"Process withdrawal from savings account",
    calls_today:680, calls_yesterday:720, calls_7d:4_812, calls_lifetime:721_440,
    avg_ms:284, p50:210, p95:580, p99:920, error_rate:0.8, apdex:0.91, status:"healthy",
    status_codes: mkCodes([201,"Created",674],[422,"Validation Failed",4],[500,"Server Error",2]),
    errors:[], hourly: mkHourly(680, 0.8, 284),
  },
  {
    id:"inst-apply-loan",       service_id:"institution",
    method:"POST", path:"/api/v1/loans",               description:"Submit loan application",
    calls_today:124, calls_yesterday:98, calls_7d:812, calls_lifetime:84_210,
    avg_ms:892, p50:680, p95:1800, p99:3400, error_rate:2.4, apdex:0.72, status:"slow",
    status_codes: mkCodes([201,"Created",118],[422,"Validation Failed",4],[500,"Server Error",2]),
    errors:[
      { id:"e1", ts:"13:28:14", code:422, message:"Validation failed: applicant has existing unpaid loan (ID: LN-00482)", duration_ms:142, trace:"tr_ab1cd2" },
      { id:"e2", ts:"11:19:03", code:500, message:"Credit score API response malformed — provider returned HTML instead of JSON", duration_ms:8120, trace:"tr_ef3gh4" },
    ],
    hourly: mkHourly(124, 2.4, 892),
  },
  {
    id:"inst-approve-loan",     service_id:"institution",
    method:"PATCH", path:"/api/v1/loans/:id/approve",  description:"Approve or reject a loan application",
    calls_today:67, calls_yesterday:54, calls_7d:421, calls_lifetime:42_840,
    avg_ms:421, p50:320, p95:890, p99:1450, error_rate:0, apdex:0.95, status:"healthy",
    status_codes: mkCodes([200,"OK",67]),
    errors:[], hourly: mkHourly(67, 0, 421),
  },
  {
    id:"inst-list-assets",      service_id:"institution",
    method:"GET",  path:"/api/v1/assets",              description:"List customer asset portfolios",
    calls_today:410, calls_yesterday:388, calls_7d:2_841, calls_lifetime:412_880,
    avg_ms:178, p50:145, p95:340, p99:560, error_rate:0.1, apdex:0.97, status:"healthy",
    status_codes: mkCodes([200,"OK",409],[404,"Not Found",1]),
    errors:[], hourly: mkHourly(410, 0.1, 178),
  },
];

const RO_ENDPOINTS: EndpointDetail[] = [
  {
    id:"ro-sync",               service_id:"ro_mobile",
    method:"POST", path:"/api/v1/sync-customers",      description:"Full bidirectional customer sync between RO device and server",
    calls_today:1240, calls_yesterday:1180, calls_7d:8_412, calls_lifetime:984_210,
    avg_ms:8231, p50:4210, p95:12400, p99:28000, error_rate:8.2, apdex:0.31, status:"erroring",
    status_codes: mkCodes([200,"OK",1118],[500,"Server Error",62],[422,"Validation Failed",38],[408,"Request Timeout",22]),
    errors:[
      { id:"e1", ts:"14:32:00", code:500, message:"Timeout: sync_customers Job exceeded 30s max execution — job killed by scheduler", duration_ms:30412, trace:"tr_sync001" },
      { id:"e2", ts:"14:28:43", code:500, message:"Failed to acquire distributed lock for customer_sync_batch — another process still running", duration_ms:8231, trace:"tr_sync002" },
      { id:"e3", ts:"14:21:18", code:422, message:"Schema mismatch: required field 'account_number' missing (RO app v1.4 sends 'acct_no')", duration_ms:312, trace:"tr_sync003" },
      { id:"e4", ts:"14:17:55", code:500, message:"DB Connection pool exhausted — all 50 connections in use, queue depth: 128", duration_ms:15284, trace:"tr_sync004" },
      { id:"e5", ts:"14:09:12", code:500, message:"SQLSTATE[40001]: Deadlock found when trying to get lock — customer_id: 10482", duration_ms:4821, trace:"tr_sync005" },
    ],
    hourly: mkHourly(1240, 8.2, 8231),
  },
  {
    id:"ro-log-visit",          service_id:"ro_mobile",
    method:"POST", path:"/api/v1/ro/visits",           description:"Record field officer visit with GPS & notes",
    calls_today:630, calls_yesterday:590, calls_7d:4_210, calls_lifetime:512_480,
    avg_ms:612, p50:421, p95:1240, p99:4800, error_rate:6.3, apdex:0.54, status:"slow",
    status_codes: mkCodes([201,"Created",583],[500,"Server Error",28],[422,"Validation Failed",12],[408,"Timeout",7]),
    errors:[
      { id:"e1", ts:"14:29:11", code:500, message:"Failed to persist GPS coordinates — column expects POINT type, received plain string", duration_ms:6120, trace:"tr_visit001" },
      { id:"e2", ts:"14:11:38", code:422, message:"Validation failed: visit_date cannot be in the future (received: 2026-07-29, today: 2026-07-28)", duration_ms:88, trace:"tr_visit002" },
    ],
    hourly: mkHourly(630, 6.3, 612),
  },
  {
    id:"ro-auth",               service_id:"ro_mobile",
    method:"POST", path:"/api/v1/ro/auth",             description:"Field officer authentication & JWT token issuance",
    calls_today:342, calls_yesterday:318, calls_7d:2_240, calls_lifetime:284_120,
    avg_ms:184, p50:145, p95:380, p99:640, error_rate:0.6, apdex:0.94, status:"healthy",
    status_codes: mkCodes([200,"OK",340],[401,"Invalid Credentials",2]),
    errors:[], hourly: mkHourly(342, 0.6, 184),
  },
  {
    id:"ro-list-customers",     service_id:"ro_mobile",
    method:"GET",  path:"/api/v1/ro/customers",        description:"Get RO's assigned customer portfolio",
    calls_today:890, calls_yesterday:842, calls_7d:6_014, calls_lifetime:841_220,
    avg_ms:342, p50:278, p95:720, p99:1480, error_rate:2.1, apdex:0.82, status:"healthy",
    status_codes: mkCodes([200,"OK",870],[500,"Server Error",12],[401,"Unauthorized",8]),
    errors:[{ id:"e1", ts:"13:44:02", code:500, message:"Eager loading failed: relation 'savings' not found on Customer model (check migration status)", duration_ms:1240, trace:"tr_rocust001" }],
    hourly: mkHourly(890, 2.1, 342),
  },
  {
    id:"ro-collect",            service_id:"ro_mobile",
    method:"POST", path:"/api/v1/ro/collect",          description:"Record repayment collection from customer",
    calls_today:312, calls_yesterday:298, calls_7d:2_184, calls_lifetime:312_481,
    avg_ms:524, p50:390, p95:1140, p99:3200, error_rate:4.2, apdex:0.68, status:"slow",
    status_codes: mkCodes([201,"Created",296],[422,"Validation Failed",8],[500,"Server Error",6],[409,"Conflict",2]),
    errors:[
      { id:"e1", ts:"14:05:27", code:409, message:"Collection conflict: duplicate submission detected — same amount collected within 30s window", duration_ms:198, trace:"tr_col001" },
      { id:"e2", ts:"13:28:41", code:422, message:"Collection exceeds outstanding balance: submitted ₦15,000, balance is ₦8,500", duration_ms:124, trace:"tr_col002" },
    ],
    hourly: mkHourly(312, 4.2, 524),
  },
  {
    id:"ro-schedule",           service_id:"ro_mobile",
    method:"GET",  path:"/api/v1/ro/schedule",         description:"Get RO's daily visit schedule",
    calls_today:776, calls_yesterday:810, calls_7d:5_421, calls_lifetime:721_840,
    avg_ms:198, p50:162, p95:420, p99:780, error_rate:0.9, apdex:0.92, status:"healthy",
    status_codes: mkCodes([200,"OK",769],[500,"Server Error",4],[404,"Not Found",3]),
    errors:[], hourly: mkHourly(776, 0.9, 198),
  },
];

const MGMT_ENDPOINTS: EndpointDetail[] = [
  {
    id:"mgmt-kpis",             service_id:"management",
    method:"GET",  path:"/admin/finance/kpis",         description:"Financial KPIs dashboard data",
    calls_today:742, calls_yesterday:698, calls_7d:5_012, calls_lifetime:612_480,
    avg_ms:98, p50:82, p95:210, p99:340, error_rate:0, apdex:0.99, status:"healthy",
    status_codes: mkCodes([200,"OK",742]),
    errors:[], hourly: mkHourly(742, 0, 98),
  },
  {
    id:"mgmt-invoices",         service_id:"management",
    method:"GET",  path:"/admin/billing/invoices",     description:"List billing invoices with filters",
    calls_today:580, calls_yesterday:542, calls_7d:3_912, calls_lifetime:481_220,
    avg_ms:112, p50:89, p95:224, p99:368, error_rate:0.2, apdex:0.98, status:"healthy",
    status_codes: mkCodes([200,"OK",579],[500,"Server Error",1]),
    errors:[], hourly: mkHourly(580, 0.2, 112),
  },
  {
    id:"mgmt-tenants",          service_id:"management",
    method:"GET",  path:"/admin/tenants",              description:"List all tenant institutions",
    calls_today:412, calls_yesterday:389, calls_7d:2_841, calls_lifetime:312_840,
    avg_ms:134, p50:108, p95:280, p99:420, error_rate:0.1, apdex:0.97, status:"healthy",
    status_codes: mkCodes([200,"OK",411],[500,"Server Error",1]),
    errors:[], hourly: mkHourly(412, 0.1, 134),
  },
  {
    id:"mgmt-create-invoice",   service_id:"management",
    method:"POST", path:"/admin/billing/invoices",     description:"Generate new billing invoice for tenant",
    calls_today:124, calls_yesterday:118, calls_7d:842, calls_lifetime:98_421,
    avg_ms:287, p50:210, p95:580, p99:940, error_rate:0.8, apdex:0.94, status:"healthy",
    status_codes: mkCodes([201,"Created",123],[422,"Validation Failed",1]),
    errors:[], hourly: mkHourly(124, 0.8, 287),
  },
  {
    id:"mgmt-analytics",        service_id:"management",
    method:"GET",  path:"/admin/analytics",            description:"Aggregate analytics — heavy computation endpoint",
    calls_today:298, calls_yesterday:312, calls_7d:2_012, calls_lifetime:241_880,
    avg_ms:1240, p50:890, p95:2400, p99:3800, error_rate:1.1, apdex:0.77, status:"slow",
    status_codes: mkCodes([200,"OK",291],[408,"Timeout",4],[500,"Server Error",3]),
    errors:[{ id:"e1", ts:"12:18:44", code:408, message:"Query timeout: analytics aggregation exceeded 5s — table scan on 2.4M rows without index", duration_ms:5001, trace:"tr_ana001" }],
    hourly: mkHourly(298, 1.1, 1240),
  },
  {
    id:"mgmt-health",           service_id:"management",
    method:"GET",  path:"/admin/system/health",        description:"System health ping (used by uptime monitors)",
    calls_today:1440, calls_yesterday:1440, calls_7d:10_080, calls_lifetime:1_244_160,
    avg_ms:12, p50:8, p95:24, p99:40, error_rate:0, apdex:1.0, status:"healthy",
    status_codes: mkCodes([200,"OK",1440]),
    errors:[], hourly: mkHourly(1440, 0, 12),
  },
  {
    id:"mgmt-users",            service_id:"management",
    method:"GET",  path:"/admin/users",                description:"List admin system users",
    calls_today:186, calls_yesterday:174, calls_7d:1_284, calls_lifetime:148_210,
    avg_ms:78, p50:62, p95:156, p99:248, error_rate:0, apdex:0.99, status:"healthy",
    status_codes: mkCodes([200,"OK",186]),
    errors:[], hourly: mkHourly(186, 0, 78),
  },
];

const MOCK_SERVICES: ServiceHealth[] = [
  {
    id:"institution",     icon:"building",  short:"Institution API",
    name:"Institution Portal API", description:"Customer onboarding · Savings · Loans · Assets",
    status:"healthy", priority:"critical",
    uptime_24h:99.8, avg_response_ms:182, requests_today:8241, calls_7d:60_006, calls_lifetime:11_983_373,
    error_rate:0.4, last_checked:"Just now", apdex:0.94, sla_target:99.9,
    p50:142, p95:380, p99:620,
    mttr_minutes:4, mtbf_hours:720, error_budget_used_pct:18,
    sparkline:[420,580,510,720,890,760,830,920,870,760,540,420],
    endpoints: INSTITUTION_ENDPOINTS,
  },
  {
    id:"ro_mobile",       icon:"smartphone", short:"RO Mobile API",
    name:"RO Mobile API", description:"Field operations · Customer sync · Visit logs",
    status:"degraded", priority:"high",
    uptime_24h:97.2, avg_response_ms:541, requests_today:4190, calls_7d:29_481, calls_lifetime:4_656_351,
    error_rate:8.2, last_checked:"Just now", apdex:0.61, sla_target:99.9,
    p50:421, p95:1240, p99:4800,
    mttr_minutes:28, mtbf_hours:48, error_budget_used_pct:97,
    sparkline:[180,210,195,240,180,120,90,210,180,150,120,90],
    endpoints: RO_ENDPOINTS,
  },
  {
    id:"management",      icon:"dashboard",  short:"Management API",
    name:"Management Portal API", description:"Admin panel · Accounting · Billing · Config",
    status:"healthy", priority:"high",
    uptime_24h:100, avg_response_ms:134, requests_today:2392, calls_7d:17_003, calls_lifetime:3_139_211,
    error_rate:0.1, last_checked:"Just now", apdex:0.98, sla_target:99.9,
    p50:98, p95:210, p99:340,
    mttr_minutes:2, mtbf_hours:1440, error_budget_used_pct:3,
    sparkline:[90,110,105,130,150,140,160,145,130,120,100,95],
    endpoints: MGMT_ENDPOINTS,
  },
  {
    id:"customer_mobile", icon:"users",      short:"Customer App",
    name:"Customer Mobile API", description:"Customer-facing mobile application",
    status:"coming_soon", priority:"planned",
    uptime_24h:0, avg_response_ms:0, requests_today:0, calls_7d:0, calls_lifetime:0,
    error_rate:0, last_checked:"—", apdex:0, sla_target:99.9,
    p50:0, p95:0, p99:0,
    mttr_minutes:0, mtbf_hours:0, error_budget_used_pct:0,
    sparkline:[0,0,0,0,0,0,0,0,0,0,0,0],
    endpoints:[],
  },
];

// ─── Glossary ─────────────────────────────────────────────────────────────────

const GLOSSARY = [
  { term:"P50 — Median Latency",        color:"text-emerald-500",
    def:"50% of all requests complete in this time or less. If P50 = 200ms, half your users wait ≤200ms. This is your typical user's experience. Aim for < 300ms for web APIs." },
  { term:"P95 — 95th Percentile",       color:"text-amber-500",
    def:"95 out of every 100 requests are faster than this value. 5 in 100 users experience worse performance. Critical for identifying slow outliers. Aim for < 1,000ms." },
  { term:"P99 — 99th Percentile",       color:"text-rose-500",
    def:"99 out of 100 requests are faster than this. This represents your worst-case users — 1 in 100. High P99 (> 2s) means some customers have very bad experiences. For banking APIs aim < 2,000ms." },
  { term:"Apdex — App Performance Index", color:"text-sky-500",
    def:"A score from 0.0 to 1.0 measuring user satisfaction. Formula: (Satisfied requests + 0.5 × Tolerating) ÷ Total. Grades: Excellent ≥0.94 | Good ≥0.85 | Fair ≥0.70 | Poor ≥0.50 | Unacceptable <0.50." },
  { term:"SLA — Service Level Agreement", color:"text-violet-500",
    def:"A contractual uptime commitment. 99.9% SLA allows ~8.7 hours downtime/year (43 min/month). 99.99% allows ~52 minutes/year. For a core banking system, 99.9% is the minimum; 99.95% is recommended." },
  { term:"Error Budget",                color:"text-orange-500",
    def:"The allowed amount of downtime or errors within your SLA commitment. A 99.9% SLA gives you a 0.1% monthly error budget (~43 minutes). When this is exhausted, all deployments should stop until the budget resets." },
  { term:"MTTR — Mean Time to Recover", color:"text-cyan-500",
    def:"Average time from when an incident starts to when the service is fully restored. World-class fintech MTTR is < 15 minutes. Above 30 minutes is a serious reliability risk." },
  { term:"MTBF — Mean Time Between Failures", color:"text-indigo-500",
    def:"Average time between incidents. Higher is better. MTBF of 720 hours = 1 failure per month. MTBF of 48 hours = multiple failures per week — a serious stability problem requiring root-cause analysis." },
  { term:"Four Golden Signals",         color:"text-yellow-500",
    def:"Google SRE's framework for monitoring any service: (1) Latency — how long requests take, (2) Traffic — how many requests per second, (3) Errors — what percentage fail, (4) Saturation — how close to capacity. Monitor all four always." },
  { term:"Circuit Breaker",             color:"text-pink-500",
    def:"A fault-tolerance pattern. CLOSED = healthy, all requests pass. HALF-OPEN = recovering, sending limited test traffic. OPEN = service tripped, requests are blocked to prevent cascade failures across the system." },
  { term:"RPS — Requests Per Second",   color:"text-teal-500",
    def:"Current throughput of the API. Helps with capacity planning. If RPS suddenly spikes or drops, it often signals a traffic anomaly, DDoS attempt, or downstream failure." },
];

// ─── Computed helpers ─────────────────────────────────────────────────────────

function calcGrade(ep: EndpointDetail): Grade {
  let s = 100;
  if      (ep.error_rate >= 10) s -= 50;
  else if (ep.error_rate >= 5)  s -= 35;
  else if (ep.error_rate >= 2)  s -= 20;
  else if (ep.error_rate >= 1)  s -= 10;
  else if (ep.error_rate >= 0.5) s -= 5;
  if      (ep.p99 >= 10_000) s -= 30;
  else if (ep.p99 >= 5_000)  s -= 20;
  else if (ep.p99 >= 2_000)  s -= 12;
  else if (ep.p99 >= 1_000)  s -= 5;
  if      (ep.avg_ms >= 2_000) s -= 20;
  else if (ep.avg_ms >= 1_000) s -= 10;
  else if (ep.avg_ms >= 500)   s -= 5;
  if (s >= 90) return "A";
  if (s >= 75) return "B";
  if (s >= 60) return "C";
  if (s >= 45) return "D";
  return "F";
}

function generateInsights(ep: EndpointDetail): Insight[] {
  const out: Insight[] = [];
  if (ep.error_rate >= 5)
    out.push({ type:"critical", title:"Critical Error Rate",
      desc:`${ep.error_rate.toFixed(1)}% of requests failing — ${Math.round(ep.calls_today * ep.error_rate / 100)} errors today.`,
      action:"Check storage/logs/laravel.log immediately and review recent deployments" });
  else if (ep.error_rate >= 2)
    out.push({ type:"warning", title:"Elevated Error Rate",
      desc:`${ep.error_rate.toFixed(1)}% error rate exceeds the 1% SLA threshold.`,
      action:"Audit FormRequest validation rules and check for API schema drift" });
  else if (ep.error_rate >= 0.5)
    out.push({ type:"info", title:"Minor Error Rate",
      desc:`${ep.error_rate.toFixed(1)}% is within range — improve with better client-side validation.` });

  if (ep.p99 >= 10_000)
    out.push({ type:"critical", title:"P99 Latency — Critical",
      desc:`P99 at ${(ep.p99/1000).toFixed(1)}s. 1-in-100 users experience severe delays.`,
      action:"Move heavy logic to Laravel Queue jobs. HTTP workers must never block on long operations" });
  else if (ep.p99 >= 3_000)
    out.push({ type:"warning", title:"P99 Latency — High",
      desc:`P99 at ${ep.p99}ms — worst-case users wait ${(ep.p99/1000).toFixed(1)}s.`,
      action:"Profile with Laravel Debugbar for N+1 queries and add database indexes" });
  else if (ep.p99 >= 1_000)
    out.push({ type:"info", title:"P99 Approaching Threshold",
      desc:`P99 at ${ep.p99}ms — monitor for degradation under higher load.` });

  if (ep.avg_ms >= 1_000)
    out.push({ type:"warning", title:"Slow Average Response",
      desc:`Average ${ep.avg_ms}ms exceeds the recommended 500ms threshold.`,
      action:"Add Redis caching for read-heavy queries. Review database execution plans" });

  const s500 = ep.status_codes.find(s => s.code === 500);
  if (s500 && s500.pct > 3)
    out.push({ type:"critical", title:"Server Exceptions Detected",
      desc:`${s500.pct}% returning HTTP 500 — unhandled server exceptions occurring.`,
      action:"Check Sentry or Laravel Telescope for full stack traces" });

  if (ep.apdex >= 0.94 && ep.error_rate < 0.5)
    out.push({ type:"success", title:"Performing Well",
      desc:`Apdex ${ep.apdex.toFixed(2)} — users are satisfied. All SLA bounds met.` });

  if (out.length === 0)
    out.push({ type:"info", title:"Monitoring Active", desc:"No anomalies detected in current window." });
  return out;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function trendPct(today: number, yesterday: number): number {
  if (yesterday === 0) return 0;
  return +((((today - yesterday) / yesterday) * 100).toFixed(1));
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function statusColors(n: number, hi = 90, lo = 70) {
  if (n >= hi) return { stroke:"#10b981", text:"text-emerald-500" };
  if (n >= lo) return { stroke:"#f59e0b", text:"text-amber-500"  };
  return             { stroke:"#ef4444", text:"text-rose-500"   };
}

const GRADE_CLS: Record<Grade, string> = {
  A:"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  B:"bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  C:"bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  D:"bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  F:"bg-rose-500/10 text-rose-500 border-rose-500/30",
};

const PRIORITY_CFG: Record<Priority, { label: string; cls: string; bg: string }> = {
  critical: { label:"CRITICAL", cls:"text-rose-500",  bg:"bg-rose-500/10 border-rose-500/25"   },
  high:     { label:"HIGH",     cls:"text-amber-500", bg:"bg-amber-500/10 border-amber-500/25" },
  medium:   { label:"MEDIUM",   cls:"text-sky-500",   bg:"bg-sky-500/10 border-sky-500/25"     },
  planned:  { label:"PLANNED",  cls:"text-slate-400", bg:"bg-slate-500/10 border-slate-500/25" },
};

const INSIGHT_CFG: Record<InsightType, { cls: string; Icon: typeof AlertCircle }> = {
  critical: { cls:"border-rose-500/30 bg-rose-500/5",       Icon: AlertCircle   },
  warning:  { cls:"border-amber-500/30 bg-amber-500/5",     Icon: AlertTriangle },
  info:     { cls:"border-sky-500/30 bg-sky-500/5",         Icon: TrendingUp    },
  success:  { cls:"border-emerald-500/30 bg-emerald-500/5", Icon: CheckCircle2  },
};

const INSIGHT_ICON_CLS: Record<InsightType, string> = {
  critical:"text-rose-500", warning:"text-amber-500", info:"text-sky-500", success:"text-emerald-500",
};

const METHOD_CLS: Record<string, string> = {
  GET:    "bg-sky-500/10 text-sky-500 border-sky-500/25",
  POST:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  PATCH:  "bg-amber-500/10 text-amber-600 border-amber-500/25",
  PUT:    "bg-violet-500/10 text-violet-600 border-violet-500/25",
  DELETE: "bg-rose-500/10 text-rose-500 border-rose-500/25",
};

const TT = {
  contentStyle:{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:"12px", color:"hsl(var(--foreground))" },
  labelStyle:  { color:"hsl(var(--muted-foreground))", fontWeight:600, marginBottom:2 },
};

const statusCodeColor = (c: number) =>
  c < 300 ? "text-emerald-600 dark:text-emerald-400" : c < 400 ? "text-sky-500" : c < 500 ? "text-amber-600 dark:text-amber-400" : "text-rose-500";
const statusCodeBar = (c: number) =>
  c < 300 ? "bg-emerald-500" : c < 400 ? "bg-sky-500" : c < 500 ? "bg-amber-500" : "bg-rose-500";

// ─── Micro-components ─────────────────────────────────────────────────────────

/** Hoverable "?" info tooltip — explains a technical term in plain English */
function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center cursor-help ml-0.5 align-middle">
      <span className="text-[8px] font-bold text-muted-foreground/40 border border-muted-foreground/20 rounded-full h-3 w-3 inline-flex items-center justify-center select-none hover:text-muted-foreground/70 hover:border-muted-foreground/40 transition-colors">?</span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] w-64 rounded-xl border border-border bg-popover shadow-xl p-3 text-[11px] leading-relaxed text-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-normal">
        {text}
      </span>
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold border font-mono ${METHOD_CLS[method] ?? ""}`}>{method}</span>;
}

function GradeBadge({ grade }: { grade: Grade }) {
  return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[13px] font-extrabold flex-shrink-0 ${GRADE_CLS[grade]}`}>{grade}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY_CFG[priority];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold tracking-wider ${c.bg} ${c.cls}`}>{c.label}</span>;
}

function PulseDot({ status }: { status: ServiceStatus }) {
  const m: Record<ServiceStatus, { cls: string; label: string; ping: boolean; txtCls: string }> = {
    healthy:     { cls:"bg-emerald-500", label:"Healthy",     ping:false, txtCls:"text-emerald-500"      },
    degraded:    { cls:"bg-amber-500",   label:"Degraded",    ping:true,  txtCls:"text-amber-500"        },
    down:        { cls:"bg-rose-500",    label:"Down",        ping:true,  txtCls:"text-rose-500"         },
    coming_soon: { cls:"bg-slate-400",   label:"Coming Soon", ping:false, txtCls:"text-muted-foreground" },
  };
  const c = m[status];
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-2 w-2 flex-shrink-0">
        {c.ping && <div className={`absolute inset-0 rounded-full ${c.cls} animate-ping opacity-70`} />}
        <div className={`relative rounded-full h-2 w-2 ${c.cls}`} />
      </div>
      <span className={`text-[10px] font-bold ${c.txtCls}`}>{c.label}</span>
    </div>
  );
}

function MiniSparkline({ data, status }: { data: number[]; status: ServiceStatus }) {
  const max = Math.max(...data, 1);
  const W = 72, H = 20;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * H}`).join(" ");
  const color = status === "degraded" ? "#f59e0b" : status === "down" ? "#ef4444" : "#06b6d4";
  return <svg width={W} height={H} className="overflow-visible"><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

function ServiceIcon({ icon }: { icon: string }) {
  const p = { className:"h-3.5 w-3.5" };
  if (icon === "building")   return <Building2       {...p} />;
  if (icon === "smartphone") return <Smartphone      {...p} />;
  if (icon === "dashboard")  return <LayoutDashboard {...p} />;
  return <Users {...p} />;
}

function SlaBar({ target, actual }: { target: number; actual: number }) {
  if (actual === 0) return null;
  const pct    = Math.min((actual / target) * 100, 100);
  const barCls = actual >= target ? "bg-emerald-500" : actual >= target - 1 ? "bg-amber-500" : "bg-rose-500";
  const txtCls = actual >= target ? "text-emerald-500" : actual >= target - 1 ? "text-amber-500" : "text-rose-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-muted-foreground">SLA {target}%<InfoTip text="Service Level Agreement — your contractual uptime commitment. 99.9% allows ~43 minutes downtime per month." /></span>
        <span className={`text-[9px] font-bold ${txtCls}`}>{actual}%</span>
      </div>
      <div className="h-[3px] rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width:`${pct}%` }} />
      </div>
    </div>
  );
}

function ErrorBudgetBar({ used, svcName }: { used: number; svcName: string }) {
  const remaining = 100 - used;
  const barCls = used > 90 ? "bg-rose-500" : used > 70 ? "bg-amber-500" : "bg-emerald-500";
  const txtCls = used > 90 ? "text-rose-500" : used > 70 ? "text-amber-500" : "text-emerald-500";
  // 99.9% SLA = 43.2 min/month budget
  const remainMins = (43.2 * remaining / 100).toFixed(0);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-muted-foreground">
          Error Budget<InfoTip text="Monthly downtime allowance under your SLA. 99.9% SLA = 43.2 minutes per month. When this reaches 0%, freeze all deployments until next month." />
        </span>
        <span className={`text-[9px] font-bold ${txtCls}`}>{remaining.toFixed(0)}% left ({remainMins} min)</span>
      </div>
      <div className="h-[4px] rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width:`${used}%` }} />
      </div>
      {used > 90 && (
        <p className="text-[9px] text-rose-500 font-bold mt-1">⚠ Budget nearly exhausted — freeze deployments for {svcName}</p>
      )}
    </div>
  );
}

function Breadcrumb({ crumbs }: { crumbs: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {crumbs.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-500/50" />}
          {c.onClick
            ? <button onClick={c.onClick} className="text-[12px] font-medium text-slate-400 hover:text-white transition-colors">{c.label}</button>
            : <span className="text-[12px] font-semibold text-slate-200 truncate max-w-[280px]">{c.label}</span>}
        </div>
      ))}
    </div>
  );
}

/** Call frequency strip — today / 7-day / lifetime with vs-yesterday trend */
function CallFrequency({ today, yesterday, calls7d, lifetime, compact }: {
  today: number; yesterday: number; calls7d: number; lifetime: number; compact?: boolean;
}) {
  const trend = trendPct(today, yesterday);
  const TrendIcon = trend >= 0 ? ArrowUp : ArrowDown;
  const trendCls  = trend >= 0 ? "text-emerald-500" : "text-rose-500";
  return (
    <div className={`grid ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} gap-3`}>
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-[9px] text-muted-foreground">Today</p>
        <p className="text-[20px] font-extrabold tabular-nums text-foreground leading-tight">{fmtCount(today)}</p>
        <div className={`flex items-center gap-0.5 text-[10px] font-bold mt-0.5 ${trendCls}`}>
          <TrendIcon className="h-2.5 w-2.5" />
          {Math.abs(trend)}% vs yesterday
        </div>
      </div>
      {!compact && (
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[9px] text-muted-foreground">Yesterday</p>
          <p className="text-[20px] font-extrabold tabular-nums text-foreground leading-tight">{fmtCount(yesterday)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">prior day</p>
        </div>
      )}
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-[9px] text-muted-foreground">Last 7 Days</p>
        <p className="text-[20px] font-extrabold tabular-nums text-foreground leading-tight">{fmtCount(calls7d)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">rolling week</p>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-[9px] text-muted-foreground">Lifetime Total<InfoTip text="Total calls since this API was first deployed. Useful for understanding overall adoption and load history." /></p>
        <p className="text-[20px] font-extrabold tabular-nums text-sky-600 dark:text-sky-400 leading-tight">{fmtCount(lifetime)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">since launch</p>
      </div>
    </div>
  );
}

// ─── Glossary panel ───────────────────────────────────────────────────────────

function GlossaryPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-[14px] font-bold text-foreground">Terminology Guide</span>
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{GLOSSARY.length} terms explained</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border">
          <p className="text-[12px] text-muted-foreground mt-4 mb-4">Plain-English definitions for every technical term used in this control center.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GLOSSARY.map(g => (
              <div key={g.term} className="rounded-xl border border-border bg-muted/20 p-3">
                <p className={`text-[12px] font-bold mb-1.5 ${g.color}`}>{g.term}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{g.def}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Four Golden Signals ─────────────────────────────────────────────────────

function FourGoldenSignals({ services }: { services: ServiceHealth[] }) {
  const live        = services.filter(s => s.status !== "coming_soon");
  const avgLatency  = Math.round(live.reduce((a, s) => a + s.p99, 0) / Math.max(live.length, 1));
  const totalRPS    = (live.reduce((a, s) => a + s.requests_today, 0) / (14 * 3600)).toFixed(1);
  const avgErr      = (live.reduce((a, s) => a + s.error_rate, 0) / Math.max(live.length, 1)).toFixed(2);
  const saturation  = Math.round(live.reduce((a, s) => a + s.error_budget_used_pct, 0) / Math.max(live.length, 1));

  const signals = [
    { label:"Latency",    icon:Zap,          value:`${avgLatency >= 1000 ? (avgLatency/1000).toFixed(1)+"s" : avgLatency+"ms"}`, sub:"Avg P99 across all services",
      cls: avgLatency < 1000 ? "text-emerald-500" : avgLatency < 3000 ? "text-amber-500" : "text-rose-500",
      tip:"How long requests take to complete. Google SRE's first golden signal. Slow latency directly harms user experience." },
    { label:"Traffic",    icon:Activity,      value:`${totalRPS} RPS`, sub:"Requests per second (14h avg)",
      cls:"text-sky-600 dark:text-sky-400",
      tip:"Volume of requests hitting your APIs. Sudden spikes can indicate viral usage or a DDoS attack. Drops may mean an outage affecting clients." },
    { label:"Errors",     icon:AlertTriangle, value:`${avgErr}%`, sub:"Avg error rate across services",
      cls: Number(avgErr) < 1 ? "text-emerald-500" : Number(avgErr) < 5 ? "text-amber-500" : "text-rose-500",
      tip:"Percentage of requests returning errors. For a core banking system, target < 0.5%. Above 5% is a production incident." },
    { label:"Saturation", icon:Layers,        value:`${saturation}%`, sub:"Error budget consumed this month",
      cls: saturation < 50 ? "text-emerald-500" : saturation < 80 ? "text-amber-500" : "text-rose-500",
      tip:"How close your services are to their limits. Measured here as error budget consumed. > 80% means your reliability is under stress." },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Google SRE — Four Golden Signals</span>
        <InfoTip text="Google's Site Reliability Engineering framework recommends monitoring exactly these 4 signals for any production service. If all four look healthy, your system is healthy." />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {signals.map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <InfoTip text={s.tip} />
            </div>
            <p className={`text-[28px] font-extrabold tabular-nums leading-none ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Multi-ring gauge ─────────────────────────────────────────────────────────

function MultiRingGauge({ health, avgUptime, successRate }: { health: number; avgUptime: number; successRate: number }) {
  const cx = 130, cy = 130;
  function ring(r: number, pct: number) {
    const C = 2 * Math.PI * r, arc = 0.75 * C;
    return { C, arc, fill:(Math.min(pct, 100) / 100) * arc };
  }
  const rings = [
    { r:112, ...ring(112, health),      ...statusColors(health),      sw:13 },
    { r:88,  ...ring(88, avgUptime),    ...statusColors(avgUptime),   sw:10 },
    { r:65,  ...ring(65, successRate),  ...statusColors(successRate), sw:8  },
  ];
  const ticks = Array.from({ length:54 }, (_, i) => {
    const angle = -225 + (i / 53) * 270, rad = (angle * Math.PI) / 180;
    const major = i % 9 === 0, ro = 127, ri = major ? 120 : 123;
    return { x1:cx+ri*Math.cos(rad), y1:cy+ri*Math.sin(rad), x2:cx+ro*Math.cos(rad), y2:cy+ro*Math.sin(rad), major };
  });
  const hC = statusColors(health);
  return (
    <div style={{ position:"relative", width:260, height:260, flexShrink:0 }}>
      <svg width={260} height={260}>
        <defs>
          {rings.map((_, i) => (
            <filter key={i} id={`rf${i}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.major ? "hsl(var(--border))" : "hsl(var(--border)/0.4)"}
            strokeWidth={t.major ? 2 : 1} strokeLinecap="round" />
        ))}
        {rings.map((rg, i) => (
          <g key={i} transform={`rotate(-225, ${cx}, ${cy})`}>
            <circle cx={cx} cy={cy} r={rg.r} fill="none" stroke="hsl(var(--muted))" strokeWidth={rg.sw}
              strokeDasharray={`${rg.arc} ${rg.C - rg.arc}`} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={rg.r} fill="none" stroke={rg.stroke} strokeWidth={rg.sw}
              strokeDasharray={`${rg.fill} ${rg.C - rg.fill}`} strokeLinecap="round"
              filter={`url(#rf${i})`}
              style={{ transition:"stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={49} fill="hsl(var(--card))" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
        <span className={`text-[44px] font-extrabold leading-none tabular-nums ${hC.text}`}>{health}</span>
        <span className="text-[9px] font-bold tracking-[0.25em] text-muted-foreground mt-1.5">HEALTH SCORE</span>
      </div>
    </div>
  );
}

// ─── Service View (Level 2) ───────────────────────────────────────────────────

function ServiceView({ svc, onEndpoint }: { svc: ServiceHealth; onEndpoint: (id: string) => void }) {
  const sorted = [...svc.endpoints].sort((a, b) => {
    const rank = { erroring:0, slow:1, healthy:2 };
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return b.calls_today - a.calls_today;
  });
  const needAttn = sorted.filter(e => e.status !== "healthy").length;
  const svcHourly = svc.endpoints.reduce<HourlyPoint[]>((acc, ep) => {
    ep.hourly.forEach((pt, i) => {
      if (!acc[i]) acc[i] = { hour:pt.hour, requests:0, errors:0, avg_ms:0 };
      acc[i].requests += pt.requests;
      acc[i].errors   += pt.errors;
    });
    return acc;
  }, []);

  return (
    <div className="space-y-5">
      {svc.priority === "critical" && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 flex items-center gap-3">
          <Flame className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <p className="text-[12px] text-rose-600 dark:text-rose-400">
            <span className="font-bold">CRITICAL PRIORITY</span> — Customer-facing, revenue-generating. Any degradation triggers immediate incident response. Do not deploy without full testing.
          </p>
        </div>
      )}

      {/* Service header */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border
              ${svc.status==="degraded"?"bg-amber-500/10 text-amber-500 border-amber-500/20"
              :svc.status==="down"?"bg-rose-500/10 text-rose-500 border-rose-500/20"
              :"bg-cyan-500/10 text-cyan-500 border-cyan-500/20"}`}>
              <ServiceIcon icon={svc.icon} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[16px] font-bold text-foreground">{svc.name}</h2>
                <PriorityBadge priority={svc.priority} />
                <PulseDot status={svc.status} />
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">{svc.description}</p>
            </div>
          </div>
          {needAttn > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-1.5 flex-shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-bold text-amber-500">{needAttn} endpoint{needAttn > 1 ? "s" : ""} need attention</span>
            </div>
          )}
        </div>

        {/* Performance KPIs */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label:"Uptime 24h",   tip:"Percentage of the last 24 hours the service was responding to requests. 99.9% means ~1.4 minutes downtime.", val:`${svc.uptime_24h}%`, cls:svc.uptime_24h>=99.9?"text-emerald-500":"text-amber-500" },
            { label:"Avg Response", tip:"Average time to respond across all endpoints. Includes fast and slow requests.", val:`${svc.avg_response_ms}ms`, cls:svc.avg_response_ms<300?"text-emerald-500":svc.avg_response_ms<800?"text-amber-500":"text-rose-500" },
            { label:"Calls Today",  tip:"Total API calls received by this service today.", val:svc.requests_today.toLocaleString(), cls:"text-foreground" },
            { label:"Error Rate",   tip:"Percentage of requests that returned an error (HTTP 4xx or 5xx). Target < 1% for production.", val:`${svc.error_rate}%`, cls:svc.error_rate<1?"text-emerald-500":svc.error_rate<5?"text-amber-500":"text-rose-500" },
            { label:"Apdex",        tip:"Application Performance Index — user satisfaction score. 0.94+ = Excellent, 0.85-0.93 = Good, 0.70-0.84 = Fair, below 0.70 = Action required.", val:svc.apdex.toFixed(2), cls:svc.apdex>=0.94?"text-emerald-500":svc.apdex>=0.85?"text-sky-500":svc.apdex>=0.70?"text-amber-500":"text-rose-500" },
          ].map(k => (
            <div key={k.label} className="text-center sm:text-left">
              <p className="text-[10px] text-muted-foreground">{k.label}<InfoTip text={k.tip} /></p>
              <p className={`text-[20px] font-extrabold tabular-nums leading-tight ${k.cls}`}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Reliability metrics */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] text-muted-foreground">MTTR<InfoTip text="Mean Time to Recovery — how long it takes to restore service after an incident. Target < 15 minutes for banking." /></p>
              <p className={`text-[18px] font-extrabold tabular-nums ${svc.mttr_minutes <= 10 ? "text-emerald-500" : svc.mttr_minutes <= 20 ? "text-amber-500" : "text-rose-500"}`}>{svc.mttr_minutes} min</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">MTBF<InfoTip text="Mean Time Between Failures — how often incidents occur. Higher = more stable. 720h = once per month (good). 48h = multiple times per week (critical)." /></p>
              <p className={`text-[18px] font-extrabold tabular-nums ${svc.mtbf_hours >= 480 ? "text-emerald-500" : svc.mtbf_hours >= 168 ? "text-amber-500" : "text-rose-500"}`}>{svc.mtbf_hours}h</p>
            </div>
          </div>
          <ErrorBudgetBar used={svc.error_budget_used_pct} svcName={svc.short} />
        </div>
      </div>

      {/* Call frequency */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] font-bold text-foreground mb-1">Call Frequency</p>
        <p className="text-[12px] text-muted-foreground mb-4">How many times this service has been called</p>
        <CallFrequency today={svc.requests_today} yesterday={Math.round(svc.calls_7d/7)} calls7d={svc.calls_7d} lifetime={svc.calls_lifetime} />
      </div>

      {/* Endpoint table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[14px] font-bold text-foreground">API Endpoints</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{sorted.length} endpoints · Click any row to inspect calls, errors, and performance</p>
          </div>
          <div className="flex items-center gap-1.5">
            {(["A","B","C","D","F"] as Grade[]).map(g => (
              <span key={g} className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${GRADE_CLS[g]}`}>{g}</span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Grade","Method","Endpoint","Calls Today","Lifetime","Avg ms","P99","Errors",""].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(ep => {
                const grade = calcGrade(ep);
                const msC  = ep.avg_ms < 300 ? "text-emerald-500" : ep.avg_ms < 800 ? "text-amber-500" : "text-rose-500";
                const p99C = ep.p99 < 1000 ? "text-emerald-500" : ep.p99 < 3000 ? "text-amber-500" : "text-rose-500";
                const errC = ep.error_rate < 1 ? "text-emerald-500" : ep.error_rate < 5 ? "text-amber-500" : "text-rose-500 font-extrabold";
                const lb   = ep.status==="erroring"?"border-l-2 border-l-rose-500":ep.status==="slow"?"border-l-2 border-l-amber-500":"";
                const trend = trendPct(ep.calls_today, ep.calls_yesterday);
                return (
                  <tr key={ep.id} onClick={() => onEndpoint(ep.id)}
                    className={`hover:bg-muted/40 transition-colors cursor-pointer group ${lb} ${ep.status==="erroring"?"bg-rose-500/[0.03]":""}`}>
                    <td className="px-3 py-3"><GradeBadge grade={grade} /></td>
                    <td className="px-3 py-3"><MethodBadge method={ep.method} /></td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <p className="font-mono text-[11px] text-foreground truncate">{ep.path}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{ep.description}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="tabular-nums text-[12px] font-bold text-foreground">{ep.calls_today.toLocaleString()}</p>
                      <p className={`text-[9px] font-semibold flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {trend >= 0 ? <ArrowUp className="h-2 w-2" /> : <ArrowDown className="h-2 w-2" />}
                        {Math.abs(trend)}% vs yesterday
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="tabular-nums text-[12px] font-bold text-sky-600 dark:text-sky-400">{fmtCount(ep.calls_lifetime)}</p>
                      <p className="text-[9px] text-muted-foreground">since launch</p>
                    </td>
                    <td className={`px-3 py-3 tabular-nums text-[12px] font-semibold ${msC}`}>{ep.avg_ms}ms</td>
                    <td className={`px-3 py-3 tabular-nums text-[12px] font-semibold ${p99C}`}>{ep.p99 >= 1000 ? `${(ep.p99/1000).toFixed(1)}s` : `${ep.p99}ms`}</td>
                    <td className={`px-3 py-3 tabular-nums text-[12px] ${errC}`}>{ep.error_rate}%</td>
                    <td className="px-3 py-3"><ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service volume chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] font-bold text-foreground mb-1">Hourly Request Volume — Today</p>
        <p className="text-[12px] text-muted-foreground mb-4">All endpoints aggregated for {svc.name}</p>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={svcHourly} barGap={1} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize:9, fill:"#71717a" }} interval={3} />
              <YAxis tick={{ fontSize:9, fill:"#71717a" }} />
              <Tooltip {...TT} />
              <Bar dataKey="requests" fill="#06b6d4" radius={[2,2,0,0]} name="Requests" />
              <Bar dataKey="errors"   fill="#ef4444" radius={[2,2,0,0]} name="Errors" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Endpoint View (Level 3) ──────────────────────────────────────────────────

function EndpointView({ ep, svc }: { ep: EndpointDetail; svc: ServiceHealth }) {
  const grade    = calcGrade(ep);
  const insights = generateInsights(ep);
  const hasCrit  = insights.some(i => i.type === "critical");
  const hasWarn  = insights.some(i => i.type === "warning");
  const msDisplay = (ms: number) => ms >= 1000 ? `${(ms/1000).toFixed(2)}s` : `${ms}ms`;

  return (
    <div className="space-y-5">
      {hasCrit ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-rose-500">Attention Required</p>
            <p className="text-[12px] text-rose-600/80 dark:text-rose-400/80">This endpoint is experiencing critical issues. Review the errors below and act immediately.</p>
          </div>
        </div>
      ) : hasWarn ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <p className="text-[12px] text-amber-600/90 dark:text-amber-400/90 font-medium">Performance warnings detected — review Insights section below.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-[12px] text-emerald-600/90 dark:text-emerald-400/90 font-medium">Endpoint is operational and within all SLA bounds.</p>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <GradeBadge grade={grade} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <MethodBadge method={ep.method} />
                <code className="text-[14px] font-mono font-bold text-foreground">{ep.path}</code>
              </div>
              <p className="text-[12px] text-muted-foreground mt-1">{ep.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">{svc.name}</span>
                <PriorityBadge priority={svc.priority} />
              </div>
            </div>
          </div>
        </div>

        {/* Latency metrics with tooltips */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label:"Avg",  tip:"Average response time across all requests. Includes both fast and slow requests in one number.", val:msDisplay(ep.avg_ms), n:ep.avg_ms, lo:500, hi:250, inv:false },
            { label:"P50",  tip:"Median — 50% of requests finish in this time or faster. Your typical user's experience.", val:msDisplay(ep.p50), n:ep.p50, lo:400, hi:200, inv:false },
            { label:"P95",  tip:"95th Percentile — 95 of 100 requests are faster than this. 5 in 100 users experience worse.", val:msDisplay(ep.p95), n:ep.p95, lo:1000, hi:500, inv:false },
            { label:"P99",  tip:"99th Percentile — 99 of 100 requests are faster. Represents your worst-case 1% of users.", val:msDisplay(ep.p99), n:ep.p99, lo:3000, hi:1000, inv:false },
            { label:"Error",tip:"Percentage of requests that returned an error (4xx or 5xx). For banking APIs, target < 0.5%.", val:`${ep.error_rate}%`, n:ep.error_rate*100, lo:500, hi:100, inv:true },
            { label:"Apdex",tip:"Application Performance Index. 0.0–1.0 score for user satisfaction. 0.94+ = Excellent. < 0.50 = Unacceptable.", val:ep.apdex.toFixed(2), n:ep.apdex*100, lo:70, hi:94, inv:false },
          ].map(k => {
            const cls = k.inv
              ? (k.n < k.hi ? "text-emerald-500" : k.n >= k.lo ? "text-rose-500" : "text-amber-500")
              : (k.n <= k.hi ? "text-emerald-500" : k.n >= k.lo ? "text-rose-500" : "text-amber-500");
            return (
              <div key={k.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <p className="text-[9px] text-muted-foreground">{k.label}<InfoTip text={k.tip} /></p>
                <p className={`text-[18px] font-extrabold tabular-nums leading-tight ${cls}`}>{k.val}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call frequency */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] font-bold text-foreground mb-1">Call Frequency</p>
        <p className="text-[12px] text-muted-foreground mb-4">How many times this endpoint has been called</p>
        <CallFrequency today={ep.calls_today} yesterday={ep.calls_yesterday} calls7d={ep.calls_7d} lifetime={ep.calls_lifetime} />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[14px] font-bold text-foreground">Request Volume — Today</p>
          <p className="text-[12px] text-muted-foreground mt-0.5 mb-4">Hourly breakdown of calls and errors</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ep.hourly} barGap={2} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize:9, fill:"#71717a" }} interval={3} />
                <YAxis tick={{ fontSize:9, fill:"#71717a" }} />
                <Tooltip {...TT} />
                <Bar dataKey="requests" fill="#06b6d4" radius={[2,2,0,0]} name="Requests" />
                <Bar dataKey="errors"   fill="#ef4444" radius={[2,2,0,0]} name="Errors" opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[14px] font-bold text-foreground">Response Time — Hourly</p>
          <p className="text-[12px] text-muted-foreground mt-0.5 mb-4">Average ms per hour (spikes = slowdowns)</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ep.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize:9, fill:"#71717a" }} interval={3} />
                <YAxis tick={{ fontSize:9, fill:"#71717a" }} unit="ms" />
                <Tooltip {...TT} formatter={(v: number) => [`${v}ms`, "Avg Response"]} />
                <Line type="monotone" dataKey="avg_ms" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status codes + Insights */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[14px] font-bold text-foreground mb-4">HTTP Response Code Breakdown</p>
          <div className="space-y-3">
            {ep.status_codes.map(sc => (
              <div key={sc.code}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold tabular-nums text-[14px] w-[40px] ${statusCodeColor(sc.code)}`}>{sc.code}</span>
                    <span className="text-[11px] text-muted-foreground">{sc.label}</span>
                    {sc.code === 200 && <InfoTip text="Success — request completed normally." />}
                    {sc.code === 201 && <InfoTip text="Created — new resource was successfully created." />}
                    {sc.code === 400 && <InfoTip text="Bad Request — client sent malformed or invalid data." />}
                    {sc.code === 401 && <InfoTip text="Unauthorized — missing or invalid authentication token." />}
                    {sc.code === 404 && <InfoTip text="Not Found — the requested resource does not exist." />}
                    {sc.code === 408 && <InfoTip text="Request Timeout — the server took too long to process. Usually a database or external service issue." />}
                    {sc.code === 409 && <InfoTip text="Conflict — duplicate submission or race condition. Two requests tried to do the same thing simultaneously." />}
                    {sc.code === 422 && <InfoTip text="Unprocessable Entity — validation failed. The data was received but failed business rules (e.g. wrong phone format, duplicate BVN)." />}
                    {sc.code === 500 && <InfoTip text="Internal Server Error — unhandled exception in the server code. Always requires investigation. Check Laravel logs." />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground tabular-nums">{sc.count.toLocaleString()}</span>
                    <span className={`text-[11px] font-bold tabular-nums w-[40px] text-right ${statusCodeColor(sc.code)}`}>{sc.pct}%</span>
                  </div>
                </div>
                <div className="h-[5px] rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${statusCodeBar(sc.code)}`} style={{ width:`${sc.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <p className="text-[14px] font-bold text-foreground">Smart Insights & Recommendations</p>
          </div>
          <div className="space-y-2.5">
            {insights.map((ins, i) => {
              const c = INSIGHT_CFG[ins.type];
              return (
                <div key={i} className={`rounded-xl border p-3 ${c.cls}`}>
                  <div className="flex items-start gap-2">
                    <c.Icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${INSIGHT_ICON_CLS[ins.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground">{ins.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{ins.desc}</p>
                      {ins.action && (
                        <p className="text-[10px] font-medium text-foreground/70 mt-1.5 bg-black/5 dark:bg-white/5 rounded px-2 py-1">→ {ins.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error log */}
      {ep.errors.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <p className="text-[14px] font-bold text-foreground">Recent Error Log</p>
            <span className="text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/25 rounded-full px-2 py-0.5">{ep.errors.length} errors</span>
          </div>
          <div className="space-y-2">
            {ep.errors.map(err => (
              <div key={err.id} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-[14px] tabular-nums ${statusCodeColor(err.code)}`}>{err.code}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{err.ts}</span>
                    <span className={`text-[10px] font-semibold ${err.duration_ms > 5000 ? "text-rose-500" : err.duration_ms > 1000 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {msDisplay(err.duration_ms)}
                    </span>
                  </div>
                  <code className="font-mono text-[9px] text-muted-foreground">{err.trace}</code>
                </div>
                <p className="font-mono text-[11px] text-foreground leading-relaxed break-words">{err.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SystemMonitor() {
  const [view, setView]                   = useState<View>({ mode:"overview" });
  const [secondsUntil, setSecondsUntil]   = useState(30);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [liveTime, setLiveTime]           = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => { setSecondsUntil(s => s <= 1 ? 30 : s - 1); setLiveTime(new Date()); }, 1000);
    return () => clearInterval(t);
  }, []);

  const { data: services = MOCK_SERVICES, refetch } = useQuery({
    queryKey:["monitor-services"],
    queryFn:async (): Promise<ServiceHealth[]> => MOCK_SERVICES, // TODO: replace with monitorApi.getServices()
    refetchInterval:30_000, staleTime:25_000,
  });

  const handleRefresh = () => { refetch(); setLastRefreshed(new Date()); setSecondsUntil(30); };

  const live       = services.filter(s => s.status !== "coming_soon");
  const score      = Math.round(live.reduce((a, s) => a + (s.uptime_24h * (1 - s.error_rate / 100)), 0) / Math.max(live.length, 1));
  const avgUptime  = live.reduce((a, s) => a + s.uptime_24h, 0) / Math.max(live.length, 1);
  const avgSuccess = live.reduce((a, s) => a + (100 - s.error_rate), 0) / Math.max(live.length, 1);
  const totalCalls = services.reduce((a, s) => a + s.requests_today, 0);
  const totalErrs  = services.reduce((a, s) => a + Math.round(s.requests_today * s.error_rate / 100), 0);
  const errPct     = totalCalls > 0 ? ((totalErrs / totalCalls) * 100).toFixed(2) : "0.00";
  const grandTotal = services.reduce((a, s) => a + s.calls_lifetime, 0);

  const currentSvc = view.mode !== "overview" ? services.find(s => s.id === view.serviceId) : undefined;
  const currentEp  = view.mode === "endpoint" && currentSvc ? currentSvc.endpoints.find(e => e.id === view.endpointId) : undefined;

  const crumbs = [
    { label:"Overview", onClick: view.mode !== "overview" ? () => setView({ mode:"overview" }) : undefined },
    ...(currentSvc ? [{ label:currentSvc.short, onClick: view.mode === "endpoint" ? () => setView({ mode:"service", serviceId:currentSvc.id }) : undefined }] : []),
    ...(currentEp  ? [{ label:`${currentEp.method} ${currentEp.path}` }] : []),
  ];

  const allProblematic = services.flatMap(s => s.endpoints.filter(e => e.status !== "healthy").map(e => ({ svc:s, ep:e })));

  return (
    <DashboardLayout title="API Control Center">
      <style>{`
        @keyframes pulse-border-amber { 0%,100%{border-color:rgba(245,158,11,0.4)} 50%{border-color:rgba(245,158,11,1)} }
        @keyframes pulse-border-red   { 0%,100%{border-color:rgba(239,68,68,0.4)}  50%{border-color:rgba(239,68,68,1)}  }
        @keyframes hb-pulse           { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .card-degraded { animation: pulse-border-amber 2.4s ease-in-out infinite; }
        .card-down     { animation: pulse-border-red   1.2s ease-in-out infinite; }
        .hb-icon       { animation: hb-pulse 1.1s ease-in-out infinite; }
      `}</style>

      <div className="space-y-5">

        {/* ── Dark control-center header ───────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(135deg,#020c22 0%,#041228 60%,#030e1e 100%)", border:"1px solid rgba(56,96,200,0.22)" }}>
          <div className="px-6 py-4" style={{ backgroundImage:"radial-gradient(rgba(56,96,200,0.12) 1px,transparent 1px)", backgroundSize:"28px 28px" }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background:"rgba(0,229,255,0.1)", border:"1px solid rgba(0,229,255,0.25)" }}>
                  <Radio className="h-5 w-5" style={{ color:"#00E5FF" }} />
                  <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div>
                  <h1 className="text-[20px] font-extrabold tracking-tight text-white">API Control Center</h1>
                  <p style={{ color:"rgba(148,163,184,0.7)", fontSize:11, marginTop:2 }}>
                    {liveTime.toLocaleTimeString()} · Auto-refresh in <span style={{ color:"#00E5FF", fontWeight:700 }}>{secondsUntil}s</span>
                    {" · "}<span style={{ color:"rgba(148,163,184,0.5)" }}>{fmtCount(grandTotal)} total API calls since launch</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {view.mode !== "overview" && (
                  <button onClick={() => setView({ mode:"overview" })}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 hover:opacity-80 transition-opacity"
                    style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(148,163,184,0.8)", fontSize:12 }}>
                    ← Overview
                  </button>
                )}
                {[
                  { label:"Calls Today", value:totalCalls.toLocaleString(),  color:"#00E5FF" },
                  { label:"Errors",      value:totalErrs.toLocaleString(),   color:totalErrs>100?"#FF4444":"#00E676" },
                  { label:"Error %",     value:`${errPct}%`,                 color:Number(errPct)>2?"#FF4444":"#00E676" },
                  { label:"Services Up", value:`${services.filter(s=>s.status==="healthy").length}/${live.length}`, color:"#00E676" },
                ].map(p => (
                  <div key={p.label} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ color:"rgba(148,163,184,0.6)", fontSize:10 }}>{p.label}</span>
                    <span className="font-bold tabular-nums" style={{ color:p.color, fontSize:14 }}>{p.value}</span>
                  </div>
                ))}
                <button onClick={handleRefresh}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 hover:opacity-80 transition-opacity"
                  style={{ background:"rgba(0,229,255,0.1)", border:"1px solid rgba(0,229,255,0.25)", color:"#00E5FF", fontSize:12, fontWeight:600 }}>
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
            </div>
            {view.mode !== "overview" && (
              <div className="mt-3 pt-3 border-t border-white/[0.08]">
                <Breadcrumb crumbs={crumbs} />
              </div>
            )}
          </div>
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {view.mode === "overview" && (
          <div className="space-y-5">

            {/* Four Golden Signals */}
            <FourGoldenSignals services={services} />

            {/* Gauge + Service Cards */}
            <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center justify-between gap-4">
                <MultiRingGauge health={score} avgUptime={avgUptime} successRate={avgSuccess} />
                <div className="w-full space-y-2 pt-1 border-t border-border">
                  {[
                    { label:"Health Score", val:`${score}`,                  n:score        },
                    { label:"Avg Uptime",   val:`${avgUptime.toFixed(1)}%`,  n:avgUptime    },
                    { label:"Success Rate", val:`${avgSuccess.toFixed(1)}%`, n:avgSuccess   },
                  ].map(l => {
                    const c = statusColors(l.n).text;
                    return (
                      <div key={l.label} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.replace("text-","bg-")}`} />
                          <span className="text-muted-foreground">{l.label}</span>
                        </div>
                        <span className={`font-bold tabular-nums ${c}`}>{l.val}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-border text-center">
                  {[
                    { label:"Healthy",  n:services.filter(s=>s.status==="healthy").length,  cls:"text-emerald-500" },
                    { label:"Degraded", n:services.filter(s=>s.status==="degraded").length, cls:"text-amber-500"   },
                    { label:"Down",     n:services.filter(s=>s.status==="down").length,     cls:"text-rose-500"    },
                  ].map(s => (
                    <div key={s.label}>
                      <p className={`text-[22px] font-extrabold ${s.cls}`}>{s.n}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clickable service cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map(svc => {
                  const isDeg = svc.status === "degraded", isDown = svc.status === "down", isComing = svc.status === "coming_soon";
                  const needAttn = svc.endpoints.filter(e => e.status !== "healthy").length;
                  const lb = isDeg ? "border-l-amber-500" : isDown ? "border-l-rose-500" : isComing ? "border-l-border" : "border-l-emerald-500";
                  const iconBg = isComing ? "bg-muted text-muted-foreground"
                    : isDeg  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : isDown ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    :          "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20";
                  return (
                    <div key={svc.id}
                      onClick={() => !isComing && setView({ mode:"service", serviceId:svc.id })}
                      className={`rounded-2xl border border-border bg-card p-4 border-l-4 ${lb} ${isDeg?"card-degraded":isDown?"card-down":""} ${!isComing?"cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group":""}`}
                      style={{ opacity:isComing?0.55:1 }}>
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                            <ServiceIcon icon={svc.icon} />
                          </div>
                          <PriorityBadge priority={svc.priority} />
                        </div>
                        <div className="flex items-center gap-2">
                          <PulseDot status={svc.status} />
                          {!isComing && <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />}
                        </div>
                      </div>
                      <p className="text-[13px] font-bold text-foreground leading-snug">{svc.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{svc.description}</p>
                      {!isComing ? (
                        <>
                          {needAttn > 0 && (
                            <div className="mt-2 flex items-center gap-1">
                              <Eye className="h-3 w-3 text-amber-500" />
                              <span className="text-[10px] font-bold text-amber-500">{needAttn} endpoint{needAttn>1?"s":""} need attention</span>
                            </div>
                          )}
                          <div className="mt-3 flex items-end justify-between">
                            <div className="flex gap-3">
                              <div>
                                <p className="text-[9px] text-muted-foreground">Apdex</p>
                                <p className={`text-[15px] font-extrabold tabular-nums ${svc.apdex>=0.94?"text-emerald-500":svc.apdex>=0.70?"text-amber-500":"text-rose-500"}`}>{svc.apdex.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-muted-foreground">Error %</p>
                                <p className={`text-[15px] font-extrabold tabular-nums ${svc.error_rate<1?"text-emerald-500":svc.error_rate<5?"text-amber-500":"text-rose-500"}`}>{svc.error_rate}%</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-muted-foreground">Lifetime</p>
                                <p className="text-[15px] font-extrabold tabular-nums text-sky-600 dark:text-sky-400">{fmtCount(svc.calls_lifetime)}</p>
                              </div>
                            </div>
                            <MiniSparkline data={svc.sparkline} status={svc.status} />
                          </div>
                          <SlaBar target={svc.sla_target} actual={svc.uptime_24h} />
                        </>
                      ) : (
                        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> API development in progress
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KPI strip */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label:"Calls Today",     value:totalCalls.toLocaleString(),  icon:Activity,     iconCls:"bg-cyan-500/10 text-cyan-500 border-cyan-500/20",     valCls:"text-cyan-600 dark:text-cyan-400"    },
                { label:"Lifetime Calls",  value:fmtCount(grandTotal),         icon:TrendingUp,   iconCls:"bg-violet-500/10 text-violet-500 border-violet-500/20", valCls:"text-violet-600 dark:text-violet-400" },
                { label:"Errors Today",    value:totalErrs.toLocaleString(),   icon:AlertTriangle,iconCls:"bg-rose-500/10 text-rose-500 border-rose-500/20",     valCls:"text-rose-500"                       },
                { label:"Error Rate",      value:`${errPct}%`,                 icon:TrendingDown, iconCls:Number(errPct)>2?"bg-rose-500/10 text-rose-500 border-rose-500/20":"bg-emerald-500/10 text-emerald-500 border-emerald-500/20", valCls:Number(errPct)>2?"text-rose-500":"text-emerald-500" },
                { label:"Avg Response",    value:`${Math.round(live.reduce((a,s)=>a+s.avg_response_ms,0)/Math.max(live.length,1))}ms`, icon:Zap, iconCls:"bg-amber-500/10 text-amber-500 border-amber-500/20", valCls:"text-amber-600 dark:text-amber-400" },
                { label:"Live Services",   value:`${live.length} / ${services.length}`, icon:ShieldCheck, iconCls:"bg-emerald-500/10 text-emerald-500 border-emerald-500/20", valCls:"text-emerald-600 dark:text-emerald-400" },
              ].map(k => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${k.iconCls}`}>
                    <k.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{k.label}</p>
                    <p className={`text-[18px] font-extrabold tabular-nums leading-tight ${k.valCls}`}>{k.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Attention panel */}
            {allProblematic.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500 hb-icon" />
                  <p className="text-[14px] font-bold text-foreground">Endpoints Needing Attention</p>
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded-full px-2 py-0.5">{allProblematic.length}</span>
                </div>
                <div className="space-y-2">
                  {allProblematic.map(({ svc, ep }) => {
                    const grade = calcGrade(ep);
                    const trend = trendPct(ep.calls_today, ep.calls_yesterday);
                    return (
                      <div key={ep.id}
                        onClick={() => setView({ mode:"endpoint", serviceId:svc.id, endpointId:ep.id })}
                        className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/60 transition-colors group">
                        <GradeBadge grade={grade} />
                        <MethodBadge method={ep.method} />
                        <div className="flex-1 min-w-0">
                          <code className="text-[11px] font-mono text-foreground">{ep.path}</code>
                          <span className="text-[10px] text-muted-foreground ml-2">{svc.short}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 text-[11px]">
                          <span className="text-muted-foreground">{fmtCount(ep.calls_today)} today</span>
                          <span className={`font-bold ${ep.error_rate>=5?"text-rose-500":"text-amber-500"}`}>{ep.error_rate}% err</span>
                          <span className={`${ep.p99>3000?"text-rose-500":"text-amber-500"}`}>P99 {ep.p99>=1000?`${(ep.p99/1000).toFixed(1)}s`:`${ep.p99}ms`}</span>
                          <span className={`font-semibold ${trend>=0?"text-emerald-500":"text-rose-500"}`}>
                            {trend>=0?"↑":"↓"}{Math.abs(trend)}%
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Glossary */}
            <GlossaryPanel />
          </div>
        )}

        {/* ── SERVICE VIEW ─────────────────────────────────────────────── */}
        {view.mode === "service" && currentSvc && (
          <ServiceView
            svc={currentSvc}
            onEndpoint={(id) => setView({ mode:"endpoint", serviceId:currentSvc.id, endpointId:id })}
          />
        )}

        {/* ── ENDPOINT VIEW ────────────────────────────────────────────── */}
        {view.mode === "endpoint" && currentSvc && currentEp && (
          <EndpointView ep={currentEp} svc={currentSvc} />
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border text-[11px] text-muted-foreground">
          <span>Fynix API Control Center · {live.length} live services · {services.reduce((a,s)=>a+s.endpoints.length,0)} endpoints · {fmtCount(grandTotal)} total calls</span>
          <span>Last refreshed {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
