import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { pupils as pupilsApi } from "@/lib/api";
import { sendNeeds } from "@/lib/send-data";
import {
  Plus, TrendingUp, TrendingDown, Minus, Calendar, Clock,
  CheckCircle, AlertCircle, Star, Shield, BarChart3, FileText,
  Printer, ChevronLeft, Smile, Frown, Meh, Zap, Heart, Database
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

type BehaviourType = "positive" | "concern" | "neutral";
type TriggerType = "transition" | "sensory" | "academic" | "social" | "fatigue" | "unknown" | "other";

interface BehaviourEntry {
  id: string;
  childId: string;
  date: string;
  time: string;
  type: BehaviourType;
  category: string;
  description: string;
  trigger?: TriggerType;
  triggerNotes?: string;
  strategy?: string;
  outcome?: string;
  worksheetCompletion?: number; // 0-100
  linkedAssignmentId?: string;
  recordedBy?: string;
  misSource?: string;
}

const BEHAVIOUR_CATEGORIES = {
  positive: ["Task completion", "Peer interaction", "Self-regulation", "Communication", "Focus/attention", "Following instructions", "Creative expression", "Helping others"],
  concern: ["Task avoidance", "Emotional dysregulation", "Aggression", "Withdrawal", "Sensory seeking", "Repetitive behaviour", "Communication difficulty", "Refusal"],
  neutral: ["Transition", "Sensory break", "Check-in", "Observation", "Routine change", "Medical note"],
};

const STRATEGIES = [
  "Visual supports provided", "Sensory break offered", "Task modified", "TA support increased",
  "Positive reinforcement", "Calm-down space used", "Social story reviewed", "Choice offered",
  "Timer used", "Fidget tool provided", "Reduced workload", "Verbal reassurance",
  "Movement break", "Peer support", "Distraction technique", "Ignored behaviour",
];

const TRIGGER_LABELS: Record<TriggerType, string> = {
  transition: "Transition (change of activity/room)",
  sensory: "Sensory overload/under-stimulation",
  academic: "Academic demand/difficulty",
  social: "Social interaction",
  fatigue: "Fatigue/hunger",
  unknown: "Unknown",
  other: "Other",
};

function getBehaviourIcon(type: BehaviourType) {
  if (type === "positive") return <Smile className="w-4 h-4 text-emerald-600" />;
  if (type === "concern") return <Frown className="w-4 h-4 text-red-500" />;
  return <Meh className="w-4 h-4 text-amber-500" />;
}

function getBehaviourColor(type: BehaviourType) {
  if (type === "positive") return "border-emerald-200 bg-emerald-50";
  if (type === "concern") return "border-red-200 bg-red-50";
  return "border-amber-200 bg-amber-50";
}

export default function BehaviourTracking() {
  const { children } = useApp();
  const [entries, setEntries] = useState<BehaviourEntry[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BehaviourEntry | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // New entry form
  const [newType, setNewType] = useState<BehaviourType>("positive");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTrigger, setNewTrigger] = useState<TriggerType>("unknown");
  const [newTriggerNotes, setNewTriggerNotes] = useState("");
  const [newStrategy, setNewStrategy] = useState("");
  const [newOutcome, setNewOutcome] = useState("");
  const [newWorksheetCompletion, setNewWorksheetCompletion] = useState<number | undefined>(undefined);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState(new Date().toTimeString().slice(0, 5));

  // Load behaviour records from server when a child is selected
  const loadBehaviourForChild = async (childId: string) => {
    if (!childId) return;
    setLoadingEntries(true);
    try {
      const pupil = await pupilsApi.get(childId);
      if (Array.isArray(pupil.behaviour)) {
        const mapped: BehaviourEntry[] = pupil.behaviour.map((r: any) => ({
          id: r.id,
          childId: r.pupil_id,
          date: r.date,
          time: r.time || "00:00",
          type: r.type as BehaviourType,
          category: r.category || "",
          description: r.description || "",
          trigger: r.trigger as TriggerType | undefined,
          triggerNotes: r.trigger_notes || undefined,
          strategy: r.action_taken || undefined,
          outcome: r.outcome || undefined,
          misSource: r.mis_source || undefined,
        }));
        setEntries(prev => {
          // Replace entries for this child, keep others
          const others = prev.filter(e => e.childId !== childId);
          return [...others, ...mapped];
        });
      }
    } catch { /* ignore */ } finally {
      setLoadingEntries(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  const childEntries = useMemo(() => {
    return entries.filter(e => {
      if (e.childId !== selectedChildId) return false;
      if (dateFilter && !e.date.startsWith(dateFilter)) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      return true;
    }).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }, [entries, selectedChildId, dateFilter, typeFilter]);

  const stats = useMemo(() => {
    const all = entries.filter(e => e.childId === selectedChildId);
    const positive = all.filter(e => e.type === "positive").length;
    const concern = all.filter(e => e.type === "concern").length;
    const neutral = all.filter(e => e.type === "neutral").length;
    const total = all.length;
    const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 0;

    // Weekly chart data (last 7 days)
    const weekData: Record<string, { date: string; positive: number; concern: number; neutral: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      weekData[key] = { date: d.toLocaleDateString("en-GB", { weekday: "short" }), positive: 0, concern: 0, neutral: 0 };
    }
    all.forEach(e => {
      if (weekData[e.date]) weekData[e.date][e.type]++;
    });

    // Trigger frequency
    const triggerCounts: Record<string, number> = {};
    all.filter(e => e.type === "concern" && e.trigger).forEach(e => {
      const t = e.trigger!;
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });

    return {
      positive, concern, neutral, total, positiveRate,
      weekChart: Object.values(weekData),
      topTrigger: Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    };
  }, [entries, selectedChildId]);

  const addEntry = async () => {
    if (!selectedChildId) { toast.error("Please select a child first."); return; }
    if (!newCategory || !newDescription) { toast.error("Please fill in category and description."); return; }
    try {
      const result = await pupilsApi.recordBehaviour(selectedChildId, {
        type: newType,
        category: newCategory,
        description: newDescription,
        actionTaken: newStrategy || null,
        date: newDate,
      });
      const entry: BehaviourEntry = {
        id: result.id || Date.now().toString(),
        childId: selectedChildId,
        date: newDate,
        time: newTime,
        type: newType,
        category: newCategory,
        description: newDescription,
        trigger: newTrigger,
        triggerNotes: newTriggerNotes,
        strategy: newStrategy,
        outcome: newOutcome,
        worksheetCompletion: newWorksheetCompletion,
      };
      setEntries(prev => [...prev, entry]);
      toast.success("Behaviour entry recorded.");
    } catch {
      toast.error("Failed to save behaviour entry.");
    }
    setNewCategory(""); setNewDescription(""); setNewTriggerNotes(""); setNewStrategy(""); setNewOutcome(""); setNewWorksheetCompletion(undefined);
    setShowAdd(false);
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success("Entry deleted.");
  };

  const handlePrint = () => window.print();

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" /> Behaviour Tracking
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Track and analyse behaviour patterns linked to worksheet completion and SEND needs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print Report</Button>
            {selectedChildId && (
              <Button size="sm" onClick={() => setShowAdd(true)} className="bg-brand hover:bg-brand/90 text-white">
                <Plus className="w-4 h-4 mr-1" /> Log Entry
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Data Protection Notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Data Protection:</strong> Behaviour records are stored locally on this device only. Use initials only — never full names. Do not record medical diagnoses or confidential information. All data is subject to your school's data protection policy.
        </p>
      </div>

      {/* Child Selector */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs font-medium mb-1.5 block">Select Student</Label>
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pupils added yet. Go to the Pupils page to add students.</p>
              ) : (
                <Select value={selectedChildId} onValueChange={v => { setSelectedChildId(v); loadBehaviourForChild(v); }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                  <SelectContent>
                    {children.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.yearGroup} · {sendNeeds.find(n => n.id === c.sendNeed)?.name || c.sendNeed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedChildId && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Entries", value: stats.total, icon: FileText, color: "text-brand" },
              { label: "Positive", value: stats.positive, icon: Smile, color: "text-emerald-600" },
              { label: "Concerns", value: stats.concern, icon: Frown, color: "text-red-500" },
              { label: "Positive Rate", value: `${stats.positiveRate}%`, icon: TrendingUp, color: stats.positiveRate >= 70 ? "text-emerald-600" : stats.positiveRate >= 50 ? "text-amber-500" : "text-red-500" },
            ].map((stat, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 text-center">
                  <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top trigger alert */}
          {stats.topTrigger && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Most common trigger:</strong> {TRIGGER_LABELS[stats.topTrigger as TriggerType] || stats.topTrigger} — consider targeted strategies for this trigger.
              </p>
            </div>
          )}

          <Tabs defaultValue="log">
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="log" className="text-xs">Behaviour Log</TabsTrigger>
              <TabsTrigger value="charts" className="text-xs">Charts & Trends</TabsTrigger>
              <TabsTrigger value="report" className="text-xs">Summary Report</TabsTrigger>
            </TabsList>

            {/* Behaviour Log */}
            <TabsContent value="log" className="mt-3 space-y-3">
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <Input type="month" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  className="h-8 text-xs w-36" placeholder="Filter by month" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="concern">Concern</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {childEntries.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No entries yet. Click "Log Entry" to start tracking.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {childEntries.map(entry => (
                    <motion.div key={entry.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className={`border ${getBehaviourColor(entry.type)} cursor-pointer hover:shadow-sm transition-all`}
                        onClick={() => setSelectedEntry(entry)}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {getBehaviourIcon(entry.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">{entry.category}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  entry.type === "positive" ? "bg-emerald-100 text-emerald-700" :
                                  entry.type === "concern" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                }`}>{entry.type}</span>
                                {entry.misSource && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-0.5">
                                    <Database className="w-2.5 h-2.5" />
                                    {entry.misSource === "bromcom" ? "Bromcom" : "Arbor"}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.description}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(entry.date).toLocaleDateString("en-GB")}</span>
                                <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{entry.time}</span>
                                {entry.trigger && entry.trigger !== "unknown" && (
                                  <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{TRIGGER_LABELS[entry.trigger]?.split(" ")[0]}</span>
                                )}
                                {entry.worksheetCompletion !== undefined && (
                                  <span className="flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5 text-brand" />WS: {entry.worksheetCompletion}%</span>
                                )}
                              </div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}
                              className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-all">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Charts */}
            <TabsContent value="charts" className="mt-3 space-y-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Last 7 Days — Behaviour Frequency</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.weekChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="positive" name="Positive" fill="#10b981" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="concern" name="Concern" fill="#ef4444" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="neutral" name="Neutral" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Positive Rate Trend</h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={stats.weekChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="positive" name="Positive" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="concern" name="Concern" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Summary Report */}
            <TabsContent value="report" className="mt-3">
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Behaviour Summary Report</h4>
                    <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                    <p><strong>Student:</strong> {selectedChild?.name} ({selectedChild?.yearGroup})</p>
                    <p><strong>SEND Need:</strong> {sendNeeds.find(n => n.id === selectedChild?.sendNeed)?.name}</p>
                    <p><strong>Total Entries:</strong> {stats.total}</p>
                    <p><strong>Positive Behaviours:</strong> {stats.positive} ({stats.positiveRate}%)</p>
                    <p><strong>Concerns Logged:</strong> {stats.concern}</p>
                    {stats.topTrigger && <p><strong>Most Common Trigger:</strong> {TRIGGER_LABELS[stats.topTrigger as TriggerType]}</p>}
                  </div>
                  {childEntries.filter(e => e.type === "concern").length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-red-600">Recent Concerns</h5>
                      <div className="space-y-1">
                        {childEntries.filter(e => e.type === "concern").slice(0, 5).map(e => (
                          <div key={e.id} className="text-xs p-2 rounded bg-red-50 border border-red-100">
                            <span className="font-medium">{new Date(e.date).toLocaleDateString("en-GB")}</span> — {e.category}: {e.description}
                            {e.strategy && <span className="text-red-600"> | Strategy: {e.strategy}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {childEntries.filter(e => e.type === "positive").length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-emerald-600">Recent Positive Behaviours</h5>
                      <div className="space-y-1">
                        {childEntries.filter(e => e.type === "positive").slice(0, 5).map(e => (
                          <div key={e.id} className="text-xs p-2 rounded bg-emerald-50 border border-emerald-100">
                            <span className="font-medium">{new Date(e.date).toLocaleDateString("en-GB")}</span> — {e.category}: {e.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-brand" /> Log Behaviour Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Type */}
            <div className="grid grid-cols-3 gap-2">
              {(["positive", "concern", "neutral"] as BehaviourType[]).map(t => (
                <button key={t} onClick={() => { setNewType(t); setNewCategory(""); }}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    newType === t ? (t === "positive" ? "bg-emerald-100 border-emerald-400 text-emerald-700" : t === "concern" ? "bg-red-100 border-red-400 text-red-700" : "bg-amber-100 border-amber-400 text-amber-700")
                    : "border-border/50 text-muted-foreground hover:border-brand/30"
                  }`}>
                  {t === "positive" ? <Smile className="w-3.5 h-3.5" /> : t === "concern" ? <Frown className="w-3.5 h-3.5" /> : <Meh className="w-3.5 h-3.5" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category *</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {BEHAVIOUR_CATEGORIES[newType].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description *</Label>
              <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)}
                placeholder="Describe what happened..." className="min-h-[70px] text-sm" />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Time</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="h-10" />
              </div>
            </div>

            {/* Trigger (for concerns) */}
            {newType === "concern" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Trigger</Label>
                  <Select value={newTrigger} onValueChange={v => setNewTrigger(v as TriggerType)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Trigger Notes</Label>
                  <Input value={newTriggerNotes} onChange={e => setNewTriggerNotes(e.target.value)} placeholder="Additional context..." className="h-10" />
                </div>
              </>
            )}

            {/* Strategy */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Strategy Used</Label>
              <Select value={newStrategy} onValueChange={setNewStrategy}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select strategy..." /></SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Worksheet completion */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Worksheet Completion at Time of Entry (%)</Label>
              <Input type="number" min={0} max={100} value={newWorksheetCompletion ?? ""}
                onChange={e => setNewWorksheetCompletion(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g. 75" className="h-10" />
            </div>

            <div className="flex gap-2">
              <Button onClick={addEntry} className="flex-1 bg-brand hover:bg-brand/90 text-white">Log Entry</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Behaviour Entry Detail</DialogTitle></DialogHeader>
          {selectedEntry && (
            <div className="space-y-3 mt-2 text-sm">
              <div className={`p-3 rounded-lg border ${getBehaviourColor(selectedEntry.type)}`}>
                <div className="flex items-center gap-2 mb-1">
                  {getBehaviourIcon(selectedEntry.type)}
                  <span className="font-semibold">{selectedEntry.category}</span>
                  <span className="text-xs text-muted-foreground">{new Date(selectedEntry.date).toLocaleDateString("en-GB")} at {selectedEntry.time}</span>
                </div>
                <p className="text-sm">{selectedEntry.description}</p>
              </div>
              {selectedEntry.trigger && <p><strong>Trigger:</strong> {TRIGGER_LABELS[selectedEntry.trigger]}</p>}
              {selectedEntry.triggerNotes && <p><strong>Trigger Notes:</strong> {selectedEntry.triggerNotes}</p>}
              {selectedEntry.strategy && <p><strong>Strategy Used:</strong> {selectedEntry.strategy}</p>}
              {selectedEntry.outcome && <p><strong>Outcome:</strong> {selectedEntry.outcome}</p>}
              {selectedEntry.worksheetCompletion !== undefined && (
                <p><strong>Worksheet Completion:</strong> {selectedEntry.worksheetCompletion}%</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
