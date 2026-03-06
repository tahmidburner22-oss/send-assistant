// AI content filter for safeguarding compliance (KCSIE 2025)
// Flags content that may indicate safeguarding concerns

const SAFEGUARDING_PATTERNS = [
  // Self-harm / suicide
  /\b(self.?harm|self.?injur|cut(ting)? myself|hurt(ing)? myself|suicid|kill myself|end my life|want to die)\b/i,
  // Abuse indicators
  /\b(abuse|abused|hitting me|hurting me|touches me|touched me inappropriately|secret touches)\b/i,
  // Exploitation
  /\b(grooming|exploitation|county lines|gang|knife|weapon|drugs|dealing)\b/i,
  // Radicalisation
  /\b(radicalisation|extremis|terrorist|jihad|isis|far.?right|white.?supremac)\b/i,
  // Online safety
  /\b(stranger online|sent me photos|asked for photos|meet up|secret friend)\b/i,
];

const INAPPROPRIATE_CONTENT = [
  /\b(pornograph|explicit sexual|nude|naked child)\b/i,
  /\b(violence against|murder|kill|bomb|attack)\b/i,
  /\b(racist|sexist|homophob|transphob|hate speech)\b/i,
];

export interface FilterResult {
  flagged: boolean;
  reason?: string;
  category?: "safeguarding" | "inappropriate" | "clean";
  severity?: "low" | "medium" | "high" | "critical";
}

export function filterContent(text: string): FilterResult {
  for (const pattern of SAFEGUARDING_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern)?.[0];
      return {
        flagged: true,
        reason: `Potential safeguarding concern detected: "${match}"`,
        category: "safeguarding",
        severity: determineSeverity(pattern, text),
      };
    }
  }

  for (const pattern of INAPPROPRIATE_CONTENT) {
    if (pattern.test(text)) {
      const match = text.match(pattern)?.[0];
      return {
        flagged: true,
        reason: `Inappropriate content detected: "${match}"`,
        category: "inappropriate",
        severity: "medium",
      };
    }
  }

  return { flagged: false, category: "clean" };
}

function determineSeverity(
  pattern: RegExp,
  text: string
): "low" | "medium" | "high" | "critical" {
  if (/suicid|kill myself|end my life|want to die|self.?harm/.test(text)) return "critical";
  if (/abuse|abused|touches me inappropriately/.test(text)) return "high";
  if (/grooming|exploitation|county lines/.test(text)) return "high";
  if (/radicalisation|extremis|terrorist/.test(text)) return "high";
  return "medium";
}

// Filter AI prompt before sending to model
export function filterPrompt(prompt: string): FilterResult {
  return filterContent(prompt);
}

// Filter AI response before returning to user
export function filterResponse(response: string): FilterResult {
  return filterContent(response);
}
