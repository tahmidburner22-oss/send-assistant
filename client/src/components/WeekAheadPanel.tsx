/**
 * WeekAheadPanel — Phase A · PR-4 · "Your week, ready to print"
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Renders up to 5 lesson cards aggregated from the per-pupil scheduler
 * (`lib/scheduler.ts`). Each card represents one upcoming class lesson and
 * exposes a one-click "Generate" button that hands off to the existing
 * Worksheets page in Auto-from-class mode (PR-2). A footer "Print all"
 * button generates every card in parallel and opens a single print window
 * containing the full set.
 *
 * The panel is read-only on the data layer — it never mutates scheduler
 * configs, never calls the backend, and never persists generated worksheets.
 * Saving / printing / assigning are all done from the Worksheets page once
 * the teacher actually opens a card.
 *
 * Mounted at the top of `/home` and `/daily-work`.
 *
 * Notes:
 *   - "Class" is currently modelled as `Child.yearGroup` (matches the
 *     ClassPackDialog and PR-1 convention). One scheduler entry per pupil
 *     rolls up to one card per year-group; we pick the most-recent
 *     scheduler within each year-group as the representative entry for
 *     subject/topic.
 *   - We deliberately do NOT mount this panel in tests yet — see PR-4 spec
 *     for follow-up tests.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck, Printer, Sparkles, Loader2, AlertCircle, ArrowRight,
  Settings as SettingsIcon,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  loadAllSchedulers,
  type SchedulerConfig,
  isDue,
} from "@/lib/scheduler";
import {
  buildClassAutoBrief,
  classAutoBriefIsUsable,
  type ClassAutoBrief,
} from "@/lib/class-auto-brief";
import { aiGenerateWorksheetFromClassBrief, type AIWorksheetResult } from "@/lib/ai";
import {
  buildPopupHtml,
  getKatexCssInline,
} from "@/lib/pdf-generator-v2";
import {
  prefetchWeekAhead,
  evictStaleWeekAhead,
  weekAheadCacheKey,
  WEEK_AHEAD_CACHE_PREFIX,
} from "@/lib/prefetch";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekAheadCard {
  /** Stable id used for cache + keys. Derived from classId + due-date. */
  id: string;
  classId: string;
  classLabel: string;
  /** Subject from the dominant scheduler entry for this class. */
  subject: string;
  /** Suggested topic — empty string if none could be derived. */
  topic: string;
  pupilCount: number;
  /** ISO timestamp of the next-due (or last-fired) entry for this class. */
  whenISO: string;
  /** Human-friendly label, e.g. "Mon", "Today", "Wed". */
  whenLabel: string;
  /** True when the cached prefetch result is available (instant click). */
  hasPrefetch: boolean;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

/** Local re-export so callers can import everything from this module. */
export { WEEK_AHEAD_CACHE_PREFIX };

const todayISODate = (): string => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

function shortDayLabel(iso: string): string {
  if (!iso) return "—";
  const today = todayISODate();
  const date = new Date(iso);
  const dateISO = date.toISOString().slice(0, 10);
  if (dateISO === today) return "Today";
  // Tomorrow check
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.toISOString().slice(0, 10) === dateISO) return "Tomorrow";
  // Within the next week — show "Mon", "Tue", ...
  const diff = (date.getTime() - new Date(today).getTime()) / 86400000;
  if (diff >= -1 && diff <= 7) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  }
  // Otherwise short DD MMM
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/**
 * Group per-pupil scheduler entries by `Child.yearGroup` and produce up to
 * `max` cards. We prefer entries that are enabled and currently due; we
 * fall back to enabled-but-not-due, then to disabled (recently-fired) so
 * we never render a fully-empty week if any signal exists.
 */
