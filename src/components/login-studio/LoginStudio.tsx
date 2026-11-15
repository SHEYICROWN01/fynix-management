import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  X, Sparkles, RefreshCw, Check, Monitor, Smartphone, Loader2, ImagePlus, Lock, Unlock, ChevronLeft, ChevronRight, Info, Sun, Sunset, Moon, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { LoginDesignView, normaliseDesign, type LoginBrand, type LoginDesign } from "@/components/login-templates/LoginDesignView";
import { BUSINESS_TYPES, LAYOUTS, type BusinessType, type HeroTime, type LayoutId } from "@/components/login-templates/types";

/** What we know about the business — the AI writes the login page from this. Stored with the design. */
export interface LoginProfile {
  name: string;
  business_type: BusinessType | "";
  services: string[];
  description: string;
  slogan: string;
  audience: string;
  city: string;
  state: string;
  year_founded: string;
  licence_line: string;
  support_phone: string;
  support_email: string;
}

export const emptyLoginProfile = (p: Partial<LoginProfile> = {}): LoginProfile => ({
  name: "", business_type: "", services: [], description: "", slogan: "", audience: "", city: "", state: "",
  year_founded: "", licence_line: "", support_phone: "", support_email: "", ...p,
});

const SERVICES: Record<BusinessType, string[]> = {
  microfinance_bank: ["SME loans", "Savings accounts", "Fixed deposits", "Salary loans", "Agric loans", "Mobile banking"],
  cooperative: ["Member savings", "Member loans", "Monthly contributions", "Share capital", "Dividends", "Asset financing"],
  savings_and_loans: ["Daily savings", "Target savings", "Esusu / Ajo", "Market collections", "Quick loans"],
  lending_company: ["Payday loans", "SME loans", "Quick loans", "Asset financing", "Device loans"],
  finance_house: ["Asset financing", "Lease financing", "Business loans", "Fixed deposits", "Invoice financing"],
  mortgage_bank: ["Home loans", "Mortgage savings", "Construction loans", "Refinancing"],
};

const TIMES: { id: HeroTime; label: string; icon: typeof Sun }[] = [
  { id: "morning", label: "Morning", icon: Sun },
  { id: "golden", label: "Golden hour", icon: Sunset },
  { id: "evening", label: "Evening", icon: Moon },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Colours + logo the design is drawn with. */
  brand: LoginBrand;
  /** The logo file (onboarding, not uploaded yet) — sent to the image AI when one is configured. */
  logoFile?: File | null;
  initialProfile: LoginProfile;
  initialDesign?: LoginDesign | null;
  onUse: (design: LoginDesign, profile: LoginProfile) => void | Promise<void>;
  useLabel?: string;
}

const errText = (e: unknown) => {
  const x = e as { message?: string; errors?: Record<string, string[]> };
  const first = x?.errors && Object.values(x.errors)[0]?.[0];
  return first || x?.message || "Something went wrong. Please try again.";
};

