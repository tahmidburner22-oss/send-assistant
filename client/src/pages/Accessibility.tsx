import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1>Accessibility Statement</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 2026</p>

          <p>Adaptly is committed to making our platform accessible to everyone, including users with disabilities. We aim to meet <strong>WCAG 2.2 Level AA</strong> standards.</p>

          <h2>Our Commitment</h2>
          <p>As a platform designed for SEND educators, accessibility is central to our mission. We believe that the tools we build should be usable by everyone, regardless of disability or assistive technology.</p>

          <h2>Conformance Status</h2>
          <p>Adaptly is <strong>partially conformant</strong> with WCAG 2.2 Level AA. We are actively working to achieve full conformance.</p>

          <h2>What We Have Done</h2>
          <ul>
            <li><strong>Keyboard navigation</strong>: All interactive elements are reachable and operable via keyboard</li>
            <li><strong>Screen reader support</strong>: ARIA labels, roles, and live regions are used throughout</li>
            <li><strong>Colour contrast</strong>: All text meets WCAG 2.2 AA contrast ratios (4.5:1 for normal text, 3:1 for large text)</li>
            <li><strong>Focus indicators</strong>: Visible focus rings on all interactive elements</li>
            <li><strong>Semantic HTML</strong>: Proper heading hierarchy, landmark regions, and form labels</li>
            <li><strong>Colour overlays</strong>: Built-in colour overlay options for users with visual processing difficulties (including dyslexia-friendly overlays)</li>
            <li><strong>Responsive design</strong>: Works on mobile, tablet, and desktop</li>
            <li><strong>No time limits</strong>: No content auto-expires or times out without warning</li>
            <li><strong>Error identification</strong>: Form errors are clearly identified and described in text</li>
          </ul>

          <h2>Known Issues</h2>
          <ul>
            <li>Some complex data tables may not be fully optimised for screen readers — we are working on this</li>
            <li>PDF export functionality has limited accessibility — we recommend using the on-screen view</li>
          </ul>

          <h2>Testing</h2>
          <p>We have tested Adaptly using:</p>
          <ul>
            <li>NVDA screen reader (Windows)</li>
            <li>VoiceOver (macOS and iOS)</li>
            <li>TalkBack (Android)</li>
            <li>Keyboard-only navigation</li>
            <li>axe DevTools automated accessibility checker</li>
            <li>WAVE accessibility evaluation tool</li>
          </ul>

          <h2>Feedback and Contact</h2>
          <p>If you experience any accessibility barriers, please contact us:</p>
          <ul>
            <li>Email: <a href="mailto:accessibility@adaptly.co.uk">accessibility@adaptly.co.uk</a></li>
            <li>We aim to respond within 5 working days</li>
          </ul>

          <h2>Enforcement</h2>
          <p>If you are not satisfied with our response, you can contact the <strong>Equality Advisory and Support Service (EASS)</strong>: <a href="https://www.equalityadvisoryservice.com" target="_blank" rel="noopener noreferrer">equalityadvisoryservice.com</a></p>

          <p>This statement was prepared on 1 March 2026 and is reviewed annually.</p>
        </div>
      </div>
    </div>
  );
}
