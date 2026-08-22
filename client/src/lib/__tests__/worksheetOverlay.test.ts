import { describe, expect, it } from "vitest";
import { getWorksheetOverlayColor, isDyslexiaAdaptation, resolveWorksheetOverlayId } from "../worksheetOverlay";

describe("worksheet accessibility overlay resolver", () => {
  it("automatically applies cream for dyslexia, including a combined SEND label", () => {
    expect(isDyslexiaAdaptation("dyslexia")).toBe(true);
    expect(isDyslexiaAdaptation("Dyslexia / working-memory")).toBe(true);
    expect(resolveWorksheetOverlayId({
      sendNeed: "Dyslexia / working-memory",
      selectedOverlayId: "none",
      mode: "auto",
    })).toBe("cream");
    expect(getWorksheetOverlayColor("cream")).toBe("#FFF8E7");
  });

  it("retains an explicit teacher overlay choice for a dyslexia worksheet", () => {
    expect(resolveWorksheetOverlayId({
      sendNeed: "dyslexia",
      selectedOverlayId: "none",
      mode: "manual",
    })).toBe("none");
    expect(resolveWorksheetOverlayId({
      sendNeed: "dyslexia",
      selectedOverlayId: "pale-blue",
      mode: "manual",
    })).toBe("pale-blue");
  });

  it("keeps approved fixed-print layouts white", () => {
    expect(resolveWorksheetOverlayId({
      sendNeed: "dyslexia",
      selectedOverlayId: "cream",
      mode: "auto",
      protectedLayout: true,
    })).toBe("none");
  });
});
