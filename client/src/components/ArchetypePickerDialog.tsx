/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * ArchetypePickerDialog.tsx — FEAT-G3.
 *
 * Modal dialog opened from the Worksheets generator form. Shows the
 * five archetypes; on pick, calls onPick with the built brief and
 * the archetype id (the form pre-fills + stamps
 * metadata.lessonArchetype before generating).
 */

import React, { useState } from "react";
import {
  buildArchetypeBrief,
  listArchetypes,
  type ArchetypeBrief,
  type ArchetypeId,
  type BriefContext,
} from "@/lib/lessonArchetypes";

export interface ArchetypePickerDialogProps {
  open: boolean;
  onClose: () => void;
  context?: BriefContext;
  onPick: (brief: ArchetypeBrief) => void;
}

export function ArchetypePickerDialog(props: ArchetypePickerDialogProps): React.ReactElement | null {
  const [hover, setHover] = useState<ArchetypeId | null>(null);
  if (!props.open) return null;
  const archetypes = listArchetypes();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick a lesson archetype"
      data-testid="archetype-picker-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={props.onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-md shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-4"
      >
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Use a template</h2>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </header>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {archetypes.map((a) => (
            <li
              key={a.id}
              onMouseEnter={() => setHover(a.id)}
              onMouseLeave={() => setHover(null)}
              className={`border rounded p-3 cursor-pointer ${
                hover === a.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => {
                const brief = buildArchetypeBrief(a.id, props.context || {});
                if (brief) props.onPick(brief);
              }}
              data-testid={`archetype-card-${a.id}`}
            >
              <div className="font-semibold text-sm">{a.name}</div>
              <div className="text-xs text-gray-600 mt-1">{a.description}</div>
              <div className="text-[11px] text-gray-500 mt-1.5">{a.structure}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                Default duration: {a.defaultDuration} min
              </div>
            </li>
          ))}
        </ul>
        <footer className="mt-4 text-xs text-gray-500">
          Templates pre-fill the form. The AI fills the actual stems.
        </footer>
      </div>
    </div>
  );
}

export default ArchetypePickerDialog;