export function buildWeekAheadCards(
  schedulers: Record<string, SchedulerConfig>,
  childIdToYearGroup: Map<string, string>,
  childIdToClassLabel: Map<string, string>,
  pupilCountByClass: Map<string, number>,
  max = 5,
): WeekAheadCard[] {
  type Bucket = {
    classId: string;
    classLabel: string;
    subject: string;
    pupilCount: number;
    whenISO: string;
    enabled: boolean;
    due: boolean;
    lastFiredAt: string | null;
    representativePupilId: string;
  };

  // First pass — pick the "best" scheduler per yearGroup.
  const byClass = new Map<string, Bucket>();
  for (const [pupilId, cfg] of Object.entries(schedulers)) {
    const classId = childIdToYearGroup.get(pupilId);
    if (!classId) continue;
    const enabled = !!cfg.enabled;
    const due = isDue(cfg);
    const whenISO = cfg.nextFireAt || cfg.lastFiredAt || "";
    const rank = (enabled ? 2 : 0) + (due ? 1 : 0); // higher = better
    const existing = byClass.get(classId);
    if (!existing) {
      byClass.set(classId, {
        classId,
        classLabel: childIdToClassLabel.get(pupilId) || classId,
        subject: cfg.subject || "",
        pupilCount: pupilCountByClass.get(classId) || 1,
        whenISO,
        enabled,
        due,
        lastFiredAt: cfg.lastFiredAt,
        representativePupilId: pupilId,
      });
      continue;
    }
    const existingRank = (existing.enabled ? 2 : 0) + (existing.due ? 1 : 0);
    if (rank > existingRank ||
        (rank === existingRank && (whenISO || "") < (existing.whenISO || ""))) {
      byClass.set(classId, {
        ...existing,
        subject: cfg.subject || existing.subject,
        whenISO,
        enabled,
        due,
        lastFiredAt: cfg.lastFiredAt,
        representativePupilId: pupilId,
      });
    }
  }

  // Second pass — sort: due first, then enabled, then by date asc.
  const sorted = Array.from(byClass.values()).sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return (a.whenISO || "").localeCompare(b.whenISO || "");
  });

  const cards: WeekAheadCard[] = [];
  for (const b of sorted.slice(0, max)) {
    const cacheKey = weekAheadCacheKey(b.classId);
    let hasPrefetch = false;
    try {
      hasPrefetch = typeof sessionStorage !== "undefined"
        && sessionStorage.getItem(cacheKey) !== null;
    } catch {
      // sessionStorage might be denied (private mode, etc.) — best-effort.
    }
    cards.push({
      id: `${b.classId}|${b.whenISO || "now"}`,
      classId: b.classId,
      classLabel: b.classLabel,
      subject: b.subject,
      // Topic isn't stored on SchedulerConfig directly — buildClassAutoBrief
      // resolves it from the topic-bank inside Generate. Keep this empty so
      // the card surfaces the subject and the panel doesn't lie.
      topic: "",
      pupilCount: b.pupilCount,
      whenISO: b.whenISO,
      whenLabel: shortDayLabel(b.whenISO),
      hasPrefetch,
    });
  }
  return cards;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface WeekAheadPanelProps {
  /** When false the panel renders compact mode (used inside DailyWork). */
  variant?: "default" | "compact";
}

