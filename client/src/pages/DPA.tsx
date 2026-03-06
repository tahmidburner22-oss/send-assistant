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
            <p className="text-muted-foreground mt-1 text-sm">For schools using SEND Assistant · March 2026</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="shrink-0">
            <Download className="w-4 h-4 mr-1" />Print / Save PDF
          </Button>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p>This Data Processing Agreement ("DPA") is entered into between:</p>
          <ul>
            <li><strong>Controller</strong>: The school or Multi-Academy Trust ("School") subscribing to SEND Assistant</li>
            <li><strong>Processor</strong>: SEND Assistant ("we", "us")</li>
          </ul>
          <p>This DPA forms part of the Terms of Service and governs the processing of personal data by SEND Assistant on behalf of the School.</p>

          <h2>1. Definitions</h2>
          <p>"Personal Data", "Processing", "Data Subject", "Controller", and "Processor" have the meanings given in the UK GDPR.</p>

          <h2>2. Subject Matter and Duration</h2>
          <p>We process personal data on behalf of the School for the duration of the subscription and for 12 months thereafter (for data export purposes).</p>

          <h2>3. Nature and Purpose of Processing</h2>
          <ul>
            <li>Providing the SEND Assistant platform and its features</li>
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
          <p>We currently use the following sub-processors:</p>
          <ul>
            <li><strong>Hosting provider</strong>: UK-based server infrastructure</li>
            <li><strong>Email service</strong>: Transactional email delivery (SMTP)</li>
          </ul>
          <p>AI providers (Groq, Google, OpenAI, OpenRouter) are used only with your own API key and do not receive pupil personal data from SEND Assistant.</p>

          <h2>7. International Transfers</h2>
          <p>All personal data is stored and processed in the United Kingdom. We do not transfer personal data outside the UK/EEA.</p>

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
          <p>We will notify the School within 72 hours of becoming aware of a personal data breach. Notification will include the nature of the breach, categories and approximate number of data subjects affected, and measures taken or proposed.</p>

          <h2>10. DPIA Support</h2>
          <p>We have completed a Data Protection Impact Assessment (DPIA) for SEND Assistant. A copy is available on request from <a href="mailto:privacy@sendassistant.app">privacy@sendassistant.app</a>.</p>

          <h2>11. Termination</h2>
          <p>Upon termination of the subscription, the School may export all data for 30 days. After this period, all personal data will be permanently deleted from our systems, except audit logs which are retained for 7 years as required by law.</p>

          <h2>12. Governing Law</h2>
          <p>This DPA is governed by the laws of England and Wales.</p>

          <p className="text-muted-foreground text-xs mt-8">To execute this DPA formally for your school, please email <a href="mailto:legal@sendassistant.app">legal@sendassistant.app</a> with your school name and URN.</p>
        </div>
      </div>
    </div>
  );
}
