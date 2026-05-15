/**
 * CompanionQRDialog — Phase 4 / FEAT-005
 *
 * Issues a `/share/companion/:token` link for the current worksheet, renders
 * a printable QR code + URL, and lets the teacher print or copy it. The
 * dialog also handles regeneration (overwrites the existing token if the
 * worksheet's metadata.companionShare is already populated).
 *
 * QR generation is done via the `qrcode` package, dynamically-imported so
 * the bundle still parses if the dep is missing at build-time. Falls back
 * to a copyable link when the QR can't render.
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  QrCode,
  Copy,
  Printer,
  Sparkles,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  buildCompanionShare,
  type CompanionShareRecord,
} from "@/lib/companion-share";
import { runHintLadder, type HintLadderEntry } from "@/lib/hint-ladder";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Generated worksheet (object) used to build the share record. */
  worksheet: {
    title: string;
    metadata?: {
      subject?: string;
      topic?: string;
      yearGroup?: string;
      companionShare?: { token: string; expiresAt: string };
      hintLadders?: HintLadderEntry[];
    };
    sections: Array<{ title?: string; content?: string; type?: string; teacherOnly?: boolean }>;
  };
  /** Called after the share is created/updated so the parent can patch metadata. */
  onShareIssued?: (share: { token: string; expiresAt: string }) => void;
  /** Optional teacher email/display name for audit. */
  issuedBy?: string;
}

