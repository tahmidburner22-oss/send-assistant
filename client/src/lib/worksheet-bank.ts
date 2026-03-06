// Pre-made worksheet bank — TES/Maths Genie style templates
// These are ready-made worksheets with dyslexia-friendly formatting built in

export interface BankWorksheet {
  id: string;
  title: string;
  subject: string;
  topic: string;
  yearGroup: string;
  difficulty: string;
  source: string; // "TES Style" | "Maths Genie Style" | "SEND Assistant"
  tags: string[];
  content: string;
  teacherNotes: string;
  markScheme?: string;
  sendFriendly: boolean;
  overlayRecommended: string; // overlay id
  estimatedTime: string;
  totalMarks?: number;
}

export const worksheetBank: BankWorksheet[] = [
  // ─── MATHEMATICS ───────────────────────────────────────────────────────────
  {
    id: "maths-fractions-y5",
    title: "Fractions — Adding and Subtracting (Year 5)",
    subject: "mathematics",
    topic: "Fractions",
    yearGroup: "Year 5",
    difficulty: "mixed",
    source: "Maths Genie Style",
    tags: ["fractions", "adding", "subtracting", "KS2"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "45 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Add and subtract fractions with different denominators, including mixed numbers.

## Key Vocabulary
**Numerator** | **Denominator** | **Equivalent fraction** | **Common denominator** | **Simplify** | **Mixed number** | **Improper fraction** | **LCM**

## Worked Example
**Question:** Work out 1/3 + 1/4

**Step 1:** Find the LCM of 3 and 4 → LCM = 12

**Step 2:** Convert both fractions:
- 1/3 = 4/12
- 1/4 = 3/12

**Step 3:** Add the numerators: 4/12 + 3/12 = 7/12

**Answer: 7/12**

---

## Section A — Guided Practice (1 mark each)

Work out each calculation. Show your working.

1. 1/2 + 1/4 = ________

2. 2/3 + 1/6 = ________

3. 3/4 − 1/8 = ________

4. 5/6 − 1/3 = ________

---

## Section B — Independent Practice (2 marks each)

Show all working clearly.

5. 2/5 + 3/10 = ________

6. 7/8 − 1/4 = ________

7. 1/3 + 2/5 = ________

8. 5/6 − 3/4 = ________

9. 3/4 + 2/3 = ________

10. 7/10 − 2/5 = ________

---

## Section C — Mixed Numbers (2 marks each)

11. 1 1/2 + 2 1/4 = ________

12. 3 2/3 − 1 1/6 = ________

13. 2 3/4 + 1 2/3 = ________

---

## Challenge ⭐

14. Sam has 3/4 of a pizza. He eats 1/3 of the pizza. What fraction is left?

15. A recipe needs 2/3 cup of flour and 1/4 cup of sugar. How much more flour than sugar is needed?`,
    teacherNotes: `**Lesson Structure (45 mins):**
- 10 min: Recap equivalent fractions using fraction wall (display on board)
- 5 min: Model worked example — emphasise finding LCM, not just multiplying denominators
- 15 min: Sections A & B — circulate and support
- 10 min: Section C mixed numbers
- 5 min: Plenary — common errors discussion

**Common Misconceptions:**
- Students add denominators (e.g., 1/3 + 1/4 = 2/7) — address explicitly
- Students forget to simplify final answers
- Mixed numbers: students don't convert to improper fractions first

**SEND Adaptations:**
- Provide fraction wall and LCM reference sheet
- Allow calculator for LCM calculations
- Reduce to Section A only for lower ability
- Colour-code numerator and denominator in different colours

**Differentiation:**
- Support: Provide LCM table for denominators 2-12
- Core: Sections A and B
- Extension: Section C + challenge questions`,
    markScheme: `Section A: 1) 3/4  2) 5/6  3) 5/8  4) 1/2
Section B: 5) 7/10  6) 5/8  7) 11/15  8) 1/12  9) 17/12 = 1 5/12  10) 3/10
Section C: 11) 3 3/4  12) 2 1/2  13) 4 5/12
Challenge: 14) 5/12  15) 5/12 cup more flour`,
  },

  {
    id: "maths-pythagoras-y9",
    title: "Pythagoras' Theorem (Year 9)",
    subject: "mathematics",
    topic: "Pythagoras' Theorem",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "Maths Genie Style",
    tags: ["pythagoras", "geometry", "triangles", "KS4"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "50 minutes",
    totalMarks: 35,
    content: `## Learning Objective
