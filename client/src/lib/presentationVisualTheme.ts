export type PresentationVisualMotif =
  | "graph-grid"
  | "orbit"
  | "molecules"
  | "cells"
  | "manuscript"
  | "contours"
  | "circuit"
  | "creative"
  | "music-staff"
  | "court"
  | "data-bars"
  | "calm"
  | "abstract";

export interface PresentationPalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  light: string;
  gradient: string;
}

export interface SubjectVisualTheme {
  motif: PresentationVisualMotif;
  label: string;
  titleBackground: string;
  surfaceBackground: string;
  frameColor: string;
}

function alpha(hex: string, opacity: number): string {
  const cleaned = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(cleaned)) return `rgba(15, 23, 42, ${opacity})`;
  const red = Number.parseInt(cleaned.slice(0, 2), 16);
  const green = Number.parseInt(cleaned.slice(2, 4), 16);
  const blue = Number.parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function subjectProfile(subject: string | undefined): Pick<SubjectVisualTheme, "motif" | "label"> {
  const value = (subject || "").toLowerCase();
  if (/math|numeracy|statistics/.test(value)) return { motif: "graph-grid", label: "Mathematical thinking" };
  if (/physics/.test(value)) return { motif: "orbit", label: "Scientific enquiry" };
  if (/chemistry/.test(value)) return { motif: "molecules", label: "Scientific enquiry" };
  if (/biology|science|health/.test(value)) return { motif: "cells", label: "Scientific enquiry" };
  if (/history|religious|philosophy|law|politics/.test(value)) return { motif: "manuscript", label: "Humanities enquiry" };
  if (/geograph/.test(value)) return { motif: "contours", label: "Place and systems" };
  if (/computer|technology/.test(value)) return { motif: "circuit", label: "Digital systems" };
  if (/music/.test(value)) return { motif: "music-staff", label: "Performance and composition" };
  if (/art|design|drama|media|film/.test(value)) return { motif: "creative", label: "Creative practice" };
  if (/physical education|\bpe\b|sport/.test(value)) return { motif: "court", label: "Performance and practice" };
  if (/business|economics|sociology|psychology/.test(value)) return { motif: "data-bars", label: "Applied enquiry" };
  if (/pshe|wellbeing/.test(value)) return { motif: "calm", label: "Reflection and discussion" };
  return { motif: "abstract", label: "Lesson focus" };
}

/**
 * Creates a resilient visual layer from the active subject and teacher-selected
 * palette. The backgrounds are decorative only: they never contain information
 * required to understand a slide, so SEND and high-contrast content rules keep
 * working on top of them.
 */
export function getPresentationSubjectVisual(
  subject: string | undefined,
  palette: PresentationPalette,
  highContrast = false,
): SubjectVisualTheme {
  const profile = subjectProfile(subject);
  if (highContrast) {
    return {
      ...profile,
      titleBackground: "#0A0A0A",
      surfaceBackground: "#FFFFFF",
      frameColor: "#0A0A0A",
    };
  }

  const softPrimary = alpha(palette.primary, 0.08);
  const softSecondary = alpha(palette.secondary, 0.12);
  const softAccent = alpha(palette.accent, 0.16);
  const surfaceBackgroundByMotif: Record<PresentationVisualMotif, string> = {
    "graph-grid": `linear-gradient(${softPrimary} 1px, transparent 1px), linear-gradient(90deg, ${softPrimary} 1px, transparent 1px), radial-gradient(circle at 92% 12%, ${softAccent} 0 72px, transparent 74px), ${palette.bg}`,
    orbit: `radial-gradient(ellipse at 82% 18%, transparent 0 36px, ${softSecondary} 37px 38px, transparent 39px 62px, ${softPrimary} 63px 64px, transparent 65px), radial-gradient(circle at 18% 90%, ${softAccent} 0 68px, transparent 70px), ${palette.bg}`,
    molecules: `radial-gradient(circle at 86% 14%, ${softSecondary} 0 15px, transparent 16px), radial-gradient(circle at 76% 26%, ${softAccent} 0 10px, transparent 11px), radial-gradient(circle at 92% 31%, ${softPrimary} 0 12px, transparent 13px), ${palette.bg}`,
    cells: `radial-gradient(ellipse at 88% 18%, ${softSecondary} 0 30px, transparent 31px), radial-gradient(ellipse at 78% 28%, ${softAccent} 0 18px, transparent 19px), radial-gradient(ellipse at 93% 35%, ${softPrimary} 0 13px, transparent 14px), ${palette.bg}`,
    manuscript: `repeating-linear-gradient(0deg, transparent 0 25px, ${softPrimary} 26px 27px, transparent 28px 52px), radial-gradient(circle at 92% 10%, ${softAccent} 0 60px, transparent 62px), ${palette.bg}`,
    contours: `repeating-radial-gradient(ellipse at 88% 20%, transparent 0 18px, ${softSecondary} 19px 20px, transparent 21px 40px), ${palette.bg}`,
    circuit: `linear-gradient(90deg, transparent 0 70%, ${softSecondary} 70% 70.4%, transparent 70.4%), linear-gradient(0deg, transparent 0 64%, ${softPrimary} 64% 64.4%, transparent 64.4%), radial-gradient(circle at 84% 18%, ${softAccent} 0 9px, transparent 10px), ${palette.bg}`,
    creative: `radial-gradient(circle at 88% 18%, ${softAccent} 0 48px, transparent 50px), radial-gradient(circle at 76% 28%, ${softSecondary} 0 32px, transparent 34px), radial-gradient(circle at 92% 42%, ${softPrimary} 0 21px, transparent 23px), ${palette.bg}`,
    "music-staff": `repeating-linear-gradient(0deg, transparent 0 15px, ${softPrimary} 16px 17px, transparent 18px 25px), radial-gradient(circle at 88% 20%, ${softAccent} 0 24px, transparent 25px), ${palette.bg}`,
    court: `radial-gradient(ellipse at 88% 32%, transparent 0 88px, ${softSecondary} 89px 90px, transparent 91px), linear-gradient(90deg, transparent 0 81%, ${softPrimary} 81% 81.4%, transparent 81.4%), ${palette.bg}`,
    "data-bars": `linear-gradient(90deg, transparent 0 72%, ${softSecondary} 72% 76%, transparent 76% 79%, ${softAccent} 79% 84%, transparent 84% 87%, ${softPrimary} 87% 94%, transparent 94%), ${palette.bg}`,
    calm: `radial-gradient(ellipse at 88% 18%, ${softSecondary} 0 80px, transparent 82px), radial-gradient(ellipse at 76% 34%, ${softAccent} 0 42px, transparent 44px), ${palette.bg}`,
    abstract: `radial-gradient(circle at 88% 16%, ${softSecondary} 0 64px, transparent 66px), radial-gradient(circle at 76% 32%, ${softAccent} 0 32px, transparent 34px), ${palette.bg}`,
  };

  return {
    ...profile,
    titleBackground: `radial-gradient(circle at 88% 16%, ${alpha(palette.accent, 0.58)} 0 110px, transparent 112px), radial-gradient(circle at 14% 92%, ${alpha(palette.secondary, 0.4)} 0 150px, transparent 152px), ${palette.gradient}`,
    surfaceBackground: surfaceBackgroundByMotif[profile.motif],
    frameColor: alpha(palette.secondary, 0.3),
  };
}

export function isHighContrastSafeSubjectVisual(visual: SubjectVisualTheme): boolean {
  return visual.surfaceBackground === "#FFFFFF" && visual.titleBackground === "#0A0A0A";
}
