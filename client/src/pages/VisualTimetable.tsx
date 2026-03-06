import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Download, Printer, GripVertical, Clock, Calendar,
  BookOpen, Calculator, FlaskConical, Palette, Music, Dumbbell,
  Monitor, Utensils, Coffee, Sun, Moon, Star, Heart, Smile,
  ChevronUp, ChevronDown, Edit3, Copy
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, { icon: any; color: string; emoji: string }> = {
  english: { icon: BookOpen, color: "#10b981", emoji: "📖" },
  maths: { icon: Calculator, color: "#3b82f6", emoji: "🔢" },
  science: { icon: FlaskConical, color: "#8b5cf6", emoji: "🔬" },
  art: { icon: Palette, color: "#f59e0b", emoji: "🎨" },
  music: { icon: Music, color: "#ec4899", emoji: "🎵" },
  pe: { icon: Dumbbell, color: "#ef4444", emoji: "⚽" },
  computing: { icon: Monitor, color: "#06b6d4", emoji: "💻" },
  lunch: { icon: Utensils, color: "#f97316", emoji: "🍽️" },
  break: { icon: Coffee, color: "#84cc16", emoji: "☕" },
  assembly: { icon: Star, color: "#eab308", emoji: "⭐" },
  reading: { icon: BookOpen, color: "#6366f1", emoji: "📚" },
  morning: { icon: Sun, color: "#f59e0b", emoji: "🌅" },
  afternoon: { icon: Moon, color: "#8b5cf6", emoji: "🌙" },
  reward: { icon: Heart, color: "#ec4899", emoji: "❤️" },
  calm: { icon: Smile, color: "#10b981", emoji: "😊" },
  custom: { icon: Star, color: "#6b7280", emoji: "⭐" },
};