Use Pythagoras' theorem to find missing sides in right-angled triangles.

## Key Vocabulary
**Hypotenuse** | **Right angle** | **Square** | **Square root** | **Theorem** | **Opposite** | **Adjacent**

## Formula
**a² + b² = c²**
where c is the hypotenuse (the longest side, opposite the right angle)

## Worked Example
**Find the hypotenuse of a right-angled triangle with legs 3 cm and 4 cm.**

Step 1: Write the formula: a² + b² = c²

Step 2: Substitute: 3² + 4² = c²

Step 3: Calculate: 9 + 16 = c²

Step 4: c² = 25

Step 5: c = √25 = **5 cm**

---

## Section A — Finding the Hypotenuse (2 marks each)

Find the length of the hypotenuse. Give answers to 1 decimal place where necessary.

1. a = 5 cm, b = 12 cm → c = ________

2. a = 8 cm, b = 6 cm → c = ________

3. a = 7 cm, b = 9 cm → c = ________

4. a = 4 cm, b = 4 cm → c = ________

---

## Section B — Finding a Shorter Side (2 marks each)

5. c = 13 cm, a = 5 cm → b = ________

6. c = 17 cm, a = 8 cm → b = ________

7. c = 10 cm, b = 6 cm → a = ________

8. c = 25 cm, b = 7 cm → a = ________

---

## Section C — Problem Solving (3 marks each)

9. A ladder 5 m long leans against a wall. The base of the ladder is 2 m from the wall. How high up the wall does the ladder reach? Give your answer to 2 decimal places.

10. A rectangular field is 80 m long and 60 m wide. What is the length of the diagonal path across the field?

---

## Challenge ⭐

11. Is a triangle with sides 9 cm, 12 cm, and 15 cm a right-angled triangle? Show your working and explain your answer.`,
    teacherNotes: `**Lesson Structure (50 mins):**
- 5 min: Starter — squares and square roots recall
- 10 min: Introduce theorem with visual proof (squares on sides)
- 5 min: Worked example — model clearly
- 20 min: Sections A & B
- 10 min: Section C problem solving

**Common Misconceptions:**
- Students apply theorem to non-right-angled triangles
- Students don't identify the hypotenuse correctly
- Rounding errors — remind to keep full value until final step

**SEND Adaptations:**
- Provide formula card
- Pre-draw triangles with labels for visual learners
- Use squared paper for drawing triangles
- Calculator allowed throughout`,
    markScheme: `A: 1) 13cm  2) 10cm  3) 11.4cm  4) 5.7cm
B: 5) 12cm  6) 15cm  7) 8cm  8) 24cm
C: 9) 4.58m  10) 100m
Challenge: 11) Yes — 9²+12²=81+144=225=15² ✓`,
  },

  {
    id: "maths-algebra-y7",
    title: "Introduction to Algebra — Simplifying Expressions (Year 7)",
    subject: "mathematics",
    topic: "Algebra",
    yearGroup: "Year 7",
    difficulty: "basic",
    source: "Maths Genie Style",
    tags: ["algebra", "simplifying", "like terms", "KS3"],
    sendFriendly: true,
    overlayRecommended: "pale-yellow",
    estimatedTime: "40 minutes",
    totalMarks: 25,
    content: `## Learning Objective
Simplify algebraic expressions by collecting like terms.

## Key Vocabulary
**Variable** | **Term** | **Like terms** | **Coefficient** | **Expression** | **Simplify**

## What are Like Terms?
Like terms have the **same letter(s)**.

- 3x and 5x are like terms (both have x)
- 2y and 4y are like terms (both have y)
- 3x and 2y are NOT like terms (different letters)

## Worked Example
**Simplify: 3x + 2y + 5x − y**

Step 1: Group the x terms: 3x + 5x = 8x

Step 2: Group the y terms: 2y − y = y

**Answer: 8x + y**

---

## Section A — Identify Like Terms

Circle the like terms in each list:

1. 3x, 2y, 5x, 4z, x

