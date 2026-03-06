import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { Lightbulb, ThumbsUp, Plus, ArrowUp } from "lucide-react";

export default function Ideas() {
  const { ideas, addIdea, voteIdea, user } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const sortedIdeas = [...ideas].sort((a, b) => b.votes - a.votes);

  const handleSubmit = () => {
    if (!title || !description) {
      toast.error("Please fill in all fields.");
      return;
    }
    addIdea({ title, description, author: user?.displayName || "Anonymous" });
    toast.success("Idea submitted!");
    setTitle(""); setDescription(""); setShowAdd(false);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Share and vote on feature ideas for Adaptly.</p>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand hover:bg-brand/90 text-white">
              <Plus className="w-4 h-4 mr-1" /> Submit Idea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Submit an Idea</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief title for your idea" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description *</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your idea in detail..." className="min-h-[100px]" />
              </div>
              <Button onClick={handleSubmit} className="w-full h-10 bg-brand hover:bg-brand/90 text-white">Submit Idea</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="space-y-2">
        {sortedIdeas.map((idea, i) => (
          <motion.div key={idea.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 flex gap-3">
                <button onClick={() => { voteIdea(idea.id); toast.success("Voted!"); }}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-brand-light transition-colors flex-shrink-0">
                  <ArrowUp className="w-4 h-4 text-brand" />
                  <span className="text-sm font-bold text-brand">{idea.votes}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{idea.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{idea.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground">{idea.author}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
