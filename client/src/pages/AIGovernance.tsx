import { ArrowLeft, Bot, Shield, Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AIGovernance() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Governance</h1>
          <p className="text-muted-foreground mt-2">How we use artificial intelligence responsibly in Adaptly</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: Bot, title: "AI Model Disclosed", desc: "We tell you exactly which AI models power our tools" },
            { icon: Shield, title: "No Training on Pupil Data", desc: "Pupil data is never used to train AI models" },
            { icon: Eye, title: "Clearly Labelled", desc: "All AI-generated content is clearly marked" },
            { icon: Users, title: "Human Oversight", desc: "Teachers review all AI outputs before use" },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/50">
              <CardContent className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h2>Which AI Models We Use</h2>
          <p>Adaptly is a <strong>Bring Your Own Key (BYOK)</strong> platform. This means you connect your own AI provider account. We support:</p>
          <ul>
            <li><strong>Groq</strong> — Llama 3.3 70B (default, free tier available)</li>
            <li><strong>Google Gemini</strong> — Gemini 2.0 Flash</li>
            <li><strong>OpenAI</strong> — GPT-4o Mini, GPT-4o</li>
            <li><strong>OpenRouter</strong> — Access to 100+ models</li>
          </ul>
          <p>Your API key is stored in your browser and sent directly to the AI provider. Adaptly does not store your API key on our servers.</p>

          <h2>How AI Is Used</h2>
          <ul>
            <li><strong>Worksheet generation</strong>: Creating differentiated worksheets tailored to SEND needs</li>
            <li><strong>Story creation</strong>: Generating accessible stories with comprehension questions</li>
            <li><strong>Differentiation</strong>: Adapting existing tasks for different learning needs</li>
          </ul>

          <h2>What AI Is Not Used For</h2>
          <ul>
            <li>Making decisions about individual pupils</li>
            <li>Generating safeguarding reports or recommendations</li>
            <li>Replacing professional SEND assessment</li>
            <li>Processing or analysing pupil personal data</li>
          </ul>

          <h2>No Anthropomorphisation</h2>
          <p>Adaptly does not present AI as a human, person, or sentient being. All AI outputs are clearly labelled as AI-generated. We do not use language that implies the AI has feelings, opinions, or consciousness.</p>

          <h2>Content Filtering and Safeguarding</h2>
          <p>All AI prompts and responses are automatically filtered for safeguarding concerns before being shown to users. If a prompt or response is flagged:</p>
          <ul>
            <li>The content is blocked</li>
            <li>A safeguarding incident is automatically created</li>
            <li>Your school's DSL is notified by email</li>
            <li>The event is recorded in the audit log</li>
          </ul>

          <h2>No Pupil Data Used for Training</h2>
          <p>We explicitly prohibit the use of pupil data for AI model training. Our Data Processing Agreement (DPA) includes contractual guarantees that:</p>
          <ul>
            <li>Pupil data entered into Adaptly is never sent to AI providers</li>
            <li>AI prompts contain only the information you explicitly type</li>
            <li>We do not use any data to fine-tune or train AI models</li>
          </ul>

          <h2>DfE AI Safety Standards Alignment</h2>
          <p>Adaptly is designed to align with the <strong>Department for Education's AI Safety Standards for Education</strong> (2024):</p>
          <ul>
            <li>✓ Transparency about AI use</li>
            <li>✓ Human oversight of AI outputs</li>
            <li>✓ Data minimisation in AI prompts</li>
            <li>✓ Safeguarding content filtering</li>
            <li>✓ Clear labelling of AI-generated content</li>
            <li>✓ No automated decision-making about pupils</li>
          </ul>

          <h2>Accountability</h2>
          <p>Questions about our AI use: <a href="mailto:ai@adaptly.co.uk">ai@adaptly.co.uk</a></p>
        </div>
      </div>
    </div>
  );
}
