import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { callAI, parseWithFixes, repairTruncatedJson } from "@/lib/ai";
import { subjects, sendNeeds } from "@/lib/send-data";
import { FileText, BookOpen, Star, Eye, Trash2, Clock, Edit3, Save, X, GraduationCap, CheckCircle, Sparkles, PenLine, Loader2, UserPlus, Layers, Copy, Share2, Link, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Worksheet, Story, Differentiation } from "@/contexts/AppContext";
import WorksheetRenderer, { renderMath } from "@/components/WorksheetRenderer";
import WorksheetErrorBoundary from "@/components/WorksheetErrorBoundary";
import { getTopicImages } from "@/lib/topic-image-bank";

type Section = {
  id?: string;
  title: string;
  type: string;
  content: string;
  teacherOnly?: boolean;
  svg?: string;
  caption?: string;
  imageUrl?: string;
  assetRef?: string;
  attribution?: string;
  [key: string]: unknown;
};

function enrichAtomicStructureSections(ws: Worksheet, sections: Section[]): Section[] {
  const isAtomicStructure = /atomic structure/i.test(ws.topic || "") || /atomic structure/i.test(ws.title || "");
  if (!isAtomicStructure) return sections;

  const atomicImages = getTopicImages("chemistry", "Atomic Structure");
  const unlabelledImage = atomicImages[0]?.url || "/images/atom_nb_unlabelled_final.png";
  const labelledImage = atomicImages[1]?.url || "/images/atom_nb_labelled_final.png";

  return sections.map((section, index) => {
    const title = String(section.title || "");
    const content = String(section.content || "");
    const normalizedTitle = title.toLowerCase();
    const normalizedContent = content.toLowerCase();
    const merged: Section = {
      ...section,
      teacherOnly: section.teacherOnly ?? normalizedTitle.startsWith("teacher "),
    };

    const isLabelDiagram =
      section.type === "q-label-diagram" ||
      /q1\s*[-—:]\s*label the diagram/i.test(title) ||
      /label the diagram/i.test(title) ||
      /labels:/i.test(content);

    const isReferenceDiagram =
      section.type === "diagram" ||
      /reference diagram/i.test(title) ||
      /labelled carbon atom/i.test(title) ||
      /labelled bohr model/i.test(content);

    if (isLabelDiagram) {
      return {
        ...merged,
        id: section.id || `atomic-structure-label-diagram-${index}`,
        type: "q-label-diagram",
        imageUrl: section.imageUrl || unlabelledImage,
        assetRef: section.assetRef || "q1-label-diagram",
        caption: section.caption || "Unlabelled Bohr model of a carbon atom for the labelling task.",
      };
    }

    if (isReferenceDiagram) {
      return {
        ...merged,
        id: section.id || `atomic-structure-reference-diagram-${index}`,
        type: "diagram",
        imageUrl: section.imageUrl || labelledImage,
        assetRef: section.assetRef || "reference-labelled-carbon",
        caption: section.caption || "Labelled Bohr model of a carbon atom used as a reference scaffold.",
      };
    }

    if (/teacher answer key/i.test(title) || /teacher answer key/i.test(content)) {
      return {
        ...merged,
        id: section.id || `atomic-structure-teacher-answer-key-${index}`,
        type: "mark-scheme",
        title: /higher/i.test(ws.title || "") && /mixed ability/i.test(title)
          ? title.replace(/mixed ability/ig, "Higher")
          : title,
        content: /higher/i.test(ws.title || "") && /mixed ability/i.test(normalizedContent)
          ? content.replace(/mixed ability/ig, "Higher")
          : content,
        teacherOnly: true,
      };
    }

    if (/teacher notes/i.test(title)) {
      return {
        ...merged,
        id: section.id || `atomic-structure-teacher-notes-${index}`,
        type: "teacher-notes",
        teacherOnly: true,
      };
    }

    return merged;
  });
}

