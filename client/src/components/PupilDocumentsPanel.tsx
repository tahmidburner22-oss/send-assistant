/**
 * PupilDocumentsPanel — CV / Personal Statement / Cover Letter builder.
 *
 * Used in two modes:
 *   1. Parent Portal (mode="parent"): parent is authenticated via the pupil's
 *      access code, passed through fetch via the X-Parent-Code header. Full
 *      edit + AI assist + upload-existing-CV.
 *   2. Teacher Pupils page (mode="teacher"): read-only list + preview. Teachers
 *      do not edit pupil CVs — they only view.
 *
 * Resume.org-style flow:
 *   - User picks a template from a gallery (6 free designs inspired by Canva,
 *     FlowCV and Resume.org).
 *   - User can upload an existing CV (PDF/DOCX) and have it auto-filled.
 *   - User can manually fill in: Personal Bio, Education, Work Experience,
 *     Skills, Languages, References.
 *   - Live preview updates as the user types — AI is optional polish.
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
  Download, Printer, Eye, Upload, Layout, Check,
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
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (mode === "parent" && parentCode) headers.set("X-Parent-Code", parentCode);
  return fetch(url, { ...init, headers, credentials: "include" });
}

const DOC_LABELS: Record<DocType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  cv:                  { label: "CV",                 icon: FileText,  color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  personal_statement:  { label: "Personal Statement", icon: Briefcase, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  cover_letter:        { label: "Cover Letter",       icon: Mail,      color: "text-amber-700 bg-amber-50 border-amber-200" },
};

// ─── CV Templates ────────────────────────────────────────────────────────────
// Six free, ATS-friendly designs. Inspired by the popular layouts published on
// Canva, FlowCV and Resume.org — re-implemented here as plain HTML/CSS so they
// work in print, in PDF export, and across browsers without external assets.

type TemplateId = "classic" | "modern" | "minimal" | "professional" | "creative" | "compact";

interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  /** 1×1 SVG thumbnail summarising the layout. */
  thumb: string;
}

const CV_TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Two-tone navy + teal header with sidebar.",
    thumb:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#fff"/><rect width="60" height="22" fill="#17324d"/><rect x="36" width="24" height="22" fill="#0f766e"/><rect x="0" y="22" width="22" height="58" fill="#f1f5f9"/><rect x="4" y="28" width="14" height="2" fill="#0f766e"/><rect x="4" y="33" width="14" height="1" fill="#94a3b8"/><rect x="4" y="36" width="12" height="1" fill="#94a3b8"/><rect x="26" y="28" width="14" height="2" fill="#17324d"/><rect x="26" y="33" width="30" height="1" fill="#94a3b8"/><rect x="26" y="36" width="30" height="1" fill="#94a3b8"/><rect x="26" y="39" width="26" height="1" fill="#94a3b8"/></svg>`,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Single column with bold blue accent stripe.",
    thumb:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#fff"/><rect x="0" y="6" width="4" height="68" fill="#2563eb"/><rect x="10" y="8" width="32" height="4" fill="#0f172a"/><rect x="10" y="14" width="22" height="2" fill="#64748b"/><rect x="10" y="22" width="40" height="1" fill="#94a3b8"/><rect x="10" y="25" width="40" height="1" fill="#94a3b8"/><rect x="10" y="32" width="14" height="2" fill="#2563eb"/><rect x="10" y="36" width="40" height="1" fill="#94a3b8"/><rect x="10" y="39" width="40" height="1" fill="#94a3b8"/><rect x="10" y="46" width="14" height="2" fill="#2563eb"/><rect x="10" y="50" width="40" height="1" fill="#94a3b8"/></svg>`,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Black & white, maximum ATS compatibility.",
    thumb:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#fff"/><rect x="6" y="8" width="36" height="3" fill="#111"/><rect x="6" y="13" width="48" height="0.6" fill="#111"/><rect x="6" y="14" width="20" height="1" fill="#444"/><rect x="6" y="22" width="14" height="2" fill="#111"/><rect x="6" y="26" width="48" height="1" fill="#444"/><rect x="6" y="29" width="48" height="1" fill="#444"/><rect x="6" y="36" width="14" height="2" fill="#111"/><rect x="6" y="40" width="48" height="1" fill="#444"/><rect x="6" y="43" width="48" height="1" fill="#444"/><rect x="6" y="50" width="14" height="2" fill="#111"/><rect x="6" y="54" width="48" height="1" fill="#444"/></svg>`,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Centered serif name, traditional and formal.",
    thumb:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#fff"/><rect x="18" y="8" width="24" height="3" fill="#1e293b"/><rect x="14" y="13" width="32" height="1" fill="#64748b"/><rect x="6" y="18" width="48" height="0.5" fill="#1e293b"/><rect x="6" y="19" width="48" height="0.5" fill="#1e293b"/><rect x="6" y="24" width="14" height="2" fill="#1e293b"/><rect x="6" y="28" width="48" height="1" fill="#64748b"/><rect x="6" y="31" width="48" height="1" fill="#64748b"/><rect x="6" y="38" width="14" height="2" fill="#1e293b"/><rect x="6" y="42" width="48" height="1" fill="#64748b"/></svg>`,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Dark sidebar with name, modern Canva-style.",
    thumb:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#fff"/><rect width="22" height="80" fill="#1e1b4b"/><rect x="3" y="8" width="16" height="3" fill="#fff"/><rect x="3" y="13" width="14" height="1" fill="#a5b4fc"/><rect x="3" y="22" width="10" height="1.5" fill="#a5b4fc"/><rect x="3" y="26" width="16" height="1" fill="#cbd5e1"/><rect x="3" y="29" width="16" height="1" fill="#cbd5e1"/><rect x="3" y="36" width="10" height="1.5" fill="#a5b4fc"/><rect x="3" y="40" width="16" height="1" fill="#cbd5e1"/><rect x="26" y="8" width="14" height="2" fill="#1e1b4b"/><rect x="26" y="14" width="30" height="1" fill="#94a3b8"/><rect x="26" y="22" width="14" height="2" fill="#4f46e5"/><rect x="26" y="26" width="30" height="1" fill="#94a3b8"/><rect x="26" y="29" width="30" height="1" fill="#94a3b8"/><rect x="26" y="36" width="14" height="2" fill="#4f46e5"/><rect x="26" y="40" width="30" height="1" fill="#94a3b8"/></svg>`,
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense two-column — fits more on one page.",
    thumb:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#fff"/><rect x="4" y="6" width="52" height="6" fill="#0f172a"/><rect x="4" y="16" width="22" height="2" fill="#0f766e"/><rect x="4" y="20" width="22" height="1" fill="#64748b"/><rect x="4" y="22" width="22" height="1" fill="#64748b"/><rect x="4" y="24" width="22" height="1" fill="#64748b"/><rect x="4" y="30" width="22" height="2" fill="#0f766e"/><rect x="4" y="34" width="22" height="1" fill="#64748b"/><rect x="30" y="16" width="22" height="2" fill="#0f766e"/><rect x="30" y="20" width="22" height="1" fill="#64748b"/><rect x="30" y="22" width="22" height="1" fill="#64748b"/><rect x="30" y="30" width="22" height="2" fill="#0f766e"/><rect x="30" y="34" width="22" height="1" fill="#64748b"/></svg>`,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function escapeHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
