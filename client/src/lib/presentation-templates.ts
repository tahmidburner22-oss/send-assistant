export interface PresentationTemplateDescriptor {
  key: string;
  label: string;
  slidePlanBias: string[];
  promptAdditions: string[];
  imageStyle: string;
  defaultTheme?: string;
}

const TEMPLATE_LIBRARY: PresentationTemplateDescriptor[] = [
  {
    key: "secondary-science-gold",
    label: "Secondary Science Gold",
    slidePlanBias: ["retrieval-warm-up", "key-terms", "diagram-label", "worked-example", "check-understanding", "summary"],
    promptAdditions: [
      "Use a clean science-teaching flow: recap, explicit teaching, diagram, worked example, practice, check, exit.",
      "Where relevant, include a labelled diagram or circuit/process visual before practice.",
      "Use misconceptions common to GCSE science, not generic errors.",
    ],
    imageStyle: "clean educational diagrams, labelled processes, realistic lab visuals",
    defaultTheme: "navy",
  },
  {
    key: "secondary-maths-gold",
    label: "Secondary Maths Gold",
    slidePlanBias: ["retrieval-warm-up", "worked-example", "pause-and-solve", "check-understanding", "summary"],
    promptAdditions: [
      "Prioritise worked examples with full method and one pause-and-solve slide after each model.",
      "Use exact mathematical notation and short, uncluttered steps.",
      "Show common wrong turns explicitly on misconception slides.",
    ],
    imageStyle: "clean whiteboard diagrams, grids, geometric visuals",
    defaultTheme: "emerald",
  },
  {
    key: "primary-core-colour",
    label: "Primary Core Colour",
    slidePlanBias: ["hook", "story-time", "draw-it", "sort-it", "exit-ticket"],
    promptAdditions: [
      "Keep activities concrete, visual, and single-step.",
      "Use playful hooks and child-friendly imagery.",
      "Every task slide must tell pupils exactly what to do next.",
    ],
    imageStyle: "bright child-friendly classroom illustrations",
    defaultTheme: "rainbow",
  },
  {
    key: "humanities-discussion",
    label: "Humanities Discussion",
    slidePlanBias: ["hook", "content", "real-world-link", "discussion", "summary"],
    promptAdditions: [
      "Use source-based prompts, context, and evaluation questions.",
      "Include think-pair-share or short debate frames for pupil talk.",
    ],
    imageStyle: "historical photographs, maps, source images",
    defaultTheme: "slate",
  },
  {
    key: "exam-revision-precision",
    label: "Exam Revision Precision",
    slidePlanBias: ["retrieval-warm-up", "mini-quiz", "exam-technique", "worked-example", "exit-ticket"],
    promptAdditions: [
      "Use command words, mark scheme phrasing, and concise exam-ready methods.",
      "Every practice question should feel like a real exam task.",
    ],
    imageStyle: "minimal revision visuals and clean exam exemplars",
    defaultTheme: "navy",
  },
  {
    key: "send-scaffolded",
    label: "SEND Scaffolded",
    slidePlanBias: ["hook", "key-terms", "worked-example", "activity", "check-understanding", "exit-ticket"],
    promptAdditions: [
      "Chunk every task into clear steps and include modelled language where helpful.",
      "Prefer one clear action per slide. Reduce clutter and cognitive load.",
      "Use sentence starters, visual cues, and a consistent routine.",
    ],
    imageStyle: "simple high-contrast educational visuals",
    defaultTheme: "purple",
  },
  {
    key: "cpd-training",
    label: "CPD Training",
    slidePlanBias: ["title", "learning-objectives", "content", "discussion", "summary"],
    promptAdditions: [
      "Assume the audience is staff, not pupils.",
      "Include implementation actions and reflective prompts.",
    ],
    imageStyle: "clean professional education leadership visuals",
    defaultTheme: "slate",
  },
];

export function resolvePresentationTemplate(params: {
  subject: string;
  yearGroup: string;
  lessonType: string;
  sendNeeds?: string;
  differentiationLevel?: "foundation" | "core" | "extension";
}): PresentationTemplateDescriptor {
  const subject = params.subject.toLowerCase();
  const yearGroup = params.yearGroup.toLowerCase();
  const lessonType = params.lessonType.toLowerCase();
  const sendNeeds = (params.sendNeeds || "").toLowerCase();

  if (/staff|cpd|training/.test(subject) || /staff/.test(yearGroup)) {
    return TEMPLATE_LIBRARY.find(t => t.key === "cpd-training")!;
  }
  if (/year [1-6]|ks1|ks2|reception/.test(yearGroup)) {
    return TEMPLATE_LIBRARY.find(t => t.key === "primary-core-colour")!;
  }
  if (sendNeeds || params.differentiationLevel === "foundation") {
    return TEMPLATE_LIBRARY.find(t => t.key === "send-scaffolded")!;
  }
  if (/revision|exam/.test(lessonType) || /gcse|a level|a-level|year 10|year 11|year 12|year 13/.test(yearGroup)) {
    return TEMPLATE_LIBRARY.find(t => t.key === "exam-revision-precision")!;
  }
  if (/math|mathematics/.test(subject)) {
    return TEMPLATE_LIBRARY.find(t => t.key === "secondary-maths-gold")!;
  }
  if (/physics|chemistry|biology|science/.test(subject)) {
    return TEMPLATE_LIBRARY.find(t => t.key === "secondary-science-gold")!;
  }
  if (/history|geography|english|religious|citizenship|humanities/.test(subject) || lessonType === "discussion") {
    return TEMPLATE_LIBRARY.find(t => t.key === "humanities-discussion")!;
  }
  return TEMPLATE_LIBRARY.find(t => t.key === "secondary-science-gold")!;
}
