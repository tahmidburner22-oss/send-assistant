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
          <p className="text-muted-foreground text-sm">Last updated: March 2026 · Version 2.0 · Effective immediately upon account creation or use</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4 not-prose">
            <p className="text-sm font-semibold text-amber-800">Important Notice</p>
            <p className="text-sm text-amber-700 mt-1">By creating an account, accessing, or using Adaptly, you (the school, institution, or individual user) agree to be bound by these Terms in full. If you do not agree, you must not use this platform. These Terms constitute a legally binding agreement.</p>
          </div>

          <h2>1. Definitions</h2>
          <p><strong>"Licensor"</strong> means the individual developer and owner of the Adaptly platform.<br/>
          <strong>"Platform"</strong> means the Adaptly web application and all associated services.<br/>
          <strong>"Licensee"</strong> means the school, educational institution, or individual accessing the Platform.<br/>
          <strong>"User"</strong> means any individual who accesses the Platform under a Licensee account.<br/>
          <strong>"AI-Generated Content"</strong> means any output produced by artificial intelligence models integrated into the Platform.</p>

          <h2>2. Licence Grant</h2>
          <p>Subject to these Terms, the Licensor grants the Licensee a non-exclusive, non-transferable, revocable licence to access and use the Platform solely for internal educational purposes. This licence does not include the right to sublicense, resell, or redistribute the Platform or its outputs commercially.</p>

          <h2>3. Assumption of Full Responsibility by the Licensee</h2>
          <p>The Licensee and each User expressly acknowledges and agrees that:</p>
          <ul>
            <li>They assume <strong>full and sole responsibility</strong> for all content entered into the Platform, including any personal data, student information, or sensitive material.</li>
            <li>They assume <strong>full and sole responsibility</strong> for all AI-Generated Content produced by the Platform, including reviewing, verifying, and approving any such content before use with students or in any official capacity.</li>
            <li>The Licensor provides the Platform as a tool only. The Licensor does not review, moderate, or take responsibility for any content generated, entered, or distributed through the Platform.</li>
            <li>The Licensee is the <strong>Data Controller</strong> under UK GDPR and the Data Protection Act 2018 for all personal data processed through the Platform.</li>
            <li>The Licensee is responsible for ensuring all use of the Platform complies with applicable laws, regulations, school policies, and safeguarding obligations including KCSIE.</li>
            <li>The Licensee is responsible for ensuring that no personally identifiable information (PII) relating to students or staff is entered into AI generation prompts.</li>
            <li>The Licensee accepts full responsibility for any consequences arising from the use, misuse, or reliance on any content generated or processed through the Platform.</li>
          </ul>

          <h2>4. AI-Generated Content Disclaimer</h2>
          <p>AI-Generated Content is produced by third-party AI models and may contain errors, inaccuracies, biases, or inappropriate material. The Licensor makes <strong>no warranty</strong> as to the accuracy, completeness, appropriateness, or fitness for purpose of any AI-Generated Content. All AI-Generated Content must be reviewed by a qualified professional before use. The Licensor accepts no liability whatsoever for any harm, loss, or damage arising from the use of AI-Generated Content.</p>

          <h2>5. Limitation of Liability</h2>
          <p>To the fullest extent permitted by applicable law:</p>
          <ul>
            <li>The Licensor shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to loss of data, loss of profits, reputational damage, or harm to students or staff, arising from or in connection with the use of the Platform.</li>
            <li>The Licensor's total aggregate liability to the Licensee shall not exceed the amount paid by the Licensee to the Licensor in the 12 months preceding the claim, or £100, whichever is lower.</li>
            <li>The Licensor is not liable for any failure or delay caused by circumstances beyond their reasonable control, including third-party AI service outages, internet failures, or data breaches caused by third parties.</li>
            <li>The Licensor is not liable for any decisions made by the Licensee or Users based on AI-Generated Content.</li>
          </ul>

          <h2>6. Indemnification</h2>
          <p>The Licensee agrees to indemnify, defend, and hold harmless the Licensor and their affiliates, officers, and agents from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) the Licensee's or any User's use of the Platform; (b) any content entered into or generated through the Platform; (c) any violation of these Terms; (d) any violation of applicable law or regulation; (e) any claim by a third party, including students, parents, or regulatory bodies, arising from the Licensee's use of the Platform; or (f) any data breach or safeguarding incident caused by the Licensee's actions or omissions.</p>

          <h2>7. Acceptable Use</h2>
          <p>The Licensee and Users must not use the Platform to generate, store, or distribute illegal, harmful, or offensive content; process special category personal data of children without appropriate legal basis; circumvent any security measures; attempt to reverse-engineer or copy the Platform; or use the Platform in any way that violates applicable law or professional standards.</p>

          <h2>8. Eligibility and Intended Use</h2>
          <p><strong>Professional Use Only:</strong> Adaptly is intended exclusively for use by qualified educational professionals — including teachers, teaching assistants, SENCOs, school administrators, and other school staff. Users must be 18 or over. The Platform is not intended for direct use by pupils.</p>
          <p><strong>Pupil-Facing Features:</strong> Any features of the Platform that produce content intended for pupils (including worksheets, social stories, pupil passports, reading materials, and the parent portal) are provided for use under the direct supervision of a qualified teacher or SENCO. The school remains responsible for reviewing all AI-generated content before sharing it with pupils or parents.</p>
          <p><strong>DPA Incorporation:</strong> By creating an account, the Licensee agrees to be bound by Adaptly's <a href="/dpa">Data Processing Agreement</a>, which is incorporated into these Terms by reference. A countersigned copy is available on request from legal@adaptly.co.uk.</p>

          <h2>9. Safeguarding</h2>
          <p>The Licensee agrees to use the Platform in accordance with their school's safeguarding policy and all applicable statutory guidance. The Licensor accepts no responsibility for safeguarding incidents arising from the use of the Platform.</p>

          <h2>10. Intellectual Property Rights</h2>
          <p>The Platform, including all software, source code, algorithms, AI prompts, design, user interface, database schemas, curriculum data, skill ladder progressions, and all underlying technology, is the exclusive intellectual property of the Licensor and is protected by copyright, database rights, and other intellectual property laws of England and Wales and international treaties.</p>
          <p><strong>Database Rights:</strong> The Licensor asserts database rights under the Copyright and Rights in Databases Regulations 1997 over all structured data within the Platform, including but not limited to curriculum progression data, topic banks, SEND adaptation rules, skill ladder definitions, and any curated educational datasets. Extraction or re-utilisation of a substantial part of the contents of any such database is strictly prohibited.</p>
          <p><strong>Prohibited Actions:</strong> The Licensee and Users must not, and must not permit any third party to:</p>
          <ul>
            <li>Copy, reproduce, distribute, republish, download, display, post, or transmit any part of the Platform or its content in any form or by any means;</li>
            <li>Reverse-engineer, decompile, disassemble, or otherwise attempt to discover the source code, algorithms, or AI prompts of the Platform;</li>
            <li>Scrape, data-mine, or use automated tools to extract content, data, or information from the Platform;</li>
            <li>Create derivative works based on the Platform or any of its components;</li>
            <li>Remove, alter, or obscure any copyright, trademark, or other proprietary notices;</li>
            <li>Use the Platform's AI-generated worksheet structures, formatting systems, or SEND adaptation methodologies to build a competing product or service;</li>
            <li>Sub-license, sell, resell, transfer, assign, or otherwise commercially exploit or make available to any third party the Platform or any rights therein.</li>
          </ul>
          <p><strong>User Upload Licence:</strong> The Licensee retains ownership of original content they upload to or create using the Platform. By uploading or creating content, the Licensee grants the Licensor a non-exclusive, worldwide, royalty-free, perpetual licence to use, store, process, reproduce, and display such content solely for the purposes of operating, improving, and providing the Platform and its services. This licence survives termination of the Licensee's account.</p>
          <p><strong>AI-Generated Output:</strong> Worksheets and other AI-generated outputs created through the Platform are provided under the licence granted in Section 2. The Licensee may use such outputs for internal educational purposes only. The underlying AI prompts, formatting systems, and generation methodologies remain the exclusive intellectual property of the Licensor.</p>

          <h2>11. Termination</h2>
          <p>The Licensor may suspend or terminate access to the Platform at any time, with or without notice, for any breach of these Terms or at the Licensor's sole discretion. Upon termination, the Licensee must cease all use of the Platform.</p>

          <h2>12. Governing Law</h2>
          <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

          <h2>13. Changes to Terms</h2>
          <p>The Licensor reserves the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms.</p>

          <h2>14. Entire Agreement</h2>
          <p>These Terms, together with the Privacy Policy and Data Processing Agreement, constitute the entire agreement between the Licensor and the Licensee with respect to the Platform and supersede all prior agreements.</p>

          <p className="text-xs text-muted-foreground mt-8 border-t pt-4">For questions about these Terms, contact: admin@sendassistant.app</p>
        </div>
      </div>
    </div>
  );
}