function cleanBullet(line: string): string { return line.replace(/^[-•]\s+/, "").trim(); }
function asArray<T>(v: any): T[] { return Array.isArray(v) ? v : []; }

function parseCvSections(content: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current = "Profile";
  sections[current] = [];
  for (const rawLine of (content || "").replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) { current = heading[1].trim(); sections[current] = []; continue; }
    if (line) sections[current].push(line);
  }
  return sections;
}

// ─── CV form ─────────────────────────────────────────────────────────────────
function CVEditor({ fields, setFields }: { fields: any; setFields: (f: any) => void }) {
  const set = (k: string, v: any) => setFields({ ...fields, [k]: v });
  const workExp = asArray<any>(fields.workExperience);
  const education = asArray<any>(fields.education);
  const languages = asArray<any>(fields.languages);
  const achievements = asArray<string>(fields.achievements);
  const skills = asArray<string>(fields.skills);

  return (
    <div className="space-y-4 text-sm">
      {/* Personal bio */}
      <section>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Personal Bio</h4>
        <div>
          <Label className="text-xs">Personal summary</Label>
          <Textarea rows={3} value={fields.personalSummary || ""} onChange={e => set("personalSummary", e.target.value)}
            placeholder="e.g. Year 11 student passionate about computer science, with a strong track record in maths and IT competitions." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <div><Label className="text-xs">Email</Label><Input value={fields.email || ""} onChange={e => set("email", e.target.value)} placeholder="student@email.com" /></div>
          <div><Label className="text-xs">Phone</Label><Input value={fields.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="07..." /></div>
          <div><Label className="text-xs">Location</Label><Input value={fields.location || ""} onChange={e => set("location", e.target.value)} placeholder="Town / city" /></div>
        </div>
      </section>

      {/* Education */}
      <section>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Education</h4>
        <div className="space-y-2">
          {education.map((e: any, i: number) => (
            <div key={i} className="border rounded-lg p-2 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <Input placeholder="School / college" value={e.school || ""} onChange={ev => {
                  const next = [...education]; next[i] = { ...next[i], school: ev.target.value }; set("education", next);
                }} />
                <Input placeholder="Qualification (e.g. GCSEs)" value={e.qualification || ""} onChange={ev => {
                  const next = [...education]; next[i] = { ...next[i], qualification: ev.target.value }; set("education", next);
                }} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input placeholder="Dates (e.g. 2022 – 2025)" value={e.dates || ""} onChange={ev => {
                  const next = [...education]; next[i] = { ...next[i], dates: ev.target.value }; set("education", next);
                }} />
                <Input placeholder="Grades (e.g. 9–7 incl. Maths 9, English 8)" value={e.grades || ""} onChange={ev => {
                  const next = [...education]; next[i] = { ...next[i], grades: ev.target.value }; set("education", next);
                }} />
              </div>
              <Button variant="ghost" size="sm" className="text-red-600 h-7 text-xs" onClick={() => {
                const next = [...education]; next.splice(i, 1); set("education", next);
              }}><Trash2 className="w-3.5 h-3.5 mr-1" />Remove</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set("education", [...education, { school: "", qualification: "", dates: "", grades: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Add education
          </Button>
        </div>
      </section>

      {/* Work experience */}
      <section>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Work Experience</h4>
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
      </section>

      {/* Skills */}
      <section>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Skills</h4>
        <Textarea rows={4} value={skills.join("\n")} onChange={e => set("skills", e.target.value.split("\n").filter(Boolean))}
          placeholder={"Python programming\nTeam leadership\nPublic speaking"} />
      </section>

      {/* Languages */}
      <section>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Languages</h4>
        <div className="space-y-2">
          {languages.map((l: any, i: number) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
              <Input placeholder="Language (e.g. Spanish)" value={l.language || ""} onChange={e => {
                const next = [...languages]; next[i] = { ...next[i], language: e.target.value }; set("languages", next);
              }} />
              <Select value={l.level || ""} onValueChange={v => {
                const next = [...languages]; next[i] = { ...next[i], level: v }; set("languages", next);
              }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Native">Native</SelectItem>
                  <SelectItem value="Fluent">Fluent</SelectItem>
                  <SelectItem value="Conversational">Conversational</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="text-red-600 h-9 w-9 p-0" onClick={() => {
                const next = [...languages]; next.splice(i, 1); set("languages", next);
              }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set("languages", [...languages, { language: "", level: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Add language
          </Button>
        </div>
      </section>

      {/* Achievements + Interests */}
      <section>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Achievements &amp; Interests</h4>
        <div>
          <Label className="text-xs">Achievements (one per line)</Label>
          <Textarea rows={3} value={achievements.join("\n")} onChange={e => set("achievements", e.target.value.split("\n").filter(Boolean))}
            placeholder={"School council representative 2024\nBronze Duke of Edinburgh Award\n2nd place, UK Maths Challenge"} />
        </div>
        <div className="mt-2">
          <Label className="text-xs">Interests</Label>
          <Input value={fields.interests || ""} onChange={e => set("interests", e.target.value)} placeholder="e.g. Football, creative writing, volunteering" />
        </div>
      </section>

      {/* References */}
      <section>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">References</h4>
        <Textarea rows={2} value={fields.references || ""} onChange={e => set("references", e.target.value)}
          placeholder="Leave blank for 'Available on request', or list a reference (name, role, organisation, email/phone)." />
      </section>
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
      <div><Label className="text-xs">Why this matters to me</Label><Textarea rows={3} value={fields.motivation || ""} onChange={e => set("motivation", e.target.value)} /></div>
      <div><Label className="text-xs">Relevant achievements</Label><Textarea rows={3} value={fields.achievements || ""} onChange={e => set("achievements", e.target.value)} /></div>
      <div><Label className="text-xs">Relevant experience</Label><Textarea rows={3} value={fields.experience || ""} onChange={e => set("experience", e.target.value)} /></div>
      <div><Label className="text-xs">Future goals</Label><Textarea rows={2} value={fields.goals || ""} onChange={e => set("goals", e.target.value)} /></div>
    </div>
  );
}

// ─── Cover Letter form ───────────────────────────────────────────────────────
function CoverEditor({ fields, setFields }: { fields: any; setFields: (f: any) => void }) {
  const set = (k: string, v: any) => setFields({ ...fields, [k]: v });
  const skills = asArray<string>(fields.skills);
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Role applied for</Label><Input value={fields.role || ""} onChange={e => set("role", e.target.value)} placeholder="e.g. Work experience — Vet's assistant" /></div>
        <div><Label className="text-xs">Organisation</Label><Input value={fields.organisation || ""} onChange={e => set("organisation", e.target.value)} placeholder="e.g. Broadway Veterinary Practice" /></div>
      </div>
      <div><Label className="text-xs">Addressed to</Label><Input value={fields.addressee || ""} onChange={e => set("addressee", e.target.value)} placeholder="e.g. Ms Jones — leave blank for 'Hiring Manager'" /></div>
      <div><Label className="text-xs">Why I want this role</Label><Textarea rows={3} value={fields.motivation || ""} onChange={e => set("motivation", e.target.value)} /></div>
      <div><Label className="text-xs">Relevant experience</Label><Textarea rows={3} value={fields.relevantExperience || ""} onChange={e => set("relevantExperience", e.target.value)} /></div>
      <div><Label className="text-xs">Skills (one per line)</Label><Textarea rows={3} value={skills.join("\n")} onChange={e => set("skills", e.target.value.split("\n").filter(Boolean))} /></div>
      <div><Label className="text-xs">Closing note</Label><Input value={fields.closing || ""} onChange={e => set("closing", e.target.value)} placeholder="e.g. Available weekdays after 4pm" /></div>
    </div>
  );
}

// ─── Build a normalised CvData from fields + AI markdown ─────────────────────
interface CvData {
  name: string;
  headline: string;
  contacts: string[];
  profile: string;
  skills: string[];
  experience: Array<{ role: string; organisation: string; dates: string; bullets: string[] }>;
  education: Array<{ school: string; qualification: string; dates: string; grades: string }>;
  languages: Array<{ language: string; level: string }>;
  achievements: string[];
  interests: string;
  references: string;
}

function buildCvData(content: string, fields: Record<string, any>, meta: { pupilName?: string; yearGroup?: string; schoolName?: string }): CvData {
  const sections = parseCvSections(content || "");
  const aiProfile = (sections.Profile || []).filter(l => !/^[-•]/.test(l)).join(" ").trim();
  const aiSkills = (sections.Skills || []).map(cleanBullet).filter(Boolean);
  const aiAchievements = (sections.Achievements || []).map(cleanBullet).filter(Boolean);
  const aiInterests = (sections.Interests || []).map(cleanBullet).join(" ").trim();
  const aiReferences = (sections.References || []).map(cleanBullet).join(" ").trim();
  const aiLanguages = (sections.Languages || []).map(cleanBullet).filter(Boolean);

  // AI experience: split into entries — each "non-bullet" line starts a new entry,
  // following bullet lines become its bullets.
  const aiExperience: CvData["experience"] = [];
  let curr: any = null;
  for (const raw of (sections.Experience || [])) {
    const line = raw.trim();
    if (/^[-•]/.test(line)) {
      if (!curr) { curr = { role: "", organisation: "", dates: "", bullets: [] }; aiExperience.push(curr); }
      curr.bullets.push(cleanBullet(line));
    } else {
      // Try to parse "**Role** — Organisation" or "Role at Organisation (dates)"
      const m = line.replace(/\*\*/g, "").match(/^(.+?)(?:\s+(?:—|-)\s+|\s+at\s+)(.+?)(?:\s*\(([^)]+)\))?$/i);
      curr = m
        ? { role: m[1].trim(), organisation: m[2].trim(), dates: m[3]?.trim() || "", bullets: [] }
        : { role: line, organisation: "", dates: "", bullets: [] };
      aiExperience.push(curr);
    }
  }

  // Prefer structured fields where present
  const fieldExperience = asArray<any>(fields.workExperience).map(w => ({
    role: w.role || "",
    organisation: w.organisation || "",
    dates: w.dates || "",
    bullets: (w.description || "")
      .split(/\n+/).map((s: string) => s.replace(/^[-•]\s+/, "").trim()).filter(Boolean),
  }));

  // If we have AI bullets and a matching structured entry by role, attach them.
  const experience = fieldExperience.length
    ? fieldExperience.map(fe => {
        const match = aiExperience.find(ae =>
          ae.role && fe.role && ae.role.toLowerCase().includes(fe.role.toLowerCase().slice(0, 12)));
        if (match && match.bullets.length) return { ...fe, bullets: match.bullets };
        return fe;
      })
    : aiExperience;

  const fieldEducation = asArray<any>(fields.education).map(e => ({
    school: e.school || "", qualification: e.qualification || "", dates: e.dates || "", grades: e.grades || "",
  })).filter(e => e.school || e.qualification);

  const fieldLanguages = asArray<any>(fields.languages).map(l => ({
    language: l.language || "", level: l.level || "",
  })).filter(l => l.language);

  const aiLanguagesParsed = aiLanguages.map(line => {
    const m = line.match(/^(.+?)\s*(?:—|-)\s*(.+)$/);
    return m ? { language: m[1].trim(), level: m[2].trim() } : { language: line, level: "" };
  });

  const name = fields.pupilName || meta.pupilName || "Student";
  const year = fields.yearGroup || meta.yearGroup || "";
  const school = fields.schoolName || meta.schoolName || "";

  return {
    name,
    headline: [year, school].filter(Boolean).join(" · ") || "Student CV",
    contacts: [fields.email, fields.phone, fields.location].filter(Boolean),
    profile: aiProfile || fields.personalSummary || "",
    skills: asArray<string>(fields.skills).length ? asArray<string>(fields.skills) : aiSkills,
    experience,
    education: fieldEducation,
    languages: fieldLanguages.length ? fieldLanguages : aiLanguagesParsed,
    achievements: asArray<string>(fields.achievements).length ? asArray<string>(fields.achievements) : aiAchievements,
    interests: fields.interests || aiInterests,
    references: fields.references || aiReferences || "Available on request",
  };
}

// ─── Template renderers — six free designs ───────────────────────────────────
const A4 = "max-width:794px;margin:0 auto;background:#fff;color:#0f172a;box-shadow:0 0 0 1px #e5e7eb;min-height:1123px";

function bullets(items: string[], colour = "#334155"): string {
  const li = items.filter(Boolean).map(t => `<li style="margin:0 0 4px 0;padding-left:2px;line-height:1.45">${inlineMarkdown(t)}</li>`).join("");
  return li ? `<ul style="margin:0 0 0 16px;padding:0;color:${colour};font-size:11.5px">${li}</ul>` : "";
}
function expBlock(e: CvData["experience"][number], headColour = "#0f172a"): string {
  const head = `<p style="margin:6px 0 2px 0;font-size:12px;line-height:1.3;color:${headColour}"><strong>${escapeHtml(e.role)}</strong>${e.organisation ? ` — <span>${escapeHtml(e.organisation)}</span>` : ""}${e.dates ? ` <em style="color:#64748b">· ${escapeHtml(e.dates)}</em>` : ""}</p>`;
  return head + bullets(e.bullets);
}
function eduBlock(e: CvData["education"][number]): string {
  return `<p style="margin:0 0 4px 0;font-size:11.7px;line-height:1.45;color:#1f2937">
    <strong>${escapeHtml(e.qualification || "Qualification")}</strong>
    ${e.school ? ` — ${escapeHtml(e.school)}` : ""}
    ${e.dates ? ` <em style="color:#64748b">· ${escapeHtml(e.dates)}</em>` : ""}
    ${e.grades ? `<br/><span style="color:#475569">${escapeHtml(e.grades)}</span>` : ""}
  </p>`;
}
function langLine(l: CvData["languages"][number]): string {
  return `<li style="margin:0 0 3px 0;line-height:1.4">${escapeHtml(l.language)}${l.level ? ` <span style="color:#64748b">— ${escapeHtml(l.level)}</span>` : ""}</li>`;
}

// — Classic (current teal/navy split) —
function tplClassic(d: CvData): string {
  return `<article style="font-family:Inter,Arial,sans-serif;${A4}">
    <header style="display:grid;grid-template-columns:1.1fr .9fr;background:#17324d;color:white">
      <div style="padding:34px 34px 26px 34px">
        <h1 style="margin:0;font-size:30px;line-height:1.02;letter-spacing:-.04em;font-weight:900">${escapeHtml(d.name)}</h1>
        <p style="margin:8px 0 0 0;font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#b7d7e8;font-weight:800">${escapeHtml(d.headline)}</p>
      </div>
      <div style="padding:34px 34px 26px 24px;background:#0f766e;color:#ecfeff;font-size:11px;line-height:1.7">
        <div style="text-transform:uppercase;letter-spacing:.14em;font-size:9px;font-weight:900;color:#ccfbf1;margin-bottom:6px">Contact</div>
        ${d.contacts.length ? d.contacts.map(p => `<div>${escapeHtml(p)}</div>`).join("") : `<div>Contact details available on request</div>`}
      </div>
    </header>
    <div style="display:grid;grid-template-columns:34% 66%;gap:0">
      <aside style="padding:22px 22px 28px 30px;background:#f8fafc;border-right:1px solid #e5e7eb">
        ${section("Skills", bullets(d.skills, "#17324d"), "#0f766e")}
        ${d.languages.length ? section("Languages", `<ul style="margin:0;padding:0;list-style:none;color:#334155;font-size:11.5px">${d.languages.map(langLine).join("")}</ul>`, "#0f766e") : ""}
        ${d.achievements.length ? section("Achievements", bullets(d.achievements, "#17324d"), "#0f766e") : ""}
        ${d.interests ? section("Interests", `<p style="margin:0;color:#334155;font-size:11.5px;line-height:1.5">${escapeHtml(d.interests)}</p>`, "#0f766e") : ""}
        ${section("References", `<p style="margin:0;color:#334155;font-size:11.5px;line-height:1.5">${escapeHtml(d.references)}</p>`, "#0f766e")}
      </aside>
      <main style="padding:22px 30px 28px 24px">
        ${d.profile ? section("Profile", `<p style="margin:0;color:#1f2937;font-size:12.2px;line-height:1.55">${inlineMarkdown(d.profile)}</p>`, "#0f766e") : ""}
        ${d.experience.length ? section("Experience", d.experience.map(e => expBlock(e)).join(""), "#0f766e") : ""}
        ${d.education.length ? section("Education", d.education.map(eduBlock).join(""), "#0f766e") : ""}
      </main>
    </div>
  </article>`;
}
function section(label: string, body: string, colour = "#0f172a"): string {
  if (!body.trim()) return "";
  return `<section style="margin-top:13px"><h2 style="margin:0 0 6px 0;font-size:10px;line-height:1;text-transform:uppercase;letter-spacing:.14em;color:${colour};font-weight:900;border-bottom:1px solid #e2e8f0;padding-bottom:5px">${escapeHtml(label)}</h2>${body}</section>`;
}

// — Modern (single column with blue accent stripe) —
function tplModern(d: CvData): string {
  return `<article style="font-family:Inter,Arial,sans-serif;${A4};padding:42px 50px 50px 60px;position:relative">
    <div style="position:absolute;left:0;top:36px;bottom:36px;width:6px;background:#2563eb;border-radius:0 4px 4px 0"></div>
    <header style="margin-bottom:18px">
      <h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:-.04em;color:#0f172a">${escapeHtml(d.name)}</h1>
      <p style="margin:4px 0 0 0;font-size:12px;color:#475569">${escapeHtml(d.headline)}</p>
      ${d.contacts.length ? `<p style="margin:8px 0 0 0;font-size:11px;color:#475569">${d.contacts.map(escapeHtml).join(" · ")}</p>` : ""}
    </header>
    ${d.profile ? `<section style="margin-top:18px"><p style="margin:0;font-size:12px;line-height:1.6;color:#1f2937">${inlineMarkdown(d.profile)}</p></section>` : ""}
    ${d.experience.length ? sectionM("Experience", d.experience.map(e => expBlock(e)).join("")) : ""}
    ${d.education.length ? sectionM("Education", d.education.map(eduBlock).join("")) : ""}
    ${d.skills.length ? sectionM("Skills", bullets(d.skills)) : ""}
    ${d.languages.length ? sectionM("Languages", `<ul style="margin:0;padding:0;list-style:none;font-size:11.5px;color:#334155">${d.languages.map(langLine).join("")}</ul>`) : ""}
    ${d.achievements.length ? sectionM("Achievements", bullets(d.achievements)) : ""}
    ${d.interests ? sectionM("Interests", `<p style="margin:0;font-size:11.5px;color:#334155;line-height:1.5">${escapeHtml(d.interests)}</p>`) : ""}
    ${sectionM("References", `<p style="margin:0;font-size:11.5px;color:#334155;line-height:1.5">${escapeHtml(d.references)}</p>`)}
  </article>`;
}
function sectionM(label: string, body: string): string {
  return `<section style="margin-top:18px"><h2 style="margin:0 0 8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#2563eb;font-weight:900">${escapeHtml(label)}</h2>${body}</section>`;
}

// — Minimal (B&W, ATS-friendly) —
function tplMinimal(d: CvData): string {
  return `<article style="font-family:Georgia,'Times New Roman',serif;${A4};padding:48px 64px 56px 64px;color:#111">
    <header style="border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:18px">
      <h1 style="margin:0;font-size:26px;font-weight:700;letter-spacing:.02em">${escapeHtml(d.name)}</h1>
      <p style="margin:4px 0 0 0;font-size:11.5px;color:#444">${escapeHtml([d.headline, ...d.contacts].filter(Boolean).join(" | "))}</p>
    </header>
    ${d.profile ? `<section style="margin-bottom:14px"><p style="margin:0;font-size:12px;line-height:1.55">${inlineMarkdown(d.profile)}</p></section>` : ""}
    ${d.experience.length ? sectionMin("EXPERIENCE", d.experience.map(e => expBlock(e, "#111")).join("")) : ""}
    ${d.education.length ? sectionMin("EDUCATION", d.education.map(eduBlock).join("")) : ""}
    ${d.skills.length ? sectionMin("SKILLS", bullets(d.skills, "#111")) : ""}
    ${d.languages.length ? sectionMin("LANGUAGES", `<ul style="margin:0;padding:0;list-style:none;font-size:11.5px">${d.languages.map(langLine).join("")}</ul>`) : ""}
    ${d.achievements.length ? sectionMin("ACHIEVEMENTS", bullets(d.achievements, "#111")) : ""}
    ${d.interests ? sectionMin("INTERESTS", `<p style="margin:0;font-size:11.5px;line-height:1.5">${escapeHtml(d.interests)}</p>`) : ""}
    ${sectionMin("REFERENCES", `<p style="margin:0;font-size:11.5px;line-height:1.5">${escapeHtml(d.references)}</p>`)}
  </article>`;
}
function sectionMin(label: string, body: string): string {
  return `<section style="margin-bottom:14px"><h2 style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:.18em;border-bottom:1px solid #111;padding-bottom:3px">${escapeHtml(label)}</h2>${body}</section>`;
}

// — Professional (centered serif) —
function tplProfessional(d: CvData): string {
  return `<article style="font-family:'Cambria',Georgia,'Times New Roman',serif;${A4};padding:48px 64px 56px 64px;color:#1e293b">
    <header style="text-align:center;margin-bottom:22px">
      <h1 style="margin:0;font-size:30px;font-weight:700;letter-spacing:.04em;color:#1e293b">${escapeHtml(d.name)}</h1>
      <p style="margin:4px 0 0 0;font-size:12px;color:#475569;font-style:italic">${escapeHtml(d.headline)}</p>
      ${d.contacts.length ? `<p style="margin:6px 0 0 0;font-size:11px;color:#475569">${d.contacts.map(escapeHtml).join("  ·  ")}</p>` : ""}
      <div style="height:2px;background:linear-gradient(90deg,transparent,#1e293b,transparent);margin:14px auto 0;width:60%"></div>
    </header>
    ${d.profile ? sectionPro("Profile", `<p style="margin:0;font-size:12.2px;line-height:1.65;text-align:justify">${inlineMarkdown(d.profile)}</p>`) : ""}
    ${d.experience.length ? sectionPro("Experience", d.experience.map(e => expBlock(e, "#1e293b")).join("")) : ""}
    ${d.education.length ? sectionPro("Education", d.education.map(eduBlock).join("")) : ""}
    ${d.skills.length ? sectionPro("Skills", bullets(d.skills, "#334155")) : ""}
    ${d.languages.length ? sectionPro("Languages", `<ul style="margin:0;padding:0;list-style:none;font-size:11.5px;color:#334155">${d.languages.map(langLine).join("")}</ul>`) : ""}
    ${d.achievements.length ? sectionPro("Achievements", bullets(d.achievements, "#334155")) : ""}
    ${d.interests ? sectionPro("Interests", `<p style="margin:0;font-size:11.5px;line-height:1.5">${escapeHtml(d.interests)}</p>`) : ""}
    ${sectionPro("References", `<p style="margin:0;font-size:11.5px;line-height:1.5">${escapeHtml(d.references)}</p>`)}
  </article>`;
}
function sectionPro(label: string, body: string): string {
  return `<section style="margin-bottom:14px"><h2 style="margin:0 0 6px 0;font-size:13px;font-variant:small-caps;letter-spacing:.08em;color:#1e293b;font-weight:700;border-bottom:1px solid #cbd5e1;padding-bottom:3px">${escapeHtml(label)}</h2>${body}</section>`;
}

// — Creative (dark sidebar with name) —
function tplCreative(d: CvData): string {
  return `<article style="font-family:Inter,Arial,sans-serif;${A4};display:grid;grid-template-columns:36% 64%">
    <aside style="background:#1e1b4b;color:#e0e7ff;padding:36px 24px 36px 28px">
      <h1 style="margin:0;font-size:24px;font-weight:900;letter-spacing:-.03em;color:white;line-height:1.05">${escapeHtml(d.name)}</h1>
      <p style="margin:6px 0 0 0;font-size:11px;color:#a5b4fc;text-transform:uppercase;letter-spacing:.14em;font-weight:700">${escapeHtml(d.headline)}</p>
      ${d.contacts.length ? `<div style="margin-top:18px;font-size:11px;line-height:1.7;color:#cbd5e1">${d.contacts.map(c => `<div>${escapeHtml(c)}</div>`).join("")}</div>` : ""}
      ${d.skills.length ? sectionC("Skills", bullets(d.skills, "#cbd5e1")) : ""}
      ${d.languages.length ? sectionC("Languages", `<ul style="margin:0;padding:0;list-style:none;font-size:11.5px;color:#cbd5e1">${d.languages.map(langLine).join("")}</ul>`) : ""}
      ${d.interests ? sectionC("Interests", `<p style="margin:0;font-size:11.5px;line-height:1.5;color:#cbd5e1">${escapeHtml(d.interests)}</p>`) : ""}
      ${sectionC("References", `<p style="margin:0;font-size:11px;line-height:1.5;color:#cbd5e1">${escapeHtml(d.references)}</p>`)}
    </aside>
    <main style="padding:34px 32px 36px 28px">
      ${d.profile ? sectionCMain("Profile", `<p style="margin:0;font-size:12px;line-height:1.6;color:#1f2937">${inlineMarkdown(d.profile)}</p>`) : ""}
      ${d.experience.length ? sectionCMain("Experience", d.experience.map(e => expBlock(e, "#1e1b4b")).join("")) : ""}
      ${d.education.length ? sectionCMain("Education", d.education.map(eduBlock).join("")) : ""}
      ${d.achievements.length ? sectionCMain("Achievements", bullets(d.achievements)) : ""}
    </main>
  </article>`;
}
function sectionC(label: string, body: string): string {
  return `<section style="margin-top:18px"><h3 style="margin:0 0 7px 0;font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:#a5b4fc;font-weight:900">${escapeHtml(label)}</h3>${body}</section>`;
}
function sectionCMain(label: string, body: string): string {
  return `<section style="margin-bottom:16px"><h2 style="margin:0 0 8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#4f46e5;font-weight:900">${escapeHtml(label)}</h2>${body}</section>`;
}

// — Compact (dense two-column) —
function tplCompact(d: CvData): string {
  return `<article style="font-family:Inter,Arial,sans-serif;${A4};padding:28px 36px 36px 36px">
    <header style="background:#0f172a;color:white;padding:14px 20px;border-radius:6px;margin-bottom:14px">
      <h1 style="margin:0;font-size:22px;font-weight:900;letter-spacing:-.03em">${escapeHtml(d.name)}</h1>
      <p style="margin:3px 0 0 0;font-size:11px;color:#cbd5e1">${escapeHtml([d.headline, ...d.contacts].filter(Boolean).join(" · "))}</p>
    </header>
    ${d.profile ? `<p style="margin:0 0 14px 0;font-size:11.6px;line-height:1.55;color:#1f2937">${inlineMarkdown(d.profile)}</p>` : ""}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      <div>
        ${d.experience.length ? sectionK("Experience", d.experience.map(e => expBlock(e)).join("")) : ""}
        ${d.education.length ? sectionK("Education", d.education.map(eduBlock).join("")) : ""}
      </div>
      <div>
        ${d.skills.length ? sectionK("Skills", bullets(d.skills)) : ""}
        ${d.languages.length ? sectionK("Languages", `<ul style="margin:0;padding:0;list-style:none;font-size:11.5px;color:#334155">${d.languages.map(langLine).join("")}</ul>`) : ""}
        ${d.achievements.length ? sectionK("Achievements", bullets(d.achievements)) : ""}
        ${d.interests ? sectionK("Interests", `<p style="margin:0;font-size:11.4px;line-height:1.5">${escapeHtml(d.interests)}</p>`) : ""}
        ${sectionK("References", `<p style="margin:0;font-size:11.4px;line-height:1.5">${escapeHtml(d.references)}</p>`)}
      </div>
    </div>
  </article>`;
}
function sectionK(label: string, body: string): string {
  return `<section style="margin-bottom:12px"><h2 style="margin:0 0 5px 0;font-size:10.5px;text-transform:uppercase;letter-spacing:.16em;color:#0f766e;font-weight:900;border-bottom:1px solid #d8eee9;padding-bottom:3px">${escapeHtml(label)}</h2>${body}</section>`;
}

const TEMPLATE_RENDERERS: Record<TemplateId, (d: CvData) => string> = {
  classic: tplClassic,
  modern: tplModern,
  minimal: tplMinimal,
  professional: tplProfessional,
  creative: tplCreative,
  compact: tplCompact,
};

// ─── Top-level renderContent ─────────────────────────────────────────────────
function renderContent(
  docType: DocType,
  content: string,
  fields: Record<string, any> = {},
  meta: { pupilName?: string; yearGroup?: string; schoolName?: string; title?: string } = {},
): string {
  if (docType === "cv") {
    const data = buildCvData(content, fields, meta);
    const looksEmpty = !data.profile && !data.skills.length && !data.experience.length && !data.education.length && !data.achievements.length && !data.languages.length;
    if (looksEmpty && !content) {
      return `<div style="font-family:Inter,Arial,sans-serif;max-width:780px;margin:0 auto;padding:34px;background:#fff;color:#334155;text-align:center;border:1px dashed #cbd5e1">
        <p style="margin:0;font-size:13px;font-style:italic">Pick a template and fill in your details — your CV preview will appear here.</p>
      </div>`;
    }
    const tplId = (fields.templateId as TemplateId) || "classic";
    const renderer = TEMPLATE_RENDERERS[tplId] || tplClassic;
    return renderer(data);
  }

  if (!content) {
    return `<div style="font-family:Inter,Arial,sans-serif;max-width:780px;margin:0 auto;padding:34px;background:#fff;color:#334155;text-align:center;border:1px dashed #cbd5e1">
      <p style="margin:0;font-size:13px;font-style:italic">No content yet — click "Generate with AI" or write manually.</p>
    </div>`;
  }

  const name = fields.pupilName || meta.pupilName || "Student";
  const year = fields.yearGroup || meta.yearGroup || "";
  const school = fields.schoolName || meta.schoolName || "";
  const contactParts = [fields.email, fields.phone, fields.location].filter(Boolean).map(escapeHtml);
  const escaped = escapeHtml(content);
  const paragraphs = escaped.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  if (docType === "cover_letter") {
    return `<article style="font-family:Inter,Arial,sans-serif;${A4};padding:46px 58px">
      <header style="border-bottom:3px solid #17324d;padding-bottom:18px;margin-bottom:28px">
        <h1 style="margin:0;font-size:24px;line-height:1.05;font-weight:900;letter-spacing:-.03em;color:#17324d">${escapeHtml(name)}</h1>
        <p style="margin:7px 0 0 0;font-size:11px;color:#475569;letter-spacing:.08em;text-transform:uppercase">${escapeHtml([year, school, ...contactParts].filter(Boolean).join(" · "))}</p>
      </header>
      <div style="font-size:12.5px;line-height:1.72;white-space:pre-wrap;color:#1f2937">${paragraphs.map(p => `<p style="margin:0 0 13px 0">${p}</p>`).join("")}</div>
    </article>`;
  }

  const charCount = content.length;
  return `<article style="font-family:Inter,Arial,sans-serif;${A4}">
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

// ─── Template gallery component ──────────────────────────────────────────────
function TemplateGallery({ value, onChange, readOnly }: { value: TemplateId; onChange: (id: TemplateId) => void; readOnly: boolean }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" />
            CV Template
          </p>
          <p className="text-[10px] text-muted-foreground">Inspired by Canva, FlowCV &amp; Resume.org</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CV_TEMPLATES.map(t => {
            const selected = value === t.id;
            return (
              <button
                key={t.id}
                disabled={readOnly}
                onClick={() => onChange(t.id)}
                className={`relative border rounded-md overflow-hidden text-left transition ${selected ? "border-emerald-600 ring-2 ring-emerald-300" : "border-border hover:border-emerald-400"} ${readOnly ? "cursor-default opacity-80" : "cursor-pointer"}`}
                title={`${t.name} — ${t.description}`}
              >
                <div className="aspect-[3/4] bg-white" dangerouslySetInnerHTML={{ __html: t.thumb }} />
                <div className="px-1.5 py-1 text-[10px] font-semibold border-t bg-slate-50">
                  {t.name}
                </div>
                {selected && (
                  <span className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── EmptyBlock ──────────────────────────────────────────────────────────────
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

// ─── Main component ─────────────────────────────────────────────────────────
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
  const [parsing, setParsing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/pupil-documents/${pupilId}`, {}, mode, parentCode);
      if (res.ok) {
        const data = await res.json();
        setDocs(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [pupilId]);

  const createDoc = async (docType: DocType) => {
    const title = docType === "cv" ? `${pupilName || "Pupil"} — CV`
      : docType === "personal_statement" ? `${pupilName || "Pupil"} — Personal Statement`
      : `${pupilName || "Pupil"} — Cover Letter`;
    const initialFields = docType === "cv" ? { templateId: "classic" } : {};
    const res = await authFetch(`/api/pupil-documents/${pupilId}`, {
      method: "POST",
      body: JSON.stringify({ docType, title, fields: initialFields, content: "" }),
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

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ""; // allow re-selecting the same file
    if (!file || !active) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large — please use a CV under 10 MB.");
      return;
    }
    const lower = file.name.toLowerCase();
    if (!/\.(pdf|docx)$/.test(lower)) {
      toast.error("Only PDF or DOCX files are supported.");
      return;
    }
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await authFetch(`/api/ai/cv/parse`, { method: "POST", body: fd }, mode, parentCode);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "parse failed");
      }
      const { fields } = await res.json();
      // Merge: keep templateId, overwrite the rest with parsed values where present.
      const merged = {
        templateId: active.fields?.templateId || "classic",
        ...active.fields,
        ...fields,
      };
      setActive({ ...active, fields: merged });
      toast.success("CV parsed — review and edit before saving.");
    } catch (err: any) {
      toast.error(err?.message?.includes("read") ? err.message : "Could not parse that CV. Try a different file.");
    }
    setParsing(false);
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
  const templateId = (active.fields?.templateId as TemplateId) || "classic";

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

      {/* Template gallery — CV only */}
      {active.docType === "cv" && (
        <TemplateGallery
          value={templateId}
          onChange={(id) => setActive({ ...active, fields: { ...active.fields, templateId: id } })}
          readOnly={readOnly}
        />
      )}

      {/* Upload existing CV — parent mode + CV only */}
      {!readOnly && active.docType === "cv" && (
        <Card className="border-dashed border-emerald-300 bg-emerald-50/50">
          <CardContent className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900">Already have a CV?</p>
              <p className="text-xs text-emerald-800/80">Upload a PDF or DOCX and we'll fill in the form for you. You can edit before saving.</p>
            </div>
            <Button size="sm" variant="default" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={handleUploadClick} disabled={parsing}>
              {parsing ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Reading…</> : <><Upload className="w-4 h-4 mr-1.5" />Upload CV</>}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChosen}
            />
          </CardContent>
        </Card>
      )}

      {!readOnly && editing && (
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Your details (used for the live preview and AI polish)</p>
            {active.docType === "cv" && <CVEditor fields={active.fields} setFields={f => setActive({ ...active, fields: f })} />}
            {active.docType === "personal_statement" && <PSEditor fields={active.fields} setFields={f => setActive({ ...active, fields: f })} />}
            {active.docType === "cover_letter" && <CoverEditor fields={active.fields} setFields={f => setActive({ ...active, fields: f })} />}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
              <Button size="sm" onClick={generateWithAI} disabled={generating} className="bg-brand hover:bg-brand/90 text-white">
                {generating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Drafting…</> : <><Sparkles className="w-4 h-4 mr-1" />{active.content ? "Regenerate" : "Polish"} with AI</>}
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
            <p className="text-xs font-semibold text-muted-foreground">Live preview</p>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="w-3.5 h-3.5 mr-1" />Full view</Button>
              <Button size="sm" variant="outline" onClick={printDoc}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
              <Button size="sm" variant="outline" onClick={downloadPdf}><Download className="w-3.5 h-3.5 mr-1" />PDF</Button>
            </div>
          </div>
          {!readOnly && active.content && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Show raw AI text (advanced — edit if you want full control)</summary>
              <Textarea
                value={active.content}
                onChange={e => setActive({ ...active, content: e.target.value })}
                rows={8}
                className="text-xs font-mono mt-1.5"
              />
            </details>
          )}
          <div ref={previewRef} className="border rounded-lg overflow-hidden max-h-[480px] overflow-y-auto bg-white"
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
