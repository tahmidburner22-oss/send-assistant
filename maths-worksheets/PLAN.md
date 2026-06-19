# Maths Worksheets — Full Subtopic Coverage Plan

> **Goal:** Create one JSON worksheet + one PDF worksheet for every single maths subtopic in the SEND Assistant curriculum (194 subtopics across 54 topics). Each worksheet follows the exact 2-page A4 landscape layout used in the existing "Simplifying Expressions" and "Simultaneous Equations" exemplars.

---

## Folder Structure

```
maths-worksheets/
├── PLAN.md                  ← this file
├── scripts/
│   └── generate_worksheet.py   ← WeasyPrint renderer (JSON → PDF)
├── json/                    ← all 194 JSON worksheet files
│   ├── 001-converting-between-fdp.json
│   ├── 002-ordering-fdp.json
│   └── ...
└── pdf/                     ← all 194 generated PDFs
    ├── 001-converting-between-fdp.pdf
    ├── 002-ordering-fdp.pdf
    └── ...
```

---

## JSON Schema (per worksheet)

Every JSON file follows the identical structure used by the SEND overlay system:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Two-line title (line 1: topic, line 2: subtopic) separated by `\n` |
| `objective` | string | Single measurable learning objective |
| `send_mode` | boolean | `false` for base version; overlay sets to `true` |
| `info_boxes.key_terms` | object | Blue box — definitions and key vocabulary |
| `info_boxes.what_we_learn` | object | Green box — correct/incorrect examples table |
| `info_boxes.key_idea` | object | Gold box — core rule/formula |
| `modelled_examples` | array[4] | Four worked examples (blue, blue, red, green) |
| `practice` | array[5] | Five practice sections (scaffolded → mixed) |
| `misconceptions.items` | array[5] | Five "spot the mistake" items |
| `challenge.problems` | array[2] | Two word problems |

---

## Generation Workflow

```bash
# Generate a single PDF from its JSON
python3 scripts/generate_worksheet.py json/001-converting-between-fdp.json pdf/001-converting-between-fdp.pdf

# Batch generate all PDFs
for f in json/*.json; do
  python3 scripts/generate_worksheet.py "$f" "pdf/$(basename ${f%.json}.pdf)"
done
```

---

## Complete Subtopic List (194 worksheets)

### Topic 1: Addition and Subtraction (within 20)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 1 | Adding single-digit numbers | `001-adding-single-digit-numbers.json` | ⬜ |
| 2 | Number bonds to 10 and 20 | `002-number-bonds-to-10-and-20.json` | ⬜ |
| 3 | Subtracting single-digit numbers | `003-subtracting-single-digit-numbers.json` | ⬜ |
| 4 | Using a number line for addition and subtraction | `004-using-a-number-line-for-addition-and-subtraction.json` | ⬜ |

### Topic 2: Addition and Subtraction (Two-Digit Numbers)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 5 | Column addition (no regrouping) | `005-column-addition-no-regrouping.json` | ⬜ |
| 6 | Column addition (with regrouping) | `006-column-addition-with-regrouping.json` | ⬜ |
| 7 | Column subtraction (no regrouping) | `007-column-subtraction-no-regrouping.json` | ⬜ |
| 8 | Column subtraction (with regrouping) | `008-column-subtraction-with-regrouping.json` | ⬜ |

### Topic 3: Addition and Subtraction (3-Digit Numbers)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 9 | Column addition with 3-digit numbers | `009-column-addition-with-3-digit-numbers.json` | ⬜ |
| 10 | Column subtraction with 3-digit numbers | `010-column-subtraction-with-3-digit-numbers.json` | ⬜ |
| 11 | Estimating and checking answers | `011-estimating-and-checking-answers.json` | ⬜ |
| 12 | Problem solving with addition and subtraction | `012-problem-solving-with-addition-and-subtraction.json` | ⬜ |

### Topic 4: Addition and Subtraction (4-Digit Numbers)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 13 | Column addition with 4-digit numbers | `013-column-addition-with-4-digit-numbers.json` | ⬜ |
| 14 | Column subtraction with 4-digit numbers | `014-column-subtraction-with-4-digit-numbers.json` | ⬜ |
| 15 | Inverse operations | `015-inverse-operations.json` | ⬜ |
| 16 | Multi-step addition and subtraction | `016-multi-step-addition-and-subtraction.json` | ⬜ |

