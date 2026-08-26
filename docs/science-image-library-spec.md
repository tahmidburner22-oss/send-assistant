# Science Image Library Specification

## Purpose and scope

The first production library is **Science, Reception excluded, KS1 through GCSE**. It supplies a pair of intentional, topic-specific visual assets for every taxonomy record: **Diagram A** is the authoritative reference or stimulus; **Diagram B** is a complementary application, apparatus, comparison, process, data or partial-labelling representation. GCSE records also define a **revision map** asset. The worksheet generator must select an asset only when its stage, discipline, canonical topic and subtopic metadata pass a strict match. It must otherwise return no asset rather than a plausible but irrelevant diagram.

The scope follows the statutory England science programme for KS1–KS3 and uses AQA GCSE Combined Science: Trilogy 8464 as the detailed KS4 reference model. The taxonomy is deliberately board-aware rather than board-locked: assets are marked with an AQA specification reference while teaching concepts and selection terms remain usable across common GCSE specifications. The DfE describes KS3 as deepening disciplinary understanding through biology, chemistry and physics, including modelling and abstract ideas, while the AQA specification separates subject content into biology, chemistry and physics and includes 21 required practical activities.[1][2]

| Phase | Curriculum authority | Visual purpose | Asset family |
|---|---|---|---|
| KS1 | DfE Years 1–2 programmes | Observe, name, sort, talk and label concrete phenomena | Friendly focal object, restrained labels, accessible colour coding |
| KS2 | DfE Years 3–6 programmes | Explain simple relationships, investigations and sequences | Playful but scientifically faithful explanatory visual |
| KS3 | DfE subject-disciplinary programme | Build correct scientific models, notation and laboratory habits | Technical reference, apparatus/data/process companion |
| GCSE | AQA 8464 common-core specification | Support exam language, required practicals, equations and formal representations | Examination-style reference, application/practical/data companion and revision map |

## Taxonomy contract

The authoritative source is `shared/scienceImageTaxonomy.ts`. It enumerates records by **stage, year group, discipline, topic, subtopic, aliases, learning focus, profile, specification references and required-practical status**. A record creates two prompt briefs and, for GCSE, a revision-map brief. The generator searches this taxonomy rather than performing an unbounded keyword match.

> **Selection invariant:** a science visual may only be served if `stage + discipline family + topic canonical key + subtopic canonical key` are compatible. Generic subject-level fallbacks are prohibited.

| Metadata field | Purpose | Selection use |
|---|---|---|
| `stage`, `yearGroups` | Distinguishes KS1/2/3 and GCSE teaching expectations | Hard gate and visual-profile choice |
| `discipline` | Primary science, biology, chemistry, physics or working scientifically | Hard family gate |
| `topic`, `subtopic`, `aliases` | Represents a teachable curricular unit and accepted wording | Canonical-key lookup and ranking |
| `learningFocus` | Defines what the visual must teach, not merely depict | Prompt and human-review brief |
| `specificationRefs` | Pins KS3/GCSE precision to the curriculum source | Quality-review traceability |
| `requiredPractical` | Identifies an assessed apparatus/method context | Enables practical-specific Diagram B and revision map |
| `visualProfile` | Controls complexity, notation, density and style | GPT Image 2 prompt construction |
| `diagramA`, `diagramB`, `revisionMap` | Distinct visual jobs for the same subtopic | Slot-specific generation and selection |

## Visual-profile standards

Primary diagrams must remain scientifically true while visibly reducing cognitive load. Use a single focal subject, familiar real-world context, short labels, generous whitespace, clear semantic colour, and only the elements pupils need for the learning objective. Do not use cartoon effects that alter anatomy, particle behaviour, physical causality or classification. The DfE states that KS1 science should centre on experience and observation of phenomena and use simple scientific language; this is the controlling pedagogic standard.[1]

KS3 and GCSE diagrams must prioritise scientific convention over decoration. They use correct scale relationships when scale is meaningful, standard units, conventional circuit symbols, accurate ray arrows, chemical formulae and charges, appropriate graph axes and variables, valid apparatus geometry, and unambiguous cause-and-effect relationships. Diagrams must not fabricate or simplify away specification-critical features such as electron transfer, ion charge, energy transfer pathway, variable control, field direction, or required-practical apparatus.

