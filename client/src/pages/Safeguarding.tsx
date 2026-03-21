import { Shield, AlertTriangle, Mail, Phone, Users, Lock, Eye, FileText, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2.5 border-b pb-2">
      <span className="text-brand">{icon}</span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function Safeguarding() {
  const [, navigate] = useLocation();
  const updated = "March 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-7 h-7" />
            <h1 className="text-2xl font-bold">Safeguarding Policy</h1>
          </div>
          <p className="text-white/80 text-sm">
            Adaptly is committed to safeguarding children and young people. This policy sets out our approach to keeping children safe when our platform is used in educational settings.
          </p>
          <p className="text-white/60 text-xs mt-2">Last updated: {updated} · Reviewed annually</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Commitment */}
        <Section icon={<Shield className="w-4 h-4" />} title="1. Our Commitment to Child Safety">
          <p>
            Adaptly takes child safeguarding extremely seriously. We are aware that our platform is used by school staff to create resources and documentation relating to children with special educational needs and disabilities (SEND). We have designed our platform with safeguarding at its core.
          </p>
          <p>
            This policy applies to Adaptly as a software platform and service provider. It does not replace or supersede the safeguarding policies of the schools and educational settings that use our platform — schools remain responsible for their own safeguarding obligations under <strong>Keeping Children Safe in Education (KCSIE)</strong> and related statutory guidance.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-xs">Immediate Concern?</p>
              <p className="text-xs text-red-700 mt-1">
                If you have an immediate safeguarding concern about a child, contact your school's Designated Safeguarding Lead (DSL) immediately.
                In an emergency, call <strong>999</strong>. To report a safeguarding concern to the local authority, contact your LADO (Local Authority Designated Officer).
              </p>
            </div>
          </div>
        </Section>

        {/* Data minimisation */}
        <Section icon={<Lock className="w-4 h-4" />} title="2. How We Protect Pupil Information">
          <p>
            Adaptly is designed so that <strong>no identifiable pupil data is required or stored</strong> by the platform beyond what schools explicitly choose to enter. Our approach:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong>Initials only</strong> — all SEND tools (EHCP generator, pupil passports, behaviour plans, social stories) require only pupil initials, not full names</li>
            <li><strong>Data minimisation</strong> — we collect only the minimum information necessary to deliver the educational support function</li>
            <li><strong>School responsibility</strong> — schools, as Data Controllers, are responsible for ensuring that only appropriate information is entered into the platform</li>
            <li><strong>No pupil direct access</strong> — pupils do not log in to Adaptly; all access to pupil-related features is mediated through authenticated staff accounts</li>
            <li><strong>No AI training</strong> — pupil data entered into Adaptly is never used to train, fine-tune, or improve AI models</li>
          </ul>
        </Section>

        {/* AI content filtering */}
        <Section icon={<Eye className="w-4 h-4" />} title="3. AI Content Filtering and Flagging">
          <p>
            All content generated through Adaptly's AI tools is automatically reviewed for safeguarding concerns before being displayed to users. This includes:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Filtering prompts and responses for language that may indicate a child is at risk</li>
            <li>Blocking content that could be inappropriate for use with children</li>
            <li>Automatic incident creation if safeguarding-relevant content is detected</li>
            <li>Notification to the school's Designated Safeguarding Lead (DSL) where configured</li>
          </ul>
          <p>
            These automated filters are a safeguarding support measure only. They do not replace the professional judgement of teachers and SENCOs, who remain responsible for reviewing all AI-generated content before use.
          </p>
        </Section>

        {/* DSL and incident reporting */}
        <Section icon={<Users className="w-4 h-4" />} title="4. Designated Safeguarding Lead Integration">
          <p>
            During school onboarding, Adaptly captures the name and contact details of the school's <strong>Designated Safeguarding Lead (DSL)</strong>. Where a safeguarding concern is flagged by the platform's content filters, the DSL will be notified automatically by email.
          </p>
          <p>
            Staff can also manually log safeguarding incidents within the platform via <strong>Settings → Safeguarding → Report Incident</strong>. All incidents are recorded in the audit log and the DSL is notified.
          </p>
          <p>
            Adaptly's safeguarding incident log is not a replacement for your school's own safeguarding documentation system (e.g. MyConcern, CPOMS). It is a supplementary tool for capturing concerns that arise in the context of platform use.
          </p>
        </Section>

        {/* Special category data */}
        <Section icon={<FileText className="w-4 h-4" />} title="5. Special Category Data and SEND Information">
          <p>
            Information about a child's SEND diagnosis, mental health, or medical conditions constitutes <strong>special category data</strong> under UK GDPR Article 9. Schools are responsible for ensuring they have the appropriate legal basis (typically substantial public interest under Article 9(2)(g)) and parental consent before entering this information into any system.
          </p>
          <p>
            Adaptly processes SEND-related data solely to deliver the educational support services requested by the school. We do not share this data with third parties for commercial purposes. See our <a href="/privacy" className="text-brand underline">Privacy Notice</a> and <a href="/dpa" className="text-brand underline">Data Processing Agreement</a> for full details.
          </p>
        </Section>

        {/* Staff responsibilities */}
        <Section icon={<Shield className="w-4 h-4" />} title="6. Staff Responsibilities When Using Adaptly">
          <p>All staff using Adaptly are expected to:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Use initials only when referring to pupils in any AI tool — never enter full names into prompts</li>
            <li>Review all AI-generated content before sharing it with pupils, parents, or carers</li>
            <li>Not upload documents containing full pupil names, dates of birth, or UPNs into AI generation features</li>
            <li>Report any safeguarding concern that arises during platform use to the DSL immediately</li>
            <li>Follow their school's safeguarding policy at all times</li>
            <li>Not use the platform in a way that could put a child at risk</li>
          </ul>
          <p>
            Schools are responsible for ensuring their staff receive appropriate training on both safeguarding and the acceptable use of AI tools, in line with KCSIE and their school's Acceptable Use Policy.
          </p>
        </Section>

        {/* Contact */}
        <Section icon={<Mail className="w-4 h-4" />} title="7. Safeguarding Contact">
          <p>Adaptly's designated safeguarding point of contact for platform-related concerns:</p>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex gap-2 text-sm">
              <Mail className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Safeguarding email:</span>{" "}
                <a href="mailto:safeguarding@adaptly.co.uk" className="text-brand underline">safeguarding@adaptly.co.uk</a>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <Phone className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Emergency:</span> 999 (police/ambulance) or 101 (non-emergency police)
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <Shield className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">NSPCC Helpline:</span>{" "}
                <a href="tel:08088005000" className="text-brand underline">0808 800 5000</a>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This Safeguarding Policy was last reviewed in <strong>{updated}</strong> and is reviewed annually. It will be updated in response to any changes in statutory guidance including KCSIE.
          </p>
        </Section>

        <div className="pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      </div>
    </div>
  );
}
