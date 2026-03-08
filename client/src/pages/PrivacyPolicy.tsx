import { Shield, Mail, Clock, Database, Users, Lock, FileText, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const updated = "8 March 2026";

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
        <Section icon={<Users className="w-4 h-4" />} title="1. Who We Are (Data Controller)">
          <p>
            Adaptly ("<strong>we</strong>", "<strong>us</strong>") operates the platform at <strong>adaptly.co.uk</strong>.
            We act as the <strong>Data Controller</strong> for personal data processed through this platform.
          </p>
          <div className="bg-muted rounded-lg p-4 space-y-1.5">
            <Row label="Organisation" value="Adaptly" />
            <Row label="Website" value="https://adaptly.co.uk" />
            <Row label="Contact email" value="privacy@adaptly.co.uk" />
            <Row label="ICO registration" value="Pending registration" />
          </div>
          <p>
            Each school that uses Adaptly acts as a separate Data Controller for the pupil and staff data they
            enter. Schools are responsible for ensuring they have appropriate legal basis and parental consent
            before adding any pupil information to the platform.
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
                  ["Pupil identifiers", "Initials only (max 4 characters) — no full names, DOB, or UPN", "Pupils"],
                  ["Pupil SEND data", "Year group, primary SEND need category", "Pupils"],
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
              <strong>Pupil anonymisation:</strong> We deliberately restrict pupil name fields to <strong>initials only (maximum 4 characters)</strong>.
              Full names, dates of birth, addresses, and other directly identifying information are never collected or stored.
            </p>
          </div>
        </Section>

        {/* 3. Why we collect it */}
        <Section icon={<FileText className="w-4 h-4" />} title="3. Why We Collect It (Legal Basis)">
          <p>Under UK GDPR Article 6, we rely on the following lawful bases:</p>
          <div className="space-y-2">
            {[
              ["Legitimate interests (Art. 6(1)(f))", "Providing the core platform features — worksheets, behaviour tracking, attendance, AI tools — to support SEND education."],
              ["Contract (Art. 6(1)(b))", "Processing account data to fulfil our agreement with the school or individual user."],
              ["Legal obligation (Art. 6(1)(c))", "Maintaining audit logs and security records as required by applicable law."],
            ].map(([basis, reason]) => (
              <div key={basis} className="flex gap-2">
                <span className="text-brand font-medium min-w-[220px] text-xs">{basis}</span>
                <span className="text-xs">{reason}</span>
              </div>
            ))}
          </div>
          <p>
            Where data relates to <strong>Special Category data</strong> (e.g. SEND needs — UK GDPR Article 9),
            we rely on <strong>Article 9(2)(g)</strong> — substantial public interest in the provision of special
            educational needs support — and require schools to confirm they hold appropriate consent from parents/carers.
          </p>
        </Section>

        {/* 4. How long we keep it */}
        <Section icon={<Clock className="w-4 h-4" />} title="4. How Long We Keep Your Data (Retention Policy)">
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
        </Section>

        {/* 5. Who we share it with */}
        <Section icon={<Users className="w-4 h-4" />} title="5. Who We Share Data With">
          <p>We <strong>do not sell, rent, or share</strong> personal data with third parties for marketing purposes. Data is shared only in the following circumstances:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>AI providers</strong> — anonymised prompt content is sent to AI APIs (OpenAI / Google Gemini) to generate educational content. No pupil names or identifying information is included in AI prompts.</li>
            <li><strong>Hosting infrastructure</strong> — the platform is hosted on Railway (railway.app), a cloud provider with data centres in the EU/UK. Railway acts as a Data Processor under a Data Processing Agreement.</li>
            <li><strong>Legal obligation</strong> — we may disclose data if required by law, court order, or to protect the safety of a child.</li>
          </ul>
        </Section>

        {/* 6. Your rights */}
        <Section icon={<Lock className="w-4 h-4" />} title="6. Your Rights Under UK GDPR">
          <p>You have the following rights regarding your personal data:</p>
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
            To exercise any of these rights, contact us at <strong>privacy@adaptly.co.uk</strong>.
            We will respond within <strong>30 days</strong> as required by UK GDPR Article 12.
          </p>
          <p>
            If you are not satisfied with our response, you have the right to lodge a complaint with the
            <strong> Information Commissioner's Office (ICO)</strong> at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand underline">ico.org.uk</a>{" "}
            or by calling <strong>0303 123 1113</strong>.
          </p>
        </Section>

        {/* 7. Security */}
        <Section icon={<Lock className="w-4 h-4" />} title="7. How We Protect Your Data">
          <p>We implement appropriate technical and organisational measures (UK GDPR Article 32) including:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>All data transmitted over <strong>HTTPS/TLS</strong> with HSTS enforced</li>
            <li>Passwords stored using <strong>bcrypt</strong> (cost factor 12) — never in plain text</li>
            <li>JWT authentication tokens with short expiry and server-side session validation</li>
            <li>Role-based access control — staff can only access data for their own school</li>
            <li>Full audit logging of all data access and modifications</li>
            <li>Input sanitisation to prevent XSS and injection attacks</li>
            <li>Rate limiting on all endpoints to prevent brute-force attacks</li>
            <li>Pupil data minimised to initials only — no full names stored</li>
          </ul>
        </Section>

        {/* 8. Cookies */}
        <Section icon={<Database className="w-4 h-4" />} title="8. Cookies">
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

        {/* 9. Contact */}
        <Section icon={<Mail className="w-4 h-4" />} title="9. Contact Us">
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
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      </div>
    </div>
  );
}
