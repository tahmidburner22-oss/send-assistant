/**
 * Server-backed pupil work scheduler.
 *
 * The prior implementation generated work inside an open browser and persisted
 * configuration in localStorage. That made scheduled learning device-specific
 * and stopped it when a teacher closed the tab. This hook is deliberately only
 * a control surface for the database-backed scheduler worker.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  scheduler as schedulerApi,
  type SchedulerConfigInput,
  type SchedulerDifficulty,
  type SchedulerFrequency,
  type ServerSchedulerConfig,
  type SchedulerLadders,
} from "@/lib/api";
import type { Child } from "@/contexts/AppContext";

export type SchedulerConfig = ServerSchedulerConfig;

type MutableSchedulerSettings = Partial<Pick<
  SchedulerConfigInput,
  "enabled" | "frequency" | "difficulty" | "includeAnswers" | "includeRecall" |
  "passThreshold" | "topicIndex" | "progressionTopicIndex" | "progressionStepIndex"
>> & { subject?: string };

interface UseSchedulerOptions {
  children: Child[];
  /** Refreshes the shared pupil data after server work has changed it. */
  onSchedulerChanged?: (childId: string) => void | Promise<void>;
}

function defaultScheduler(childId: string): ServerSchedulerConfig {
  return {
    pupilId: childId,
    subject: "mathematics",
    enabled: false,
    frequency: "weekly",
    difficulty: "mixed",
    includeAnswers: true,
    includeRecall: true,
    nextFireAt: null,
    lastFiredAt: null,
    lastWorksheetTitle: null,
    lastKeyVocab: [],
    topicIndex: 0,
    progressionTopicIndex: 0,
    progressionStepIndex: 0,
    lastError: null,
    retryAfter: null,
    passThreshold: 70,
  };
}

function settingsFrom(config: ServerSchedulerConfig, updates: MutableSchedulerSettings = {}): SchedulerConfigInput {
  return {
    enabled: updates.enabled ?? config.enabled,
    frequency: (updates.frequency ?? config.frequency) as SchedulerFrequency,
    difficulty: (updates.difficulty ?? config.difficulty) as SchedulerDifficulty,
    includeAnswers: updates.includeAnswers ?? config.includeAnswers,
    includeRecall: updates.includeRecall ?? config.includeRecall,
    passThreshold: updates.passThreshold ?? config.passThreshold,
    topicIndex: updates.topicIndex ?? config.topicIndex,
    progressionTopicIndex: updates.progressionTopicIndex ?? config.progressionTopicIndex,
    progressionStepIndex: updates.progressionStepIndex ?? config.progressionStepIndex,
  };
}

export function useScheduler({ children, onSchedulerChanged }: UseSchedulerOptions) {
  const [configs, setConfigs] = useState<Record<string, ServerSchedulerConfig>>({});
  const [ladders, setLadders] = useState<SchedulerLadders>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const latestChildren = useRef(children);
  latestChildren.current = children;

  const getConfig = useCallback((childId: string): ServerSchedulerConfig => {
    return configs[childId] || defaultScheduler(childId);
  }, [configs]);

  const refresh = useCallback(async () => {
    if (latestChildren.current.length === 0) {
      setConfigs({});
      return;
    }
    setLoading(true);
    try {
      const [rows, canonicalLadders] = await Promise.all([
        schedulerApi.list(),
        schedulerApi.ladders(),
      ]);
      setLadders(canonicalLadders);
      const byPupil = new Map<string, ServerSchedulerConfig[]>();
      for (const row of rows) {
        const existing = byPupil.get(row.pupilId) || [];
        existing.push(row);
        byPupil.set(row.pupilId, existing);
      }
      setConfigs(current => {
        const next: Record<string, ServerSchedulerConfig> = {};
        for (const child of latestChildren.current) {
          const choices = byPupil.get(child.id) || [];
          const currentSubject = current[child.id]?.subject;
          // Preserve the subject the teacher is currently inspecting where it
          // exists. Otherwise choose an active config, then the first config.
          next[child.id] = choices.find(cfg => cfg.subject === currentSubject)
            || choices.find(cfg => cfg.enabled)
            || choices[0]
            || defaultScheduler(child.id);
        }
        return next;
      });
    } catch (error) {
      console.error("[scheduler] config refresh failed", error);
      toast.error("Pupil schedules could not be refreshed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [children.length, refresh]);

  const saveSettings = useCallback(async (childId: string, updates: MutableSchedulerSettings) => {
    const current = getConfig(childId);
    const subject = (updates.subject || current.subject || "mathematics").toLowerCase().trim();
    const saved = await schedulerApi.save(childId, subject, settingsFrom(current, updates));
    setConfigs(previous => ({ ...previous, [childId]: saved }));
    await onSchedulerChanged?.(childId);
    return saved;
  }, [getConfig, onSchedulerChanged]);

  const updateSettings = useCallback(async (childId: string, updates: MutableSchedulerSettings) => {
    try {
      await saveSettings(childId, updates);
    } catch (error) {
      console.error("[scheduler] config update failed", error);
      toast.error("The schedule was not updated. Please try again.");
    }
  }, [saveSettings]);

  const enableScheduler = useCallback(async (childId: string) => {
    try {
      await saveSettings(childId, { enabled: true });
      toast.success("Automatic work plan enabled. Its next due time is saved for your whole team.");
    } catch (error) {
      console.error("[scheduler] enable failed", error);
      toast.error("The automatic work plan could not be enabled.");
    }
  }, [saveSettings]);

  const disableScheduler = useCallback(async (childId: string) => {
    try {
      await saveSettings(childId, { enabled: false });
      toast.info("Automatic work plan paused. Existing assignments are unchanged.");
    } catch (error) {
      console.error("[scheduler] pause failed", error);
      toast.error("The automatic work plan could not be paused.");
    }
  }, [saveSettings]);

  const runNow = useCallback(async (child: Child) => {
    if (generating[child.id]) return;
    setGenerating(previous => ({ ...previous, [child.id]: true }));
    try {
      const config = getConfig(child.id);
      // A manual run remains an explicit teacher action. Ensure the selected
      // server configuration exists but do not enable future automatic work.
      const saved = await schedulerApi.save(child.id, config.subject, settingsFrom(config));
      setConfigs(previous => ({ ...previous, [child.id]: saved }));
      const result = await schedulerApi.runNow(child.id, saved.subject);
      await refresh();
      await onSchedulerChanged?.(child.id);
      toast.success(`Assigned “${result.worksheetTitle}”. The next step remains under teacher review.`);
    } catch (error) {
      console.error("[scheduler] manual run failed", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("already in progress")) {
        toast.info("A worksheet is already being generated for this pupil and subject. No duplicate was created.");
      } else {
        toast.error("The worksheet could not be generated. The scheduler kept its recoverable state.");
      }
    } finally {
      setGenerating(previous => ({ ...previous, [child.id]: false }));
    }
  }, [generating, getConfig, onSchedulerChanged, refresh]);

  const statusFor = useCallback((childId: string) => {
    const config = getConfig(childId);
    if (config.lastError) return "needs-attention" as const;
    if (config.enabled) return "active" as const;
    return "paused" as const;
  }, [getConfig]);

  return useMemo(() => ({
    getConfig,
    updateSettings,
    enableScheduler,
    disableScheduler,
    runNow,
    refresh,
    generating,
    loading,
    configs,
    ladders,
    statusFor,
  }), [getConfig, updateSettings, enableScheduler, disableScheduler, runNow, refresh, generating, loading, configs, ladders, statusFor]);
}
