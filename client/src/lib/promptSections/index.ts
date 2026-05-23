/**
 * promptSections/index.ts — PR-21 / audit item #73.
 *
 * `ai.ts` is 5,200+ lines and `aiGenerateWorksheet` alone is the
 * single largest function in the codebase. The Phase-A carve-up
 * (PR-A1) split the LLM round-trip out into `callAI` /
 * `callAIMessages`. This second carve-up extracts the structured
 * PROMPT SECTIONS — the named blocks the system prompt is composed
 * from — into their own modules so future PRs can swap individual
 * sections without re-reading the whole file.
 *
 * SCOPE OF THIS PR (deliberately narrow):
 *   - Expose a named-export surface for every prompt section. The
 *     wiring inside `ai.ts:aiGenerateWorksheet` is UNTOUCHED — that
 *     swap will land in PR-30+ once the carve-up has been smoke-tested
 *     by a few callers.
 *   - Each module is pure / deterministic — no LLM round-trip, no
 *     side-effects.
 *   - Each module is independently testable and re-importable.
 *
 * MODULES:
 *   - sectionStructureRules   — the per-Q section contract block.
 *   - sendAdaptationDirectives — the SEND profile injection block.
 *   - examBoardManifesto      — the awarding-body manifesto block.
 *   - markSchemeContract      — the mark-scheme structural contract.
 *   - selfReflectionContract  — the Phase-2 self-reflection block.
 *   - revisionTipsContract    — the Phase-3 revision-tips block.
 *   - subjectFamilyDirectives — the per-subject family directives.
 *
 * USE FROM A FUTURE PR:
 *   import {
 *     buildSectionStructureRules,
 *     buildSendAdaptationDirectives,
 *     buildExamBoardManifesto,
 *   } from "@/lib/promptSections";
 *
 * The current `ai.ts:structuredSystemSections` continues to assemble
 * its own copy. PR-30+ will replace those inline copies with imports
 * from this module after a one-time visual diff against the inline
 * source.
 */

export {
  buildSectionStructureRules,
  type SectionStructureInputs,
} from "./sectionStructureRules";
export {
  buildSendAdaptationDirectives,
  type SendAdaptationInputs,
} from "./sendAdaptationDirectives";
export {
  buildExamBoardManifesto,
  type ExamBoardManifestoInputs,
} from "./examBoardManifesto";
export {
  buildMarkSchemeContract,
  type MarkSchemeContractInputs,
} from "./markSchemeContract";
export {
  buildSelfReflectionContract,
  type SelfReflectionContractInputs,
} from "./selfReflectionContract";
export {
  buildRevisionTipsContract,
  type RevisionTipsContractInputs,
} from "./revisionTipsContract";
export {
  buildSubjectFamilyDirectives,
  type SubjectFamilyInputs,
} from "./subjectFamilyDirectives";

/**
 * Convenience composer — assembles the seven sections in canonical
 * order into a single string. Mirrors what `ai.ts:structuredSystemSections`
 * does, but is purely additive: callers that already pass the
 * pre-assembled string keep working unchanged.
 */
import { buildSectionStructureRules } from "./sectionStructureRules";
import { buildSendAdaptationDirectives } from "./sendAdaptationDirectives";
import { buildExamBoardManifesto } from "./examBoardManifesto";
import { buildMarkSchemeContract } from "./markSchemeContract";
import { buildSelfReflectionContract } from "./selfReflectionContract";
import { buildRevisionTipsContract } from "./revisionTipsContract";
import { buildSubjectFamilyDirectives } from "./subjectFamilyDirectives";

export interface ComposedPromptInputs {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  examBoard?: string;
  sendNeeds?: string[];
  marksTariff?: number[];
  commandWords?: string[];
}

export function composePromptSections(inputs: ComposedPromptInputs): string {
  return [
    buildExamBoardManifesto({ examBoard: inputs.examBoard, subject: inputs.subject, yearGroup: inputs.yearGroup }),
    buildSubjectFamilyDirectives({ subject: inputs.subject, yearGroup: inputs.yearGroup }),
    buildSectionStructureRules({ yearGroup: inputs.yearGroup }),
    buildMarkSchemeContract({ examBoard: inputs.examBoard, marksTariff: inputs.marksTariff }),
    buildSendAdaptationDirectives({ sendNeeds: inputs.sendNeeds }),
    buildSelfReflectionContract({ topic: inputs.topic, subject: inputs.subject }),
    buildRevisionTipsContract({ topic: inputs.topic, subject: inputs.subject, examBoard: inputs.examBoard, commandWords: inputs.commandWords }),
  ]
    .filter(Boolean)
    .join("\n\n");
}
