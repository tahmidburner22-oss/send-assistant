/**
 * SharedWorksheet — public read-only view of a shared worksheet.
 * No authentication required. Teacher sections are excluded server-side.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import WorksheetRenderer from "@/components/WorksheetRenderer";
import { GraduationCap, Loader2, AlertCircle, ExternalLink } from "lucide-react";

export default function SharedWorksheet() {
  const [location] = useLocation();
  const token = location.split("/shared/")[1]?.split("/")[0];

  const [loading, setLoading] = useState(true);
  const [worksheet, setWorksheet] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Invalid link."); setLoading(false); return; }
    fetch(`/api/data/shared/${token}`)
      .then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error || "Not found"); }))
      .then(data => { setWorksheet(data); setLoading(false); })
      .catch(err => { setError(err.message || "Worksheet not found."); setLoading(false); });
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-foreground">Adaptly</span>
          </div>
          <a
            href="/"
            className="text-xs text-brand hover:underline flex items-center gap-1"
          >
            Create your own <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-red-200">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h2 className="font-semibold text-foreground mb-1">Worksheet not found</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">This link may have been revoked or may be invalid.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {worksheet && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Worksheet header */}
            <div className="mb-4 space-y-1">
              <h1 className="text-xl font-bold text-foreground">{worksheet.title}</h1>
              <p className="text-sm text-muted-foreground">
                {[worksheet.subject, worksheet.yearGroup, worksheet.difficulty]
                  .filter(Boolean).join(" · ")}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                <span className="px-2 py-0.5 rounded-full bg-brand-light text-brand font-medium">Shared via Adaptly</span>
                <span>Student view — teacher notes hidden</span>
              </div>
            </div>

            {/* Render the worksheet */}
            <WorksheetRenderer
              worksheet={{
                title: worksheet.title,
                subtitle: worksheet.subtitle,
                sections: worksheet.sections,
                metadata: worksheet.metadata,
                isAI: true,
              }}
              viewMode="student"
              textSize={14}
              overlayColor="#ffffff"
              editMode={false}
              editedSections={{}}
            />

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
              <p>Created with <strong className="text-brand">Adaptly</strong> · Professional teaching resources</p>
              <a href="/" className="text-brand hover:underline">adaptly.co.uk — Try it free</a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