const PRESET_ACTIVITIES = [
  "English", "Maths", "Science", "Art", "Music", "PE", "Computing",
  "History", "Geography", "RE", "PSHE", "MFL", "DT", "Drama",
  "Lunch", "Break", "Assembly", "Reading", "Morning Work", "Afternoon",
  "Reward Time", "Calm Time", "Circle Time", "Sensory Break"
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SYMBOL_STYLES = ["emoji", "colour-block", "minimal"];

interface TimetableSlot {
  id: string;
  activity: string;
  time?: string;
  duration?: string;
  icon: string;
  color: string;
  emoji: string;
  notes?: string;
}

interface DaySchedule {
  day: string;
  slots: TimetableSlot[];
}

function getIconKey(activity: string): string {
  const lower = activity.toLowerCase();
  for (const key of Object.keys(ACTIVITY_ICONS)) {
    if (lower.includes(key)) return key;
  }
  return "custom";
}

export default function VisualTimetable() {
  const [studentName, setStudentName] = useState("");
  const [weekOf, setWeekOf] = useState("");
  const [symbolStyle, setSymbolStyle] = useState("emoji");
  const [fontSize, setFontSize] = useState("medium");
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({ day, slots: [] }))
  );
  const [showAddSlot, setShowAddSlot] = useState<string | null>(null); // day name
  const [newActivity, setNewActivity] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [newNotes, setNewNotes] = useState("");
  const [editSlot, setEditSlot] = useState<{ dayIndex: number; slot: TimetableSlot } | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState("Monday");

  const addSlot = (dayName: string) => {
    if (!newActivity.trim()) { toast.error("Please enter an activity name."); return; }
    const iconKey = getIconKey(newActivity);
    const iconData = ACTIVITY_ICONS[iconKey];
    const slot: TimetableSlot = {
      id: Date.now().toString(),
      activity: newActivity,
      time: newTime,
      duration: newDuration,
      icon: iconKey,
      color: iconData.color,
      emoji: iconData.emoji,
      notes: newNotes,
    };
    setSchedule(prev => prev.map(d => d.day === dayName ? { ...d, slots: [...d.slots, slot] } : d));
    setNewActivity(""); setNewTime(""); setNewDuration("30"); setNewNotes("");
    setShowAddSlot(null);
    toast.success("Activity added!");
  };

  const removeSlot = (dayName: string, slotId: string) => {
    setSchedule(prev => prev.map(d => d.day === dayName ? { ...d, slots: d.slots.filter(s => s.id !== slotId) } : d));
  };

  const moveSlot = (dayName: string, slotId: string, direction: "up" | "down") => {
    setSchedule(prev => prev.map(d => {
      if (d.day !== dayName) return d;
      const idx = d.slots.findIndex(s => s.id === slotId);
      if (direction === "up" && idx === 0) return d;
      if (direction === "down" && idx === d.slots.length - 1) return d;
      const newSlots = [...d.slots];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      [newSlots[idx], newSlots[swap]] = [newSlots[swap], newSlots[idx]];
      return { ...d, slots: newSlots };
    }));
  };

  const copyDayToAll = (dayName: string) => {
    const sourceDay = schedule.find(d => d.day === dayName);
    if (!sourceDay || sourceDay.slots.length === 0) { toast.error("No activities to copy."); return; }
    setSchedule(prev => prev.map(d => d.day === dayName ? d : {
      ...d, slots: sourceDay.slots.map(s => ({ ...s, id: `${d.day}-${Date.now()}-${Math.random()}` }))
    }));
    toast.success(`${dayName}'s schedule copied to all days!`);
  };

  const fontSizeClass = fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm";

  const handlePrint = () => {
    window.print();
  };

  const SlotCard = ({ slot, dayName, dayIndex }: { slot: TimetableSlot; dayName: string; dayIndex: number }) => {
    const iconData = ACTIVITY_ICONS[slot.icon] || ACTIVITY_ICONS.custom;
    const Icon = iconData.icon;
    return (
      <div
        className="flex items-center gap-2 p-2 rounded-lg border border-border/50 group hover:border-brand/30 transition-all"
        style={{ borderLeftWidth: 3, borderLeftColor: slot.color }}
      >
        {symbolStyle === "emoji" && (
          <span className="text-xl flex-shrink-0">{slot.emoji}</span>
        )}
        {symbolStyle === "colour-block" && (
          <div className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: slot.color + "20" }}>
            <Icon className="w-4 h-4" style={{ color: slot.color }} />
          </div>
        )}
        {symbolStyle === "minimal" && (
          <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: slot.color }} />
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-foreground truncate ${fontSizeClass}`}>{slot.activity}</div>
          {(slot.time || slot.duration) && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {slot.time && <span>{slot.time}</span>}
              {slot.time && slot.duration && <span>·</span>}
              {slot.duration && <span>{slot.duration} min</span>}
            </div>
          )}
          {slot.notes && <div className="text-[10px] text-muted-foreground italic truncate">{slot.notes}</div>}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => moveSlot(dayName, slot.id, "up")} className="p-1 rounded hover:bg-muted">
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={() => moveSlot(dayName, slot.id, "down")} className="p-1 rounded hover:bg-muted">
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={() => removeSlot(dayName, slot.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" /> Visual Timetable Generator
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Create personalised visual timetables with symbols for SEND students.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Settings */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Student Initials</Label>
              <Input value={studentName} onChange={e => { if (e.target.value.length <= 4) setStudentName(e.target.value); }}
                placeholder="e.g. A.J." className="h-9 text-sm" maxLength={4} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Week Beginning</Label>
              <Input type="date" value={weekOf} onChange={e => setWeekOf(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Symbol Style</Label>
              <Select value={symbolStyle} onValueChange={setSymbolStyle}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emoji">Emoji Symbols</SelectItem>
                  <SelectItem value="colour-block">Colour Blocks</SelectItem>
                  <SelectItem value="minimal">Minimal (Colour Bar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Font Size</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large (VI/Dyslexia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("week")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "week" ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Week View
        </button>
        <button
          onClick={() => setViewMode("day")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "day" ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Day View
        </button>
        {viewMode === "day" && (
          <div className="flex gap-1 ml-2">
            {DAYS.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${selectedDay === d ? "bg-brand/20 text-brand" : "text-muted-foreground hover:bg-muted"}`}>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <div id="timetable-print-area">
        {/* Print header */}
        <div className="hidden print:block mb-4 text-center">
          <h1 className="text-2xl font-bold">Visual Timetable{studentName ? ` — ${studentName}` : ""}</h1>
          {weekOf && <p className="text-sm text-gray-600">Week beginning: {new Date(weekOf).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>}
        </div>

        {viewMode === "week" ? (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {schedule.map((daySchedule, dayIndex) => (
              <motion.div key={daySchedule.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.05 }}>
                <Card className="border-border/50 h-full">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-foreground">{daySchedule.day}</h3>
                      <div className="flex gap-1">
                        <button onClick={() => copyDayToAll(daySchedule.day)}
                          title="Copy to all days"
                          className="p-1 rounded hover:bg-muted text-muted-foreground">
                          <Copy className="w-3 h-3" />
                        </button>
                        <button onClick={() => setShowAddSlot(daySchedule.day)}
                          className="p-1 rounded hover:bg-brand/10 text-brand">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 min-h-[60px]">
                      {daySchedule.slots.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-3">No activities yet</p>
                      ) : daySchedule.slots.map(slot => (
                        <SlotCard key={slot.id} slot={slot} dayName={daySchedule.day} dayIndex={dayIndex} />
                      ))}
                    </div>
                    <button onClick={() => setShowAddSlot(daySchedule.day)}
                      className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-border/50 text-[11px] text-muted-foreground hover:border-brand/30 hover:text-brand transition-all flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3" /> Add Activity
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">{selectedDay}</h3>
                <Button size="sm" onClick={() => setShowAddSlot(selectedDay)} className="bg-brand hover:bg-brand/90 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add Activity
                </Button>
              </div>
              {(() => {
                const dayData = schedule.find(d => d.day === selectedDay);
                if (!dayData || dayData.slots.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-8">No activities yet. Click "Add Activity" to start.</p>;
                }
                return (
                  <div className="space-y-2">
                    {dayData.slots.map(slot => {
                      const iconData = ACTIVITY_ICONS[slot.icon] || ACTIVITY_ICONS.custom;
                      const Icon = iconData.icon;
                      return (
                        <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-brand/30 transition-all"
                          style={{ borderLeftWidth: 4, borderLeftColor: slot.color }}>
                          {symbolStyle === "emoji" && <span className="text-3xl">{slot.emoji}</span>}
                          {symbolStyle === "colour-block" && (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: slot.color + "20" }}>
                              <Icon className="w-6 h-6" style={{ color: slot.color }} />
                            </div>
                          )}
                          {symbolStyle === "minimal" && (
                            <div className="w-3 h-12 rounded-full" style={{ backgroundColor: slot.color }} />
                          )}
                          <div className="flex-1">
                            <div className={`font-bold text-foreground ${fontSize === "large" ? "text-xl" : fontSize === "small" ? "text-sm" : "text-base"}`}>{slot.activity}</div>
                            {(slot.time || slot.duration) && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {slot.time && <span>{slot.time}</span>}
                                {slot.time && slot.duration && <span>·</span>}
                                {slot.duration && <span>{slot.duration} minutes</span>}
                              </div>
                            )}
                            {slot.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{slot.notes}</div>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => moveSlot(selectedDay, slot.id, "up")} className="p-1.5 rounded hover:bg-muted">
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => moveSlot(selectedDay, slot.id, "down")} className="p-1.5 rounded hover:bg-muted">
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => removeSlot(selectedDay, slot.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Slot Dialog */}
      <Dialog open={!!showAddSlot} onOpenChange={() => setShowAddSlot(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-brand" /> Add Activity — {showAddSlot}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Activity Name *</Label>
              <Input value={newActivity} onChange={e => setNewActivity(e.target.value)} placeholder="e.g. English, Lunch, Sensory Break" className="h-10" />
            </div>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ACTIVITIES.slice(0, 12).map(act => (
                <button key={act} onClick={() => setNewActivity(act)}
                  className={`px-2 py-0.5 rounded-full text-[11px] border transition-all ${newActivity === act ? "bg-brand text-white border-brand" : "border-border/50 text-muted-foreground hover:border-brand/30 hover:text-brand"}`}>
                  {act}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Start Time</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Duration (minutes)</Label>
                <Select value={newDuration} onValueChange={setNewDuration}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["15", "20", "30", "45", "60", "90"].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes (optional)</Label>
              <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="e.g. With TA support, Sensory room" className="h-10" />
            </div>
            {newActivity && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-2xl">{ACTIVITY_ICONS[getIconKey(newActivity)]?.emoji || "⭐"}</span>
                <div>
                  <div className="text-sm font-medium">{newActivity}</div>
                  {newTime && <div className="text-xs text-muted-foreground">{newTime}{newDuration ? ` · ${newDuration} min` : ""}</div>}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={() => showAddSlot && addSlot(showAddSlot)} className="flex-1 bg-brand hover:bg-brand/90 text-white">Add Activity</Button>
              <Button variant="outline" onClick={() => setShowAddSlot(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #timetable-print-area, #timetable-print-area * { visibility: visible; }
          #timetable-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:block { display: block !important; }
          .hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
