export interface PupilReaderSection {
  title?: string;
  content?: string;
  type?: string;
  teacherOnly?: boolean;
}

export interface PupilReaderSegment {
  id: string;
  label: string;
  text: string;
}

const EXCLUDED_SECTION_TYPES = new Set(["answers", "adaptations"]);

/**
 * Converts renderer HTML into a compact reader transcript. This deliberately
 * runs outside the worksheet renderer: reader controls must never modify the
 * protected print/PDF DOM.
 */
export function plainTextForPupilReader(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "and")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitForFocus(text: string, maximumCharacters = 360): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences.map((item) => item.trim()).filter(Boolean)) {
    if (current && current.length + sentence.length + 1 > maximumCharacters) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function buildPupilReaderSegments(input: {
  title?: string;
  sections?: PupilReaderSection[];
  hiddenSectionIndexes?: Set<number>;
  fixedLayoutHtml?: string;
}): PupilReaderSegment[] {
  if (input.fixedLayoutHtml) {
    const text = plainTextForPupilReader(input.fixedLayoutHtml);
    return splitForFocus(text).map((chunk, index) => ({
      id: `fixed-${index}`,
      label: index === 0 ? "Worksheet overview" : `Part ${index + 1}`,
      text: chunk,
    }));
  }

  const segments: PupilReaderSegment[] = [];
  if (input.title?.trim()) {
    segments.push({ id: "title", label: "Worksheet title", text: input.title.trim() });
  }

  (input.sections || []).forEach((section, index) => {
    if (input.hiddenSectionIndexes?.has(index)) return;
    if (section.teacherOnly || EXCLUDED_SECTION_TYPES.has(section.type || "")) return;
    const body = plainTextForPupilReader(section.content || "");
    const prefix = section.title?.trim() ? `${section.title.trim()}. ` : "";
    const text = `${prefix}${body}`.trim();
    if (!text) return;
    splitForFocus(text).forEach((chunk, chunkIndex) => {
      segments.push({
        id: `section-${index}-${chunkIndex}`,
        label: section.title?.trim() || `Activity ${index + 1}`,
        text: chunk,
      });
    });
  });

  return segments;
}

export function spokenWordIndex(text: string, characterIndex: number): number {
  const before = text.slice(0, Math.max(0, characterIndex));
  return before.trim() ? before.trim().split(/\s+/).length : 0;
}