export function CompanionQRDialog({
  open,
  onOpenChange,
  worksheet,
  onShareIssued,
  issuedBy,
}: Props) {
  const [share, setShare] = useState<CompanionShareRecord | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [includeHints, setIncludeHints] = useState(true);
  const [encouragement, setEncouragement] = useState("You've got this! Try the question, then ask for a hint.");
  const [issuing, setIssuing] = useState(false);

  const companionUrl = useMemo(() => {
    if (!share) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/share/companion/${share.token}`;
  }, [share]);

  // When the dialog opens, auto-issue (or refresh) a share record.
  useEffect(() => {
    if (!open) return;
    if (share) return; // already issued in this session
    void issueShare(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Whenever we have a URL, render the QR.
  useEffect(() => {
    if (!companionUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        // Dynamic import keeps the bundle resilient to a missing dep.
        const QR = await import("qrcode");
        const url = await QR.toDataURL(companionUrl, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
          color: { dark: "#065f46", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companionUrl]);

  const reuseToken = worksheet.metadata?.companionShare?.token;

  async function issueShare(initial: boolean) {
    if (issuing) return;
    setIssuing(true);
    try {
      // Run the hint ladder lazily — only when the dialog is opened, and
      // only if the teacher hasn't disabled it.
      let ladders: HintLadderEntry[] | undefined = worksheet.metadata?.hintLadders;
      if (includeHints && !ladders) {
        const res = await runHintLadder({
          subject: worksheet.metadata?.subject,
          topic: worksheet.metadata?.topic,
          yearGroup: worksheet.metadata?.yearGroup,
          sections: worksheet.sections || [],
        });
        if (res?.ladders?.length) ladders = res.ladders;
      }

      const rec = buildCompanionShare({
        title: worksheet.title,
        subject: worksheet.metadata?.subject,
        topic: worksheet.metadata?.topic,
        yearGroup: worksheet.metadata?.yearGroup,
        issuedBy,
        encouragement: encouragement.trim() || undefined,
        sections: worksheet.sections || [],
        ladders: includeHints ? ladders : undefined,
        token: initial ? reuseToken : undefined, // refresh issues a brand-new token
      });

      setShare(rec);
      onShareIssued?.({ token: rec.token, expiresAt: rec.expiresAt });
    } catch (e) {
      toast.error(`Could not issue companion link: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setIssuing(false);
    }
  }

  function copyLink() {
    if (!companionUrl) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(companionUrl).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn't copy — long-press the link to copy manually"),
    );
  }

  function printQR() {
    if (!qrDataUrl || !share) return;
    const w = window.open("", "_blank", "width=520,height=720");
    if (!w) {
      toast.error("Browser blocked the print window. Please allow pop-ups for Adaptly.");
      return;
    }
    const safeTitle = escapeHtml(share.title);
    const safeUrl = escapeHtml(companionUrl);
    const safeMeta = escapeHtml(
      [share.yearGroup, share.subject, share.topic].filter(Boolean).join(" · "),
    );
    const expires = new Date(share.expiresAt).toLocaleDateString("en-GB");
    w.document.write(`<!doctype html><html><head><title>Pupil Companion QR — ${safeTitle}</title>
<style>
  @page { size: A6 portrait; margin: 6mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 12px; }
  .card { border: 2px dashed #10b981; border-radius: 12px; padding: 14px; text-align: center; }
  h1 { font-size: 14px; margin: 0 0 4px; color: #065f46; }
  .meta { font-size: 11px; color: #4b5563; margin-bottom: 10px; }
  img { max-width: 100%; height: auto; }
  .url { font-family: monospace; font-size: 10px; color: #065f46; margin-top: 6px; word-break: break-all; }
  .hint { font-size: 10px; color: #6b7280; margin-top: 8px; }
  .badge { display: inline-block; font-size: 10px; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 999px; margin-bottom: 6px; font-weight: 700; letter-spacing: 0.05em; }
</style></head><body>
<div class="card">
  <div class="badge">PUPIL COMPANION</div>
  <h1>${safeTitle}</h1>
  <div class="meta">${safeMeta}</div>
  <img src="${qrDataUrl}" alt="QR code linking to companion view" />
  <div class="url">${safeUrl}</div>
  <div class="hint">Scan to open the companion. Each question has hints — try first, then tap.<br/>Link expires ${expires}.</div>
</div>
<script>setTimeout(()=>{window.print();}, 200);</script>
</body></html>`);
    w.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            Pupil mode (QR)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Print this QR onto the worksheet. Pupils scan it to open a read-only
            companion with hint scaffolds — no login required. No teacher notes
            or answer keys are exposed.
          </p>

          {/* QR */}
          <div className="flex flex-col items-center justify-center bg-emerald-50 rounded-xl border-2 border-dashed border-emerald-200 p-4">
            {issuing ? (
              <div className="flex items-center gap-2 text-emerald-700 text-sm py-12">
                <Loader2 className="w-4 h-4 animate-spin" /> Building hints + QR…
              </div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="Companion QR" className="w-48 h-48" />
            ) : share ? (
              <div className="text-xs text-amber-700 py-8 text-center">
                Couldn't render the QR image — use the link below instead.
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-12">No share yet.</div>
            )}
            {share && (
              <div className="text-[10px] text-muted-foreground mt-2 break-all max-w-full text-center">
                {companionUrl}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="rounded-lg border border-border/60 p-3 space-y-3 bg-muted/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <Label className="text-xs cursor-pointer" htmlFor="companion-hints-switch">
                  Include 3-step hint ladder
                </Label>
              </div>
              <Switch
                id="companion-hints-switch"
                checked={includeHints}
                onCheckedChange={setIncludeHints}
              />
            </div>
            <div>
              <Label className="text-[11px]" htmlFor="companion-encouragement">
                Encouragement line (optional)
              </Label>
              <Textarea
                id="companion-encouragement"
                rows={2}
                value={encouragement}
                onChange={(e) => setEncouragement(e.target.value)}
                placeholder="You've got this! Try the question, then ask for a hint."
                className="text-xs mt-1"
                maxLength={160}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void issueShare(false)}
              disabled={issuing}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              {share ? "Refresh link" : "Issue link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              disabled={!share}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => companionUrl && window.open(companionUrl, "_blank", "noopener")}
              disabled={!share}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open
            </Button>
            <Button
              size="sm"
              onClick={printQR}
              disabled={!qrDataUrl}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print A6 card
            </Button>
          </div>

          {share && (
            <p className="text-[10px] text-muted-foreground text-center">
              Link expires {new Date(share.expiresAt).toLocaleDateString("en-GB")}.
              Stored on this device only.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
