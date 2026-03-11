// Pre-made worksheet bank — TES/Maths Genie style templates
// These are ready-made worksheets with dyslexia-friendly formatting built in

export interface BankWorksheet {
  id: string;
  title: string;
  subject: string;
  topic: string;
  yearGroup: string;
  difficulty: string;
  source: string; // "TES Style" | "Maths Genie Style" | "Adaptly"
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
  // ─── MATHEMATICS (Additional) ─────────────────────────────────────────────
  {
    id: "maths-algebra-y8",
    title: "Algebra — Solving Linear Equations (Year 8)",
    subject: "mathematics",
    topic: "Algebra",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["algebra", "equations", "linear", "KS3"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "50 minutes",
    totalMarks: 35,
    content: `## Learning Objective
Solve linear equations with one unknown, including those with unknowns on both sides.
## Key Vocabulary
**Equation** | **Variable** | **Unknown** | **Balance** | **Inverse operation** | **Coefficient** | **Solution** | **Verify**
## Worked Example
**Solve: 3x + 5 = 17**
Step 1: Subtract 5 from both sides → 3x = 12
Step 2: Divide both sides by 3 → x = 4
**Check:** 3(4) + 5 = 12 + 5 = 17 ✓
---
## Section A — One-Step Equations (1 mark each)
1. x + 7 = 12, x = ____
2. y − 4 = 9, y = ____
3. 3z = 18, z = ____
4. m/5 = 4, m = ____
---
## Section B — Two-Step Equations (2 marks each)
5. 2x + 3 = 11
6. 4y − 7 = 13
7. 3m + 8 = 26
8. 5n − 12 = 8
---
## Section C — Unknowns on Both Sides (3 marks each)
9. 5x + 2 = 3x + 10
10. 7y − 4 = 2y + 11
11. 4m + 9 = 7m − 6
---
## Challenge ⭐
12. A number is multiplied by 4, then 7 is subtracted. The result is 25. Find the number. Show full working.`,
    teacherNotes: `Ensure students show all steps. Emphasise the balance method. For SEND: provide a steps scaffold card.`,
    markScheme: `A: 1)5 2)13 3)6 4)20 | B: 5)x=4 6)y=5 7)m=6 8)n=4 | C: 9)x=4 10)y=3 11)m=5 | Challenge: 8`,
  },
  {
    id: "maths-pythagoras-y9",
    title: "Pythagoras' Theorem (Year 9)",
    subject: "mathematics",
    topic: "Pythagoras",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "Maths Genie Style",
    tags: ["pythagoras", "geometry", "triangles", "KS3", "KS4"],
    sendFriendly: true,
    overlayRecommended: "pale-blue",
    estimatedTime: "45 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Apply Pythagoras' Theorem to find missing sides in right-angled triangles.
## Key Formula
a^2 + b^2 = c^2 (where c is the hypotenuse)
## Worked Example
Find the hypotenuse of a right-angled triangle with legs 3 cm and 4 cm.
Step 1: a^2 + b^2 = c^2
Step 2: 3^2 + 4^2 = c^2 → 9 + 16 = c^2 → 25 = c^2
Step 3: c = √25 = **5 cm**
---
## Section A — Find the Hypotenuse (2 marks each)
1. Legs: 5 cm and 12 cm → Hypotenuse = ____
2. Legs: 8 cm and 6 cm → Hypotenuse = ____
3. Legs: 7 cm and 24 cm → Hypotenuse = ____
---
## Section B — Find a Shorter Side (3 marks each)
4. Hypotenuse = 13 cm, one leg = 5 cm → Other leg = ____
5. Hypotenuse = 17 cm, one leg = 8 cm → Other leg = ____
---
## Section C — Problem Solving (4 marks each)
6. A ladder 10 m long leans against a wall. The base is 6 m from the wall. How high up the wall does the ladder reach?
7. A rectangular field is 40 m long and 30 m wide. What is the length of the diagonal path across the field?`,
    teacherNotes: `Remind students to always identify the hypotenuse first. For SEND: provide a labelled diagram template.`,
    markScheme: `A: 1)13cm 2)10cm 3)25cm | B: 4)12cm 5)15cm | C: 6)8m 7)50m`,
  },
  {
    id: "maths-percentages-y7",
    title: "Percentages — Finding and Calculating (Year 7)",
    subject: "mathematics",
    topic: "Percentages",
    yearGroup: "Year 7",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["percentages", "fractions", "decimals", "KS3"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "40 minutes",
    totalMarks: 28,
    content: `## Learning Objective
