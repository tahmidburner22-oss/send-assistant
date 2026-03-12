/**
 * Reading — dedicated reading section
 * ─────────────────────────────────────────────────────────────────────────────
 * Three tabs:
 *  1. Stories       — AI-generated personalised stories (existing Stories page)
 *  2. Book Questions — Enter a book + reading age + pages read → AI comprehension questions
 *  3. Book Review    — Enter a book title → AI summary + review before reading
 *
 * Tab can be set via ?tab=book-questions or ?tab=book-review query param
 * (used by sidebar links)
 */
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, HelpCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import StoriesContent from "./reading/StoriesContent";
import BookQuestionsTab from "./reading/BookQuestionsTab";
import BookReviewTab from "./reading/BookReviewTab";

type Tab = "stories" | "book-questions" | "book-review";

function getInitialTab(): Tab {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "book-questions" || tab === "book-review") return tab;
  }
  return "stories";
}

export default function Reading() {
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);

  // Sync tab when URL changes (e.g. sidebar link clicked while already on /reading)
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as Tab | null;
      if (tab === "book-questions" || tab === "book-review") {
        setActiveTab(tab);
      } else if (!tab) {
        setActiveTab("stories");
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand" />
          Reading
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate stories, create comprehension questions for any book, or get a review before reading.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Tab)}>
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="stories" className="text-xs flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />Stories
          </TabsTrigger>
          <TabsTrigger value="book-questions" className="text-xs flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />Book Questions
          </TabsTrigger>
          <TabsTrigger value="book-review" className="text-xs flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" />Book Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="mt-0">
          {/* StoriesContent is the inner content of the old Stories page, without outer padding */}
          <StoriesContent />
        </TabsContent>

        <TabsContent value="book-questions" className="mt-4">
          <BookQuestionsTab />
        </TabsContent>

        <TabsContent value="book-review" className="mt-4">
          <BookReviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
