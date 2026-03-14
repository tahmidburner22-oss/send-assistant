import { useState } from "react";
import { aiDifferentiateTask, callAI } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, Copy, RotateCcw, FileDown, Printer, Palette, ZoomIn, ZoomOut, PenLine, X, Check, Loader2, UserPlus, Info, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { subjects, yearGroups, sendNeeds, difficulties, colorOverlays } from "@/lib/send-data";
import SENDInfoPanel from "@/components/SENDInfoPanel";
import { downloadDifferentiatedPdf } from "@/lib/pdf-generator";
import { renderMath } from "@/components/WorksheetRenderer";
import { useApp } from "@/contexts/AppContext";

export default function Differentiate() {
  const { colorOverlay, setColorOverlay, saveDifferentiation, children, assignWork } = useApp();
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

  

  const handleDifferentiate = async () => {
    if (!subject || !yearGroup || !topic || !originalTask) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const aiResult = await aiDifferentiateTask({
        taskContent: originalTask,
        sendNeed: sendNeed || undefined,
        yearGroup,
        subject,
      });
      setResult(aiResult.differentiatedContent);
      saveDifferentiation({ taskContent: originalTask, differentiatedContent: aiResult.differentiatedContent, sendNeed: sendNeed || undefined, yearGroup, subject });
      toast.success("Task differentiated with AI!");
    } catch (_err) {
      // Fallback to local generator
      const need = sendNeeds.find(n => n.id === sendNeed);
      const subjectName = subjects.find(s => s.id === subject)?.name || subject;
      const adaptations = need ? need.worksheetAdaptations : [
        "Clear, structured layout with consistent formatting",
        "Step-by-step instructions with numbered points",
        "Visual supports where appropriate",
        "Appropriate font size and spacing",
      ];
      const differentiated = `# Differentiated Task: ${topic}\n**Subject:** ${subjectName} | **Year:** ${yearGroup} | **Difficulty:** ${difficulty}${need ? ` | **SEND Need:** ${need.name}` : ""}\n\n---\n\n## Original Task\n${originalTask}\n\n---\n\n## Differentiated Version\n\n### Adaptations Applied\n${adaptations.map((a: string) => `- ${a}`).join("\n")}\n\n### Modified Task\n\n**Instructions:** Complete the following task. Read each step carefully before moving on.\n\n${generateDifferentiatedContent(originalTask, difficulty, need?.id)}\n\n### Support Resources\n- Key vocabulary list provided\n- Visual aids and worked examples included\n- Sentence starters available if needed\n- Check your understanding with the self-assessment at the end\n\n### Self-Assessment\n- [ ] I understood the instructions\n- [ ] I completed all required sections\n- [ ] I checked my work\n- [ ] I am confident in my answers`;
      setResult(differentiated);
      saveDifferentiation({ taskContent: originalTask, differentiatedContent: differentiated, sendNeed: sendNeed || undefined, yearGroup, subject });
      toast.success("Task differentiated!");
    }
    setLoading(false);
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
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
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
            <Button variant="outline" size="sm" onClick={() => setResult("")}>
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

          {/* Content */}
          <div className="diff-content" style={{ backgroundColor: overlayBg }}>
            <Card className="border-border/50" style={{ backgroundColor: overlayBg }}>
              <CardContent className="p-5" style={{ backgroundColor: overlayBg, fontSize: `${textSize}px` }}>
                <div className="prose prose-sm max-w-none" style={{ fontSize: `${textSize}px` }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(result, textSize) }} />
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function generateDifferentiatedContent(task: string, difficulty: string, sendNeedId?: string): string {
  const lines = task.split("\n").filter(l => l.trim());
  let content = "";
  if (difficulty === "basic") {
    content += "**Step 1:** Read the task carefully.\n\n";
    content += "**Step 2:** Look at the key words highlighted below.\n\n";
    content += `**Step 3:** ${lines[0] || "Complete the activity"}\n\n`;
    content += "**Step 4:** Check your work using the checklist above.\n\n";
    content += "*Hint: Use the worked example to help you.*";
  } else if (difficulty === "stretch") {
    content += lines.map((l, i) => `**Task ${i + 1}:** ${l}`).join("\n\n");
    content += "\n\n**Extension:** Explain your reasoning in full sentences. Can you create a similar problem for a partner?";
  } else {
    content += lines.map((l, i) => `**${i + 1}.** ${l}`).join("\n\n");
    content += "\n\n*Complete as many tasks as you can. The final question is an optional challenge.*";
  }
  return content;
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