### Topic 5: Addition and Subtraction (Large Numbers)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 17 | Adding numbers with more than 4 digits | `017-adding-numbers-with-more-than-4-digits.json` | ⬜ |
| 18 | Mental strategies for large numbers | `018-mental-strategies-for-large-numbers.json` | ⬜ |
| 19 | Solving multi-step problems | `019-solving-multi-step-problems.json` | ⬜ |
| 20 | Subtracting numbers with more than 4 digits | `020-subtracting-numbers-with-more-than-4-digits.json` | ⬜ |

### Topic 6: Algebra — Simple Formulae and Sequences
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 21 | Substitution into expressions | `021-substitution-into-expressions.json` | ✅ |
| 22 | Using and writing simple formulae | `022-using-and-writing-simple-formulae.json` | ✅ |

### Topic 7: Algebraic Expressions
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 23 | Expanding double brackets | `023-expanding-double-brackets.json` | ✅ |
| 24 | Expanding single brackets | `024-expanding-single-brackets.json` | ✅ |
| 25 | Factorising expressions | `025-factorising-expressions.json` | ✅ |

### Topic 8: Angles
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 26 | Angles in parallel lines | `026-angles-in-parallel-lines.json` | ✅ |
| 27 | Angles in polygons | `027-angles-in-polygons.json` | ✅ |
| 28 | Angles in triangles and quadrilaterals | `028-angles-in-triangles-and-quadrilaterals.json` | ✅ |
| 29 | Angles on a straight line and at a point | `029-angles-on-a-straight-line-and-at-a-point.json` | ✅ |

### Topic 9: Area and Perimeter
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 30 | Area of rectangles, triangles and parallelograms | `030-area-of-rectangles-triangles-and-parallelograms.json` | ✅ |
| 31 | Area of trapeziums and composite shapes | `031-area-of-trapeziums-and-composite-shapes.json` | ✅ |
| 32 | Circumference of a circle | `032-circumference-of-a-circle.json` | ✅ |

### Topic 10: Counting and Number Recognition (to 20)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 33 | Counting forwards and backwards to 20 | `033-counting-forwards-and-backwards-to-20.json` | ⬜ |
| 34 | Writing numbers in words | `034-writing-numbers-in-words.json` | ⬜ |

### Topic 11: Counting in 2s, 5s and 10s
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 35 | Counting in 10s | `035-counting-in-10s.json` | ⬜ |
| 36 | Counting in 2s | `036-counting-in-2s.json` | ⬜ |
| 37 | Counting in 5s | `037-counting-in-5s.json` | ⬜ |
| 38 | Identifying patterns in sequences | `038-identifying-patterns-in-sequences.json` | ⬜ |

### Topic 12: Decimals and Percentages
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 39 | Comparing fractions, decimals and percentages | `039-comparing-fractions-decimals-and-percentages.json` | ✅ |
| 40 | Finding percentages of amounts | `040-finding-percentages-of-amounts.json` | ✅ |
| 41 | Percentage increase and decrease | `041-percentage-increase-and-decrease.json` | ✅ |
| 42 | Percentages as fractions and decimals | `042-percentages-as-fractions-and-decimals.json` | ✅ |

### Topic 13: Decimals — All Operations
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 43 | Adding and subtracting decimals | `043-adding-and-subtracting-decimals.json` | ✅ |
| 44 | Dividing decimals | `044-dividing-decimals.json` | ✅ |
| 45 | Multiplying decimals | `045-multiplying-decimals.json` | ✅ |
| 46 | Rounding decimals to decimal places | `046-rounding-decimals-to-decimal-places.json` | ✅ |

### Topic 14: Four Operations and Order of Operations
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 47 | BIDMAS/BODMAS | `047-bidmas-bodmas.json` | ✅ |
| 48 | Checking answers using inverse operations | `048-checking-answers-using-inverse-operations.json` | ✅ |
| 49 | Multi-step calculations | `049-multi-step-calculations.json` | ✅ |

### Topic 15: Fractions
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 50 | Adding and subtracting fractions | `050-adding-and-subtracting-fractions.json` | ✅ |
| 51 | Algebraic fractions | `051-algebraic-fractions.json` | ✅ |
| 52 | Dividing fractions | `052-dividing-fractions.json` | ✅ |
| 53 | Multiplying fractions | `053-multiplying-fractions.json` | ✅ |

