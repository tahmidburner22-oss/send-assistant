import { colorOverlays } from "@/lib/send-data";

export type WorksheetOverlayMode = "auto" | "manual";

/** A deterministic boundary for a non-diagnostic presentation adaptation. */
export function isDyslexiaAdaptation(sendNeed?: string | null): boolean {
  return typeof sendNeed === "string" && sendNeed.toLowerCase().includes("dyslexia");
}

/**
 * Resolve a worksheet's display overlay. A new dyslexia-adapted worksheet uses
 * cream by default. A teacher can deliberately choose another overlay (or
 * white) through manual mode. Protected fixed-print layouts retain white paper
 * because their approved geometry and print contract is immutable.
 */
export function resolveWorksheetOverlayId({
  sendNeed,
  selectedOverlayId,
  mode = "auto",
  protectedLayout = false,
}: {
  sendNeed?: string | null;
  selectedOverlayId?: string | null;
  mode?: WorksheetOverlayMode;
  protectedLayout?: boolean;
}): string {
  if (protectedLayout) return "none";
  if (mode === "auto" && isDyslexiaAdaptation(sendNeed)) return "cream";
  return colorOverlays.some(overlay => overlay.id === selectedOverlayId)
    ? selectedOverlayId!
    : "none";
}

export function getWorksheetOverlayColor(overlayId?: string | null): string {
  return colorOverlays.find(overlay => overlay.id === overlayId)?.color || "#FFFFFF";
}
