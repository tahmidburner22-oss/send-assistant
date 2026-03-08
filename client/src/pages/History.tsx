import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { callAI } from "@/lib/ai";
import { subjects, sendNeeds } from "@/lib/send-data";
import { FileText, BookOpen, Star, Eye, Trash2, Clock, Edit3, Save, X, GraduationCap, CheckCircle, Sparkles, PenLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Worksheet, Story } from "@/contexts/AppContext";

type Section = { title: string; type: string; content: string; teacherOnly?: boolean; svg?: string; caption?: string };

function buildSections(ws: Worksheet): Section[] {
  if (ws.sections && ws.sections.length > 0) return ws.sections;
  const source = ws.teacherContent || ws.content || "";
  if (!source) return [];
  return source.split(/\n(?=## )/).map(block => {
    const lines = block.split("\n");
    const title = lines[0].replace(/^## /, "").trim();
    const content = lines.slice(1).join("\n").trim();
    return { title, type: "text", content };
  }).filter(s => s.title);
}

export default function History() {
  const { worksheetHistory, storyHistory, updateWorksheet } = useApp();

  // ── Worksheet viewer/editor state ──────────────────────────────────────────
  const [selectedWs, setSelectedWs] = useState<Worksheet | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState<Record<number, string>>({});
  const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");
  const [saving, setSaving] = useState(false);
  const [editType, setEditType] = useState<"none" | "manual" | "ai">("none");
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [storyEditType, setStoryEditType] = useState<"none" | "manual" | "ai">("none");
  const [storyAiPrompt, setStoryAiPrompt] = useState("");
  const [storyAiLoading, setStoryAiLoading] = useState(false);

  // ── Story viewer/editor state ───────────────────────────────────────────────
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyEditMode, setStoryEditMode] = useState(false);
  const [editedStoryContent, setEditedStoryContent] = useState("");

  // ── Open worksheet ──────────────────────────────────────────────────────────
  function openWorksheet(ws: Worksheet) {
    setSelectedWs(ws);
    setEditMode(false);
    setEditedSections({});
    setViewMode("teacher");
    setEditType("none");
    setAiEditPrompt("");
  }

  // ── Save worksheet edits ────────────────────────────────────────────────────
  async function saveWorksheetEdits() {
    if (!selectedWs) return;
    setSaving(true);
    try {
      const baseSections = buildSections(selectedWs);
      const updatedSections = baseSections.map((s, i) => ({
        ...s,
        content: editedSections[i] !== undefined ? editedSections[i] : s.content,
      }));
      const content = updatedSections.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      const teacherContent = updatedSections.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      await updateWorksheet(selectedWs.id, { sections: updatedSections, content, teacherContent });
      setSelectedWs({ ...selectedWs, sections: updatedSections, content, teacherContent });
      setEditedSections({});
      setEditMode(false);
      toast.success("Worksheet saved!");
    } catch {
      toast.error("Failed to save — please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Open story ──────────────────────────────────────────────────────────────
  function openStory(story: Story) {
    setSelectedStory(story);
    setStoryEditMode(false);
    setEditedStoryContent(story.content);
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">View and edit your previously generated worksheets and stories.</p>
      </motion.div>

      <Tabs defaultValue="worksheets">
        <TabsList className="w-full grid grid-cols-2 h-10">
          <TabsTrigger value="worksheets" className="text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Worksheets ({worksheetHistory.length})
          </TabsTrigger>
          <TabsTrigger value="stories" className="text-xs gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Stories ({storyHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Worksheets list ── */}
        <TabsContent value="worksheets" className="mt-4 space-y-2">
          {worksheetHistory.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No Worksheets Yet</h3>
                <p className="text-sm text-muted-foreground">Generate your first worksheet to see it here.</p>
              </CardContent>
            </Card>
          ) : worksheetHistory.map((ws, i) => {
            const subjectName = subjects.find(s => s.id === ws.subject)?.name || ws.subject;
            const needName = ws.sendNeed ? sendNeeds.find(n => n.id === ws.sendNeed)?.name : null;
            return (
              <motion.div key={ws.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openWorksheet(ws)}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{ws.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {subjectName} · {ws.yearGroup} · {ws.difficulty}{needName ? ` · ${needName}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{new Date(ws.createdAt).toLocaleDateString()}</span>
                        {ws.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" /> {ws.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openWorksheet(ws); }}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        {/* ── Stories list ── */}
        <TabsContent value="stories" className="mt-4 space-y-2">
          {storyHistory.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No Stories Yet</h3>
                <p className="text-sm text-muted-foreground">Generate your first story to see it here.</p>
              </CardContent>
            </Card>
          ) : storyHistory.map((story, i) => (
            <motion.div key={story.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openStory(story)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{story.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{story.genre} · {story.yearGroup} · {story.length}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openStory(story); }}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

      {/* ── Worksheet viewer / editor dialog ── */}
      <Dialog open={!!selectedWs} onOpenChange={open => { if (!open) { setSelectedWs(null); setEditMode(false); setEditedSections({}); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <span className="flex-1 truncate">{selectedWs?.title}</span>
              {selectedWs?.isAI && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-normal shrink-0">AI</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedWs && (() => {
            const sections = buildSections(selectedWs);
            const visibleSections = viewMode === "teacher" ? sections : sections.filter(s => !s.teacherOnly);

            return (
              <div className="space-y-4 mt-1">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Teacher / Student toggle */}
                  <div className="flex bg-muted rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode("teacher")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "teacher" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
                      <GraduationCap className="w-3.5 h-3.5" /> Teacher
                    </button>
                    <button
                      onClick={() => setViewMode("student")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "student" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
                      <Eye className="w-3.5 h-3.5" /> Student
                    </button>
                  </div>

                  {/* Edit with AI button */}
                  {editType === "none" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                        onClick={() => setEditType("ai")}>
                        <Sparkles className="h-3.5 w-3.5" />Edit with AI
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => { setEditMode(true); setEditType("manual"); }}>
                        <PenLine className="h-3.5 w-3.5" />Edit Manually
                      </Button>
                    </>
                  )}

                  {/* AI edit panel trigger */}
                  {editType === "ai" && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-300" onClick={() => { setEditType("none"); setAiEditPrompt(""); }}>
                      <X className="h-3.5 w-3.5" />Cancel AI Edit
                    </Button>
                  )}

                  {/* Manual edit cancel/save */}
                  {editType === "manual" && (
                    <>
                      <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-300" onClick={() => { setEditMode(false); setEditType("none"); setEditedSections({}); }}>
                        <X className="h-3.5 w-3.5" />Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-brand hover:bg-brand/90 text-white"
                        disabled={saving}
                        onClick={saveWorksheetEdits}>
                        {saving
                          ? <><CheckCircle className="h-3.5 w-3.5 mr-1 animate-spin" />Saving…</>
                          : <><Save className="h-3.5 w-3.5 mr-1" />Save Changes</>}
                      </Button>
                    </>)
                  }

                  {/* Print */}
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    Print
                  </Button>
                </div>

                {/* AI edit prompt panel */}
                {editType === "ai" && (
                  <div className="rounded-lg border border-brand/30 bg-brand-light/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-brand flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Describe what you'd like to change across the whole worksheet
                    </p>
                    <textarea
                      value={aiEditPrompt}
                      onChange={e => setAiEditPrompt(e.target.value)}
                      placeholder="e.g. Make it simpler for Year 3, add more examples, shorten the introduction…"
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none min-h-[70px]"
                      disabled={aiEditLoading}
                    />
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-brand text-white hover:bg-brand/90 disabled:opacity-50"
                        disabled={aiEditLoading}
                        onClick={async () => {
                          if (!aiEditPrompt.trim() || !selectedWs) return;
                          setAiEditLoading(true);
                          try {
                            const baseSections = buildSections(selectedWs);
                            const system = `You are an expert SEND teacher editing a worksheet. Apply the instruction to ALL sections and return a JSON array: [{"title":"...","content":"...","teacherOnly":bool}]. Keep the same section titles and structure.`;
                            const user = `Worksheet: "${selectedWs.title}"\nSubject: ${(selectedWs as any).subject || 'general'}\nYear Group: ${selectedWs.yearGroup || ''}\nSEND Need: ${selectedWs.sendNeed || ''}\n\nSections:\n${JSON.stringify(baseSections.map(s => ({ title: s.title, content: s.content, teacherOnly: s.teacherOnly })), null, 2)}\n\nInstruction: ${aiEditPrompt}\n\nReturn ONLY the JSON array:`;
                            const { text } = await callAI(system, user, 4000);
                            const jsonMatch = text.match(/\[.*\]/s);
                            if (!jsonMatch) throw new Error('No JSON');
                            const updatedSections = JSON.parse(jsonMatch[0]);
                            const mergedSections = baseSections.map((s, i) => ({
                              ...s,
                              content: updatedSections[i]?.content ?? s.content,
                            }));
                            const content = mergedSections.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join('\n\n');
                            const teacherContent = mergedSections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
                            await updateWorksheet(selectedWs.id, { sections: mergedSections, content, teacherContent });
                            setSelectedWs({ ...selectedWs, sections: mergedSections, content, teacherContent });
                            setEditType('none');
                            setAiEditPrompt('');
                            toast.success('Worksheet updated with AI!');
                          } catch {
                            toast.error('AI edit failed. Please try again.');
                          }
                          setAiEditLoading(false);
                        }}
                      >
                        {aiEditLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Editing…</> : <><Sparkles className="w-3.5 h-3.5" />Apply AI Edit</>}
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-input bg-background hover:bg-muted"
                        onClick={() => { setEditType('none'); setAiEditPrompt(''); }}
                        disabled={aiEditLoading}
                      >
                        <X className="w-3.5 h-3.5" />Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Sections */}
                {visibleSections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No content available — please regenerate this worksheet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {visibleSections.map((section, i) => {
                      const currentContent = editedSections[i] !== undefined ? editedSections[i] : section.content;
                      const isTeacher = section.teacherOnly;
                      return (
                        <div key={i} className={`rounded-lg border p-3 ${isTeacher ? "bg-amber-50 border-amber-200" : "bg-card border-border/50"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                            {isTeacher && (
                              <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Teacher</span>
                            )}
                          </div>
                          {editType === "manual" ? (
                            <Textarea
                              value={currentContent}
                              onChange={e => setEditedSections(prev => ({ ...prev, [i]: e.target.value }))}
                              className="text-sm font-mono min-h-[100px] resize-y"
                              placeholder="Enter section content…"
                            />
                          ) : editType === "ai" ? (
                            <div
                              className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 cursor-pointer rounded-md p-2 border border-dashed border-brand/40 hover:bg-brand-light/30 hover:border-brand transition-colors"
                              title="Click to edit this section with AI"
                              onClick={() => {
                                setAiEditSectionIndex(i);
                                setAiEditPrompt("");
                              }}
                            >
                              <span className="block text-[10px] text-brand font-medium mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />Click to edit with AI</span>
                              {currentContent}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{currentContent}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Story viewer / editor dialog ── */}
      <Dialog open={!!selectedStory} onOpenChange={open => { if (!open) { setSelectedStory(null); setStoryEditMode(false); setStoryEditType("none"); setStoryAiPrompt(""); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">{selectedStory?.title}</DialogTitle>
          </DialogHeader>
          {selectedStory && (
            <div className="space-y-3 mt-1">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {storyEditType === "none" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                      onClick={() => setStoryEditType("ai")}>
                      <Sparkles className="h-3.5 w-3.5" />Edit with AI
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => { setEditedStoryContent(selectedStory.content); setStoryEditMode(true); setStoryEditType("manual"); }}>
                      <PenLine className="h-3.5 w-3.5" />Edit Manually
                    </Button>
                  </>
                )}
                {storyEditType === "ai" && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-300"
                    onClick={() => { setStoryEditType("none"); setStoryAiPrompt(""); }}>
                    <X className="h-3.5 w-3.5" />Cancel AI Edit
                  </Button>
                )}
                {storyEditType === "manual" && (
                  <>
                    <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-300"
                      onClick={() => { setStoryEditMode(false); setStoryEditType("none"); }}>
                      <X className="h-3.5 w-3.5" />Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-brand hover:bg-brand/90 text-white"
                      onClick={() => {
                        setSelectedStory({ ...selectedStory, content: editedStoryContent });
                        setStoryEditMode(false);
                        setStoryEditType("none");
                        toast.success("Story updated!");
                      }}>
                      <Save className="h-3.5 w-3.5 mr-1" />Save Changes
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
              </div>

              {/* AI edit panel for story */}
              {storyEditType === "ai" && (
                <div className="rounded-lg border border-brand/30 bg-brand-light/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-brand flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Describe what you'd like to change
                  </p>
                  <textarea
                    value={storyAiPrompt}
                    onChange={e => setStoryAiPrompt(e.target.value)}
                    placeholder="e.g. Make it simpler, add more dialogue, change the ending…"
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none min-h-[70px]"
                    disabled={storyAiLoading}
                  />
                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-brand text-white hover:bg-brand/90 disabled:opacity-50"
                      disabled={storyAiLoading}
                      onClick={async () => {
                        if (!storyAiPrompt.trim() || !selectedStory) return;
                        setStoryAiLoading(true);
                        try {
                          const system = `You are an expert SEND teacher editing an educational story. Apply the instruction and return the full updated story as plain text only — no titles, no JSON.`;
                          const user = `Story title: "${selectedStory.title}"\n\nCurrent story:\n${selectedStory.content}\n\nInstruction: ${storyAiPrompt}\n\nReturn the full updated story:`;
                          const { text } = await callAI(system, user, 3000);
                          setSelectedStory({ ...selectedStory, content: text.trim() });
                          setStoryEditType("none");
                          setStoryAiPrompt("");
                          toast.success("Story updated with AI!");
                        } catch {
                          toast.error("AI edit failed. Please try again.");
                        }
                        setStoryAiLoading(false);
                      }}
                    >
                      {storyAiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Editing…</> : <><Sparkles className="w-3.5 h-3.5" />Apply AI Edit</>}
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-input bg-background hover:bg-muted"
                      onClick={() => { setStoryEditType("none"); setStoryAiPrompt(""); }}
                      disabled={storyAiLoading}
                    >
                      <X className="w-3.5 h-3.5" />Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              {storyEditType === "manual" ? (
                <Textarea
                  value={editedStoryContent}
                  onChange={e => setEditedStoryContent(e.target.value)}
                  className="text-sm font-mono min-h-[300px] resize-y"
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 rounded-lg border border-border/50 bg-card p-4">
                  {selectedStory.content}
                </div>
              )}

              {/* Comprehension questions */}
              {selectedStory.comprehensionQuestions && selectedStory.comprehensionQuestions.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <h3 className="font-semibold text-sm text-amber-800 mb-2">Comprehension Questions</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedStory.comprehensionQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-amber-900">{q}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