Calculate percentages of amounts and express one quantity as a percentage of another.
## Key Facts
- 50% = 1/2 | 25% = 1/4 | 10% = 1/10 | 1% = 1/100
- To find 10%: divide by 10
- To find 1%: divide by 100
## Worked Example
Find 35% of £80
Method: 10% of £80 = £8 → 30% = £24 → 5% = £4 → 35% = £24 + £4 = **£28**
---
## Section A — Key Percentages (1 mark each)
1. 50% of 120 = ____
2. 25% of 80 = ____
3. 10% of 350 = ____
4. 1% of 600 = ____
---
## Section B — Calculate Percentages (2 marks each)
5. 35% of £120
6. 15% of 200 kg
7. 72% of 450 m
8. 8% of £2500
---
## Section C — Real Life Problems (3 marks each)
9. A jacket costs £85. It is reduced by 20% in a sale. What is the sale price?
10. A school has 850 pupils. 54% are girls. How many boys are there?
---
## Challenge ⭐
11. Express 36 out of 48 as a percentage. Show your method.`,
    teacherNotes: `Encourage the build-up method (10% first). For SEND: provide a percentage reference strip.`,
    markScheme: `A: 1)60 2)20 3)35 4)6 | B: 5)£42 6)30kg 7)324m 8)£200 | C: 9)£68 10)391 boys | Challenge: 75%`,
  },
  // ─── ENGLISH ────────────────────────────────────────────────────────────────
  {
    id: "english-descriptive-y9",
    title: "Descriptive Writing — Setting Description (Year 9)",
    subject: "english",
    topic: "Descriptive Writing",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["descriptive writing", "creative writing", "GCSE", "KS4"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "60 minutes",
    totalMarks: 40,
    content: `## Learning Objective
Write a vivid, engaging setting description using a range of literary techniques.
## Key Techniques
**Simile** — comparing using 'like' or 'as' | **Metaphor** — direct comparison | **Personification** — giving human qualities to objects | **Sensory detail** — sight, sound, smell, touch, taste | **Pathetic fallacy** — weather/environment reflecting mood
## Sentence Starters
- The air hung heavy with...
- Shadows crept across...
- A silence so thick you could almost...
- The smell of... drifted on the breeze
- Not a soul stirred as...
---
## Task 1 — Technique Identification (10 marks)
Read the extract below and identify the techniques used:
*"The ancient forest breathed around her, its gnarled fingers of branches reaching towards a sky bruised purple and grey. The wind whispered secrets through the leaves, carrying with it the sharp, cold scent of rain. Every shadow seemed to pulse with hidden life."*

Identify and explain:
1. One example of personification: ____
2. One example of metaphor: ____
3. One example of sensory detail: ____
---
## Task 2 — Descriptive Writing (30 marks)
Write a description of ONE of the following settings:
- A deserted fairground at midnight
- A busy city street at rush hour
- A beach in a storm

You should:
- Write 2-3 paragraphs
- Use at least 4 different literary techniques
- Include sensory details (at least 3 senses)
- Vary your sentence structure

_______________________________________________
_______________________________________________
_______________________________________________`,
    teacherNotes: `Encourage planning before writing. For SEND: provide a sensory detail planning frame and technique checklist.`,
    markScheme: `Task 1: Personification — 'ancient forest breathed', 'gnarled fingers'; Metaphor — 'sky bruised purple'; Sensory — 'sharp cold scent of rain'. Task 2: Mark using AQA descriptive writing criteria.`,
  },
  {
    id: "english-persuasive-y10",
    title: "Persuasive Writing — GCSE Style (Year 10)",
    subject: "english",
    topic: "Persuasive Writing",
    yearGroup: "Year 10",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["persuasive writing", "rhetoric", "GCSE", "KS4", "non-fiction"],
    sendFriendly: true,
    overlayRecommended: "pale-yellow",
    estimatedTime: "60 minutes",
    totalMarks: 40,
    content: `## Learning Objective
Write a persuasive text using a range of rhetorical techniques for a specific audience and purpose.
## DAFOREST Techniques
**D**irect address | **A**necdote | **F**acts & statistics | **O**pinion as fact | **R**hetorical questions | **E**motional language | **S**tatistics | **T**hree (rule of three)
## Structural Devices
- Counter-argument and rebuttal
- Discourse markers (Furthermore, However, Nevertheless)
- Varied sentence lengths for effect
---
## Task 1 — Technique Analysis (10 marks)
Analyse the following extract:
*"Every single day, 8 million pieces of plastic enter our oceans. Every. Single. Day. Are we really willing to stand by and watch our planet drown in our own waste? Our children deserve better. Our planet demands better. And frankly, so do we."*

