import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import {
  ChevronLeft, ChevronRight, Plus, Edit3, Trash2, Calendar,
  Sun, Moon, FileText, RefreshCw, Clock, User,
} from "lucide-react";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

const TYPE_CONFIG = {
  briefing: { label: "Morning Briefing", icon: Sun, color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-400" },
  debrief: { label: "End of Day Debrief", icon: Moon, color: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-400" },
  note: { label: "General Note", icon: FileText, color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
};

interface BriefingEntry {
  id: string;
  date: string;
  type: "briefing" | "debrief" | "note";
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export default function DailyBriefing() {
  const { user } = useApp();
  const isAdmin = ["school_admin", "mat_admin", "admin", "super_admin"].includes(user?.role || "");
  const canWrite = ["school_admin", "mat_admin", "admin", "super_admin", "senco", "teacher"].includes(user?.role || "");

  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<BriefingEntry[]>([]);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<BriefingEntry | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState<"briefing" | "debrief" | "note">("briefing");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchEntries = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/briefing?date=${date}`, { headers: getAuthHeader() });
      if (res.ok) setEntries(await res.json());
    } catch { toast.error("Failed to load entries"); }
    setLoading(false);
  }, []);

  const fetchActiveDates = useCallback(async (year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/briefing/dates?month=${monthStr}`, { headers: getAuthHeader() });
      if (res.ok) setActiveDates(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchEntries(selectedDate); }, [selectedDate, fetchEntries]);
  useEffect(() => { fetchActiveDates(calYear, calMonth); }, [calYear, calMonth, fetchActiveDates]);

  const openCreate = () => {
    setEditEntry(null);
    setFormTitle("");
    setFormContent("");
    setFormType("briefing");
    setShowForm(true);
  };

  const openEdit = (entry: BriefingEntry) => {
    setEditEntry(entry);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormType(entry.type);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Title is required"); return; }
    if (!formContent.trim()) { toast.error("Content is required"); return; }
    setSaving(true);
    try {
      const method = editEntry ? "PUT" : "POST";
      const url = editEntry ? `/api/briefing/${editEntry.id}` : "/api/briefing";
      const body = editEntry
        ? { title: formTitle, content: formContent, type: formType }
        : { date: selectedDate, title: formTitle, content: formContent, type: formType };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editEntry ? "Entry updated" : "Entry added");
        setShowForm(false);
        await fetchEntries(selectedDate);
        await fetchActiveDates(calYear, calMonth);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to save");
      }
    } catch { toast.error("Network error"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/briefing/${id}`, { method: "DELETE", headers: getAuthHeader() });
      if (res.ok) {
        toast.success("Entry deleted");
        await fetchEntries(selectedDate);
        await fetchActiveDates(calYear, calMonth);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to delete");
      }
    } catch { toast.error("Network error"); }
    setDeleting(null);
  };

  // ── Calendar rendering ────────────────────────────────────────────────────────
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  // Shift so Monday = 0
  const startOffset = (firstDayOfWeek + 6) % 7;
  const calDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const d = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(d);
  };

  const isToday = (day: number) => {
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === today;
  };

  const isSelected = (day: number) => {
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === selectedDate;
  };

  const hasEntries = (day: number) => {
    const d = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return activeDates.includes(d);
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">Daily Briefing & Debrief</h2>
        <p className="text-sm text-muted-foreground mt-1">School-wide notes, briefings, and debriefs — visible to all staff.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
        {/* ── Calendar ── */}
        <div className="space-y-3">
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-semibold">{formatMonth(calYear, calMonth)}</span>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {calDays.map((day, i) => (
                  <div key={i} className="flex flex-col items-center">
                    {day ? (
                      <button
                        onClick={() => selectDay(day)}
                        className={`w-8 h-8 rounded-full text-xs font-medium flex flex-col items-center justify-center relative transition-colors
                          ${isSelected(day) ? "bg-brand text-white" : isToday(day) ? "bg-brand/10 text-brand font-bold" : "hover:bg-muted text-foreground"}`}
                      >
                        {day}
                        {hasEntries(day) && (
                          <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected(day) ? "bg-white" : "bg-brand"}`} />
                        )}
                      </button>
                    ) : <div className="w-8 h-8" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Jump to today */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              const n = new Date();
              setCalYear(n.getFullYear());
              setCalMonth(n.getMonth());
              setSelectedDate(today);
            }}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />Jump to Today
          </Button>
        </div>

        {/* ── Entries panel ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{formatDisplayDate(selectedDate)}</p>
              {selectedDate === today && <Badge className="bg-brand/10 text-brand border-0 text-xs mt-0.5">Today</Badge>}
            </div>
            {canWrite && (
              <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" /> Add Entry
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : entries.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No entries for this date</p>
                {canWrite && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Click <strong>Add Entry</strong> to create a briefing or note.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => {
                const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.note;
                const Icon = cfg.icon;
                const canEdit = canWrite && (entry.author_name === user?.displayName || isAdmin);
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-border/50">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-xs border ${cfg.color} gap-1`}>
                              <Icon className="w-3 h-3" />{cfg.label}
                            </Badge>
                            <span className="text-sm font-semibold">{entry.title}</span>
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}><Edit3 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(entry.id)} disabled={deleting === entry.id}>
                                {deleting === entry.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{entry.author_name}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              {editEntry ? "Edit Entry" : `Add Entry — ${formatDisplayDate(selectedDate)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type</Label>
              <Select value={formType} onValueChange={v => setFormType(v as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="briefing">Morning Briefing</SelectItem>
                  <SelectItem value="debrief">End of Day Debrief</SelectItem>
                  <SelectItem value="note">General Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Title *</Label>
              <Input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Monday Morning Briefing, Fire Drill Notes..."
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Content *</Label>
              <Textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Enter notes, key points, actions, reminders..."
                rows={6}
                className="resize-none"
              />
            </div>
            <Button
              className="w-full bg-brand hover:bg-brand/90 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editEntry ? "Update Entry" : "Add Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
