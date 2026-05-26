/**
 * Computing — primary diagram catalogue (Y1–Y6).
 * Target: ~80 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Algorithms — flowcharts, sequences — 12
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Algorithms",
    year_group: "Year 3",
    description: "Step-by-step instruction or flowchart for a primary algorithm task.",
    style_notes: "Standard flowchart shapes (oval/rect/diamond), arrows in blue",
    tags: ["algorithm", "flowchart", "computational-thinking"],
  }, [
    "Algorithm — make a jam sandwich (numbered)",
    "Algorithm — brush your teeth (numbered)",
    "Flowchart — cross the road safely",
    "Flowchart — getting ready for school",
    "Flowchart — IF raining THEN umbrella ELSE coat",
    "Flowchart — REPEAT 4 times (square turtle)",
    "Bee-Bot route — square (4 forwards, 4 right turns)",
    "Bee-Bot route — triangle",
    "Bee-Bot route — letter L",
    "Bee-Bot route — figure of 8",
    "Decomposition diagram — break a task into sub-tasks",
    "Pattern spotting — find the repeating element",
  ]);

  // Debugging visuals — 6
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Debugging",
    year_group: "Year 3",
    description: "Bug / debugging-themed instructional card.",
    style_notes: "Magnifying glass and friendly bug mascot",
    tags: ["debugging", "computational-thinking"],
  }, [
    "Spot the bug — wrong instruction in a sequence",
    "Spot the bug — missing instruction",
    "Spot the bug — wrong order",
    "Debug your algorithm — 3-step strategy",
    "Trace table template",
    "Test/debug/refine cycle diagram",
  ]);

  // E-safety scenarios — 12
  emitTitled(ctx, {
    subject: "Computing",
    topic: "E-safety",
    year_group: "Year 3",
    description: "Online-safety scenario card with a child making a decision (talk to an adult / SMART rules).",
    style_notes: "Friendly child characters with thought bubbles, traffic-light cue",
    tags: ["e-safety", "online-safety", "PSHE-link"],
  }, [
    "E-safety — SMART rules poster",
    "E-safety — safe vs unsafe website example",
    "E-safety — strong vs weak password",
    "E-safety — stranger online (tell a trusted adult)",
    "E-safety — never share personal info checklist",
    "E-safety — what to do if you see something upsetting",
    "E-safety — cyberbullying scenarios card",
    "E-safety — kindness online ladder",
    "E-safety — screen time balance wheel",
    "E-safety — fake news clue checklist",
    "E-safety — gaming age ratings (PEGI) chart",
    "E-safety — Childline / report icon explainer",
  ]);

  // Hardware / parts of a computer — 12
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Hardware and software",
    year_group: "Year 4",
    description: "Card showing a computer hardware component with name and function.",
    style_notes: "Isometric photo-style icon, function caption underneath",
    tags: ["hardware", "computer-parts"],
  }, [
    "Hardware — monitor", "Hardware — keyboard", "Hardware — mouse",
    "Hardware — CPU", "Hardware — RAM", "Hardware — hard drive",
    "Hardware — printer", "Hardware — speakers", "Hardware — webcam",
    "Hardware — router", "Hardware — USB stick", "Hardware — laptop labelled",
  ]);

  // Software / app icons — 8
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Hardware and software",
    year_group: "Year 4",
    description: "Generic software / app icon with name and purpose caption.",
    style_notes: "Coloured rounded square icon style",
    tags: ["software", "app-icon"],
  }, [
    "Software — word processor (generic)",
    "Software — spreadsheet (generic)",
    "Software — slideshow (generic)",
    "Software — paint / drawing app",
    "Software — web browser",
    "Software — email client",
    "Software — Scratch (generic icon)",
    "Software — coding editor (generic)",
  ]);

  // Networks — 8
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Networks",
    year_group: "Year 5",
    description: "Networking / internet diagram suitable for KS2.",
    style_notes: "Devices and cables/wifi waves, server icon",
    tags: ["networks", "internet"],
  }, [
    "Network — home Wi-Fi diagram (router → devices)",
    "Network — school network diagram",
    "How the internet works — request/response",
    "Server vs client diagram",
    "Web address (URL) parts labelled",
    "Search engine query journey",
    "Router and modem labelled",
    "Wired vs wireless comparison",
  ]);

  // Coding blocks (Scratch-style) — 14
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Scratch coding",
    year_group: "Year 4",
    description: "Single Scratch-style block (motion/event/control/etc.) labelled with what it does.",
    style_notes: "Scratch palette colours per category, snap-fit block shape",
    tags: ["scratch", "coding", "block-coding"],
  }, [
    "Scratch — when green flag clicked",
    "Scratch — move 10 steps",
    "Scratch — turn 15 degrees",
    "Scratch — say 'Hello!'",
    "Scratch — wait 1 second",
    "Scratch — repeat 4 times",
    "Scratch — forever loop",
    "Scratch — if … then … else",
    "Scratch — variable set to 0",
    "Scratch — change variable by 1",
    "Scratch — broadcast message",
    "Scratch — when key pressed",
    "Scratch — sensing (touching colour)",
    "Scratch — pen down / pen up",
  ]);

  // Data handling (Y4–Y6) — 6
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Data handling",
    year_group: "Year 5",
    description: "Data-handling diagram for primary computing.",
    style_notes: "Spreadsheet feel for tables, simple coloured charts",
    tags: ["data", "spreadsheet"],
  }, [
    "Spreadsheet basics — rows / columns / cells",
    "Spreadsheet formula — sum of column",
    "Database — single table with fields",
    "Branching database — yes/no questions",
    "Data → information → knowledge ladder",
    "Pictograph from a tally to a bar chart",
  ]);

  // Binary and codes (Y6 light touch) — 4
  emitTitled(ctx, {
    subject: "Computing",
    topic: "Computer fundamentals",
    year_group: "Year 6",
    description: "Beginner-friendly binary or code diagram.",
    style_notes: "Glowing dots/zeroes, friendly colour palette",
    tags: ["binary", "computing-fundamentals"],
  }, [
    "Binary — counting 0..15 in 4-bit table",
    "ASCII letter chart (A=65)",
    "Pixel grid — image as binary",
    "Compression — same image with fewer pixels",
  ]);
}