### Topic 16: Fractions (Halves, Quarters, Thirds)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 54 | Comparing simple fractions | `054-comparing-simple-fractions.json` | ⬜ |
| 55 | Finding a half of a shape and quantity | `055-finding-a-half-of-a-shape-and-quantity.json` | ⬜ |
| 56 | Finding a quarter of a shape and quantity | `056-finding-a-quarter-of-a-shape-and-quantity.json` | ⬜ |
| 57 | Finding a third of a shape and quantity | `057-finding-a-third-of-a-shape-and-quantity.json` | ⬜ |

### Topic 17: Fractions and Decimals (Tenths, Hundredths)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 58 | Hundredths as fractions and decimals | `058-hundredths-as-fractions-and-decimals.json` | ⬜ |
| 59 | Ordering decimals | `059-ordering-decimals.json` | ⬜ |
| 60 | Rounding decimals | `060-rounding-decimals.json` | ⬜ |
| 61 | Tenths as fractions and decimals | `061-tenths-as-fractions-and-decimals.json` | ⬜ |

### Topic 18: Fractions — Adding and Subtracting
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 62 | Adding fractions with the same denominator | `062-adding-fractions-with-the-same-denominator.json` | ⬜ |
| 63 | Adding mixed numbers | `063-adding-mixed-numbers.json` | ⬜ |
| 64 | Subtracting fractions with the same denominator | `064-subtracting-fractions-with-the-same-denominator.json` | ⬜ |
| 65 | Subtracting mixed numbers | `065-subtracting-mixed-numbers.json` | ⬜ |

### Topic 19: Fractions — All Operations
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 66 | Adding and subtracting fractions (different denominators) | `066-adding-and-subtracting-fractions-different-denominators.json` | ✅ |
| 67 | Dividing fractions | `067-dividing-fractions.json` | ✅ |
| 68 | Fractions of amounts | `068-fractions-of-amounts.json` | ✅ |
| 69 | Multiplying fractions | `069-multiplying-fractions.json` | ✅ |

### Topic 20: Fractions — Secondary
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 70 | Adding and subtracting algebraic fractions | `070-adding-and-subtracting-algebraic-fractions.json` | ✅ |
| 71 | Equations involving fractions | `071-equations-involving-fractions.json` | ✅ |
| 72 | Multiplying and dividing algebraic fractions | `072-multiplying-and-dividing-algebraic-fractions.json` | ✅ |
| 73 | Simplifying algebraic fractions | `073-simplifying-algebraic-fractions.json` | ✅ |

### Topic 21: Fractions — Unit and Non-Unit Fractions
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 74 | Comparing and ordering fractions | `074-comparing-and-ordering-fractions.json` | ⬜ |
| 75 | Equivalent fractions | `075-equivalent-fractions.json` | ⬜ |
| 76 | Non-unit fractions | `076-non-unit-fractions.json` | ⬜ |
| 77 | Unit fractions on a number line | `077-unit-fractions-on-a-number-line.json` | ⬜ |

### Topic 22: Fractions, Decimals and Percentages
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 78 | Converting between fractions, decimals and percentages | `078-converting-between-fdp.json` | ✅ |
| 79 | Ordering FDP | `079-ordering-fdp.json` | ✅ |
| 80 | Percentage change | `080-percentage-change.json` | ✅ |
| 81 | Recurring decimals | `081-recurring-decimals.json` | ✅ |

### Topic 23: Functions and Graphs
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 82 | Sketching quadratic, cubic and reciprocal graphs | `082-sketching-quadratic-cubic-and-reciprocal-graphs.json` | ✅ |
| 83 | Transformations of graphs | `083-transformations-of-graphs.json` | ✅ |

### Topic 24: Indices and Standard Form
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 84 | Calculations in standard form | `084-calculations-in-standard-form.json` | ✅ |

### Topic 25: Linear Inequalities
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 85 | Double inequalities | `085-double-inequalities.json` | ✅ |
| 86 | Inequalities in two variables | `086-inequalities-in-two-variables.json` | ✅ |
| 87 | Representing inequalities on a number line | `087-representing-inequalities-on-a-number-line.json` | ✅ |

