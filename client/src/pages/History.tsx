import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { subjects, sendNeeds } from "@/lib/send-data";
import { FileText, BookOpen, Star, Eye, Trash2, Clock } from "lucide-react";

export default function History() {
  const { worksheetHistory, storyHistory } = useApp();
  const [viewContent, setViewContent] = useState<{ title: string; content: string } | null>(null);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">View your previously generated worksheets and stories.</p>
      </motion.div>

      <Tabs defaultValue="worksheets">
        <TabsList className="w-full grid grid-cols-2 h-10">
          <TabsTrigger value="worksheets" className="text-xs gap-1.5"><FileText className="w-3.5 h-3.5" /> Worksheets ({worksheetHistory.length})</TabsTrigger>
          <TabsTrigger value="stories" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Stories ({storyHistory.length})</TabsTrigger>
        </TabsList>

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
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{ws.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{subjectName} · {ws.yearGroup} · {ws.difficulty}{needName ? ` · ${needName}` : ""}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{new Date(ws.createdAt).toLocaleDateString()}</span>
                        {ws.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" /> {ws.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setViewContent({ title: ws.title, content: ws.teacherContent || ws.content })}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

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
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{story.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{story.genre} · {story.yearGroup} · {story.length}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewContent({ title: story.title, content: story.content })}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewContent?.title}</DialogTitle></DialogHeader>
          <div className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{viewContent?.content}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
