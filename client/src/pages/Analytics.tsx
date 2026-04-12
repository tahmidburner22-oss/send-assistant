import { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { subjects, sendNeeds } from "@/lib/send-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  BarChart3, FileText, BookOpen, Users, Clock, Star, TrendingUp,
  TrendingDown, Minus, Sparkles, Award, Shield, Gamepad2, Target, GraduationCap,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const COLORS = ["#10B981","#7C3AED","#3B82F6","#F59E0B","#EF4444","#06B6D4","#EC4899","#8B5CF6"];

export default function Analytics() {
  const { worksheetHistory, storyHistory, differentiationHistory, children, refreshData, user } = useApp();
  const isAdmin = user?.role === "school_admin" || user?.role === "mat_admin" || user?.role === "senco";
  const [schoolWide, setSchoolWide] = useState(false);
  useEffect(() => { refreshData(); }, []);

  const totalWorksheets = worksheetHistory.length;
  const totalStories = storyHistory.length;
  const totalDiffs = differentiationHistory.length;
  const totalChildren = children.length;
  const timeSaved = (totalWorksheets * 15) + (totalStories * 10) + (totalDiffs * 8);

  const weeklyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, w) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (7 - w) * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const label = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const inRange = (d: string) => { const t = new Date(d); return t >= weekStart && t < weekEnd; };
      return {
        week: label,
        worksheets: worksheetHistory.filter(x => inRange(x.createdAt)).length,
        stories: storyHistory.filter(x => inRange(x.createdAt)).length,
        differentiations: differentiationHistory.filter(x => inRange(x.createdAt)).length,
      };
    });
  }, [worksheetHistory, storyHistory, differentiationHistory]);

  const weekOnWeek = useMemo(() => {
    const a = weeklyData[weeklyData.length - 1];
    const b = weeklyData[weeklyData.length - 2];
    const ta = (a?.worksheets || 0) + (a?.stories || 0) + (a?.differentiations || 0);
    const tb = (b?.worksheets || 0) + (b?.stories || 0) + (b?.differentiations || 0);
    if (!tb) return null;
    return Math.round(((ta - tb) / tb) * 100);
  }, [weeklyData]);

  const subjectData = useMemo(() => {
    const c: Record<string, number> = {};
    worksheetHistory.forEach(w => { const n = subjects.find(s => s.id === w.subject)?.name || w.subject || "Other"; c[n] = (c[n] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [worksheetHistory]);

  const needData = useMemo(() => {
    const c: Record<string, number> = {};
    [...worksheetHistory, ...storyHistory].forEach((item: any) => {
      if (item.sendNeed && item.sendNeed !== "none" && item.sendNeed !== "none-selected") {
        const n = sendNeeds.find(x => x.id === item.sendNeed)?.name || item.sendNeed;
        const s = n.length > 18 ? n.slice(0, 16) + "…" : n;
        c[s] = (c[s] || 0) + 1;
      }
    });
    return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [worksheetHistory, storyHistory]);

  const topTopics = useMemo(() => {
    const c: Record<string, number> = {};
    worksheetHistory.forEach(w => { if (w.topic) c[w.topic] = (c[w.topic] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [worksheetHistory]);

  const avgRating = useMemo(() => {
    const r = worksheetHistory.filter(w => w.rating);
    if (!r.length) return null;
    return (r.reduce((s, w) => s + (w.rating || 0), 0) / r.length).toFixed(1);
  }, [worksheetHistory]);

  const streak = useMemo(() => {
    const all = new Set([
      ...worksheetHistory.map(w => new Date(w.createdAt).toDateString()),
      ...storyHistory.map(s => new Date(s.createdAt).toDateString()),
      ...differentiationHistory.map(d => new Date(d.createdAt).toDateString()),
    ]);
    let n = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (all.has(d.toDateString())) n++; else if (i > 0) break;
    }
    return n;
  }, [worksheetHistory, storyHistory, differentiationHistory]);

  const hasData = totalWorksheets > 0 || totalStories > 0 || totalDiffs > 0;

  // ── Outcome-focused: quiz results from API ──────────────────────────────────
  const [quizResults, setQuizResults] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.token) return;
    fetch("/api/quiz/results", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(d => setQuizResults(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [user?.token]);

  const quizByPupil = useMemo(() => {
    const m: Record<string, { name: string; scores: number[]; avg: number }> = {};
    quizResults.forEach(r => {
      if (!m[r.pupil_name]) m[r.pupil_name] = { name: r.pupil_name, scores: [], avg: 0 };
      const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0;
      m[r.pupil_name].scores.push(pct);
    });
    return Object.values(m).map(p => ({
      ...p,
      avg: p.scores.length ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length) : 0,
    })).sort((a, b) => b.avg - a.avg).slice(0, 10);
  }, [quizResults]);

  const quizTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, w) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (5 - w) * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const label = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const inRange = (d: string) => { const t = new Date(d); return t >= weekStart && t < weekEnd; };
      const week = quizResults.filter(r => inRange(r.played_at));
      const avg = week.length
        ? Math.round(week.reduce((s, r) => s + (r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0), 0) / week.length)
        : 0;
      return { week: label, avgScore: avg, games: week.length };
    });
  }, [quizResults]);

  // Pupil assignment completion rates
  const pupilProgress = useMemo(() => {
    return children.map(p => {
      const total = p.assignments?.length || 0;
      const done = p.assignments?.filter((a: any) => a.status === "completed").length || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { name: p.name.split(" ")[0], total, done, pct };
    }).filter(p => p.total > 0).sort((a, b) => b.pct - a.pct).slice(0, 8);
  }, [children]);

  // Worksheet ratings distribution
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    worksheetHistory.forEach(w => { if (w.rating && w.rating >= 1 && w.rating <= 5) dist[w.rating - 1]++; });
    return [1, 2, 3, 4, 5].map((r, i) => ({ rating: `${r}★`, count: dist[i] }));
  }, [worksheetHistory]);

  const stats = [
    { label: "Worksheets", value: totalWorksheets, icon: FileText, color: "text-brand", bg: "bg-brand-light" },
    { label: "Stories", value: totalStories, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Differentiations", value: totalDiffs, icon: Sparkles, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pupils", value: totalChildren, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Time Saved", value: timeSaved >= 60 ? `${Math.floor(timeSaved/60)}h ${timeSaved%60}m` : `${timeSaved}m`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Avg Rating", value: avgRating ? `${avgRating}★` : "—", icon: Star, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your usage, productivity, and impact.</p>
      </motion.div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stats.map((s, i) => { const Icon = s.icon; return (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-border/50"><CardContent className="p-3 text-center">
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-muted-foreground leading-tight">{s.label}</div>
            </CardContent></Card>
          </motion.div>
        );})}
      </div>

      {hasData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
          <Card className="border-border/50"><CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">{streak} {streak === 1 ? "day" : "days"}</div>
              <div className="text-[10px] text-muted-foreground">Active streak</div>
            </div>
          </CardContent></Card>
          <Card className="border-border/50"><CardContent className="p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${weekOnWeek == null ? "bg-muted" : weekOnWeek > 0 ? "bg-green-50" : weekOnWeek < 0 ? "bg-red-50" : "bg-muted"}`}>
              {weekOnWeek == null ? <Minus className="w-5 h-5 text-muted-foreground" /> : weekOnWeek > 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : weekOnWeek < 0 ? <TrendingDown className="w-5 h-5 text-red-500" /> : <Minus className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div>
              <div className={`text-lg font-bold ${weekOnWeek == null ? "text-muted-foreground" : weekOnWeek > 0 ? "text-green-600" : weekOnWeek < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {weekOnWeek == null ? "—" : weekOnWeek === 0 ? "Same" : `${weekOnWeek > 0 ? "+" : ""}${weekOnWeek}%`}
              </div>
              <div className="text-[10px] text-muted-foreground">vs last week</div>
            </div>
          </CardContent></Card>
        </motion.div>
      )}

      {!hasData ? (
        <Card className="border-border/50"><CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No Data Yet</h3>
          <p className="text-sm text-muted-foreground">Generate worksheets and stories to see analytics here.</p>
        </CardContent></Card>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50"><CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand" /> Activity — Last 8 Weeks
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={1} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="worksheets" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Worksheets" />
                  <Line type="monotone" dataKey="stories" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} name="Stories" />
                  <Line type="monotone" dataKey="differentiations" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Differentiations" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </motion.div>

          {subjectData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Card className="border-border/50"><CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Worksheets by Subject</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[4,4,0,0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            </motion.div>
          )}

          {topTopics.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <Card className="border-border/50"><CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Top Topics</h3>
                <div className="space-y-2">
                  {topTopics.map(([topic, count], i) => (
                    <div key={topic} className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground w-4">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-foreground truncate">{topic}</span>
                          <span className="text-xs font-semibold text-brand ml-2 flex-shrink-0">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${(count / topTopics[0][1]) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </motion.div>
          )}

          {needData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <Card className="border-border/50"><CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Resources by SEND Need</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={needData} cx="50%" cy="50%" outerRadius={65} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {needData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent></Card>
            </motion.div>
          )}

          {/* ── Outcome-focused sections ── */}
          {pupilProgress.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Card className="border-border/50"><CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-teal-600" /> Pupil Assignment Completion
                </h3>
                <div className="space-y-2">
                  {pupilProgress.map(p => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="text-xs text-foreground w-16 truncate">{p.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${p.pct >= 80 ? "bg-green-500" : p.pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground w-10 text-right">{p.done}/{p.total}</span>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: p.pct >= 80 ? "#10B981" : p.pct >= 50 ? "#F59E0B" : "#EF4444" }}>{p.pct}%</span>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </motion.div>
          )}

          {quizResults.length > 0 && (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50"><CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-purple-600" /> QuizBlast — Average Score Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={quizTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(v: any) => [`${v}%`, "Avg Score"]} />
                      <Line type="monotone" dataKey="avgScore" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} name="Avg Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </motion.div>

              {quizByPupil.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                  <Card className="border-border/50"><CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" /> QuizBlast — Pupil Performance
                    </h3>
                    <div className="space-y-2">
                      {quizByPupil.map(p => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="text-xs text-foreground w-20 truncate">{p.name}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.avg >= 80 ? "bg-green-500" : p.avg >= 60 ? "bg-amber-500" : "bg-red-400"}`}
                              style={{ width: `${p.avg}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold w-10 text-right" style={{ color: p.avg >= 80 ? "#10B981" : p.avg >= 60 ? "#F59E0B" : "#EF4444" }}>{p.avg}%</span>
                          <span className="text-[10px] text-muted-foreground w-12 text-right">{p.scores.length} game{p.scores.length !== 1 ? "s" : ""}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
                </motion.div>
              )}
            </>
          )}

          {ratingDist.some(r => r.count > 0) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
              <Card className="border-border/50"><CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500" /> Worksheet Quality Ratings
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={ratingDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F59E0B" radius={[4,4,0,0]} name="Worksheets" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
