# Worksheet Generator “Perfect Flow” Implementation Guide

This is the exact implementation pattern for the behavior you described.

## 1) Non-negotiable rules (from your requirements)

1. If worksheet exists in library, always load it first.
2. SEND and reading-age changes must **not** alter structure or diagram layout.
3. Retrieval section is dynamic and inserted under LO (based on teacher-entered retrieval topic).
4. Extra feature transforms (e.g. bilingual vocabulary EN+RO) must apply consistently.
5. All tiers must exist in library: foundation, mixed, higher, scaffolded.
6. Differentiate panel should offer all tiers except the currently loaded one.
7. Selecting a different tier should pull that tier from library and re-apply active transforms.
8. If worksheet is not in library: generate same schema/structure template; include diagram questions only if diagram exists for that topic.

---

## 2) Core architecture: immutable base + composable transforms

Use this pipeline order for every request:

1. **Source selection**
   - Try library exact match by `(subject, topic, year_group, tier)`.
   - If found: source = `library_base`.
   - Else: source = `generated_base` (same canonical schema).

2. **Diagram eligibility gate (before section rendering)**
   - Determine `hasTopicDiagram` from topic->diagram map.
   - If false, forbid diagram section families (`label_diagram`, `diagram_subquestions`, etc.).

3. **Transform stack (always same order)**
   1) reading-age transform (text only)
   2) SEND transform (text/scaffold only)
   3) retrieval inject (insert section directly below LO)
   4) feature transforms (e.g. bilingual keywords)

4. **Final validation**
   - Structural hash unchanged from base (except allowed insertions like retrieval).
   - Asset refs unchanged for existing diagram sections.
   - Quality score gate.

---

## 3) Data model you should use

## Existing
- `worksheet_library` (base content)
- `worksheet_library_assets` (stable asset refs)
- `worksheet_library_variants` (SEND variants)

## Add / extend
1. `worksheet_library_tiers`
   - `id`, `topic_key`, `subject`, `year_group`, `tier` (`foundation|mixed|higher|scaffolded`), `base_entry_id`
   - unique `(subject, topic_key, year_group, tier)`

2. `worksheet_transform_presets`
   - stores deterministic transform settings used in one-click flows
   - fields: `id`, `worksheet_id`, `reading_age`, `send_need`, `retrieval_topic`, `feature_flags` (json)

3. `topic_diagram_map`
   - `topic_key`, `diagram_id`, `subject`, `confidence`
   - ensure exact/keyword fallback mapping exists.

---

## 4) API contract you need

## Resolve base/tier
`GET /api/library/resolve?subject=&topic=&yearGroup=&tier=&sendNeed=&readingAge=&retrievalTopic=&features=`

Server behavior:
- load tiered base from library if exists
- else create generated base with canonical schema
- apply transform stack in order
- return `worksheet + metadata + availableTiers + appliedTransforms`

## Differentiate options
`GET /api/library/tiers?subject=&topic=&yearGroup=&currentTier=`
- returns tiers except current tier
- e.g. current `foundation` -> `[mixed, higher, scaffolded]`

## Tier switch preserving transforms
`POST /api/library/switch-tier`
Body:
```json
{
  "subject":"Maths",
  "topic":"Fractions",
  "yearGroup":"Year 8",
  "targetTier":"higher",
  "transforms": {
    "sendNeed":"dyslexia",
    "readingAge":9,
    "retrievalTopic":"Equivalent fractions",
    "features":{"bilingualKeywords":{"enabled":true,"lang":"ro"}}
  }
}
```
- server loads requested tier base
- reapplies transforms
- returns equivalent worksheet in new tier

---

## 5) How to keep structure/diagrams unchanged

Represent worksheet as:
- `structure`: immutable section skeleton (`sectionId`, `type`, `assetRefs`, marks)
- `content`: mutable text payload

For transforms:
- allowed fields: `content`, `hints`, `wordBank`, `scaffold`
- forbidden fields: `sectionId`, `type`, `assetRefs`, `marks`, diagram coordinates

Add server guard:
- compute `structureFingerprint` before transform and after transform
- if changed (except retrieval insertion), reject and regenerate text-only.

---

## 6) Retrieval insertion rule

Rule:
- Find LO section index (`type in ['learning-objective','objectives','lo']`)
- Insert retrieval section immediately after LO
- Retrieval section generated from teacher topic, not library topic
- Retrieval section has deterministic section ID e.g. `retrieval_dynamic`

This gives consistent placement in every tier and every transform state.

---

## 7) Bilingual keyword feature (EN + Romanian)

For `key_vocab`:
- preserve canonical English terms from base worksheet
- enrich with `translations.ro`
- schema example:
```json
{
  "term":"equivalent fraction",
  "definition_en":"fractions with the same value",
  "definition_ro":"fracții echivalente au aceeași valoare"
}
```

Never overwrite English fields; add translated fields alongside.

---

## 8) Non-library generation behavior (must mirror library structure)

When no library entry exists:
1. Select canonical template by subject/phase/tier.
2. Build sections using same schema as library entries.
3. Check topic-diagram map:
   - if diagram exists -> enable diagram section types
   - if no diagram exists -> remove diagram section types and replace with non-diagram question families
4. Save generated base into library for future cache hits.

This ensures generated worksheets feel like library quality, not random shape.

---

## 9) Frontend behavior to match your UX

1. Generate button uses `/api/library/resolve` first always.
2. Keep active transform state in UI store:
   - `sendNeed`, `readingAge`, `retrievalTopic`, `featureFlags`
3. Differentiate button calls `/api/library/tiers` and displays all non-selected tiers.
4. Clicking a tier calls `/api/library/switch-tier` with current transform state.

---

## 10) Practical implementation sequence

1. Add `topic_diagram_map` + tier mapping table.
2. Implement strict transform guards (`structureFingerprint`).
3. Implement `/api/library/tiers` + `/api/library/switch-tier`.
4. Add retrieval insertion service.
5. Add bilingual keyword transformer.
6. Wire frontend differentiate panel to tier APIs.
7. Add regression tests:
   - structure unchanged after SEND/reading transforms
   - diagram sections removed when topic has no diagram
   - retrieval always inserted under LO
   - tier switch preserves transform state.

---

## Acceptance criteria checklist

- [ ] Library hit always used when available.
- [ ] SEND/read-age never alters section topology or diagram assets.
- [ ] Retrieval always inserted directly below LO.
- [ ] Bilingual keywords preserved EN + RO.
- [ ] Differentiate offers all non-current tiers.
- [ ] Tier switch preserves transforms.
- [ ] No diagram question appears when no mapped diagram exists.
- [ ] Non-library generation uses library schema and can be backfilled into library.
