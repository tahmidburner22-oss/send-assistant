# Pupil Access Tools: Step-by-Step Implementation Plan

## Scope

This delivery implements the three highest-priority SEND tools in the **screen-based pupil worksheet view**. The tools are deliberately separate from the printable source document so the approved two-page Maths Gold geometry, one-page Science geometry, and all PDF/print output remain unchanged.

| Tool | Learner outcome | Delivery boundary |
|---|---|---|
| **Read-aloud with word highlighting** | A pupil can listen to a concise worksheet segment while the currently spoken word is highlighted. | Browser speech is used only in a new screen-only reader panel; it does not inject markup into the worksheet or PDF. |
| **Speech-to-text with review** | A pupil can dictate a draft, review/edit it, and choose whether to use the draft. | Dictation is voluntary, editable, local to the screen session, and does not automatically submit or mark work. |
| **Chunked focus mode** | A pupil can work through one short segment at a time with clear previous/next progress. | The source worksheet is visually hidden on screen only; print and PDF continue to render the unchanged source. |

## Implementation sequence

1. **Create a content adapter.** Convert the student-visible worksheet title and sections, or the text extracted from a fixed-layout HTML document, into safe plain-text reader segments. Omit teacher-only, answer-key and hidden sections.
2. **Build a reusable pupil-access panel.** The panel will provide a reader, a read/pause control, live word highlighting, a speed control, focus-mode navigation, and a speech-to-text draft area with an explicit review message.
3. **Use browser-native assistive APIs progressively.** Use `SpeechSynthesis` for word-boundary events and the browser speech-recognition API where it is available. Where speech recognition is unavailable, keep the typed draft field fully usable and clearly explain the fallback.
4. **Add screen-only integration.** Render the panel above the preview in Student view. When focus mode is active, hide only the preview at screen media; preserve it at print media through a dedicated CSS rule.
5. **Protect dedicated documents.** For Maths Gold, Science and Humanities, derive reader text from the self-contained HTML string and never add styles, controls or highlights inside the protected iframe.
6. **Verify deterministically.** Add unit tests for student filtering, text extraction and segmentation. Run TypeScript, the new tests, dedicated Science tests, and the protected Maths Gold wiring guard.
7. **Deploy and inspect live.** Push to `main`, wait for deployment, test all controls in Student view, and redownload a fixed Science PDF to confirm page geometry did not move.

## Safeguards

> The tools provide access to the same learning material. They do not reduce the learning objective, reveal answers, alter marks, or infer a pupil diagnosis.

The browser or device controls speech-recognition privacy and availability. The interface will make this clear and will always retain a typed alternative. Focus mode is optional, reversible and keyboard-accessible. The tool does not attach drafts to pupil records and does not auto-submit or auto-mark dictated text.