export function LoginStudio({ open, onClose, brand, logoFile, initialProfile, initialDesign, onUse, useLabel = "Use this design" }: Props) {
  const [profile, setProfile] = useState<LoginProfile>(initialProfile);
  const [history, setHistory] = useState<LoginDesign[]>(initialDesign ? [initialDesign] : []);
  const [index, setIndex] = useState(initialDesign ? 0 : -1);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [lockLayout, setLockLayout] = useState(false);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [uploading, setUploading] = useState(false);
  const attempt = useRef(initialDesign ? 1 : 0);
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setProfile(initialProfile);
    if (initialDesign) { setHistory([initialDesign]); setIndex(0); attempt.current = 1; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, busy, saving, onClose]);

  const design = index >= 0 ? history[index] : null;
  const set = <K extends keyof LoginProfile>(k: K, v: LoginProfile[K]) => setProfile(p => ({ ...p, [k]: v }));
  const presets = profile.business_type ? SERVICES[profile.business_type] : [];

  /** Small changes (picture, layout) edit the current design in place without a new AI call. */
  const tweak = (fn: (d: LoginDesign) => LoginDesign) => {
    if (!design) return;
    setHistory(h => h.map((d, i) => (i === index ? fn(d) : d)));
  };

  const generate = async () => {
    if (!profile.name.trim()) { toast.error("Enter the institution name first (step 1)."); return; }
    if (!profile.business_type) { toast.error("Choose what kind of institution this is."); return; }
    setBusy(true);
    setNotes([]);
    try {
      const res = await api.generateLoginDesign(
        { ...profile, year_founded: profile.year_founded || undefined },
        {
          attempt: attempt.current,
          layout: lockLayout && design ? design.layout : null,
          avoidHeadlines: history.map(d => `${d.copy.headline} ${d.copy.headlineAccent}`),
          logo: logoFile,
        },
      );
      const d = normaliseDesign(res.data.design, profile.name);
      if (!d) throw { message: "The server sent an unexpected design. Please try again." };
      // Keep an uploaded photo across regenerations.
      if (design?.hero.kind === "photo" && design.hero.photoUrl && d.hero.kind !== "photo") {
        d.hero = { ...d.hero, kind: "photo", photoUrl: design.hero.photoUrl };
      }
      attempt.current += 1;
      setHistory(h => { const next = [...h, d].slice(-12); setIndex(next.length - 1); return next; });
      setNotes(res.data.notes ?? []);
    } catch (e) {
      toast.error("Couldn't generate the login page", { description: errText(e) });
    } finally {
      setBusy(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const res = await api.uploadLoginHero(file);
      tweak(d => ({ ...d, hero: { ...d.hero, kind: "photo", photoUrl: res.data.url } }));
      toast.success("Photo added");
    } catch (e) {
      toast.error("Couldn't upload the photo", { description: errText(e) });
    } finally {
      setUploading(false);
    }
  };

  const use = async () => {
    if (!design) return;
    setSaving(true);
    try { await onUse(design, profile); } finally { setSaving(false); }
  };

  const previewBrand = useMemo(() => ({ ...brand, name: profile.name || brand.name }), [brand, profile.name]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* ── Left: business profile ─────────────────────────────────────── */}
      <aside className="w-[360px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center"><Sparkles className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-bold leading-tight">Login Studio</p>
              <p className="text-[11px] text-slate-500">{profile.name || "New institution"}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={busy || saving} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Tell us about the business. The AI writes a login page that fits what they do — a cooperative gets member wording, a lender gets lending wording.
          </p>

          <Field label="Kind of institution" required>
            <div className="grid grid-cols-2 gap-1.5">
              {BUSINESS_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setProfile(p => ({ ...p, business_type: t.id, services: p.business_type === t.id ? p.services : [] }))}
                  className={`text-left text-xs font-medium rounded-lg border px-2.5 py-2 transition ${profile.business_type === t.id ? "border-primary bg-primary/5 text-primary" : "border-slate-200 dark:border-slate-700 hover:border-primary/40"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          {presets.length > 0 && (
            <Field label="What they offer" hint="Pick all that apply">
              <div className="flex flex-wrap gap-1.5">
                {presets.map(s => {
                  const on = profile.services.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => set("services", on ? profile.services.filter(x => x !== s) : [...profile.services, s])}
                      className={`text-xs rounded-full border px-2.5 py-1 transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 dark:border-slate-700 hover:border-primary/40"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <Field label="Who they serve" hint="Optional">
            <Text value={profile.audience} onChange={v => set("audience", v)} max={120} placeholder="e.g. market traders and civil servants" />
          </Field>
          <Field label="About the business" hint="Optional — in their own words">
            <textarea value={profile.description} onChange={e => set("description", e.target.value.slice(0, 400))} rows={3}
              placeholder="e.g. Serving traders in Wuse market since 2012 with quick loans and daily savings."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slogan" hint="Optional"><Text value={profile.slogan} onChange={v => set("slogan", v)} max={80} placeholder="Growing with you" /></Field>
            <Field label="Year founded" hint="Optional"><Text value={profile.year_founded} onChange={v => set("year_founded", v.replace(/\D/g, "").slice(0, 4))} max={4} placeholder="2012" /></Field>
          </div>
          <Field label="Licence line" hint="Only if true — shown on the page">
            <Text value={profile.licence_line} onChange={v => set("licence_line", v)} max={70} placeholder="Licensed by the CBN · RC 1234567" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Support phone"><Text value={profile.support_phone} onChange={v => set("support_phone", v)} max={24} placeholder="0700 000 0000" /></Field>
            <Field label="Support email"><Text value={profile.support_email} onChange={v => set("support_email", v)} max={60} placeholder="help@bank.com" /></Field>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Button onClick={generate} disabled={busy} className="w-full h-11">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : design ? <RefreshCw className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {busy ? "Designing…" : design ? "Regenerate" : "Generate login page"}
          </Button>
          {design && (
            <button type="button" onClick={() => setLockLayout(v => !v)} className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              {lockLayout ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              {lockLayout ? `Keeping the ${design.layout} layout — only words & picture change` : "Regenerate may also change the layout"}
            </button>
          )}
        </div>
      </aside>

      {/* ── Right: preview ─────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="h-16 px-5 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            {LAYOUTS.map(l => (
              <button key={l.id} disabled={!design} onClick={() => tweak(d => ({ ...d, layout: l.id as LayoutId }))} title={l.note}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition disabled:opacity-40 ${design?.layout === l.id ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {history.length > 1 && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mr-2">
                <button className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30" disabled={index <= 0} onClick={() => setIndex(i => i - 1)} aria-label="Previous version"><ChevronLeft className="h-4 w-4" /></button>
                Version {index + 1} of {history.length}
                <button className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30" disabled={index >= history.length - 1} onClick={() => setIndex(i => i + 1)} aria-label="Next version"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              <button onClick={() => setDevice("desktop")} className={`h-7 w-8 grid place-items-center rounded-md ${device === "desktop" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"}`} aria-label="Desktop preview"><Monitor className="h-4 w-4" /></button>
              <button onClick={() => setDevice("phone")} className={`h-7 w-8 grid place-items-center rounded-md ${device === "phone" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"}`} aria-label="Phone preview"><Smartphone className="h-4 w-4" /></button>
            </div>
            <Button onClick={use} disabled={!design || busy || saving} className="h-9">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}{useLabel}
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-6">
          {notes.length > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-xs dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200">
              <Info className="h-4 w-4 shrink-0 mt-px" /><div>{notes.map(n => <p key={n}>{n}</p>)}</div>
            </div>
          )}

          {!design ? (
            <div className="h-full min-h-[420px] grid place-items-center">
              <div className="text-center max-w-sm">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                  {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                </div>
                <p className="font-semibold">{busy ? "Designing their login page…" : "Their own login page, designed in seconds"}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {busy ? "Writing the wording and composing the page." : "Choose the kind of institution on the left, then press Generate. Don't like it? Press Regenerate."}
                </p>
              </div>
            </div>
          ) : (
            <div className={`relative ${device === "phone" ? "flex justify-center" : ""}`}>
              <div className={`rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 ${device === "phone" ? "" : "bg-white"} ${busy ? "opacity-60 transition" : ""}`}>
                <LoginDesignView design={design} brand={previewBrand} mode="preview" device={device} />
              </div>
              {busy && <div className="absolute inset-0 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            </div>
          )}

          {design && (
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Picture</span>
                <div className="flex items-center gap-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                  {TIMES.map(t => (
                    <button key={t.id} onClick={() => tweak(d => ({ ...d, hero: { ...d.hero, kind: "illustration", time: t.id } }))} title={t.label}
                      className={`h-7 px-2 rounded-md flex items-center gap-1 ${design.hero.kind === "illustration" && design.hero.time === t.id ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-800"}`}>
                      <t.icon className="h-3.5 w-3.5" />{t.label}
                    </button>
                  ))}
                </div>
                {design.hero.scene !== "community" && design.hero.scene !== "market" && (
                  <div className="flex items-center gap-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                    {[0, 1, 2].map(v => (
                      <button key={v} onClick={() => tweak(d => ({ ...d, hero: { ...d.hero, kind: "illustration", variant: v } }))} title={`Building style ${v + 1}`}
                        className={`h-7 px-2 rounded-md flex items-center gap-1 ${design.hero.kind === "illustration" && design.hero.variant === v ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-800"}`}>
                        <Building2 className="h-3.5 w-3.5" />{v + 1}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => tweak(d => ({ ...d, hero: { ...d.hero, kind: "illustration", scene: d.hero.scene === "community" ? "branch" : "community" } }))}
                  className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-900">
                  {design.hero.scene === "community" ? "Show a building" : "Show a community scene"}
                </button>
                <button onClick={() => photoInput.current?.click()} disabled={uploading}
                  className={`h-9 px-3 rounded-lg border flex items-center gap-1.5 ${design.hero.kind === "photo" ? "border-primary text-primary bg-primary/5" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-900"}`}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {design.hero.kind === "photo" ? "Their photo (replace)" : "Use their real photo"}
                </button>
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadPhoto(f); }} />
              </div>
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                <input type="checkbox" checked={design.showPreview} onChange={e => tweak(d => ({ ...d, showPreview: e.target.checked }))} />
                Show dashboard preview (Showcase)
              </label>
              <span className="text-slate-400">{design.generatedBy === "ai" ? "Wording written by AI" : "Built-in wording"} · {design.font} font</span>
            </div>
          )}
        </div>
      </main>
    </div>,
    document.body,
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}{required && <span className="text-red-500"> *</span>}</span>
        {hint && <span className="text-[10.5px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Text({ value, onChange, max, placeholder }: { value: string; onChange: (v: string) => void; max: number; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value.slice(0, max))} placeholder={placeholder}
      className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm outline-none focus:border-primary" />
  );
}
