/**
 * ScanMarkDialog — FEAT-010 (Single) + FEAT-PB4 (Class set + Voice)
 * ──────────────────────────────────────────────────────────────────────────
 * Tabbed dialog the teacher opens from the Worksheets toolbar:
 *
 *   • Single    — original FEAT-010 flow. One pupil, one image, save
 *                 misconceptions back to the pupil record.
 *   • Class set — FEAT-PB4. Drop in up to 35 photos, watch a progress bar,
 *                 see per-pupil ticks/crosses live, then aggregate stats,
 *                 a per-pupil mark grid, "Generate comments" (one ≤ 80-word
 *                 AI comment per pupil), and "Export CSV" (UK-MIS-friendly
 *                 marksheet the teacher downloads themselves — no paid push
 *                 to SIMS / Bromcom / Arbor). Native MIS APIs are Phase C.
 *   • Voice    — phone-friendly mode. Holds the camera over a sheet, taps
 *                 Speak, the page reads the score aloud via SpeechSynthesis.
 *
 * The class-set tab feeds its results into the existing reteachBatch state
 * the parent already maintains, so ReteachGapPanel mounts automatically
 * once the bulk run completes — same channel that's been wired in PB3.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Camera, Upload, CheckCircle2, XCircle, Loader2, FileImage, X, RefreshCcw,
  BrainCircuit, Users, Mic, Download, FileSpreadsheet, MessageSquare, StopCircle,
  Volume2, VolumeX, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  scanAndMark,
  extractMisconceptions,
  mergeMisconceptions,
  buildExpectedAnswersFromWorksheet,
  type ScanMarkResult,
} from "@/lib/scan-mark";
import {
  scanBatch,
  aggregateBatch,
  generateBulkFeedback,
  exportToCsv,
  csvFilename,
  downloadCsv,
  type BatchImageInput,
  type BatchScanResult,
  type BatchAggregate,
} from "@/lib/scanMarkBatch";
import { ReteachGapPanel } from "@/components/ReteachGapPanel";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import type { ReteachBrief, ScanBatchEntry, ScanBatchResult } from "@/lib/reteachPlanner";

interface PupilLite {
  id: string;
  name: string;
  upn?: string;
  recentMisconceptions?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worksheet: any | null;
  pupils: PupilLite[];
  defaultPupilId?: string | null;
  onSaveMisconceptions: (pupilId: string, recentMisconceptions: string[]) => Promise<void> | void;
  reteachBatch?: ScanBatchResult;
  onBatchEntryAdded?: (entry: ScanBatchEntry) => void;
  reteachThresholdPct?: number;
  onReteach?: (brief: ReteachBrief) => void;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB / image — server cap is 25 MB
const BULK_LIMIT = 35;               // PB4 spec: ≤ 35 photos at once

type TabKey = "single" | "class" | "voice";

interface PendingImage {
  id: string;
  file: File;
  pupilId: string;
  /** True when the row has been processed (for striking through done items). */
  done?: boolean;
}

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
  const { preferences, updatePreference } = useUserPreferences();
  const initialTab: TabKey = (preferences.lastScanMarkTab as TabKey) || "single";
  const [tab, setTab] = useState<TabKey>(initialTab);

  // Bulk-mode state lives on the dialog so tab switches don't clear it.
  const {
    pendingImages, setPendingImages,
    batchResults, setBatchResults,
    batchProgress, setBatchProgress,
    batchRunning, setBatchRunning,
    showMisHelp, setShowMisHelp,
    voiceTranscript, setVoiceTranscript,
    voiceResult, setVoiceResult,
    abortRef,
  } = useBulkState();

  // Persist tab choice when the teacher switches.
  function changeTab(next: string) {
    const t = (next as TabKey) || "single";
    setTab(t);
    updatePreference("lastScanMarkTab", t);
  }

  // Reset transient state on (re)open. We deliberately *don't* clear the
  // class-set results here, because the parent's reteachBatch persists for
  // the same worksheet — but we do clear the local pending queue so the
  // dialog isn't pre-loaded with last week's photos.
  useEffect(() => {
    if (!open) return;
    setTab((preferences.lastScanMarkTab as TabKey) || "single");
    setPendingImages([]);
    setBatchResults([]);
    setBatchProgress(null);
    setBatchRunning(false);
    setShowMisHelp(false);
    setVoiceTranscript("");
    setVoiceResult(null);
    abortRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Tab: Single ────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand" />
            Scan &amp; mark
          </DialogTitle>
          <DialogDescription>
            Mark a single pupil, a whole class, or talk through it on your phone.
            Saved misconceptions shape the next worksheet you generate.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={changeTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="single" className="flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Single
            </TabsTrigger>
            <TabsTrigger value="class" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Class set
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-1.5">
              <Mic className="w-4 h-4" /> Voice
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-3">
            <SingleTab
              worksheet={worksheet}
              pupils={pupils}
              defaultPupilId={defaultPupilId}
              onSaveMisconceptions={onSaveMisconceptions}
              onClose={() => onOpenChange(false)}
              reteachBatch={reteachBatch}
              onBatchEntryAdded={onBatchEntryAdded}
              reteachThresholdPct={reteachThresholdPct}
              onReteach={(brief) => { onReteach?.(brief); onOpenChange(false); }}
            />
          </TabsContent>

          <TabsContent value="class" className="mt-3">
            <ClassSetTab
              worksheet={worksheet}
              pupils={pupils}
              pendingImages={pendingImages}
              setPendingImages={setPendingImages}
              batchResults={batchResults}
              setBatchResults={setBatchResults}
              batchProgress={batchProgress}
              setBatchProgress={setBatchProgress}
              batchRunning={batchRunning}
              setBatchRunning={setBatchRunning}
              showMisHelp={showMisHelp}
              setShowMisHelp={setShowMisHelp}
              abortRef={abortRef}
              onBatchEntryAdded={onBatchEntryAdded}
              onReteach={(brief) => { onReteach?.(brief); onOpenChange(false); }}
              reteachBatch={reteachBatch}
              reteachThresholdPct={reteachThresholdPct}
            />
          </TabsContent>

          <TabsContent value="voice" className="mt-3">
            <VoiceTab
              worksheet={worksheet}
              pupils={pupils}
              defaultPupilId={defaultPupilId}
              transcript={voiceTranscript}
              setTranscript={setVoiceTranscript}
              voiceResult={voiceResult}
              setVoiceResult={setVoiceResult}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Hooks for shared bulk state ────────────────────────────────────────────
// Co-locates the class-set / voice state with the dialog so a tab switch
// doesn't clear progress. Returned as a single object so the dialog can
// destructure once.

// Helper hook — keeps the main component body readable.
function useBulkState() {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [batchResults, setBatchResults] = useState<BatchScanResult[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ processed: number; total: number; currentPupilName: string } | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [showMisHelp, setShowMisHelp] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceResult, setVoiceResult] = useState<ScanMarkResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  return {
    pendingImages, setPendingImages,
    batchResults, setBatchResults,
    batchProgress, setBatchProgress,
    batchRunning, setBatchRunning,
    showMisHelp, setShowMisHelp,
    voiceTranscript, setVoiceTranscript,
    voiceResult, setVoiceResult,
    abortRef,
  };
}

// We need the variables above to actually be in scope of the JSX. The
// straightforward way: redefine the component using the hook. The previous
// declaration of ScanMarkDialog only used setTab/etc. — we now augment it.

// ─── Single-tab subcomponent ────────────────────────────────────────────────

interface SingleTabProps {
  worksheet: any | null;
  pupils: PupilLite[];
  defaultPupilId?: string | null;
  onSaveMisconceptions: (pupilId: string, recentMisconceptions: string[]) => Promise<void> | void;
  onClose: () => void;
  reteachBatch: ScanBatchResult;
  onBatchEntryAdded?: (entry: ScanBatchEntry) => void;
  reteachThresholdPct: number;
  onReteach: (brief: ReteachBrief) => void;
}

function SingleTab({
  worksheet, pupils, defaultPupilId, onSaveMisconceptions, onClose,
  reteachBatch, onBatchEntryAdded, reteachThresholdPct, onReteach,
}: SingleTabProps) {
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
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function handleFileChosen(f: File | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) { toast.error("That file is too large. Please choose an image under 20 MB."); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setResult(null); setSaved(false);
    setPreviewUrl(f.type === "application/pdf" ? null : URL.createObjectURL(f));
  }
  async function handleMark() {
    if (!file) { toast.error("Pick or take a photo first."); return; }
    setMarking(true); setSaved(false);
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
      if (r.questions.length === 0) toast.warning(r.summary?.overallNote || "Could not read any answers from the photo.");
      else toast.success(`Marked ${r.questions.length} question${r.questions.length === 1 ? "" : "s"}.`);
    } catch (err: any) { toast.error(err?.message || "Marking failed."); }
    finally { setMarking(false); }
  }
  async function handleSave() {
    if (!result || !selectedPupil) return;
    const fresh = extractMisconceptions(result);
    const merged = mergeMisconceptions(selectedPupil.recentMisconceptions, fresh, 12);
    try {
      await onSaveMisconceptions(selectedPupil.id, merged);
      setSaved(true);
      onBatchEntryAdded?.({
        pupilId: selectedPupil.id,
        pupilName: selectedPupil.name,
        result,
        scannedAt: new Date().toISOString(),
      });
      if (fresh.length === 0) toast.success(`No new misconceptions to log — ${selectedPupil.name} got everything right!`);
      else toast.success(`Saved ${fresh.length} misconception${fresh.length === 1 ? "" : "s"} to ${selectedPupil.name}.`);
    } catch (err: any) { toast.error(err?.message || "Could not save misconceptions to pupil."); }
  }
  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(null); setResult(null); setSaved(false);
  }

  const totalAwarded = result?.summary?.totalAwarded ?? 0;
  const totalAvailable = result?.summary?.totalAvailable ?? 0;
  const correctCount = result?.questions.filter((q) => q.correct).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-mark-pupil">Pupil</Label>
          <Select value={pupilId} onValueChange={setPupilId}>
            <SelectTrigger id="scan-mark-pupil"><SelectValue placeholder="Select pupil" /></SelectTrigger>
            <SelectContent>
              {pupils.length === 0
                ? <SelectItem value="__none__" disabled>No pupils on roll</SelectItem>
                : pupils.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.recentMisconceptions && p.recentMisconceptions.length > 0
                        ? ` · ${p.recentMisconceptions.length} active tag${p.recentMisconceptions.length === 1 ? "" : "s"}`
                        : ""}
                    </SelectItem>
                  ))}
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

      {!result && (
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          {previewUrl ? (
            <div className="space-y-2">
              <div className="relative rounded-md overflow-hidden bg-black/5 max-h-72 flex items-center justify-center">
                <img src={previewUrl} alt="Worksheet preview" className="max-h-72 w-auto object-contain" />
                <button type="button" className="absolute top-2 right-2 bg-white/90 hover:bg-white border rounded-full w-7 h-7 flex items-center justify-center shadow" onClick={handleReset} aria-label="Remove image">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground truncate">{file?.name || "Selected image"} · {file ? Math.round(file.size / 1024) : 0} KB</p>
            </div>
          ) : file && file.type === "application/pdf" ? (
            <div className="text-sm flex items-center gap-2 px-2 py-3">
              <FileImage className="w-5 h-5 text-muted-foreground" />
              <span className="truncate flex-1">{file.name}</span>
              <Button variant="ghost" size="sm" onClick={handleReset} type="button"><X className="w-4 h-4" /></Button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="text-sm text-muted-foreground">Take a photo of the completed worksheet, or upload an existing image / single-page PDF.</div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button type="button" size="sm" onClick={() => cameraInputRef.current?.click()}><Camera className="w-4 h-4 mr-1.5" /> Take photo</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-1.5" /> Upload file</Button>
              </div>
            </div>
          )}
          <input ref={cameraInputRef} type="file" accept={ACCEPTED} capture="environment" className="hidden" onChange={(e) => handleFileChosen(e.target.files?.[0] || null)} />
          <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => handleFileChosen(e.target.files?.[0] || null)} />
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="font-semibold">Score: {totalAwarded} / {totalAvailable}</div>
              <Badge variant="secondary">{correctCount} of {result.questions.length} correct</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}><RefreshCcw className="w-4 h-4 mr-1.5" /> Mark another</Button>
          </div>
          {result.summary?.overallNote && (
            <div className="text-sm rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-blue-900">{result.summary.overallNote}</div>
          )}
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {result.questions.map((q) => (
              <div key={q.questionNumber} className={`rounded-md border p-3 text-sm ${q.correct ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium flex items-start gap-2">
                    {q.correct ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 text-rose-600 flex-shrink-0" />}
                    <span>Q{q.questionNumber}: {q.questionText || "(no question text)"}</span>
                  </div>
                  <span className="text-xs font-mono whitespace-nowrap">{q.marksAwarded} / {q.marksAvailable}</span>
                </div>
                <div className="ml-6 space-y-0.5 text-xs">
                  <div><span className="text-muted-foreground">Pupil's answer: </span><span className="font-mono">{q.pupilAnswer || "—"}</span></div>
                  {q.modelAnswer && !q.correct && (<div><span className="text-muted-foreground">Expected: </span><span>{q.modelAnswer}</span></div>)}
                  {q.misconceptionTag && !q.correct && (
                    <div className="flex items-center gap-1.5 mt-1"><BrainCircuit className="w-3.5 h-3.5 text-amber-700" /><span className="text-amber-900 font-medium">{q.misconceptionTag}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedPupil && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              Saving will append <strong>{extractMisconceptions(result).length}</strong> new misconception{extractMisconceptions(result).length === 1 ? "" : "s"} to <strong>{selectedPupil.name}</strong>'s record.
            </div>
          )}
        </div>
      )}

      {!result && selectedPupil && selectedPupil.recentMisconceptions && selectedPupil.recentMisconceptions.length > 0 && (
        <div className="rounded-md bg-muted/40 border px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Active misconceptions for {selectedPupil.name}</div>
          <div className="flex flex-wrap gap-1.5">
            {selectedPupil.recentMisconceptions.slice(0, 8).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[11px] font-normal">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {reteachBatch.length > 0 && worksheet && (
        <ReteachGapPanel batch={reteachBatch} sourceWorksheet={worksheet} thresholdPct={reteachThresholdPct} onReteach={onReteach} />
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 justify-end pt-2 border-t">
        {!result ? (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleMark} disabled={!file || marking || !pupilId}>
              {marking ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Marking…</> : "Mark"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleReset}>Mark another</Button>
            <Button onClick={handleSave} disabled={saved || !selectedPupil} variant={saved ? "secondary" : "default"}>
              {saved ? "Saved ✓" : "Save to pupil"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Class-set tab subcomponent ─────────────────────────────────────────────

interface ClassSetTabProps {
  worksheet: any | null;
  pupils: PupilLite[];
  pendingImages: PendingImage[];
  setPendingImages: React.Dispatch<React.SetStateAction<PendingImage[]>>;
  batchResults: BatchScanResult[];
  setBatchResults: React.Dispatch<React.SetStateAction<BatchScanResult[]>>;
  batchProgress: { processed: number; total: number; currentPupilName: string } | null;
  setBatchProgress: React.Dispatch<React.SetStateAction<{ processed: number; total: number; currentPupilName: string } | null>>;
  batchRunning: boolean;
  setBatchRunning: React.Dispatch<React.SetStateAction<boolean>>;
  showMisHelp: boolean;
  setShowMisHelp: React.Dispatch<React.SetStateAction<boolean>>;
  abortRef: React.MutableRefObject<AbortController | null>;
  onBatchEntryAdded?: (entry: ScanBatchEntry) => void;
  onReteach: (brief: ReteachBrief) => void;
  reteachBatch: ScanBatchResult;
  reteachThresholdPct: number;
}

function ClassSetTab(props: ClassSetTabProps) {
  const {
    worksheet, pupils,
    pendingImages, setPendingImages,
    batchResults, setBatchResults,
    batchProgress, setBatchProgress,
    batchRunning, setBatchRunning,
    showMisHelp, setShowMisHelp,
    abortRef, onBatchEntryAdded, onReteach,
    reteachBatch, reteachThresholdPct,
  } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [aggregate, setAggregate] = useState<BatchAggregate | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  // Recompute aggregate when results change.
  useEffect(() => {
    setAggregate(batchResults.length > 0 ? aggregateBatch(batchResults) : null);
  }, [batchResults]);

  function handleAddFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = BULK_LIMIT - pendingImages.length;
    if (room <= 0) { toast.error(`You can queue up to ${BULK_LIMIT} photos.`); return; }
    const taken = Array.from(files).slice(0, room);
    const next: PendingImage[] = [];
    for (const f of taken) {
      if (f.size > MAX_BYTES) { toast.warning(`Skipping ${f.name} — over 20 MB.`); continue; }
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        // Best-effort auto-assign: try to find a pupil whose name appears in
        // the filename. Falls back to first unassigned pupil, else "".
        pupilId: guessPupilFromFilename(f.name, pupils, pendingImages.map((p) => p.pupilId)) || "",
      });
    }
    setPendingImages((prev) => [...prev, ...next]);
  }

  function setRowPupil(id: string, pupilId: string) {
    setPendingImages((prev) => prev.map((p) => p.id === id ? { ...p, pupilId } : p));
  }
  function removeRow(id: string) {
    setPendingImages((prev) => prev.filter((p) => p.id !== id));
  }

  async function runBatch() {
    if (pendingImages.length === 0) { toast.error("Add some photos first."); return; }
    const unassigned = pendingImages.filter((p) => !p.pupilId);
    if (unassigned.length > 0) { toast.error(`${unassigned.length} photo${unassigned.length === 1 ? " has" : "s have"} no pupil assigned.`); return; }
    if (batchRunning) return;
    setBatchRunning(true);
    setBatchResults([]);
    setBatchProgress({ processed: 0, total: pendingImages.length, currentPupilName: "" });
    const ac = new AbortController();
    abortRef.current = ac;

    const inputs: BatchImageInput[] = pendingImages.map((p) => {
      const pupil = pupils.find((x) => x.id === p.pupilId);
      return {
        pupilId: p.pupilId,
        pupilName: pupil?.name || "Unknown pupil",
        upn: pupil?.upn,
        image: p.file,
      };
    });
    try {
      const gen = scanBatch(inputs, { worksheet, signal: ac.signal });
      // Drive the generator until it returns; collect each yielded progress.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const next = await gen.next();
        if (next.done) {
          // next.value is the final BatchScanResult[].
          const final = (next.value as BatchScanResult[]) || [];
          setBatchResults(final);
          // Push every entry into the parent's reteachBatch so the gap
          // panel mounts automatically — exact same channel PB3 uses.
          for (const entry of final) {
            if (entry.error) continue;
            onBatchEntryAdded?.({
              pupilId: entry.pupilId,
              pupilName: entry.pupilName,
              result: entry.result,
              scannedAt: entry.scannedAt,
            });
          }
          setBatchProgress({ processed: final.length, total: inputs.length, currentPupilName: "" });
          if (ac.signal.aborted) toast.warning(`Cancelled. Marked ${final.length} of ${inputs.length}.`);
          else toast.success(`Marked ${final.length} pupils. Generate comments and export when ready.`);
          break;
        }
        const p = next.value;
        setBatchProgress({ processed: p.processed, total: p.total, currentPupilName: p.currentPupilName });
        if (p.perPupilResult) {
          // Mark the matching row as done so the queue list strikes through.
          setPendingImages((prev) => prev.map((row, i) => i < p.processed ? { ...row, done: true } : row));
          // Append live so the per-pupil grid grows during the run.
          setBatchResults((prev) => [...prev, p.perPupilResult!]);
        }
      }
    } finally {
      setBatchRunning(false);
      abortRef.current = null;
    }
  }

  function abortBatch() {
    abortRef.current?.abort();
    toast.message("Cancelling… we'll stop after the current photo finishes.");
  }

  async function handleGenerateComments() {
    if (batchResults.length === 0) return;
    setGeneratingFeedback(true);
    try {
      const feedback = await generateBulkFeedback(batchResults, worksheet);
      // generateBulkFeedback mutates entry.feedbackComment in place; rebuild
      // the array reference to trigger a render.
      setBatchResults((prev) => prev.map((r) => {
        const f = feedback.find((x) => x.pupilId === r.pupilId);
        return f ? { ...r, feedbackComment: f.comment } : r;
      }));
      const fallbackCount = feedback.filter((f) => f.fallback).length;
      if (fallbackCount === feedback.length) {
        toast.warning("Used fallback comments — AI was unavailable. Comments still reference each pupil's wrong answers.");
      } else if (fallbackCount > 0) {
        toast.success(`Generated ${feedback.length - fallbackCount} comments (${fallbackCount} fell back).`);
      } else {
        toast.success(`Generated ${feedback.length} comments.`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not generate feedback comments.");
    } finally {
      setGeneratingFeedback(false);
    }
  }

  function handleExportCsv() {
    if (batchResults.length === 0) return;
    const csv = exportToCsv(batchResults, worksheet, aggregate ?? undefined);
    const filename = csvFilename(worksheet);
    downloadCsv(filename, csv);
    toast.success(`Downloaded ${filename}. Save it where your school keeps marksheets.`);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone / queue */}
      {batchResults.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <div className="text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drop in up to {BULK_LIMIT} photos at once. We'll auto-assign each photo to a pupil
              if the filename contains their name; you can override below.
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()} disabled={batchRunning}>
                <Upload className="w-4 h-4 mr-1.5" /> Add photos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={(e) => { handleAddFiles(e.target.files); e.target.value = ""; }}
              />
            </div>
          </div>
          {pendingImages.length > 0 && (
            <div className="border-t pt-3 space-y-1.5 max-h-72 overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground">Queue ({pendingImages.length}/{BULK_LIMIT})</div>
              {pendingImages.map((row) => (
                <div key={row.id} className={`flex items-center gap-2 text-sm ${row.done ? "opacity-50 line-through" : ""}`}>
                  <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{row.file.name}</span>
                  <Select value={row.pupilId} onValueChange={(v) => setRowPupil(row.id, v)} disabled={batchRunning}>
                    <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Pupil…" /></SelectTrigger>
                    <SelectContent>
                      {pupils.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => removeRow(row.id)} disabled={batchRunning}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress bar — visible during the run and immediately after */}
      {batchProgress && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {batchRunning ? `Marking ${batchProgress.currentPupilName || "…"}` : "Marking complete"}
            </span>
            <span className="text-muted-foreground">{batchProgress.processed}/{batchProgress.total}</span>
          </div>
          <Progress value={batchProgress.total > 0 ? (batchProgress.processed / batchProgress.total) * 100 : 0} />
          {batchRunning && (
            <Button variant="outline" size="sm" onClick={abortBatch}>
              <StopCircle className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
          )}
        </div>
      )}

      {/* Run button */}
      {batchResults.length === 0 && pendingImages.length > 0 && !batchRunning && (
        <Button onClick={runBatch} className="w-full">
          <Camera className="w-4 h-4 mr-1.5" /> Mark {pendingImages.length} pupil{pendingImages.length === 1 ? "" : "s"}
        </Button>
      )}

      {/* Aggregate panel */}
      {aggregate && batchResults.length > 0 && (
        <div className="rounded-md border bg-white p-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <Stat label="Pupils" value={aggregate.totalPupils.toString()} />
            <Stat label="Class accuracy" value={`${aggregate.classAccuracyPct}%`} accent={aggregate.classAccuracyPct >= 70 ? "emerald" : aggregate.classAccuracyPct >= 50 ? "amber" : "rose"} />
            <Stat label="Questions" value={aggregate.totalQuestions.toString()} />
            <Stat label="Top gaps" value={String(aggregate.topMisconceptions.length)} />
          </div>
          {aggregate.topMisconceptions.length > 0 && (
            <div className="text-xs">
              <div className="font-medium text-muted-foreground mb-1">Top misconceptions across the class</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {aggregate.topMisconceptions.map((m) => (
                  <li key={m.label}><span className="font-medium">{m.label}</span> · {m.pupilCount} pupil{m.pupilCount === 1 ? "" : "s"}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Per-pupil traffic-light grid */}
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Per-pupil marks</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {aggregate.perPupil.map((p) => {
                const tone = p.pctCorrect >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : p.pctCorrect >= 50 ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-rose-50 border-rose-200 text-rose-900";
                return (
                  <div key={p.pupilId} className={`rounded border px-2 py-1.5 text-xs ${tone}`}>
                    <div className="font-medium truncate">{p.pupilName}</div>
                    <div className="font-mono">{p.totalAwarded}/{p.totalAvailable} · {p.pctCorrect}%</div>
                    {p.gaps.length > 0 && (
                      <div className="truncate text-[10px] opacity-80 mt-0.5">{p.gaps[0]}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Failures, if any */}
          {batchResults.some((r) => r.error) && (
            <div className="text-xs rounded-md bg-rose-50 border border-rose-200 px-2 py-1.5 text-rose-900">
              {batchResults.filter((r) => r.error).length} scan{batchResults.filter((r) => r.error).length === 1 ? "" : "s"} failed.
              Re-photograph and try again from the Single tab.
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {batchResults.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateComments} disabled={generatingFeedback}>
            {generatingFeedback ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Writing comments…</> : <><MessageSquare className="w-4 h-4 mr-1.5" />Generate comments</>}
          </Button>
          <Button variant="default" size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowMisHelp(true)}>
            <Info className="w-4 h-4 mr-1.5" /> How to import into your MIS
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setBatchResults([]); setBatchProgress(null); setPendingImages([]); }}>
            <RefreshCcw className="w-4 h-4 mr-1.5" /> Start a new batch
          </Button>
        </div>
      )}

      {/* MIS import help */}
      {showMisHelp && (
        <div className="rounded-md border bg-blue-50/60 border-blue-200 p-3 text-xs space-y-2 text-blue-950">
          <div className="font-semibold flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> Importing your CSV
          </div>
          <p>
            Your marksheet is a free CSV file you save yourself — Adaptly does not push grades into
            your MIS. The columns (PupilName, UPN, Mark, OutOf, Pct, Comment, Misconceptions, Date)
            match the import format every UK MIS expects.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>SIMS</strong> — Reports → Marksheet → Import results from spreadsheet. Match the
              UPN column to the SIMS pupil identifier.
              {" "}
              <a className="underline" href="https://www.ess-help.com/" target="_blank" rel="noreferrer">ESS SIMS docs ↗</a>
            </li>
            <li>
              <strong>Bromcom</strong> — Assessment → Marksheets → Tools → Import from CSV.
              {" "}
              <a className="underline" href="https://docs.bromcom.com/" target="_blank" rel="noreferrer">Bromcom docs ↗</a>
            </li>
            <li>
              <strong>Arbor</strong> — Students → Assessments → upload Marksheet CSV.
              {" "}
              <a className="underline" href="https://support.arbor-education.com/" target="_blank" rel="noreferrer">Arbor docs ↗</a>
            </li>
          </ul>
          <p className="text-[11px] text-blue-900/70">
            Native MIS APIs (Wonde, GroupCall) arrive in a later release — for now the CSV is the
            free, no-paid-integration route.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowMisHelp(false)}>Close</Button>
        </div>
      )}

      {/* Re-teach gap panel mounts automatically once the batch has flowed
          into the parent's reteachBatch (PB3 channel — no extra click). */}
      {reteachBatch.length > 0 && worksheet && (
        <ReteachGapPanel batch={reteachBatch} sourceWorksheet={worksheet} thresholdPct={reteachThresholdPct} onReteach={onReteach} />
      )}
    </div>
  );
}

// ─── Voice tab ──────────────────────────────────────────────────────────────

interface VoiceTabProps {
  worksheet: any | null;
  pupils: PupilLite[];
  defaultPupilId?: string | null;
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  voiceResult: ScanMarkResult | null;
  setVoiceResult: React.Dispatch<React.SetStateAction<ScanMarkResult | null>>;
}

function VoiceTab({ worksheet, pupils, defaultPupilId, transcript, setTranscript, voiceResult, setVoiceResult }: VoiceTabProps) {
  const [pupilId, setPupilId] = useState<string>(defaultPupilId || "");
  const [file, setFile] = useState<File | null>(null);
  const [marking, setMarking] = useState(false);
  const [speakOnFinish, setSpeakOnFinish] = useState(true);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;
  const selectedPupil = useMemo(() => pupils.find((p) => p.id === pupilId) || null, [pupils, pupilId]);

  function speak(text: string) {
    if (!speechAvailable || !speakOnFinish) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1; u.lang = "en-GB";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* no-op */ }
  }

  async function handleSpeak() {
    if (!file) { toast.error("Take a photo first."); return; }
    if (!pupilId) { toast.error("Select a pupil."); return; }
    setMarking(true);
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
      setVoiceResult(r);
      const pupilName = selectedPupil?.name || "Pupil";
      const wrong = r.questions.filter((q) => !q.correct);
      const wrongMsg = wrong.length === 0
        ? "everything correct."
        : `missed ${wrong.map((q) => `Q${q.questionNumber}`).join(", ")}. ` +
          (wrong[0]?.misconceptionTag ? `Most common slip: ${wrong[0].misconceptionTag}.` : "");
      const summary = `${pupilName} ${r.summary.totalAwarded} out of ${r.summary.totalAvailable}, ${wrongMsg}`;
      setTranscript(summary);
      speak(summary);
    } catch (err: any) {
      toast.error(err?.message || "Marking failed.");
    } finally { setMarking(false); }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Phone-friendly mode. Hold the camera over a pupil's worksheet, tap Speak, and the page
        reads the result out loud. {speechAvailable ? "" : "Your browser doesn't support speech — text will still appear."}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="voice-pupil">Pupil</Label>
          <Select value={pupilId} onValueChange={setPupilId}>
            <SelectTrigger id="voice-pupil"><SelectValue placeholder="Select pupil" /></SelectTrigger>
            <SelectContent>
              {pupils.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Switch id="voice-speak" checked={speakOnFinish} onCheckedChange={setSpeakOnFinish} disabled={!speechAvailable} />
          <Label htmlFor="voice-speak" className="flex items-center gap-1 text-sm cursor-pointer">
            {speakOnFinish ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Read result aloud
          </Label>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-4 text-center space-y-3">
        <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
        <Button type="button" onClick={() => cameraRef.current?.click()} disabled={marking}>
          <Camera className="w-4 h-4 mr-1.5" /> {file ? "Retake photo" : "Take photo"}
        </Button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setVoiceResult(null); setTranscript(""); }}
        />
        {file && <div className="text-xs text-muted-foreground truncate">{file.name}</div>}
        <Button type="button" onClick={handleSpeak} disabled={!file || marking || !pupilId} className="w-full">
          {marking ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Marking…</> : <><Mic className="w-4 h-4 mr-1.5" /> Speak result</>}
        </Button>
      </div>

      {transcript && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-950">
          {transcript}
        </div>
      )}
      {voiceResult && voiceResult.questions.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Marked {voiceResult.questions.length} question{voiceResult.questions.length === 1 ? "" : "s"}.
          Switch to <strong>Single</strong> to save misconceptions to the pupil record.
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "amber" | "rose" }) {
  const tone = accent === "emerald" ? "text-emerald-700"
    : accent === "amber" ? "text-amber-700"
    : accent === "rose" ? "text-rose-700"
    : "text-foreground";
  return (
    <div className="rounded-md border bg-muted/30 px-2 py-1.5">
      <div className={`text-lg font-semibold ${tone}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

/**
 * Best-effort "find which pupil this filename belongs to". Uses substring
 * match against pupil names; skips pupils that already have an image
 * assigned. Returns "" if no confident match is found — the teacher can
 * still pick from the dropdown.
 */
function guessPupilFromFilename(filename: string, pupils: PupilLite[], taken: string[]): string {
  const stem = filename.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  // Exact-name match wins first.
  for (const p of pupils) {
    if (taken.includes(p.id)) continue;
    const name = (p.name || "").toLowerCase();
    if (!name) continue;
    if (stem.includes(name)) return p.id;
    // First name + last initial — e.g. "aisha-k.jpg".
    const parts = name.split(/\s+/);
    if (parts.length >= 2 && stem.includes(parts[0]) && stem.includes(parts[parts.length - 1][0] || "")) {
      return p.id;
    }
  }
  return "";
}

// ─── Bridge between the outer component and the hooks defined above ────────
// useBulkState is called once inside ScanMarkDialog above; its return
// values flow into ClassSetTab and VoiceTab via props.

export default ScanMarkDialog;
