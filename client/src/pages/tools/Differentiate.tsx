import { useState } from "react";
import { callAI } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, Copy, RotateCcw, FileDown, Printer, Palette, ZoomIn, ZoomOut, PenLine, X, Check, Loader2, UserPlus, Info, CheckCircle, Eye, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { subjects, yearGroups, sendNeeds, difficulties, colorOverlays } from "@/lib/send-data";
import SENDInfoPanel from "@/components/SENDInfoPanel";
import { downloadDifferentiatedPdf } from "@/lib/pdf-generator";
import { renderMath } from "@/components/WorksheetRenderer";
import { useApp } from "@/contexts/AppContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

// ─── Parse 3-way differentiated output ──────────────────────────────────────
function parse3Way(text: string): { support: string; core: string; extension: string } | null {
  const supportMatch = text.match(/\*\*Support\s*Level\*\*([^]*?)(?=\*\*Core\s*Level\*\*|\*\*Extension\s*Level\*\*|$)/i);
  const coreMatch = text.match(/\*\*Core\s*Level\*\*([^]*?)(?=\*\*Extension\s*Level\*\*|$)/i);
  const extensionMatch = text.match(/\*\*Extension\s*Level\*\*([^]*?)(?=$)/i);
  if (!supportMatch && !coreMatch && !extensionMatch) return null;
  return {
    support: supportMatch?.[1]?.trim() || "",
    core: coreMatch?.[1]?.trim() || "",
    extension: extensionMatch?.[1]?.trim() || "",
  };
}

// ─── Word-level diff algorithm ──────────────────────────────────────────────
function computeWordDiff(original: string, modified: string): Array<{ type: "same" | "added" | "removed"; word: string }> {
  const origWords = original.split(/\s+/).filter(Boolean);
  const modWords = modified.split(/\s+/).filter(Boolean);

  // LCS-based diff
  const m = origWords.length;
  const n = modWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1] === modWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: Array<{ type: "same" | "added" | "removed"; word: string }> = [];
  let i = m, j = n;
  const stack: Array<{ type: "same" | "added" | "removed"; word: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === modWords[j - 1]) {
      stack.push({ type: "same", word: origWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", word: modWords[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", word: origWords[i - 1] });
      i--;
    }
  }

  stack.reverse();
  result.push(...stack);
  return result;
}

