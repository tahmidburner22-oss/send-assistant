import { Shield, Mail, Clock, Database, Users, Lock, FileText, ChevronLeft, Bot, Globe } from "lucide-react";
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

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <span className="font-medium text-foreground min-w-[140px]">{label}</span>
    <span>{value}</span>
  </div>
);

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();
  const updated = "12 March 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand text-white px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-7 h-7" />
            <h1 className="text-2xl font-bold">Privacy Notice</h1>
          </div>
          <p className="text-white/80 text-sm">
            Adaptly is committed to protecting the privacy of pupils, staff, and parents in accordance with the
            UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
          <p className="text-white/60 text-xs mt-2">Last updated: {updated}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* 1. Who we are */}
        <Section icon={<Users className="w-4 h-4" />} title="1. Who We Are and Our Role">
          <p>
            Adaptly ("<strong>we</strong>", "<strong>us</strong>") operates the platform at <strong>adaptly.co.uk</strong>.
          </p>
          <p>
            Adaptly acts as a <strong>Data Processor</strong> on behalf of schools. Each school that uses Adaptly
            acts as the <strong>Data Controller</strong> — the school determines the purposes and means of processing
            pupil and staff data, and is responsible for ensuring it has a lawful basis and appropriate parental
            consent before adding any personal data to the platform.
          </p>
          <p>
            Adaptly acts as a <strong>Data Controller</strong> only for the limited data it processes for its own
            purposes (e.g. account registration, billing, and platform security).
          </p>
          <div className="bg-muted rounded-lg p-4 space-y-1.5">
            <Row label="Organisation" value="Adaptly" />
            <Row label="Website" value="https://adaptly.co.uk" />
            <Row label="Contact email" value="privacy@adaptly.co.uk" />
            <Row label="ICO registration" value="Pending registration" />
          </div>
          <p>
            A formal <strong>Data Processing Agreement (DPA)</strong> is available for schools to sign, setting out
            the obligations of both parties under UK GDPR Article 28. Please contact{" "}
            <strong>privacy@adaptly.co.uk</strong> to request a copy.
          </p>
        </Section>

        {/* 2. What data we collect */}
        <Section icon={<Database className="w-4 h-4" />} title="2. What Personal Data We Collect">
          <p>We collect the minimum data necessary to provide the service ("<strong>data minimisation</strong>" — UK GDPR Article 5(1)(c)).</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 border border-border font-medium">Data Category</th>
                  <th className="text-left p-2 border border-border font-medium">What is stored</th>
                  <th className="text-left p-2 border border-border font-medium">Who it relates to</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Account data", "Email address, hashed password, display name, role", "Teachers / staff"],
                  ["Pupil identifiers", "First name, last name, year group, class code", "Pupils"],
                  ["Pupil SEND data", "Primary SEND need category, reading age, additional needs notes", "Pupils"],
                  ["Parent/guardian data", "Parent name and email address (for portal access and communications)", "Parents / guardians"],
                  ["Assignments", "Worksheet titles, subjects, completion status, teacher comments", "Pupils"],
                  ["Attendance records", "Date, attendance status (present/absent/late), notes", "Pupils"],
                  ["Behaviour records", "Date, behaviour type, severity, notes", "Pupils"],
                  ["AI-generated content", "Worksheets, stories, reports generated using AI tools", "Pupils / staff"],
                  ["Audit logs", "Action type, timestamp, IP address, user ID", "Staff"],
                  ["Session data", "JWT token, IP address, user agent, expiry time", "Staff"],
                  ["Cookie consent", "Consent choices and timestamp", "All users"],
                ].map(([cat, what, who]) => (
                  <tr key={cat} className="even:bg-muted/30">
                    <td className="p-2 border border-border font-medium">{cat}</td>
                    <td className="p-2 border border-border">{what}</td>
                    <td className="p-2 border border-border">{who}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs">
              <strong>Special Category Data:</strong> SEND diagnoses and reading ages constitute special category health data under UK GDPR Article 9.
              Schools must confirm they hold appropriate parental consent before entering this data. Adaptly processes it solely to provide the educational support services requested by the school.
            </p>
          </div>
        </Section>

        {/* 3. Why we collect it */}
        <Section icon={<FileText className="w-4 h-4" />} title="3. Why We Collect It (Lawful Basis)">
          <p>
            Schools (as Data Controllers) rely on the following lawful bases when instructing Adaptly to process personal data:
          </p>
          <div className="space-y-2">
            {[
              ["Public task (Art. 6(1)(e))", "Providing educational support services as part of the school's statutory function under the Children and Families Act 2014."],
              ["Substantial public interest (Art. 9(2)(g))", "Processing special category SEND data to deliver statutory special educational needs provision."],
              ["Contract (Art. 6(1)(b))", "Processing account data to fulfil the agreement between Adaptly and the school."],
              ["Legal obligation (Art. 6(1)(c))", "Maintaining audit logs and security records as required by applicable law."],
            ].map(([basis, reason]) => (
              <div key={basis} className="flex gap-2">
                <span className="text-brand font-medium min-w-[240px] text-xs">{basis}</span>
                <span className="text-xs">{reason}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. AI Processing */}
        <Section icon={<Bot className="w-4 h-4" />} title="4. Artificial Intelligence and Automated Processing">
          <p>
            Adaptly uses third-party AI APIs to power core features including worksheet adaptation, SEND screening,
            story generation, and revision tools. We are committed to transparent and responsible AI use.
          </p>
          <div className="space-y-2">
            {[
              ["No AI training on pupil data", "Our agreements with all AI providers (OpenAI, Google, Groq) strictly prohibit the use of any data submitted through Adaptly for training, fine-tuning, or improving their foundational AI models."],
              ["Zero data retention", "Data sent to AI providers is processed in real time and not retained beyond the immediate request (zero-day retention where supported by the provider)."],
              ["No automated decision-making", "Adaptly does not make fully automated decisions (UK GDPR Article 22) that produce legal or similarly significant effects on pupils. All AI outputs — including SEND screener results, behaviour summaries, and generated worksheets — are reviewed and actioned by a qualified teacher or SENCO before any decision is made about a pupil."],
              ["AI as an assistive tool", "AI features are designed to reduce teacher workload and improve resource quality. The teacher remains in control of all decisions affecting pupils."],
            ].map(([heading, detail]) => (
              <div key={heading} className="bg-muted/40 rounded-lg p-3 space-y-0.5">
                <p className="font-medium text-xs text-foreground">{heading}</p>
                <p className="text-xs">{detail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 5. How long we keep it */}
        <Section icon={<Clock className="w-4 h-4" />} title="5. How Long We Keep Your Data (Retention Policy)">
          <p>
            We apply the <strong>storage limitation principle</strong> (UK GDPR Article 5(1)(e)) — data is kept
            only as long as necessary for its purpose and then securely deleted.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 border border-border font-medium">Data Type</th>
                  <th className="text-left p-2 border border-border font-medium">Retention Period</th>
                  <th className="text-left p-2 border border-border font-medium">Basis</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Staff account data", "Duration of account + 12 months", "Contract / legitimate interests"],
                  ["Active sessions (JWT)", "7 days from login", "Security requirement"],
                  ["Behaviour records", "3 years from date of record", "School records best practice (DfE)"],
                  ["Attendance records", "3 years from date of record", "School records best practice (DfE)"],
                  ["Worksheets & AI content", "2 years from creation", "Legitimate interests"],
                  ["Audit logs", "2 years", "Legal obligation / security"],
                  ["Password reset tokens", "1 hour from issue", "Security requirement"],
                  ["Deleted pupil data", "Immediately anonymised on erasure request", "UK GDPR Art. 17"],
                  ["Data on subscription termination", "Held for 30 days to allow export, then permanently deleted", "UK GDPR Art. 5(1)(e)"],
                ].map(([type, period, basis]) => (
                  <tr key={type} className="even:bg-muted/30">
                    <td className="p-2 border border-border font-medium">{type}</td>
                    <td className="p-2 border border-border">{period}</td>
                    <td className="p-2 border border-border">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs">
            When a school's subscription ends, the school administrator will be notified and given <strong>30 days</strong> to
            export all data. After this period, all pupil, staff, and school data associated with that account will be
            permanently and irreversibly deleted from all systems.
          </p>
        </Section>

        {/* 6. Sub-processors and international transfers */}
        <Section icon={<Globe className="w-4 h-4" />} title="6. Sub-processors and International Data Transfers">
          <p>
            We do not sell, rent, or share personal data with third parties for marketing purposes. Adaptly uses the
            following approved sub-processors to deliver the platform. Each is bound by a Data Processing Agreement
            or equivalent contractual safeguard.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 border border-border font-medium">Sub-processor</th>
                  <th className="text-left p-2 border border-border font-medium">Purpose</th>
                  <th className="text-left p-2 border border-border font-medium">Location</th>
                  <th className="text-left p-2 border border-border font-medium">Safeguard</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Railway", "Platform hosting and deployment", "EU (West)", "DPA / EU SCCs"],
                  ["TiDB Cloud", "Database hosting", "EU region", "DPA / EU SCCs"],
                  ["OpenAI", "AI content generation", "USA", "UK IDTA / EU SCCs"],
                  ["Google (Gemini)", "AI content generation", "USA", "UK IDTA / EU SCCs"],
                  ["Groq", "AI content generation", "USA", "UK IDTA / EU SCCs"],
                  ["Resend", "Transactional email delivery", "USA", "UK IDTA / EU SCCs"],
                ].map(([name, purpose, location, safeguard]) => (
                  <tr key={name} className="even:bg-muted/30">
                    <td className="p-2 border border-border font-medium">{name}</td>
                    <td className="p-2 border border-border">{purpose}</td>
                    <td className="p-2 border border-border">{location}</td>
                    <td className="p-2 border border-border">{safeguard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs">
            Transfers to US-based providers are governed by the <strong>UK International Data Transfer Agreement (IDTA)</strong> and/or
            EU Standard Contractual Clauses (SCCs) as adopted by the UK ICO. We will notify schools of any material
            changes to our sub-processor list.
          </p>
          <p className="text-xs">
            Data may also be disclosed where required by law, court order, or to protect the safety of a child (safeguarding obligation).
          </p>
        </Section>

        {/* 7. Your rights */}
        <Section icon={<Lock className="w-4 h-4" />} title="7. Your Rights Under UK GDPR">
          <p>You have the following rights regarding your personal data. To exercise any right, contact us at <strong>privacy@adaptly.co.uk</strong>:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ["Right of access (Art. 15)", "Request a copy of all data we hold about you."],
              ["Right to rectification (Art. 16)", "Ask us to correct inaccurate data."],
              ["Right to erasure (Art. 17)", "Ask us to delete your data ('right to be forgotten')."],
              ["Right to restrict processing (Art. 18)", "Ask us to pause processing your data."],
              ["Right to data portability (Art. 20)", "Receive your data in a machine-readable format."],
              ["Right to object (Art. 21)", "Object to processing based on legitimate interests."],
            ].map(([right, desc]) => (
              <div key={right} className="bg-muted/40 rounded-lg p-3 space-y-0.5">
                <p className="font-medium text-xs text-foreground">{right}</p>
                <p className="text-xs">{desc}</p>
              </div>
            ))}
          </div>
          <p>
            We will respond within <strong>30 days</strong> as required by UK GDPR Article 12. Where a request relates
            to pupil data, we may need to direct you to the school (as Data Controller) to action the request.
          </p>
          <p>
            If you are not satisfied with our response, you have the right to lodge a complaint with the
            <strong> Information Commissioner's Office (ICO)</strong> at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand underline">ico.org.uk</a>{" "}
            or by calling <strong>0303 123 1113</strong>.
          </p>
        </Section>

        {/* 8. Security */}
        <Section icon={<Lock className="w-4 h-4" />} title="8. How We Protect Your Data">
          <p>We implement appropriate technical and organisational measures (UK GDPR Article 32) including:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>All data transmitted over <strong>HTTPS/TLS</strong> with HSTS enforced</li>
            <li>Passwords stored using <strong>bcrypt</strong> hashing (never in plain text)</li>
            <li>Role-based access control — staff can only access data for their own school</li>
            <li>Full audit logging of all data access and modifications</li>
            <li>Input sanitisation to prevent XSS and injection attacks</li>
            <li>Rate limiting on all endpoints to prevent brute-force attacks</li>
            <li>All core infrastructure hosted within the EU</li>
          </ul>
        </Section>

        {/* 9. Children's Code */}
        <Section icon={<Shield className="w-4 h-4" />} title="9. Children's Data and the ICO Age Appropriate Design Code">
          <p>
            Adaptly processes personal data relating to children as part of its core function. We take our obligations
            under the ICO's <strong>Children's Code (Age Appropriate Design Code)</strong> seriously.
          </p>
          <p>
            The platform is designed for use by teachers and school staff — children do not directly log in to Adaptly.
            All access to pupil data is mediated through authenticated school staff accounts. Should any pupil-facing
            features be introduced in the future, a full Children's Code assessment will be conducted prior to launch.
          </p>
          <p>
            Schools are advised to apply strict data minimisation when adding pupil records and to avoid uploading
            any special category data beyond what is strictly necessary to deliver SEND support.
          </p>
        </Section>

        {/* 10. Cookies */}
        <Section icon={<Database className="w-4 h-4" />} title="10. Cookies">
          <p>We use the following cookies:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 border border-border font-medium">Cookie</th>
                  <th className="text-left p-2 border border-border font-medium">Purpose</th>
                  <th className="text-left p-2 border border-border font-medium">Duration</th>
                  <th className="text-left p-2 border border-border font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["token", "Authentication session", "7 days", "Strictly necessary"],
                  ["cookie_consent", "Stores your cookie preferences", "1 year", "Strictly necessary"],
                ].map(([name, purpose, duration, type]) => (
                  <tr key={name} className="even:bg-muted/30">
                    <td className="p-2 border border-border font-mono">{name}</td>
                    <td className="p-2 border border-border">{purpose}</td>
                    <td className="p-2 border border-border">{duration}</td>
                    <td className="p-2 border border-border">{type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>We do not use advertising, tracking, or analytics cookies.</p>
        </Section>

        {/* 11. Contact */}
        <Section icon={<Mail className="w-4 h-4" />} title="11. Contact Us">
          <p>For any data protection queries, subject access requests, or to exercise your rights:</p>
          <div className="bg-muted rounded-lg p-4 space-y-1.5">
            <Row label="Email" value="privacy@adaptly.co.uk" />
            <Row label="Website" value="https://adaptly.co.uk" />
            <Row label="Response time" value="Within 30 days (UK GDPR Art. 12)" />
          </div>
          <p className="text-xs text-muted-foreground">
            This Privacy Notice was last reviewed on <strong>{updated}</strong> and will be updated whenever
            there are material changes to how we process personal data. We will notify registered users of
            significant changes by email.
          </p>
        </Section>

        {/* Back button */}
        <div className="pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      </div>
    </div>
  );
}
