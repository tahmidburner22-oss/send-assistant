/**
 * RevisionSessionSection — drop-in section component for the Parent Portal.
 *
 * Owns the "are we on the landing or in an active session?" state machine
 * so the parent portal only needs to mount this single component when the
 * user picks the "Revision Session" sidebar tab.
 */
import { useState } from "react";
import RevisionSessionLanding from "./RevisionSessionLanding";
import RevisionSessionRunner from "./RevisionSessionRunner";
import {
  type RevisionSessionPlan,
  type RevisionSessionRun,
} from "@/lib/revision-session-store";
import type { ActiveChild } from "./phase-types";

interface ActiveSession {
  plan: RevisionSessionPlan;
  sessionId: string;
  resumeFrom?: RevisionSessionRun;
}

interface Props {
  child: ActiveChild;
}

export default function RevisionSessionSection({ child }: Props) {
  const [active, setActive] = useState<ActiveSession | null>(null);

  if (active) {
    return (
      <RevisionSessionRunner
        child={child}
        plan={active.plan}
        sessionId={active.sessionId}
        resumeFrom={active.resumeFrom}
        onExit={() => setActive(null)}
      />
    );
  }

  return (
    <RevisionSessionLanding
      child={child}
      onStart={(plan, sessionId) => setActive({ plan, sessionId })}
      onResume={(run) =>
        setActive({ plan: run.plan, sessionId: run.id, resumeFrom: run })
      }
    />
  );
}