1. Identify and explain the effect of the statistic used.
2. Identify and explain one rhetorical question.
3. How does the repetition of 'Every. Single. Day.' affect the reader?
---
## Task 2 — Persuasive Writing (30 marks)
Write a persuasive speech to be delivered at a school assembly on ONE of these topics:
- 'Schools should ban mobile phones'
- 'Homework should be abolished'
- 'We must do more to tackle climate change'

Use at least 5 DAFOREST techniques. Aim for 3-4 paragraphs.`,
    teacherNotes: `Remind students to consider audience and purpose throughout. For SEND: provide a DAFOREST planning grid.`,
    markScheme: `Task 1: 1) Statistic creates shock/authority; 2) 'Are we really willing...' — challenges reader, creates guilt; 3) Repetition emphasises urgency, mimics relentlessness of the problem. Task 2: AQA mark scheme.`,
  },
  {
    id: "english-poetry-y8",
    title: "Poetry Analysis — GCSE Techniques (Year 8)",
    subject: "english",
    topic: "Poetry Analysis",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["poetry", "analysis", "GCSE", "KS3", "literature"],
    sendFriendly: true,
    overlayRecommended: "lavender",
    estimatedTime: "50 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Analyse a poem using PETAL structure and identify key poetic techniques.
## PETAL Structure
**P**oint — Make your point | **E**vidence — Quote from the poem | **T**echnique — Name the technique | **A**nalysis — Explain the effect | **L**ink — Connect to theme/context
## Key Poetic Techniques
**Alliteration** | **Assonance** | **Enjambment** | **Caesura** | **Volta** | **Imagery** | **Symbolism** | **Tone** | **Mood** | **Rhythm & Rhyme**
---
## Read the poem:
*"The fog comes*
*on little cat feet.*
*It sits looking*
*over harbour and city*
*on silent haunches*
*and then moves on."*
— Carl Sandburg, 'Fog'
---
## Questions
1. What is the extended metaphor in this poem? (2 marks)
2. What effect does the metaphor create? (3 marks)
3. Identify one example of personification and explain its effect. (3 marks)
4. How does the structure of the poem mirror its meaning? (4 marks)
5. Write a PETAL paragraph about the theme of nature in this poem. (8 marks)`,
    teacherNotes: `Model PETAL structure before students attempt Q5. For SEND: provide a PETAL sentence frame.`,
    markScheme: `1) Fog compared to a cat 2) Makes fog seem quiet, stealthy, mysterious 3) 'sits looking' — gives fog human qualities, creates sense of watchful presence 4) Short, quiet lines mirror the quiet, brief nature of fog 5) Mark using PETAL criteria.`,
  },
  // ─── SCIENCE ────────────────────────────────────────────────────────────────
  {
    id: "science-cells-y7",
    title: "Cells — Structure and Function (Year 7)",
    subject: "science",
    topic: "Cells",
    yearGroup: "Year 7",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["cells", "biology", "KS3", "animal cell", "plant cell"],
    sendFriendly: true,
    overlayRecommended: "mint-green",
    estimatedTime: "45 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Describe the structure and function of animal and plant cells.
## Key Vocabulary
**Cell membrane** | **Cytoplasm** | **Nucleus** | **Cell wall** | **Chloroplast** | **Vacuole** | **Mitochondria** | **Ribosome**
---
## Section A — Label the Diagrams (8 marks)
Label the animal cell and plant cell diagrams provided by your teacher.

**Animal Cell parts:** nucleus, cell membrane, cytoplasm, mitochondria
**Plant Cell extra parts:** cell wall, chloroplast, large vacuole
---
## Section B — True or False? (5 marks)
1. Animal cells have a cell wall. TRUE / FALSE
2. Chloroplasts are found in plant cells. TRUE / FALSE
3. The nucleus controls the cell. TRUE / FALSE
4. Mitochondria release energy. TRUE / FALSE
5. Plant cells do not have a nucleus. TRUE / FALSE
---
## Section C — Short Answer (12 marks)
6. What is the function of the cell membrane? (2 marks)
7. Why do plant cells have chloroplasts but animal cells do not? (3 marks)
8. Name TWO differences between animal and plant cells. (2 marks)
9. What is the function of the mitochondria? (2 marks)
10. Explain why the nucleus is important to the cell. (3 marks)
---
## Challenge ⭐ (5 marks)
11. A student says: "All cells are the same." Do you agree? Use evidence to support your answer.`,
    teacherNotes: `Provide cell diagram worksheets for Section A. For SEND: provide labelled reference cards.`,
    markScheme: `B: 1)F 2)T 3)T 4)T 5)F | C: 6)Controls what enters/leaves 7)Photosynthesis occurs in chloroplasts 8)Any 2 valid differences 9)Releases energy through respiration 10)Contains DNA/controls cell activities | Challenge: Disagree — cells are specialised for different functions`,
  },
  {
    id: "science-forces-y8",
    title: "Forces and Motion (Year 8)",
    subject: "science",
    topic: "Forces",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["forces", "physics", "motion", "KS3", "Newton"],
    sendFriendly: true,
    overlayRecommended: "pale-blue",
    estimatedTime: "50 minutes",
    totalMarks: 35,
    content: `## Learning Objective
