/**
 * Mathematics — primary diagram catalogue (Y1–Y6).
 * Target: ~460 entries.
 */
import { range, emitTitled } from "./_helpers.mjs";

const STYLE_BRIGHT = "Bright primary palette, bold outlines, friendly fill, white background";
const STYLE_NUMERIC = "Numbers in clear sans-serif (Andika), high contrast, generous spacing";
const STYLE_SCENE = "Cute illustrated motif, single colour fill, clear silhouette";

export function build(ctx) {
  // ── Year 1 — counting, number sense, basic shapes ─────────────────────────
  // Ten frames (0..10) + double ten frames (10..20)
  range(11, (i) => ctx.add({
    title: `Ten frame — ${i} counters`,
    subject: "Mathematics",
    topic: "Counting and place value",
    year_group: "Year 1",
    description: `A 2×5 ten frame with ${i} red counters filled (left to right, top row first) and ${10 - i} empty cells.`,
    style_notes: "Solid red counters, black grid lines, white cells, equal cell size",
    tags: ["ten-frame", "counting", "subitising", "number-sense"],
  }));
  range(11, (i) => {
    const filled = 10 + i;
    ctx.add({
      title: `Double ten frame — ${filled} counters`,
      subject: "Mathematics",
      topic: "Counting and place value",
      year_group: "Year 2",
      description: `Two stacked ten frames with ${filled} counters in total (first frame full, second has ${i}).`,
      style_notes: STYLE_NUMERIC,
      tags: ["ten-frame", "counting", "place-value"],
    });
  });

  // Number lines 0..10 with arrow on each value (11)
  range(11, (i) => ctx.add({
    title: `Number line 0–10 — arrow on ${i}`,
    subject: "Mathematics",
    topic: "Counting and place value",
    year_group: "Year 1",
    description: `Horizontal number line marked 0 to 10 with a downward arrow indicator above ${i}.`,
    style_notes: "Black baseline, blue arrow, large numerals, equal tick spacing",
    tags: ["number-line", "counting", "addition", "subtraction"],
  }));
  // Number lines 0..20 with arrow on every other value (11)
  range(11, (i) => ctx.add({
    title: `Number line 0–20 — arrow on ${i * 2}`,
    subject: "Mathematics",
    topic: "Counting and place value",
    year_group: "Year 2",
    description: `Horizontal number line marked 0 to 20 with an arrow indicator above ${i * 2}.`,
    style_notes: STYLE_NUMERIC,
    tags: ["number-line", "counting", "addition", "subtraction"],
  }));

  // Counting motifs 1..10 — 2 motifs × 10 = 20
  const COUNT_MOTIFS = [
    { motif: "frogs", desc: "cartoon green frogs sitting on a lily pad" },
    { motif: "apples", desc: "red apples with a green leaf" },
  ];
  for (const { motif, desc } of COUNT_MOTIFS) {
    range(10, (i) => {
      const n = i + 1;
      ctx.add({
        title: `Counting set — ${n} ${motif}`,
        subject: "Mathematics",
        topic: "Counting and place value",
        year_group: "Year 1",
        description: `A row of ${n} ${desc}, evenly spaced for one-to-one counting.`,
        style_notes: STYLE_SCENE,
        tags: ["counting", "one-to-one", motif, "KS1"],
      });
    });
  }

  // Number bonds to 10 (cherry / part-whole) — 11
  range(11, (i) => ctx.add({
    title: `Number bond cherry — ${i} and ${10 - i} make 10`,
    subject: "Mathematics",
    topic: "Number bonds",
    year_group: "Year 1",
    description: `Cherry-style part-whole diagram. Whole = 10 at the top, two parts ${i} and ${10 - i} at the bottom, joined by lines.`,
    style_notes: "Green stem, two red cherries, dotted joining lines",
    tags: ["number-bond", "part-whole", "addition"],
  }));
  // Number bonds to 20 — 11
  range(11, (i) => {
    const a = i;
    const b = 20 - i;
    ctx.add({
      title: `Number bond cherry — ${a} and ${b} make 20`,
      subject: "Mathematics",
      topic: "Number bonds",
      year_group: "Year 2",
      description: `Part-whole cherry. Whole = 20, parts ${a} and ${b}.`,
      style_notes: "Green stem, two red cherries",
      tags: ["number-bond", "part-whole", "addition"],
    });
  });

  // Part-whole bar models (one-step Y1) — 10
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Bar models",
    year_group: "Year 1",
    description: "Single bar split into two parts. Top bar = whole; bottom row = two coloured parts that add to the whole.",
    style_notes: "Two-tone bar, equal-height blocks, labelled with numbers",
    tags: ["bar-model", "part-whole", "addition", "subtraction"],
  }, [
    "Bar model — whole 5 (3 + 2)",
    "Bar model — whole 6 (4 + 2)",
    "Bar model — whole 7 (3 + 4)",
    "Bar model — whole 8 (5 + 3)",
    "Bar model — whole 9 (6 + 3)",
    "Bar model — whole 10 (7 + 3)",
    "Bar model — whole 12 (7 + 5)",
    "Bar model — whole 15 (9 + 6)",
    "Bar model — whole 18 (10 + 8)",
    "Bar model — whole 20 (12 + 8)",
  ]);

  // 2D shape cards — 12
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "2D shape",
    year_group: "Year 1",
    description: "Single 2D shape on a card with name underneath.",
    style_notes: "One bright fill colour, black outline, name in friendly sans-serif",
    tags: ["2d-shape", "geometry", "shape-card"],
  }, [
    "2D shape card — circle",
    "2D shape card — square",
    "2D shape card — rectangle",
    "2D shape card — triangle (equilateral)",
    "2D shape card — triangle (right-angle)",
    "2D shape card — pentagon",
    "2D shape card — hexagon",
    "2D shape card — octagon",
    "2D shape card — oval",
    "2D shape card — semicircle",
    "2D shape card — rhombus",
    "2D shape card — star",
  ]);

  // UK coins (8) + UK notes (5) = 13
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Money",
    year_group: "Year 2",
    description: "UK coin shown front-on at scale-equal size for use in mixed-coin problems.",
    style_notes: "Photo-realistic but simplified, drop shadow, bronze/silver/gold tones",
    tags: ["money", "coin", "UK-currency"],
  }, [
    "Coin — 1p", "Coin — 2p", "Coin — 5p", "Coin — 10p",
    "Coin — 20p", "Coin — 50p", "Coin — £1", "Coin — £2",
  ]);
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Money",
    year_group: "Year 2",
    description: "UK banknote shown front-on with denomination clearly visible.",
    style_notes: "Simplified note design, no facial likeness, clear denomination",
    tags: ["money", "banknote", "UK-currency"],
  }, [
    "Note — £5", "Note — £10", "Note — £20", "Note — £50", "Coin/note set — £1.50 (£1 + 50p)",
  ]);

  // ── Year 2 — place value, time, money continued ───────────────────────────
  // Dienes blocks: tens + ones combinations 1..50 step 5 + 50..100 step 10 = 16
  const DIENES = [1, 5, 10, 12, 15, 18, 20, 25, 30, 34, 42, 50, 60, 75, 88, 99];
  for (const n of DIENES) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    ctx.add({
      title: `Dienes blocks — ${n} (${tens} tens, ${ones} ones)`,
      subject: "Mathematics",
      topic: "Place value",
      year_group: "Year 2",
      description: `Base-10 Dienes representation: ${tens} ten-rods stacked vertically and ${ones} unit cubes alongside.`,
      style_notes: "Wood-grain orange rods and cubes, even sizing, white background",
      tags: ["place-value", "dienes", "base-10", "manipulative"],
    });
  }

  // Clock faces (analogue) — o'clock x 12 + half past x 12 = 24
  const HOURS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
  for (const h of HOURS) {
    ctx.add({
      title: `Clock — ${h} o'clock`,
      subject: "Mathematics",
      topic: "Time",
      year_group: "Year 2",
      description: `Analogue clock face showing ${h}:00. Hour hand on ${h}, minute hand on 12.`,
      style_notes: "Round white face, black frame, red hour hand, blue minute hand, large numerals",
      tags: ["time", "clock", "analogue", "o-clock"],
    });
    ctx.add({
      title: `Clock — half past ${h}`,
      subject: "Mathematics",
      topic: "Time",
      year_group: "Year 2",
      description: `Analogue clock face showing ${h}:30. Hour hand halfway between ${h} and the next hour, minute hand on 6.`,
      style_notes: "Same clock template; hour hand correctly midway",
      tags: ["time", "clock", "analogue", "half-past"],
    });
  }
  // Quarter past / quarter to (Year 3) — every 3rd hour = 8
  for (const h of ["12", "3", "6", "9"]) {
    ctx.add({
      title: `Clock — quarter past ${h}`,
      subject: "Mathematics",
      topic: "Time",
      year_group: "Year 3",
      description: `Analogue clock showing ${h}:15.`,
      style_notes: STYLE_NUMERIC,
      tags: ["time", "clock", "quarter-past"],
    });
    ctx.add({
      title: `Clock — quarter to ${h}`,
      subject: "Mathematics",
      topic: "Time",
      year_group: "Year 3",
      description: `Analogue clock showing ${h}:45 (i.e. quarter to the next hour).`,
      style_notes: STYLE_NUMERIC,
      tags: ["time", "clock", "quarter-to"],
    });
  }
  // 5-minute intervals (Year 4) — 12
  range(12, (i) => ctx.add({
    title: `Clock — 9:${String(i * 5).padStart(2, "0")}`,
    subject: "Mathematics",
    topic: "Time",
    year_group: "Year 4",
    description: `Analogue clock showing 9:${String(i * 5).padStart(2, "0")}.`,
    style_notes: STYLE_NUMERIC,
    tags: ["time", "clock", "5-minute-intervals"],
  }));

  // Arrays for times tables 2x..10x — 9 tables × 4 examples = 36
  for (const t of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    for (const m of [2, 4, 6, 8]) {
      ctx.add({
        title: `Array — ${t} × ${m}`,
        subject: "Mathematics",
        topic: "Multiplication and division",
        year_group: t <= 5 ? "Year 2" : "Year 3",
        description: `Rectangular array of ${t} rows and ${m} columns of dots/circles.`,
        style_notes: "Evenly spaced dots, equal row/column gap, single colour",
        tags: ["array", "multiplication", `${t}-times-table`],
      });
    }
  }

  // Multiplication grids (5x5..12x12) — 5
  for (const n of [5, 10, 12]) {
    ctx.add({
      title: `Multiplication grid — ${n} × ${n}`,
      subject: "Mathematics",
      topic: "Multiplication and division",
      year_group: n <= 10 ? "Year 4" : "Year 5",
      description: `Empty ${n}×${n} multiplication grid with row/column headers 1..${n}.`,
      style_notes: "Clean grid, alternating row shading, headers in colour",
      tags: ["times-table", "grid", "multiplication"],
    });
  }
  for (const n of [6, 7, 9, 11, 12]) {
    ctx.add({
      title: `Times table strip — ${n} times table to ${n}×12`,
      subject: "Mathematics",
      topic: "Multiplication and division",
      year_group: "Year 4",
      description: `Vertical strip showing ${n}×1 = ${n*1}, ${n}×2 = ${n*2}, ... up to ${n}×12.`,
      style_notes: "Coloured stripe for header row, alternating background per row",
      tags: ["times-table", `${n}-times-table`, "multiplication"],
    });
  }

  // Place value charts — Year 3 HTO, Year 4 ThHTO, Year 5 millions, Year 6 billions
  const PV_CHARTS = [
    { y: "Year 3", cols: ["H", "T", "O"], desc: "Hundreds, Tens, Ones" },
    { y: "Year 4", cols: ["Th", "H", "T", "O"], desc: "Thousands, Hundreds, Tens, Ones" },
    { y: "Year 5", cols: ["TTh", "Th", "H", "T", "O"], desc: "Ten-thousands, Thousands, Hundreds, Tens, Ones" },
    { y: "Year 5", cols: ["HTh", "TTh", "Th", "H", "T", "O"], desc: "Hundred-thousands chart" },
    { y: "Year 5", cols: ["M", "HTh", "TTh", "Th", "H", "T", "O"], desc: "Millions chart" },
    { y: "Year 6", cols: ["TM", "M", "HTh", "TTh", "Th", "H", "T", "O"], desc: "Ten-millions chart" },
  ];
  for (const c of PV_CHARTS) {
    ctx.add({
      title: `Place value chart — ${c.cols.join(" / ")} (empty)`,
      subject: "Mathematics",
      topic: "Place value",
      year_group: c.y,
      description: `${c.desc} columns, three blank rows for digits.`,
      style_notes: "Header strip in colour, three rows for working",
      tags: ["place-value", "chart"],
    });
  }
  // Pre-filled PV chart examples — Year 3..Year 6 — 12
  const PV_FILL = [
    { y: "Year 3", n: 246 }, { y: "Year 3", n: 489 },
    { y: "Year 4", n: 1503 }, { y: "Year 4", n: 7891 },
    { y: "Year 5", n: 24560 }, { y: "Year 5", n: 305702 },
    { y: "Year 5", n: 1234567 },
    { y: "Year 6", n: 8050304 }, { y: "Year 6", n: 24650091 },
    { y: "Year 4", n: 9999 }, { y: "Year 5", n: 999999 }, { y: "Year 6", n: 50000000 },
  ];
  for (const e of PV_FILL) {
    ctx.add({
      title: `Place value chart — filled with ${e.n}`,
      subject: "Mathematics",
      topic: "Place value",
      year_group: e.y,
      description: `Place value chart with the digits of ${e.n} placed correctly in their columns.`,
      style_notes: STYLE_NUMERIC,
      tags: ["place-value", "filled", "example"],
    });
  }

  // Decimal place value (Y4–Y6) — 12
  const DP = [
    { y: "Year 4", n: "0.1" }, { y: "Year 4", n: "0.5" }, { y: "Year 4", n: "0.7" },
    { y: "Year 4", n: "1.4" }, { y: "Year 4", n: "2.6" },
    { y: "Year 5", n: "0.25" }, { y: "Year 5", n: "0.75" }, { y: "Year 5", n: "1.05" },
    { y: "Year 5", n: "3.42" }, { y: "Year 6", n: "0.125" }, { y: "Year 6", n: "1.005" },
    { y: "Year 6", n: "12.345" },
  ];
  for (const e of DP) {
    ctx.add({
      title: `Decimal place value chart — ${e.n}`,
      subject: "Mathematics",
      topic: "Decimals",
      year_group: e.y,
      description: `Place value chart with a decimal point column. Digits of ${e.n} placed correctly across ones / tenths / hundredths / thousandths.`,
      style_notes: "Decimal point shown as a coloured dot between columns",
      tags: ["decimal", "place-value"],
    });
  }

  // Fraction bars 1/2..1/12 — 11
  for (const d of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    ctx.add({
      title: `Fraction bar — split into ${d}`,
      subject: "Mathematics",
      topic: "Fractions",
      year_group: d <= 4 ? "Year 2" : d <= 8 ? "Year 3" : "Year 4",
      description: `Horizontal rectangle divided into ${d} equal parts. Each part labelled 1/${d}.`,
      style_notes: "Equal divisions, alternating fill, labels under each part",
      tags: ["fraction", "fraction-bar", "unit-fraction"],
    });
  }
  // Fraction bars with shaded portion 1/2..3/4 patterns — 18
  const FRAC_SHADE = [
    [2, 1], [3, 1], [3, 2], [4, 1], [4, 3],
    [5, 1], [5, 3], [5, 4],
    [6, 1], [6, 5],
    [8, 1], [8, 3], [8, 5], [8, 7],
    [10, 3], [10, 7],
    [12, 5], [12, 11],
  ];
  for (const [d, n] of FRAC_SHADE) {
    ctx.add({
      title: `Fraction bar — ${n}/${d} shaded`,
      subject: "Mathematics",
      topic: "Fractions",
      year_group: d <= 4 ? "Year 2" : d <= 8 ? "Year 4" : "Year 5",
      description: `Bar split into ${d} equal parts with ${n} parts shaded blue and ${d - n} parts white.`,
      style_notes: "Blue shade, even gaps, fraction label above bar",
      tags: ["fraction", "shaded-fraction", "proper-fraction"],
    });
  }
  // Fraction wall — 4 versions
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Fractions",
    year_group: "Year 4",
    description: "Stacked bars showing equivalent fractions: whole, halves, thirds, quarters, fifths, sixths, eighths, tenths, twelfths.",
    style_notes: "Each row a different colour, equal total bar width, fraction labels in each cell",
    tags: ["fraction-wall", "equivalent-fractions"],
  }, [
    "Fraction wall — whole to twelfths",
    "Fraction wall — halves to eighths only",
    "Fraction wall — thirds, sixths, ninths, twelfths (linked equivalents)",
    "Fraction wall — fifths and tenths only",
  ]);

  // Percentage strips (Y5) — 11 (0..100 in tens)
  range(11, (i) => {
    const pct = i * 10;
    ctx.add({
      title: `Percentage strip — ${pct}% shaded`,
      subject: "Mathematics",
      topic: "Percentages",
      year_group: "Year 5",
      description: `100-square strip with ${pct}% shaded green and ${100 - pct}% white.`,
      style_notes: "Green fill, dashed gridlines every 10%, label '${pct}%' above",
      tags: ["percentage", "percentage-strip", "fraction-decimal-percent"],
    });
  });

  // Percentage / fraction / decimal equivalence cards — 12
  const FDP = [
    ["1/2", "0.5", "50%"], ["1/4", "0.25", "25%"], ["3/4", "0.75", "75%"],
    ["1/5", "0.2", "20%"], ["2/5", "0.4", "40%"], ["3/5", "0.6", "60%"], ["4/5", "0.8", "80%"],
    ["1/10", "0.1", "10%"], ["3/10", "0.3", "30%"], ["7/10", "0.7", "70%"], ["9/10", "0.9", "90%"],
    ["1/100", "0.01", "1%"],
  ];
  for (const [f, d, p] of FDP) {
    ctx.add({
      title: `FDP card — ${f} = ${d} = ${p}`,
      subject: "Mathematics",
      topic: "Fractions, decimals, percentages",
      year_group: "Year 5",
      description: `A three-cell card showing the same value as a fraction (${f}), decimal (${d}) and percentage (${p}).`,
      style_notes: "Three coloured cells with equals signs between",
      tags: ["fraction", "decimal", "percentage", "equivalence"],
    });
  }

  // Bar models — two-step (Y3) and comparison (Y4) — 20
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Bar models",
    year_group: "Year 3",
    description: "Two stacked bars representing two related quantities, with a labelled difference or total.",
    style_notes: "Top bar one colour, bottom bar another, difference bracketed",
    tags: ["bar-model", "comparison"],
  }, [
    "Bar model — comparison: 24 vs 18 (difference 6)",
    "Bar model — comparison: 35 vs 20 (difference 15)",
    "Bar model — comparison: 100 vs 65 (difference 35)",
    "Bar model — comparison: 250 vs 175 (difference 75)",
    "Bar model — equal parts: 60 split into 4 of 15",
    "Bar model — equal parts: 100 split into 5 of 20",
    "Bar model — equal parts: 144 split into 12 of 12",
    "Bar model — total of 3 parts: 3 + 5 + 7 = 15",
    "Bar model — total of 4 parts: 10 each = 40",
    "Bar model — known + unknown: 12 + ? = 30",
  ]);
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Bar models",
    year_group: "Year 5",
    description: "Multi-step bar model for ratio / fraction / scaling word problems.",
    style_notes: "Three or more colour blocks, brackets for total and parts",
    tags: ["bar-model", "ratio", "fraction-of-quantity"],
  }, [
    "Bar model — ratio 2:3 (parts of 25)",
    "Bar model — ratio 3:5 (parts of 40)",
    "Bar model — ratio 1:4 (parts of 30)",
    "Bar model — ratio 2:5:3 (parts of 50)",
    "Bar model — fraction of: 2/3 of 36",
    "Bar model — fraction of: 3/4 of 80",
    "Bar model — fraction of: 5/6 of 120",
    "Bar model — increase by 1/4 (start 60)",
    "Bar model — decrease by 1/3 (start 90)",
    "Bar model — sharing 90 in ratio 2:3:4",
  ]);

  // Roman numerals (Y4) — I to XII (curriculum focus is clock-face) — 12
  const ROMANS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
  for (let i = 0; i < ROMANS.length; i++) {
    ctx.add({
      title: `Roman numeral card — ${ROMANS[i]} = ${i + 1}`,
      subject: "Mathematics",
      topic: "Roman numerals",
      year_group: "Year 4",
      description: `Square card showing Roman numeral ${ROMANS[i]} large at top with the Hindu-Arabic value ${i + 1} underneath.`,
      style_notes: "Serif numerals (Cinzel), gold border, parchment background",
      tags: ["roman-numerals", "year-4"],
    });
  }
  ctx.add({
    title: "Roman numerals — clock face",
    subject: "Mathematics",
    topic: "Roman numerals",
    year_group: "Year 4",
    description: "Analogue clock with Roman numerals I to XII (note IIII for 4 — match traditional clock convention).",
    style_notes: "Brass-effect clock, navy hands",
    tags: ["roman-numerals", "clock"],
  });

  // Co-ordinates: Q1 grid (Y4) and 4-quadrant (Y5/Y6) — 12
  for (const grid of ["Q1 grid 0..10", "Q1 grid 0..20", "Q1 grid 0..50 step 5"]) {
    ctx.add({
      title: `Coordinate grid — ${grid} (empty)`,
      subject: "Mathematics",
      topic: "Position and direction",
      year_group: "Year 4",
      description: `Single-quadrant coordinate grid (${grid}) with axes labelled x and y, gridlines and tick labels.`,
      style_notes: "Grey gridlines, black axes with arrows, 12pt tick labels",
      tags: ["coordinates", "Q1", "grid"],
    });
  }
  for (const grid of ["−10..10 each axis", "−5..5 each axis"]) {
    ctx.add({
      title: `Coordinate grid — 4 quadrants ${grid}`,
      subject: "Mathematics",
      topic: "Position and direction",
      year_group: "Year 5",
      description: `Four-quadrant coordinate grid (${grid}) with origin labelled.`,
      style_notes: "Equal scale on both axes, quadrant labels I–IV in pale grey",
      tags: ["coordinates", "4-quadrant", "grid"],
    });
  }
  // Plotted-shape examples — 7
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Position and direction",
    year_group: "Year 5",
    description: "Coordinate grid with named shape plotted via labelled vertices.",
    style_notes: "Vertices marked with filled dots, sides drawn",
    tags: ["coordinates", "plotted-shape"],
  }, [
    "Plotted square (2,2) (2,6) (6,6) (6,2)",
    "Plotted rectangle (1,1) (1,4) (8,4) (8,1)",
    "Plotted right triangle (0,0) (0,3) (4,0)",
    "Plotted parallelogram (0,0) (3,0) (5,2) (2,2)",
    "Plotted reflected triangle in y-axis",
    "Plotted translated square +3 right, +2 up",
    "Plotted rotated triangle 90° about origin",
  ]);

  // Angle examples — 12
  const ANGLE_EXAMPLES = [
    ["acute", 30], ["acute", 45], ["acute", 60], ["right", 90],
    ["obtuse", 120], ["obtuse", 135], ["obtuse", 150],
    ["straight", 180], ["reflex", 210], ["reflex", 270], ["reflex", 300], ["full turn", 360],
  ];
  for (const [type, deg] of ANGLE_EXAMPLES) {
    ctx.add({
      title: `Angle — ${deg}° (${type})`,
      subject: "Mathematics",
      topic: "Angles",
      year_group: "Year 5",
      description: `Two rays from a common vertex forming a ${deg}° (${type}) angle. Arc shows the angle measured.`,
      style_notes: "Black rays, blue arc, degree label inside arc",
      tags: ["angles", type.replace(" ", "-")],
    });
  }
  // Protractor with sample angle — 4
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Angles",
    year_group: "Year 5",
    description: "Semicircular protractor laid over an angle, showing how to read degree measure from the correct scale.",
    style_notes: "Translucent protractor with double scale, baseline on lower ray",
    tags: ["angles", "protractor"],
  }, [
    "Protractor on 40° angle",
    "Protractor on 80° angle",
    "Protractor on 110° angle",
    "Protractor on 145° angle",
  ]);

  // 3D shape nets — 9
  const NETS = [
    "cube", "cuboid", "square-based pyramid", "triangular prism", "cone",
    "cylinder", "hexagonal prism", "tetrahedron", "octahedron",
  ];
  for (const s of NETS) {
    ctx.add({
      title: `Net of a ${s}`,
      subject: "Mathematics",
      topic: "3D shape",
      year_group: "Year 5",
      description: `Flat net of a ${s} with fold lines dashed and tabs shaded.`,
      style_notes: "Solid lines for cuts, dashed lines for folds, glue tabs in pale grey",
      tags: ["3d-shape", "net", s.replace(" ", "-")],
    });
  }
  // 3D shape pictures — 10
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "3D shape",
    year_group: "Year 3",
    description: "Isometric view of a 3D shape with name underneath.",
    style_notes: "Soft shading, single light source from upper left, name in friendly sans-serif",
    tags: ["3d-shape", "isometric"],
  }, [
    "3D shape — cube", "3D shape — cuboid", "3D shape — sphere", "3D shape — cylinder",
    "3D shape — cone", "3D shape — square-based pyramid", "3D shape — triangular prism",
    "3D shape — hexagonal prism", "3D shape — tetrahedron", "3D shape — torus",
  ]);

  // Volume cube buildings — 10
  range(10, (i) => {
    const v = (i + 1) * 4;
    ctx.add({
      title: `Cube building — volume ${v} cm³`,
      subject: "Mathematics",
      topic: "Volume",
      year_group: "Year 5",
      description: `Isometric stack of unit cubes with total volume ${v} cm³.`,
      style_notes: "Light/dark shading on top/right faces, blue fill",
      tags: ["volume", "unit-cube"],
    });
  });

  // Composite area — 6
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Area and perimeter",
    year_group: "Year 6",
    description: "Composite shape made from rectangles with measurements labelled on each side.",
    style_notes: "Lengths in cm, dotted lines showing internal split, equal-arrow tick marks",
    tags: ["area", "composite-shape", "perimeter"],
  }, [
    "Composite area — L-shape 8×6 + 4×3",
    "Composite area — T-shape 10×4 + 4×6",
    "Composite area — H-shape",
    "Composite area — plus shape (+) 5×5 + four arms 2×3",
    "Composite area — rectangle minus square",
    "Composite area — irregular pentagon (rectangle + triangle)",
  ]);

  // Pictograms / bar charts / line graphs / pie charts — 18
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Statistics",
    year_group: "Year 2",
    description: "Pictogram with picture key (e.g. 1 picture = 2 children) and 4–6 categories.",
    style_notes: "Same icon repeated, equal spacing per row, key in box",
    tags: ["statistics", "pictogram"],
  }, [
    "Pictogram — favourite fruit (4 categories)",
    "Pictogram — sunny days last week",
    "Pictogram — pets in our class",
    "Pictogram — favourite playground game",
  ]);
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Statistics",
    year_group: "Year 3",
    description: "Bar chart on labelled axes showing frequency for 4–6 categories.",
    style_notes: "Coloured bars, gridlines every 2 units, axes titled and labelled",
    tags: ["statistics", "bar-chart"],
  }, [
    "Bar chart — favourite colour",
    "Bar chart — minibeasts spotted in the garden",
    "Bar chart — books read this term",
    "Bar chart — weather days this month",
  ]);
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Statistics",
    year_group: "Year 5",
    description: "Line graph plotting a variable over time with axis labels and gridlines.",
    style_notes: "Single coloured line with dot markers, axes titled",
    tags: ["statistics", "line-graph"],
  }, [
    "Line graph — temperature over a day",
    "Line graph — height of a sunflower over 8 weeks",
    "Line graph — pupil attendance per term",
    "Line graph — distance travelled vs time",
  ]);
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Statistics",
    year_group: "Year 6",
    description: "Pie chart with labelled segments and percentage values; segments coloured distinctly.",
    style_notes: "Soft palette, segment labels with leader lines if small",
    tags: ["statistics", "pie-chart"],
  }, [
    "Pie chart — how we get to school",
    "Pie chart — favourite school subjects",
    "Pie chart — class lunch choices",
    "Pie chart — screen time breakdown",
    "Pie chart — earnings split (50/30/20)",
    "Pie chart — class of 30 split into thirds",
  ]);

  // Function machines (Y4–Y6) — 10
  const MACHINES = [
    ["× 2", "Year 4"], ["+ 5", "Year 4"], ["− 3", "Year 4"], ["÷ 2", "Year 4"],
    ["× 10", "Year 4"], ["× 2 then + 1", "Year 5"], ["+ 4 then × 3", "Year 5"],
    ["× 5 then − 2", "Year 6"], ["÷ 4 then + 7", "Year 6"], ["× n + 3", "Year 6"],
  ];
  for (const [op, y] of MACHINES) {
    ctx.add({
      title: `Function machine — ${op}`,
      subject: "Mathematics",
      topic: "Algebra (primary)",
      year_group: y,
      description: `Function machine box with input arrow on left, operation label "${op}" inside, output arrow on right.`,
      style_notes: "Cog/gear motif on box, arrows clearly directional",
      tags: ["function-machine", "algebra-primary"],
    });
  }

  // Probability spinners (Y6) — 10
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Probability",
    year_group: "Year 6",
    description: "Circular spinner divided into coloured/numbered sectors of equal or unequal size, with arrow.",
    style_notes: "Centre arrow on screw, clear sector labels",
    tags: ["probability", "spinner"],
  }, [
    "Spinner — 4 equal red/blue/green/yellow",
    "Spinner — 6 equal numbered 1..6",
    "Spinner — 8 equal A/B/C/D repeated",
    "Spinner — 1/2 red, 1/4 blue, 1/4 yellow",
    "Spinner — 3/8 red, 5/8 blue",
    "Spinner — odd/even split",
    "Spinner — primes 2,3,5,7 out of 1..8",
    "Spinner — vowels vs consonants",
    "Spinner — 1/3 win, 2/3 lose",
    "Spinner — fraction-shaded thirds",
  ]);

  // Reflection / translation / rotation grids (Y5–Y6) — 12
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Position and direction",
    year_group: "Year 6",
    description: "Coordinate grid with a shape and its image after a transformation.",
    style_notes: "Original shape blue, image red, mirror line/translation arrow shown",
    tags: ["transformation"],
  }, [
    "Reflection — triangle in y-axis",
    "Reflection — square in x-axis",
    "Reflection — letter F in y = x",
    "Translation — triangle 3 right 2 up",
    "Translation — pentagon 4 right 1 down",
    "Translation — kite 2 left 5 down",
    "Rotation — triangle 90° clockwise about origin",
    "Rotation — square 180° about (3,3)",
    "Rotation — kite 270° clockwise",
    "Combined — reflect then translate",
    "Combined — translate then rotate",
    "Symmetry — pentagon with 1 line of symmetry",
  ]);

  // Symmetry of 2D shapes (Y4) — 10
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Symmetry",
    year_group: "Year 4",
    description: "2D shape with its lines of symmetry drawn in dashed lines.",
    style_notes: "Bold shape outline, dashed mirror lines in red",
    tags: ["symmetry"],
  }, [
    "Symmetry — square (4 lines)",
    "Symmetry — equilateral triangle (3 lines)",
    "Symmetry — rectangle (2 lines)",
    "Symmetry — isosceles triangle (1 line)",
    "Symmetry — regular hexagon (6 lines)",
    "Symmetry — regular pentagon (5 lines)",
    "Symmetry — circle (infinite, draw 4 to suggest)",
    "Symmetry — kite (1 line)",
    "Symmetry — letter A (1 line)",
    "Symmetry — letter H (2 lines)",
  ]);

  // Money problem scenes (Y2–Y4) — 6
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Money",
    year_group: "Year 3",
    description: "Cartoon shop / café scene with a price list and items being chosen.",
    style_notes: "Friendly shopkeeper, hand-drawn price labels, bright shelves",
    tags: ["money", "word-problem", "scene"],
  }, [
    "Money scene — bakery with bun 30p, cake £1.20, biscuit 25p",
    "Money scene — toy shop with car £3.50, ball £1.99, doll £4.25",
    "Money scene — café menu with toast, juice, fruit",
    "Money scene — book fair with paperback, comic, pencil",
    "Money scene — supermarket fruit aisle",
    "Money scene — school fete tombola",
  ]);

  // Measurement: rulers, scales, jugs — 18
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Measurement (length)",
    year_group: "Year 2",
    description: "Ruler in cm with an object aligned along it; pupils read off the length.",
    style_notes: "Realistic 30 cm ruler, mm and cm marks, object pencilled below",
    tags: ["length", "ruler", "cm"],
  }, [
    "Ruler — pencil 12 cm",
    "Ruler — crayon 7 cm",
    "Ruler — paperclip 4 cm",
    "Ruler — leaf 9 cm",
    "Ruler — ribbon 18 cm",
    "Ruler — stick of glue 11 cm",
  ]);
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Measurement (mass)",
    year_group: "Year 3",
    description: "Kitchen scale dial showing a labelled mass.",
    style_notes: "Round dial with 0–1 kg in 100 g intervals, red needle",
    tags: ["mass", "scales", "grams"],
  }, [
    "Scales — 250 g flour",
    "Scales — 400 g rice",
    "Scales — 750 g sugar",
    "Scales — 1 kg oats",
    "Scales — 350 g potatoes",
    "Scales — 600 g pasta",
  ]);
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Measurement (capacity)",
    year_group: "Year 3",
    description: "Measuring jug with water level shown at a labelled volume.",
    style_notes: "Clear jug outline, blue water, scale marks every 100 ml",
    tags: ["capacity", "jug", "ml"],
  }, [
    "Jug — 250 ml",
    "Jug — 500 ml",
    "Jug — 750 ml",
    "Jug — 1 L (1000 ml)",
    "Jug — 350 ml",
    "Jug — 925 ml",
  ]);

  // Thermometer scales (Y2 / Y4 / Y5) — 8
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Measurement (temperature)",
    year_group: "Year 4",
    description: "Vertical thermometer with red mercury column reaching a labelled temperature in °C.",
    style_notes: "Bulb at base, scale −20 to 50 in 5 °C steps",
    tags: ["temperature", "thermometer"],
  }, [
    "Thermometer — 20 °C", "Thermometer — 0 °C",
    "Thermometer — −5 °C", "Thermometer — 35 °C",
    "Thermometer — −15 °C (compare)", "Thermometer — 12 °C",
    "Thermometer — 28 °C", "Thermometer — 45 °C",
  ]);

  // BIDMAS / BODMAS step-by-step (Y6) — 6
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Order of operations",
    year_group: "Year 6",
    description: "Step-by-step breakdown of an arithmetic expression following BIDMAS, with each operation in a coloured box.",
    style_notes: "Each step in its own row, operation highlighted in colour",
    tags: ["BIDMAS", "BODMAS", "order-of-operations"],
  }, [
    "BIDMAS step-by-step — 6 + 4 × 3",
    "BIDMAS step-by-step — (6 + 4) × 3",
    "BIDMAS step-by-step — 18 ÷ 2 + 5",
    "BIDMAS step-by-step — 3² + 4 × 2",
    "BIDMAS step-by-step — 24 − (3 + 5) × 2",
    "BIDMAS step-by-step — 100 ÷ (4 × 5)",
  ]);

  // Negative-number number lines (Y4–Y6) — 5
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Negative numbers",
    year_group: "Year 5",
    description: "Number line with negative and positive numbers either side of zero.",
    style_notes: "Zero marked with bold tick, negative side blue, positive red",
    tags: ["negative-numbers", "number-line"],
  }, [
    "Number line −10..10",
    "Number line −20..20 step 2",
    "Number line −5..5",
    "Number line −15..15 with arrow on −7",
    "Number line −10..10 with arrow on +4",
  ]);

  // Tally charts (Y3) — 5
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Statistics",
    year_group: "Year 3",
    description: "Tally chart with categories down the left, tally marks in groups of five, and totals.",
    style_notes: "Five-bar gates, totals column shaded",
    tags: ["statistics", "tally"],
  }, [
    "Tally chart — class lunches",
    "Tally chart — bird species in 10 minutes",
    "Tally chart — colour of cars passing",
    "Tally chart — fruits eaten at break",
    "Tally chart — hairstyles (sample survey)",
  ]);

  // Times-table car-park / dot pattern (Y3) — 8
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Multiplication and division",
    year_group: "Year 3",
    description: "Visual representation of a multiplication fact using a real-world arrangement (eggs in trays, sweets in boxes, tiles).",
    style_notes: "Real object motif with grid overlay",
    tags: ["multiplication", "real-life", "array"],
  }, [
    "Egg trays — 6 trays of 6 eggs",
    "Sweet boxes — 4 boxes of 8 sweets",
    "Pencil packs — 5 packs of 12 pencils",
    "Tile floor — 8 rows of 10 tiles",
    "Buttons — 7 cards of 4 buttons",
    "Apples crate — 9 layers of 3 apples",
    "Stickers sheet — 12 rows of 4 stickers",
    "Biscuit pack — 6 columns of 5 biscuits",
  ]);

  // Number formation cards 0..9 — 10
  range(10, (i) => ctx.add({
    title: `Number formation — ${i}`,
    subject: "Mathematics",
    topic: "Number formation",
    year_group: "Year 1",
    description: `The digit ${i} drawn with sequenced arrows showing the correct stroke order for handwriting.`,
    style_notes: "Large digit in pale outline, red arrows numbered 1, 2 (and 3 if needed)",
    tags: ["handwriting", "number-formation", "EYFS-Y1"],
  }));

  // Rounding number lines (Y4–Y6) — 8
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Rounding",
    year_group: "Year 4",
    description: "Number line showing a value with arrows pointing to the nearest tens / hundreds / thousands tick.",
    style_notes: "Highlighted nearest-multiple ticks in green",
    tags: ["rounding"],
  }, [
    "Rounding — 47 to nearest 10",
    "Rounding — 152 to nearest 10",
    "Rounding — 264 to nearest 100",
    "Rounding — 850 to nearest 100",
    "Rounding — 1450 to nearest 1000",
    "Rounding — 7825 to nearest 1000",
    "Rounding — 12 350 to nearest 10 000",
    "Rounding — 49 999 to nearest 10 000",
  ]);

  // Compass-direction grids (Y4) — 4
  emitTitled(ctx, {
    subject: "Mathematics",
    topic: "Position and direction",
    year_group: "Year 4",
    description: "Grid with a child icon at the centre and N/E/S/W (and NE/SE/SW/NW) labels around the edge.",
    style_notes: "Compass rose in upper right, child icon central",
    tags: ["compass", "direction", "grid"],
  }, [
    "Compass grid — 4-point N/E/S/W",
    "Compass grid — 8-point with NE/SE/SW/NW",
    "Compass grid — Logo robot path",
    "Compass grid — treasure map mini",
  ]);

  // Counting in 2s/5s/10s — 3
  for (const step of [2, 5, 10]) {
    ctx.add({
      title: `Counting in ${step}s — number track 0 to ${step * 12}`,
      subject: "Mathematics",
      topic: "Counting and place value",
      year_group: step <= 5 ? "Year 2" : "Year 1",
      description: `Number track marked 0 to ${step * 12} with multiples of ${step} highlighted.`,
      style_notes: "Multiples shaded yellow, others plain",
      tags: ["counting-on", `count-in-${step}s`, "skip-counting"],
    });
  }
}