2. 2a, 3b, 5a, b, 4c

---

## Section B — Simplify (1 mark each)

3. 4x + 3x = ________

4. 7y − 2y = ________

5. 5a + 3a − 2a = ________

6. 6b − b + 4b = ________

---

## Section C — Mixed Terms (2 marks each)

7. 3x + 2y + 4x + y = ________

8. 5a − 2b + 3a + 4b = ________

9. 6m + 3n − 2m − n = ________

10. 4p + 2q − p + 3q = ________

---

## Challenge ⭐

11. Write an expression with 3 terms that simplifies to 5x + 2y.

12. Alex says 3x + 2 = 5x. Is Alex correct? Explain why.`,
    teacherNotes: `**Lesson Structure (40 mins):**
- 5 min: Starter — what is a variable? (use physical objects as analogy)
- 10 min: Introduce like terms with colour-coding
- 5 min: Worked example
- 15 min: Sections B & C
- 5 min: Challenge + discussion

**Common Misconceptions:**
- Students add unlike terms (3x + 2y = 5xy)
- Students forget that x means 1x
- Negative terms: students drop the minus sign

**SEND Adaptations:**
- Colour-code different variables (x = blue, y = red)
- Provide algebra tiles or cut-out cards
- Reduce Section C to questions 7-8 only`,
    markScheme: `B: 3)7x 4)5y 5)6a 6)9b