Describe and calculate the effects of forces on objects, including balanced and unbalanced forces.
## Key Equations
- Force = Mass × Acceleration (F = ma)
- Weight = Mass × Gravitational field strength (W = mg, g = 10 N/kg on Earth)
- Speed = Distance ÷ Time
## Key Vocabulary
**Force** | **Newton (N)** | **Balanced forces** | **Unbalanced forces** | **Friction** | **Gravity** | **Weight** | **Mass** | **Acceleration** | **Resultant force**
---
## Section A — Forces Knowledge (10 marks)
1. What unit is force measured in? (1 mark)
2. Name TWO contact forces. (2 marks)
3. Name TWO non-contact forces. (2 marks)
4. What is the difference between mass and weight? (3 marks)
5. If forces are balanced, what happens to the object's motion? (2 marks)
---
## Section B — Calculations (15 marks)
6. Calculate the weight of a 5 kg object on Earth. (2 marks)
7. A car of mass 1000 kg accelerates at 3 m/s^2. Calculate the force. (3 marks)
8. A force of 500 N acts on a 50 kg object. Calculate the acceleration. (3 marks)
9. A cyclist travels 120 m in 30 seconds. Calculate their speed. (3 marks)
10. Calculate the mass of an object with weight 350 N on Earth. (4 marks)
---
## Section C — Explain (10 marks)
11. Explain why a skydiver reaches terminal velocity. Include the word 'balanced' in your answer. (5 marks)
12. Draw a free body diagram for a book resting on a table. Label all forces. (5 marks)`,
    teacherNotes: `Remind students to include units in all calculations. For SEND: provide equation triangles for each formula.`,
    markScheme: `A: 1)Newtons 2)friction/normal contact/tension/compression 3)gravity/magnetism/electrostatic | B: 6)50N 7)3000N 8)10m/s^2 9)4m/s 10)35kg | C: 11)Air resistance increases as speed increases until equal to weight, net force=0, constant speed 12)Arrow up (normal force), arrow down (weight), equal lengths`,
  },
  {
    id: "science-chemistry-atoms-y9",
    title: "Atomic Structure and the Periodic Table (Year 9)",
    subject: "science",
    topic: "Atomic Structure",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["atoms", "periodic table", "chemistry", "KS4", "GCSE"],
    sendFriendly: true,
    overlayRecommended: "pale-yellow",
    estimatedTime: "50 minutes",
    totalMarks: 35,
    content: `## Learning Objective
Describe atomic structure and use the periodic table to find information about elements.
## Key Facts
- Atom = protons + neutrons + electrons
- Protons: positive charge, in nucleus
- Neutrons: no charge, in nucleus
- Electrons: negative charge, in shells
- Atomic number = number of protons
- Mass number = protons + neutrons
## Electron Shell Rules
- Shell 1: max 2 electrons
- Shell 2: max 8 electrons
- Shell 3: max 8 electrons
---
## Section A — Atomic Structure (12 marks)
For each element, state the number of protons, neutrons, and electrons:
1. Carbon (C): Atomic number 6, Mass number 12
   - Protons: ___ Neutrons: ___ Electrons: ___
2. Sodium (Na): Atomic number 11, Mass number 23
   - Protons: ___ Neutrons: ___ Electrons: ___
3. Chlorine (Cl): Atomic number 17, Mass number 35
   - Protons: ___ Neutrons: ___ Electrons: ___