| Profile | Prompt direction | Prohibited shortcuts |
|---|---|---|
| `primary-playful` | Clear, cheerful but low-text scientific learning visual; one concept per image; friendly objects only where the object remains anatomically/physically correct | Decorative clutter, mascot-led explanations, misleading relative sizes, dense prose, unsafe practical scenes |
| `ks3-technical` | Precise classroom diagram with limited labels, conventional arrows/units/symbols and a companion representation suited to enquiry or application | Casual icons replacing apparatus, ambiguous arrows, mathematically unlabelled graphs, invalid particles/formulae |
| `gcse-exam` | Examination-quality scientific reference with only the labels, notation, equations, variables and apparatus needed to support the stated specification point | Non-standard circuit symbols, invalid formulae, incorrect reaction products, false mechanisms, missing units, decorative infographics masquerading as data |

## GPT Image 2 exclusivity and safety

Every new visual image in this library must be generated by **GPT Image 2 only**. No freeform SVG, stock imagery, web search imagery, generic chat-model graphics, copied exam-board diagrams or non-GPT Image 2 image models are permitted. Existing entries that lack a provenance record confirming `generator_model: gpt-image-2` are legacy assets and cannot be labelled as part of this new validated science collection.

Each GPT Image 2 generation prompt must include the taxonomy learning focus and required visual constraints. It must also explicitly ask for no invented explanatory text beyond a small specified label set; after generation, a validator and human review determine whether the image can be published. Diagrams that need exact equations, scale values, graph points or lengthy text must be generated with minimal labels and rejected if the result cannot faithfully represent the specified facts. The workflow never tries to repair a generated diagram by programmatically overlaying scientific labels.

## Quality gates

| Gate | Applies to | Publish condition |
|---|---|---|
| Curriculum fit | All | Topic/subtopic and learning focus exactly match a taxonomy record |
| Model provenance | All new assets | `generator_model = gpt-image-2` and immutable prompt version present |
| Stage fit | All | Visual profile matches the stage; no GCSE notation in KS1 and no childlike simplification of GCSE content |
| Scientific convention | KS3/GCSE | Symbols, notation, units, arrows, quantities, formulae, structures and apparatus pass a deterministic review checklist |
| Required-practical validity | GCSE practical records | Apparatus, independent/dependent/control variables, safety and data representation fit the named practical |
| Pair complementarity | All | Diagram B teaches a genuinely different representation or activity from Diagram A |
| Accessibility | All | Text has high contrast, no learning depends on colour alone, visible labels are concise and a concise alt description exists |
| Selection safety | All | Strict stage/discipline/topic/subtopic match; otherwise fail closed |

## Production batches

The first batch is organised by stage and discipline rather than by a broad list of unrelated concepts. This allows specialist validation and fast correction of systematic errors. The taxonomy produces a comprehensive prompt manifest for all science records before any asset is stored. Batches are then generated, reviewed and imported in the order below.

| Batch | Coverage | Review emphasis |
|---|---|---|
| 1 | KS1–KS2 primary science | Concept clarity, child-accessible language, correct concrete representation |
| 2 | KS3 biology, chemistry and physics | Accurate scientific models, symbols, units and laboratory conventions |
| 3 | GCSE biology including required practicals | Cells, systems, processes, genetics, ecology, apparatus and data |
| 4 | GCSE chemistry including required practicals | Structure, formulae, charges, equations, apparatus and safety |
| 5 | GCSE physics including required practicals | Circuit/ray/field/vector conventions, units, graph axes and uncertainty |
| 6 | GCSE working scientifically and revision maps | Variables, errors, apparatus, data handling and cross-topic retrieval links |

## References

[1] [Department for Education, *National curriculum in England: science programmes of study*](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study)

[2] [AQA, *GCSE Combined Science: Trilogy (8464) specification*](https://www.aqa.org.uk/subjects/science/gcse/science-8464/specification)

[3] [AQA, *Biology subject content*](https://www.aqa.org.uk/subjects/science/gcse/science-8464/specification/biology-subject-content)

[4] [AQA, *Chemistry subject content*](https://www.aqa.org.uk/subjects/science/gcse/science-8464/specification/chemistry-subject-content)

[5] [AQA, *Physics subject content*](https://www.aqa.org.uk/subjects/science/gcse/science-8464/specification/physics-subject-content)