C: 7)7x+3y 8)8a+2b 9)4m+2n 10)3p+5q`,
  },

  // ─── ENGLISH ───────────────────────────────────────────────────────────────
  {
    id: "english-descriptive-y6",
    title: "Descriptive Writing — Using the Senses (Year 6)",
    subject: "english",
    topic: "Descriptive Writing",
    yearGroup: "Year 6",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["writing", "descriptive", "senses", "KS2"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "50 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Write descriptively using all five senses, varied sentence structures, and figurative language.

## Key Vocabulary
**Simile** | **Metaphor** | **Personification** | **Alliteration** | **Onomatopoeia** | **Imagery** | **Sensory language**

## The Five Senses in Writing

| Sense | Example |
|-------|---------|
| Sight | The crimson sun melted into the horizon |
| Sound | The waves crashed and hissed against the rocks |
| Smell | The salty sea air filled her lungs |
| Touch | Rough pebbles dug into her bare feet |
| Taste | She could almost taste the brine on her lips |

## Worked Example — Improving a Sentence

**Basic:** The forest was dark.

**Improved:** The ancient forest loomed overhead, its twisted branches clawing at the pale moonlight like skeletal fingers.

---

## Section A — Identify the Technique (1 mark each)

Identify the technique used in each sentence:

1. "The wind whispered through the trees." → ________________

2. "Her smile was a ray of sunshine." → ________________

3. "The thunder boomed and banged." → ________________

4. "Silent, silver snowflakes settled softly." → ________________

---

## Section B — Improve the Sentences (3 marks each)

Rewrite each sentence to make it more descriptive. Use at least one technique.

5. The house was old.

_________________________________________________________________

6. The dog ran quickly.

_________________________________________________________________

7. It was a cold day.

_________________________________________________________________

---

## Section C — Extended Writing (10 marks)

**Choose ONE of the following:**

**Option A:** Describe a busy market. Use all five senses.

**Option B:** Describe a storm at sea. Include at least three different techniques.

Write at least two paragraphs.

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________`,
    teacherNotes: `**Lesson Structure (50 mins):**
- 5 min: Starter — show an image, students write one sentence for each sense
- 10 min: Teach/recap techniques with examples
- 5 min: Section A — identify techniques
- 15 min: Section B — sentence improvement
- 15 min: Section C — extended writing

**Assessment Focus:**
- Vocabulary (varied, ambitious word choices)
- Sentence structure (varied length and type)
- Techniques (at least 3 different ones)
- Coherence (logical flow between sentences)

**SEND Adaptations:**
- Provide sentence starters for Section C
- Allow verbal response for Section B
- Reduce extended writing to one paragraph
- Provide word bank of descriptive vocabulary`,
    markScheme: `A: 1)Personification 2)Metaphor 3)Onomatopoeia 4)Alliteration
B: Accept any improved sentence with clear technique — award marks for: 1)technique used, 2)vocabulary quality, 3)overall improvement
C: Mark against NC writing assessment criteria`,
  },

  {
    id: "english-persuasive-y8",
    title: "Persuasive Writing — AFOREST Techniques (Year 8)",
    subject: "english",
    topic: "Persuasive Writing",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["writing", "persuasive", "AFOREST", "KS3"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "55 minutes",
    totalMarks: 40,
    content: `## Learning Objective
Write persuasively using AFOREST techniques and a range of sentence structures.

## AFOREST Techniques

| Letter | Technique | Example |
|--------|-----------|---------|
| **A** | Anecdote | "When I was eight years old, I witnessed..." |
| **F** | Fact | "Studies show that 73% of students..." |
| **O** | Opinion | "It is clear that we must act now..." |
| **R** | Rhetorical question | "Can we really afford to ignore this?" |
| **E** | Emotive language | "The devastating consequences..." |
| **S** | Statistics | "Over 1 million people are affected..." |
| **T** | Tricolon (Rule of Three) | "We must act quickly, decisively, and boldly." |

## Worked Example — Opening Paragraph

**Topic:** School uniform should be abolished.

*Is it not time we stopped forcing children into identical grey boxes? Every day, thousands of students across Britain are denied the right to express who they truly are. Research by the University of Exeter found that 68% of students feel more confident when allowed to choose their own clothing. School uniform is not a solution — it is an obstacle to individuality, creativity, and self-expression.*

**Techniques used:** Rhetorical question, emotive language, statistics, tricolon.

---

## Section A — Identify AFOREST Techniques (1 mark each)

1. "Nine out of ten dentists recommend..." → ________________

2. "How can we stand by and do nothing?" → ________________

3. "The heartbreaking reality is that children are suffering." → ________________

4. "We need change — real, lasting, meaningful change." → ________________

---

## Section B — Write Your Own (3 marks each)

Write one sentence for each technique on the topic: **"Social media should be banned for under-16s"**

5. Fact: _______________________________________________________________

6. Rhetorical question: _________________________________________________

7. Emotive language: ___________________________________________________

8. Tricolon: ___________________________________________________________

---

## Section C — Extended Writing (20 marks)

Write a persuasive speech (3-4 paragraphs) on ONE of the following:

**A:** "Homework does more harm than good."

**B:** "Zoos should be abolished."

**C:** "Every school should have a forest school programme."

Use at least FIVE AFOREST techniques. Underline each technique and label it in the margin.`,
    teacherNotes: `**Lesson Structure (55 mins):**
- 5 min: Starter — what makes writing persuasive? (class discussion)
- 10 min: Teach AFOREST with examples
- 5 min: Worked example analysis
- 10 min: Sections A & B
- 25 min: Section C extended writing

**Marking Section C (20 marks):**
- Content & ideas: 6 marks
- AFOREST techniques (5+ used): 6 marks
- Vocabulary & style: 4 marks
- Structure & paragraphing: 4 marks

**SEND Adaptations:**
- Provide AFOREST reference card
- Allow bullet-pointed response for Section C
- Sentence starters provided
- Reduce to 2 paragraphs for Section C`,
    markScheme: `A: 1)Statistics 2)Rhetorical question 3)Emotive language 4)Tricolon
B: Accept any appropriate sentence demonstrating the technique
C: Mark against criteria above`,
  },

  // ─── SCIENCE ───────────────────────────────────────────────────────────────
  {
    id: "science-photosynthesis-y8",
    title: "Photosynthesis (Year 8)",
    subject: "science",
    topic: "Photosynthesis",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["biology", "photosynthesis", "plants", "KS3"],
    sendFriendly: true,
    overlayRecommended: "mint-green",
    estimatedTime: "50 minutes",
    totalMarks: 35,
    content: `## Learning Objective
Describe the process of photosynthesis, including the reactants, products, and conditions required.

## Key Vocabulary
**Photosynthesis** | **Chlorophyll** | **Chloroplast** | **Glucose** | **Carbon dioxide** | **Oxygen** | **Light energy** | **Stomata**

## The Equation

**Carbon dioxide + Water → Glucose + Oxygen**

6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂

(requires: light energy and chlorophyll)

## Where Does Photosynthesis Happen?
- In the **chloroplasts** of plant cells
- Chloroplasts contain **chlorophyll** — the green pigment that absorbs light
- Mainly occurs in **leaf cells**

---

## Section A — Knowledge Check (1 mark each)

1. What gas do plants take in during photosynthesis? ________________

2. What gas do plants release during photosynthesis? ________________

3. Where in the plant cell does photosynthesis take place? ________________

4. What is the name of the green pigment in leaves? ________________

5. What is the energy source for photosynthesis? ________________

---

## Section B — Short Answer (2 marks each)

6. Write the word equation for photosynthesis.

_________________________________________________________________

7. Name TWO conditions needed for photosynthesis to occur.

_________________________________________________________________

8. Explain why leaves are usually flat and thin.

_________________________________________________________________

9. A plant is kept in a dark cupboard for three days. Predict what will happen to the plant and explain why.

_________________________________________________________________

---

## Section C — Extended Answer (6 marks)

10. Describe the process of photosynthesis. Include:
- Where it takes place
- What raw materials are needed and where they come from
- What products are made and how they are used

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Challenge ⭐

11. A scientist investigates how light intensity affects the rate of photosynthesis. Predict what the results will show and explain your prediction using your knowledge of photosynthesis.`,
    teacherNotes: `**Lesson Structure (50 mins):**
- 5 min: Starter — what do plants need to survive? (prior knowledge)
- 10 min: Teach photosynthesis with diagram
- 5 min: Equation — word and symbol
- 20 min: Sections A, B, C
- 10 min: Challenge + class discussion

**Common Misconceptions:**
- Plants get food from soil (they make their own via photosynthesis)
- Plants only respire at night (they respire all the time)
- Oxygen is the main product (glucose is the main product)

**SEND Adaptations:**
- Provide equation card
- Use diagram with labels to support Section C
- Sentence starters for extended answer
- Reduce Section C to bullet points`,
    markScheme: `A: 1)CO₂/carbon dioxide 2)O₂/oxygen 3)Chloroplast 4)Chlorophyll 5)Light/sunlight
B: 6)Carbon dioxide+water→glucose+oxygen 7)Light+chlorophyll/water/CO₂ (any 2) 8)Large surface area to absorb light/thin for CO₂ to diffuse 9)Plant will die/stop growing — no light = no photosynthesis = no glucose for energy
C: 6 marks — 1 each for: location, CO₂ from air, water from roots, light energy, glucose produced, oxygen released`,
  },

  // ─── HISTORY ───────────────────────────────────────────────────────────────
  {
    id: "history-ww2-y9",
    title: "Causes of World War Two (Year 9)",
    subject: "history",
    topic: "World War Two",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["WW2", "causes", "Hitler", "appeasement", "KS3"],
    sendFriendly: true,
    overlayRecommended: "pale-yellow",
    estimatedTime: "55 minutes",
    totalMarks: 40,
    content: `## Learning Objective
Explain the main causes of World War Two and evaluate their relative importance.

## Key Vocabulary
**Appeasement** | **Treaty of Versailles** | **Nazi Party** | **Lebensraum** | **Anschluss** | **Sudetenland** | **Blitzkrieg** | **Propaganda**

## Background: The Treaty of Versailles (1919)

The Treaty of Versailles ended World War One and punished Germany severely:
- Germany lost 13% of its territory
- Germany's army was limited to 100,000 soldiers
- Germany had to pay £6.6 billion in reparations
- Germany had to accept the "War Guilt Clause" (Article 231)

Many Germans felt humiliated and angry — this resentment helped Hitler rise to power.

---

## Section A — Knowledge Check (1 mark each)

1. In which year did World War Two begin? ________________

2. What was the name of the policy of giving Hitler what he wanted to avoid war? ________________

3. Which country did Germany invade in September 1939, triggering Britain's declaration of war? ________________

4. What did "Lebensraum" mean? ________________

5. Who was the British Prime Minister who pursued appeasement? ________________

---

## Section B — Source Analysis (5 marks)

**Source A:** A British newspaper cartoon from 1938 showing Neville Chamberlain handing a piece of cake labelled "Czechoslovakia" to Adolf Hitler, who is already holding pieces labelled "Rhineland" and "Austria".

6. What is the message of this cartoon about appeasement?

_________________________________________________________________

7. How useful is this source for understanding British attitudes to Hitler in 1938? Explain your answer.

_________________________________________________________________

---

## Section C — Explanation (8 marks)

8. Explain TWO causes of World War Two. For each cause, explain how it contributed to the outbreak of war.

**Cause 1:** ___________________________________________________________

_________________________________________________________________

**Cause 2:** ___________________________________________________________

_________________________________________________________________

---

## Challenge ⭐ (10 marks)

9. "The Treaty of Versailles was the main cause of World War Two." How far do you agree with this statement? Use evidence to support your answer.`,
    teacherNotes: `**Lesson Structure (55 mins):**
- 5 min: Starter — what do students already know about WW2?
- 15 min: Teach causes with timeline
- 5 min: Source analysis technique (HCAP: How, Content, Attribution, Purpose)
- 25 min: Sections A, B, C
- 5 min: Challenge introduction (can be homework)

**Assessment Focus:**
- Knowledge and understanding of causes
- Source analysis skills
- Extended writing: argument, evidence, evaluation

**SEND Adaptations:**
- Provide cause cards to sort by importance
- Sentence starters for Sections B and C
- Reduce to one cause for Section C
- Allow bullet-pointed response`,
    markScheme: `A: 1)1939 2)Appeasement 3)Poland 4)Living space (for German people) 5)Neville Chamberlain
B: 6)2 marks: cartoon shows Hitler taking more and more territory; Chamberlain giving in 7)3 marks: useful because contemporary/British perspective; limited because cartoon is biased/satirical
C: 8 marks: 4 marks per cause — 1 identify, 2 explain, 1 link to war
Challenge: Level-marked essay`,
  },

  // ─── GEOGRAPHY ─────────────────────────────────────────────────────────────
  {
    id: "geography-climate-y7",
    title: "Climate Zones of the World (Year 7)",
    subject: "geography",
    topic: "Climate Zones",
    yearGroup: "Year 7",
    difficulty: "basic",
    source: "TES Style",
    tags: ["climate", "biomes", "world geography", "KS3"],
    sendFriendly: true,
    overlayRecommended: "pale-blue",
    estimatedTime: "45 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Identify and describe the main climate zones of the world and explain what causes them.

## Key Vocabulary
**Climate** | **Weather** | **Equator** | **Tropics** | **Latitude** | **Precipitation** | **Temperature** | **Biome**

## The Main Climate Zones

| Zone | Location | Temperature | Rainfall |
|------|----------|-------------|----------|
| Tropical | Near equator | Hot all year | Very high |
| Desert | 30° N/S of equator | Very hot days, cold nights | Very low |
| Temperate | 40-60° latitude | Mild, 4 seasons | Moderate |
| Continental | Inland, mid-latitudes | Extreme hot/cold | Low-moderate |
| Polar | Near poles | Freezing all year | Very low |

---

## Section A — Label the Map

On the world map below, shade and label:
- Tropical zone (red)
- Desert zone (yellow)
- Temperate zone (green)
- Polar zone (blue)

[DIAGRAM: World map outline — preserved as original]

---

## Section B — Knowledge Questions (1 mark each)

1. Which climate zone is found near the equator? ________________

2. Why are deserts found at approximately 30° north and south of the equator?

_________________________________________________________________

3. What is the difference between weather and climate?

_________________________________________________________________

4. Which climate zone does the UK have? ________________

---

## Section C — Describe a Climate (4 marks each)

Choose TWO climate zones. For each one, describe:
- Temperature (hot/cold/range)
- Rainfall (amount and pattern)
- Why this climate occurs

**Zone 1:** ___________________________________________________________

_________________________________________________________________

**Zone 2:** ___________________________________________________________

_________________________________________________________________

---

## Challenge ⭐

How might climate change affect the distribution of climate zones in the future? Use evidence to support your answer.`,
    teacherNotes: `**Lesson Structure (45 mins):**
- 5 min: Starter — what's the difference between weather and climate?
- 10 min: Teach climate zones with world map
- 5 min: Explain causes (latitude, distance from sea, altitude)
- 20 min: Sections A, B, C
- 5 min: Challenge discussion

**SEND Adaptations:**
- Pre-labelled map with zones outlined
- Climate zone fact cards for reference
- Sentence starters for description questions
- Reduce to one zone for Section C`,
    markScheme: `B: 1)Tropical 2)High pressure belt, sinking air, little rainfall 3)Weather=short term, climate=long-term average 4)Temperate
