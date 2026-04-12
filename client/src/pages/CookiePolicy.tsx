import { ArrowLeft, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Cookie className="w-8 h-8 text-brand" />
              <h1 className="text-3xl font-bold">Cookie Policy</h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Last updated: March 2026</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p>
            This Cookie Policy explains how Adaptly ("we", "us", and "our") uses cookies and similar technologies to recognize you when you visit our platform at adaptly.co.uk. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>

          <h2>1. What are cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>

          <h2>2. Why do we use cookies?</h2>
          <p>
            We use first-party cookies for several reasons. Some cookies are required for technical reasons in order for our platform to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our platform.
          </p>

          <h2>3. Types of cookies we use</h2>
          
          <h3>Essential Cookies</h3>
          <p>
            These cookies are strictly necessary to provide you with services available through our platform and to use some of its features, such as access to secure areas.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2 border border-border font-medium">Cookie Name</th>
                  <th className="text-left p-2 border border-border font-medium">Purpose</th>
                  <th className="text-left p-2 border border-border font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="even:bg-muted/30">
                  <td className="p-2 border border-border font-mono text-xs">adaptly_session</td>
                  <td className="p-2 border border-border">Secure, httpOnly authentication session cookie that keeps you logged in. This cookie is not accessible to JavaScript and cannot be read by third-party scripts.</td>
                  <td className="p-2 border border-border">7 days</td>
                </tr>
                <tr className="even:bg-muted/30">
                  <td className="p-2 border border-border font-mono text-xs">send_cookie_consent</td>
                  <td className="p-2 border border-border">Stores your cookie consent preferences</td>
                  <td className="p-2 border border-border">1 year</td>
                </tr>
                <tr className="even:bg-muted/30">
                  <td className="p-2 border border-border font-mono text-xs">sidebar:state</td>
                  <td className="p-2 border border-border">Remembers if the sidebar is expanded or collapsed</td>
                  <td className="p-2 border border-border">7 days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Analytics Cookies</h3>
          <p>
            These cookies collect information that is used either in aggregate form to help us understand how our platform is being used or how effective our marketing campaigns are, or to help us customize our platform for you.
          </p>
          <p>
            <em>We currently do not use any third-party analytics cookies (such as Google Analytics) without your explicit consent.</em>
          </p>

          <h2>4. How can I control cookies?</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
          </p>
          <p>
            You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
          </p>

          <h2>5. Updates to this policy</h2>
          <p>
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
          </p>
        </div>
      </div>
    </div>
  );
}