### Topic 26: Multiplication and Division (2, 5, 10 Times Tables)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 88 | 10 times table | `088-10-times-table.json` | ✅ |
| 89 | 2 times table | `089-2-times-table.json` | ✅ |
| 90 | 5 times table | `090-5-times-table.json` | ✅ |
| 91 | Division as the inverse of multiplication | `091-division-as-the-inverse-of-multiplication.json` | ✅ |

### Topic 27: Multiplication and Division (3, 4, 8 Times Tables)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 92 | 3 times table | `092-3-times-table.json` | ✅ |
| 93 | 4 times table | `093-4-times-table.json` | ✅ |
| 94 | 8 times table | `094-8-times-table.json` | ✅ |
| 95 | Mixed times table practice | `095-mixed-times-table-practice.json` | ✅ |

### Topic 28: Multiplication and Division (Multi-Digit)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 96 | Dividing by 10, 100 and 1000 | `096-dividing-by-10-100-and-1000.json` | ✅ |
| 97 | Long division | `097-long-division.json` | ✅ |
| 98 | Long multiplication | `098-long-multiplication.json` | ✅ |
| 99 | Multiplying by 10, 100 and 1000 | `099-multiplying-by-10-100-and-1000.json` | ✅ |

### Topic 29: Multiplication and Division (Times Tables to 12×12)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 100 | 6, 7, 9, 11, 12 times tables | `100-6-7-9-11-12-times-tables.json` | ✅ |
| 101 | Factor pairs and commutativity | `101-factor-pairs-and-commutativity.json` | ⬜ |
| 102 | Short division | `102-short-division.json` | ✅ |
| 103 | Short multiplication | `103-short-multiplication.json` | ✅ |

### Topic 30: Percentages
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 104 | Compound interest and depreciation | `104-compound-interest-and-depreciation.json` | ✅ |
| 105 | Percentage increase and decrease | `105-percentage-increase-and-decrease.json` | ✅ |
| 106 | Percentage of an amount | `106-percentage-of-an-amount.json` | ✅ |

### Topic 31: Percentages of Amounts
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 107 | Finding any percentage of an amount | `107-finding-any-percentage-of-an-amount.json` | ✅ |
| 108 | Percentage increase and decrease | `108-percentage-increase-and-decrease-primary.json` | ✅ |

### Topic 32: Place Value (Tens and Ones)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 109 | Comparing and ordering 2-digit numbers | `109-comparing-and-ordering-2-digit-numbers.json` | ⬜ |
| 110 | Partitioning 2-digit numbers | `110-partitioning-2-digit-numbers.json` | ⬜ |
| 111 | Representing numbers with base-10 blocks | `111-representing-numbers-with-base-10-blocks.json` | ⬜ |
| 112 | Writing numbers in expanded form | `112-writing-numbers-in-expanded-form.json` | ⬜ |

### Topic 33: Place Value (to 100)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 113 | Comparing and ordering numbers to 100 | `113-comparing-and-ordering-numbers-to-100.json` | ⬜ |
| 114 | Counting in tens | `114-counting-in-tens.json` | ⬜ |
| 115 | Finding 10 more and 10 less | `115-finding-10-more-and-10-less.json` | ⬜ |
| 116 | Partitioning 2-digit numbers | `116-partitioning-2-digit-numbers-yr2.json` | ⬜ |

### Topic 34: Place Value (to 1000)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 117 | Comparing and ordering 3-digit numbers | `117-comparing-and-ordering-3-digit-numbers.json` | ⬜ |
| 118 | Counting in 100s | `118-counting-in-100s.json` | ⬜ |
| 119 | Finding 100 more and 100 less | `119-finding-100-more-and-100-less.json` | ⬜ |
| 120 | Hundreds, tens and ones | `120-hundreds-tens-and-ones.json` | ⬜ |

### Topic 35: Place Value (to 10,000)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 121 | Negative numbers | `121-negative-numbers.json` | ⬜ |
| 122 | Roman numerals to 1000 | `122-roman-numerals-to-1000.json` | ⬜ |
| 123 | Rounding to the nearest 10, 100 and 1000 | `123-rounding-to-the-nearest-10-100-and-1000.json` | ⬜ |
| 124 | Thousands, hundreds, tens and ones | `124-thousands-hundreds-tens-and-ones.json` | ⬜ |