function buildSections(ws: Worksheet): Section[] {
  if (ws.sections && ws.sections.length > 0) return enrichAtomicStructureSections(ws, ws.sections as Section[]);
  const source = ws.teacherContent || ws.content || "";
  if (!source) return [];

  const isAtomicStructure = /atomic structure/i.test(ws.topic || "") || /atomic structure/i.test(ws.title || "");

  const built = source.split(/\n(?=## )/).map(block => {
    const lines = block.split("\n");
    const title = lines[0].replace(/^## /, "").trim();
    const content = lines.slice(1).join("\n").trim();
    const normalizedTitle = title.toLowerCase();

    const base: Section = {
      title,
      type: normalizedTitle.startsWith("teacher ") ? "teacher-notes" : "text",
      content,
      teacherOnly: normalizedTitle.startsWith("teacher "),
    };

    if (isAtomicStructure) {
      if (/q1\s*-\s*label the diagram/i.test(title)) {
        return {
          ...base,
          id: "q1-label-diagram",
          type: "q-label-diagram",
          imageUrl: "/images/atom_nb_unlabelled_final.png",
          caption: "Unlabelled Bohr model of a carbon atom for the labelling task.",
        };
      }
      if (/reference diagram\s*-\s*carbon atom/i.test(title)) {
        return {
          ...base,
          id: "reference-labelled-carbon",
          type: "diagram",
          imageUrl: "/images/atom_nb_labelled_final.png",
          caption: "Labelled Bohr model of a carbon atom used as a reference scaffold.",
        };
      }
      if (/teacher answer key/i.test(title)) {
        return {
          ...base,
          id: "teacher-answer-key",
          type: "mark-scheme",
          teacherOnly: true,
        };
      }
      if (/teacher notes/i.test(title)) {
        return {
          ...base,
          id: "teacher-notes",
          type: "teacher-notes",
          teacherOnly: true,
        };
      }
    }

    return base;
  }).filter(s => s.title);

  return enrichAtomicStructureSections(ws, built);
}

/** Convert a Worksheet record into WorksheetData for WorksheetRenderer */
function toWorksheetData(ws: Worksheet) {
  const sections = buildSections(ws);
  return {
    title: ws.title,
    subtitle: (ws as any).subtitle,
    sections: sections as any,
    metadata: {
      subject: ws.subject,
      topic: ws.topic,
      yearGroup: ws.yearGroup,
      sendNeed: ws.sendNeed,
      sendNeedId: ws.sendNeed,
      difficulty: ws.difficulty,
      examBoard: ws.examBoard,
      ...(ws.metadata || {}),
    },
    libraryAssets: (ws as any).libraryAssets || (ws as any).library_assets || [],
    canonicalTopicKey: (ws as any).canonicalTopicKey || (ws as any).canonical_topic_key,
    structuralHash: (ws as any).structuralHash || (ws as any).structural_hash,
    availableTiers: (ws as any).availableTiers || (ws as any).available_tiers || [],
    isAI: ws.isAI,
  };
}

/** Render differentiated content as HTML with math support */
function diffToHtml(text: string): string {
  const withMath = renderMath(text);
  return withMath
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3} (.+)$/gm, "<h3 class='font-bold text-base mt-4 mb-1 text-foreground'>$1</h3>")
    .replace(/^[•\-] (.+)$/gm, "<li class='ml-4 list-disc text-foreground/90'>$1</li>")
    .replace(/^\* (.+)$/gm, "<li class='ml-4 list-disc text-foreground/90'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal text-foreground/90'>$2</li>")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n{2,}/g, "</p><p class='mb-2 text-foreground/90'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p class='mb-2 text-foreground/90'>")
    .replace(/$/, "</p>");
}

/** Render story content as formatted HTML */
function storyToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/\n{2,}/g, "</p><p class='mb-3 leading-relaxed text-foreground/90'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p class='mb-3 leading-relaxed text-foreground/90'>")
    .replace(/$/, "</p>");
}