---
## Section B — Electron Configuration (9 marks)
Draw the electron configuration for:
4. Lithium (3 electrons)
5. Oxygen (8 electrons)
6. Magnesium (12 electrons)
---
## Section C — Periodic Table (14 marks)
7. What do elements in the same GROUP have in common? (2 marks)
8. What do elements in the same PERIOD have in common? (2 marks)
9. Why are noble gases unreactive? (3 marks)
10. Explain why sodium and potassium have similar properties. (3 marks)
11. What is an isotope? Give an example. (4 marks)`,
    teacherNotes: `Provide periodic table for all sections. For SEND: provide a completed example atom diagram for reference.`,
    markScheme: `A: 1)6,6,6 2)11,12,11 3)17,18,17 | B: 4)2,1 5)2,6 6)2,8,2 | C: 7)Same number of outer electrons/similar properties 8)Same number of electron shells 9)Full outer shell, no need to gain/lose electrons 10)Both in Group 1, same number of outer electrons 11)Same element, different number of neutrons e.g. C-12 and C-14`,
  },
  // ─── HISTORY ────────────────────────────────────────────────────────────────
  {
    id: "history-ww2-y9",
    title: "World War II — Causes and Key Events (Year 9)",
    subject: "history",
    topic: "World War II",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["WW2", "World War 2", "history", "KS3", "KS4"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "55 minutes",
    totalMarks: 40,
    content: `## Learning Objective
Explain the causes of World War II and evaluate the significance of key events.
## Key Dates Timeline
- 1933: Hitler becomes Chancellor of Germany
- 1938: Anschluss — Germany annexes Austria
- 1938: Munich Agreement — Appeasement
- 1939: Germany invades Poland → Britain declares war
- 1940: Dunkirk evacuation
- 1940: Battle of Britain
- 1941: USA enters war (Pearl Harbor)
- 1944: D-Day landings
- 1945: Germany surrenders (VE Day, May 8)
- 1945: Japan surrenders (VJ Day, August 15)
---
## Section A — Knowledge Questions (15 marks)
1. Name THREE causes of World War II. (3 marks)
2. What was the policy of Appeasement? Why did Britain adopt it? (4 marks)
3. What happened at Dunkirk in 1940? (3 marks)
4. Why was the Battle of Britain significant? (3 marks)
5. What event brought the USA into the war? (2 marks)
---
## Section B — Source Analysis (10 marks)
Study the source below:
*"We should seek by all means in our power to avoid war, by analysing possible causes, by trying to remove them, by discussion in a spirit of collaboration and good will."* — Neville Chamberlain, 1938

