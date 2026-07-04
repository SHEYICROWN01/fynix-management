import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ShieldAlert, FileWarning } from "lucide-react";
import { ACTION_REASONS, generateAuditRef } from "@/lib/vaultData";

export type ActionSeverity = "critical" | "warning" | "info";

export interface ConfirmActionPayload {
  reason: string;
  notes: string;
  auditRef: string;
}

export interface ConfirmActionConfig {
  title: string;
  severity: ActionSeverity;
  impact: string;
  confirmLabel?: string;
  vaultId: string;
}

interface ConfirmActionModalProps {
  open: boolean;
  config: ConfirmActionConfig | null;
  onCancel: () => void;
  onConfirm: (payload: ConfirmActionPayload) => void;
}

const SEV_STYLES: Record<ActionSeverity, { badge: string; ring: string; icon: typeof ShieldAlert; label: string }> = {
  critical: { badge: "bg-red-500/15 text-red-300 border-red-500/40", ring: "border-red-500/40", icon: ShieldAlert, label: "CRITICAL" },
  warning: { badge: "bg-amber-500/15 text-amber-300 border-amber-500/40", ring: "border-amber-500/40", icon: AlertTriangle, label: "WARNING" },
  info: { badge: "bg-blue-500/15 text-blue-300 border-blue-500/40", ring: "border-blue-500/40", icon: FileWarning, label: "NOTICE" },
};

const MIN_NOTES = 20;

export function ConfirmActionModal({ open, config, onCancel, onConfirm }: ConfirmActionModalProps) {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [ack, setAck] = useState(false);

  const auditRef = useMemo(
    () => (config ? generateAuditRef(config.vaultId) : ""),
    // regenerate each time the modal opens for a new config
    [config, open]
  );

  useEffect(() => {
    if (open) {
      setReason("");
      setNotes("");
      setAck(false);
    }
  }, [open, config]);

  if (!config) return null;

  const sev = SEV_STYLES[config.severity];
  const Icon = sev.icon;
  const notesOk = notes.trim().length >= MIN_NOTES;
  const canConfirm = reason !== "" && notesOk && ack;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-lg border-slate-800 bg-[#0F1923] text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${sev.ring} bg-slate-900/60`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base text-slate-100">{config.title}</DialogTitle>
              <span className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider ${sev.badge}`}>
                {sev.label}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Impact */}
          <div className={`rounded-md border ${sev.ring} bg-slate-900/50 p-3`}>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Impact</p>
            <p className="mt-1 text-sm text-slate-200">{config.impact}</p>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500">Reason Code<span className="text-red-400"> *</span></label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1 border-slate-700 bg-slate-900/60 text-slate-100">
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-[#0F1923] text-slate-100">
                {ACTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-slate-200 focus:bg-slate-800">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider text-slate-500">Justification Notes<span className="text-red-400"> *</span></label>
              <span className={`font-mono text-[10px] ${notesOk ? "text-emerald-400" : "text-slate-500"}`}>
                {notes.trim().length}/{MIN_NOTES} min
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Document the rationale for this action (min 20 characters). This is written to the immutable audit log."
              className="mt-1 w-full resize-none rounded-md border border-slate-700 bg-slate-900/60 p-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Audit ref */}
          <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Audit Reference</span>
            <span className="font-mono text-xs text-blue-300">{auditRef}</span>
          </div>

          {/* Acknowledgement */}
          <label className="flex cursor-pointer items-start gap-2.5">
            <Checkbox checked={ack} onCheckedChange={(c) => setAck(c === true)} className="mt-0.5 border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
            <span className="text-sm text-slate-300">
              I understand the consequences of this action and confirm it is authorized under my operator credentials.
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => onConfirm({ reason, notes: notes.trim(), auditRef })}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition ${
              canConfirm
                ? config.severity === "critical"
                  ? "bg-red-600 hover:bg-red-500"
                  : config.severity === "warning"
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-blue-600 hover:bg-blue-500"
                : "cursor-not-allowed bg-slate-700/60 text-slate-500"
            }`}
          >
            {config.confirmLabel ?? "Confirm Action"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