export default function History() {
  const { worksheetHistory, storyHistory, differentiationHistory, updateWorksheet, saveWorksheet, children, assignWork, refreshData } = useApp();

  // Re-fetch data from server on mount so history is always current
  useEffect(() => { refreshData(); }, []);

  // ── Assign to student state ─────────────────────────────────────────────────
  const [assignItem, setAssignItem] = useState<{ title: string; type: string; content: string } | null>(null);
  const [assignChildId, setAssignChildId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // ── Share worksheet state ───────────────────────────────────────────────────
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // ── SEND filter + bulk delete + content type + subject ───────────────────────
  const [filterSendNeed, setFilterSendNeed] = useState<string>("all");
  const [filterContentType, setFilterContentType] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelectId = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} worksheet(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
          await Promise.all([...selectedIds].map(id =>
        fetch(`/api/data/worksheets/${id}`, {
          method: "DELETE",
          credentials: "include",
          credentials: "include",
        })
      ));
      toast.success(`Deleted ${selectedIds.size} worksheet(s)`);
      setSelectedIds(new Set());
      setBulkMode(false);
      refreshData();
    } catch {
      toast.error("Failed to delete some worksheets");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleShare = useCallback(async (wsId: string) => {
    setSharingId(wsId);
    try {
          const res = await fetch(`/api/data/worksheets/${wsId}/share`, {
        method: "POST",
        credentials: "include",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setShareToken(data.token);
      } else {
        toast.error("Could not create share link");
      }
    } catch { toast.error("Network error"); }
    setSharingId(null);
  }, []);

  const copyShareLink = useCallback(() => {
    if (!shareToken) return;
    const url = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      toast.success("Share link copied!");
    });
  }, [shareToken]);

  // ── Duplicate worksheet ─────────────────────────────────────────────────────
  const handleDuplicate = useCallback(async (ws: Worksheet) => {
    try {
      await saveWorksheet({
        title: `${ws.title} (Copy)`,
        subtitle: (ws as any).subtitle,
        subject: ws.subject,
        topic: ws.topic,
        yearGroup: ws.yearGroup,
        sendNeed: ws.sendNeed,
        difficulty: ws.difficulty,
        examBoard: ws.examBoard,
        content: ws.content,
        teacherContent: ws.teacherContent,
        rating: 0,
        overlay: ws.overlay,
        sections: ws.sections,
        metadata: ws.metadata as any,
        isAI: ws.isAI,
      });
      toast.success("Worksheet duplicated!");
      refreshData();
    } catch { toast.error("Could not duplicate worksheet"); }
  }, [saveWorksheet, refreshData]);

  const handleAssign = useCallback(async () => {
    if (!assignItem || !assignChildId) return;
    setAssigning(true);
    try {
      await assignWork(assignChildId, { title: assignItem.title, type: assignItem.type as any, content: assignItem.content });
      toast.success(`Assigned to student successfully!`);
      setAssignItem(null);
      setAssignChildId("");
    } catch {
      toast.error("Failed to assign. Please try again.");
    } finally {
      setAssigning(false);
    }
  }, [assignItem, assignChildId, assignWork]);

  // ── Worksheet viewer/editor state ──────────────────────────────────────────
  const [selectedWs, setSelectedWs] = useState<Worksheet | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState<Record<number, string>>({});
  const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");
  const [saving, setSaving] = useState(false);
  const [editType, setEditType] = useState<"none" | "manual" | "ai">("none");
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [aiEditSectionIndex, setAiEditSectionIndex] = useState<number | null>(null);
  const [storyEditType, setStoryEditType] = useState<"none" | "manual" | "ai">("none");
  const [storyAiPrompt, setStoryAiPrompt] = useState("");
  const [storyAiLoading, setStoryAiLoading] = useState(false);

  // ── Story viewer/editor state ───────────────────────────────────────────────
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyEditMode, setStoryEditMode] = useState(false);
  const [editedStoryContent, setEditedStoryContent] = useState("");

  // ── Differentiation viewer state ────────────────────────────────────────────
  const [selectedDiff, setSelectedDiff] = useState<Differentiation | null>(null);

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
        <TabsList className="w-full grid grid-cols-3 h-10">
          <TabsTrigger value="worksheets" className="text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Worksheets ({worksheetHistory.length})
          </TabsTrigger>
          <TabsTrigger value="stories" className="text-xs gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Stories ({storyHistory.length})
          </TabsTrigger>
          <TabsTrigger value="differentiation" className="text-xs gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Differentiated ({differentiationHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Worksheets list ── */}
        <TabsContent value="worksheets" className="mt-4 space-y-2">
          {worksheetHistory.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pb-1">
              <Select value={filterContentType} onValueChange={v => { setFilterContentType(v); setSelectedIds(new Set()); }}>
                <SelectTrigger className="h-8 text-xs w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="worksheet">Worksheets only</SelectItem>
                  <SelectItem value="revision-mat">Revision Mats only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={v => { setFilterSubject(v); setSelectedIds(new Set()); }}>
                <SelectTrigger className="h-8 text-xs w-40">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSendNeed} onValueChange={v => { setFilterSendNeed(v); setSelectedIds(new Set()); }}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <SelectValue placeholder="All SEND needs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SEND needs</SelectItem>
                  {sendNeeds.map(n => <SelectItem key={n.id} value={n.id} className="text-xs">{n.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {(filterSendNeed !== "all" || filterSubject !== "all" || filterContentType !== "all") && (
                <button onClick={() => { setFilterSendNeed("all"); setFilterSubject("all"); setFilterContentType("all"); }} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear filters
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                {bulkMode && selectedIds.size > 0 && (
                  <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={handleBulkDelete} disabled={bulkDeleting}>
                    <Trash2 className="w-3 h-3" />{bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
                  </Button>
                )}
                <Button size="sm" variant={bulkMode ? "default" : "outline"} className="h-7 text-xs" onClick={() => { setBulkMode(b => !b); setSelectedIds(new Set()); }}>
                  {bulkMode ? "Cancel" : "Bulk Select"}
                </Button>
              </div>
            </div>
          )}
          {worksheetHistory.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No Worksheets Yet</h3>
                <p className="text-sm text-muted-foreground">Generate your first worksheet to see it here.</p>
              </CardContent>
            </Card>
          ) : worksheetHistory.filter(ws => {
            const wsIsRM2 = (ws.sections || []).some((s: any) => s.type === "revision-mat-box" || s.type === "revision-mat-lo" || s.type === "revision-mat-title");
            if (filterSendNeed !== "all" && ws.sendNeed !== filterSendNeed) return false;
            if (filterSubject !== "all" && ws.subject !== filterSubject) return false;
            if (filterContentType === "revision-mat" && !wsIsRM2) return false;
            if (filterContentType === "worksheet" && wsIsRM2) return false;
            return true;
          }).map((ws, i) => {
            const isSelected = selectedIds.has(ws.id);
            const subjectName = subjects.find(s => s.id === ws.subject)?.name || ws.subject;
            const needName = ws.sendNeed ? sendNeeds.find(n => n.id === ws.sendNeed)?.name : null;
            const wsIsRM = (ws.sections || []).some((s: any) => s.type === "revision-mat-box" || s.type === "revision-mat-lo" || s.type === "revision-mat-title");
            return (
              <motion.div key={ws.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className={`border-border/50 hover:shadow-md transition-shadow ${bulkMode ? "" : "cursor-pointer"} ${isSelected ? "ring-2 ring-brand border-brand" : ""}`}
                onClick={() => bulkMode ? toggleSelectId(ws.id) : openWorksheet(ws)}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${wsIsRM ? "bg-amber-100" : "bg-brand-light"}`}>
                      {wsIsRM ? <span className="text-lg">📐</span> : <FileText className="w-5 h-5 text-brand" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">{ws.title.split(' | ')[0].split(' | ')[0]}</h4>
                        {wsIsRM && <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 flex-shrink-0">Revision Mat</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {subjectName} · {ws.yearGroup} · {ws.difficulty}{needName ? ` · ${needName}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{new Date(ws.createdAt).toLocaleDateString()}</span>
                        {ws.rating != null && ws.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" /> {ws.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" title="Assign to student" onClick={e => { e.stopPropagation(); setAssignItem({ title: ws.title, type: "worksheet", content: ws.content || "" }); }}>
                        <UserPlus className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" title="Duplicate" onClick={e => { e.stopPropagation(); handleDuplicate(ws); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" title="Share link" onClick={e => { e.stopPropagation(); handleShare(ws.id); }}>
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openWorksheet(ws); }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" title="Assign to student" onClick={e => { e.stopPropagation(); setAssignItem({ title: story.title, type: "story", content: story.content || "" }); }}>
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openStory(story); }}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* ── Differentiation list ── */}
        <TabsContent value="differentiation" className="mt-4 space-y-2">
          {differentiationHistory.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No Differentiated Tasks Yet</h3>
                <p className="text-sm text-muted-foreground">Differentiate a task to see it saved here.</p>
              </CardContent>
            </Card>
          ) : differentiationHistory.map((diff, i) => (
            <motion.div key={diff.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedDiff(diff)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {diff.subject ? diff.subject : "Differentiated Task"}{diff.yearGroup ? ` · ${diff.yearGroup}` : ""}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{diff.taskContent}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(diff.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" title="Assign to student" onClick={e => { e.stopPropagation(); setAssignItem({ title: `Differentiated Task${diff.subject ? ` — ${diff.subject}` : ""} (${new Date(diff.createdAt).toLocaleDateString()})`, type: "differentiation", content: diff.differentiatedContent }); }}>
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSelectedDiff(diff); }}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
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
                  {(() => {
                    const isRM = sections.some(s => s.type === "revision-mat-box" || s.type === "revision-mat-lo" || s.type === "revision-mat-title");
                    return (
                      <Button size="sm" variant="outline" onClick={() => {
                        if (isRM) {
                          const style = document.createElement("style");
                          style.id = "rm-landscape-print";
                          style.textContent = "@page { size: A4 landscape; margin: 5mm; }";
                          document.head.appendChild(style);
                          window.print();
                          setTimeout(() => { const el = document.getElementById("rm-landscape-print"); if (el) el.remove(); }, 1000);
                        } else {
                          window.print();
                        }
                      }}>
                        Print{isRM ? " (Landscape)" : ""}
                      </Button>
                    );
                  })()}
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

                            // ── Build rich SEND context for the AI ─────────────────────────────
                            const sendNeedId = selectedWs.sendNeed || '';
                            const sendNeedObj = sendNeeds.find(n => n.id === sendNeedId);
                            const sendNeedName = sendNeedObj?.name || sendNeedId || 'General';
                            const sendAdaptations = sendNeedObj?.worksheetAdaptations?.join('; ') || '';
                            const sendSummary = (sendNeedObj as any)?.worksheetChanges?.summary || '';

                            // ── Year-group pedagogy guidance ───────────────────────────────────
                            const yearGroup = selectedWs.yearGroup || '';
                            const yearNum = parseInt(yearGroup.replace(/\D/g, ''), 10);
                            const yearGuidance = !isNaN(yearNum)
                              ? yearNum <= 2
                                ? 'KS1 (Year 1–2): use very short sentences (max 8 words), concrete examples, picture supports, and minimal abstract language.'
                                : yearNum <= 6
                                ? 'KS2 (Year 3–6): use clear, direct language, step-by-step instructions, and relatable real-world contexts.'
                                : yearNum <= 9
                                ? 'KS3 (Year 7–9): use subject-specific vocabulary with definitions, structured scaffolding, and age-appropriate contexts.'
                                : 'KS4/KS5 (Year 10–13): use precise academic language, exam-style question formats, and mark-scheme aligned answers.'
                              : '';

                            // ── Subject-specific guidance ──────────────────────────────────────
                            const subjectId = (selectedWs as any).subject || '';
                            const subjectName = subjects.find(s => s.id === subjectId)?.name || subjectId || 'General';

                            // ── System prompt ─────────────────────────────────────────────────
                            const system = [
                              `You are an expert SEND teacher and educational content specialist editing a worksheet for a student with ${sendNeedName}.`,
                              `Your edits must comply with evidence-based SEND pedagogy and the COBS Handbook guidelines.`,
                              ``,
                              `STUDENT CONTEXT:`,
                              `- SEND Need: ${sendNeedName}`,
                              sendAdaptations ? `- Required adaptations: ${sendAdaptations}` : '',
                              sendSummary ? `- Worksheet approach: ${sendSummary}` : '',
                              yearGuidance ? `- Year group: ${yearGroup} — ${yearGuidance}` : '',
                              `- Subject: ${subjectName}`,
                              ``,
                              `EDITING RULES:`,
                              `1. Apply the teacher's instruction to ALL sections.`,
                              `2. Preserve every section's title exactly as given.`,
                              `3. Preserve the teacherOnly flag on every section — never change it.`,
                              `4. Preserve svg and caption fields if present — do not remove them.`,
                              `5. Do NOT add new sections or remove existing ones.`,
                              `6. Ensure all content remains appropriate for the student's SEND need and year group.`,
                              `7. Return ONLY a valid JSON array — no markdown fences, no explanation text.`,
                              ``,
                              `OUTPUT FORMAT (strict):`,
                              `[{"title":"Section Title","content":"Section content...","teacherOnly":false},{...}]`,
                            ].filter(Boolean).join('\n');

                            // ── User prompt ───────────────────────────────────────────────────
                            const user = [
                              `Worksheet: "${selectedWs.title}"`,
                              `Subject: ${subjectName}`,
                              `Year Group: ${yearGroup}`,
                              `Difficulty: ${selectedWs.difficulty || ''}`,
                              `SEND Need: ${sendNeedName}`,
                              selectedWs.examBoard ? `Exam Board: ${selectedWs.examBoard}` : '',
                              ``,
                              `Current sections (${baseSections.length} total):`,
                              JSON.stringify(
                                baseSections.map(s => ({
                                  title: s.title,
                                  content: s.content,
                                  teacherOnly: s.teacherOnly ?? false,
                                })),
                                null, 2
                              ),
                              ``,
                              `Teacher instruction: ${aiEditPrompt}`,
                              ``,
                              `Return ONLY the JSON array with all ${baseSections.length} sections updated:`,
                            ].filter(s => s !== null && s !== undefined).join('\n');

                            const { text } = await callAI(system, user, 4000);

                            // ── Robust JSON extraction ────────────────────────────────────────
                            // Try to extract a JSON array from the response, handling common
                            // AI formatting issues (markdown fences, leading text, truncation).
                            let jsonStr: string | null = null;
                            const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
                            if (fenceMatch) {
                              jsonStr = fenceMatch[1].trim();
                            } else {
                              const arrMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
                              jsonStr = arrMatch ? arrMatch[0] : null;
                            }
                            if (!jsonStr) {
                              // Last resort: try to find the first '[' and take everything from there
                              const idx = text.indexOf('[');
                              if (idx !== -1) jsonStr = text.slice(idx);
                            }
                            if (!jsonStr) throw new Error('AI did not return a JSON array. Please try again.');

                            let updatedSections: any[];
                            try {
                              updatedSections = parseWithFixes(jsonStr);
                            } catch {
                              // Attempt truncation repair as a last resort
                              const repaired = repairTruncatedJson(jsonStr);
                              if (!repaired) throw new Error('Could not parse AI response. Please try again.');
                              updatedSections = parseWithFixes(repaired);
                            }

                            if (!Array.isArray(updatedSections) || updatedSections.length === 0) {
                              throw new Error('AI returned an empty or invalid response.');
                            }

                            // Merge: use AI content but always keep original metadata (svg, caption, type, teacherOnly)
                            const mergedSections = baseSections.map((s, i) => ({
                              ...s,
                              content: updatedSections[i]?.content ?? s.content,
                              // Preserve teacherOnly from original — never let AI override it
                              teacherOnly: s.teacherOnly,
                            }));
                            const content = mergedSections.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join('\n\n');
                            const teacherContent = mergedSections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');
                            await updateWorksheet(selectedWs.id, { sections: mergedSections, content, teacherContent });
                            setSelectedWs({ ...selectedWs, sections: mergedSections, content, teacherContent });
                            setEditType('none');
                            setAiEditPrompt('');
                            toast.success('Worksheet updated with AI!');
                          } catch (err: any) {
                            const msg = err?.message || 'AI edit failed. Please try again.';
                            toast.error(msg.length < 120 ? msg : 'AI edit failed. Please try again.');
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

                {/* Worksheet content — WorksheetRenderer in view mode, editable sections in manual edit mode */}
                {editType === "manual" ? (
                  <div className="space-y-3">
                    {sections.map((section, i) => {
                      if (viewMode === "student" && section.teacherOnly) return null;
                      const currentContent = editedSections[i] !== undefined ? editedSections[i] : section.content;
                      const isTeacher = section.teacherOnly;
                      return (
                        <div key={i} className={`rounded-lg border p-3 ${isTeacher ? "bg-amber-50 border-amber-200" : "bg-card border-border/50"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                            {isTeacher && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Teacher</span>}
                          </div>
                          <Textarea
                            value={currentContent}
                            onChange={e => setEditedSections(prev => ({ ...prev, [i]: e.target.value }))}
                            className="text-sm font-mono min-h-[100px] resize-y"
                            placeholder="Enter section content…"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No content available — please regenerate this worksheet.</p>
                ) : (
                  /* Full WorksheetRenderer wrapped in an inline error boundary so that
                   * malformed section data or unexpected AI output cannot crash the dialog. */
                  <WorksheetErrorBoundary
                    onReset={() => { setSelectedWs(null); }}
                    resetLabel="Close worksheet"
                  >
                    <WorksheetRenderer
                      worksheet={toWorksheetData(selectedWs)}
                      viewMode={viewMode}
                      textSize={15}
                      overlayColor="transparent"
                      editedSections={editedSections}
                      editMode={false}
                      isRevisionMat={sections.some(s => s.type === "revision-mat-box" || s.type === "revision-mat-lo" || s.type === "revision-mat-title")}
                    />
                  </WorksheetErrorBoundary>
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

              {/* Story content — rendered as formatted HTML matching the Stories page */}
              {storyEditType === "manual" ? (
                <Textarea
                  value={editedStoryContent}
                  onChange={e => setEditedStoryContent(e.target.value)}
                  className="text-sm font-mono min-h-[300px] resize-y"
                />
              ) : (
                <div
                  className="prose prose-sm max-w-none rounded-lg border border-border/50 bg-card p-5 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: storyToHtml(selectedStory.content) }}
                />
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

      {/* ── Differentiation viewer dialog ── */}
      <Dialog open={!!selectedDiff} onOpenChange={open => { if (!open) setSelectedDiff(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">
              {selectedDiff?.subject ? selectedDiff.subject : "Differentiated Task"}
              {selectedDiff?.yearGroup ? ` — ${selectedDiff.yearGroup}` : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedDiff && (
            <div className="space-y-4 mt-1">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Original Task</p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedDiff.taskContent}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Differentiated Version</p>
                <div
                  className="prose prose-sm max-w-none rounded-lg border border-border/50 bg-card p-5 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: diffToHtml(selectedDiff.differentiatedContent) }}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAssignItem({ title: `Differentiated Task${selectedDiff.subject ? ` — ${selectedDiff.subject}` : ""} (${new Date(selectedDiff.createdAt).toLocaleDateString()})`, type: "differentiation", content: selectedDiff.differentiatedContent })}>
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Assign to Pupil
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Share Link dialog ── */}
      <Dialog open={!!shareToken} onOpenChange={open => { if (!open) { setShareToken(null); setShareCopied(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="w-4 h-4 text-brand" /> Share Worksheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">Anyone with this link can view the student-facing worksheet (teacher notes are hidden).</p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs font-mono text-muted-foreground truncate">
                {shareToken ? `${window.location.origin}/shared/${shareToken}` : "Generating…"}
              </div>
              <Button size="sm" onClick={copyShareLink} className="bg-brand hover:bg-brand/90 text-white shrink-0">
                {shareCopied ? <><Check className="w-3.5 h-3.5 mr-1" />Copied!</> : <><Link className="w-3.5 h-3.5 mr-1" />Copy</>}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Link does not expire. You can revoke it from the History page.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign to Student dialog ── */}
      <Dialog open={!!assignItem} onOpenChange={open => { if (!open) { setAssignItem(null); setAssignChildId(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Assign to Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Assigning: <span className="font-medium text-foreground">{assignItem?.title}</span></p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Select Student</label>
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students added yet. Go to the Pupils page first.</p>
              ) : (
                <Select value={assignChildId} onValueChange={setAssignChildId}>
                  <SelectTrigger><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                  <SelectContent>
                    {children.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — Year {c.yearGroup}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => { setAssignItem(null); setAssignChildId(""); }}>Cancel</Button>
              <Button size="sm" disabled={!assignChildId || assigning} onClick={handleAssign}>
                {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
