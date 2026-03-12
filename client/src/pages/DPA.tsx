import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DPA() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Data Processing Agreement</h1>
            <p className="text-muted-foreground mt-1 text-sm">For schools using Adaptly · March 2026</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="shrink-0">
            <Download className="w-4 h-4 mr-1" />Print / Save PDF
          </Button>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p>This Data Processing Agreement ("DPA") is entered into between:</p>
          <ul>
            <li><strong>Controller</strong>: The school or Multi-Academy Trust ("School") subscribing to Adaptly</li>
            <li><strong>Processor</strong>: Adaptly ("we", "us")</li>
          </ul>
          <p>This DPA forms part of the Terms of Service and governs the processing of personal data by Adaptly on behalf of the School.</p>

          <h2>1. Definitions</h2>
          <p>"Personal Data", "Processing", "Data Subject", "Controller", and "Processor" have the meanings given in the UK GDPR.</p>

          <h2>2. Subject Matter and Duration</h2>
          <p>We process personal data on behalf of the School for the duration of the subscription and for 12 months thereafter (for data export purposes).</p>

          <h2>3. Nature and Purpose of Processing</h2>
          <ul>
            <li>Providing the Adaptly platform and its features</li>
            <li>Storing and retrieving pupil profiles, worksheets, and attendance records</li>
            <li>Generating AI-assisted educational content</li>
            <li>Sending safeguarding notifications to the DSL</li>
            <li>Maintaining audit logs for compliance purposes</li>
          </ul>

          <h2>4. Categories of Personal Data</h2>
          <ul>
            <li>Staff: name, email, role, login activity</li>
            <li>Pupils: first name, year group, SEND need, UPN (optional), attendance, behaviour notes</li>
          </ul>
          <p>Special category data: SEND need categories may constitute health data under UK GDPR Article 9. The School is responsible for ensuring appropriate legal basis for processing this data.</p>

          <h2>5. Our Obligations as Processor</h2>
          <p>We shall:</p>
          <ul>
            <li>Process personal data only on documented instructions from the School</li>
            <li>Ensure persons authorised to process data are bound by confidentiality</li>
            <li>Implement appropriate technical and organisational security measures</li>
            <li>Not engage sub-processors without prior written consent</li>
            <li>Assist the School with data subject rights requests</li>
            <li>Delete or return all personal data upon termination</li>
            <li>Provide all information necessary to demonstrate compliance</li>
            <li>Notify the School without undue delay of any personal data breach</li>
          </ul>

          <h2>6. Sub-processors</h2>
          <p>We currently use the following approved sub-processors. Each is bound by a Data Processing Agreement or equivalent contractual safeguard:</p>
          <ul>
            <li><strong>Railway</strong> (EU-West) — Platform hosting and deployment</li>
            <li><strong>TiDB Cloud</strong> (EU region) — Database hosting</li>
            <li><strong>OpenAI</strong> (USA) — AI content generation; zero data-retention policy applied</li>
            <li><strong>Google (Gemini)</strong> (USA) — AI content generation; zero data-retention policy applied</li>
            <li><strong>Groq</strong> (USA) — AI content generation; zero data-retention policy applied</li>
            <li><strong>Resend</strong> (USA) — Transactional email delivery</li>
          </ul>
          <p>No AI provider is permitted to use data submitted through Adaptly for training, fine-tuning, or improving their foundational models. We will notify the School of any changes to this sub-processor list.</p>

          <h2>7. International Transfers</h2>
          <p>Core pupil data is stored within the EU (Railway and TiDB Cloud, EU regions). Some data is transmitted to US-based AI and email providers as described in Section 6. These transfers are governed by the <strong>UK International Data Transfer Agreement (IDTA)</strong> and/or EU Standard Contractual Clauses (SCCs) as adopted by the UK ICO.</p>

          <h2>8. Security Measures</h2>
          <ul>
            <li>TLS 1.3 encryption in transit</li>
            <li>AES-256 encryption at rest</li>
            <li>Bcrypt password hashing (cost factor 12)</li>
            <li>Role-based access control</li>
            <li>Full audit logging</li>
            <li>Regular security reviews</li>
          </ul>

          <h2>9. Data Breach Notification</h2>
          <p>We will notify the School <strong>within 48 hours</strong> of becoming aware of a personal data breach. Notification will include the nature of the breach, categories and approximate number of data subjects affected, and measures taken or proposed.</p>

          <h2>10. DPIA Support</h2>
          <p>We have completed a Data Protection Impact Assessment (DPIA) for Adaptly. A copy is available on request from <a href="mailto:privacy@adaptly.co.uk">privacy@adaptly.co.uk</a>.</p>

          <h2>11. Termination</h2>
          <p>Upon termination of the subscription, the School will be notified and may export all data for <strong>30 days</strong>. After this period, all pupil, staff, and school personal data will be permanently and irreversibly deleted from all systems. Audit logs are retained for 2 years as required by our security obligations.</p>

          <h2>12. Governing Law</h2>
          <p>This DPA is governed by the laws of England and Wales.</p>

          <p className="text-muted-foreground text-xs mt-8">To execute this DPA formally for your school, please email <a href="mailto:legal@adaptly.co.uk">legal@adaptly.co.uk</a> with your school name and URN.</p>
        </div>
      </div>
    </div>
  );
}
