/**
 * Daily Briefing & Debrief
 * - Dropdown calendar date picker (defaults to today)
 * - Full-page split: Morning Briefing (left) | Afternoon Debrief (right)
 * - General Notes section below
 * - File attachments (PDF, Word, images) per entry
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import {
  ChevronLeft, ChevronRight, Plus, Edit3, Trash2,
  Sun, Moon, FileText, RefreshCw, Clock, User,
  Calendar, Paperclip, Download, X, Upload,
} from "lucide-react";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function formatDate(d: Date): string { return d.toISOString().slice(0, 10); }
function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Attachment { idx: number; name: string; size: number; type: string; downloadUrl: string; }
interface BriefingEntry {
  id: string; date: string;
  type: "briefing" | "debrief" | "note";
  title: string; content: string;
  author_name: string; created_at: string; updated_at: string;
  attachments?: Attachment[];
}

const TYPE_CONFIG = {
  briefing: {
    label: "Morning Briefing", icon: Sun,
    headerBg: "bg-amber-500", panelBg: "bg-amber-50/40",
    border: "border-amber-200", badge: "bg-amber-100 text-amber-800",
  },
  debrief: {
    label: "Afternoon Debrief", icon: Moon,
    headerBg: "bg-indigo-500", panelBg: "bg-indigo-50/40",
    border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-800",
  },
  note: {
    label: "General Note", icon: FileText,
    headerBg: "bg-slate-500", panelBg: "bg-slate-50/40",
    border: "border-slate-200", badge: "bg-slate-100 text-slate-700",
  },
};

// ── Dropdown Calendar Popover ─────────────────────────────────────────────────
function CalendarDropdown({ selectedDate, onSelect, activeDates }: {
  selectedDate: string;
  onSelect: (d: string) => void;
  activeDates: string[];
}) {
  const today = formatDate(new Date());
  const [open, setOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => parseInt(selectedDate.slice(0, 4)));
  const [calMonth, setCalMonth] = useState(() => parseInt(selectedDate.slice(5, 7)) - 1);

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7;
  const calDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };
  const toDateStr = (day: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-semibold text-sm h-9 min-w-[160px] justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {selectedDate === today ? "Today" : formatShortDate(selectedDate)}
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 rotate-90" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold">{formatMonth(calYear, calMonth)}</span>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {calDays.map((day, i) => {
            if (!day) return <div key={i} className="w-8 h-8" />;
            const ds = toDateStr(day);
            const isSel = ds === selectedDate;
            const isTod = ds === today;
            const hasEnt = activeDates.includes(ds);
            return (
              <div key={i} className="flex flex-col items-center">
                <button onClick={() => { onSelect(ds); setOpen(false); }}
                  className={`w-8 h-8 rounded-full text-xs font-medium flex flex-col items-center justify-center relative transition-colors
                    ${isSel ? "bg-brand text-white" : isTod ? "bg-brand/10 text-brand font-bold" : "hover:bg-muted text-foreground"}`}>
                  {day}
                  {hasEnt && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSel ? "bg-white" : "bg-brand"}`} />}
                </button>
              </div>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs"
          onClick={() => { const n = new Date(); setCalYear(n.getFullYear()); setCalMonth(n.getMonth()); onSelect(today); setOpen(false); }}>
          Jump to Today
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// ── Single entry card ─────────────────────────────────────────────────────────
function EntryCard({ entry, canEdit, onEdit, onDelete, deleting }: {
  entry: BriefingEntry; canEdit: boolean;
  onEdit: () => void; onDelete: () => void; deleting: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 border-b border-border/40 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-sm text-foreground leading-tight">{entry.title}</p>
        {canEdit && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} disabled={deleting}
              className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
              {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-3">{entry.content}</p>
      {(entry.attachments?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {entry.attachments!.map((att, i) => (
            <a key={i} href={att.downloadUrl} download={att.name}
              className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors">
              <Paperclip className="w-3 h-3 text-muted-foreground" />
              <span className="max-w-[120px] truncate">{att.name}</span>
              <span className="text-muted-foreground">({formatFileSize(att.size)})</span>
              <Download className="w-3 h-3 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><User className="w-3 h-3" />{entry.author_name}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(entry.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

// ── Panel (one column) ────────────────────────────────────────────────────────
function BriefingPanel({ type, entries, canWrite, isAdmin, userName, onEdit, onDelete, onAdd, deleting }: {
  type: "briefing" | "debrief" | "note";
  entries: BriefingEntry[];
  canWrite: boolean; isAdmin: boolean; userName: string;
  onEdit: (e: BriefingEntry) => void;
  onDelete: (id: string) => void;
  onAdd: (type: "briefing" | "debrief" | "note") => void;
  deleting: string | null;
}) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl overflow-hidden border border-border/50">
      <div className={`${cfg.headerBg} text-white px-4 py-3 flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-bold text-sm">{cfg.label}</span>
          {entries.length > 0 && (
            <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{entries.length}</span>
          )}
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => onAdd(type)}
            className="bg-white/20 hover:bg-white/30 text-white border-0 h-7 text-xs gap-1 px-2.5">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        )}
      </div>
      <div className={`flex-1 overflow-y-auto ${cfg.panelBg}`}>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <Icon className="w-10 h-10 text-muted-foreground/25 mb-3" />
            <p className="text-sm text-muted-foreground">No {cfg.label.toLowerCase()} yet</p>
            {canWrite && (
              <Button size="sm" variant="outline" className="mt-3 text-xs gap-1" onClick={() => onAdd(type)}>
                <Plus className="w-3.5 h-3.5" /> Add {cfg.label}
              </Button>
            )}
          </div>
        ) : (
          <div>
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry}
                canEdit={canWrite && (entry.author_name === userName || isAdmin)}
                onEdit={() => onEdit(entry)}
                onDelete={() => onDelete(entry.id)}
                deleting={deleting === entry.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DailyBriefing() {
  const { user } = useApp();
  const isAdmin = ["school_admin", "mat_admin", "admin", "super_admin"].includes(user?.role || "");
  const canWrite = ["school_admin", "mat_admin", "admin", "super_admin", "senco", "teacher"].includes(user?.role || "");
  const userName = user?.displayName || user?.email || "";
  const today = formatDate(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<BriefingEntry[]>([]);
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<BriefingEntry | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState<"briefing" | "debrief" | "note">("briefing");
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEntries = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/briefing?date=${date}`, { headers: getAuthHeader() });
      if (res.ok) setEntries(await res.json());
    } catch { toast.error("Failed to load entries"); }
    setLoading(false);
  }, []);

  const fetchActiveDates = useCallback(async (date: string) => {
    const months = new Set<string>();
    const d = new Date(date + "T12:00:00");
    for (let offset = -1; offset <= 1; offset++) {
      const m = new Date(d.getFullYear(), d.getMonth() + offset, 1);
      months.add(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
    }
    const results: string[] = [];
    for (const month of months) {
      try {
        const res = await fetch(`/api/briefing/dates?month=${month}`, { headers: getAuthHeader() });
        if (res.ok) results.push(...await res.json());
      } catch {}
    }
    setActiveDates(results);
  }, []);

  useEffect(() => { fetchEntries(selectedDate); }, [selectedDate, fetchEntries]);
  useEffect(() => { fetchActiveDates(selectedDate); }, [selectedDate, fetchActiveDates]);

  const briefingEntries = entries.filter(e => e.type === "briefing");
  const debriefEntries = entries.filter(e => e.type === "debrief");
  const noteEntries = entries.filter(e => e.type === "note");

  const openCreate = (type: "briefing" | "debrief" | "note" = "briefing") => {
    setEditEntry(null); setFormTitle(""); setFormContent(""); setFormType(type); setFormFiles([]);
    setShowForm(true);
  };
  const openEdit = (entry: BriefingEntry) => {
    setEditEntry(entry); setFormTitle(entry.title); setFormContent(entry.content); setFormType(entry.type); setFormFiles([]);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Title is required"); return; }
    if (!formContent.trim()) { toast.error("Content is required"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", formTitle.trim());
      fd.append("content", formContent.trim());
      fd.append("type", formType);
      if (!editEntry) fd.append("date", selectedDate);
      formFiles.forEach(f => fd.append("files", f));

      const method = editEntry ? "PUT" : "POST";
      const url = editEntry ? `/api/briefing/${editEntry.id}` : "/api/briefing";
      const res = await fetch(url, { method, headers: getAuthHeader(), body: fd });
      if (res.ok) {
        toast.success(editEntry ? "Entry updated" : "Entry added");
        setShowForm(false);
        await fetchEntries(selectedDate);
        await fetchActiveDates(selectedDate);
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
        await fetchActiveDates(selectedDate);
      } else { const d = await res.json(); toast.error(d.error || "Failed to delete"); }
    } catch { toast.error("Network error"); }
    setDeleting(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 flex-shrink-0 bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Daily Briefing</h2>
          <CalendarDropdown selectedDate={selectedDate} onSelect={setSelectedDate} activeDates={activeDates} />
          {selectedDate === today && <Badge className="bg-brand/10 text-brand border-0 text-xs">Today</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground hidden md:block">{formatDisplayDate(selectedDate)}</p>
          {canWrite && (
            <Button size="sm" className="bg-brand hover:bg-brand/90 text-white gap-1" onClick={() => openCreate("briefing")}>
              <Plus className="w-4 h-4" /> Add Entry
            </Button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="flex flex-col h-full gap-3">
            {/* Split: Morning Briefing | Afternoon Debrief */}
            <div className="flex gap-3 flex-1 min-h-0">
              <div className="flex-1 min-h-0">
                <BriefingPanel type="briefing" entries={briefingEntries}
                  canWrite={canWrite} isAdmin={isAdmin} userName={userName}
                  onEdit={openEdit} onDelete={handleDelete} onAdd={openCreate} deleting={deleting} />
              </div>
              <div className="flex-1 min-h-0">
                <BriefingPanel type="debrief" entries={debriefEntries}
                  canWrite={canWrite} isAdmin={isAdmin} userName={userName}
                  onEdit={openEdit} onDelete={handleDelete} onAdd={openCreate} deleting={deleting} />
              </div>
            </div>

            {/* General Notes — compact strip below */}
            {(noteEntries.length > 0 || canWrite) && (
              <div className="flex-shrink-0" style={{ maxHeight: "220px" }}>
                <BriefingPanel type="note" entries={noteEntries}
                  canWrite={canWrite} isAdmin={isAdmin} userName={userName}
                  onEdit={openEdit} onDelete={handleDelete} onAdd={openCreate} deleting={deleting} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              {editEntry ? "Edit Entry" : `Add Entry — ${formatShortDate(selectedDate)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type</Label>
              <Select value={formType} onValueChange={v => setFormType(v as any)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="briefing">☀️ Morning Briefing</SelectItem>
                  <SelectItem value="debrief">🌙 Afternoon Debrief</SelectItem>
                  <SelectItem value="note">📝 General Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Title *</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Monday Morning Briefing…" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes *</Label>
              <Textarea value={formContent} onChange={e => setFormContent(e.target.value)}
                placeholder="Enter notes, key points, actions, reminders…"
                rows={7} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Attachments (PDF, Word, images — max 5)</Label>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" multiple
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.pptx"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setFormFiles(prev => [...prev, ...files].slice(0, 5));
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="hidden" id="briefing-file-upload" />
                <label htmlFor="briefing-file-upload">
                  <Button asChild variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                    <span><Upload className="w-3.5 h-3.5" /> Attach Files</span>
                  </Button>
                </label>
                <span className="text-xs text-muted-foreground">{formFiles.length}/5</span>
              </div>
              {formFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {formFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs">
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                      <span className="max-w-[120px] truncate">{f.name}</span>
                      <button onClick={() => setFormFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-red-500 transition-colors ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button className="w-full bg-brand hover:bg-brand/90 text-white" onClick={handleSave} disabled={saving}>
              {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</> : editEntry ? "Update Entry" : "Add Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
