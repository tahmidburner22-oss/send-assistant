/**
 * Physical Education — primary diagram catalogue.
 * Target: ~50 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Sports equipment — 14
  emitTitled(ctx, {
    subject: "Physical education",
    topic: "Sports equipment",
    year_group: "Year 3",
    description: "Equipment card showing the item and the sport it belongs to.",
    style_notes: "Single object, clean drop shadow, sport tag",
    tags: ["PE", "equipment"],
  }, [
    "Equipment — football",
    "Equipment — netball",
    "Equipment — basketball",
    "Equipment — cricket bat and ball",
    "Equipment — rugby ball",
    "Equipment — hockey stick and ball",
    "Equipment — tennis racket and ball",
    "Equipment — badminton racket and shuttlecock",
    "Equipment — gymnastics mat",
    "Equipment — skipping rope",
    "Equipment — bean bag",
    "Equipment — cone",
    "Equipment — relay baton",
    "Equipment — swim cap and goggles",
  ]);

  // Pitch / court diagrams — 8
  emitTitled(ctx, {
    subject: "Physical education",
    topic: "Pitches and courts",
    year_group: "Year 4",
    description: "Aerial-view sports pitch / court with key zones labelled.",
    style_notes: "Top-down vector, dashed lines, zone names",
    tags: ["PE", "pitch", "court"],
  }, [
    "Pitch — football",
    "Pitch — rugby",
    "Pitch — cricket (oval)",
    "Court — netball",
    "Court — basketball",
    "Court — tennis",
    "Court — badminton",
    "Track — 400m athletics",
  ]);

  // Gymnastics shapes — 8
  emitTitled(ctx, {
    subject: "Physical education",
    topic: "Gymnastics",
    year_group: "Year 3",
    description: "Gymnastics body-shape card.",
    style_notes: "Cartoon child silhouette in shape, clear silhouette",
    tags: ["PE", "gymnastics"],
  }, [
    "Gym shape — tuck",
    "Gym shape — straddle",
    "Gym shape — pike",
    "Gym shape — straight (pencil)",
    "Gym shape — star",
    "Gym balance — front support",
    "Gym balance — arabesque",
    "Gym balance — bridge",
  ]);

  // Dance positions — 4
  emitTitled(ctx, {
    subject: "Physical education",
    topic: "Dance",
    year_group: "Year 4",
    description: "Dance position / motif card.",
    style_notes: "Pair or solo silhouettes, motion arrow",
    tags: ["PE", "dance"],
  }, [
    "Dance — unison group shape",
    "Dance — canon (sequential)",
    "Dance — mirror partner",
    "Dance — contrast levels (high/mid/low)",
  ]);

  // Fitness components — 6
  emitTitled(ctx, {
    subject: "Physical education",
    topic: "Fitness",
    year_group: "Year 5",
    description: "Card explaining one component of fitness.",
    style_notes: "Icon plus child mascot showing the activity",
    tags: ["PE", "fitness"],
  }, [
    "Fitness component — endurance",
    "Fitness component — strength",
    "Fitness component — speed",
    "Fitness component — flexibility",
    "Fitness component — agility",
    "Fitness component — coordination",
  ]);

  // Healthy living / heart-rate — 6
  emitTitled(ctx, {
    subject: "Physical education",
    topic: "Healthy living",
    year_group: "Year 5",
    description: "Healthy lifestyle / heart-rate diagram.",
    style_notes: "Heart-rate-line motif, comparing rest vs exercise",
    tags: ["PE", "healthy-living"],
  }, [
    "Heart rate — at rest vs exercise",
    "Warm-up routine sequence",
    "Cool-down stretches sequence",
    "Hydration during exercise reminder",
    "Sleep / exercise / nutrition triangle",
    "Active travel ideas (walk/cycle/scoot)",
  ]);

  // Athletics events — 4
  emitTitled(ctx, {
    subject: "Physical education",
    topic: "Athletics",
    year_group: "Year 5",
    description: "Athletics event diagram with technique cues.",
    style_notes: "Stick-figure sequence",
    tags: ["PE", "athletics"],
  }, [
    "Athletics — sprint start technique",
    "Athletics — long jump phases",
    "Athletics — high jump (Fosbury flop simplified)",
    "Athletics — relay baton change",
  ]);
}
