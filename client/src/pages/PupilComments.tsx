import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { pupils as pupilsApi } from "@/lib/api";
import { callAI } from "@/lib/ai";
import {
  MessageSquare, Plus, Trash2, Search, Filter, ThumbsUp, ThumbsDown,
  Minus, ShieldAlert, Database, User, Calendar, Sparkles, Loader2, X
} from "lucide-react";

interface Comment {
  id: string;
  pupil_id: string;
  pupil_name: string;
  year_group: string;
  type: "positive" | "negative" | "neutral" | "safeguarding";
  category: string;
  content: string;
  date: string;
  mis_source: string | null;
  created_at: string;
}

interface Pupil {
  id: string;
  name: string;
  year_group: string;
}

const TYPE_CONFIG = {
  positive: { label: "Positive", icon: ThumbsUp, color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  negative: { label: "Concern", icon: ThumbsDown, color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  neutral: { label: "Neutral", icon: Minus, color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
  safeguarding: { label: "Safeguarding", icon: ShieldAlert, color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
};

const CATEGORIES = ["Pastoral", "Academic", "Social", "Wellbeing", "Behaviour", "Attendance", "Medical", "Family", "Other"];

function getAuthHeader() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PupilComments() {
  const { user } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPupil, setFilterPupil] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  // Add comment dialog
  const [showAdd, setShowAdd] = useState(false);
  const [newPupilId, setNewPupilId] = useState("");
  const [newType, setNewType] = useState<string>("positive");
  const [newCategory, setNewCategory] = useState("Pastoral");
  const [newContent, setNewContent] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  // AI report generation
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [aiPupilName, setAiPupilName] = useState<string>("");

  const handleGenerateAI = async () => {
    const targetComments = filterPupil !== "all"
      ? comments.filter(c => c.pupil_id === filterPupil)
      : comments.slice(0, 20);
    if (targetComments.length === 0) {
      toast.error("No comments to analyse. Add some observations first.");
      return;
    }
    const pupilName = filterPupil !== "all"
      ? (pupils.find(p => p.id === filterPupil)?.name || "the pupil")
      : "pupils";
    setAiPupilName(pupilName);
    setAiLoading(true);
    setAiOutput(null);
    try {
      const commentList = targetComments.slice(0, 15)
        .map(c => `[${c.date} · ${c.type.toUpperCase()}] ${c.category}: ${c.content}`)
        .join("\n");
      const { text } = await callAI(
        `You are an expert SENCO writing professional school report comments and SEND observation analysis.
Produce two clearly labelled sections:

1. REPORT COMMENT (2–3 sentences, third-person, UK school report style, strengths-first, person-centred language)
2. SEND PATTERNS (bullet points identifying recurring themes, triggers, or areas of concern from the observations)

Be evidence-based, professional, and constructive. Never use a pupil's full name.`,
        `Pupil: ${pupilName}

Observations:
${commentList}`,
        600
      );
      setAiOutput(text);
    } catch {
      toast.error("AI generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [commentsRes, pupilsData] = await Promise.all([
        fetch("/api/mis/comments?limit=200", { headers: getAuthHeader() }),
        pupilsApi.list(),
      ]);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }
      setPupils(pupilsData || []);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    let c = comments;
    if (activeTab !== "all") c = c.filter(x => x.type === activeTab);
    if (filterPupil !== "all") c = c.filter(x => x.pupil_id === filterPupil);
    if (search) {
      const q = search.toLowerCase();
      c = c.filter(x => x.content.toLowerCase().includes(q) || x.pupil_name.toLowerCase().includes(q) || x.category.toLowerCase().includes(q));
    }
    return c;
  }, [comments, activeTab, filterPupil, search]);

  const counts = useMemo(() => ({
    all: comments.length,
    positive: comments.filter(c => c.type === "positive").length,
    negative: comments.filter(c => c.type === "negative").length,
    neutral: comments.filter(c => c.type === "neutral").length,
    safeguarding: comments.filter(c => c.type === "safeguarding").length,
  }), [comments]);

  const handleAdd = async () => {
    if (!newPupilId || !newContent.trim()) {
      toast.error("Please select a pupil and enter a comment");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/mis/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          pupilId: newPupilId,
          type: newType,
          category: newCategory,
          content: newContent.trim(),
          date: newDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Comment added");
      setShowAdd(false);
      setNewPupilId(""); setNewContent(""); setNewType("positive"); setNewCategory("Pastoral");
      setNewDate(new Date().toISOString().slice(0, 10));
      loadData();
    } catch {
      toast.error("Failed to save comment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/mis/comments/${id}`, { method: "DELETE", headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed");
      toast.success("Comment deleted");
      setComments(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const isAdmin = user?.role && ["school_admin", "senco", "mat_admin"].includes(user.role);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            Pupil Comments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pastoral notes, positive praise, concerns, and MIS-imported records
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateAI}
            size="sm"
            variant="outline"
            className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
            disabled={aiLoading || comments.length === 0}
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {filterPupil !== "all" ? "AI Report Comment" : "AI Analysis"}
          </Button>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Comment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["positive", "negative", "neutral", "safeguarding"] as const).map(type => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          return (
            <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(type)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg font-bold">{counts[type]}</div>
                  <div className="text-xs text-muted-foreground">{cfg.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Output Panel */}
      {aiOutput && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-violet-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Analysis — {aiPupilName}
            </p>
            <button onClick={() => setAiOutput(null)} className="text-violet-400 hover:text-violet-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-3 border border-violet-100">
            {aiOutput}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(aiOutput); toast.success("Copied to clipboard"); }}
            className="text-xs text-violet-600 hover:underline"
          >
            Copy to clipboard
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterPupil} onValueChange={setFilterPupil}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All pupils" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pupils</SelectItem>
            {pupils.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="positive" className="flex-1">Positive ({counts.positive})</TabsTrigger>
          <TabsTrigger value="negative" className="flex-1">Concerns ({counts.negative})</TabsTrigger>
          <TabsTrigger value="safeguarding" className="flex-1">Safeguarding ({counts.safeguarding})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-3 space-y-2">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading comments...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No comments found</p>
              <p className="text-xs mt-1">
                {comments.length === 0
                  ? "Sync your MIS or add a comment manually to get started"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            filtered.map((comment, i) => {
              const cfg = TYPE_CONFIG[comment.type] || TYPE_CONFIG.neutral;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-sm flex items-center gap-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                {comment.pupil_name}
                              </span>
                              {comment.year_group && (
                                <Badge variant="outline" className="text-xs py-0">{comment.year_group}</Badge>
                              )}
                              <Badge className={`text-xs py-0 border ${cfg.color}`}>{cfg.label}</Badge>
                              {comment.category && (
                                <Badge variant="secondary" className="text-xs py-0">{comment.category}</Badge>
                              )}
                              {comment.mis_source && (
                                <Badge variant="outline" className="text-xs py-0 gap-1 text-blue-700 border-blue-200 bg-blue-50">
                                  <Database className="w-2.5 h-2.5" />
                                  {comment.mis_source === "bromcom" ? "Bromcom" : "Arbor"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(comment.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 flex-shrink-0 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Add Comment Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Pupil Comment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Pupil *</Label>
              <Select value={newPupilId} onValueChange={setNewPupilId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a pupil..." />
                </SelectTrigger>
                <SelectContent>
                  {pupils.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.year_group ? `(${p.year_group})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Concern</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="safeguarding">Safeguarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Comment *</Label>
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Enter your comment or note here..."
                className="mt-1 min-h-[100px]"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">{newContent.length}/2000</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAdd} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Comment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
