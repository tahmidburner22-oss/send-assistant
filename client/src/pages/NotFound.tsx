import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, Home, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { isLoggedIn } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-background to-background flex items-center justify-center p-4" role="main">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand mx-auto mb-6 flex items-center justify-center shadow-lg" aria-hidden="true">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <div className="text-8xl font-bold text-brand/20 mb-4 select-none" aria-hidden="true">404</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-8">Sorry, we couldn't find the page you're looking for. It may have been moved or doesn't exist.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="bg-brand hover:bg-brand/90 text-white" onClick={() => setLocation(isLoggedIn ? "/home" : "/")}>
            <Home className="w-4 h-4 mr-2" aria-hidden="true" />{isLoggedIn ? "Go to Dashboard" : "Go to Login"}
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />Go Back
          </Button>
          <Button variant="ghost" onClick={() => setLocation("/help")}>
            <HelpCircle className="w-4 h-4 mr-2" aria-hidden="true" />Help Centre
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-8">
          Adaptly · <a href="mailto:support@adaptly.co.uk" className="hover:underline">support@adaptly.co.uk</a>
        </p>
      </motion.div>
    </div>
  );
}