C: 4 marks each: 1)temperature description, 2)rainfall description, 3)seasonal pattern, 4)cause explained`,
  },

  // ─── COMPUTING ─────────────────────────────────────────────────────────────
  {
    id: "computing-algorithms-y7",
    title: "Introduction to Algorithms (Year 7)",
    subject: "computing",
    topic: "Algorithms",
    yearGroup: "Year 7",
    difficulty: "basic",
    source: "TES Style",
    tags: ["algorithms", "flowcharts", "pseudocode", "KS3"],
    sendFriendly: true,
    overlayRecommended: "pale-blue",
    estimatedTime: "45 minutes",
    totalMarks: 25,
    content: `## Learning Objective
Understand what an algorithm is and represent algorithms using flowcharts and pseudocode.

## Key Vocabulary
**Algorithm** | **Flowchart** | **Pseudocode** | **Sequence** | **Selection** | **Iteration** | **Input** | **Output**

## What is an Algorithm?
An algorithm is a **set of step-by-step instructions** to solve a problem.

Algorithms must be:
- **Clear** — each step is unambiguous
- **Ordered** — steps happen in the right sequence
- **Finite** — they must end

## Flowchart Symbols

| Shape | Name | Used for |
|-------|------|----------|
| Oval | Start/End | Beginning and end of algorithm |
| Rectangle | Process | An action or calculation |
| Diamond | Decision | A yes/no question |
| Parallelogram | Input/Output | Getting or displaying data |