export default function WeekAheadPanel({ variant = "default" }: WeekAheadPanelProps) {
  const [, navigate] = useLocation();
  const { children } = useApp();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [printingAll, setPrintingAll] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Build cards (synchronous). Re-runs when children, scheduler, or the
  // refresh tick (post-generate) changes.
  const cards = useMemo<WeekAheadCard[]>(() => {
    if (typeof window === "undefined") return [];
    let schedulers: Record<string, SchedulerConfig> = {};
    try { schedulers = loadAllSchedulers(); } catch { /* ignore */ }

    const yearGroupByChild = new Map<string, string>();
    const labelByChild = new Map<string, string>();
    const countByClass = new Map<string, number>();
    for (const c of children) {
      if (!c.yearGroup) continue;
      yearGroupByChild.set(c.id, c.yearGroup);
      labelByChild.set(c.id, c.yearGroup);
      countByClass.set(c.yearGroup, (countByClass.get(c.yearGroup) || 0) + 1);
    }
    return buildWeekAheadCards(schedulers, yearGroupByChild, labelByChild, countByClass, 5);
    // refreshTick included so prefetch updates re-render hasPrefetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, refreshTick]);

  // ── Idle-time prefetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (cards.length === 0) return;
    if (typeof window === "undefined") return;
    const ac = new AbortController();
    // Wait 10s after panel mount before warming the cache (per spec — gives
    // the user time to start a different task without burning AI tokens).
    const timer = setTimeout(() => {
      const targets = cards.map(c => ({ classId: c.classId, subject: c.subject }));
      prefetchWeekAhead(targets, async (target) => {
        const brief = buildClassAutoBrief(target.classId, children, { subject: target.subject });
        if (!classAutoBriefIsUsable(brief, { requireTopic: false })) {
          throw new Error("brief-unusable");
        }
        return aiGenerateWorksheetFromClassBrief(brief);
      }, { signal: ac.signal })
        .then(() => setRefreshTick(t => t + 1))
        .catch(() => { /* prefetch is silent */ });
    }, 10_000);
    return () => { ac.abort(); clearTimeout(timer); };
  }, [cards, children]);

  // ── Midnight rollover invalidation ─────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0); // 5s after midnight to avoid edge races.
    const ms = Math.max(60_000, next.getTime() - now.getTime());
    const t = setTimeout(() => {
      evictStaleWeekAhead();
      setRefreshTick(t => t + 1);
    }, ms);
    return () => clearTimeout(t);
  }, []);

  // ── Per-card Generate ──────────────────────────────────────────────────────
  const handleGenerate = async (card: WeekAheadCard) => {
    setGeneratingId(card.id);
    try {
      const cached = readCache(card.classId);
      if (cached) {
        // Hand off the cached worksheet via sessionStorage and route. Worksheets
        // page picks it up and hydrates the rendered slot directly.
        seedHandoff(card, cached);
      } else {
        // No prefetch — generate live (sequential, blocks button).
        const brief = buildClassAutoBrief(card.classId, children, { subject: card.subject });
        if (!classAutoBriefIsUsable(brief, { requireTopic: false })) {
          toast.error("Not enough class data yet — tap to schedule.");
          return;
        }
        const ws = await aiGenerateWorksheetFromClassBrief(brief);
        seedHandoff(card, ws);
      }
      navigate(buildHandoffUrl(card));
      track("weekAhead.card.generated", { classId: card.classId });
    } catch (e) {
      console.error("[WeekAheadPanel] generate failed", e);
      toast.error("Generation failed — try opening Worksheets in Auto mode.");
      navigate(buildHandoffUrl(card)); // best-effort fallback to manual.
    } finally {
      setGeneratingId(null);
    }
  };

  // ── Print all ──────────────────────────────────────────────────────────────
  const handlePrintAll = async () => {
    if (cards.length === 0) return;
    setPrintingAll(true);
    try {
      const results = await Promise.allSettled(cards.map(async card => {
        const cached = readCache(card.classId);
        if (cached) return { card, ws: cached };
        const brief = buildClassAutoBrief(card.classId, children, { subject: card.subject });
        const ws = await aiGenerateWorksheetFromClassBrief(brief);
        seedCache(card.classId, ws);
        return { card, ws };
      }));

      const ok = results.filter(r => r.status === "fulfilled")
        .map(r => (r as PromiseFulfilledResult<{ card: WeekAheadCard; ws: AIWorksheetResult }>).value);
      const failed = results.length - ok.length;

      if (ok.length === 0) {
        toast.error("Print all failed — every generation errored.");
        return;
      }
      if (failed > 0) toast.warning(`Printed ${ok.length} of ${results.length} — ${failed} failed.`);
      else toast.success(`Building print bundle for ${ok.length} class${ok.length === 1 ? "" : "es"}…`);

      const html = buildBundleHtml(ok);
      const w = window.open("", "_blank");
      if (!w) {
        toast.error("Pop-up blocked — allow pop-ups for /home and try again.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      track("weekAhead.printAll", { count: ok.length });
    } catch (e) {
      console.error("[WeekAheadPanel] print all failed", e);
      toast.error("Print all failed.");
    } finally {
      setPrintingAll(false);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <Card className="border-dashed border-brand/30 bg-brand-light/20">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-4 h-4 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Your week, ready to print</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Schedule worksheets for your classes and Adaptly will line up each Monday's
                lessons here, ready in one click.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5"
                onClick={() => navigate("/scheduler")}
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                Schedule your week
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Default render ─────────────────────────────────────────────────────────
  return (
    <Card className="border-brand/15">
      <CardContent className={variant === "compact" ? "p-3" : "p-4 sm:p-5"}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarCheck className="w-4 h-4 text-brand flex-shrink-0" />
            <h3 className="text-sm font-semibold text-foreground truncate">
              Your week, ready to print
            </h3>
            <Badge variant="secondary" className="text-[10px]">{cards.length}</Badge>
          </div>
          <Button
            size="sm"
            variant="default"
            disabled={printingAll || cards.length === 0}
            onClick={handlePrintAll}
            className="gap-1.5 h-8"
          >
            {printingAll
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Printer className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Print all</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleGenerate(card)}
              disabled={generatingId !== null}
              className="text-left rounded-xl border border-border/60 bg-background hover:border-brand/40 hover:shadow-sm transition-all p-3 disabled:opacity-50 disabled:cursor-wait group"
              data-testid={`weekahead-card-${card.classId}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  {card.whenLabel}
                </span>
                {card.hasPrefetch && (
                  <span
                    title="Pre-built — instant"
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  />
                )}
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{card.classLabel}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 capitalize">
                {card.subject || "subject TBC"}
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {card.pupilCount} pupil{card.pupilCount === 1 ? "" : "s"}
                </span>
                <span className="text-[10px] font-medium text-brand inline-flex items-center gap-0.5 group-hover:underline">
                  {generatingId === card.id
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-3 h-3" /> Generate</>}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Subtle helper — only shown if any card lacks a topic so teachers know to tap & adjust. */}
        {cards.some(c => !c.subject) && (
          <p className="text-[10px] text-muted-foreground mt-3 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Some classes are missing a subject — open the card to set one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildHandoffUrl(card: WeekAheadCard): string {
  const params = new URLSearchParams({
    yearGroup: card.classId,
    mode: "auto-class",
    weekAhead: "1",
  });
  if (card.subject) params.set("subject", card.subject);
  return `/worksheets?${params.toString()}`;
}

function readCache(classId: string): AIWorksheetResult | null {
  const key = weekAheadCacheKey(classId);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as AIWorksheetResult;
  } catch {
    return null;
  }
}

function seedCache(classId: string, ws: AIWorksheetResult): void {
  const key = weekAheadCacheKey(classId);
  try {
    sessionStorage.setItem(key, JSON.stringify(ws));
  } catch {
    // Quota exceeded — silently drop.
  }
}

/**
 * The Worksheets page reads `weekAheadHandoff` once on mount when the URL
 * carries `?weekAhead=1` and seeds its `generated` state from it. We always
 * write the cache key (so subsequent same-day visits are instant too) and
 * a one-shot handoff key (consumed and removed by the page).
 */
function seedHandoff(card: WeekAheadCard, ws: AIWorksheetResult): void {
  seedCache(card.classId, ws);
  try {
    sessionStorage.setItem(
      "weekAheadHandoff",
      JSON.stringify({ classId: card.classId, ws, ts: Date.now() }),
    );
  } catch { /* ignore */ }
}

/** Fire-and-forget telemetry. Uses lib/timeline-events if present. */
function track(event: string, payload: Record<string, unknown>): void {
  try {
    // Soft import — telemetry is optional infra. The app's existing event
    // bus key (window.__adaptlyTelemetry) is a no-op in the absence of a
    // listener. This stays a safe stub until a real telemetry util lands.
    const sink = (window as unknown as {
      __adaptlyTelemetry?: (e: string, p: Record<string, unknown>) => void;
    }).__adaptlyTelemetry;
    if (typeof sink === "function") sink(event, payload);
  } catch { /* ignore */ }
}

/** Concatenate up-to-N worksheets into a single print HTML doc. */
function buildBundleHtml(
  items: Array<{ card: WeekAheadCard; ws: AIWorksheetResult }>,
): string {
  const parts: string[] = [];
  for (const { card, ws } of items) {
    const title = (ws as { title?: string }).title || `${card.classLabel} — ${card.subject}`;
    const sections = (ws as { sections?: Array<{ title?: string; content?: string }> }).sections || [];
    const body = sections.map(s => {
      const head = s.title ? `<h2 class="ws-section-title">${escapeHtml(s.title)}</h2>` : "";
      const inner = (s.content || "").trim();
      // Keep raw HTML/text — sections are produced by the AI pipeline and
      // already validated. We rely on the popup CSS to do the heavy lifting.
      return `<section class="ws-section">${head}<div class="ws-section-body">${inner}</div></section>`;
    }).join("\n");
    parts.push(`
      <article class="ws-bundle-item">
        <header class="ws-bundle-header">
          <h1>${escapeHtml(title)}</h1>
          <p class="ws-bundle-meta">${escapeHtml(card.classLabel)} · ${escapeHtml(card.subject || "")}</p>
        </header>
        ${body}
      </article>
    `);
  }

  const inner = `
    <style>
      .ws-bundle-item { page-break-after: always; break-after: page; padding: 18mm 16mm; }
      .ws-bundle-item:last-child { page-break-after: auto; break-after: auto; }
      .ws-bundle-header h1 { font-size: 18pt; margin: 0 0 4pt; }
      .ws-bundle-meta { font-size: 9pt; color: #555; margin: 0 0 14pt; }
      .ws-section { margin-bottom: 12pt; }
      .ws-section-title { font-size: 12pt; margin: 0 0 4pt; }
      .ws-section-body { font-size: 11pt; line-height: 1.45; }
    </style>
    ${parts.join("\n")}
  `;
  return buildPopupHtml(inner, getKatexCssInline(), {
    title: `Your week — ${items.length} worksheet${items.length === 1 ? "" : "s"}`,
    viewMode: "student",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
