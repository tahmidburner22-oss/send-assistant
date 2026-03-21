import { useState } from "react";
import { ArrowLeft, Search, ChevronDown, ChevronUp, BookOpen, Shield, Users, Settings, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    icon: Zap,
    title: "Getting Started",
    articles: [
      { q: "How do I register my school?", a: "Go to the login page and click 'Register your school'. You'll be guided through our onboarding wizard where you'll enter your school name, URN, and DSL contact details. Once complete, you can invite your team." },
      { q: "How do I invite teachers and TAs?", a: "As a school admin or SENCO, go to Settings > Users > Invite User. Enter their email address and select their role. They'll receive an email invitation to create their account." },
      { q: "What is the onboarding tour?", a: "When you first log in, you'll see a guided tour highlighting the key features of Adaptly. You can restart the tour at any time from Settings > Help > Restart Tour." },
      { q: "How do I set up my API key for AI features?", a: "Go to Settings > AI Settings. You can enter your API key for Groq (free tier available), Google Gemini, OpenAI, or OpenRouter. Your key is encrypted and stored securely on your school's account — it is never shared with other schools or used outside your session." },
    ],
  },
  {
    icon: FileText,
    title: "AI Tools",
    articles: [
      { q: "How do I generate a worksheet?", a: "Click 'Worksheets' in the navigation. Select the subject, topic, year group, and SEND need. Click 'Generate' and the AI will create a differentiated worksheet. You can regenerate or edit the output." },
      { q: "How do I create a story?", a: "Click 'Stories' in the navigation. Enter the genre, characters, setting, and reading level. The AI will generate a story with optional comprehension questions." },
      { q: "What is the Differentiation tool?", a: "The Differentiation tool takes any existing task or text and adapts it for specific SEND needs. Paste your original task, select the SEND need, and click 'Differentiate'." },
      { q: "Is AI-generated content labelled?", a: "Yes. All AI-generated content is clearly marked with an 'AI-generated' badge. This helps you identify content that should be reviewed before use with pupils." },
    ],
  },
  {
    icon: Users,
    title: "Pupil Management",
    articles: [
      { q: "How do I add a pupil profile?", a: "Go to 'Pupils' in the navigation and click 'Add Pupil'. Enter the pupil's first name, year group, and SEND need. You can optionally add their UPN and date of birth." },
      { q: "How do I bulk import pupils?", a: "Go to Pupils > Bulk Import. Download the CSV template, fill it in with your pupils' details, and upload it. The system will create all profiles at once." },
      { q: "How do I assign work to a pupil?", a: "Open a pupil's profile and click 'Assign Work'. Select a worksheet or story from your history, or create a new one. The pupil's parent can view assigned work via the Parent Portal." },
      { q: "What is the Parent Portal?", a: "The Parent Portal allows parents to view their child's assigned work and submit completed work. Share the portal link and your child's access code (shown in their profile) with parents." },
    ],
  },
  {
    icon: Shield,
    title: "Safeguarding",
    articles: [
      { q: "What is the DSL and why do I need to enter their details?", a: "The Designated Safeguarding Lead (DSL) is your school's safeguarding contact. We capture their details during onboarding so that safeguarding incidents can be automatically reported to them." },
      { q: "How does AI content filtering work?", a: "All AI prompts and responses are automatically scanned for safeguarding concerns. If a concern is detected, the content is blocked, a safeguarding incident is created, and your DSL is notified by email." },
      { q: "How do I report a safeguarding incident manually?", a: "Go to Settings > Safeguarding > Report Incident. Fill in the details and submit. Your DSL will be notified automatically." },
      { q: "Is Adaptly KCSIE 2025 compliant?", a: "Yes. Adaptly is designed to align with Keeping Children Safe in Education 2025. Our KCSIE alignment documentation is available from Settings > Compliance." },
    ],
  },
  {
    icon: Settings,
    title: "Account & Security",
    articles: [
      { q: "How do I reset my password?", a: "On the login page, click 'Forgot password?' and enter your email address. You'll receive a reset link within a few minutes. Check your spam folder if it doesn't arrive." },
      { q: "How do I enable two-factor authentication (MFA)?", a: "Go to Settings > Security > Two-Factor Authentication. Click 'Enable MFA' and scan the QR code with an authenticator app (e.g. Google Authenticator, Authy). Enter the 6-digit code to confirm." },
      { q: "How long before I'm automatically logged out?", a: "For security, you are automatically logged out after 60 minutes of inactivity. You'll see a warning 5 minutes before this happens." },
      { q: "How do I deactivate a user account?", a: "As a school admin, go to Settings > Users. Find the user and click 'Deactivate'. Their account will be disabled immediately and they will not be able to log in." },
    ],
  },
  {
    icon: BookOpen,
    title: "Compliance & Legal",
    articles: [
      { q: "Where is my data stored?", a: "All data is stored in UK data centres. We do not transfer personal data outside the UK/EEA." },
      { q: "Does Adaptly use pupil data to train AI?", a: "No. Pupil data is never used to train AI models. Our Data Processing Agreement (DPA) includes contractual guarantees of this." },
      { q: "How do I request a Data Processing Agreement (DPA)?", a: "Our DPA is available at adaptly.co.uk/dpa. To execute it formally for your school, email legal@adaptly.co.uk with your school name and URN." },
      { q: "How do I submit a Subject Access Request?", a: "Email privacy@adaptly.co.uk with 'Subject Access Request' in the subject line. We will respond within 30 days." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-3 flex items-center justify-between gap-2 hover:text-brand transition-colors focus:outline-none focus:ring-2 focus:ring-brand rounded"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && <p className="text-sm text-muted-foreground pb-3 pr-6">{a}</p>}
    </div>
  );
}

export default function HelpCentre() {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? categories.map(c => ({
        ...c,
        articles: c.articles.filter(a =>
          a.q.toLowerCase().includes(search.toLowerCase()) ||
          a.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(c => c.articles.length > 0)
    : categories;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Help Centre</h1>
          <p className="text-muted-foreground mt-2">Find answers to common questions about Adaptly</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search help articles..."
            className="pl-9 h-11"
            aria-label="Search help articles"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No articles found for "{search}"</p>
            <p className="text-sm mt-1">Try a different search term or <a href="mailto:support@adaptly.co.uk" className="text-brand hover:underline">contact support</a></p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(cat => (
              <Card key={cat.title} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                      <cat.icon className="w-4 h-4 text-brand" />
                    </div>
                    <h2 className="font-semibold">{cat.title}</h2>
                  </div>
                  <div>
                    {cat.articles.map(a => <FAQItem key={a.q} q={a.q} a={a.a} />)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10 p-6 rounded-xl bg-brand/5 border border-brand/20 text-center">
          <h3 className="font-semibold mb-1">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-3">Our support team is available Monday–Friday, 8am–5pm</p>
          <Button asChild variant="outline">
            <a href="mailto:support@adaptly.co.uk">Email Support</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