export default function Differentiate() {
  const { colorOverlay, setColorOverlay, saveDifferentiation, children, assignWork } = useApp();
  const { preferences } = useUserPreferences();
  const filteredSubjects = subjects.filter(s => s.id !== "eleven-plus" || (preferences.show11Plus ?? false));
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignChildId, setAssignChildId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!assignChildId) return;
    setAssigning(true);
    try {
      const title = `Differentiated Task${subject ? ` — ${subjects.find(s => s.id === subject)?.name || subject}` : ""}${yearGroup ? ` (${yearGroup})` : ""}`;
      await assignWork(assignChildId, { title, type: "differentiation", content: result });
      toast.success("Assigned to student!");
      setShowAssignDialog(false);
      setAssignChildId("");
    } catch {
      toast.error("Failed to assign. Please try again.");
    }
    setAssigning(false);
  };
  const [subject, setSubject] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [topic, setTopic] = useState("");
  const [sendNeed, setSendNeed] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");
  const [originalTask, setOriginalTask] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOverlayPicker, setShowOverlayPicker] = useState(false);
  const [textSize, setTextSize] = useState(14);
  type EditMode = "none" | "manual" | "ai";
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [manualText, setManualText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
  // 3-way output state
  const [parsedLevels, setParsedLevels] = useState<{ support: string; core: string; extension: string } | null>(null);
  const [activeTab, setActiveTab] = useState("core");
  // Diff highlight state
  const [showDiff, setShowDiff] = useState(false);
  // Remix state
  const [showRemixSelect, setShowRemixSelect] = useState(false);
  const [remixLoading, setRemixLoading] = useState(false);

  

  const handleDifferentiate = async () => {
    if (!subject || !yearGroup || !topic || !originalTask) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const system = `You are a SEND specialist teacher who differentiates tasks to make them accessible for all learners. You follow UK SEND Code of Practice guidelines precisely.`;
      const user = `Differentiate this task for a ${yearGroup} ${subject} student${sendNeed ? ` with ${sendNeed}` : ""}.

Provide THREE differentiated versions with these exact headings:
**Support Level** - Simplified, scaffolded version with visual aids and reduced cognitive load
**Core Level** - Standard differentiated version meeting expected standards
**Extension Level** - Challenging version with deeper thinking and extension opportunities

TASK TO DIFFERENTIATE:
${originalTask}

Return all three versions with the headings above. Use plain text with markdown formatting.`;

      const { text } = await callAI(system, user, 3000);
      setResult(text);
      const parsed = parse3Way(text);
      setParsedLevels(parsed);
      setActiveTab("core");
      setShowDiff(false);
      saveDifferentiation({ taskContent: originalTask, differentiatedContent: text, sendNeed: sendNeed || undefined, yearGroup, subject });
      toast.success("Task differentiated with AI!");
    } catch (_err) {
      toast.error("AI differentiation failed. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const handleRemix = async (newSendNeed: string) => {
    if (!originalTask) return;
    setRemixLoading(true);
    try {
      const system = `You are a SEND specialist teacher who differentiates tasks to make them accessible for all learners. You follow UK SEND Code of Practice guidelines precisely.`;
      const user = `Differentiate this task for a ${yearGroup} ${subject} student with ${newSendNeed}.

Provide THREE differentiated versions with these exact headings:
**Support Level** - Simplified, scaffolded version with visual aids and reduced cognitive load
**Core Level** - Standard differentiated version meeting expected standards
**Extension Level** - Challenging version with deeper thinking and extension opportunities

TASK TO DIFFERENTIATE:
${originalTask}

Return all three versions with the headings above. Use plain text with markdown formatting.`;

      const { text } = await callAI(system, user, 3000);
      setResult(text);
      const parsed = parse3Way(text);
      setParsedLevels(parsed);
      setSendNeed(newSendNeed);
      setActiveTab("core");
      setShowDiff(false);
      setShowRemixSelect(false);
      toast.success(`Remixed for ${sendNeeds.find(n => n.id === newSendNeed)?.name || newSendNeed}!`);
    } catch (_err) {
      toast.error("Remix failed. Please try again.");
    }
    setRemixLoading(false);
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    const pdfFontSize = Math.round(textSize * 0.85);
    downloadDifferentiatedPdf(result, {
      overlayId: colorOverlay,
      fontSize: pdfFontSize,
    });
    toast.success("Differentiated task PDF downloaded!");
  };

  const handlePrint = () => {
    const overlayBg = colorOverlays.find(o => o.id === colorOverlay)?.color || "#ffffff";
    const style = document.createElement("style");
    style.id = "print-overlay-style";
    style.textContent = `
      @media print {
        .no-print, nav, header, .sidebar-overlay, [data-radix-popper-content-wrapper] { display: none !important; }
        body { background: ${overlayBg} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .diff-content { background: ${overlayBg} !important; }
        .diff-content * { font-size: ${textSize}px !important; }
        .diff-content h1 { font-size: ${textSize + 8}px !important; }
        .diff-content h2 { font-size: ${textSize + 4}px !important; }
        .diff-content h3 { font-size: ${textSize + 2}px !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById("print-overlay-style");
      if (el) el.remove();
    }, 1000);
  };

  const overlayBg = colorOverlays.find(o => o.id === colorOverlay)?.color || "#ffffff";

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">Adapt any task or activity for SEND students with evidence-based strategies.</p>
      </motion.div>

      {!result ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Subject *</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Year Group *</Label>
                  <Select value={yearGroup} onValueChange={setYearGroup}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Topic *</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions, Creative Writing" className="h-10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">SEND Need</Label>
                  <Select value={sendNeed} onValueChange={setSendNeed}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select SEND need" /></SelectTrigger>
                    <SelectContent>{sendNeeds.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Difficulty</Label>
                  <div className="flex gap-1">
                    {difficulties.map(d => (
                      <button key={d.id} onClick={() => setDifficulty(d.id)}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${difficulty === d.id ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEND Adaptation Info Panel */}
              {sendNeed && sendNeed !== "none-selected" && (
                <SENDInfoPanel sendNeedId={sendNeed} context="differentiation" />
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Original Task / Activity *</Label>
                <Textarea value={originalTask} onChange={e => setOriginalTask(e.target.value)}
                  placeholder="Paste or type the original task that needs differentiating..."
                  className="min-h-[120px] text-sm" />
              </div>

              <Button onClick={handleDifferentiate} disabled={loading} className="w-full h-11 bg-brand hover:bg-brand/90 text-white">
                {loading ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Differentiating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Differentiate Task</>}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button onClick={() => setTextSize(Math.max(10, textSize - 2))}
                className="p-1.5 rounded-md hover:bg-white/80 transition-all text-muted-foreground hover:text-foreground">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium px-1.5 min-w-[32px] text-center">{textSize}px</span>
              <button onClick={() => setTextSize(Math.min(24, textSize + 2))}
                className="p-1.5 rounded-md hover:bg-white/80 transition-all text-muted-foreground hover:text-foreground">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setShowOverlayPicker(!showOverlayPicker)}>
              <Palette className="w-3.5 h-3.5 mr-1.5" /> Overlay
            </Button>
            {editMode === "none" && (
              <>
                <Button variant="outline" size="sm"
                  className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                  onClick={() => setEditMode("ai")}>
                  <Sparkles className="w-3.5 h-3.5" />Edit with AI
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => { setManualText(result); setEditMode("manual"); }}>
                  <PenLine className="w-3.5 h-3.5" />Edit Manually
                </Button>
              </>
            )}
            {editMode === "ai" && (
              <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                onClick={() => { setEditMode("none"); setAiPrompt(""); }}>
                <X className="w-3.5 h-3.5" />Cancel AI Edit
              </Button>
            )}
            {editMode === "manual" && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                  onClick={() => setEditMode("none")}>
                  <X className="w-3.5 h-3.5" />Cancel
                </Button>
                <Button size="sm" className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                  onClick={() => { setResult(manualText); setEditMode("none"); toast.success("Changes saved!"); }}>
                  <Check className="w-3.5 h-3.5" />Save Changes
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied!"); }}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="text-brand border-brand/30 hover:bg-brand-light">
              <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAssignDialog(true)} className="gap-1.5 text-indigo-600 border-indigo-300 hover:bg-indigo-50">
              <UserPlus className="w-3.5 h-3.5" /> Assign to Pupil
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDiff(!showDiff)} className={`gap-1.5 ${showDiff ? "bg-amber-50 border-amber-300 text-amber-700" : ""}`}>
              <Eye className="w-3.5 h-3.5" /> {showDiff ? "Hide Changes" : "Show Changes"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRemixSelect(!showRemixSelect)} disabled={remixLoading}
              className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50">
              {remixLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Remixing...</> : <><RefreshCw className="w-3.5 h-3.5" /> Remix for another SEND profile</>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setResult(""); setParsedLevels(null); setShowDiff(false); }}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> New Task
            </Button>
          </div>

          {/* AI edit panel */}
          {editMode === "ai" && (
            <div className="rounded-lg border border-brand/30 bg-brand-light/30 p-3 space-y-2 no-print">
              <p className="text-xs font-medium text-brand flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Describe what you'd like to change
              </p>
              <Textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Make it simpler, add more scaffolding, include visual supports…"
                className="text-sm min-h-[80px] resize-none"
                disabled={aiEditLoading}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                  disabled={aiEditLoading}
                  onClick={async () => {
                    if (!aiPrompt.trim()) return;
                    setAiEditLoading(true);
                    try {
                      const system = `You are an expert SEND teacher editing a differentiated task. Apply the instruction and return the full updated content as plain text only.`;
                      const user = `Current content:\n${result}\n\nInstruction: ${aiPrompt}\n\nReturn the full updated content:`;
                      const { text } = await callAI(system, user, 3000);
                      setResult(text.trim());
                      setEditMode("none");
                      setAiPrompt("");
                      toast.success("Content updated with AI!");
                    } catch {
                      toast.error("AI edit failed. Please try again.");
                    }
                    setAiEditLoading(false);
                  }}
                >
                  {aiEditLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Editing…</> : <><Sparkles className="w-3.5 h-3.5" />Apply AI Edit</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditMode("none"); setAiPrompt(""); }} disabled={aiEditLoading}>
                  <X className="w-3.5 h-3.5 mr-1" />Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Manual edit textarea */}
          {editMode === "manual" && (
            <Textarea
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              className="text-sm font-mono min-h-[300px] resize-y no-print"
            />
          )}

          {/* Color Overlay Picker */}
          {showOverlayPicker && (
            <Card className="border-border/50 no-print">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">Colour overlay applies to screen, print, and PDF downloads.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colorOverlays.map(o => (
                    <button key={o.id} onClick={() => { setColorOverlay(o.id); setShowOverlayPicker(false); }}
                      className={`p-2 rounded-lg border-2 transition-all text-center ${colorOverlay === o.id ? "border-brand" : "border-transparent hover:border-border"}`}
                      style={{ backgroundColor: o.color }}>
                      <div className="text-xs font-medium text-gray-800">{o.name}</div>
                      <div className="text-[9px] text-gray-600 mt-0.5 leading-tight">{o.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assign to Pupil Dialog */}
          <Dialog open={showAssignDialog} onOpenChange={open => { if (!open) { setShowAssignDialog(false); setAssignChildId(""); } }}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Assign to Pupil</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground">Select a student to assign this differentiated task to.</p>
                <Select value={assignChildId} onValueChange={setAssignChildId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {children.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.yearGroup})</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleAssign} disabled={!assignChildId || assigning} className="flex-1 bg-brand hover:bg-brand/90 text-white">
                    {assigning ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Assigning…</> : <><UserPlus className="w-3.5 h-3.5 mr-1.5" />Assign</>}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAssignDialog(false); setAssignChildId(""); }}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Remix SEND profile selector */}
          {showRemixSelect && (
            <Card className="border-purple-200 no-print">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-medium text-purple-700">Select a different SEND profile to remix for:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sendNeeds.map(n => (
                    <button key={n.id} onClick={() => handleRemix(n.id)} disabled={remixLoading}
                      className={`p-2 rounded-lg border text-left transition-all text-xs ${n.id === sendNeed ? "border-purple-400 bg-purple-50" : "border-border hover:border-purple-300 hover:bg-purple-50/50"}`}>
                      <span className="font-medium">{n.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diff Highlight View */}
          {showDiff && (
            <Card className="border-amber-200 no-print">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-amber-700 mb-2">Word-level changes (Original vs. {activeTab === "support" ? "Support" : activeTab === "extension" ? "Extension" : "Core"} Level)</p>
                <div className="text-sm leading-relaxed">
                  {(() => {
                    const currentText = parsedLevels
                      ? (activeTab === "support" ? parsedLevels.support : activeTab === "extension" ? parsedLevels.extension : parsedLevels.core)
                      : result;
                    const diff = computeWordDiff(originalTask, currentText);
                    return diff.map((d, i) => {
                      if (d.type === "added") return <span key={i} className="bg-green-100 text-green-800 px-0.5 rounded">{d.word} </span>;
                      if (d.type === "removed") return <span key={i} className="bg-red-100 text-red-800 line-through px-0.5 rounded">{d.word} </span>;
                      return <span key={i}>{d.word} </span>;
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content - Tabbed 3-way output */}
          {parsedLevels ? (
            <div className="diff-content" style={{ backgroundColor: overlayBg }}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="support" className="flex-1">Support Level</TabsTrigger>
                  <TabsTrigger value="core" className="flex-1">Core Level</TabsTrigger>
                  <TabsTrigger value="extension" className="flex-1">Extension Level</TabsTrigger>
                </TabsList>
                <TabsContent value="support">
                  <Card className="border-border/50" style={{ backgroundColor: overlayBg }}>
                    <CardContent className="p-5" style={{ backgroundColor: overlayBg, fontSize: `${textSize}px` }}>
                      <Badge className="mb-3 bg-blue-100 text-blue-700 border-blue-200">Support Level</Badge>
                      <div className="prose prose-sm max-w-none" style={{ fontSize: `${textSize}px` }}
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(parsedLevels.support, textSize) }} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="core">
                  <Card className="border-border/50" style={{ backgroundColor: overlayBg }}>
                    <CardContent className="p-5" style={{ backgroundColor: overlayBg, fontSize: `${textSize}px` }}>
                      <Badge className="mb-3 bg-green-100 text-green-700 border-green-200">Core Level</Badge>
                      <div className="prose prose-sm max-w-none" style={{ fontSize: `${textSize}px` }}
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(parsedLevels.core, textSize) }} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="extension">
                  <Card className="border-border/50" style={{ backgroundColor: overlayBg }}>
                    <CardContent className="p-5" style={{ backgroundColor: overlayBg, fontSize: `${textSize}px` }}>
                      <Badge className="mb-3 bg-purple-100 text-purple-700 border-purple-200">Extension Level</Badge>
                      <div className="prose prose-sm max-w-none" style={{ fontSize: `${textSize}px` }}
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(parsedLevels.extension, textSize) }} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
          <div className="diff-content" style={{ backgroundColor: overlayBg }}>
            <Card className="border-border/50" style={{ backgroundColor: overlayBg }}>
              <CardContent className="p-5" style={{ backgroundColor: overlayBg, fontSize: `${textSize}px` }}>
                <div className="prose prose-sm max-w-none" style={{ fontSize: `${textSize}px` }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(result, textSize) }} />
              </CardContent>
            </Card>
          </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function markdownToHtml(md: string, textSize: number): string {
  // Apply KaTeX math rendering first, then markdown transformations
  const withMath = renderMath(md);
  return withMath
    .replace(/^### (.+)$/gm, `<h3 style="font-size:${textSize + 2}px" class="font-semibold mt-4 mb-2">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="font-size:${textSize + 4}px" class="font-bold mt-5 mb-2 text-purple-700">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="font-size:${textSize + 8}px" class="font-bold mb-3">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-muted-foreground">$1</em>')
    .replace(/^- \[ \] (.+)$/gm, `<div class="flex items-center gap-2 my-1"><input type="checkbox" class="rounded" /><span style="font-size:${textSize}px">$1</span></div>`)
    .replace(/^- (.+)$/gm, `<li style="font-size:${textSize}px" class="ml-4">$1</li>`)
    .replace(/^---$/gm, '<hr class="my-4 border-border" />')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
