/**
 * PupilDocumentsPanel — CV / Personal Statement / Cover Letter builder.
 *
 * Used in two modes:
 *   1. Parent Portal (mode="parent"): parent is authenticated via the pupil's
 *      access code, passed through fetch via the X-Parent-Code header. Full
 *      edit + AI assist.
 *   2. Teacher Pupils page (mode="teacher"): read-only list + preview. Teachers
 *      do not edit pupil CVs — they only view.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText, Briefcase, Mail, Sparkles, Plus, Trash2, Save, Loader2,
  Download, Printer, Eye,
} from "lucide-react";
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";

export type DocType = "cv" | "personal_statement" | "cover_letter";

export interface PupilDocument {
  id: string;
  pupilId: string;
  schoolId: string | null;
  docType: DocType;
  title: string;
  fields: Record<string, any>;
  content: string;
  updatedBy: string | null;
  updatedByRole: "parent" | "teacher";
  createdAt: string;
  updatedAt: string;
}

interface Props {
  pupilId: string;
  pupilName?: string;
  yearGroup?: string;
  schoolName?: string;
  /** "parent" uses X-Parent-Code auth; "teacher" uses normal cookie session. */
  mode: "parent" | "teacher";
  /** Required when mode === "parent". */
  parentCode?: string;
}

function authFetch(url: string, init: RequestInit = {}, mode: "parent" | "teacher", parentCode?: string) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (mode === "parent" && parentCode) headers.set("X-Parent-Code", parentCode);
  return fetch(url, { ...init, headers, credentials: "include" });
}

