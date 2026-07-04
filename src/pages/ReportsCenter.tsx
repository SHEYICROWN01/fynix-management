import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Receipt,
  Scale,
  Activity,
  Building2,
  ScrollText,
  Download,
  Loader2,
  CalendarClock,
  Clock,
  type LucideIcon,
} from "lucide-react";

function sr(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const INSTITUTIONS = [
  "Heritage Bank",
  "Palmpay Ltd",
  "Moniepoint Inc",
  "Kuda MFB",
  "Carbon MFB",
  "FairMoney MFB",
  "Opay Digital",
  "VFD MFB",
  "Sparkle MFB",
  "Branch Intl",
];

interface Category {
  key: string;
  title: string;
  desc: string;
  count: string;
  icon: LucideIcon;
  border: string;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    key: "settlement",
    title: "Settlement Reports",
    desc: "Daily, weekly, monthly NIBSS settlement summaries",
    count: "12 reports this month",
    icon: ArrowLeftRight,
    border: "border-l-4 border-emerald-500",
    color: "text-emerald-500",
  },
  {
    key: "revenue",
    title: "Revenue Reports",
    desc: "MRR, ARR, revenue by institution and service",
    count: "8 reports",
    icon: Receipt,
    border: "border-l-4 border-blue-500",
    color: "text-blue-500",
  },
  {
    key: "cbn",
    title: "CBN Regulatory",
    desc: "Mandatory CBN compliance and suspicious activity reports",
    count: "4 reports",
    icon: Scale,
    border: "border-l-4 border-amber-500",
    color: "text-amber-500",
  },
  {
    key: "transaction",
    title: "Transaction Reports",
    desc: "Volume, channel breakdown, failed transaction analysis",
    count: "19 reports",
    icon: Activity,
    border: "border-l-4 border-violet-500",
    color: "text-violet-500",
  },
  {
    key: "institution",
    title: "Institution Reports",
    desc: "Per-institution performance, vault health, onboarding",
    count: "7 reports",
    icon: Building2,
    border: "border-l-4 border-rose-500",
    color: "text-rose-500",
  },
  {
    key: "audit",
    title: "Audit Reports",
    desc: "Complete system audit trail exports",
    count: "3 reports",
    icon: ScrollText,
    border: "border-l-4 border-slate-500",
    color: "text-slate-500",
  },
];

const FORMATS = ["PDF", "CSV", "Excel"];
function formatBadge(f: string) {
  const map: Record<string, string> = {
    PDF: "rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400",
    CSV: "rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400",
    Excel: "rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400",
  };
  return map[f] ?? map.PDF;
}

export default function ReportsCenter() {
  const [type, setType] = useState("settlement");
  const [institution, setInstitution] = useState("all");
  const [from, setFrom] = useState("2026-06-01");
  const [to, setTo] = useState("2026-06-30");
  const [format, setFormat] = useState("PDF");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [generating, setGenerating] = useState(false);

  const recent = useMemo(() => {
    const r = sr(6612);
    return Array.from({ length: 15 }).map(() => {
      const cat = CATEGORIES[Math.floor(r() * CATEGORIES.length)];
      return {
        id: `RPT-${Math.floor(r() * 90000 + 10000)}`,
        name: cat.title,
        color: cat.color,
        icon: cat.icon,
        institution: r() > 0.4 ? INSTITUTIONS[Math.floor(r() * INSTITUTIONS.length)] : "All Institutions",
        ago: `${Math.floor(r() * 12) + 1}h ago`,
        size: `${(r() * 8 + 0.4).toFixed(1)} MB`,
        format: FORMATS[Math.floor(r() * FORMATS.length)],
      };
    });
  }, []);

  const [schedules, setSchedules] = useState(() => {
    const r = sr(4409);
    const freq = ["Daily", "Weekly", "Monthly"];
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      name: `${CATEGORIES[i % CATEGORIES.length].title.split(" ")[0]} Summary`,
      type: CATEGORIES[i % CATEGORIES.length].title,
      freq: freq[Math.floor(r() * freq.length)],
      next: `${Math.floor(r() * 23) + 1}h`,
      recipient: `ops${Math.floor(r() * 9)}@quovatech.ng`,
      active: r() > 0.3,
    }));
  });

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success("Report generated — ready to download");
    }, 1500);
  };

  return (
    <DashboardLayout title="Reports Center">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Reports Center</h1>
            <p className="text-sm text-muted-foreground">Generate, schedule, and download reports</p>
          </div>
          <Button>
            <CalendarClock className="mr-2 h-4 w-4" /> Schedule Report
          </Button>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.key}
                className={`rounded-[18px] border border-border ${c.border} bg-card p-5 transition-shadow hover:shadow-md`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Icon className={`h-6 w-6 ${c.color}`} />
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {c.count}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setType(c.key);
                    toast.info(`Selected ${c.title}`);
                  }}
                >
                  Generate
                </Button>
              </div>
            );
          })}
        </div>

        {/* Generator + recent */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[18px] border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Generate Report</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Report Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Institution</Label>
                <Select value={institution} onValueChange={setInstitution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Institutions</SelectItem>
                    {INSTITUTIONS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Format</Label>
              <RadioGroup value={format} onValueChange={setFormat} className="flex gap-6">
                {FORMATS.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <RadioGroupItem value={f} id={`fmt-${f}`} />
                    <Label htmlFor={`fmt-${f}`} className="text-sm text-foreground">
                      {f}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Checkbox id="charts" checked={includeCharts} onCheckedChange={(v) => setIncludeCharts(!!v)} />
              <Label htmlFor="charts" className="text-sm text-foreground">
                Include charts
              </Label>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <Button onClick={generate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Estimated time: ~30 seconds
              </span>
            </div>
          </div>

          {/* Recent reports */}
          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
              <h2 className="text-sm font-semibold text-foreground">Recent Reports</h2>
            </div>
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {recent.map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5 transition-colors hover:bg-muted/40"
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${r.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.institution} · {r.ago} · {r.size}
                      </p>
                    </div>
                    <span className={formatBadge(r.format)}>{r.format}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scheduled reports */}
        <div className="rounded-[18px] border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-l-[3px] border-primary pl-3">
            <h2 className="text-sm font-semibold text-foreground">Scheduled Reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Schedule Name</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Frequency</th>
                  <th className="pb-2 pr-3 font-medium">Next Run</th>
                  <th className="pb-2 pr-3 font-medium">Recipient</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{s.name}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{s.type}</td>
                    <td className="py-2.5 pr-3 text-foreground">{s.freq}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">in {s.next}</td>
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-muted-foreground">{s.recipient}</td>
                    <td className="py-2.5 pr-3">
                      <Switch
                        checked={s.active}
                        onCheckedChange={(v) =>
                          setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: v } : x)))
                        }
                      />
                    </td>
                    <td className="py-2.5">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
