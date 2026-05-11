import { useState } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { Mail, Loader2, Languages } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { callAI } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DOMPurify from "dompurify";

const tones = [
  { value: "warm", label: "Warm & Friendly" },
  { value: "professional", label: "Professional & Formal" },
  { value: "celebratory", label: "Celebratory & Upbeat" },
  { value: "informative", label: "Informative & Clear" },
  { value: "supportive", label: "Supportive & Empathetic" },
];

const commTypes = [
  { value: "newsletter", label: "Class Newsletter" },
  { value: "letter", label: "General Parent Letter" },
  { value: "send-update", label: "SEND Progress Update" },
  { value: "trip", label: "School Trip Letter" },
  { value: "behaviour", label: "Behaviour Concern Letter" },
  { value: "achievement", label: "Achievement / Celebration Letter" },
  { value: "meeting", label: "Meeting Invitation" },
  { value: "curriculum", label: "Curriculum Information Letter" },
  { value: "safeguarding", label: "Safeguarding / Welfare Communication" },
  { value: "attendance", label: "Attendance Concern Letter" },
  { value: "transition", label: "Transition / New Year Letter" },
];

const translationLanguages = [
  { value: "polish", label: "Polish" },
  { value: "urdu", label: "Urdu" },
  { value: "romanian", label: "Romanian" },
  { value: "arabic", label: "Arabic" },
  { value: "bengali", label: "Bengali" },
];

