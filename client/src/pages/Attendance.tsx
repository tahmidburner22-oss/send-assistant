import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useApp, type AttendanceRecord, type AttendanceStatus } from "@/contexts/AppContext";
import { sendNeeds } from "@/lib/send-data";
import {
  CalendarDays, CheckCircle2, XCircle, MinusCircle, ChevronLeft, ChevronRight,
  Users, TrendingUp, Download, Sun, Sunset, AlertCircle, Save, Database, Clock, HelpCircle
} from "lucide-react";

const ABSENCE_REASONS = [
  "Illness",
  "Medical appointment",
  "Family bereavement",
  "Holiday (authorised)",
  "Holiday (unauthorised)",
  "Excluded",
  "Persistent absence",
  "Transport issues",
  "Other (see notes)",
];

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}
function parseDate(s: string) {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}
function displayDate(s: string) {
  return parseDate(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function weekDates(baseDate: Date): string[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatDate(d);
  });
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  if (status === "attended") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
      <CheckCircle2 className="h-3 w-3" />Present
    </span>
  );
  if (status === "absent") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
      <XCircle className="h-3 w-3" />Absent
    </span>
  );
  if (status === "late") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
      <Clock className="h-3 w-3" />Late
    </span>
  );
  if (status === "other") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
      <HelpCircle className="h-3 w-3" />Other
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
      <MinusCircle className="h-3 w-3" />—
    </span>
  );
}

