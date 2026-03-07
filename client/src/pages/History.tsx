import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { subjects, sendNeeds } from "@/lib/send-data";
import { FileText, BookOpen, Star, Eye, Trash2, Clock, Edit3, Save, X, GraduationCap, CheckCircle } from "lucide-react";
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

                  {/* Edit / Done toggle */}
                  <Button
                    size="sm"
                    variant={editMode ? "default" : "outline"}
                    className={editMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                    onClick={() => { setEditMode(!editMode); if (editMode) setEditedSections({}); }}>
                    {editMode
                      ? <><X className="h-3.5 w-3.5 mr-1" />Cancel Edit</>
                      : <><Edit3 className="h-3.5 w-3.5 mr-1" />Edit</>}
                  </Button>

                  {/* Save button — only shown in edit mode */}
                  {editMode && (
                    <Button
                      size="sm"
                      className="bg-brand hover:bg-brand/90 text-white"
                      disabled={saving}
                      onClick={saveWorksheetEdits}>
                      {saving
                        ? <><CheckCircle className="h-3.5 w-3.5 mr-1 animate-spin" />Saving…</>
                        : <><Save className="h-3.5 w-3.5 mr-1" />Save Changes</>}
                    </Button>
                  )}

                  {/* Print */}
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    Print
                  </Button>
                </div>

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
                          {editMode ? (
                            <Textarea
                              value={currentContent}
                              onChange={e => setEditedSections(prev => ({ ...prev, [i]: e.target.value }))}
                              className="text-sm font-mono min-h-[100px] resize-y"
                              placeholder="Enter section content…"
                            />
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
      <Dialog open={!!selectedStory} onOpenChange={open => { if (!open) { setSelectedStory(null); setStoryEditMode(false); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">{selectedStory?.title}</DialogTitle>
          </DialogHeader>
          {selectedStory && (
            <div className="space-y-3 mt-1">
              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={storyEditMode ? "default" : "outline"}
                  className={storyEditMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                  onClick={() => {
                    if (!storyEditMode) setEditedStoryContent(selectedStory.content);
                    setStoryEditMode(!storyEditMode);
                  }}>
                  {storyEditMode
                    ? <><X className="h-3.5 w-3.5 mr-1" />Cancel</>
                    : <><Edit3 className="h-3.5 w-3.5 mr-1" />Edit</>}
                </Button>
                {storyEditMode && (
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand/90 text-white"
                    onClick={() => {
                      // Stories don't have a server update endpoint yet — update local state only
                      setSelectedStory({ ...selectedStory, content: editedStoryContent });
                      setStoryEditMode(false);
                      toast.success("Story updated locally!");
                    }}>
                    <Save className="h-3.5 w-3.5 mr-1" />Save
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
              </div>

              {/* Content */}
              {storyEditMode ? (
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
