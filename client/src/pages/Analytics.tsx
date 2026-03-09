import { useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { subjects, sendNeeds } from "@/lib/send-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, FileText, BookOpen, Users, Clock, Star, TrendingUp } from "lucide-react";

const COLORS = ["#10B981", "#7C3AED", "#3B82F6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#8B5CF6"];

export default function Analytics() {
  const { worksheetHistory, storyHistory, children, refreshData } = useApp();

  // Re-fetch data from server on mount so analytics are always up to date
  useEffect(() => { refreshData(); }, []);

  const totalWorksheets = worksheetHistory.length;
  const totalStories = storyHistory.length;
  const totalChildren = children.length;
  const timeSaved = (totalWorksheets * 15) + (totalStories * 10);

  const subjectData = useMemo(() => {
    const counts: Record<string, number> = {};
    worksheetHistory.forEach(w => {
      const name = subjects.find(s => s.id === w.subject)?.name || w.subject;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [worksheetHistory]);

  const needData = useMemo(() => {
    const counts: Record<string, number> = {};
    [...worksheetHistory, ...storyHistory].forEach((item: any) => {
      if (item.sendNeed) {
        const name = sendNeeds.find(n => n.id === item.sendNeed)?.name || item.sendNeed;
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 18) + "..." : name, value }));
  }, [worksheetHistory, storyHistory]);

  const difficultyData = useMemo(() => {
    const counts: Record<string, number> = { Basic: 0, Mixed: 0, Stretch: 0 };
    worksheetHistory.forEach(w => {
      const key = w.difficulty.charAt(0).toUpperCase() + w.difficulty.slice(1);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [worksheetHistory]);

  const avgRating = useMemo(() => {
    const rated = worksheetHistory.filter(w => w.rating);
    if (rated.length === 0) return null;
    return (rated.reduce((sum, w) => sum + (w.rating || 0), 0) / rated.length).toFixed(1);
  }, [worksheetHistory]);

  const stats = [
    { label: "Worksheets", value: totalWorksheets, icon: FileText, color: "text-brand" },
    { label: "Stories", value: totalStories, icon: BookOpen, color: "text-purple-600" },
    { label: "Children", value: totalChildren, icon: Users, color: "text-blue-600" },
    { label: "Time Saved", value: `${timeSaved}m`, icon: Clock, color: "text-amber-600" },
    { label: "Avg Rating", value: avgRating || "—", icon: Star, color: "text-rose-500" },
  ];

  const hasData = totalWorksheets > 0 || totalStories > 0;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">Track your usage, productivity, and impact.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-border/50">
                <CardContent className="p-3 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {!hasData ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No Data Yet</h3>
            <p className="text-sm text-muted-foreground">Generate worksheets and stories to see analytics here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Subject Distribution */}
          {subjectData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Worksheets by Subject</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={subjectData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* SEND Need Distribution */}
          {needData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Resources by SEND Need</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={needData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                        {needData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Difficulty Distribution */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Difficulty Distribution</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={difficultyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