---

## Section A — True or False (1 mark each)

1. An algorithm must always have a start and an end. True / False

2. A flowchart uses circles for decisions. True / False

3. Pseudocode is a programming language. True / False

4. Iteration means repeating steps. True / False

---

## Section B — Flowchart Questions (2 marks each)

5. Draw a flowchart for the following algorithm:
   - Ask the user to enter a number
   - If the number is greater than 10, display "Big number"
   - Otherwise, display "Small number"
   - End

[Answer space — draw your flowchart here]

---

## Section C — Pseudocode (3 marks each)

6. Write pseudocode for an algorithm that:
   - Asks the user for their age
   - If they are 18 or over, outputs "You can vote"
   - Otherwise outputs "You cannot vote yet"

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Challenge ⭐

7. Write an algorithm (as pseudocode or a flowchart) that asks a user to enter 5 numbers and outputs the total and average.`,
    teacherNotes: `**Lesson Structure (45 mins):**
- 5 min: Starter — give students a recipe and ask: is this an algorithm?
- 10 min: Teach algorithm concepts and flowchart symbols
- 5 min: Simple flowchart example together
- 20 min: Sections A, B, C
- 5 min: Challenge

**SEND Adaptations:**
- Provide flowchart symbol reference card
- Pre-drawn flowchart template for Section B
- Sentence starters for pseudocode
- Reduce challenge to 3 numbers instead of 5`,
    markScheme: `A: 1)True 2)False 3)False 4)True
B: 5) Flowchart: Start→Input number→Decision(>10?)→Yes:Output "Big number"/No:Output "Small number"→End
C: 6) INPUT age / IF age >= 18 THEN / OUTPUT "You can vote" / ELSE / OUTPUT "You cannot vote yet" / END IF`,
  },
];

// Helper functions for the bank
export function getBankBySubject(subject: string): BankWorksheet[] {
  return worksheetBank.filter(w => w.subject === subject);
}

export function getBankByYearGroup(yearGroup: string): BankWorksheet[] {
  return worksheetBank.filter(w => w.yearGroup === yearGroup);
}

export function searchBank(query: string): BankWorksheet[] {
  const q = query.toLowerCase();
  return worksheetBank.filter(w =>
    w.title.toLowerCase().includes(q) ||
    w.topic.toLowerCase().includes(q) ||
    w.tags.some(t => t.includes(q))
  );
}
