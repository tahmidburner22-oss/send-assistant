/**
 * useScheduler — AI auto-assignment scheduler hook.
 *
 * How it works:
 * 1. On mount, loads all scheduler configs from localStorage.
 * 2. Sets a 60-second polling interval to check if any scheduler is due.
 * 3. When due, generates a worksheet via AI with:
 *    - The next topic from the rotating topic bank
 *    - Recall questions referencing the PREVIOUS worksheet's key vocabulary
 * 4. Assigns the worksheet to the child via assignWork() from AppContext.
 * 5. Updates the scheduler config with new nextFireAt, lastFiredAt, lastWorksheetTitle.
 * 6. Persists everything to localStorage.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { aiGenerateWorksheet } from "@/lib/ai";
import {
  type SchedulerConfig,
  loadAllSchedulers,
  saveScheduler,
  defaultScheduler,
  calcNextFireAt,
  isDue,
} from "@/lib/scheduler";
import { TOPIC_BANK } from "@/lib/topic-bank";
import { CURRICULUM_PROGRESSIONS, getProgressionsForSubject } from "@/lib/curriculum-progression";
import type { Child, Assignment } from "@/contexts/AppContext";

interface UseSchedulerOptions {
  children: Child[];
  assignWork: (childId: string, assignment: Omit<Assignment, "id" | "assignedAt" | "status">) => void;
  /** Called after a worksheet is generated so the UI can refresh */
  onWorksheetGenerated?: (childId: string, assignment: Assignment) => void;
}