### Topic 36: Place Value (to 1,000,000)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 125 | Negative numbers in context | `125-negative-numbers-in-context.json` | ⬜ |
| 126 | Reading and writing numbers to 1,000,000 | `126-reading-and-writing-numbers-to-1000000.json` | ⬜ |
| 127 | Rounding any number | `127-rounding-any-number.json` | ⬜ |

### Topic 37: Place Value (to 10,000,000 and Negative Numbers)
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 128 | Negative numbers — ordering and calculating | `128-negative-numbers-ordering-and-calculating.json` | ⬜ |
| 129 | Ordering and comparing large numbers | `129-ordering-and-comparing-large-numbers.json` | ⬜ |
| 130 | Reading and writing numbers to 10,000,000 | `130-reading-and-writing-numbers-to-10000000.json` | ⬜ |
| 131 | Using negative numbers in context | `131-using-negative-numbers-in-context.json` | ⬜ |

### Topic 38: Place Value and Ordering Integers
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 132 | Estimating calculations | `132-estimating-calculations.json` | ✅ |
| 133 | Ordering positive and negative integers | `133-ordering-positive-and-negative-integers.json` | ✅ |
| 134 | Reading and writing large integers | `134-reading-and-writing-large-integers.json` | ✅ |
| 135 | Rounding to significant figures | `135-rounding-to-significant-figures.json` | ✅ |

### Topic 39: Probability
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 136 | Basic probability — single events | `136-basic-probability-single-events.json` | ✅ |
| 137 | Conditional probability and Venn diagrams | `137-conditional-probability-and-venn-diagrams.json` | ✅ |
| 138 | Mutually exclusive events | `138-mutually-exclusive-events.json` | ✅ |
| 139 | Tree diagrams | `139-tree-diagrams.json` | ✅ |

### Topic 40: Proportion
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 140 | Direct proportion | `140-direct-proportion.json` | ✅ |
| 141 | Inverse proportion | `141-inverse-proportion.json` | ✅ |
| 142 | Proportion graphs | `142-proportion-graphs.json` | ✅ |
| 143 | Proportion in context (recipes, maps, scale) | `143-proportion-in-context.json` | ✅ |

### Topic 41: Pythagoras' Theorem
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 144 | Applying Pythagoras in 2D problems | `144-applying-pythagoras-in-2d-problems.json` | ✅ |
| 145 | Applying Pythagoras in 3D problems | `145-applying-pythagoras-in-3d-problems.json` | ✅ |
| 146 | Finding a shorter side | `146-finding-a-shorter-side.json` | ✅ |
| 147 | Finding the hypotenuse | `147-finding-the-hypotenuse.json` | ✅ |

### Topic 42: Quadratic Equations
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 148 | Completing the square | `148-completing-the-square.json` | ✅ |
| 149 | Discriminant | `149-discriminant.json` | ✅ |
| 150 | Factorising quadratics | `150-factorising-quadratics.json` | ✅ |

### Topic 43: Ratio
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 151 | Best value problems | `151-best-value-problems.json` | ✅ |
| 152 | Dividing in a ratio | `152-dividing-in-a-ratio.json` | ✅ |
| 153 | Ratio and proportion problems | `153-ratio-and-proportion-problems.json` | ✅ |
| 154 | Simplifying ratios | `154-simplifying-ratios.json` | ✅ |

### Topic 44: Ratio and Proportion
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 155 | Dividing quantities in a given ratio | `155-dividing-quantities-in-a-given-ratio.json` | ✅ |
| 156 | Scale factors | `156-scale-factors.json` | ✅ |

### Topic 45: Sequences
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 157 | Fibonacci-type sequences | `157-fibonacci-type-sequences.json` | ✅ |
| 158 | Geometric sequences | `158-geometric-sequences.json` | ✅ |
| 159 | Quadratic sequences | `159-quadratic-sequences.json` | ✅ |

### Topic 46: Simultaneous Equations
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 160 | Non-linear simultaneous equations | `160-non-linear-simultaneous-equations.json` | ✅ |
| 161 | Solving by elimination | `161-solving-by-elimination.json` | ✅ |
| 162 | Solving by substitution | `162-solving-by-substitution.json` | ✅ |

### Topic 47: Solving Linear Equations
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 163 | Equations with brackets | `163-equations-with-brackets.json` | ✅ |
| 164 | Equations with unknowns on both sides | `164-equations-with-unknowns-on-both-sides.json` | ✅ |
| 165 | One-step equations | `165-one-step-equations.json` | ✅ |
| 166 | Two-step equations | `166-two-step-equations.json` | ✅ |

