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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Email</Label>
          <Input value={fields.email || ""} onChange={e => set("email", e.target.value)} placeholder="student@email.com" />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input value={fields.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="07..." />
        </div>
        <div>
          <Label className="text-xs">Location</Label>
          <Input value={fields.location || ""} onChange={e => set("location", e.target.value)} placeholder="Town / city" />
        </div>
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

// ─── Rendered preview (FlowCV-inspired printable HTML) ───────────────────────
// FlowCV inspiration: clean, ATS-friendly text structure, strong hierarchy, compact
// first-job/student CV density, and matching CV/cover-letter visual language.
function escapeHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function parseCvSections(content: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current = "Profile";
  sections[current] = [];
  for (const rawLine of content.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = [];
      continue;
    }
    if (line) sections[current].push(line);
  }
  return sections;
}

function cleanBullet(line: string): string {
  return line.replace(/^[-•]\s+/, "").trim();
}

function renderBulletList(lines: string[], colour = "#17324d"): string {
  const items = lines
    .map(cleanBullet)
    .filter(Boolean)
    .map(item => `<li style="margin:0 0 5px 0;padding-left:2px;line-height:1.42">${inlineMarkdown(item)}</li>`)
    .join("");
  return items ? `<ul style="margin:0 0 0 16px;padding:0;color:${colour};font-size:11.5px">${items}</ul>` : "";
}

function renderCvSection(label: string, body: string, compact = false): string {
  if (!body.trim()) return "";
  return `<section style="margin-top:${compact ? "12px" : "14px"}">
    <h2 style="margin:0 0 7px 0;font-size:10px;line-height:1;text-transform:uppercase;letter-spacing:.13em;color:#0f766e;font-weight:900;border-bottom:1px solid #d8eee9;padding-bottom:5px">${escapeHtml(label)}</h2>
    ${body}
  </section>`;
}