function TranslationPanel({ result }: { result: string }) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("english");
  const [lastTranslatedLang, setLastTranslatedLang] = useState<string>("");

  const handleTranslate = async (language: string) => {
    setSelectedLanguage(language);
    setTranslating(true);
    setTranslatedText("");
    setActiveTab(language);
    try {
      const langLabel = translationLanguages.find(l => l.value === language)?.label || language;
      const { text } = await callAI(
        `You are a professional translator specialising in school communications. Translate the following school letter accurately into ${langLabel}. Preserve all formatting, paragraph structure, dates, school name, teacher name, and proper nouns. The translation should be natural and fluent, not word-for-word.`,
        result,
        2000
      );
      setTranslatedText(text);
      setLastTranslatedLang(language);
      toast.success(`Translated to ${langLabel}`);
    } catch {
      toast.error("Translation failed. Please try again.");
      setActiveTab("english");
    }
    setTranslating(false);
  };

  const onLanguageChange = (value: string) => {
    if (value !== lastTranslatedLang) {
      handleTranslate(value);
    } else {
      setSelectedLanguage(value);
      setActiveTab(value);
    }
  };

  const formatTranslation = (text: string): string => {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs
      .map(p => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        const formatted = trimmed
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br/>");
        return `<p style="margin-bottom:10px;line-height:1.7;color:#1f2937;font-size:13px;">${formatted}</p>`;
      })
      .filter(Boolean)
      .join("");
  };

  const langLabel = translationLanguages.find(l => l.value === selectedLanguage)?.label || "";

  return (
    <Card className="border-border/50 mt-3">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-pink-600" />
          <span className="text-sm font-medium text-foreground">Translate to...</span>
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {translationLanguages.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {translating && <Loader2 className="w-4 h-4 animate-spin text-pink-600" />}
        </div>

        {(translatedText || translating) && selectedLanguage && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="english">English</TabsTrigger>
              <TabsTrigger value={selectedLanguage}>{langLabel}</TabsTrigger>
            </TabsList>
            <TabsContent value="english">
              <div
                className="prose prose-sm max-w-none text-foreground/90 leading-relaxed mt-2"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatTranslation(result)) }}
              />
            </TabsContent>
            <TabsContent value={selectedLanguage}>
              {translating ? (
                <div className="flex items-center gap-2 py-6 justify-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Translating to {langLabel}...
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none text-foreground/90 leading-relaxed mt-2"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatTranslation(translatedText)) }}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default function ParentNewsletter() {
  const { saveParentNewsletter } = useApp();
  const { preferences } = useUserPreferences();

  return (
    <AIToolPage
      title="Parent Newsletter / Letter"
      assignable={true}
      description="Generate professional, parent-ready communications, newsletters, and letters"
      icon={<Mail className="w-5 h-5 text-white" />}
      accentColor="bg-pink-600"
      fields={[
        { id: "schoolName", label: "School Name", type: "text", placeholder: "e.g. Oakwood Primary School", required: true, span: "half" },
        { id: "type", label: "Communication Type", type: "select", options: commTypes, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group / Class", type: "text", placeholder: "e.g. Year 4 / Class 4B", span: "half" },
        { id: "tone", label: "Tone", type: "select", options: tones, span: "half" },
        { id: "content", label: "Key Points to Include", type: "textarea", placeholder: "What should this communication cover? Key dates, achievements, events, information, concerns...", required: true, span: "full" },
        { id: "teacherName", label: "Teacher / SENCO Name", type: "text", placeholder: "e.g. Mrs Johnson", span: "half" },
        { id: "date", label: "Date", type: "text", placeholder: "e.g. March 2026", span: "half" },
        { id: "actionRequired", label: "Action Required from Parents?", type: "text", placeholder: "e.g. Return reply slip by Friday, Attend meeting on 15th March", span: "full" },
      ]}
      buildPrompt={(v) => ({
        system: `You are a highly experienced UK school communications specialist and teacher with 20+ years of experience writing exemplary parent communications. You are known for writing communications that are:

- **Crystal clear**: Plain English accessible to all parents, including EAL families (Flesch-Kincaid Grade 8 or below)
- **Warmly professional**: The right balance of approachable and authoritative
- **Structurally excellent**: Logical flow, clear headings where appropriate, easy to skim
- **Action-oriented**: Parents always know exactly what (if anything) they need to do
- **Legally appropriate**: GDPR-aware, safeguarding-conscious, no sensitive personal data
- **Inclusive**: Welcoming tone for all family structures and backgrounds
- **Impeccably written**: Perfect spelling, grammar, punctuation, and formatting

You understand the difference between a newsletter (informative, celebratory, multi-topic) and a letter (focused, action-driven, single purpose) and write each appropriately.`,
        user: `Write a professional ${v.type || "newsletter"} for parents with the following details:

**School:** ${v.schoolName}
**Communication Type:** ${commTypes.find(t => t.value === v.type)?.label || v.type || "Newsletter"}
**Year Group / Class:** ${v.yearGroup || "Whole school"}
**Tone:** ${tones.find(t => t.value === v.tone)?.label || "Warm & Friendly"}
**Teacher / Author:** ${v.teacherName || "The Class Teacher"}
**Date:** ${v.date || ""}
${v.actionRequired ? `**Action Required from Parents:** ${v.actionRequired}` : ""}

**Key Points to Cover:**
${v.content}

**Formatting Requirements:**
1. Begin with a proper school letterhead format:
   - School name prominently at the top
   - Date (right-aligned)
   - "Dear Parents and Carers," salutation
2. Write a warm, engaging opening paragraph that sets the tone
3. Cover all key points in a logical, well-structured order
4. Use clear subheadings for newsletters with multiple topics
5. ${v.actionRequired ? `Include a clear, prominent "Action Required" section: ${v.actionRequired}` : "End with an open invitation for parents to get in touch with any questions"}
6. Close with a professional sign-off:
   - "Warm regards," / "Kind regards," (appropriate to tone)
   - ${v.teacherName || "The Class Teacher"}
   - ${v.schoolName}

**Content Guidelines:**
- For newsletters: 350–500 words, celebratory and informative
- For letters: 200–300 words, focused and action-oriented
- For SEND communications: Strengths-based, progress-focused, sensitive and empowering
- For behaviour concerns: Solution-focused, non-blaming, partnership approach
- For achievement letters: Specific, genuine, motivating
- Use plain English throughout — avoid educational jargon
- Be inclusive and welcoming to all family structures
- If mentioning any dates or deadlines, make them clear and prominent

Write the complete communication, ready to print and send.`,
        maxTokens: 2000,
      })}
      outputTitle={(v) => `${commTypes.find(t => t.value === v.type)?.label || "Newsletter"} — ${v.schoolName}${v.date ? ` (${v.date})` : ""}`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#db2777", emoji: "📰", title: "Parent Newsletter" })}
      onResult={(text, values) => {
        const title = `${commTypes.find(t => t.value === values.type)?.label || "Newsletter"} — ${values.schoolName}${values.date ? ` (${values.date})` : ""}`;
        saveParentNewsletter({ title, content: text, date: values.date || new Date().toLocaleDateString("en-GB"), type: values.type || "newsletter" });
        toast.success("Saved to Parent Portal history.");
      }}
      renderPostActions={(result) => <TranslationPanel result={result} />}
    />
  );
}
