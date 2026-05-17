/**
 * ScanMarkDialog — FEAT-010
 * ----------------------------------------------------------------------------
 * Lets a teacher photograph (or upload) a pupil's completed worksheet, mark
 * it with Gemini Vision, and push the resulting misconception tags onto the
 * pupil's record. The next worksheet generated for that pupil automatically
 * pulls those tags into its prompt via lib/pupil-context.ts (no extra wiring
 * needed in Worksheets.tsx beyond the scoped pupil already in use).
 *
 * Flow:
 *   1. Teacher selects a pupil and picks/takes a photo.
 *   2. Click "Mark" → POST /api/ai/scan-mark with the worksheet's questions
 *      as reference (modelAnswers + marks where the AI provided them).
 *   3. Display a marking grid with chips, marks, model answer, and the
 *      inferred misconception tag.
 *   4. "Save to pupil" merges the new tags onto Child.recentMisconceptions.
 *
 * Uses no new third-party dependencies.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, CheckCircle2, XCircle, Loader2, FileImage, X, RefreshCcw, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import {
  scanAndMark,
  extractMisconceptions,
  mergeMisconceptions,
  buildExpectedAnswersFromWorksheet,
  type ScanMarkResult,
} from "@/lib/scan-mark";
// FEAT-PB3 — Re-teach gap panel. Mounted after a successful 'Save to pupil'
// so the teacher sees class-wide gaps without leaving the dialog.
import { ReteachGapPanel } from "@/components/ReteachGapPanel";
import type { ReteachBrief, ScanBatchEntry, ScanBatchResult } from "@/lib/reteachPlanner";

interface PupilLite {
  id: string;
  name: string;
  recentMisconceptions?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worksheet: any | null;
  pupils: PupilLite[];
  /** Pupil to pre-select (e.g. the one currently scoped on the page). */
  defaultPupilId?: string | null;
  /** Persists merged recentMisconceptions back to the Child via AppContext.updateChild. */
  onSaveMisconceptions: (pupilId: string, recentMisconceptions: string[]) => Promise<void> | void;
  // ── FEAT-PB3 — Class-level re-teach loop ──────────────────────────────────
  /** All ScanMarkResults accumulated for this worksheet so far (across pupils).
   *  When ≥ 1 entry is present after a save, the dialog renders ReteachGapPanel
   *  beneath the marking grid. */
  reteachBatch?: ScanBatchResult;
  /** Notifies the parent when this dialog produced a new batch entry. */
  onBatchEntryAdded?: (entry: ScanBatchEntry) => void;
  /** Threshold (0..100) above which a question is treated as a class-wide
   *  re-teach gap. Default 40% per FEAT-PB3 spec. */
  reteachThresholdPct?: number;
  /** Called when the teacher clicks 'Re-teach this gap'. The parent should
   *  hand off to aiGenerateReteachWorksheet via the sessionStorage handoff. */
  onReteach?: (brief: ReteachBrief) => void;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB upload cap (server allows 25 MB)

