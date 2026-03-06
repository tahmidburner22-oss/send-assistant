import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 2026 · Version 1.0</p>

          <p>This Privacy Policy explains how <strong>Adaptly</strong> ("we", "us", "our") collects, uses, and protects personal data when you use our platform. We are committed to full compliance with the <strong>UK General Data Protection Regulation (UK GDPR)</strong>, the <strong>Data Protection Act 2018</strong>, and the <strong>Privacy and Electronic Communications Regulations (PECR)</strong>.</p>

          <p>We have written this policy in plain English so it is easy to understand. If you have any questions, please contact us at <a href="mailto:privacy@adaptly.co.uk">privacy@adaptly.co.uk</a>.</p>

          <h2>1. Who We Are</h2>
          <p>Adaptly is a software-as-a-service (SaaS) platform designed for UK schools and Multi-Academy Trusts (MATs) to support Special Educational Needs and Disabilities (SEND) education. We act as a <strong>data processor</strong> on behalf of schools (the data controllers) when processing pupil data.</p>

          <h2>2. What Data We Collect</h2>
          <h3>Account holders (teachers, SENCOs, administrators)</h3>
          <ul>
            <li>Name and email address</li>
            <li>School name and URN</li>
            <li>Role within the school</li>
            <li>Login activity and session data</li>
            <li>IP address and browser type (for security)</li>
          </ul>
          <h3>Pupil data (entered by school staff)</h3>
          <ul>
            <li>First name and year group</li>
            <li>SEND need category (e.g. dyslexia, autism)</li>
            <li>UPN (optional)</li>
            <li>Date of birth (optional)</li>
            <li>Attendance records</li>
            <li>Behaviour notes</li>
            <li>Work assignments and submissions</li>
          </ul>
          <p><strong>We never collect pupil surnames, photographs, or contact details.</strong></p>

          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>To provide and improve the Adaptly platform</li>
            <li>To authenticate users and maintain account security</li>
            <li>To generate AI-assisted educational content</li>
            <li>To send transactional emails (password resets, notifications)</li>
            <li>To comply with our legal obligations</li>
          </ul>
          <p><strong>We never use pupil data to train AI models.</strong> All AI generation uses only the prompts you provide, not stored pupil records.</p>

          <h2>4. Legal Basis for Processing</h2>
          <ul>
            <li><strong>Contract performance</strong> — processing your account data to deliver the service</li>
            <li><strong>Legitimate interests</strong> — security monitoring, fraud prevention, service improvement</li>
            <li><strong>Legal obligation</strong> — safeguarding incident reporting, audit logs</li>
            <li><strong>Consent</strong> — optional analytics cookies (you can withdraw at any time)</li>
          </ul>

          <h2>5. Data Residency</h2>
          <p>All data is stored and processed in the <strong>United Kingdom</strong>. We do not transfer personal data outside the UK/EEA. Our servers are hosted in UK data centres.</p>

          <h2>6. AI and Third-Party Services</h2>
          <p>Adaptly uses AI language models to generate educational content. When you use AI features:</p>
          <ul>
            <li>Your prompts are sent to the AI provider you configure (Groq, Google Gemini, OpenAI, or OpenRouter) using <strong>your own API key</strong></li>
            <li>We do not share pupil personal data with AI providers</li>
            <li>AI providers process data under their own privacy policies</li>
            <li>All AI outputs are filtered for safeguarding concerns before being shown to users</li>
          </ul>

          <h2>7. Data Retention</h2>
          <ul>
            <li>Account data: retained for the duration of your subscription plus 12 months</li>
            <li>Pupil data: retained until your school deletes it or your account is closed</li>
            <li>Audit logs: retained for 7 years (legal requirement)</li>
            <li>Safeguarding incident records: retained for 25 years (statutory requirement)</li>
          </ul>

          <h2>8. Your Rights</h2>
          <p>Under UK GDPR, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> your personal data (Subject Access Request)</li>
            <li><strong>Rectify</strong> inaccurate data</li>
            <li><strong>Erase</strong> your data ("right to be forgotten")</li>
            <li><strong>Restrict</strong> processing</li>
            <li><strong>Data portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Object</strong> to processing based on legitimate interests</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:privacy@adaptly.co.uk">privacy@adaptly.co.uk</a>. We will respond within 30 days.</p>

          <h2>9. Cookies</h2>
          <p>We use the following cookies:</p>
          <ul>
            <li><strong>Strictly necessary</strong>: authentication session cookies (cannot be disabled)</li>
            <li><strong>Analytics</strong>: anonymous usage statistics (optional, requires consent)</li>
          </ul>
          <p>You can manage your cookie preferences using the cookie banner when you first visit the site.</p>

          <h2>10. Security</h2>
          <p>We implement appropriate technical and organisational measures including:</p>
          <ul>
            <li>Encryption in transit (TLS 1.3) and at rest</li>
            <li>Bcrypt password hashing</li>
            <li>Multi-factor authentication (optional)</li>
            <li>Full audit logging</li>
            <li>Session timeout after inactivity</li>
            <li>Role-based access control</li>
          </ul>

          <h2>11. Data Breach Notification</h2>
          <p>In the event of a personal data breach, we will notify affected schools within 72 hours and the ICO where required by law.</p>

          <h2>12. Contact and Complaints</h2>
          <p>Data Protection contact: <a href="mailto:privacy@adaptly.co.uk">privacy@adaptly.co.uk</a></p>
          <p>If you are unhappy with how we handle your data, you have the right to complain to the <strong>Information Commissioner's Office (ICO)</strong>: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a> or call 0303 123 1113.</p>
        </div>
      </div>
    </div>
  );
}