const DOC_LABELS: Record<DocType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  cv:                  { label: "CV",                 icon: FileText,  color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  personal_statement:  { label: "Personal Statement", icon: Briefcase, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  cover_letter:        { label: "Cover Letter",       icon: Mail,      color: "text-amber-700 bg-amber-50 border-amber-200" },
};

function EmptyBlock({ onCreate, readOnly }: { onCreate: (t: DocType) => void; readOnly: boolean }) {
  return (
    <Card className="border-dashed border-border/50">
      <CardContent className="p-6 text-center">
        <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
        <h3 className="font-semibold text-foreground text-sm">No documents yet</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {readOnly
            ? "The parent has not created any CVs, personal statements, or cover letters yet."
            : "Build a professional CV, personal statement, or cover letter with AI assistance."}
        </p>
        {!readOnly && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {(Object.keys(DOC_LABELS) as DocType[]).map(t => {
              const Icon = DOC_LABELS[t].icon;
              return (
                <Button key={t} size="sm" variant="outline" onClick={() => onCreate(t)}>
                  <Icon className="w-4 h-4 mr-1.5" />
                  New {DOC_LABELS[t].label}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── CV form ─────────────────────────────────────────────────────────────────
function CVEditor({ fields, setFields }: { fields: any; setFields: (f: any) => void }) {
  const set = (k: string, v: any) => setFields({ ...fields, [k]: v });
  const workExp = Array.isArray(fields.workExperience) ? fields.workExperience : [];
  const achievements = Array.isArray(fields.achievements) ? fields.achievements : [];
  const skills = Array.isArray(fields.skills) ? fields.skills : [];

  return (
    <div className="space-y-3 text-sm">
      <div>
        <Label className="text-xs">Personal Summary</Label>
        <Textarea rows={3} value={fields.personalSummary || ""} onChange={e => set("personalSummary", e.target.value)}
          placeholder="e.g. Year 11 student passionate about computer science, with a strong track record in maths and IT competitions." />
      </div>
      <div>
        <Label className="text-xs">Skills (one per line)</Label>
        <Textarea rows={4} value={skills.join("\n")} onChange={e => set("skills", e.target.value.split("\n").filter(Boolean))}
          placeholder={"Python programming\nTeam leadership\nPublic speaking"} />
      </div>
      <div>
        <Label className="text-xs">Achievements (one per line)</Label>
        <Textarea rows={4} value={achievements.join("\n")} onChange={e => set("achievements", e.target.value.split("\n").filter(Boolean))}
          placeholder={"School council representative 2024\nBronze Duke of Edinburgh Award\n2nd place, UK Maths Challenge"} />
      </div>
      <div>
        <Label className="text-xs">Work Experience</Label>
        <div className="space-y-2">
          {workExp.map((w: any, i: number) => (
            <div key={i} className="border rounded-lg p-2 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <Input placeholder="Role" value={w.role || ""} onChange={e => {
                  const next = [...workExp]; next[i] = { ...next[i], role: e.target.value }; set("workExperience", next);
                }} />
                <Input placeholder="Organisation" value={w.organisation || ""} onChange={e => {
                  const next = [...workExp]; next[i] = { ...next[i], organisation: e.target.value }; set("workExperience", next);
                }} />
              </div>
              <Input placeholder="Dates (e.g. Jul 2024 – Aug 2024)" value={w.dates || ""} onChange={e => {
                const next = [...workExp]; next[i] = { ...next[i], dates: e.target.value }; set("workExperience", next);
              }} />
              <Textarea rows={2} placeholder="Brief description of what you did" value={w.description || ""} onChange={e => {
                const next = [...workExp]; next[i] = { ...next[i], description: e.target.value }; set("workExperience", next);
              }} />
              <Button variant="ghost" size="sm" className="text-red-600 h-7 text-xs" onClick={() => {
                const next = [...workExp]; next.splice(i, 1); set("workExperience", next);
              }}><Trash2 className="w-3.5 h-3.5 mr-1" />Remove</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set("workExperience", [...workExp, { role: "", organisation: "", dates: "", description: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Add work experience
          </Button>
        </div>
      </div>
      <div>
        <Label className="text-xs">Interests</Label>
        <Input value={fields.interests || ""} onChange={e => set("interests", e.target.value)} placeholder="e.g. Football, creative writing, volunteering" />
      </div>
      <div>
        <Label className="text-xs">References</Label>
        <Input value={fields.references || ""} onChange={e => set("references", e.target.value)} placeholder="Leave blank for 'Available on request'" />
      </div>
    </div>
  );
}

// ─── Personal Statement form ─────────────────────────────────────────────────
function PSEditor({ fields, setFields }: { fields: any; setFields: (f: any) => void }) {
  const set = (k: string, v: any) => setFields({ ...fields, [k]: v });
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Target</Label>
          <Select value={fields.target || "sixth_form"} onValueChange={v => set("target", v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ucas">UCAS University</SelectItem>
              <SelectItem value="sixth_form">Sixth-form application</SelectItem>
              <SelectItem value="apprenticeship">Apprenticeship</SelectItem>
              <SelectItem value="transition">Year 6 → Secondary transition</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Course / Role / Setting</Label>
          <Input value={fields.targetDetail || ""} onChange={e => set("targetDetail", e.target.value)} placeholder="e.g. BSc Computer Science" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Why this matters to me</Label>
        <Textarea rows={3} value={fields.motivation || ""} onChange={e => set("motivation", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Relevant achievements</Label>
        <Textarea rows={3} value={fields.achievements || ""} onChange={e => set("achievements", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Relevant experience</Label>
        <Textarea rows={3} value={fields.experience || ""} onChange={e => set("experience", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Future goals</Label>
        <Textarea rows={2} value={fields.goals || ""} onChange={e => set("goals", e.target.value)} />
      </div>
    </div>
  );
}

// ─── Cover Letter form ───────────────────────────────────────────────────────
function CoverEditor({ fields, setFields }: { fields: any; setFields: (f: any) => void }) {
  const set = (k: string, v: any) => setFields({ ...fields, [k]: v });
  const skills = Array.isArray(fields.skills) ? fields.skills : [];
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Role applied for</Label>
          <Input value={fields.role || ""} onChange={e => set("role", e.target.value)} placeholder="e.g. Work experience — Vet's assistant" />
        </div>
        <div>
          <Label className="text-xs">Organisation</Label>
          <Input value={fields.organisation || ""} onChange={e => set("organisation", e.target.value)} placeholder="e.g. Broadway Veterinary Practice" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Addressed to</Label>
        <Input value={fields.addressee || ""} onChange={e => set("addressee", e.target.value)} placeholder="e.g. Ms Jones — leave blank for 'Hiring Manager'" />
      </div>
      <div>
        <Label className="text-xs">Why I want this role</Label>
        <Textarea rows={3} value={fields.motivation || ""} onChange={e => set("motivation", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Relevant experience</Label>
        <Textarea rows={3} value={fields.relevantExperience || ""} onChange={e => set("relevantExperience", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Skills (one per line)</Label>
        <Textarea rows={3} value={skills.join("\n")} onChange={e => set("skills", e.target.value.split("\n").filter(Boolean))} />
      </div>
      <div>
        <Label className="text-xs">Closing note</Label>
        <Input value={fields.closing || ""} onChange={e => set("closing", e.target.value)} placeholder="e.g. Available weekdays after 4pm" />
      </div>
    </div>
  );
}

// ─── Rendered preview (markdown/plain → styled HTML) ─────────────────────────
function renderContent(docType: DocType, content: string): string {
  if (!content) return `<p class="text-muted-foreground italic">No content yet — click 'Generate with AI' or write manually.</p>`;
  if (docType === "cv") {
    // Minimal markdown: ## headings, **bold**, *italic*, - bullets
    return content
      .replace(/^## (.+)$/gm, `<h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#065f46;border-bottom:1.5px solid #065f46;margin-top:14px;margin-bottom:6px;padding-bottom:2px">$1</h2>`)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^[-•]\s+(.+)$/gm, `<li style="margin-left:18px;list-style:disc;margin-bottom:2px">$1</li>`)
      .replace(/\n{2,}/g, `</p><p style="margin:4px 0;font-size:12px;line-height:1.5">`)
      .replace(/^/, `<div style="font-family:'Inter',sans-serif;color:#111;max-width:720px;margin:0 auto;padding:24px 32px;background:white"><p style="margin:4px 0;font-size:12px;line-height:1.5">`)
      .replace(/$/, `</p></div>`);
  }
  // Personal statement & cover letter: plain prose → paragraphs
  const escaped = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="font-family:'Inter',sans-serif;color:#111;max-width:720px;margin:0 auto;padding:28px 36px;background:white;font-size:12.5px;line-height:1.65;white-space:pre-wrap">${escaped}</div>`;
}

export default function PupilDocumentsPanel({
  pupilId, pupilName, yearGroup, schoolName, mode, parentCode,
}: Props) {
  const readOnly = mode === "teacher";
  const [docs, setDocs] = useState<PupilDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<PupilDocument | null>(null);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/pupil-documents/${pupilId}`, {}, mode, parentCode);
      if (res.ok) {
        const data = await res.json();
        setDocs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [pupilId]);

  const createDoc = async (docType: DocType) => {
    const title = docType === "cv" ? `${pupilName || "Pupil"} — CV`
      : docType === "personal_statement" ? `${pupilName || "Pupil"} — Personal Statement`
      : `${pupilName || "Pupil"} — Cover Letter`;
    const res = await authFetch(`/api/pupil-documents/${pupilId}`, {
      method: "POST",
      body: JSON.stringify({ docType, title, fields: {}, content: "" }),
    }, mode, parentCode);
    if (!res.ok) { toast.error("Could not create document."); return; }
    const doc = await res.json();
    setDocs([doc, ...docs]);
    setActive(doc);
    setEditing(true);
  };

  const saveDoc = async () => {
    if (!active) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/pupil-documents/${pupilId}/${active.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: active.title, fields: active.fields, content: active.content }),
      }, mode, parentCode);
      if (!res.ok) throw new Error("save failed");
      const doc = await res.json();
      setDocs(prev => prev.map(d => d.id === doc.id ? doc : d));
      setActive(doc);
      toast.success("Saved.");
    } catch { toast.error("Save failed — please try again."); }
    setSaving(false);
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const res = await authFetch(`/api/pupil-documents/${pupilId}/${id}`, { method: "DELETE" }, mode, parentCode);
    if (!res.ok) { toast.error("Delete failed."); return; }
    setDocs(prev => prev.filter(d => d.id !== id));
    if (active?.id === id) { setActive(null); setEditing(false); }
  };

  const generateWithAI = async () => {
    if (!active) return;
    setGenerating(true);
    try {
      const endpoint = active.docType === "cv" ? "/api/ai/cv"
        : active.docType === "personal_statement" ? "/api/ai/personal-statement"
        : "/api/ai/cover-letter";
      const payload = {
        ...active.fields,
        pupilName: pupilName || (active.fields?.pupilName || ""),
        yearGroup: yearGroup || (active.fields?.yearGroup || ""),
        schoolName: schoolName || (active.fields?.schoolName || ""),
      };
      const res = await authFetch(endpoint, { method: "POST", body: JSON.stringify(payload) }, mode, parentCode);
      if (!res.ok) throw new Error("ai failed");
      const { content } = await res.json();
      setActive({ ...active, content });
      toast.success("Drafted with AI — review, edit, and save.");
    } catch { toast.error("AI generation failed — please try again."); }
    setGenerating(false);
  };

  const downloadPdf = async () => {
    if (!previewRef.current || !active) return;
    try {
      await downloadHtmlAsPdf(previewRef.current, `${active.title.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF downloaded.");
    } catch { toast.error("PDF generation failed."); }
  };

  const printDoc = () => {
    if (!previewRef.current || !active) return;
    printWorksheetElement(previewRef.current, { title: active.title });
  };

  const grouped = useMemo(() => {
    const m: Record<DocType, PupilDocument[]> = { cv: [], personal_statement: [], cover_letter: [] };
    for (const d of docs) (m[d.docType] ||= []).push(d);
    return m;
  }, [docs]);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!active) {
    if (docs.length === 0) {
      return <EmptyBlock onCreate={createDoc} readOnly={readOnly} />;
    }
    return (
      <div className="space-y-3">
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DOC_LABELS) as DocType[]).map(t => {
              const Icon = DOC_LABELS[t].icon;
              return (
                <Button key={t} size="sm" variant="outline" onClick={() => createDoc(t)}>
                  <Icon className="w-4 h-4 mr-1.5" />
                  New {DOC_LABELS[t].label}
                </Button>
              );
            })}
          </div>
        )}
        {(Object.keys(grouped) as DocType[]).map(t => grouped[t].length > 0 && (
          <div key={t}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 mt-3">{DOC_LABELS[t].label}</p>
            <div className="space-y-1.5">
              {grouped[t].map(d => (
                <Card key={d.id} className={`border ${DOC_LABELS[t].color} cursor-pointer hover:shadow-sm`} onClick={() => { setActive(d); setEditing(!readOnly); }}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{d.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Updated {new Date(d.updatedAt).toLocaleDateString("en-GB")} · by {d.updatedByRole === "teacher" ? "teacher" : "parent"}</p>
                    </div>
                    {!readOnly && (
                      <Button variant="ghost" size="sm" className="text-red-600 h-7 w-7 p-0" onClick={e => { e.stopPropagation(); deleteDoc(d.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Document editor / viewer ─────────────────────────────────────────────
  const Icon = DOC_LABELS[active.docType].icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setActive(null); setEditing(false); refresh(); }}>
          ← Back
        </Button>
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4" />
          <p className="text-sm font-semibold">{DOC_LABELS[active.docType].label}</p>
        </div>
      </div>

      <Input value={active.title} onChange={e => setActive({ ...active, title: e.target.value })} disabled={readOnly} className="h-9 font-semibold" />

      {!readOnly && editing && (
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Your notes (used to generate the document)</p>
            {active.docType === "cv" && <CVEditor fields={active.fields} setFields={f => setActive({ ...active, fields: f })} />}
            {active.docType === "personal_statement" && <PSEditor fields={active.fields} setFields={f => setActive({ ...active, fields: f })} />}
            {active.docType === "cover_letter" && <CoverEditor fields={active.fields} setFields={f => setActive({ ...active, fields: f })} />}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={generateWithAI} disabled={generating} className="bg-brand hover:bg-brand/90 text-white">
                {generating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Drafting…</> : <><Sparkles className="w-4 h-4 mr-1" />{active.content ? "Regenerate" : "Generate"} with AI</>}
              </Button>
              <Button size="sm" variant="outline" onClick={saveDoc} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-1" />Save</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Document preview</p>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="w-3.5 h-3.5 mr-1" />Full view</Button>
              <Button size="sm" variant="outline" onClick={printDoc}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
              <Button size="sm" variant="outline" onClick={downloadPdf}><Download className="w-3.5 h-3.5 mr-1" />PDF</Button>
            </div>
          </div>
          {!readOnly && (
            <Textarea
              value={active.content}
              onChange={e => setActive({ ...active, content: e.target.value })}
              rows={8}
              className="text-xs font-mono"
              placeholder="Content appears here after AI generation. You can also edit it manually."
            />
          )}
          <div ref={previewRef} className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto bg-white"
            dangerouslySetInnerHTML={{ __html: renderContent(active.docType, active.content) }} />
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{active.title}</DialogTitle></DialogHeader>
          <div dangerouslySetInnerHTML={{ __html: renderContent(active.docType, active.content) }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
