import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 2026 · Version 1.0</p>

          <p>These Terms of Service ("Terms") govern your use of SEND Assistant ("the Service"). By creating an account or using the Service, you agree to these Terms. Please read them carefully.</p>

          <h2>1. The Service</h2>
          <p>SEND Assistant provides AI-powered tools to help UK educators support pupils with Special Educational Needs and Disabilities (SEND). The Service includes worksheet generation, story creation, differentiation tools, pupil management, and attendance tracking.</p>

          <h2>2. Eligibility</h2>
          <p>The Service is intended for use by:</p>
          <ul>
            <li>Qualified teachers and teaching assistants employed by UK schools</li>
            <li>SENCOs and school administrators</li>
            <li>Multi-Academy Trust administrators</li>
          </ul>
          <p>Users must be 18 or over. The Service is not intended for direct use by pupils.</p>

          <h2>3. School Accounts and Licences</h2>
          <p>Schools subscribe to SEND Assistant under one of the following licence types:</p>
          <ul>
            <li><strong>Free Trial</strong>: 30-day trial with full access, up to 5 users</li>
            <li><strong>Starter</strong>: Up to 10 users, core features</li>
            <li><strong>Professional</strong>: Unlimited users, all features including MIS integration</li>
            <li><strong>Enterprise / MAT</strong>: Multi-school management, custom onboarding</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service to generate content that is harmful, discriminatory, or illegal</li>
            <li>Share login credentials with unauthorised persons</li>
            <li>Attempt to reverse-engineer, scrape, or copy the Service</li>
            <li>Upload content that infringes third-party intellectual property rights</li>
            <li>Use the Service in a way that violates safeguarding obligations</li>
          </ul>

          <h2>5. AI-Generated Content</h2>
          <p>The Service uses artificial intelligence to generate educational content. You acknowledge that:</p>
          <ul>
            <li>AI-generated content is clearly labelled as such</li>
            <li>You are responsible for reviewing AI outputs before use with pupils</li>
            <li>AI outputs may occasionally contain errors or inaccuracies</li>
            <li>The AI model used is disclosed in our <a href="/ai-governance">AI Governance</a> page</li>
            <li>No pupil personal data is used to train AI models</li>
          </ul>

          <h2>6. Data Protection</h2>
          <p>You are the data controller for pupil data you enter into the Service. We act as your data processor. A Data Processing Agreement (DPA) is available at <a href="/dpa">sendassistant.app/dpa</a> and is incorporated into these Terms by reference.</p>

          <h2>7. Safeguarding</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate DSL contact details during school onboarding</li>
            <li>Respond promptly to safeguarding incident notifications</li>
            <li>Use the Service in accordance with your school's safeguarding policy and KCSIE 2025</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>You retain ownership of content you create using the Service. We retain ownership of the platform, software, and underlying AI infrastructure. You grant us a limited licence to process your content to deliver the Service.</p>

          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, SEND Assistant's liability is limited to the fees paid in the 12 months preceding the claim. We are not liable for indirect, consequential, or incidental damages.</p>

          <h2>10. Termination</h2>
          <p>Either party may terminate the subscription with 30 days' written notice. Upon termination, you may export your data for 30 days before it is deleted.</p>

          <h2>11. Changes to These Terms</h2>
          <p>We will notify you of material changes to these Terms by email at least 30 days in advance. Continued use of the Service after the effective date constitutes acceptance.</p>

          <h2>12. Governing Law</h2>
          <p>These Terms are governed by the laws of England and Wales. Disputes will be resolved in the courts of England and Wales.</p>

          <h2>13. Contact</h2>
          <p>For questions about these Terms: <a href="mailto:legal@sendassistant.app">legal@sendassistant.app</a></p>
        </div>
      </div>
    </div>
  );
}