interface SessionInputProps {
  label: string;
  icon: React.ReactNode;
  status: AttendanceStatus;
  reason: string;
  onStatusChange: (s: AttendanceStatus) => void;
  onReasonChange: (r: string) => void;
}
function SessionInput({ label, icon, status, reason, onStatusChange, onReasonChange }: SessionInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {icon}{label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onStatusChange("attended")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
            status === "attended"
              ? "bg-green-500 text-white border-green-500 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />Present
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("absent")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
            status === "absent"
              ? "bg-red-500 text-white border-red-500 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:bg-red-50"
          }`}
        >
          <XCircle className="h-4 w-4" />Absent
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("late")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
            status === "late"
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50"
          }`}
        >
          <Clock className="h-4 w-4" />Late
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("other")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
            status === "other"
              ? "bg-purple-500 text-white border-purple-500 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
          }`}
        >
          <HelpCircle className="h-4 w-4" />Other
        </button>
      </div>
      {(status === "absent" || status === "late" || status === "other") && (
        <Select value={reason} onValueChange={onReasonChange}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder={status === "late" ? "Select reason for lateness..." : status === "other" ? "Select reason..." : "Select reason for absence..."} />
          </SelectTrigger>
          <SelectContent>
            {ABSENCE_REASONS.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default function Attendance() {
  const { children, attendanceRecords, saveAttendance, user } = useApp();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [weekBase, setWeekBase] = useState(new Date());
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [selectedChildHistory, setSelectedChildHistory] = useState<string | null>(null);

  // Form state for editing
  const [formAm, setFormAm] = useState<AttendanceStatus>("not-recorded");
  const [formAmReason, setFormAmReason] = useState("");
  const [formPm, setFormPm] = useState<AttendanceStatus>("not-recorded");
  const [formPmReason, setFormPmReason] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const dates = weekDates(weekBase);

  const getRecord = (childId: string, date: string) =>
    attendanceRecords.find(r => r.childId === childId && r.date === date);

  const openEdit = (childId: string) => {
    const rec = getRecord(childId, selectedDate);
    setFormAm(rec?.amStatus ?? "not-recorded");
    setFormAmReason(rec?.amReason ?? "");
    setFormPm(rec?.pmStatus ?? "not-recorded");
    setFormPmReason(rec?.pmReason ?? "");
    setFormNotes(rec?.notes ?? "");
    setEditingChild(childId);
  };

  const handleSave = () => {
    if (!editingChild || !user) return;
    saveAttendance({
      childId: editingChild,
      date: selectedDate,
      amStatus: formAm,
      amReason: (formAm === "absent" || formAm === "late" || formAm === "other") ? formAmReason : undefined,
      pmStatus: formPm,
      pmReason: (formPm === "absent" || formPm === "late" || formPm === "other") ? formPmReason : undefined,
      notes: formNotes || undefined,
      recordedBy: user.displayName,
    });
    setEditingChild(null);
    toast.success("Attendance saved!");
  };

  // Stats for selected date
  const dateStats = useMemo(() => {
    const total = children.length;
    const amPresent = children.filter(c => getRecord(c.id, selectedDate)?.amStatus === "attended").length;
    const pmPresent = children.filter(c => getRecord(c.id, selectedDate)?.pmStatus === "attended").length;
    const amAbsent = children.filter(c => getRecord(c.id, selectedDate)?.amStatus === "absent").length;
    const pmAbsent = children.filter(c => getRecord(c.id, selectedDate)?.pmStatus === "absent").length;
    return { total, amPresent, pmPresent, amAbsent, pmAbsent };
  }, [children, attendanceRecords, selectedDate]);

  // Child history
  const childHistory = useMemo(() => {
    if (!selectedChildHistory) return [];
    return attendanceRecords
      .filter(r => r.childId === selectedChildHistory)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  }, [attendanceRecords, selectedChildHistory]);

  const historyChild = children.find(c => c.id === selectedChildHistory);

  // Export CSV
  const exportCsv = () => {
    const rows = [["Date", "Child", "AM Status", "AM Reason", "PM Status", "PM Reason", "Notes", "Recorded By"]];
    attendanceRecords.forEach(r => {
      const child = children.find(c => c.id === r.childId);
      rows.push([r.date, child?.name ?? r.childId, r.amStatus, r.amReason ?? "", r.pmStatus, r.pmReason ?? "", r.notes ?? "", r.recordedBy]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "attendance.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance exported!");
  };

  if (children.length === 0) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-xl font-bold mb-2">No Students Yet</h2>
        <p className="text-muted-foreground text-sm">Add students from the Pupils page before logging attendance.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Attendance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">AM &amp; PM register for your class</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "AM Present", value: dateStats.amPresent, total: dateStats.total, color: "text-green-600", bg: "bg-green-50" },
          { label: "AM Absent", value: dateStats.amAbsent, total: dateStats.total, color: "text-red-600", bg: "bg-red-50" },
          { label: "PM Present", value: dateStats.pmPresent, total: dateStats.total, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "PM Absent", value: dateStats.pmAbsent, total: dateStats.total, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}<span className="text-sm font-normal text-muted-foreground">/{s.total}</span></div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Date selector */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={() => {
                const d = parseDate(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(formatDate(d));
                setWeekBase(d);
              }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setWeekBase(parseDate(e.target.value)); }}
                className="w-40 text-sm"
              />
              <button onClick={() => {
                const d = parseDate(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(formatDate(d));
                setWeekBase(d);
              }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setSelectedDate(formatDate(new Date())); setWeekBase(new Date()); }}>
              Today
            </Button>
            <span className="text-sm text-muted-foreground">{displayDate(selectedDate)}</span>
          </div>

          {/* Week view mini-calendar */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {dates.map(d => {
              const amPresent = children.filter(c => getRecord(c.id, d)?.amStatus === "attended").length;
              const amAbsent = children.filter(c => getRecord(c.id, d)?.amStatus === "absent").length;
              const isSelected = d === selectedDate;
              const isToday = d === formatDate(new Date());
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`flex-1 min-w-[52px] p-2 rounded-lg text-center transition-all border ${
                    isSelected ? "bg-brand text-white border-brand shadow-sm" :
                    isToday ? "border-brand/40 bg-brand-light" : "border-border/50 hover:bg-muted"
                  }`}
                >
                  <div className="text-[10px] font-medium uppercase">{parseDate(d).toLocaleDateString("en-GB", { weekday: "short" })}</div>
                  <div className={`text-sm font-bold ${isSelected ? "text-white" : ""}`}>{parseDate(d).getDate()}</div>
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {amPresent > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
                    {amAbsent > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Student register table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Register — {displayDate(selectedDate)}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {children.map(child => {
              const rec = getRecord(child.id, selectedDate);
              return (
                <div key={child.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                    <span className="text-brand font-semibold text-sm">{child.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{child.name}</div>
                    <div className="text-xs text-muted-foreground">{child.yearGroup} · {(child.sendNeeds && child.sendNeeds.length > 0 ? child.sendNeeds : child.sendNeed ? [child.sendNeed] : []).map((id: string) => sendNeeds.find(n => n.id === id)?.name || id).join(', ') || 'No SEND need'}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Sun className="h-2.5 w-2.5" />AM</div>
                      <StatusBadge status={rec?.amStatus ?? "not-recorded"} />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Sunset className="h-2.5 w-2.5" />PM</div>
                      <StatusBadge status={rec?.pmStatus ?? "not-recorded"} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => openEdit(child.id)}
                    >
                      {rec ? "Edit" : "Mark"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-muted-foreground"
                      onClick={() => setSelectedChildHistory(child.id)}
                    >
                      History
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mark attendance dialog */}
      <Dialog open={!!editingChild} onOpenChange={open => !open && setEditingChild(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand" />
              Mark Attendance
            </DialogTitle>
          </DialogHeader>
          {editingChild && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{children.find(c => c.id === editingChild)?.name}</p>
                <p className="text-xs text-muted-foreground">{displayDate(selectedDate)}</p>
              </div>
              <SessionInput
                label="AM Session"
                icon={<Sun className="h-3.5 w-3.5 text-amber-500" />}
                status={formAm}
                reason={formAmReason}
                onStatusChange={setFormAm}
                onReasonChange={setFormAmReason}
              />
              <SessionInput
                label="PM Session"
                icon={<Sunset className="h-3.5 w-3.5 text-orange-500" />}
                status={formPm}
                reason={formPmReason}
                onStatusChange={setFormPm}
                onReasonChange={setFormPmReason}
              />
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Additional Notes (optional)</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-brand hover:bg-brand/90 text-white" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1.5" />Save Attendance
                </Button>
                <Button variant="outline" onClick={() => setEditingChild(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Child history dialog */}
      <Dialog open={!!selectedChildHistory} onOpenChange={open => !open && setSelectedChildHistory(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              Attendance History — {historyChild?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedChildHistory && (
            <div className="space-y-3">
              {/* Summary stats */}
              {(() => {
                const recs = attendanceRecords.filter(r => r.childId === selectedChildHistory);
                const total = recs.length;
                const amPresent = recs.filter(r => r.amStatus === "attended").length;
                const pmPresent = recs.filter(r => r.pmStatus === "attended").length;
                const amPct = total > 0 ? Math.round((amPresent / total) * 100) : 0;
                const pmPct = total > 0 ? Math.round((pmPresent / total) * 100) : 0;
                return (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold text-foreground">{total}</div>
                      <div className="text-xs text-muted-foreground">Days recorded</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{amPct}%</div>
                      <div className="text-xs text-muted-foreground">AM attendance</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">{pmPct}%</div>
                      <div className="text-xs text-muted-foreground">PM attendance</div>
                    </div>
                  </div>
                );
              })()}
              {/* Records list */}
              {childHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet.</p>
              ) : (
                <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
                  {childHistory.map(rec => (
                    <div key={rec.id} className="px-3 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{displayDate(rec.date)}</div>
                        {(rec.amReason || rec.pmReason) && (
                          <div className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {rec.amReason && <span>AM: {rec.amReason}</span>}
                            {rec.amReason && rec.pmReason && <span>·</span>}
                            {rec.pmReason && <span>PM: {rec.pmReason}</span>}
                          </div>
                        )}
                        {rec.notes && <div className="text-xs text-muted-foreground mt-0.5">{rec.notes}</div>}
                        {rec.misSource && (
                          <div className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-0.5 w-fit">
                            <Database className="w-2.5 h-2.5" />
                            {rec.misSource === "bromcom" ? "Bromcom" : "Arbor"}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-[9px] text-muted-foreground mb-0.5">AM</div>
                          <StatusBadge status={rec.amStatus} />
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-muted-foreground mb-0.5">PM</div>
                          <StatusBadge status={rec.pmStatus} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
