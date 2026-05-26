/**
 * GCSE History — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel and OCR History GCSE specifications.
 * Heavy-priority families flagged in the brief: trench cross-section,
 * key-figure portrait silhouettes, cause-consequence diamond-9,
 * source-utility 4-box, public-health timeline, Cold War tension graph.
 *
 * Target: ~120 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "History", year_band: "GCSE" };
const STYLE_HIST = "Sepia/parchment palette, silhouette portraits in grey, dates in serif typeface";
const TAGS = ["GCSE", "history"];

export function build(ctx) {
  // ── Skills frames ────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Source and interpretation skills",
    year_group: "Year 10",
    description: "Historian-skills scaffold for GCSE.",
    style_notes: "Frame with labelled boxes and prompt questions",
    tags: [...TAGS, "skills", "sources"],
  }, [
    "Source utility 4-box — content / origin / purpose / context",
    "Source provenance card — NOP (Nature, Origin, Purpose)",
    "Source utility — how / why / when / for whom prompt grid",
    "Cause-consequence diamond-9",
    "Continuity-and-change comparison frame",
    "Significance ladder — REVELATION / GREAT / NCO criteria",
    "Interpretation comparison — two views frame",
    "PEEL paragraph for history",
    "Tier-3 vocab card — common GCSE History command words",
    "Chronology timeline template (decades scale)",
  ]);

  // ── Health and the people (Edexcel / OCR / AQA medicine) ────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Medicine through time",
    year_group: "Year 10",
    description: "Medicine / public-health diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "medicine", "public-health"],
  }, [
    "Public-health timeline — 1300 to present",
    "Black Death 1348–50 — flea / rat / human transmission",
    "Medieval medicine — Theory of the Four Humours",
    "Bloodletting practice — barber-surgeon diagram",
    "Renaissance medicine — Vesalius and the Fabric of the Human Body card",
    "William Harvey — circulation diagram",
    "Great Plague 1665 — bills of mortality bar chart",
    "Edward Jenner — cowpox vaccination 1796",
    "Cholera and John Snow — Broad Street pump map 1854",
    "Florence Nightingale — Crimean War hospital reform",
    "Joseph Lister — antiseptic surgery card",
    "Louis Pasteur — germ theory diagram",
    "Robert Koch — bacterial discoveries timeline",
    "Alexander Fleming — penicillin discovery 1928",
    "NHS founding 1948 — Bevan poster",
    "DNA / genome — Watson / Crick / Franklin card",
  ]);

  // ── Crime and punishment (Edexcel / AQA) ───────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Crime and punishment",
    year_group: "Year 10",
    description: "Crime / punishment diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "crime-and-punishment"],
  }, [
    "Crime and punishment timeline — Anglo-Saxon to modern",
    "Anglo-Saxon law — wergild and tithings card",
    "Norman law — forest laws and trial by ordeal",
    "Tudor punishments — vagabonds and witchcraft",
    "Bloody Code 1700s — capital crimes table",
    "Transportation to Australia — convict ship diagram",
    "Robert Peel — founding of the Met Police 1829",
    "Pentonville prison — separate-system layout",
    "Modern punishments — community sentencing card",
    "Whitechapel 1888 — local context map",
  ]);

  // ── Cold War / 20th century ─────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Cold War and superpower relations",
    year_group: "Year 11",
    description: "Cold War diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "cold-war", "superpowers"],
  }, [
    "Cold War tension graph — high tension peaks (Berlin, Cuba, Afghanistan)",
    "Iron Curtain map — divided Europe",
    "Yalta and Potsdam — comparison card",
    "Truman Doctrine and Marshall Plan card",
    "Berlin Blockade and airlift 1948–49",
    "NATO vs Warsaw Pact alliance map",
    "Korean War 1950–53 map",
    "Hungarian Uprising 1956",
    "Berlin Wall building 1961",
    "Cuban Missile Crisis 1962 — 13-day timeline",
    "Vietnam War — Domino theory diagram",
    "Prague Spring 1968",
    "SALT and detente — arms-talks timeline",
    "Soviet invasion of Afghanistan 1979",
    "Solidarity in Poland 1980s",
    "Reagan and Gorbachev — Reykjavik / Geneva summits",
    "Fall of the Berlin Wall 1989 — events chain",
    "Collapse of the USSR 1991 — fact card",
  ]);

  // ── World wars ──────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "First World War (and Western Front depth)",
    year_group: "Year 11",
    description: "WW1 / Western Front diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "ww1"],
  }, [
    "Causes of WW1 — MAIN poster",
    "Schlieffen Plan — invasion arrows",
    "Western Front — labelled trench cross-section (firestep, parapet, dugout, sap)",
    "Trench system layout — front, support, reserve trenches",
    "No man's land features — wire, shell holes, bodies",
    "Trench foot / shell shock — medical conditions card",
    "Battle of the Somme 1916 — first day plan",
    "Battle of Ypres / Passchendaele",
    "RAMC stretcher-bearer to base hospital chain",
    "Field hospitals and casualty clearing stations diagram",
    "Treaty of Versailles 1919 — terms summary card",
    "Source-skill card — assessing utility of WW1 photographs",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Weimar and Nazi Germany",
    year_group: "Year 11",
    description: "Weimar / Nazi Germany diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "weimar", "nazi-germany"],
  }, [
    "Weimar political system — Reichstag, Reichsrat, President",
    "Hyperinflation 1923 — bread-prices graph",
    "Spartacist Uprising and Kapp Putsch — comparison",
    "Stresemann era — economic recovery card",
    "Wall Street Crash 1929 — Germany impact card",
    "Rise of the Nazis — election graph 1928–33",
    "Reichstag Fire and Enabling Act timeline",
    "Night of the Long Knives 1934",
    "Nuremberg Laws 1935 — antisemitic legislation card",
    "Kristallnacht 1938",
    "Hitler Youth and BDM organisation chart",
    "Strength Through Joy / Beauty of Labour card",
    "Concentration camps to extermination camps timeline",
    "Final Solution stages diagram",
    "Resistance — Edelweiss Pirates / White Rose card",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Elizabethan / Tudor / Stuart England",
    year_group: "Year 10",
    description: "Tudor / Stuart period diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "tudors", "stuarts"],
  }, [
    "Elizabethan religious settlement — three problems card",
    "Mary Queen of Scots — succession plot timeline",
    "Spanish Armada 1588 — route map",
    "Globe Theatre layout",
    "Voyages of discovery — Drake's circumnavigation",
    "Roanoke colony — first English settlement card",
    "Stuart kings — Charles I to William III timeline",
    "Gunpowder Plot 1605 — Houses of Parliament cellar",
    "English Civil War — Royalist vs Parliamentarian comparison",
    "Battle of Naseby 1645",
    "Execution of Charles I 1649",
    "Glorious Revolution 1688",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "America (USA depth studies)",
    year_group: "Year 11",
    description: "American history diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "usa"],
  }, [
    "American West — frontier expansion 1840s–90s",
    "Plains Indians lifestyle diagram",
    "Homestead Act 1862 — 160-acre plot",
    "Transcontinental railroad route map",
    "Civil Rights Movement — key figures silhouette set",
    "Brown v Board of Education 1954 — fact card",
    "Montgomery Bus Boycott 1955–56",
    "Little Rock Nine 1957",
    "March on Washington 1963 — three-figure map",
    "Civil Rights Act 1964 / Voting Rights Act 1965",
    "Black Panther Party 1966 — fact card",
    "Vietnam War US involvement timeline",
    "Watergate scandal 1972–74",
    "Roaring Twenties vs Great Depression comparison",
    "New Deal — three R's card (Relief, Recovery, Reform)",
  ]);

  // ── Norman / Anglo-Saxon (Edexcel / AQA option) ───────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Anglo-Saxon and Norman England",
    year_group: "Year 10",
    description: "Anglo-Saxon / Norman conquest diagram for GCSE.",
    style_notes: STYLE_HIST,
    tags: [...TAGS, "anglo-saxon", "norman"],
  }, [
    "1066 contenders — Harold, Hardrada, William, Edgar",
    "Battle of Stamford Bridge 1066",
    "Battle of Hastings 1066 — simplified plan",
    "Motte and bailey castle — labelled",
    "Concentric stone castle — labelled",
    "Domesday Book extract — interpretation frame",
    "Feudal system pyramid — King / barons / knights / peasants",
    "Forest laws / royal hunt diagram",
    "Anglo-Saxon vs Norman society comparison",
  ]);
}