### Topic 48: Statistics
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 167 | Cumulative frequency and box plots | `167-cumulative-frequency-and-box-plots.json` | ✅ |
| 168 | Frequency tables and grouped data | `168-frequency-tables-and-grouped-data.json` | ✅ |
| 169 | Histograms | `169-histograms.json` | ✅ |
| 170 | Mean, median, mode and range | `170-mean-median-mode-and-range.json` | ✅ |

### Topic 49: Straight-Line Graphs
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 171 | Equation of a straight line (y = mx + c) | `171-equation-of-a-straight-line.json` | ✅ |
| 172 | Gradient and y-intercept | `172-gradient-and-y-intercept.json` | ✅ |
| 173 | Parallel and perpendicular lines | `173-parallel-and-perpendicular-lines.json` | ✅ |
| 174 | Plotting straight-line graphs | `174-plotting-straight-line-graphs.json` | ✅ |

### Topic 50: Surds
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 175 | Adding and subtracting surds | `175-adding-and-subtracting-surds.json` | ✅ |
| 176 | Multiplying and dividing surds | `176-multiplying-and-dividing-surds.json` | ✅ |
| 177 | Rationalising the denominator | `177-rationalising-the-denominator.json` | ✅ |
| 178 | Simplifying surds | `178-simplifying-surds.json` | ✅ |

### Topic 51: Transformations
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 179 | Enlargement | `179-enlargement.json` | ✅ |
| 180 | Reflection | `180-reflection.json` | ✅ |
| 181 | Rotation | `181-rotation.json` | ✅ |
| 182 | Translation | `182-translation.json` | ✅ |

### Topic 52: Trigonometry
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 183 | Exact trigonometric values | `183-exact-trigonometric-values.json` | ✅ |
| 184 | SOH CAH TOA — finding angles | `184-soh-cah-toa-finding-angles.json` | ✅ |
| 185 | SOH CAH TOA — finding sides | `185-soh-cah-toa-finding-sides.json` | ✅ |
| 186 | Sine and cosine rules | `186-sine-and-cosine-rules.json` | ✅ |

### Topic 53: Vectors
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 187 | Adding and subtracting vectors | `187-adding-and-subtracting-vectors.json` | ✅ |
| 188 | Multiplying vectors by a scalar | `188-multiplying-vectors-by-a-scalar.json` | ✅ |
| 189 | Vector geometry proofs | `189-vector-geometry-proofs.json` | ✅ |
| 190 | Writing and representing vectors | `190-writing-and-representing-vectors.json` | ✅ |

### Topic 54: Volume and Surface Area
| # | Subtopic | JSON filename | Status |
|---|----------|---------------|--------|
| 191 | Surface area of cylinders and spheres | `191-surface-area-of-cylinders-and-spheres.json` | ✅ |
| 192 | Surface area of prisms | `192-surface-area-of-prisms.json` | ✅ |
| 193 | Volume of prisms and cylinders | `193-volume-of-prisms-and-cylinders.json` | ✅ |
| 194 | Volume of pyramids, cones and spheres | `194-volume-of-pyramids-cones-and-spheres.json` | ✅ |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total subtopics | 194 |
| JSON created | 128 |
| PDF generated | 128 |
| Remaining | 66 |

---

## Design Principles

1. **Identical layout** — every worksheet uses the same 2-page A4 landscape template (modelled examples → practice → misconceptions → challenge → footer)
2. **SEND-overlay compatible** — the JSON schema matches the overlay system so that SEND adaptations (larger font, reduced question count, visual scaffolding) can be applied programmatically
3. **Curriculum-aligned** — subtopics are sourced from the `exam-bank-coverage.json` canonical list which maps to AQA/Edexcel/OCR specifications
4. **Deliberate practice model** — questions progress from identification → basic skill → negative/harder variants → mixed → word problems
5. **Misconception-aware** — every worksheet includes 5 common errors for pupils to identify and correct

---

## Next Steps

1. ✅ Create folder structure
2. ✅ Save generation script
3. ✅ Write this plan
4. ✅ Generate first 3 sample worksheets (JSON + PDF)
5. Push to branch `feat/maths-worksheets-plan`
6. Begin batch generation (topics 1–54, estimated ~8 sessions)