export function ScanMarkDialog({
  open,
  onOpenChange,
  worksheet,
  pupils,
  defaultPupilId,
  onSaveMisconceptions,
  reteachBatch = [],
  onBatchEntryAdded,
  reteachThresholdPct = 40,
  onReteach,
}: Props) {
  const [pupilId, setPupilId] = useState<string>(defaultPupilId || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<ScanMarkResult | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const selectedPupil = useMemo(
    () => pupils.find((p) => p.id === pupilId) || null,
    [pupils, pupilId],
  );

  // Reset internal state whenever the dialog is reopened.
  useEffect(() => {
    if (!open) return;
    setPupilId(defaultPupilId || "");
    setResult(null);
    setSaved(false);
    setMarking(false);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    // We deliberately exclude previewUrl from deps — we revoke the previous one on close.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultPupilId]);

  // Clean up object URL when component unmounts or file changes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChosen(f: File | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("That file is too large. Please choose an image under 20 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setResult(null);
    setSaved(false);
    // PDFs can't be previewed via <img>; show a placeholder instead.
    if (f.type === "application/pdf") {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(URL.createObjectURL(f));
    }
  }

  async function handleMark() {
    if (!file) {
      toast.error("Pick or take a photo first.");
      return;
    }
    setMarking(true);
    setSaved(false);
    try {
      const expected = worksheet ? buildExpectedAnswersFromWorksheet(worksheet) : [];
      const r = await scanAndMark({
        image: file,
        title: worksheet?.title,
        subject: worksheet?.metadata?.subject,
        topic: worksheet?.metadata?.topic,
        yearGroup: worksheet?.metadata?.yearGroup,
        expectedAnswers: expected,
      });
      setResult(r);
      if (r.questions.length === 0) {
        toast.warning(r.summary?.overallNote || "Could not read any answers from the photo.");
      } else {
        toast.success(`Marked ${r.questions.length} question${r.questions.length === 1 ? "" : "s"}.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Marking failed.");
    } finally {
      setMarking(false);
    }
  }

  async function handleSave() {
    if (!result || !selectedPupil) return;
    const fresh = extractMisconceptions(result);
    const merged = mergeMisconceptions(selectedPupil.recentMisconceptions, fresh, 12);
    try {
      await onSaveMisconceptions(selectedPupil.id, merged);
      setSaved(true);
      // FEAT-PB3 — push this scan into the class re-teach batch so the gap
      // panel below this dialog can aggregate (questionIdx, misconception)
      // counts across every pupil the teacher has scanned.
      if (onBatchEntryAdded) {
        onBatchEntryAdded({
          pupilId: selectedPupil.id,
          pupilName: selectedPupil.name,
          result,
          scannedAt: new Date().toISOString(),
        });
      }
      if (fresh.length === 0) {
        toast.success(`No new misconceptions to log — ${selectedPupil.name} got everything right!`);
      } else {
        toast.success(
          `Saved ${fresh.length} misconception${fresh.length === 1 ? "" : "s"} to ${selectedPupil.name}. ` +
          `Future worksheets will auto-remediate.`,
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not save misconceptions to pupil.");
    }
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setSaved(false);
  }

  const totalAwarded = result?.summary?.totalAwarded ?? 0;
  const totalAvailable = result?.summary?.totalAvailable ?? 0;
  const correctCount = result?.questions.filter((q) => q.correct).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand" />
            Scan &amp; mark
          </DialogTitle>
          <DialogDescription>
            Photograph a completed worksheet and let AI mark it. Saved misconceptions will
            shape the next worksheet you generate for this pupil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pupil + worksheet header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scan-mark-pupil">Pupil</Label>
              <Select value={pupilId} onValueChange={setPupilId}>
                <SelectTrigger id="scan-mark-pupil">
                  <SelectValue placeholder="Select pupil" />
                </SelectTrigger>
                <SelectContent>
                  {pupils.length === 0 ? (
                    <SelectItem value="__none__" disabled>No pupils on roll</SelectItem>
                  ) : (
                    pupils.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.recentMisconceptions && p.recentMisconceptions.length > 0
                          ? ` · ${p.recentMisconceptions.length} active tag${p.recentMisconceptions.length === 1 ? "" : "s"}`
                          : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Worksheet</Label>
              <div className="text-sm rounded-md border bg-muted/40 px-3 py-2 truncate">
                {worksheet?.title || <span className="text-muted-foreground">No worksheet loaded</span>}
              </div>
            </div>
          </div>

          {/* File picker + camera */}
          {!result && (
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-md overflow-hidden bg-black/5 max-h-72 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Worksheet preview"
                      className="max-h-72 w-auto object-contain"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white border rounded-full w-7 h-7 flex items-center justify-center shadow"
                      onClick={handleReset}
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {file?.name || "Selected image"} · {file ? Math.round(file.size / 1024) : 0} KB
                  </p>
                </div>
              ) : file && file.type === "application/pdf" ? (
                <div className="text-sm flex items-center gap-2 px-2 py-3">
                  <FileImage className="w-5 h-5 text-muted-foreground" />
                  <span className="truncate flex-1">{file.name}</span>
                  <Button variant="ghost" size="sm" onClick={handleReset} type="button">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Take a photo of the completed worksheet, or upload an existing image / single-page PDF.
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4 mr-1.5" /> Take photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-1.5" /> Upload file
                    </Button>
                  </div>
                </div>
              )}
              <input
                ref={cameraInputRef}
                type="file"
                accept={ACCEPTED}
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChosen(e.target.files?.[0] || null)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFileChosen(e.target.files?.[0] || null)}
              />
            </div>
          )}

          {/* Marking results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="font-semibold">
                    Score: {totalAwarded} / {totalAvailable}
                  </div>
                  <Badge variant="secondary">
                    {correctCount} of {result.questions.length} correct
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RefreshCcw className="w-4 h-4 mr-1.5" /> Mark another
                </Button>
              </div>
              {result.summary?.overallNote && (
                <div className="text-sm rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-blue-900">
                  {result.summary.overallNote}
                </div>
              )}

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {result.questions.map((q) => (
                  <div
                    key={q.questionNumber}
                    className={`rounded-md border p-3 text-sm ${
                      q.correct ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-medium flex items-start gap-2">
                        {q.correct
                          ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 mt-0.5 text-rose-600 flex-shrink-0" />}
                        <span>Q{q.questionNumber}: {q.questionText || "(no question text)"}</span>
                      </div>
                      <span className="text-xs font-mono whitespace-nowrap">
                        {q.marksAwarded} / {q.marksAvailable}
                      </span>
                    </div>
                    <div className="ml-6 space-y-0.5 text-xs">
                      <div>
                        <span className="text-muted-foreground">Pupil's answer: </span>
                        <span className="font-mono">{q.pupilAnswer || "—"}</span>
                      </div>
                      {q.modelAnswer && !q.correct && (
                        <div>
                          <span className="text-muted-foreground">Expected: </span>
                          <span>{q.modelAnswer}</span>
                        </div>
                      )}
                      {q.misconceptionTag && !q.correct && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <BrainCircuit className="w-3.5 h-3.5 text-amber-700" />
                          <span className="text-amber-900 font-medium">{q.misconceptionTag}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPupil && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
                  Saving will append <strong>{extractMisconceptions(result).length}</strong> new misconception
                  {extractMisconceptions(result).length === 1 ? "" : "s"} to <strong>{selectedPupil.name}</strong>'s record.
                  The next worksheet you generate with this pupil scoped will automatically include
                  remediation prompts for these.
                </div>
              )}
            </div>
          )}

          {/* Existing tags helper (visible before marking too) */}
          {!result && selectedPupil && selectedPupil.recentMisconceptions && selectedPupil.recentMisconceptions.length > 0 && (
            <div className="rounded-md bg-muted/40 border px-3 py-2">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                Active misconceptions for {selectedPupil.name}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPupil.recentMisconceptions.slice(0, 8).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-normal">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* FEAT-PB3 — Class-wide re-teach gap panel. Visible whenever the
              parent has accumulated at least one scan for the current
              worksheet. The dialog stays open so the teacher can keep
              scanning more pupils and watch the gaps consolidate. */}
          {reteachBatch.length > 0 && worksheet && onReteach && (
            <ReteachGapPanel
              batch={reteachBatch}
              sourceWorksheet={worksheet}
              thresholdPct={reteachThresholdPct}
              onReteach={(brief) => {
                onReteach(brief);
                onOpenChange(false);
              }}
            />
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          {!result ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={handleMark}
                disabled={!file || marking || !pupilId}
              >
                {marking
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Marking…</>
                  : "Mark"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button
                onClick={handleSave}
                disabled={saved || !selectedPupil}
                variant={saved ? "secondary" : "default"}
              >
                {saved ? "Saved ✓" : "Save to pupil"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ScanMarkDialog;
