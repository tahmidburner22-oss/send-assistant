/**
 * History — primary diagram catalogue (Y1–Y6).
 * Target: ~140 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Stone Age / Bronze Age / Iron Age — 12
  emitTitled(ctx, {
    subject: "History",
    topic: "Stone Age to Iron Age",
    year_group: "Year 3",
    description: "Stone Age / Bronze Age / Iron Age scene or labelled artefact diagram.",
    style_notes: "Earthy palette, ochre / charcoal / clay tones",
    tags: ["stone-age", "bronze-age", "iron-age", "Y3"],
  }, [
    "Stone Age — hunter-gatherer scene",
    "Stone Age — cave painting (Lascaux style)",
    "Stone Age — flint knapping",
    "Stone Age — Skara Brae village",
    "Stonehenge — labelled trilithon",
    "Bronze Age — bronze sword and shield",
    "Bronze Age — round house cross-section",
    "Iron Age — hill fort",
    "Iron Age — Celtic warrior",
    "Stone/Bronze/Iron Age timeline",
    "Tool comparison — flint vs bronze vs iron",
    "Discovery — Otzi the Iceman simplified",
  ]);

  // Ancient Egypt — 16
  emitTitled(ctx, {
    subject: "History",
    topic: "Ancient Egypt",
    year_group: "Year 4",
    description: "Ancient Egypt artefact, scene or diagram.",
    style_notes: "Sandstone palette with gold highlights, hieroglyph border",
    tags: ["ancient-egypt", "Y4"],
  }, [
    "Pyramid cross-section — Great Pyramid of Giza",
    "Sphinx labelled",
    "Pharaoh in regalia",
    "Mummification process — 5 steps",
    "Canopic jars — four sons of Horus",
    "Egyptian gods card — Ra",
    "Egyptian gods card — Anubis",
    "Egyptian gods card — Osiris",
    "Egyptian gods card — Isis",
    "Egyptian gods card — Horus",
    "Egyptian gods card — Bastet",
    "Hieroglyph alphabet poster",
    "Cartouche template",
    "Nile river map with cities (Memphis/Thebes/Alexandria)",
    "Pharaoh's headdress — nemes labelled",
    "Tutankhamun's mask — labelled",
  ]);

  // Ancient Greece — 12
  emitTitled(ctx, {
    subject: "History",
    topic: "Ancient Greece",
    year_group: "Year 5",
    description: "Ancient Greek scene or labelled diagram.",
    style_notes: "Marble whites and Aegean blues, terracotta accents",
    tags: ["ancient-greece", "Y5"],
  }, [
    "Acropolis — labelled buildings",
    "Parthenon — column orders (Doric/Ionic/Corinthian)",
    "Greek vase — black-figure style",
    "Greek soldier — hoplite labelled",
    "Olympic Games events — original 5",
    "Olympic torch and flame",
    "Trojan horse",
    "Greek god card — Zeus",
    "Greek god card — Athena",
    "Greek god card — Poseidon",
    "Greek god card — Hermes",
    "Greek city-states map — Athens/Sparta/Corinth/Thebes",
  ]);

  // Romans — 14
  emitTitled(ctx, {
    subject: "History",
    topic: "Romans",
    year_group: "Year 4",
    description: "Roman artefact, building or scene.",
    style_notes: "Roman red / gold / marble palette",
    tags: ["romans", "Y4"],
  }, [
    "Roman soldier — legionary labelled",
    "Roman shield (scutum) and gladius",
    "Roman testudo formation",
    "Roman road cross-section",
    "Hadrian's Wall — labelled",
    "Colosseum — labelled",
    "Roman bath house — labelled rooms",
    "Roman villa — labelled rooms",
    "Roman map of Britain — major roads/towns",
    "Boudicca's revolt route",
    "Roman numerals chart (link with Maths)",
    "Roman gods chart (Jupiter/Mars/Venus)",
    "Roman aqueduct cross-section",
    "Roman family — paterfamilias / matrona / children / slaves",
  ]);

  // Anglo-Saxons & Vikings — 12
  emitTitled(ctx, {
    subject: "History",
    topic: "Anglo-Saxons and Vikings",
    year_group: "Year 5",
    description: "Anglo-Saxon or Viking scene / artefact / map.",
    style_notes: "Earthy greens and silvers, runes in border",
    tags: ["anglo-saxons", "vikings", "Y5"],
  }, [
    "Anglo-Saxon kingdoms map (Heptarchy)",
    "Anglo-Saxon village layout",
    "Sutton Hoo helmet — labelled",
    "Viking longship — labelled",
    "Viking longhouse — labelled",
    "Viking warrior with axe and shield",
    "Viking trade routes map (Iceland → Constantinople)",
    "Runes alphabet poster",
    "Lindisfarne raid scene",
    "Saxon vs Viking comparison chart",
    "King Alfred the Great portrait",
    "Battle of Hastings simplified plan",
  ]);

  // Tudors / Stuarts / Great Fire — 14
  emitTitled(ctx, {
    subject: "History",
    topic: "Tudors and Stuarts",
    year_group: "Year 5",
    description: "Tudor or Stuart scene / building / portrait diagram.",
    style_notes: "Rich Tudor reds and Stuart blacks, gilded edge",
    tags: ["tudors", "stuarts"],
  }, [
    "Tudor monarchs family tree",
    "Tudor house — half-timbered",
    "Henry VIII portrait silhouette with six wives",
    "Mary Rose ship — labelled",
    "Elizabeth I portrait silhouette",
    "Spanish Armada route map",
    "Tudor clothing — rich vs poor",
    "Tudor punishments chart (PSHE-aware)",
    "Globe Theatre — labelled",
    "James I portrait silhouette",
    "Gunpowder Plot — Houses of Parliament cellar",
    "Great Fire of London — 1666 spread map",
    "Plague doctor outfit (1665) labelled",
    "Samuel Pepys diary extract template",
  ]);

  // Victorians — 12
  emitTitled(ctx, {
    subject: "History",
    topic: "Victorians",
    year_group: "Year 5",
    description: "Victorian-era scene or invention card.",
    style_notes: "Sepia palette with brass highlights",
    tags: ["victorians", "industrial-revolution"],
  }, [
    "Victorian street scene",
    "Victorian school classroom — labelled",
    "Victorian classroom — slate and dunce's cap",
    "Workhouse plan",
    "Victorian factory — children working",
    "Steam train — Stephenson's Rocket labelled",
    "Telephone — Bell's invention",
    "Lightbulb — Edison/Swan",
    "Penny Black stamp",
    "Queen Victoria silhouette portrait",
    "British Empire 1900 map (simplified)",
    "Victorian invention timeline",
  ]);

  // 20th-century / WW1 / WW2 — 16
  emitTitled(ctx, {
    subject: "History",
    topic: "20th-century Britain",
    year_group: "Year 6",
    description: "20th-century historical scene or diagram (KS2-appropriate framing).",
    style_notes: "Muted palette, archival feel",
    tags: ["ww1", "ww2", "20th-century"],
  }, [
    "WW1 trench cross-section — labelled",
    "WW1 soldier — uniform labelled",
    "WW1 propaganda poster (your country needs you — silhouette only)",
    "WW1 timeline 1914–1918",
    "Western Front map",
    "WW2 Anderson shelter — labelled",
    "WW2 Spitfire vs Hurricane silhouettes",
    "Blitz scene — London skyline (no graphic content)",
    "Evacuee with suitcase and label",
    "Ration book contents poster",
    "Dig for Victory poster style",
    "VE Day street party",
    "WW2 timeline 1939–1945",
    "Home front — gas mask and helmet labelled",
    "D-Day landings map (simplified)",
    "Winston Churchill silhouette portrait",
  ]);

  // Local UK kings/queens timeline — 12
  emitTitled(ctx, {
    subject: "History",
    topic: "Monarchs of Britain",
    year_group: "Year 5",
    description: "Monarch portrait silhouette card with reign dates.",
    style_notes: "Royal purple / gold border, silhouette portraits",
    tags: ["monarchs", "kings-queens"],
  }, [
    "Monarch — William the Conqueror",
    "Monarch — Henry II",
    "Monarch — Richard the Lionheart",
    "Monarch — King John",
    "Monarch — Edward III",
    "Monarch — Henry VII",
    "Monarch — Henry VIII",
    "Monarch — Elizabeth I",
    "Monarch — Charles I",
    "Monarch — Victoria",
    "Monarch — George VI",
    "Monarch — Elizabeth II",
  ]);

  // Black history & women's history (Y6) — 8
  emitTitled(ctx, {
    subject: "History",
    topic: "Diverse history",
    year_group: "Year 6",
    description: "Card celebrating diverse historical figures from UK history.",
    style_notes: "Silhouette portrait + key contribution caption",
    tags: ["diverse-history", "black-history", "women-history"],
  }, [
    "Mary Seacole — Crimean War nurse",
    "Walter Tull — soldier and footballer",
    "Olaudah Equiano — abolitionist",
    "Emmeline Pankhurst — suffragette",
    "Edith Cavell — WW1 nurse",
    "Florence Nightingale — Crimean War nurse",
    "Ada Lovelace — first computer programmer",
    "Mary Anning — palaeontologist",
  ]);

  // Source-evaluation visuals — 6
  emitTitled(ctx, {
    subject: "History",
    topic: "Working as a historian",
    year_group: "Year 5",
    description: "Visual aid for source analysis / chronology.",
    style_notes: "Magnifying glass mascot, clear question prompts",
    tags: ["sources", "skills"],
  }, [
    "Primary vs secondary source poster",
    "Source evaluation 5W (who/what/when/where/why)",
    "Chronology timeline — BC/AD spinner",
    "Cause and consequence diamond-9",
    "Continuity vs change comparison",
    "Bias check questions card",
  ]);

  // Local-history-style template — 6
  emitTitled(ctx, {
    subject: "History",
    topic: "Local history",
    year_group: "Year 4",
    description: "Generic template / scaffolding visual for local-history projects.",
    style_notes: "Map / clipboard motif",
    tags: ["local-history", "template"],
  }, [
    "Local history timeline blank",
    "Census record extract (template)",
    "Old photograph annotation frame",
    "Then-and-now compare frame",
    "Family tree blank (4 generations)",
    "Local landmark annotation map",
  ]);
}
