/**
 * KS3 History — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 History Programme of Study (1066 to present
 * day, plus broad world history). Diagrams are timelines, source frames
 * and silhouette-portrait cards — copyright-safe.
 *
 * Target: ~70 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "History", year_band: "KS3" };
const STYLE_HIST = "Sepia/parchment palette, silhouette portraits in grey, dates in serif typeface";
const TAGS_KS3 = ["KS3", "history", "national-curriculum"];

export function build(ctx) {
  emitTitled(ctx, {
    ...COMMON,
    topic: "Medieval England",
    year_group: "Year 7",
    description: "Medieval / Norman England diagram for KS3.",
    style_notes: STYLE_HIST,
    tags: [...TAGS_KS3, "medieval", "norman"],
  }, [
    "1066 contenders for the throne — Harold, Hardrada, William, Edgar",
    "Battle of Stamford Bridge — simplified plan",
    "Battle of Hastings — simplified troop plan",
    "Feudal system pyramid — King / barons / knights / peasants",
    "Domesday Book extract — annotation frame",
    "Motte-and-bailey castle — cross-section",
    "Concentric stone castle — labelled defences",
    "Medieval village layout — open field system",
    "Medieval church power diagram",
    "The Crusades — Europe / Middle East simplified map",
    "Black Death — flea / rat / human transmission cycle",
    "Magna Carta — key clauses summary card",
    "Peasants' Revolt 1381 — causes and consequences",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Tudors and Stuarts",
    year_group: "Year 8",
    description: "Tudor / Stuart-period diagram for KS3.",
    style_notes: STYLE_HIST,
    tags: [...TAGS_KS3, "tudors", "stuarts"],
  }, [
    "Tudor monarchs family tree — Henry VII to Elizabeth I",
    "Henry VIII's six wives — outcome card",
    "Reformation — Catholic vs Protestant comparison",
    "Dissolution of the monasteries — process diagram",
    "Tudor exploration — Drake's circumnavigation route",
    "Spanish Armada 1588 — route map",
    "Stuart kings family tree — James I to James II",
    "Gunpowder Plot — Houses of Parliament cellar",
    "English Civil War — Royalists vs Parliamentarians comparison",
    "Battle of Naseby 1645 — simplified plan",
    "Execution of Charles I — context timeline",
    "Restoration 1660 — Charles II key events",
    "Great Plague of London 1665 — bills of mortality bar chart",
    "Great Fire of London 1666 — spread map",
    "Glorious Revolution 1688 — events ladder",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Industrial Revolution and Empire",
    year_group: "Year 8",
    description: "Industrial / Empire diagram for KS3.",
    style_notes: STYLE_HIST,
    tags: [...TAGS_KS3, "industrial-revolution", "empire"],
  }, [
    "Steam engine — Watt / Newcomen labelled",
    "Cotton mill — labelled machinery (spinning jenny, water frame, mule)",
    "Factory system vs cottage industry comparison",
    "Triangular trade — three-leg routes map (transatlantic slavery)",
    "Abolition timeline — Wilberforce, 1807, 1833",
    "Equiano and Wedgwood medallion — silhouette card",
    "British Empire 1900 — world map (simplified, key dominions)",
    "Indian independence movement — key figures card",
    "Industrial city — public health problems (Snow's cholera map)",
    "Reform Acts timeline — 1832, 1867, 1884",
    "Suffragists vs Suffragettes — methods comparison",
    "Pankhursts and Davison — silhouette card",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Twentieth century — wars and society",
    year_group: "Year 9",
    description: "Twentieth-century diagram for KS3.",
    style_notes: STYLE_HIST,
    tags: [...TAGS_KS3, "ww1", "ww2", "20th-century"],
  }, [
    "Causes of WW1 — MAIN (Militarism, Alliances, Imperialism, Nationalism)",
    "WW1 alliances — Triple Entente vs Triple Alliance map",
    "WW1 trench cross-section — KS3 labelled (firestep, parapet, dugout, sap)",
    "Schlieffen Plan — invasion route arrows",
    "Battle of the Somme — first day plan",
    "Treaty of Versailles 1919 — terms summary card",
    "Causes of WW2 — TURD (Treaty, Unemployment, Rise of Hitler, Decline of LoN)",
    "Rise of the Nazi Party — events ladder",
    "WW2 timeline 1939–1945 — Europe and Pacific",
    "Battle of Britain — Spitfire and Hurricane silhouettes",
    "The Holocaust — KS3 stages diagram (Nuremberg laws → ghettos → camps)",
    "D-Day landings — five beaches map",
    "Hiroshima and Nagasaki — KS3 context map",
    "United Nations founding 1945 — purpose card",
    "NHS founding 1948 — Bevan poster",
    "Cold War — Iron Curtain map",
    "Berlin Wall — fall in 1989 timeline",
    "Civil Rights Movement (US) — key figures silhouette set",
    "Windrush generation — UK migration map and timeline",
    "Decolonisation — independence dates of British colonies",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Working as a historian",
    year_group: "Year 7",
    description: "Source / interpretation skills diagram for KS3.",
    style_notes: STYLE_HIST,
    tags: [...TAGS_KS3, "skills", "sources"],
  }, [
    "Source evaluation — NOP (Nature, Origin, Purpose) frame",
    "Provenance check — who, when, where, why card",
    "Cause and consequence diamond-9",
    "Continuity and change comparison frame",
    "Significance criteria — REVELATION (Remarkable, Echoed, Vital, etc.)",
    "Historical interpretation — comparing two views frame",
    "Chronology — BC/AD/BCE/CE explainer",
  ]);
}