6. What is Chamberlain's view on how to avoid war? (2 marks)
7. What policy does this source support? (2 marks)
8. Why might historians question the reliability of this source? (3 marks)
9. How useful is this source for understanding British foreign policy in 1938? (3 marks)
---
## Section C — Extended Writing (15 marks)
10. 'The Treaty of Versailles was the main cause of World War II.' How far do you agree? Use evidence to support your answer.`,
    teacherNotes: `Provide a copy of the Treaty of Versailles terms for Section C. For SEND: provide a cause/consequence planning frame.`,
    markScheme: `A: 1)Treaty of Versailles/Rise of Hitler/Appeasement/German expansion 2)Policy of making concessions to avoid war; Britain feared another war 3)British troops evacuated from beaches of Dunkirk by civilian and military boats 4)Prevented German invasion of Britain 5)Japanese attack on Pearl Harbor | B: 6)Through discussion and removing causes 7)Appeasement 8)Political speech, biased, self-justifying 9)Useful for understanding Chamberlain's thinking but limited as propaganda`,
  },
  {
    id: "history-civil-rights-y10",
    title: "The American Civil Rights Movement (Year 10)",
    subject: "history",
    topic: "Civil Rights",
    yearGroup: "Year 10",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["civil rights", "MLK", "America", "history", "KS4", "GCSE"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "60 minutes",
    totalMarks: 40,
    content: `## Learning Objective
Analyse the methods and significance of the American Civil Rights Movement 1955-1968.
## Key Events
- 1955: Montgomery Bus Boycott
- 1957: Little Rock Nine
- 1960: Greensboro Sit-ins
- 1963: March on Washington ('I Have a Dream')
- 1964: Civil Rights Act
- 1965: Voting Rights Act
- 1968: Assassination of Martin Luther King Jr.
## Key Figures
Martin Luther King Jr. | Rosa Parks | Malcolm X | Thurgood Marshall | John Lewis
---
## Section A — Knowledge (15 marks)
1. What was the significance of the Montgomery Bus Boycott? (3 marks)
2. Describe the methods used by civil rights protesters. (4 marks)
3. What did the Civil Rights Act of 1964 achieve? (3 marks)
4. How did Martin Luther King's approach differ from Malcolm X's? (5 marks)
---
## Section B — Source Analysis (10 marks)
Study the source:
*"I have a dream that my four little children will one day live in a nation where they will not be judged by the colour of their skin but by the content of their character."* — MLK, 1963

5. What is King's vision in this speech? (2 marks)
6. What methods does this speech represent? (2 marks)
7. How significant was this speech for the Civil Rights Movement? (6 marks)
---
## Section C — Essay (15 marks)
8. 'Non-violent protest was the most effective method used by civil rights campaigners.' How far do you agree?`,
    teacherNotes: `Provide context cards for each key event. For SEND: provide a structured essay frame with topic sentences.`,
    markScheme: `Full mark scheme available on teacher resource portal.`,
  },
  // ─── GEOGRAPHY ──────────────────────────────────────────────────────────────
  {
    id: "geography-rivers-y8",
    title: "Rivers — Processes and Landforms (Year 8)",
    subject: "geography",
    topic: "Rivers",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["rivers", "geography", "erosion", "deposition", "KS3"],
    sendFriendly: true,
    overlayRecommended: "pale-blue",
    estimatedTime: "50 minutes",
    totalMarks: 35,
    content: `## Learning Objective
Describe and explain the processes of erosion, transportation, and deposition in rivers.
## Key Processes
**Erosion:** Hydraulic action | Abrasion | Attrition | Solution
**Transportation:** Traction | Saltation | Suspension | Solution
**Deposition:** When velocity decreases, sediment is deposited
## Key Vocabulary
**Meander** | **Oxbow lake** | **Waterfall** | **V-shaped valley** | **Floodplain** | **Delta** | **Tributary** | **Watershed**
---
## Section A — Processes (12 marks)
1. Explain the process of hydraulic action. (2 marks)
2. What is the difference between abrasion and attrition? (4 marks)
3. Describe the four methods of river transportation. (4 marks)
4. When does deposition occur? (2 marks)
---
## Section B — Landforms (15 marks)
5. Explain how a waterfall forms. Include a labelled diagram. (5 marks)
6. Describe the formation of a meander. (4 marks)
7. Explain how an oxbow lake forms from a meander. (4 marks)
8. What is a floodplain and how does it form? (2 marks)
---
## Section C — Case Study (8 marks)
9. Using a named example, explain the causes and effects of a river flood. Include:
- Location and date
- Causes (physical and human)
- Effects (social, economic, environmental)
- Management strategies`,
    teacherNotes: `Provide blank river cross-section diagrams for Section B. For SEND: provide a labelled diagram of river processes.`,
    markScheme: `A: 1)Water pressure forces into cracks, weakening rock 2)Abrasion=rock scraping bed/banks; Attrition=rocks collide and break down 3)Traction=rolling, Saltation=bouncing, Suspension=carried in water, Solution=dissolved 4)When velocity/energy decreases | B: 5)Resistant cap rock over softer rock, undercutting, overhang collapses, plunge pool forms 6)Lateral erosion on outer bend, deposition on inner bend 7)Meander neck narrows, river cuts through during flood, meander cut off 8)Flat land beside river, built up from flood deposits`,
  },
  {
    id: "geography-climate-change-y10",
    title: "Climate Change — Causes, Effects and Responses (Year 10)",
    subject: "geography",
    topic: "Climate Change",
    yearGroup: "Year 10",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["climate change", "geography", "global warming", "KS4", "GCSE"],
    sendFriendly: true,
    overlayRecommended: "mint-green",
    estimatedTime: "55 minutes",
    totalMarks: 40,
    content: `## Learning Objective
Explain the causes and effects of climate change and evaluate responses at different scales.
## The Greenhouse Effect
1. Sun's radiation reaches Earth
2. Earth absorbs radiation and re-emits as heat
3. Greenhouse gases (CO2, methane, water vapour) trap heat
4. Enhanced greenhouse effect = global warming
## Key Greenhouse Gases
**Carbon dioxide (CO2)** — burning fossil fuels | **Methane (CH4)** — livestock, rice paddies | **Nitrous oxide (N2O)** — fertilisers | **Water vapour**
---
## Section A — Causes (12 marks)
1. Explain the natural greenhouse effect. (3 marks)
2. How have human activities enhanced the greenhouse effect? (4 marks)
3. Give THREE pieces of evidence that climate change is occurring. (3 marks)
4. What is the difference between climate change and global warming? (2 marks)
---
## Section B — Effects (13 marks)
5. Describe THREE effects of climate change on the natural environment. (6 marks)
6. Explain how climate change affects people in developing countries differently from developed countries. (4 marks)
7. What is sea level rise and what causes it? (3 marks)
---
## Section C — Responses (15 marks)
8. Explain the difference between mitigation and adaptation strategies. (4 marks)
9. Evaluate the effectiveness of international agreements (e.g. Paris Agreement) in tackling climate change. (6 marks)
10. 'Individual actions are more important than government policies in tackling climate change.' Do you agree? (5 marks)`,
    teacherNotes: `Provide climate data graphs for Section A. For SEND: provide a cause-effect-response planning frame.`,
    markScheme: `Full mark scheme available on teacher resource portal.`,
  },
  // ─── RELIGIOUS EDUCATION ────────────────────────────────────────────────────
  {
    id: "re-religion-ethics-y9",
    title: "Religion and Ethics — Capital Punishment (Year 9)",
    subject: "re",
    topic: "Ethics",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["RE", "ethics", "capital punishment", "religion", "KS4"],
    sendFriendly: true,
    overlayRecommended: "cream",
    estimatedTime: "50 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Evaluate different religious and ethical perspectives on capital punishment.
## Key Terms
**Capital punishment** — the death penalty | **Sanctity of life** — life is sacred/God-given | **Retribution** — punishment that is proportional to the crime | **Deterrence** — punishment that prevents future crime | **Rehabilitation** — reforming criminals
## Religious Views
**Christianity:** Many Christians oppose capital punishment — 'Thou shalt not kill' (Exodus 20:13). Some argue for it — 'an eye for an eye' (Leviticus 24:20)
**Islam:** Sharia law permits capital punishment for certain crimes (hudud). However, forgiveness is encouraged.
**Buddhism:** Ahimsa (non-violence) — most Buddhists oppose capital punishment.
---
## Section A — Knowledge (10 marks)
1. Define capital punishment. (1 mark)
2. What does 'sanctity of life' mean? (2 marks)
3. Give ONE religious argument FOR capital punishment. (2 marks)
4. Give ONE religious argument AGAINST capital punishment. (2 marks)
5. What is the difference between retribution and rehabilitation? (3 marks)
---
## Section B — Source Analysis (8 marks)
6. 'Whoever sheds human blood, by humans shall their blood be shed.' (Genesis 9:6)
   a) What does this quote suggest about capital punishment? (2 marks)
   b) How might a Christian use this quote to justify capital punishment? (3 marks)
   c) How might another Christian disagree with using this quote? (3 marks)
