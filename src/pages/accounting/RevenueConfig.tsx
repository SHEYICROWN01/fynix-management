import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2, XCircle, Clock, Zap, Plus, Activity,
} from "lucide-react";
import { financeApi, type FinRevenueSource } from "@/lib/api";

function fmtNGN(n: number | undefined | null): string {
  const v = n ?? 0;
  if (v >= 1_000_000_000) return `₦${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v.toLocaleString()}`;
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

const CATEGORIES = ["Subscription", "Transaction Fee", "SMS", "Setup Fee", "API", "Support", "Other"];

function StatusBadge({ status }: { status: FinRevenueSource["status"] }) {
  if (status === "active") return (
    <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Active
    </span>
  );
  if (status === "coming_soon") return (
    <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
      <Clock className="h-3 w-3" /> Coming Soon
    </span>
  );
  return (
    <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-muted border-border text-muted-foreground">
      <XCircle className="h-3 w-3" /> Inactive
    </span>
  );
}

export default function RevenueConfig() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", gl_account_code: "" });
  const [category, setCategory] = useState("Subscription");
  const [autoPost, setAutoPost] = useState(true);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["fin-revenue-sources"],
    queryFn: () => financeApi.listRevenueSources(),
    select: (d) => Array.isArray(d) ? d : [],
    staleTime: 2 * 60_000,
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => financeApi.toggleRevenueSource(id),
    onMutate: (id) => setToggling(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-revenue-sources"] });
      toast.success("Revenue source updated");
    },
    onError: () => toast.error("Toggle failed"),
    onSettled: () => setToggling(null),
  });

  const createMut = useMutation({
    mutationFn: () => financeApi.createRevenueSource({
      name: form.name,
      description: form.description,
      category,
      gl_account_code: form.gl_account_code,
      auto_post: autoPost,
    }),
    onSuccess: () => {
      toast.success("Revenue source created");
      setOpen(false);
      setForm({ name: "", description: "", gl_account_code: "" });
      setCategory("Subscription");
      setAutoPost(true);
      qc.invalidateQueries({ queryKey: ["fin-revenue-sources"] });
    },
    onError: () => toast.error("Failed to create revenue source"),
  });

  const active = sources.filter((s) => s.status === "active");
  const comingSoon = sources.filter((s) => s.status === "coming_soon");
  const autoPosting = sources.filter((s) => s.auto_post);
  const totalMtd = sources.reduce((sum, s) => sum + s.mtd_revenue, 0);

  const kpiCards = [
    { label: "Active Sources", value: String(active.length), icon: CheckCircle2, tone: "emerald" },
    { label: "Coming Soon", value: String(comingSoon.length), icon: Clock, tone: "blue" },
    { label: "Auto-Posting", value: String(autoPosting.length), icon: Zap, tone: "violet" },
    { label: "Total MTD Revenue", value: fmtNGN(totalMtd), icon: Activity, tone: "rose" },
  ];

  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <DashboardLayout title="Revenue Configuration">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Revenue Configuration</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Manage revenue streams and auto-posting rules</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Revenue Source
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-[110px]" />)
            : kpiCards.map((k) => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${toneMap[k.tone]}`}>
                    <k.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">{k.value}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{k.label}</p>
                </div>
              ))}
        </div>

        {/* Sources table */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Revenue Sources</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{sources.length} configured sources</p>
          </div>
          {isLoading ? <Sk className="h-[300px]" /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Source", "Category", "GL Code", "MTD Revenue", "Auto-Post", "Modules", "Status", "Toggle"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sources.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-12 text-center text-[13px] text-muted-foreground">No revenue sources configured</td></tr>
                  ) : sources.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3">
                        <p className="text-[13px] font-medium text-foreground">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[180px] truncate">{s.description}</p>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">{s.category}</td>
                      <td className="px-3 py-3 text-[12px] font-mono text-foreground">{s.gl_account_code}</td>
                      <td className="px-3 py-3 text-[13px] font-semibold text-right text-foreground">{fmtNGN(s.mtd_revenue)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.auto_post ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                          {s.auto_post ? "Auto" : "Manual"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">
                        {s.integration_modules.length > 0 ? s.integration_modules.join(", ") : "—"}
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-3 py-3">
                        <Switch
                          checked={s.status === "active"}
                          disabled={toggling === s.id}
                          onCheckedChange={() => toggleMut.mutate(s.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Revenue Source</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[13px]">Source Name</Label>
              <Input placeholder="e.g. Subscription Fee" className="mt-1.5" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-[13px]">Description</Label>
              <Input placeholder="Brief description" className="mt-1.5" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[13px]">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[13px]">GL Account Code</Label>
                <Input placeholder="e.g. 4001" className="mt-1.5" value={form.gl_account_code} onChange={(e) => setForm((p) => ({ ...p, gl_account_code: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-[13px] font-medium text-foreground">Auto-Post to GL</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Automatically post entries to General Ledger</p>
              </div>
              <Switch checked={autoPost} onCheckedChange={setAutoPost} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={!form.name || !form.description || !form.gl_account_code || createMut.isPending}
            >
              {createMut.isPending ? "Creating…" : "Create Source"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
