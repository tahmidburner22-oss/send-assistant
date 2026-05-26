/**
 * GCSE Computer Science — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA 8525, Pearson Edexcel 1CP2, OCR J277 and WJEC Eduqas
 * GCSE Computer Science specifications. Heavy-priority families flagged
 * in the brief: 7-layer / 4-layer network model, binary <-> hex <-> dec
 * conversion ladder, sorting-algorithm step diagrams (bubble, merge,
 * insertion), tree traversal (in/pre/post-order), CPU Von Neumann
 * architecture.
 *
 * Target: ~120 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Computer Science", year_band: "GCSE" };
const STYLE_COMP =
  "Standard flowchart shapes (oval/rect/diamond/parallelogram), arrows in blue, monospace text in code blocks";
const TAGS = ["GCSE", "computer-science"];

export function build(ctx) {
  // ── Architecture and CPU ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Systems architecture",
    year_group: "Year 10",
    description: "CPU / architecture diagram for GCSE Computer Science.",
    style_notes: "Block diagram with components in coloured boxes, buses in arrows",
    tags: [...TAGS, "architecture", "CPU"],
  }, [
    "Von Neumann architecture — fully labelled (CPU, RAM, buses)",
    "CPU components — Control Unit, ALU, Registers, Cache",
    "Registers — PC, MAR, MDR, ACC, CIR labelled",
    "Fetch-decode-execute cycle — three-stage diagram",
    "Buses — address / data / control",
    "Memory hierarchy pyramid — registers / cache / RAM / SSD / HDD",
    "Cache levels — L1 / L2 / L3 comparison",
    "Cores and clock speed — performance factors card",
    "Embedded system — examples card",
    "Harvard vs Von Neumann comparison",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Memory and storage",
    year_group: "Year 10",
    description: "Memory / storage diagram for GCSE.",
    style_notes: "Block diagram, components in coloured boxes",
    tags: [...TAGS, "memory", "storage"],
  }, [
    "RAM vs ROM comparison",
    "Volatile vs non-volatile memory card",
    "Virtual memory — RAM / page file diagram",
    "HDD internals — platter, read-write head",
    "SSD internals — flash memory grid",
    "Optical storage — CD/DVD/Blu-ray pits and lands",
    "Cloud storage — server diagram",
    "Storage units ladder — bit / byte / KB / MB / GB / TB / PB",
  ]);

  // ── Data representation ─────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Data representation",
    year_group: "Year 10",
    description: "Data-representation diagram for GCSE.",
    style_notes: "Binary digits in monospace, conversion ladder with arrows",
    tags: [...TAGS, "binary", "hex", "data-representation"],
  }, [
    "Binary <-> hex <-> decimal conversion ladder",
    "Decimal to binary — column-value method (8-bit)",
    "Binary to decimal — column-value method (8-bit)",
    "Decimal to hex — divide method",
    "Binary to hex — group of 4 bits",
    "Binary addition — full carry worked",
    "Binary shift — left and right shift cards",
    "Two's complement — 8-bit representation",
    "ASCII table — printable characters",
    "Unicode vs ASCII — comparison card",
    "Pixel grid — black-and-white image as binary",
    "Pixel grid — colour image with RGB triples",
    "Bitmap metadata card — header / colour-depth / resolution",
    "File size formula — width × height × bit depth",
    "Sound sampling — analogue wave to digital samples",
    "Sample rate / bit depth / channels card",
    "Sound file size formula card",
    "Compression — lossy vs lossless comparison",
    "Run-length encoding example",
    "Huffman coding tree example",
  ]);

  // ── Algorithms ──────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Algorithms",
    year_group: "Year 11",
    description: "Algorithm-step diagram for GCSE.",
    style_notes: STYLE_COMP,
    tags: [...TAGS, "algorithms"],
  }, [
    "Bubble sort — pass-by-pass swap diagram",
    "Bubble sort — best/worst case comparison card",
    "Insertion sort — step-by-step diagram",
    "Merge sort — divide-and-conquer tree",
    "Merge sort — combine step",
    "Selection sort — finding the minimum each pass",
    "Quick sort — pivot choice and partition",
    "Linear search — visual step-through",
    "Binary search — halving on a sorted list",
    "Binary search — log₂(n) intuition card",
    "Big-O notation — common growth rates graph",
    "Pseudocode card — input / process / output",
    "Trace table template — three-column",
    "Flowchart — sequence (linear)",
    "Flowchart — selection (IF / ELSE)",
    "Flowchart — count-controlled iteration (FOR)",
    "Flowchart — condition-controlled iteration (WHILE)",
    "Flowchart — input validation",
    "Decomposition example — splitting a problem",
    "Abstraction example — keeping only key detail",
    "Pattern recognition example",
    "Computational thinking four pillars poster",
  ]);

  // ── Programming constructs ─────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Programming",
    year_group: "Year 10",
    description: "Programming-construct diagram for GCSE (Python pseudocode).",
    style_notes: "Code in monospace, syntax-highlighted",
    tags: [...TAGS, "programming", "python"],
  }, [
    "Variable assignment — name = value",
    "Data types card — int / float / str / bool",
    "String operations — concatenation / slicing / length",
    "Casting between types — int / str / float",
    "Arithmetic operators card",
    "Comparison operators card",
    "Boolean operators — AND / OR / NOT truth tables",
    "If / elif / else flow diagram",
    "For loop — range(5) iteration trace",
    "While loop — count-up trace",
    "Nested loop trace table",
    "List basics — append / pop / index",
    "List operations card — slicing / sorting",
    "2D list (matrix) example",
    "Dictionary basics — key/value pairs",
    "Function definition — parameters and return",
    "Local vs global scope card",
    "Subroutines — function vs procedure",
    "File handling — open / read / write / close",
    "CSV file read example",
    "Error types — syntax / runtime / logic",
    "Authentication routine example",
    "Validation vs verification card",
  ]);

  // ── Networks and the internet ──────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Networks",
    year_group: "Year 11",
    description: "Network / internet diagram for GCSE.",
    style_notes: STYLE_COMP,
    tags: [...TAGS, "networks", "internet"],
  }, [
    "LAN vs WAN comparison",
    "Network topology — bus, ring, star, mesh, hybrid",
    "Client-server vs peer-to-peer comparison",
    "TCP/IP 4-layer model (application, transport, internet, link)",
    "OSI 7-layer model — full reference card",
    "OSI vs TCP/IP — side-by-side comparison",
    "DNS lookup — request to server flow",
    "URL parts — protocol / domain / path / query / fragment",
    "Packet switching — message broken into packets",
    "Packet structure — header / payload / footer",
    "IP address — IPv4 vs IPv6",
    "MAC address structure",
    "Router / switch / hub comparison",
    "Wired vs wireless — pros and cons",
    "Bandwidth and latency definitions card",
    "Cloud computing — IaaS / PaaS / SaaS comparison",
    "Internet of Things — example devices map",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Cyber security",
    year_group: "Year 11",
    description: "Security / threat diagram for GCSE.",
    style_notes: STYLE_COMP,
    tags: [...TAGS, "security", "cyber"],
  }, [
    "Cyber-attack types — phishing / malware / DoS / brute-force / SQL injection",
    "Phishing email red flags",
    "Malware types — virus / worm / trojan / spyware / ransomware",
    "DoS / DDoS attack diagram",
    "Brute-force attack — password attempt tree",
    "SQL injection example",
    "Social engineering scenarios",
    "Security countermeasures — firewall / anti-malware / encryption / 2FA / biometric",
    "Firewall — packet filtering diagram",
    "Symmetric vs asymmetric encryption",
    "Caesar cipher worked example",
    "Hashing vs encryption card",
    "Penetration testing — white / grey / black box",
  ]);

  // ── Boolean logic ──────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Boolean logic",
    year_group: "Year 11",
    description: "Logic-gate diagram for GCSE.",
    style_notes: "Standard logic-gate symbols (US shapes), inputs and outputs labelled",
    tags: [...TAGS, "boolean-logic", "gates"],
  }, [
    "AND gate — symbol and truth table",
    "OR gate — symbol and truth table",
    "NOT gate — symbol and truth table",
    "NAND gate — symbol and truth table",
    "NOR gate — symbol and truth table",
    "XOR gate — symbol and truth table",
    "Boolean expression — AND / OR / NOT card",
    "Boolean expression simplification rules",
    "Two-input combinational circuit example",
    "Three-input combinational circuit example",
    "Half-adder circuit",
    "Full-adder circuit",
  ]);

  // ── Software and ethical / legal ───────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Software, ethics and law",
    year_group: "Year 11",
    description: "Systems software / ethics card for GCSE.",
    style_notes: "Concept pill at top, examples in cards",
    tags: [...TAGS, "software", "ethics"],
  }, [
    "Operating system roles — file management, memory, security, peripherals",
    "Utility software examples card",
    "Compiler vs interpreter comparison",
    "High-level vs low-level languages comparison",
    "Defensive design — input validation, authentication, anticipating misuse",
    "Computer Misuse Act 1990 — three offences",
    "Data Protection Act / UK GDPR — pupil-friendly summary",
    "Copyright, Designs and Patents Act 1988",
    "Open-source vs proprietary software",
    "Environmental impact of computing — e-waste / energy use",
    "AI in society — ethical concerns card",
  ]);
}