---
## Section C — Extended Writing (12 marks)
7. 'Capital punishment is never justified.' Evaluate this statement from at least TWO religious perspectives. Include your own view with reasons.`,
    teacherNotes: `Encourage students to consider multiple perspectives. For SEND: provide a structured argument frame with sentence starters.`,
    markScheme: `Full mark scheme available on teacher resource portal.`,
  },
  // ─── PSHE ────────────────────────────────────────────────────────────────────
  {
    id: "pshe-mental-health-y8",
    title: "Mental Health and Wellbeing (Year 8)",
    subject: "pshe",
    topic: "Mental Health",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["PSHE", "mental health", "wellbeing", "KS3"],
    sendFriendly: true,
    overlayRecommended: "lavender",
    estimatedTime: "45 minutes",
    totalMarks: 20,
    content: `## Learning Objective
Understand what mental health is, recognise signs of poor mental health, and know where to get help.
## Key Facts
- 1 in 4 people experience a mental health problem each year
- Mental health is just as important as physical health
- Mental health exists on a spectrum — everyone has mental health
- Common conditions: anxiety, depression, OCD, eating disorders, PTSD
## The Five Ways to Wellbeing
1. **Connect** — build relationships with others
2. **Be Active** — exercise regularly
3. **Take Notice** — be mindful and present
4. **Keep Learning** — try new things
5. **Give** — do something for others
---
## Activity 1 — Discussion Questions (5 marks)
1. What is the difference between feeling sad and having depression?
2. Why do people sometimes not seek help for mental health problems?
3. How can you support a friend who is struggling?
---
## Activity 2 — Scenario Cards (10 marks)
For each scenario, suggest:
a) What the person might be feeling
b) What they could do to help themselves
c) Who they could talk to

Scenario 1: Jamie has been feeling very anxious about school for 3 weeks and can't sleep.
Scenario 2: Priya has stopped enjoying activities she used to love and feels empty inside.
---
## Activity 3 — Reflection (5 marks)
Create a personal wellbeing plan. Include:
- One thing you will do this week for each of the Five Ways to Wellbeing
- One person you could talk to if you were struggling`,
    teacherNotes: `Create a safe space for discussion. Have pastoral support information available. For SEND: provide visual emotion cards.`,
    markScheme: `Formative assessment — focus on engagement and understanding rather than right/wrong answers.`,
  },
  // ─── COMPUTING ──────────────────────────────────────────────────────────────
  {
    id: "computing-networks-y9",
    title: "Computer Networks — Types and Protocols (Year 9)",
    subject: "computing",
    topic: "Networks",
    yearGroup: "Year 9",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["networks", "computing", "protocols", "KS3", "KS4"],
    sendFriendly: true,
    overlayRecommended: "pale-blue",
    estimatedTime: "50 minutes",
    totalMarks: 35,
    content: `## Learning Objective
