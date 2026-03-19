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
import { Lightbulb, ThumbsUp, Plus, ArrowUp, Mail, Send, MessageSquare, Bug, Star, ChevronDown, ChevronUp } from "lucide-react";

// ── Contact form ──────────────────────────────────────────────────
function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"improvement" | "bug" | "feature" | "other">("improvement");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Please write a message."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, type, message }),
      });
      if (res.ok) {
        setSent(true);
        toast.success("Message sent — thank you for your feedback!");
        setName(""); setEmail(""); setMessage(""); setType("improvement");
      } else {
        // Fallback to mailto if server fails
        const subject = encodeURIComponent(`Adaptly Feedback: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const body = encodeURIComponent(`Name: ${name || "Anonymous"}\nEmail: ${email || "not provided"}\nType: ${type}\n\n${message}`);
        window.open(`mailto:hello@adaptly.co.uk?subject=${subject}&body=${body}`, "_blank");
        setSent(true);
        toast.success("Opening your email client…");
      }
    } catch {
      // Fallback to mailto
      const subject = encodeURIComponent(`Adaptly Feedback: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
      const body = encodeURIComponent(`Name: ${name || "Anonymous"}\nEmail: ${email || "not provided"}\nType: ${type}\n\n${message}`);
      window.open(`mailto:hello@adaptly.co.uk?subject=${subject}&body=${body}`, "_blank");
      setSent(true);
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Star className="w-7 h-7 text-emerald-600" />
        </div>
        <p className="font-semibold text-foreground">Thank you for your feedback!</p>
        <p className="text-xs text-muted-foreground">We read every message and use them to improve Adaptly.</p>
        <Button size="sm" variant="outline" onClick={() => setSent(false)} className="text-xs">Send another</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Your name (optional)</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Email (optional)</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. sarah@school.co.uk" className="h-9 text-sm" type="email" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Type of feedback</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { id: "improvement", label: "Improvement", icon: "✨" },
            { id: "bug", label: "Bug report", icon: "🐛" },
            { id: "feature", label: "Feature request", icon: "💡" },
            { id: "other", label: "Other", icon: "💬" },
          ] as const).map(opt => (
            <button
              key={opt.id}
              onClick={() => setType(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                type === opt.id
                  ? "bg-brand text-white border-brand"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              <span>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Your message *</Label>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Tell us what you think, what's broken, or what you'd love to see..."
          className="min-h-[100px] text-sm"
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="w-full h-10 bg-brand hover:bg-brand/90 text-white gap-2"
      >
        <Send className="w-4 h-4" />
        {sending ? "Sending…" : "Send Feedback"}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">
        Or email us directly at{" "}
        <a href="mailto:hello@adaptly.co.uk" className="text-brand hover:underline">hello@adaptly.co.uk</a>
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function Ideas() {
  const { ideas, addIdea, voteIdea, user } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showContact, setShowContact] = useState(true);

  const sortedIdeas = [...ideas].sort((a, b) => b.votes - a.votes);

  const handleSubmit = () => {
    if (!title || !description) { toast.error("Please fill in all fields."); return; }
    addIdea({ title, description, author: user?.displayName || "Anonymous" });
    toast.success("Idea submitted!");
    setTitle(""); setDescription(""); setShowAdd(false);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">

      {/* ── Support & Contact ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50 overflow-hidden">
          <button
            onClick={() => setShowContact(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-brand" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Support &amp; Feedback</p>
                <p className="text-xs text-muted-foreground">Report bugs, suggest improvements, get help</p>
              </div>
            </div>
            {showContact ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showContact && (
            <CardContent className="pt-0 pb-5 px-5 border-t border-border/40">
              <div className="pt-4">
                <ContactForm />
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* ── Ideas board ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ideas Board</p>
              <p className="text-xs text-muted-foreground">Vote on what gets built next</p>
            </div>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand hover:bg-brand/90 text-white gap-1">
                <Plus className="w-4 h-4" /> Submit Idea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" /> Submit an Idea
                </DialogTitle>
              </DialogHeader>
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
        </div>

        {sortedIdeas.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-10 text-center">
              <Lightbulb className="w-10 h-10 text-amber-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No ideas yet</p>
              <p className="text-xs text-muted-foreground">Be the first to suggest a feature!</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {sortedIdeas.map((idea, i) => (
            <motion.div key={idea.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-border/50 hover:border-border transition-colors">
                <CardContent className="p-4 flex gap-3">
                  <button
                    onClick={() => { voteIdea(idea.id); toast.success("Voted!"); }}
                    className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl hover:bg-brand/10 transition-colors flex-shrink-0 border border-border/50 hover:border-brand/30"
                  >
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
      </motion.div>
    </div>
  );
}
