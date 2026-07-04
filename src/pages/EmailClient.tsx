import { useState, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Inbox, Send, Search, Edit, Trash2, Reply,
  ChevronDown, ChevronUp, RefreshCw, X,
  Loader2, ChevronLeft, Mail, MailOpen,
  AlertCircle, Clock, Sparkles, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { emailApi, type EmailItem, type EmailDetailResponse } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  ["from-violet-500 to-indigo-600", "#7c3aed"],
  ["from-blue-500 to-cyan-500",     "#3b82f6"],
  ["from-emerald-500 to-teal-500",  "#10b981"],
  ["from-orange-500 to-amber-500",  "#f97316"],
  ["from-rose-500 to-pink-500",     "#f43f5e"],
  ["from-indigo-500 to-purple-600", "#6366f1"],
] as const;

function avatarGradient(seed: string) {
  return AVATAR_GRADIENTS[(seed.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];
}

function initials(name: string | null | undefined, email: string): string {
  const src = name || email;
  return src.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

function formatListTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-NG", { weekday: "short" });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "2-digit" });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function normalizeArr(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split(",").map(s => s.trim()).filter(Boolean);
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function textToHtml(text: string): string {
  return "<p>" + text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ value, onChange, placeholder }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = useCallback(() => {
    const email = input.trim().replace(/,+$/, "");
    if (!email) return;
    if (!isValidEmail(email)) { toast.error(`"${email}" is not a valid email`); return; }
    if (!value.includes(email)) onChange([...value, email]);
    setInput("");
  }, [input, value, onChange]);

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[40px] px-3 py-2 border border-border rounded-xl bg-muted/30 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/15 text-primary text-[11px] font-semibold rounded-full border border-primary/25">
          {tag}
          <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-destructive ml-0.5 transition-colors">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
          if (e.key === "Backspace" && !input && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-muted-foreground/60"
      />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function EmailAvatar({ name, email, size = "md" }: {
  name?: string | null; email: string; size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const [gradient] = avatarGradient(email || "a");
  const sz = size === "xs" ? "h-6 w-6 text-[9px] rounded-lg" :
             size === "sm" ? "h-8 w-8 text-[10px] rounded-xl" :
             size === "lg" ? "h-11 w-11 text-sm rounded-2xl" :
             size === "xl" ? "h-14 w-14 text-base rounded-2xl" :
             "h-9 w-9 text-xs rounded-xl";
  return (
    <div className={cn("bg-gradient-to-br flex items-center justify-center font-bold text-white shrink-0 shadow-sm select-none", gradient, sz)}>
      {initials(name, email)}
    </div>
  );
}

// ─── Email List Item ──────────────────────────────────────────────────────────

function EmailListItem({ email, selected, onClick }: {
  email: EmailItem; selected: boolean; onClick: () => void;
}) {
  const isUnread = !email.is_read;
  const isOutbound = email.direction === "outbound";
  const displayName = isOutbound
    ? (normalizeArr(email.to)[0] || "—")
    : (email.from_name || email.from_email);
  const displayEmail = isOutbound ? (normalizeArr(email.to)[0] || "") : email.from_email;
  const preview = email.body_text?.replace(/\s+/g, " ").trim().slice(0, 75) || "";
  const [, accentColor] = avatarGradient(displayEmail || "a");

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 transition-all duration-150 relative group border-b border-border/30",
        selected
          ? "bg-primary/[0.07] shadow-[inset_3px_0_0_hsl(234,89%,54%)]"
          : isUnread
          ? "bg-blue-50/60 dark:bg-blue-950/10 hover:bg-blue-50/90 dark:hover:bg-blue-950/20 shadow-[inset_3px_0_0] shadow-blue-400/60"
          : "hover:bg-muted/50 shadow-[inset_3px_0_0_transparent]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0 mt-0.5">
          <EmailAvatar name={isOutbound ? null : email.from_name} email={displayEmail} size="sm" />
          {isUnread && !selected && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Row 1 */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={cn("text-[13px] truncate", isUnread ? "font-bold text-foreground" : "font-medium text-foreground/65")}>
              {isOutbound ? `→ ${displayName}` : displayName}
            </span>
            <span className={cn(
              "text-[10.5px] shrink-0 tabular-nums font-medium",
              isUnread ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              {formatListTime(email.sent_at || email.created_at)}
            </span>
          </div>

          {/* Row 2: subject */}
          <p className={cn(
            "text-[12.5px] truncate",
            isUnread ? "font-semibold text-foreground/90" : "font-normal text-foreground/55"
          )}>
            {email.subject || "(no subject)"}
          </p>

          {/* Row 3: preview */}
          {preview && (
            <p className="text-[11.5px] text-muted-foreground/60 truncate mt-0.5 leading-relaxed">
              {preview}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EmailListSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 border-b border-border/30 flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-xl shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2.5 w-12" />
            </div>
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-2.5 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Email Detail ─────────────────────────────────────────────────────────────

function EmailDetail({ emailId, onBack, onDeleted }: {
  emailId: number; onBack: () => void; onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [threadExpanded, setThreadExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data, isLoading, isError } = useQuery<EmailDetailResponse>({
    queryKey: ["email-detail", emailId],
    queryFn: () => emailApi.getEmail(emailId),
  });

  useEffect(() => {
    if (data) {
      qc.invalidateQueries({ queryKey: ["emails-inbox"] });
      qc.invalidateQueries({ queryKey: ["email-unread"] });
    }
  }, [data, qc]);

  const replyMutation = useMutation({
    mutationFn: (text: string) =>
      emailApi.reply(emailId, { body_html: textToHtml(text), body_text: text }),
    onSuccess: () => {
      toast.success("Reply sent");
      setReplyText(""); setReplyOpen(false);
      qc.invalidateQueries({ queryKey: ["email-detail", emailId] });
      qc.invalidateQueries({ queryKey: ["emails-sent"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to send reply"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => emailApi.deleteEmail(emailId),
    onSuccess: () => {
      toast.success("Email deleted");
      setDeleteConfirm(false); onDeleted();
      qc.invalidateQueries({ queryKey: ["emails-inbox"] });
      qc.invalidateQueries({ queryKey: ["emails-sent"] });
      qc.invalidateQueries({ queryKey: ["email-unread"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete"),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-card/40">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="h-8 w-20 rounded-lg" /></div>
        </div>
        <div className="p-6 max-w-3xl space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30">
            <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-64" />
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={`h-3.5 ${i % 4 === 3 ? "w-2/5" : "w-full"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-destructive/70" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Failed to load email</p>
          <p className="text-sm text-muted-foreground">The email may have been deleted or is unavailable.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>Go back</Button>
      </div>
    );
  }

  const { email, thread } = data;
  const toList = normalizeArr(email.to);
  const ccList = normalizeArr(email.cc);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Action bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/50 bg-card/60 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />Back
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setReplyOpen(!replyOpen)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              replyOpen
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Reply className="h-3.5 w-3.5" /> Reply
          </button>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-destructive/10 rounded-lg px-2.5 py-1 ring-1 ring-destructive/20">
              <span className="text-xs text-destructive font-semibold">Delete this email?</span>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="ml-1.5 px-2 py-0.5 text-[11px] font-bold text-white bg-destructive rounded-md hover:bg-destructive/90 transition-colors"
              >
                {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground rounded-md"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-7 max-w-3xl">
          {/* Subject */}
          <h1 className="text-[22px] font-bold text-foreground leading-snug mb-5 tracking-tight">
            {email.subject || "(no subject)"}
          </h1>

          {/* Sender card */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/10 border border-border/40 mb-6">
            <EmailAvatar name={email.from_name} email={email.from_email} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span className="font-bold text-[14px] text-foreground">{email.from_name || email.from_email}</span>
                    {email.from_name && (
                      <span className="text-xs text-muted-foreground font-mono">&lt;{email.from_email}&gt;</span>
                    )}
                  </div>
                  {toList.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="text-foreground/40 font-medium">To</span>{" "}{toList.join(", ")}
                    </p>
                  )}
                  {ccList.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground/40 font-medium">CC</span>{" "}{ccList.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground bg-background/60 rounded-lg px-2.5 py-1 border border-border/40">
                  <Clock className="h-3 w-3" />
                  {formatDateFull(email.sent_at || email.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          {email.body_html ? (
            <div
              className="text-[14px] text-foreground leading-[1.8] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1.5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_hr]:border-border [&_hr]:my-5 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_pre]:bg-muted [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs [&_strong]:font-semibold [&_em]:italic [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:text-sm [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:text-sm [&_th]:font-semibold"
              dangerouslySetInnerHTML={{ __html: email.body_html }}
            />
          ) : (
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-[1.8]">
              {email.body_text || "(empty message)"}
            </pre>
          )}

          {/* Thread */}
          {thread && thread.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border/40">
              <button
                onClick={() => setThreadExpanded(!threadExpanded)}
                className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4 group"
              >
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted group-hover:bg-accent transition-colors">
                  {threadExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
                {thread.length} earlier {thread.length === 1 ? "message" : "messages"} in this thread
              </button>

              {threadExpanded && (
                <div className="space-y-3 pl-5 border-l-2 border-border/50">
                  {thread.map(t => (
                    <div key={t.id} className="bg-muted/20 rounded-2xl p-4 border border-border/30">
                      <div className="flex items-center gap-2.5 mb-3">
                        <EmailAvatar name={t.from_name} email={t.from_email} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-bold text-foreground truncate">{t.from_name || t.from_email}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{formatListTime(t.sent_at || t.created_at)}</span>
                          </div>
                          {t.from_name && <p className="text-[10px] text-muted-foreground truncate">{t.from_email}</p>}
                        </div>
                      </div>
                      {t.body_html ? (
                        <div className="text-xs text-foreground/80 leading-relaxed [&_p]:mb-1.5 [&_a]:text-primary [&_a]:underline" dangerouslySetInnerHTML={{ __html: t.body_html }} />
                      ) : (
                        <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{t.body_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply area */}
      {replyOpen && (
        <div className="border-t border-border/50 bg-card/70 backdrop-blur-sm p-5 shrink-0">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
              <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center">
                <Reply className="h-3 w-3 text-primary" />
              </div>
              Replying to <span className="text-foreground font-semibold">{email.from_email}</span>
            </div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write your reply…"
              rows={4}
              autoFocus
              className="w-full text-sm resize-none rounded-xl border border-border bg-background px-4 py-3.5 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[11px] text-muted-foreground">Your reply will be delivered to {email.from_email}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setReplyOpen(false); setReplyText(""); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!replyText.trim() || replyMutation.isPending}
                  onClick={() => replyMutation.mutate(replyText)}
                  className="h-8 gap-1.5 text-xs font-semibold bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-md shadow-primary/20"
                >
                  {replyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

function ComposeModal({ open, onClose, onSent }: {
  open: boolean; onClose: () => void; onSent: () => void;
}) {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const reset = () => {
    setTo([]); setCc([]); setBcc([]);
    setSubject(""); setBody("");
    setShowCc(false); setShowBcc(false);
  };

  const sendMutation = useMutation({
    mutationFn: () => emailApi.compose({
      to,
      ...(cc.length ? { cc } : {}),
      ...(bcc.length ? { bcc } : {}),
      subject,
      body_html: textToHtml(body),
      body_text: body,
    }),
    onSuccess: () => { toast.success("Email sent successfully"); reset(); onSent(); onClose(); },
    onError: (err: any) => toast.error(err?.message || "Failed to send email"),
  });

  const canSend = to.length > 0 && subject.trim() && body.trim();

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl">
        {/* Modal header */}
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-primary/8 to-indigo-500/5 border-b border-border/50">
          <DialogTitle className="text-sm font-bold flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-md shadow-primary/30">
              <Edit className="h-3.5 w-3.5 text-white" />
            </div>
            New Message
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 bg-background">
          {/* To */}
          <div className="grid grid-cols-[56px_1fr] items-start gap-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground pt-3">To</label>
            <TagInput value={to} onChange={setTo} placeholder="Recipients — press Enter or , to add" />
          </div>

          {!showCc && !showBcc && (
            <div className="grid grid-cols-[56px_1fr] gap-3">
              <div />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCc(true)} className="text-[11px] text-primary hover:text-primary/80 font-bold transition-colors">+ Add CC</button>
                <button type="button" onClick={() => setShowBcc(true)} className="text-[11px] text-primary hover:text-primary/80 font-bold transition-colors">+ Add BCC</button>
              </div>
            </div>
          )}

          {showCc && (
            <div className="grid grid-cols-[56px_1fr] items-start gap-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground pt-3">CC</label>
              <TagInput value={cc} onChange={setCc} placeholder="CC recipients" />
            </div>
          )}

          {showBcc && (
            <div className="grid grid-cols-[56px_1fr] items-start gap-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground pt-3">BCC</label>
              <TagInput value={bcc} onChange={setBcc} placeholder="BCC recipients" />
            </div>
          )}

          {/* Subject */}
          <div className="grid grid-cols-[56px_1fr] items-center gap-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Subject</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What's this about?"
              className="h-10 text-sm rounded-xl border-border bg-muted/30 focus:bg-background"
            />
          </div>

          <Separator className="opacity-50" />

          {/* Body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message here…"
            rows={11}
            className="w-full text-sm resize-none border border-border/60 rounded-xl bg-muted/20 px-4 py-4 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-background transition-all leading-[1.75]"
          />
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded-md bg-background border border-border text-[10px] font-mono font-semibold">Enter</kbd>
            {" "}or{" "}
            <kbd className="px-1.5 py-0.5 rounded-md bg-background border border-border text-[10px] font-mono font-semibold">,</kbd>
            {" "}to add recipients
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { reset(); onClose(); }} className="h-9 px-4 text-xs font-semibold">
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!canSend || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
              className="h-9 px-5 gap-2 text-xs font-bold bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/25 transition-all"
            >
              {sendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty Detail State ───────────────────────────────────────────────────────

function EmptyDetailState({ onCompose }: { onCompose: () => void }) {
  return (
    <div className="flex-1 relative flex flex-col items-center justify-center text-center px-8 select-none overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-indigo-400/[0.04] blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[150px] h-[150px] rounded-full bg-blue-400/[0.03] blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Floating icon */}
        <div className="relative mb-7">
          {/* Outer rings */}
          <div className="absolute inset-0 rounded-[28px] bg-primary/10 scale-[1.35] opacity-60" />
          <div className="absolute inset-0 rounded-[28px] bg-primary/6 scale-[1.7] opacity-40" />

          {/* Icon container */}
          <div className="relative w-24 h-24 rounded-[28px] bg-gradient-to-br from-primary/15 via-indigo-400/10 to-blue-400/5 flex items-center justify-center border border-primary/15 shadow-lg shadow-primary/10">
            <MailOpen className="h-10 w-10 text-primary/50" strokeWidth={1.5} />
          </div>

          {/* Decorative dots */}
          <div className="absolute -top-2.5 -right-2 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-indigo-500 opacity-80 shadow-md shadow-primary/40" />
          <div className="absolute -bottom-1.5 -left-2.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-70 shadow-sm" />
          <div className="absolute top-2 -left-4 h-2.5 w-2.5 rounded-full bg-indigo-400/50" />
        </div>

        <h3 className="text-[18px] font-bold text-foreground tracking-tight mb-2">
          Select a message
        </h3>
        <p className="text-[13.5px] text-muted-foreground max-w-[210px] leading-relaxed mb-7">
          Pick an email from the list, or write something new.
        </p>

        <button
          onClick={onCompose}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:from-primary/95 hover:to-indigo-500/95 transition-all active:scale-[0.97]"
        >
          <Edit className="h-3.5 w-3.5" />
          Compose New Email
        </button>

        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-border/30 w-full max-w-[260px]">
          <div className="flex-1 text-center">
            <p className="text-[10.5px] text-muted-foreground/60 uppercase tracking-widest font-semibold mb-1">Encrypted</p>
            <p className="text-[11px] text-muted-foreground font-medium">TLS/SSL</p>
          </div>
          <div className="h-6 w-px bg-border/40" />
          <div className="flex-1 text-center">
            <p className="text-[10.5px] text-muted-foreground/60 uppercase tracking-widest font-semibold mb-1">Provider</p>
            <p className="text-[11px] text-muted-foreground font-medium">Resend</p>
          </div>
          <div className="h-6 w-px bg-border/40" />
          <div className="flex-1 text-center">
            <p className="text-[10.5px] text-muted-foreground/60 uppercase tracking-widest font-semibold mb-1">Status</p>
            <p className="text-[11px] text-emerald-500 font-semibold flex items-center justify-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailClient() {
  const qc = useQueryClient();
  const [view, setView] = useState<"inbox" | "sent">("inbox");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: inboxData,
    isLoading: inboxLoading,
    isError: inboxError,
    error: inboxErrorObj,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ["emails-inbox", debouncedSearch],
    queryFn: () => emailApi.getInbox({ per_page: 50, search: debouncedSearch || undefined }),
    enabled: view === "inbox",
    retry: 1,
  });

  const {
    data: sentData,
    isLoading: sentLoading,
    isError: sentError,
    error: sentErrorObj,
    refetch: refetchSent,
  } = useQuery({
    queryKey: ["emails-sent", debouncedSearch],
    queryFn: () => emailApi.getSent({ per_page: 50, search: debouncedSearch || undefined }),
    enabled: view === "sent",
    retry: 1,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["email-unread"],
    queryFn: () => emailApi.getUnreadCount(),
    refetchInterval: 60_000,
    retry: false,
  });

  const emails: EmailItem[] = view === "inbox" ? (inboxData?.data ?? []) : (sentData?.data ?? []);
  const isLoading = view === "inbox" ? inboxLoading : sentLoading;
  const isError   = view === "inbox" ? inboxError   : sentError;
  const errorObj  = view === "inbox" ? inboxErrorObj : sentErrorObj;
  const total = view === "inbox" ? (inboxData?.total ?? 0) : (sentData?.total ?? 0);

  const handleSelectEmail = (id: number) => { setSelectedId(id); setMobileShowDetail(true); };
  const handleSwitchView = (v: "inbox" | "sent") => {
    setView(v); setSearch(""); setSelectedId(null); setMobileShowDetail(false);
  };
  const handleRefresh = () => {
    view === "inbox" ? refetchInbox() : refetchSent();
    qc.invalidateQueries({ queryKey: ["email-unread"] });
  };

  const showLeftPanels = !mobileShowDetail || !selectedId;
  const showDetail = mobileShowDetail && !!selectedId;

  return (
    <DashboardLayout title="Email">
      <div className="-m-4 md:-m-6 h-[calc(100vh-4rem)] flex overflow-hidden border-t border-border/50">

        {/* ══ Left Panel ══════════════════════════════════════════════ */}
        <div className={cn(
          "w-56 flex-col border-r border-sidebar-border bg-sidebar shrink-0",
          showLeftPanels ? "flex" : "hidden lg:flex"
        )}>
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-sidebar-border/50">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-muted mb-3 pl-1">Mail</p>
            <button
              onClick={() => setComposeOpen(true)}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-primary to-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.45)] hover:shadow-[0_6px_28px_rgba(99,102,241,0.55)] hover:from-primary/95 hover:to-indigo-500/95 transition-all active:scale-[0.97]"
            >
              <Edit className="h-4 w-4" />
              Compose
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-sidebar-muted px-2 mb-2">Folders</p>

            {/* Inbox */}
            <button
              onClick={() => handleSwitchView("inbox")}
              className={cn(
                "w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150",
                view === "inbox"
                  ? "bg-gradient-to-r from-white/15 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-white/10"
                  : "text-sidebar-muted hover:bg-white/8 hover:text-white/80"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className={cn("h-4 w-4 shrink-0", view === "inbox" ? "text-primary" : "text-sidebar-muted")} />
                Inbox
              </div>
              {unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Sent */}
            <button
              onClick={() => handleSwitchView("sent")}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150",
                view === "sent"
                  ? "bg-gradient-to-r from-white/15 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-white/10"
                  : "text-sidebar-muted hover:bg-white/8 hover:text-white/80"
              )}
            >
              <Send className={cn("h-4 w-4 shrink-0", view === "sent" ? "text-primary" : "text-sidebar-muted")} />
              Sent
            </button>
          </nav>

          {/* Stats footer */}
          <div className="px-4 py-4 border-t border-sidebar-border/50">
            <div className="rounded-xl bg-white/5 border border-white/8 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-sidebar-muted font-medium">
                  {view === "inbox" ? "In inbox" : "Sent total"}
                </span>
                <span className="text-[12px] font-bold text-sidebar-foreground">{total}</span>
              </div>
              {view === "inbox" && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sidebar-muted font-medium">Unread</span>
                  <span className={cn("text-[12px] font-bold", unreadCount > 0 ? "text-primary" : "text-sidebar-foreground")}>
                    {unreadCount}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1 border-t border-white/8">
                <Sparkles className="h-3 w-3 text-sidebar-muted" />
                <span className="text-[10.5px] text-sidebar-muted">Powered by Resend</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Email List ══════════════════════════════════════════════ */}
        <div className={cn(
          "w-full sm:w-80 xl:w-[360px] flex-col border-r border-border/40 shrink-0 bg-background",
          showLeftPanels ? "flex" : "hidden lg:flex"
        )}>
          {/* List header */}
          <div className="px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[14px] text-foreground capitalize">{view}</h3>
                {total > 0 && (
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {total}
                  </span>
                )}
              </div>
              <button
                onClick={handleRefresh}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-90"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search messages…"
                className="w-full h-9 pl-9 pr-9 text-[13px] rounded-xl border border-border/50 bg-muted/40 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 focus:bg-background transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <EmailListSkeleton />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <WifiOff className="h-6 w-6 text-destructive/60" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] font-semibold text-foreground mb-1">Could not load emails</p>
                <p className="text-[11px] text-muted-foreground mb-1 max-w-[200px]">
                  {(errorObj as any)?.message || "API request failed"}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mb-4 font-mono">
                  Status: {(errorObj as any)?.status ?? "network error"}
                </p>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 shadow-inner">
                  <Mail className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] font-semibold text-foreground mb-1">
                  {debouncedSearch ? "No results" : `No ${view} emails`}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {debouncedSearch ? "Try different terms" : view === "inbox" ? "Your inbox is empty" : "Nothing sent yet"}
                </p>
              </div>
            ) : (
              emails.map(email => (
                <EmailListItem
                  key={email.id}
                  email={email}
                  selected={selectedId === email.id}
                  onClick={() => handleSelectEmail(email.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ══ Email Detail ════════════════════════════════════════════ */}
        <div className={cn(
          "flex-1 bg-background overflow-hidden",
          showDetail ? "flex flex-col" : "hidden lg:flex lg:flex-col"
        )}>
          {selectedId ? (
            <EmailDetail
              key={selectedId}
              emailId={selectedId}
              onBack={() => { setMobileShowDetail(false); setSelectedId(null); }}
              onDeleted={() => { setSelectedId(null); setMobileShowDetail(false); }}
            />
          ) : (
            <EmptyDetailState onCompose={() => setComposeOpen(true)} />
          )}
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => { qc.invalidateQueries({ queryKey: ["emails-sent"] }); handleSwitchView("sent"); }}
      />
    </DashboardLayout>
  );
}