Describe types of computer networks, network topologies, and communication protocols.
## Key Vocabulary
**LAN** (Local Area Network) | **WAN** (Wide Area Network) | **Router** | **Switch** | **Protocol** | **IP address** | **DNS** | **HTTP/HTTPS** | **Bandwidth** | **Latency**
## Network Topologies
**Star** — all devices connect to central switch (most common)
**Bus** — all devices on single cable
**Ring** — devices connected in a loop
**Mesh** — every device connects to every other device
---
## Section A — Network Types (10 marks)
1. What is the difference between a LAN and a WAN? (3 marks)
2. Give TWO advantages of a star topology. (2 marks)
3. What is the role of a router? (2 marks)
4. What does DNS stand for and what does it do? (3 marks)
---
## Section B — Protocols (12 marks)
5. What is a protocol? Why are protocols important? (3 marks)
6. Explain the difference between HTTP and HTTPS. (3 marks)
7. Describe the role of TCP/IP in data transmission. (3 marks)
8. What is an IP address? Give an example. (3 marks)
---
## Section C — Network Security (13 marks)
9. Describe THREE threats to network security. (6 marks)
10. Explain how encryption protects data on a network. (3 marks)
11. A school wants to improve its network security. Suggest and justify THREE measures they should take. (4 marks)`,
    teacherNotes: `Use network diagram cards to support topology questions. For SEND: provide a network vocabulary reference card.`,
    markScheme: `A: 1)LAN=small area/single building; WAN=large geographical area 2)Easy to add devices, failure of one device doesn't affect others 3)Directs data packets between networks 4)Domain Name System — translates domain names to IP addresses | B: 5)Set of rules for communication; ensures devices can communicate 6)HTTP=unencrypted; HTTPS=encrypted/secure 7)Breaks data into packets, ensures reliable delivery 8)Unique numerical address e.g. 192.168.1.1`,
  },
  // ─── PHYSICAL EDUCATION ─────────────────────────────────────────────────────
  {
    id: "pe-fitness-components-y8",
    title: "Components of Fitness (Year 8)",
    subject: "pe",
    topic: "Fitness",
    yearGroup: "Year 8",
    difficulty: "mixed",
    source: "TES Style",
    tags: ["PE", "fitness", "health", "KS3", "components"],
    sendFriendly: true,
    overlayRecommended: "mint-green",
    estimatedTime: "40 minutes",
    totalMarks: 30,
    content: `## Learning Objective
Identify and describe the components of fitness and explain their importance for different sports.
## Health-Related Components
**Cardiovascular endurance** — heart/lungs working efficiently over time
**Muscular strength** — maximum force a muscle can exert
**Muscular endurance** — muscle working repeatedly over time
**Flexibility** — range of movement at a joint
**Body composition** — ratio of fat to lean tissue
## Skill-Related Components
**Speed** | **Power** | **Agility** | **Balance** | **Coordination** | **Reaction time**
---
## Section A — Definitions (10 marks)
Match each component to its definition:
1. Cardiovascular endurance
2. Flexibility
3. Agility
4. Reaction time
5. Power

Definitions:
a) The ability to change direction quickly
b) The time taken to respond to a stimulus
c) The ability of the heart and lungs to supply oxygen during exercise
d) The combination of strength and speed
e) The range of movement at a joint
---
## Section B — Sport Application (12 marks)
For each sport, name the TWO most important fitness components and explain why:
6. Marathon running
7. 100m sprint
8. Gymnastics
9. Football
---
## Section C — Fitness Testing (8 marks)
10. Name a fitness test for cardiovascular endurance and describe how it is performed. (4 marks)
11. Why is it important to test fitness before designing a training programme? (4 marks)`,
    teacherNotes: `Use sport images to support Section B. For SEND: provide a fitness components reference card with images.`,
    markScheme: `A: 1c 2e 3a 4b 5d | B: Accept valid answers with clear justification | C: 10)Cooper 12-min run/bleep test — describe procedure 11)To identify strengths/weaknesses, set baseline, measure progress`,
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
