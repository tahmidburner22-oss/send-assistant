import { useState } from "react";
import { aiGenerateStory, callAI } from "@/lib/ai";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { yearGroups, sendNeeds, storyGenres, storyLengths, readingLevels, colorOverlays } from "@/lib/send-data";
import { generateStoryContent } from "@/lib/worksheet-generator";

import { downloadStoryPdf } from "@/lib/pdf-generator";
import { ComprehensionQuiz } from "@/components/ComprehensionQuiz";

function generateComprehensionQuestions(_content: string, genre: string): string[] {
  const questions: Record<string, string[]> = {
    adventure: ["What challenge did the main character face?", "How did the character show bravery?", "What would you have done differently?", "Describe the setting in your own words."],
    fantasy: ["What magical elements appeared in the story?", "How did the character use their special abilities?", "What is the moral of the story?", "Describe the fantasy world in detail."],
    mystery: ["What clues helped solve the mystery?", "Who do you think was responsible and why?", "What red herrings appeared in the story?", "How did the detective use logical thinking?"],
    "sci-fi": ["What futuristic technology appeared in the story?", "How was the world different from our own?", "What scientific concepts were explored?", "What problems did the characters face in space/the future?"],
    historical: ["What historical period is the story set in?", "How was life different for people in that time?", "What historical facts are included in the story?", "What can we learn from this period of history?"],
    comedy: ["What made the story funny?", "Describe the funniest moment and explain why it was humorous.", "How did the misunderstanding begin?", "How was the problem eventually resolved?"],
    spooky: ["What created the feeling of suspense in the story?", "How did the author build tension?", "What was the scariest moment and why?", "Was the ending satisfying? Explain your answer."],
    sports: ["What obstacles did the character overcome?", "What does this story teach us about teamwork?", "How did the character prepare for the big event?", "What qualities made the character a good sportsperson?"],
  };
  const defaultQs = ["What is the main theme of this story?", "How does the main character change throughout the story?", "What is the most important moment in the story? Explain why.", "Write a short summary of the story in your own words."];
  return questions[genre] || defaultQs;
}
import { BookOpen, Sparkles, Copy, Download, Save, RotateCcw, Plus, X, Users, FileDown, Printer, Palette, ZoomIn, ZoomOut, PenLine, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function StoriesContent() {
  const { saveStory, children, assignWork, colorOverlay, setColorOverlay } = useApp();
  const [genre, setGenre] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [sendNeed, setSendNeed] = useState("");
  const [readingLevel, setReadingLevel] = useState("age-appropriate");
  const [length, setLength] = useState("medium");
  const [characters, setCharacters] = useState<string[]>([""]);
  const [setting, setSetting] = useState("");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string; questions: string[] } | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showOverlayPicker, setShowOverlayPicker] = useState(false);
  const [textSize, setTextSize] = useState(14);
  type EditMode = "none" | "manual" | "ai";
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [manualText, setManualText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);

  const addCharacter = () => setCharacters([...characters, ""]);
  const removeCharacter = (i: number) => setCharacters(characters.filter((_, idx) => idx !== i));
  const updateCharacter = (i: number, val: string) => {
    const updated = [...characters];
    updated[i] = val;
    setCharacters(updated);
  };

  

  const handleGenerate = async () => {
    if (!genre || !yearGroup) {
      toast.error("Please select a genre and year group.");
      return;
    }
    setLoading(true);
    try {
      const charNames = characters.filter(c => c.trim());
      const aiResult = await aiGenerateStory({
        genre, yearGroup,
        sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined,
        characters: charNames,
        setting: setting || undefined,
        theme: theme || undefined,
        readingLevel,
        length,
      });
      const questions = generateComprehensionQuestions(aiResult.content, genre);
      setResult({ title: aiResult.title, content: aiResult.content, questions });
      toast.success("Story generated with AI!");
    } catch (_err) {
      // Fallback to local generator
      const charNames = characters.filter(c => c.trim());
      const story = generateStoryContent({
        genre, yearGroup, sendNeed: sendNeed || undefined,
        characters: charNames, setting: setting || undefined,
        theme: theme || undefined, readingLevel, length,
      });
      const questions = generateComprehensionQuestions(story.content, genre);
      setResult({ ...story, questions });
      toast.success("Story generated!");
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!result) return;
    saveStory({
      title: result.title, genre, yearGroup,
      sendNeed: sendNeed || undefined,
      characters: characters.filter(c => c.trim()),
      setting, theme, readingLevel, length,
      content: result.content,
      comprehensionQuestions: result.questions,
    });
    toast.success("Story saved to history!");
  };

  const handleAssign = (childId: string) => {
    if (!result) return;
    assignWork(childId, { title: result.title, type: "story", content: result.content });
    setShowAssignDialog(false);
    toast.success("Story assigned!");
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    const pdfFontSize = Math.round(textSize * 0.85);
    downloadStoryPdf(result.title, result.content, result.questions, {
      overlayId: colorOverlay,
      fontSize: pdfFontSize,
    });
    toast.success("Story PDF downloaded!");
  };

  const handlePrint = () => {
    const overlayBg = colorOverlays.find(o => o.id === colorOverlay)?.color || "#ffffff";
    const style = document.createElement("style");
    style.id = "print-overlay-style";
    style.textContent = `
      @media print {
        .no-print, nav, header, .sidebar-overlay, [data-radix-popper-content-wrapper] { display: none !important; }
        body { background: ${overlayBg} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .story-content { background: ${overlayBg} !important; }
        .story-content * { font-size: ${textSize}px !important; }
        .story-content h1 { font-size: ${textSize + 8}px !important; }
        .story-content h2 { font-size: ${textSize + 4}px !important; }
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
    <div className="space-y-4 mt-4">
      {!result ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              {/* Genre Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Genre *</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {storyGenres.map(g => (
                    <button key={g.id} onClick={() => setGenre(g.id)}
                      className={`p-2.5 rounded-lg border text-center transition-all ${genre === g.id ? "border-brand bg-brand-light" : "border-border hover:border-brand/30"}`}>
                      <div className="text-lg mb-0.5">{g.emoji}</div>
                      <div className="text-[10px] font-medium">{g.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Year Group *</Label>
                  <Select value={yearGroup} onValueChange={setYearGroup}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">SEND Need</Label>
                  <Select value={sendNeed} onValueChange={setSendNeed}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select need" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">No specific need</SelectItem>
                      {sendNeeds.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Reading Level</Label>
                  <Select value={readingLevel} onValueChange={setReadingLevel}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{readingLevels.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Length</Label>
                  <div className="flex gap-1">
                    {storyLengths.map(l => (
                      <button key={l.id} onClick={() => setLength(l.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${length === l.id ? "bg-brand text-white" : "bg-muted text-muted-foreground"}`}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Characters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Characters</Label>
                  <button onClick={addCharacter} className="text-xs text-brand hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {characters.map((char, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={char} onChange={e => updateCharacter(i, e.target.value)}
                        placeholder={`Character ${i + 1} name`} className="h-9 text-sm" />
                      {characters.length > 1 && (
                        <button onClick={() => removeCharacter(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Setting (optional)</Label>
                  <Input value={setting} onChange={e => setSetting(e.target.value)} placeholder="e.g. A magical forest" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Theme (optional)</Label>
                  <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. Friendship" className="h-10" />
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="w-full h-11 bg-brand hover:bg-brand/90 text-white">
                {loading ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating Story...</> : <><BookOpen className="w-4 h-4 mr-2" /> Generate Story</>}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Text Size Controls */}
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
            {/* Edit with AI / Edit Manually */}
            {editMode === "none" && (
              <>
                <Button variant="outline" size="sm"
                  className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                  onClick={() => setEditMode("ai")}>
                  <Sparkles className="w-3.5 h-3.5" />Edit with AI
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => { setManualText(result.content); setEditMode("manual"); }}>
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
                  onClick={() => { setResult({ ...result, content: manualText }); setEditMode("none"); toast.success("Changes saved!"); }}>
                  <Check className="w-3.5 h-3.5" />Save Changes
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result.content); toast.success("Copied!"); }}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="text-brand border-brand/30 hover:bg-brand-light">
              <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Users className="w-3.5 h-3.5 mr-1.5" /> Assign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign Story</DialogTitle></DialogHeader>
                <div className="space-y-2 mt-2">
                  {children.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No children added yet.</p>
                  ) : children.map(child => (
                    <button key={child.id} onClick={() => handleAssign(child.id)}
                      className="w-full p-3 rounded-lg border border-border hover:border-brand/30 hover:bg-brand-light/30 transition-all text-left flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm">{child.name[0]}</div>
                      <div><div className="text-sm font-medium">{child.name}</div><div className="text-xs text-muted-foreground">{child.yearGroup}</div></div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> New Story
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
                placeholder="e.g. Make it simpler, add more dialogue, change the ending…"
                className="text-sm min-h-[80px] resize-none"
                disabled={aiEditLoading}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                  disabled={aiEditLoading}
                  onClick={async () => {
                    if (!aiPrompt.trim() || !result) return;
                    setAiEditLoading(true);
                    try {
                      const system = `You are an expert SEND teacher editing an educational story. Apply the instruction and return the full updated story as plain text only — no titles, no JSON.`;
                      const user = `Story title: "${result.title}"\n\nCurrent story:\n${result.content}\n\nInstruction: ${aiPrompt}\n\nReturn the full updated story:`;
                      const { text } = await callAI(system, user, 3000);
                      setResult({ ...result, content: text.trim() });
                      setEditMode("none");
                      setAiPrompt("");
                      toast.success("Story updated with AI!");
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
                <div className="grid grid-cols-4 gap-2">
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

          {/* Story Content */}
          <div className="story-content" style={{ backgroundColor: overlayBg }}>
            <Card className="border-border/50 overflow-hidden" style={{ backgroundColor: overlayBg }}>
              <CardContent className="p-5 sm:p-8" style={{ backgroundColor: overlayBg, fontSize: `${textSize}px` }}>
                <div className="prose prose-sm max-w-none" style={{ fontSize: `${textSize}px` }}
                  dangerouslySetInnerHTML={{ __html: storyToHtml(result.content, textSize) }} />
              </CardContent>
            </Card>
          </div>

          {/* Comprehension Quiz */}
          {result.questions.length > 0 && (
            <div className="story-content" style={{ backgroundColor: overlayBg }}>
              <ComprehensionQuiz
                questions={result.questions}
                storyTitle={result.title}
                onComplete={(score, total) => {
                  toast.success(`Quiz complete! You answered ${score} out of ${total} questions.`);
                }}
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function storyToHtml(md: string, textSize: number): string {
  if (!md) return '';
  // Split into paragraphs by double newline
  const paragraphs = md.split(/\n\n+/);
  const lineHeight = Math.max(1.7, 1.4 + (textSize - 12) * 0.02);
  return paragraphs.map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    // Chapter/section headings
    if (trimmed.startsWith('## ')) {
      const heading = trimmed.replace(/^## /, '');
      return `<h2 style="font-size:${textSize + 4}px;margin-top:24px;margin-bottom:8px" class="font-bold text-brand">${heading}</h2>`;
    }
    if (trimmed.startsWith('# ')) {
      const heading = trimmed.replace(/^# /, '');
      return `<h1 style="font-size:${textSize + 8}px;margin-bottom:12px" class="font-bold">${heading}</h1>`;
    }
    // Regular paragraph — apply inline formatting
    const formatted = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/"([^"]+)"/g, '\u201c$1\u201d') // Smart quotes for dialogue
      .replace(/\n/g, '<br/>'); // Single newlines within paragraph
    return `<p style="font-size:${textSize}px;line-height:${lineHeight};margin-bottom:${Math.round(textSize * 0.9)}px;text-indent:0">${formatted}</p>`;
  }).filter(Boolean).join('\n');
}
