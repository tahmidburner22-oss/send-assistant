import { describe, expect, it } from "vitest";
import {
  buildPupilAssignmentPayload,
  hydratePupilAssignmentPayload,
  resolvePupilAssignmentOverlay,
} from "../assignmentViewContract";

describe("pupil assignment view contract", () => {
  it("retains the complete pupil-safe render payload and excludes teacher-only sections", () => {
    const payload = buildPupilAssignmentPayload({
      title: "Science — Waves",
      type: "worksheet",
      content: "Pupil worksheet content",
      subtitle: "Year 10 · Foundation",
      sections: [
        {
          title: "Label the wave",
          type: "q-label-diagram",
          content: "Name the amplitude and wavelength.",
          caption: "A labelled wave diagram.",
          imageUrl: "/images/wave.png",
          assetRef: "wave-label",
          svg: "<svg />",
        },
        {
          title: "Teacher Answer Key",
          type: "mark-scheme",
          content: "Teacher-only answers",
          teacherOnly: true,
        },
        {
          title: "Teacher Notes",
          type: "teacher-notes",
          content: "Do not show this to a pupil",
        },
      ],
      metadata: {
        subject: "science",
        topic: "waves",
        yearGroup: "Year 10",
        sendNeed: "visual-impairment",
        adaptationSummary: ["High-contrast response boundaries"],
        curriculumReference: "AQA Physics 4.6.1",
        qualityStatus: "checked",
      },
    });

    expect(payload.subtitle).toBe("Year 10 · Foundation");
    expect(payload.sections).toHaveLength(1);
    expect(payload.sections?.[0]).toMatchObject({
      title: "Label the wave",
      imageUrl: "/images/wave.png",
      assetRef: "wave-label",
      svg: "<svg />",
    });
    expect(payload.metadata).toMatchObject({
      subject: "science",
      sendNeed: "visual-impairment",
      qualityStatus: "checked",
    });
  });

  it("resolves automatic dyslexia cream while honouring manual and protected-layout boundaries", () => {
    expect(resolvePupilAssignmentOverlay({ sendNeed: "dyslexia" })).toEqual({
      id: "cream",
      color: "#FFF8E7",
    });
    expect(resolvePupilAssignmentOverlay({
      sendNeed: "dyslexia",
      overlay: "none",
      accessibilityOverlayMode: "manual",
    })).toEqual({
      id: "none",
      color: "#FFFFFF",
    });
    expect(resolvePupilAssignmentOverlay({
      sendNeed: "dyslexia",
      overlay: "cream",
      protectedLayout: true,
    })).toEqual({
      id: "none",
      color: "#FFFFFF",
    });
  });

  it("rehydrates serialised database fields without losing diagrams, captions or provenance", () => {
    const hydrated = hydratePupilAssignmentPayload({
      title: "History — Norman Conquest",
      type: "worksheet",
      content: "Pupil content",
      subtitle: "Year 7",
      sections: JSON.stringify([
        {
          title: "Source enquiry",
          type: "content",
          content: "Read the source and answer the questions.",
          caption: "A source caption",
          imageUrl: "/images/source.png",
        },
        {
          title: "Teacher answer key",
          type: "answers",
          content: "Private answer key",
        },
      ]),
      metadata: JSON.stringify({
        subject: "history",
        topic: "Norman Conquest",
        source: "teacher-assignment",
        adaptationSummary: ["One instruction at a time"],
        overlay: "cream",
        accessibilityOverlayMode: "auto",
      }),
    });

    expect(hydrated.sections).toEqual([
      expect.objectContaining({
        title: "Source enquiry",
        caption: "A source caption",
        imageUrl: "/images/source.png",
      }),
    ]);
    expect(hydrated.metadata).toMatchObject({
      subject: "history",
      source: "teacher-assignment",
      adaptationSummary: ["One instruction at a time"],
      overlay: "cream",
      accessibilityOverlayMode: "auto",
    });
  });
});