export function useScheduler({ children, assignWork, onWorksheetGenerated }: UseSchedulerOptions) {
  // Local state mirrors localStorage — used to drive the UI
  const [configs, setConfigs] = useState<Record<string, SchedulerConfig>>(() => loadAllSchedulers());
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getConfig = useCallback((childId: string): SchedulerConfig => {
    return configs[childId] || defaultScheduler(childId);
  }, [configs]);

  const updateConfig = useCallback((childId: string, updates: Partial<SchedulerConfig>) => {
    setConfigs(prev => {
      const current = prev[childId] || defaultScheduler(childId);
      const updated = { ...current, ...updates, childId };
      saveScheduler(updated);
      return { ...prev, [childId]: updated };
    });
  }, []);

  // ── Topic rotation ────────────────────────────────────────────────────────

  const getNextTopic = useCallback((config: SchedulerConfig) => {
    const bank = TOPIC_BANK[config.subject] || TOPIC_BANK.mathematics;
    const idx = config.topicIndex % bank.length;
    const topic = bank[idx];
    const nextIdx = (idx + 1) % bank.length;
    return { topic, nextIdx };
  }, []);

  const getPreviousTopic = useCallback((config: SchedulerConfig) => {
    const bank = TOPIC_BANK[config.subject] || TOPIC_BANK.mathematics;
    if (config.topicIndex === 0) return null;
    const prevIdx = ((config.topicIndex - 1) + bank.length) % bank.length;
    return bank[prevIdx];
  }, []);

  // ── Progression-based topic/step (Skill Ladder + Learning Progress Chain) ─

  /**
   * Get the current progression topic and step for the scheduler.
   * Returns null if no progressions are available for the subject.
   */
  const getProgressionStep = useCallback((config: SchedulerConfig) => {
    const progressions = getProgressionsForSubject(config.subject);
    if (progressions.length === 0) return null;
    const topicIdx = (config.progressionTopicIndex ?? 0) % progressions.length;
    const progression = progressions[topicIdx];
    const stepIdx = (config.progressionStepIndex ?? 0) % progression.steps.length;
    const step = progression.steps[stepIdx];
    return { progression, step, topicIdx, stepIdx };
  }, []);

  /**
   * Advance the progression to the next step (or next topic if all steps done).
   * Returns the updated indices.
   */
  const advanceProgressionStep = useCallback((config: SchedulerConfig) => {
    const progressions = getProgressionsForSubject(config.subject);
    if (progressions.length === 0) return { progressionTopicIndex: 0, progressionStepIndex: 0 };
    const topicIdx = (config.progressionTopicIndex ?? 0) % progressions.length;
    const progression = progressions[topicIdx];
    const stepIdx = (config.progressionStepIndex ?? 0);
    const nextStepIdx = stepIdx + 1;
    if (nextStepIdx >= progression.steps.length) {
      // All steps done — advance to next topic
      const nextTopicIdx = (topicIdx + 1) % progressions.length;
      return { progressionTopicIndex: nextTopicIdx, progressionStepIndex: 0 };
    } else {
      return { progressionTopicIndex: topicIdx, progressionStepIndex: nextStepIdx };
    }
  }, []);

  // ── Generate and assign one worksheet for a child ─────────────────────────

  const generateAndAssign = useCallback(async (child: Child, cfg: SchedulerConfig) => {
    if (generating[child.id]) return;
    setGenerating(prev => ({ ...prev, [child.id]: true }));

    try {
      // ── Determine topic and step ──────────────────────────────────────────
      // Prefer progression-based (Skill Ladder + Learning Progress Chain) if available
      const progressionData = getProgressionStep(cfg);
      const { topic, nextIdx } = getNextTopic(cfg);
      const prevTopic = getPreviousTopic(cfg);

      // Use progression step title/description if available, otherwise fall back to topic bank
      const topicTitle = progressionData
        ? `${progressionData.progression.topicName} — Step ${progressionData.stepIdx + 1}: ${progressionData.step.title}`
        : topic.topic;
      const topicDescription = progressionData
        ? progressionData.step.description
        : "";
      const topicVocabulary = progressionData
        ? progressionData.step.keyVocabulary
        : topic.keyVocabulary;

      // Build recall section instruction
      let recallInstruction = "";
      if (cfg.includeRecall && cfg.lastWorksheetTitle) {
        const recallVocab = cfg.lastKeyVocabulary.length > 0 ? cfg.lastKeyVocabulary : (prevTopic?.keyVocabulary || []);
        const recallTopic = cfg.lastWorksheetTitle;
        if (recallVocab.length > 0) {
          recallInstruction = `
IMPORTANT — Start the worksheet with a "Recall & Review" section (5 short questions, max 1 mark each).
These questions must test knowledge from the PREVIOUS worksheet: "${recallTopic}".
Use these key vocabulary words in the recall questions: ${recallVocab.join(", ")}.
After the recall section, proceed with the main topic below.`;
        }
      }

      // Build progression context for the AI
      const progressionContext = progressionData
        ? `\nThis worksheet covers Step ${progressionData.stepIdx + 1} of ${progressionData.progression.steps.length} in the "${progressionData.progression.topicName}" learning progression.\nStep focus: ${topicDescription}\nKey vocabulary to include: ${topicVocabulary.join(", ")}.`
        : "";

      const result = await aiGenerateWorksheet({
        subject: cfg.subject,
        topic: topicTitle,
        yearGroup: child.yearGroup,
        sendNeed: child.sendNeed || undefined,
        difficulty: cfg.difficulty,
        includeAnswers: cfg.includeAnswers,
        additionalInstructions: `${recallInstruction}${progressionContext}
This worksheet is auto-generated by the Adaptly scheduler for ${child.name}.
SEND need: ${child.sendNeed || "none"}.
Make the worksheet fully self-contained and printable.`.trim(),
      });

      // Build full content string from sections (kept for legacy text display)
      const content = result.sections
        .map(s => `=== ${s.title} ===\n${s.content}`)
        .join("\n\n");

      // Assign via AppContext — pass full sections so WorksheetRenderer can
      // display the worksheet with proper purple cards and layout, matching
      // the main worksheet generator output exactly.
      assignWork(child.id, {
        title: result.title,
        type: "worksheet",
        content,
        sections: result.sections.map(s => ({
          title: s.title,
          type: s.type || "content",
          content: s.content,
          teacherOnly: s.teacherOnly || false,
          svg: (s as any).svg,
          caption: (s as any).caption,
        })),
        metadata: {
          subject: cfg.subject,
          topic: topicTitle,
          yearGroup: child.yearGroup,
          sendNeed: child.sendNeed || undefined,
          difficulty: cfg.difficulty,
        },
      });

      // Build the assignment object for the callback
      const newAssignment: Assignment = {
        id: `sched_${Date.now()}_${child.id}`,
        title: result.title,
        type: "worksheet",
        content,
        sections: result.sections.map(s => ({
          title: s.title,
          type: s.type || "content",
          content: s.content,
          teacherOnly: s.teacherOnly || false,
        })),
        assignedAt: new Date().toISOString(),
        status: "not-started",
        progress: 0,
      };

      // Advance progression step (or topic) after successful generation
      const nextProgression = progressionData ? advanceProgressionStep(cfg) : {};

      // Determine next topic for toast message
      const nextProgressionData = progressionData ? (() => {
        const progressions = getProgressionsForSubject(cfg.subject);
        const { progressionTopicIndex: nti, progressionStepIndex: nsi } = nextProgression as { progressionTopicIndex: number; progressionStepIndex: number };
        const nProg = progressions[nti % progressions.length];
        return nProg ? `${nProg.topicName} — Step ${nsi + 1}: ${nProg.steps[nsi]?.title}` : "";
      })() : TOPIC_BANK[cfg.subject]?.[nextIdx]?.topic || "";

      // Update scheduler config
      updateConfig(child.id, {
        topicIndex: nextIdx,
        lastFiredAt: new Date().toISOString(),
        nextFireAt: calcNextFireAt(cfg.frequency),
        lastWorksheetTitle: result.title,
        lastKeyVocabulary: topicVocabulary,
        ...nextProgression,
      });

      onWorksheetGenerated?.(child.id, newAssignment);

      toast.success(
        `📋 Scheduler: "${result.title}" assigned to ${child.name}`,
        { description: `Next: ${nextProgressionData}`, duration: 6000 }
      );
    } catch (err) {
      console.error("[Scheduler] Generation failed for", child.name, err);
      toast.error(`Scheduler failed for ${child.name} — will retry next cycle.`);
    } finally {
      setGenerating(prev => ({ ...prev, [child.id]: false }));
    }
  }, [generating, getNextTopic, getPreviousTopic, getProgressionStep, advanceProgressionStep, assignWork, updateConfig, onWorksheetGenerated]);

  // ── Polling loop — checks every 60 seconds ────────────────────────────────

  const checkAndFire = useCallback(() => {
    const allConfigs = loadAllSchedulers();
    children.forEach(child => {
      const cfg = allConfigs[child.id];
      if (!cfg) return;
      if (isDue(cfg)) {
        generateAndAssign(child, cfg);
      }
    });
  }, [children, generateAndAssign]);

  useEffect(() => {
    // Check immediately on mount
    checkAndFire();
    // Then every 60 seconds
    intervalRef.current = setInterval(checkAndFire, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAndFire]);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Enable the scheduler for a child — sets nextFireAt based on frequency.
   */
  const enableScheduler = useCallback((childId: string) => {
    const cfg = configs[childId] || defaultScheduler(childId);
    updateConfig(childId, {
      enabled: true,
      nextFireAt: calcNextFireAt(cfg.frequency),
    });
    toast.success("Scheduler enabled — first worksheet will be generated automatically.");
  }, [configs, updateConfig]);

  /**
   * Disable the scheduler for a child.
   */
  const disableScheduler = useCallback((childId: string) => {
    updateConfig(childId, { enabled: false, nextFireAt: null });
    toast.info("Scheduler paused.");
  }, [updateConfig]);

  /**
   * Manually trigger generation right now (ignores nextFireAt).
   */
  const runNow = useCallback(async (child: Child) => {
    const cfg = configs[child.id] || defaultScheduler(child.id);
    await generateAndAssign(child, cfg);
  }, [configs, generateAndAssign]);

  /**
   * Update scheduler settings (subject, frequency, difficulty, etc.).
   * If subject changes, resets the topic index.
   */
  const updateSettings = useCallback((childId: string, updates: Partial<SchedulerConfig>) => {
    const current = configs[childId] || defaultScheduler(childId);
    const subjectChanged = updates.subject && updates.subject !== current.subject;
    updateConfig(childId, {
      ...updates,
      topicIndex: subjectChanged ? 0 : current.topicIndex,
    });
  }, [configs, updateConfig]);

  return {
    getConfig,
    updateSettings,
    enableScheduler,
    disableScheduler,
    runNow,
    generating,
    configs,
  };
}
