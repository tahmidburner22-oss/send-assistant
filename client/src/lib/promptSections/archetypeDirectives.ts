/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * promptSections/archetypeDirectives.ts — FEAT-G3.
 *
 * Per-archetype prompt block injected into ai.ts'
 * structuredSystemSections. Loaded lazily by ai.ts only when
 * metadata.lessonArchetype is set.
 */

import { getArchetype, type ArchetypeId } from "../lessonArchetypes";

/**
 * Returns the prompt directive for the supplied archetype, or empty
 * string if the id is unknown / unset.
 */
export function buildArchetypeDirective(archetypeId: ArchetypeId | undefined | null): string {
  if (!archetypeId) return "";
  const def = getArchetype(archetypeId);
  if (!def) return "";
  return [
    "",
    "── Lesson archetype directive ──",
    def.promptDirective,
    `Default duration: ${def.defaultDuration} minutes.`,
    "Stamp metadata.lessonArchetype on the output.",
    "",
  ].join("\n");
}
