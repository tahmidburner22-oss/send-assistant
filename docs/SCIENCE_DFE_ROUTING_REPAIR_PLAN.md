# Science DfE Routing Repair Plan

**Prepared:** 26 August 2026  
**Scope:** Year 10–11 general Science worksheet selection and rendering.  
**Invariant:** No change may alter protected Maths Gold geometry. Dedicated Science output remains one A4 landscape page with its existing print/export contract.

## Defects to correct

| Defect | Root cause | Repair |
|---|---|---|
| General Science reaches the diagram taxonomy before the DfE catalogue. | `usesScienceImageTaxonomy` is true for `Science` at GCSE, and `usesGcseTopicCatalogue` explicitly excludes taxonomy mode. | Make the DfE catalogue authoritative for **Science, Years 10–11**. Keep the taxonomy only as a visual-asset reference for non-catalogue science subjects/stages. |
| GCSE Science can show topics before an explicit tier choice. | The taxonomy flow has no Foundation/Higher gate. | Reuse the existing catalogue tier gate: topics are unavailable until Foundation or Higher is selected. |
| Fuzzy keyword routing maps a selected DfE objective to an unrelated dedicated worksheet. | `canRenderScienceLandscape` matches words such as `atomic` or `model`, independent of selected catalogue identity. | Add a strict DfE route resolver. GCSE catalogue selections may use a dedicated layout only when an exact mapping exists; all other choices use the curriculum-constrained generic route. |
| Atomic structure topic produces a historical-model timeline despite an objective about the nuclear atom. | The generic atomic keyword maps to `timeline`. | Add an explicit `atomic-structure` dedicated one-page layout: positive nucleus, electrons, isotope comparison, and questions directly aligned to the selected DfE objective. |
| A later refactor could reintroduce a mismatch. | Tests only exercise keyword matches. | Add tests for catalogue-first selection, exact route resolution, atomic objective/layout alignment, LO presence, and generic fallback for unmapped individual targets. |

## Implementation steps

1. Add `scienceGcseRouting.ts`. Its resolver accepts a selected DfE Science catalogue entry and returns either the exact dedicated layout or `generic`. It contains no fuzzy matching.
2. Change `Worksheets.tsx` so **Year 10–11 + Science** uses `GCSE_TOPIC_CATALOGUE`, the existing Foundation/Higher tier gate, and the exact selected objective. The separate image taxonomy remains available for non-GCSE science stages and distinct Biology/Chemistry/Physics selectors.
3. Change dedicated Science routing so a selected GCSE topic uses the resolver result. An unmapped DfE target bypasses the dedicated renderer and reaches the generic, exact-LO constrained route; it never inherits an approximately matching layout.
4. Extend the Science renderer with a named `atomic-structure` one-page landscape. The new page does not change page dimensions, margins, print rules, exporter behaviour, or Maths code.
5. Strengthen the generic Science prompt for unmapped DfE targets: state the exact LO, require each visual to teach that LO, and prohibit decorative or loosely related diagrams.
6. Add regression tests, run type checks, protected Maths Gold wiring checks and Science renderer tests, then deploy to `main`, wait for deployment and verify the live selector and downloadable PDF.

## Intended routing contract

| Selected Year 10/11 Science catalogue target | Route | Objective/layout guarantee |
|---|---|---|
| `Atomic structure and isotopes` | Dedicated `atomic-structure` page | Nuclear atom/isotope model and questions directly support the selected LO. |
| Any future exact dedicated mapping | Named dedicated page | Mapping is reviewed, explicit and tested. |
| Any other individual DfE catalogue target | Curriculum-constrained generic worksheet | The exact selected LO is mandatory; no fuzzy dedicated layout may be substituted. |

The distinction is intentional: **catalogue coverage does not imply an approved fixed template exists for every target**. The generic route preserves access to all DfE targets while the product develops and curriculum-reviews more dedicated one-page Science templates.
