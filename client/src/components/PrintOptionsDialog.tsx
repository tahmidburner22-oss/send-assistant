import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Printer, FileText, BookOpen, Layers, AlignJustify } from "lucide-react";

export interface PrintOptions {
  view: "student" | "teacher";
  layout: "together" | "per-page";
  /** W9 / G12 — append a teacher-only "Answer Key" page after the worksheet. */
  includeAnswerKey?: boolean;
}

interface PrintOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onPrint: (options: PrintOptions) => void;
}

export default function PrintOptionsDialog({ open, onClose, onPrint }: PrintOptionsDialogProps) {
  const [view, setView] = useState<"student" | "teacher">("teacher");
  const [layout, setLayout] = useState<"together" | "per-page">("together");
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(false);

  const handlePrint = () => {
    onPrint({ view, layout, includeAnswerKey });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Print Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* View Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">View Mode</Label>
            <RadioGroup value={view} onValueChange={(v) => setView(v as "student" | "teacher")} className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${view === "student" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <RadioGroupItem value="student" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-sm">Student View</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hides teacher notes, answer keys, and marking guidance. Clean version for students to complete.
                  </p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${view === "teacher" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <RadioGroupItem value="teacher" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Teacher View</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Includes all teacher notes, answer keys, differentiation guidance, and marking criteria.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Layout */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Page Layout</Label>
            <RadioGroup value={layout} onValueChange={(v) => setLayout(v as "together" | "per-page")} className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${layout === "together" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <RadioGroupItem value="together" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlignJustify className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">All Sections Together</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All sections flow continuously on pages. Best for shorter worksheets.
                  </p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${layout === "per-page" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <RadioGroupItem value="per-page" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm">Each Section on Its Own Page</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Each section starts on a new page. Best for longer worksheets or when distributing sections separately.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* W9 / G12 — Answer key add-on. Off by default. Visible in both
              student and teacher views; the answer-key page itself is
              watermarked TEACHER ONLY at the top. */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Add-ons</Label>
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                includeAnswerKey ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                aria-label="Include teacher answer-key page"
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-sm">Append answer-key page</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adds a teacher-only answer key after the worksheet (per-question marks, distractor diagnoses, procedural-activity solutions). Print on yellow paper if handing out.
                </p>
              </div>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
