/**
 * KS3 Computing — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 Computing Programme of Study. Diagrams cover
 * computational thinking, algorithms, networks, data representation and
 * programming constructs.
 *
 * Target: ~80 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Computing", year_band: "KS3" };
const STYLE_COMP =
  "Standard flowchart shapes (oval/rect/diamond/parallelogram), arrows in blue, monospace text in code blocks";
const TAGS_KS3 = ["KS3", "computing", "national-curriculum"];

export function build(ctx) {
  emitTitled(ctx, {
    ...COMMON,
    topic: "Computational thinking",
    year_group: "Year 7",
    description: "Computational-thinking concept card for KS3.",
    style_notes: STYLE_COMP,
    tags: [...TAGS_KS3, "computational-thinking"],
  }, [
    "Decomposition — breaking a problem into smaller parts",
    "Pattern recognition — finding similarities across problems",
    "Abstraction — keeping the important detail, ignoring the rest",
    "Algorithmic thinking — step-by-step solution",
    "Computational thinking — four-pillar poster",
    "Trace table template — three-column",
    "Pseudocode card — input / process / output",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Algorithms",
    year_group: "Year 8",
    description: "Algorithm / flowchart diagram for KS3.",
    style_notes: STYLE_COMP,
    tags: [...TAGS_KS3, "algorithms", "flowcharts"],
  }, [
    "Flowchart — sequence (single path)",
    "Flowchart — selection (IF / ELSE branching)",
    "Flowchart — count-controlled iteration (FOR loop)",
    "Flowchart — condition-controlled iteration (WHILE loop)",
    "Flowchart — input / process / output template",
    "Flowchart — number-guessing game",
    "Flowchart — biggest-of-three numbers",
    "Linear search — visual step-through",
    "Binary search — halving on a sorted list",
    "Bubble sort — pass-by-pass swap diagram",
    "Insertion sort — step diagram",
    "Selection sort — step diagram",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Programming constructs",
    year_group: "Year 8",
    description: "Programming-construct visual for KS3 (Python-flavoured pseudocode).",
    style_notes: "Code in monospace 12pt, IDLE-style colour highlight",
    tags: [...TAGS_KS3, "programming", "python"],
  }, [
    "Variable assignment — name = value diagram",
    "Data types card — int / float / str / bool",
    "Casting — int(input(...)) flow diagram",
    "If / elif / else flow diagram",
    "For loop — range(5) iteration trace",
    "While loop — count-up trace",
    "List operations — append / pop / index card",
    "Function definition — def name(args) → return diagram",
    "Subroutine call vs return — flow diagram",
    "Indentation rules card — Python blocks",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Data representation",
    year_group: "Year 9",
    description: "Data-representation diagram for KS3.",
    style_notes: "Binary digits in monospace, conversion ladder with arrows",
    tags: [...TAGS_KS3, "binary", "data-representation"],
  }, [
    "Decimal to binary — column-value method (8-bit)",
    "Binary to decimal — column-value method (8-bit)",
    "Decimal to hex — quick conversion table",
    "Binary to hex — group-of-4-bits method",
    "ASCII table — printable characters",
    "Unicode vs ASCII — comparison card",
    "Pixel grid — black-and-white image as binary",
    "Pixel grid — colour image, RGB triples",
    "Bitmap vs vector image — comparison",
    "File size formula — width × height × bit depth",
    "Sound sampling — analogue wave to digital samples",
    "Compression — lossy vs lossless comparison",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Hardware and software",
    year_group: "Year 9",
    description: "Computer-architecture diagram for KS3.",
    style_notes: "Block diagram, components in coloured boxes",
    tags: [...TAGS_KS3, "hardware", "architecture"],
  }, [
    "Von Neumann architecture — KS3 introduction",
    "CPU components — control unit, ALU, registers, cache",
    "Fetch-decode-execute cycle — three-stage diagram",
    "Memory hierarchy — registers / cache / RAM / storage",
    "Volatile vs non-volatile memory — comparison",
    "Primary vs secondary storage — examples chart",
    "Hardware vs software — examples chart",
    "Operating system roles — file management, memory, security, peripherals",
    "Application software vs system software — comparison",
    "Embedded systems — examples (washing machine, microwave, car ECU)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Networks and the internet",
    year_group: "Year 9",
    description: "Networking / internet diagram for KS3.",
    style_notes: STYLE_COMP,
    tags: [...TAGS_KS3, "networks", "internet"],
  }, [
    "LAN vs WAN — comparison diagram",
    "Network topology — bus, ring, star, mesh",
    "Client-server vs peer-to-peer comparison",
    "URL parts — protocol / domain / path / query / fragment",
    "DNS lookup — request to server flow",
    "Packet switching — message broken into packets",
    "IP address — IPv4 vs IPv6 card",
    "How the internet works — request / response / route",
    "Wired vs wireless — pros and cons",
    "Network security — firewall, anti-malware, encryption",
    "Cyber-attack types — phishing / malware / DoS / brute-force / SQL injection",
    "Strong password rules card",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Digital literacy and ethics",
    year_group: "Year 9",
    description: "Digital-citizenship / ethics card for KS3.",
    style_notes: "Friendly traffic-light icons, scenario panels",
    tags: [...TAGS_KS3, "ethics", "digital-citizenship"],
  }, [
    "Computer Misuse Act 1990 — three offences card",
    "Data Protection Act / UK GDPR — pupil-friendly summary",
    "Copyright vs Creative Commons licences",
    "Digital footprint — what you leave behind",
    "AI use guidance — when to and not to use generative AI",
    "Misinformation vs disinformation — comparison",
    "Environmental impact of computing — e-waste / energy use",
  ]);
}
