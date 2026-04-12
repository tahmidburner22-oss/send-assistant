/**
 * FeedbackWidget
 * Floating feedback modal triggered by the "adaptly:feedback" custom event
 * dispatched from the sidebar "Feedback" button in AppLayout.tsx.
 * Posts to /api/feedback with { name, email, type, message }.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";

type FeedbackType = "suggestion" | "bug" | "praise" | "other";


export default function FeedbackWidget() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from user context whenever it changes
  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Listen for the custom event dispatched by the sidebar button
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setSubmitted(false);
      setError(null);
    };
    window.addEventListener("adaptly:feedback", handler);
    return () => window.removeEventListener("adaptly:feedback", handler);
  }, []);

  const handleClose = () => {
    setOpen(false);
    // Reset form after close animation
    setTimeout(() => {
      setMessage("");
      setType("suggestion");
      setSubmitted(false);
      setError(null);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setError("Please enter at least 5 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ name, email, type, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not send feedback. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabels: Record<FeedbackType, string> = {
    suggestion: "Suggestion",
    bug: "Bug Report",
    praise: "Praise",
    other: "Other",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-brand" />
                </div>
                <span className="font-semibold text-sm text-foreground">Share Feedback</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 py-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Thank you!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your feedback has been received. We read every message.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleClose} className="mt-2">
                    Close
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Type
                    </Label>
                    <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(typeLabels) as FeedbackType[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {typeLabels[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind…"
                      rows={4}
                      className="resize-none text-sm"
                      required
                    />
                  </div>

                  {/* Optional name / email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Name
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Optional"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Optional"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-9 text-sm font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Feedback
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
