/**
 * AccessibilityPanel — SEND-friendly output controls for all AI tool pages.
 *
 * Provides:
 *   - Font size adjustment (12–24px in 2px steps)
 *   - Dyslexia-friendly font toggle (Comic Sans / OpenDyslexic fallback)
 *   - Colour overlay picker (cream, yellow, mint, blue, lavender, peach, pink)
 *
 * Previously only Differentiate and QuizJoin had these; now every tool gets
 * them via AIToolPage. State is persisted to localStorage so preferences
 * survive page navigation within the session.
 */
import { useState, useEffect } from "react";
import { Minus, Plus, Eye } from "lucide-react";
import { colorOverlays } from "@/lib/send-data";

const STORAGE_KEY = "adaptly_a11y_prefs_v1";

interface A11yPrefs {
  fontSize: number;
  dyslexiaFont: boolean;
  overlayId: string;
}

function loadPrefs(): A11yPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        fontSize: typeof p.fontSize === "number" ? Math.max(12, Math.min(24, p.fontSize)) : 14,
        dyslexiaFont: !!p.dyslexiaFont,
        overlayId: typeof p.overlayId === "string" ? p.overlayId : "none",
      };
    }
  } catch {}
  return { fontSize: 14, dyslexiaFont: false, overlayId: "none" };
}

function savePrefs(p: A11yPrefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

export interface AccessibilityStyles {
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
}

interface Props {
  onChange: (styles: AccessibilityStyles) => void;
  className?: string;
}

export function AccessibilityPanel({ onChange, className = "" }: Props) {
  const [prefs, setPrefs] = useState<A11yPrefs>(loadPrefs);

  // Emit styles whenever prefs change
  useEffect(() => {
    savePrefs(prefs);
    const overlay = colorOverlays.find(o => o.id === prefs.overlayId);
    onChange({
      fontSize: prefs.fontSize,
      fontFamily: prefs.dyslexiaFont
        ? "'Comic Sans MS', 'OpenDyslexic', 'Arial', sans-serif"
        : "inherit",
      backgroundColor: overlay?.color || "#FFFFFF",
    });
  }, [prefs, onChange]);

  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/30 ${className}`}>
      {/* Font size */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPrefs(p => ({ ...p, fontSize: Math.max(12, p.fontSize - 2) }))}
          className="w-7 h-7 rounded flex items-center justify-center border border-border hover:bg-muted text-xs"
          title="Decrease text size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-medium text-muted-foreground min-w-[28px] text-center">
          {prefs.fontSize}px
        </span>
        <button
          onClick={() => setPrefs(p => ({ ...p, fontSize: Math.min(24, p.fontSize + 2) }))}
          className="w-7 h-7 rounded flex items-center justify-center border border-border hover:bg-muted text-xs"
          title="Increase text size"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border/60" />

      {/* Dyslexia font toggle */}
      <button
        onClick={() => setPrefs(p => ({ ...p, dyslexiaFont: !p.dyslexiaFont }))}
        className={`h-7 px-2 rounded text-[10px] font-semibold border transition-colors ${
          prefs.dyslexiaFont
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-background text-muted-foreground border-border hover:border-indigo-400"
        }`}
        title="Toggle dyslexia-friendly font"
      >
        Aa
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-border/60" />

      {/* Colour overlay */}
      <div className="flex items-center gap-1">
        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        {colorOverlays.map(o => (
          <button
            key={o.id}
            onClick={() => setPrefs(p => ({ ...p, overlayId: o.id }))}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              prefs.overlayId === o.id ? "border-indigo-600 scale-110" : "border-transparent hover:border-border"
            }`}
            style={{ backgroundColor: o.color }}
            title={o.name}
          />
        ))}
      </div>
    </div>
  );
}

export default AccessibilityPanel;
