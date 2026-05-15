/**
 * EvidencePackDialog — FEAT-6 (EHCP/IEP Evidence Tagger + Export Evidence Pack)
 *
 * One dialog that does three things, in this order, so the SENCO/teacher
 * never has to leave the worksheets flow:
 *
 *   1. Pick a pupil.
 *   2. Quick-edit that pupil's EHCP outcomes and IEP targets (one-per-line,
 *      stored locally via AppContext.updateChild, persisted in localStorage).
 *   3. Click "Export Evidence Pack" — opens a printable HTML window of every
 *      worksheet tagged for this pupil, grouped by outcome / target.
 *
 * The dialog is owned by Worksheets.tsx and gated behind an "Export Evidence
 * Pack" button, so it costs zero render until the user opens it.
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Save, Printer, UserCircle2, Target, ListChecks } from "lucide-react";
import { useApp, type Child } from "@/contexts/AppContext";
import { openEvidencePackWindow } from "@/lib/evidence-tagger";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected pupil id (e.g. from PupilScope). */
  initialChildId?: string;
}

function joinLines(arr?: string[]): string {
  return Array.isArray(arr) ? arr.filter(Boolean).join("\n") : "";
}

function splitLines(text: string): string[] {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

export function EvidencePackDialog({ open, onOpenChange, initialChildId }: Props) {
  const { children, worksheetHistory, updateChild } = useApp();
  const [selectedId, setSelectedId] = useState<string>(initialChildId || "");
  const [ehcpText, setEhcpText] = useState("");
  const [iepText, setIepText] = useState("");
  const [saving, setSaving] = useState(false);

  // Re-sync when dialog opens or pupil changes
  useEffect(() => {
    if (!open) return;
    const id = initialChildId || selectedId || (children[0]?.id ?? "");
    setSelectedId(id);
  }, [open, initialChildId]);

  const selectedChild: Child | undefined = useMemo(
    () => children.find(c => c.id === selectedId),
    [children, selectedId],
  );

  // When the selected pupil changes, populate the textareas from their record.
  useEffect(() => {
    if (selectedChild) {
      setEhcpText(joinLines(selectedChild.ehcpOutcomes));
      setIepText(joinLines(selectedChild.iepTargets));
    } else {
      setEhcpText("");
      setIepText("");
    }
  }, [selectedChild?.id]);

  const taggedCount = useMemo(() => {
    if (!selectedChild) return 0;
    return worksheetHistory.filter(ws => {
      const ev = (ws.metadata as any)?.evidenceTags;
      return ev && ev.pupilContextChildId === selectedChild.id;
    }).length;
  }, [selectedChild?.id, worksheetHistory]);

  const handleSave = async () => {
    if (!selectedChild) return;
    setSaving(true);
    try {
      await updateChild(selectedChild.id, {
        ehcpOutcomes: splitLines(ehcpText),
        iepTargets: splitLines(iepText),
      });
      toast.success("Outcomes and targets saved.");
    } catch (e: any) {
      toast.error(e?.message || "Could not save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!selectedChild) {
      toast.error("Pick a pupil first.");
      return;
    }
    // Save before exporting so the latest edits are reflected in the pack.
    const next: Child = {
      ...selectedChild,
      ehcpOutcomes: splitLines(ehcpText),
      iepTargets: splitLines(iepText),
    };
    openEvidencePackWindow(next, worksheetHistory);
  };

  const noChildren = children.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand" />
            SEND Evidence Pack
          </DialogTitle>
        </DialogHeader>

        {noChildren ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <UserCircle2 className="w-12 h-12 mx-auto mb-2 text-muted-foreground/40" />
            <p>Add a pupil from <strong>My Pupils</strong> first to start tagging worksheet evidence.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">
                Pupil
              </Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue placeholder="Pick a pupil..." /></SelectTrigger>
                <SelectContent>
                  {children.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.yearGroup ? ` — ${c.yearGroup}` : ""}
                      {c.sendNeeds && c.sendNeeds.length > 0 ? ` · ${c.sendNeeds.join(", ")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedChild && (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {(selectedChild.ehcpOutcomes || []).length} EHCP outcome{(selectedChild.ehcpOutcomes || []).length === 1 ? "" : "s"}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {(selectedChild.iepTargets || []).length} IEP target{(selectedChild.iepTargets || []).length === 1 ? "" : "s"}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {taggedCount} tagged worksheet{taggedCount === 1 ? "" : "s"}
                  </Badge>
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    <Target className="w-3 h-3" /> EHCP outcomes <span className="normal-case font-normal">(one per line)</span>
                  </Label>
                  <Textarea
                    value={ehcpText}
                    onChange={e => setEhcpText(e.target.value)}
                    rows={4}
                    placeholder={"e.g. Communication: respond to 2-step verbal instructions in class\nLiteracy: read and decode CVC words confidently"}
                    className="text-sm font-mono"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    <ListChecks className="w-3 h-3" /> IEP targets <span className="normal-case font-normal">(one per line)</span>
                  </Label>
                  <Textarea
                    value={iepText}
                    onChange={e => setIepText(e.target.value)}
                    rows={4}
                    placeholder={"e.g. Read 50 high-frequency words by July\nWrite a sentence with capital letter and full stop"}
                    className="text-sm font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
                  <Button variant="outline" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-1.5" /> {saving ? "Saving..." : "Save outcomes & targets"}
                  </Button>
                  <Button onClick={handleExport} disabled={!selectedChild}>
                    <Printer className="w-4 h-4 mr-1.5" /> Export Evidence Pack
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Worksheets generated while this pupil is selected (via the global pupil scope)
                  are auto-tagged against these outcomes by keyword overlap. The exported pack
                  groups every tagged worksheet under each outcome — drop-in for Annual Reviews.
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EvidencePackDialog;
