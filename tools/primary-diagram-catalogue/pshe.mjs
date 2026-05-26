/**
 * PSHE & RSE — primary diagram catalogue.
 * Target: ~70 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Emotion cards (KS1) — 16
  const EMOTIONS = [
    "happy","sad","angry","scared","worried","excited","proud","surprised",
    "embarrassed","frustrated","calm","tired","disappointed","jealous","grateful","lonely",
  ];
  for (const e of EMOTIONS) {
    ctx.add({
      title: `Emotion card — ${e}`,
      subject: "PSHE",
      topic: "Emotions and feelings",
      year_group: "Year 1",
      description: `Cartoon child face showing the emotion "${e}" with name underneath; small body-language cue (e.g. clenched fists for angry).`,
      style_notes: "Round cheerful faces, distinct colour per emotion",
      tags: ["PSHE", "emotion", "KS1"],
    });
  }

  // Friendship scenarios — 8
  emitTitled(ctx, {
    subject: "PSHE",
    topic: "Friendship",
    year_group: "Year 2",
    description: "Friendship scenario card with two characters and a problem/solution.",
    style_notes: "Two child characters, speech bubbles, decision arrow",
    tags: ["PSHE", "friendship"],
  }, [
    "Friendship — sharing a toy",
    "Friendship — including a new friend",
    "Friendship — saying sorry",
    "Friendship — falling out and making up",
    "Friendship — listening when a friend is sad",
    "Friendship — disagreeing kindly",
    "Friendship — peer pressure (saying no)",
    "Friendship — celebrating a friend's success",
  ]);

  // Healthy living — 10
  emitTitled(ctx, {
    subject: "PSHE",
    topic: "Healthy lifestyles",
    year_group: "Year 3",
    description: "Healthy-living anchor poster.",
    style_notes: "Active child characters, traffic-light cues",
    tags: ["PSHE", "healthy-living"],
  }, [
    "Healthy plate (Eatwell guide simplified)",
    "Move-your-body wheel — exercise ideas",
    "Sleep clock — recommended hours by age",
    "Drink water reminder — water bottle ladder",
    "Hand-washing 6-step poster",
    "Brush your teeth — 2 minutes timer",
    "Sun safety — slip slop slap",
    "Limiting screen-time balance scale",
    "Fresh-air break ideas",
    "Healthy snacks vs treat snacks",
  ]);

  // Online safety / digital wellbeing — 8
  emitTitled(ctx, {
    subject: "PSHE",
    topic: "Online safety",
    year_group: "Year 4",
    description: "Online-life decision card.",
    style_notes: "Device + child + decision tree",
    tags: ["PSHE", "online-safety", "computing-link"],
  }, [
    "Tell a trusted adult — when and how",
    "Permission to share — selfie with a friend",
    "Pop-ups and pressure to buy",
    "Spotting scams (a parcel you never ordered)",
    "Group chats — leaving kindly",
    "Comments — kind / unkind / unsure traffic light",
    "Trusted vs untrusted websites checklist",
    "Take a break from the screen — body cues",
  ]);

  // Anti-bullying — 6
  emitTitled(ctx, {
    subject: "PSHE",
    topic: "Anti-bullying",
    year_group: "Year 4",
    description: "Anti-bullying scenario or anchor card.",
    style_notes: "Empathy-led colour palette, character with supportive friends",
    tags: ["PSHE", "anti-bullying"],
  }, [
    "Bullying vs falling out — comparison",
    "STOP acronym poster (Several Times On Purpose)",
    "Upstander vs bystander",
    "What to do if you see bullying — 3 steps",
    "Words have weight — kind vs unkind",
    "Help-seeking ladder (friend / teacher / parent / Childline)",
  ]);

  // Diversity / inclusion / family types — 8
  emitTitled(ctx, {
    subject: "PSHE",
    topic: "Diversity and inclusion",
    year_group: "Year 3",
    description: "Inclusion-themed card celebrating different identities and family types.",
    style_notes: "Diverse character set, warm palette",
    tags: ["PSHE", "diversity", "inclusion", "RSE"],
  }, [
    "Family types — many shapes (single parent, grandparents, two mums, two dads, blended, foster)",
    "Cultural celebrations around the school year",
    "Disability inclusion — support tools (wheelchair, hearing aid, cane)",
    "Languages we speak in our class",
    "Differences and similarities Venn",
    "Pronouns introduction (he/she/they) age-appropriate",
    "Our class agreement / charter template",
    "Stereotypes — challenge them card",
  ]);

  // Money / careers (KS2) — 6
  emitTitled(ctx, {
    subject: "PSHE",
    topic: "Money and careers",
    year_group: "Year 5",
    description: "Money / careers / aspirations card for KS2 PSHE.",
    style_notes: "Friendly piggy bank / dream-job characters",
    tags: ["PSHE", "money", "careers"],
  }, [
    "Wants vs needs sorting tray",
    "Saving / spending / giving jars",
    "Earning money — examples by age",
    "Jobs in our community grid",
    "Bills and budget — family example (simple)",
    "Goal ladder — short / medium / long term",
  ]);

  // Growing up / RSE (KS2 — primary appropriate) — 8
  emitTitled(ctx, {
    subject: "PSHE",
    topic: "Relationships and changing me",
    year_group: "Year 6",
    description: "RSE card appropriate for primary, focusing on changes, consent, and respect.",
    style_notes: "Calm, factual, age-appropriate illustration; no anatomical detail beyond the DfE primary RSE expectations",
    tags: ["RSE", "PSHE", "Y6"],
  }, [
    "Body changes — what stays the same / what changes",
    "Consent — yes / no / maybe traffic-light",
    "Healthy vs unhealthy relationship signs",
    "Personal space and 'my body, my choice' card",
    "Asking for help — trusted adult ladder",
    "Identifying private parts (NSPCC PANTS rule)",
    "Feelings during change — name and acknowledge",
    "Coping with worry — 5-4-3-2-1 grounding",
  ]);
}
