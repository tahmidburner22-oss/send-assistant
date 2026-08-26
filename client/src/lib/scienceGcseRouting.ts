import type { ScienceLayoutKind } from "@/lib/scienceLandscapeRenderer";

/**
 * An explicit curriculum-to-layout contract for Years 10–11 Science.
 *
 * The DfE catalogue remains the authoritative topic/LO source. A dedicated
 * fixed Science page is allowed only when it has been curriculum-reviewed for
 * that exact target. All other targets use the exact-LO generic route rather
 * than a fuzzy keyword match to an approximately related diagram.
 */
export type GcseScienceRenderRoute =
  | {
      kind: "dedicated";
      layout: ScienceLayoutKind;
      reason: string;
    }
  | {
      kind: "generic";
      reason: string;
    };

const GENERIC_ROUTE: GcseScienceRenderRoute = {
  kind: "generic",
  reason: "No reviewed dedicated fixed-layout Science page is mapped to this exact DfE target.",
};

export function resolveGcseScienceRenderRoute(
  choice?: { topic?: string; objective?: string },
): GcseScienceRenderRoute {
  if (!choice) return GENERIC_ROUTE;

  // This page is reviewed against the exact DfE-derived target and objective,
  // not a word such as "atomic" appearing in an unrelated objective or subtopic.
  if (
    choice.topic === "Atomic structure and isotopes"
    && choice.objective === "Describe the atom as a positively charged nucleus surrounded by negatively charged electrons."
  ) {
    return {
      kind: "dedicated",
      layout: "atomic-structure",
      reason: "Reviewed nuclear-atom and isotope page for the selected Atomic structure and isotopes target.",
    };
  }

  return GENERIC_ROUTE;
}