function renderContent(docType: DocType, content: string, fields: Record<string, any> = {}, meta: { pupilName?: string; yearGroup?: string; schoolName?: string; title?: string } = {}): string {
  const name = fields.pupilName || meta.pupilName || "Student";
  const year = fields.yearGroup || meta.yearGroup || "";
  const school = fields.schoolName || meta.schoolName || "";
  const contactParts = [fields.email, fields.phone, fields.location].filter(Boolean).map(escapeHtml);

  if (!content) {
    return `<div style="font-family:Inter,Arial,sans-serif;max-width:780px;margin:0 auto;padding:34px;background:#fff;color:#334155;text-align:center;border:1px dashed #cbd5e1">
      <p style="margin:0;font-size:13px;font-style:italic">No content yet — click “Generate with AI” or write manually.</p>
    </div>`;
  }

  if (docType === "cv") {
    const sections = parseCvSections(content);
    const profile = (sections.Profile || []).filter(l => !/^[-•]/.test(l)).join(" ");
    const skills = sections.Skills || [];
    const experience = sections.Experience || [];
    const education = sections.Education || [];
    const achievements = sections.Achievements || [];
    const interests = sections.Interests || [];
    const references = sections.References || [];

    const experienceHtml = experience.map(line => {
      if (/^[-•]/.test(line)) return `<div style="margin-left:12px;color:#334155;font-size:11.5px;line-height:1.42">• ${inlineMarkdown(cleanBullet(line))}</div>`;
      return `<p style="margin:7px 0 3px 0;font-size:11.8px;line-height:1.35;color:#0f172a">${inlineMarkdown(line)}</p>`;
    }).join("");

    return `<article style="font-family:Inter,Arial,sans-serif;max-width:794px;margin:0 auto;background:#fff;color:#0f172a;box-shadow:0 0 0 1px #e5e7eb;min-height:1123px">
      <header style="display:grid;grid-template-columns:1.1fr .9fr;background:#17324d;color:white">
        <div style="padding:34px 34px 26px 34px">
          <h1 style="margin:0;font-size:30px;line-height:1.02;letter-spacing:-.04em;font-weight:900">${escapeHtml(name)}</h1>
          <p style="margin:8px 0 0 0;font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#b7d7e8;font-weight:800">${escapeHtml([year, school].filter(Boolean).join(" · ") || "Student CV")}</p>
        </div>
        <div style="padding:34px 34px 26px 24px;background:#0f766e;color:#ecfeff;font-size:11px;line-height:1.7">
          <div style="text-transform:uppercase;letter-spacing:.14em;font-size:9px;font-weight:900;color:#ccfbf1;margin-bottom:6px">Contact</div>
          ${contactParts.length ? contactParts.map(p => `<div>${p}</div>`).join("") : `<div>Contact details available on request</div>`}
        </div>
      </header>
      <div style="display:grid;grid-template-columns:34% 66%;gap:0">
        <aside style="padding:26px 24px 30px 34px;background:#f8fafc;border-right:1px solid #e5e7eb">
          ${renderCvSection("Skills", renderBulletList(skills), true)}
          ${renderCvSection("Achievements", renderBulletList(achievements), true)}
          ${renderCvSection("Interests", `<p style="margin:0;color:#334155;font-size:11.5px;line-height:1.5">${inlineMarkdown(interests.map(cleanBullet).join(" "))}</p>`, true)}
          ${renderCvSection("References", `<p style="margin:0;color:#334155;font-size:11.5px;line-height:1.5">${inlineMarkdown(references.map(cleanBullet).join(" ") || "Available on request")}</p>`, true)}
        </aside>
        <main style="padding:26px 34px 30px 28px">
          ${renderCvSection("Profile", `<p style="margin:0;color:#1f2937;font-size:12.2px;line-height:1.55">${inlineMarkdown(profile)}</p>`)}
          ${renderCvSection("Experience", experienceHtml || `<p style="margin:0;color:#64748b;font-size:11.5px;line-height:1.5">Add work experience, volunteering, school responsibilities or projects here.</p>`)}
          ${renderCvSection("Education", education.map(l => `<p style="margin:0 0 5px 0;color:#1f2937;font-size:11.8px;line-height:1.45">${inlineMarkdown(cleanBullet(l))}</p>`).join(""))}
        </main>
      </div>
    </article>`;
  }

  const escaped = escapeHtml(content);
  const paragraphs = escaped.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  if (docType === "cover_letter") {
    return `<article style="font-family:Inter,Arial,sans-serif;max-width:794px;margin:0 auto;background:white;color:#111827;box-shadow:0 0 0 1px #e5e7eb;min-height:1123px;padding:46px 58px">
      <header style="border-bottom:3px solid #17324d;padding-bottom:18px;margin-bottom:28px">
        <h1 style="margin:0;font-size:24px;line-height:1.05;font-weight:900;letter-spacing:-.03em;color:#17324d">${escapeHtml(name)}</h1>
        <p style="margin:7px 0 0 0;font-size:11px;color:#475569;letter-spacing:.08em;text-transform:uppercase">${escapeHtml([year, school, ...contactParts].filter(Boolean).join(" · "))}</p>
      </header>
      <div style="font-size:12.5px;line-height:1.72;white-space:pre-wrap;color:#1f2937">${paragraphs.map(p => `<p style="margin:0 0 13px 0">${p}</p>`).join("")}</div>
    </article>`;
  }

  const charCount = content.length;
  return `<article style="font-family:Inter,Arial,sans-serif;max-width:794px;margin:0 auto;background:white;color:#111827;box-shadow:0 0 0 1px #e5e7eb;min-height:1123px">
    <header style="padding:36px 54px 24px 54px;background:linear-gradient(135deg,#eef2ff,#f8fafc);border-bottom:1px solid #e2e8f0">
      <p style="margin:0 0 7px 0;font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#4f46e5;font-weight:900">Personal Statement</p>
      <h1 style="margin:0;font-size:26px;line-height:1.05;font-weight:900;letter-spacing:-.035em;color:#1e1b4b">${escapeHtml(name)}</h1>
      <p style="margin:8px 0 0 0;color:#475569;font-size:11.5px">${escapeHtml([year, fields.targetDetail, fields.target].filter(Boolean).join(" · "))}</p>
    </header>
    <main style="padding:34px 58px 46px 58px;font-size:13px;line-height:1.78;color:#1f2937">
      ${paragraphs.map(p => `<p style="margin:0 0 15px 0">${p}</p>`).join("")}
      <div style="margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;color:#64748b;font-size:10.5px;text-transform:uppercase;letter-spacing:.12em">${charCount.toLocaleString()} characters</div>
    </main>
  </article>`;
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
            dangerouslySetInnerHTML={{ __html: renderContent(active.docType, active.content, active.fields, { pupilName, yearGroup, schoolName, title: active.title }) }} />
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{active.title}</DialogTitle></DialogHeader>
          <div dangerouslySetInnerHTML={{ __html: renderContent(active.docType, active.content, active.fields, { pupilName, yearGroup, schoolName, title: active.title }) }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
