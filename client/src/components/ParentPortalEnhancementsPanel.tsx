/**
 * ParentPortalEnhancementsPanel — embedded inside the Parent Portal page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Users, Mail, Shield, FileText, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  type PortalLang, PORTAL_LANG_LABEL, PORTAL_LANG_DIR, t,
  type PortalAudience, viewFor,
  listMessages, sendMessage, nudgeCandidates, markNudged, markOpened,
  safeguardingScan, redactSafeguarding,
  type ConsentKind, CONSENT_LABEL, listConsents, recordConsent, isConsentExpired,
} from "@/lib/parent-portal-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  parentUserId?: string;
}

const LANGS = Object.keys(PORTAL_LANG_LABEL) as PortalLang[];

export default function ParentPortalEnhancementsPanel({ pupilId, pupilName, parentUserId = "parent-1" }: Props) {
  const [lang, setLang] = useState<PortalLang>("en");
  const [audience, setAudience] = useState<PortalAudience>("parent");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [consentKind, setConsentKind] = useState<ConsentKind>("photographs");
  const [signedBy, setSignedBy] = useState("");
  const [tick, setTick] = useState(0);

  const messages = useMemo(() => listMessages().filter((m) => m.pupilId === pupilId), [pupilId, tick]);
  const nudges = useMemo(() => nudgeCandidates().filter((m) => m.pupilId === pupilId), [pupilId, tick]);
  const view = useMemo(() => viewFor(audience), [audience]);
  const findings = useMemo(() => safeguardingScan(draftBody), [draftBody]);
  const consents = useMemo(() => listConsents(pupilId), [pupilId, tick]);

  function send() {
    if (!draftBody.trim()) { toast.error("Empty message."); return; }
    const safe = findings.length > 0 ? redactSafeguarding(draftBody) : draftBody;
    sendMessage({ pupilId, recipientUserId: parentUserId, subject: draftSubject || "(no subject)", body: safe, lang });
    setDraftSubject(""); setDraftBody("");
    setTick((x) => x + 1);
    if (findings.length > 0) {
      toast.warning("Sent — safeguarding terms redacted; original copied to DSL queue.");
    } else {
      toast.success("Message sent.");
    }
  }

  function fireNudges() {
    let count = 0;
    for (const m of nudges) { markNudged(m.id); count++; }
    setTick((x) => x + 1);
    toast.success(`Re-nudged ${count} message${count === 1 ? "" : "s"} in ${PORTAL_LANG_LABEL[lang]}.`);
  }

  function addConsent(granted: boolean) {
    if (!signedBy) { toast.error("Enter who is signing the consent."); return; }
    recordConsent({
      pupilId,
      kind: consentKind,
      granted,
      signedBy,
      expiresAt: Date.now() + 365 * 86400_000,
      notes: "",
    });
    setSignedBy("");
    setTick((x) => x + 1);
    toast.success(`Consent ${granted ? "granted" : "withdrawn"} — recorded.`);
  }

  if (!pupilId) {
    return (
      <Card className="border-orange-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Pick a pupil to enable Parent Portal enhancements.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 mt-4" dir={PORTAL_LANG_DIR[lang]}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-600" />
          <p className="text-sm font-bold">{t("portal.title", lang)} — {pupilName}</p>
          <Badge variant="outline" className="ml-auto text-[10px]">{view.audience}</Badge>
        </div>

        <Tabs defaultValue="i18n">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="i18n"><Languages className="w-3 h-3 mr-1" /> Language</TabsTrigger>
            <TabsTrigger value="view"><Users className="w-3 h-3 mr-1" /> View</TabsTrigger>
            <TabsTrigger value="messages"><Mail className="w-3 h-3 mr-1" /> {t("messages", lang)}</TabsTrigger>
            <TabsTrigger value="dsl"><Shield className="w-3 h-3 mr-1" /> Redaction</TabsTrigger>
            <TabsTrigger value="consents">{t("consents", lang)}</TabsTrigger>
          </TabsList>

          <TabsContent value="i18n" className="space-y-2 pt-3">
            <Label className="text-xs">UI language</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as PortalLang)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGS.map((l) => <SelectItem key={l} value={l}>{PORTAL_LANG_LABEL[l]}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Direction: {PORTAL_LANG_DIR[lang].toUpperCase()} (full UI strings localised, not just content).</p>
            <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
              <p>{t("portal.title", lang)}</p>
              <p>{t("today", lang)} · {t("messages", lang)} · {t("consents", lang)} · {t("logout", lang)}</p>
            </div>
          </TabsContent>

          <TabsContent value="view" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Toggle between parent view and a pupil-as-user mode (large icons, no admin language).</p>
            <div className="flex gap-2">
              <Button size="sm" variant={audience === "parent" ? "default" : "outline"} onClick={() => setAudience("parent")}>Parent view</Button>
              <Button size="sm" variant={audience === "pupil" ? "default" : "outline"} onClick={() => setAudience("pupil")}>{t("child.view", lang)}</Button>
            </div>
            <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
              <p>Density: {view.density}</p>
              <p>Icon size: {view.iconSizePx}px</p>
              <p>Show admin language: {view.showAdminLanguage ? "yes" : "no"}</p>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-2 pt-3">
            <Input placeholder={t("messages", lang) + ": subject"} value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} />
            <Textarea rows={4} placeholder={`${t("send", lang)}…`} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
            {findings.length > 0 && (
              <div className="text-[10px] text-amber-700 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 mt-0.5" />
                <span>Outbound will be redacted (DSL receives original). Triggers: {findings.map((f) => `"${f.excerpt}"`).join(", ")}</span>
              </div>
            )}
            <Button size="sm" onClick={send} className="gap-1.5"><Send className="w-3.5 h-3.5" /> {t("send", lang)}</Button>
            {messages.length > 0 && (
              <ul className="space-y-1 mt-2 text-[11px]">
                {messages.slice(-5).map((m) => (
                  <li key={m.id} className="rounded-md border bg-muted/20 p-2 flex items-center justify-between">
                    <div className="min-w-0 truncate">
                      <span className="font-medium">{m.subject}</span>
                      <span className="text-muted-foreground"> · {new Date(m.sentAt).toLocaleDateString("en-GB")}</span>
                    </div>
                    {m.openedAt
                      ? <Badge variant="outline" className="text-[9px]">read</Badge>
                      : <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { markOpened(m.id); setTick((x) => x + 1); }}>mark read</Button>}
                  </li>
                ))}
              </ul>
            )}
            {nudges.length > 0 && (
              <Button size="sm" variant="outline" onClick={fireNudges} className="gap-1.5">Re-send {nudges.length} unread (in {PORTAL_LANG_LABEL[lang]})</Button>
            )}
          </TabsContent>

          <TabsContent value="dsl" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Inbound parent messages are scanned for safeguarding terms; flagged ones go to the DSL queue before reaching the SENCO outbox.</p>
            <Textarea rows={4} placeholder="Paste an inbound parent message to test the scan…" value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
            {findings.length === 0 ? (
              <p className="text-xs text-emerald-700">No safeguarding triggers in this draft.</p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {findings.map((f, i) => (
                  <li key={i} className="rounded-md border border-rose-300 bg-rose-50/50 p-2 text-rose-800">
                    <strong>{f.reason}</strong> — "{f.excerpt}"
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="consents" className="space-y-2 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Consent kind</Label>
                <Select value={consentKind} onValueChange={(v) => setConsentKind(v as ConsentKind)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CONSENT_LABEL) as ConsentKind[]).map((k) => <SelectItem key={k} value={k}>{CONSENT_LABEL[k]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Signed by</Label>
                <Input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} placeholder="Parent name" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addConsent(true)}>Grant</Button>
              <Button size="sm" variant="outline" onClick={() => addConsent(false)}>Withdraw</Button>
            </div>
            {consents.length > 0 && (
              <ul className="space-y-1 mt-2 text-[11px]">
                {consents.slice(-10).map((c) => (
                  <li key={c.id} className="rounded-md border bg-muted/20 p-2 flex items-center justify-between">
                    <span>
                      <Badge variant="outline" className="text-[9px] mr-1">v{c.version}</Badge>
                      {CONSENT_LABEL[c.kind]} · {c.granted ? "GRANTED" : "withdrawn"} by {c.signedBy} on {new Date(c.signedAt).toLocaleDateString("en-GB")}
                      {isConsentExpired(c) && <span className="text-rose-700 ml-1">(expired)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
