import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Home, Sparkles, FileText, BookOpen, LayoutGrid, Users, Clock,
  BarChart3, Lightbulb, Settings, ScanSearch, Headphones, Zap, NotebookPen, ScrollText
} from "lucide-react";

const menuItems = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/send-screener", label: "SEND Needs Screener", icon: ScanSearch },
  { path: "/differentiate", label: "Differentiate", icon: Sparkles },
  { path: "/worksheets", label: "Worksheets", icon: FileText },
  { path: "/reading", label: "Reading", icon: BookOpen },
  { path: "/past-papers", label: "Past Papers", icon: ScrollText },
  { path: "/templates", label: "Pre-made Worksheets", icon: LayoutGrid },
  { path: "/pupils", label: "Pupils", icon: Users },
  { path: "/revision-hub", label: "Revision Hub", icon: Headphones },
  { path: "/quiz-game", label: "QuizBlast", icon: Zap },
  { path: "/daily-briefing", label: "Daily Briefing", icon: NotebookPen },
  { path: "/history", label: "History", icon: Clock },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/ideas", label: "Ideas", icon: Lightbulb },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          {menuItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => {
                setLocation(item.path);
                setOpen(false);
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
