/**
 * GCSE Sociology, Psychology and Citizenship — diagram catalogue.
 *
 * Anchored to AQA Sociology 8192, AQA / Pearson Psychology, AQA / Edexcel
 * Citizenship Studies. Bundled because each is a smaller GCSE.
 *
 * Target: ~120 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const STYLE = "Concept-map style with central pill and branches, exam-paper feel";

export function build(ctx) {
  // ── Sociology ───────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Sociology",
    year_band: "GCSE",
    topic: "Sociological perspectives",
    year_group: "Year 10",
    description: "Sociological-perspective diagram for GCSE.",
    style_notes: STYLE,
    tags: ["GCSE", "sociology", "perspectives"],
  }, [
    "Functionalism — society as organism diagram",
    "Marxism — base and superstructure",
    "Feminism — radical / liberal / Marxist comparison",
    "Interactionism — labels and self-fulfilling prophecy",
    "Postmodernism — fragmented identities card",
    "Structure vs agency continuum",
    "Norms / values / roles / status definitions card",
    "Socialisation — primary vs secondary",
    "Agents of socialisation — family, school, peers, media",
    "Nature vs nurture debate card",
  ]);

  emitTitled(ctx, {
    subject: "Sociology",
    year_band: "GCSE",
    topic: "Family",
    year_group: "Year 10",
    description: "Family / household diagram for GCSE Sociology.",
    style_notes: STYLE,
    tags: ["GCSE", "sociology", "family"],
  }, [
    "Family types — nuclear / extended / reconstituted / single-parent / same-sex",
    "Household composition over time — UK trends graph",
    "Marriage and cohabitation rates UK graph",
    "Divorce rate UK graph 1950–present",
    "Parsons' functions of the family card",
    "Symmetrical family — Young and Willmott card",
    "Conjugal roles — segregated vs joint",
    "Domestic division of labour table",
  ]);

  emitTitled(ctx, {
    subject: "Sociology",
    year_band: "GCSE",
    topic: "Education",
    year_group: "Year 11",
    description: "Education-system diagram for GCSE Sociology.",
    style_notes: STYLE,
    tags: ["GCSE", "sociology", "education"],
  }, [
    "Functions of education — functionalist view (Durkheim, Parsons)",
    "Hidden curriculum — examples list",
    "Class inequality in education — material vs cultural deprivation",
    "Gender attainment gap UK graph",
    "Ethnicity and attainment UK graph",
    "Streaming and setting impact diagram",
    "Labelling theory — self-fulfilling prophecy loop",
    "Pro-school vs anti-school subcultures",
    "Marketisation — league tables / Ofsted",
  ]);

  emitTitled(ctx, {
    subject: "Sociology",
    year_band: "GCSE",
    topic: "Crime and deviance",
    year_group: "Year 11",
    description: "Crime / deviance diagram for GCSE Sociology.",
    style_notes: STYLE,
    tags: ["GCSE", "sociology", "crime"],
  }, [
    "Functionalist view of crime — Durkheim's boundary maintenance",
    "Marxist view of crime — selective enforcement",
    "Subcultural theories — status frustration",
    "Strain theory — Merton's modes of adaptation table",
    "Labelling theory — Becker's master status",
    "Crime statistics — Crime Survey vs police-recorded comparison",
    "Dark figure of crime — iceberg",
    "Age and crime — UK distribution",
    "Gender and crime — Adler's liberation thesis",
    "Ethnicity and crime — institutional racism debate",
    "Methods of social control — formal vs informal",
  ]);

  emitTitled(ctx, {
    subject: "Sociology",
    year_band: "GCSE",
    topic: "Research methods",
    year_group: "Year 10",
    description: "Sociology research-methods diagram.",
    style_notes: STYLE,
    tags: ["GCSE", "sociology", "research-methods"],
  }, [
    "Quantitative vs qualitative methods comparison",
    "Primary vs secondary data card",
    "Survey vs interview vs observation comparison",
    "Sampling — random / stratified / snowball / opportunity",
    "Validity vs reliability vs representativeness card",
    "Ethical issues — informed consent, anonymity, harm",
    "Hawthorne effect card",
    "Operationalising concepts card",
  ]);

  // ── Psychology ──────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Psychology",
    year_band: "GCSE",
    topic: "Approaches",
    year_group: "Year 10",
    description: "Psychology-approach diagram for GCSE.",
    style_notes: STYLE,
    tags: ["GCSE", "psychology", "approaches"],
  }, [
    "Biological approach — neurons and hormones poster",
    "Cognitive approach — information-processing model",
    "Behaviourist approach — classical conditioning (Pavlov)",
    "Behaviourist approach — operant conditioning (Skinner)",
    "Social learning theory — Bandura's bobo doll diagram",
    "Humanistic approach — Maslow's hierarchy",
    "Psychodynamic approach — Freud's iceberg",
  ]);

  emitTitled(ctx, {
    subject: "Psychology",
    year_band: "GCSE",
    topic: "Memory",
    year_group: "Year 10",
    description: "Memory-model diagram for GCSE Psychology.",
    style_notes: STYLE,
    tags: ["GCSE", "psychology", "memory"],
  }, [
    "Multi-store model — Atkinson and Shiffrin",
    "Working memory model — Baddeley and Hitch",
    "Levels of processing — Craik and Lockhart",
    "Forgetting — interference and decay",
    "Cue-dependent forgetting — context and state",
    "Eyewitness testimony — Loftus reconstructive memory",
    "Schema theory diagram",
    "Episodic vs semantic memory comparison",
  ]);

  emitTitled(ctx, {
    subject: "Psychology",
    year_band: "GCSE",
    topic: "Brain and neuropsychology",
    year_group: "Year 11",
    description: "Brain / neuron diagram for GCSE Psychology.",
    style_notes: "Anatomical drawing, soft fill",
    tags: ["GCSE", "psychology", "brain"],
  }, [
    "Brain — labelled lobes (frontal, parietal, temporal, occipital)",
    "Brain — limbic system labelled (hippocampus, amygdala, hypothalamus)",
    "Neuron — labelled (cell body, axon, dendrites, myelin)",
    "Synapse — labelled (vesicles, neurotransmitter, receptor)",
    "Sympathetic vs parasympathetic nervous system",
    "Fight-or-flight response chain",
    "Brain-imaging techniques — CT vs PET vs fMRI",
    "Localisation of function summary card",
  ]);

  emitTitled(ctx, {
    subject: "Psychology",
    year_band: "GCSE",
    topic: "Development and social influence",
    year_group: "Year 11",
    description: "Developmental / social-psychology diagram for GCSE.",
    style_notes: STYLE,
    tags: ["GCSE", "psychology", "development"],
  }, [
    "Piaget's stages of cognitive development",
    "Conservation experiments — Piaget cards",
    "Vygotsky's zone of proximal development",
    "Bowlby's attachment theory — internal working model",
    "Ainsworth's Strange Situation classification",
    "Asch's conformity experiment line-judging",
    "Milgram's obedience experiment setup",
    "Zimbardo's prison study — guards vs prisoners",
    "Bystander effect — Latané and Darley diagram",
    "Group think and group polarisation card",
  ]);

  // ── Citizenship ─────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Citizenship Studies",
    year_band: "GCSE",
    topic: "Politics and democracy",
    year_group: "Year 10",
    description: "UK political-system diagram for GCSE Citizenship.",
    style_notes: STYLE,
    tags: ["GCSE", "citizenship", "politics"],
  }, [
    "UK political system — three branches (legislative, executive, judiciary)",
    "Parliament — Commons, Lords, Monarch",
    "Path of a Bill — first reading to royal assent",
    "Cabinet vs shadow cabinet card",
    "First-past-the-post vs proportional representation",
    "UK general election turnout graph 1945–present",
    "Devolution — Scotland / Wales / Northern Ireland powers",
    "Local government — councils and mayors",
    "Pressure groups — insider vs outsider",
    "Trade unions and how they operate",
  ]);

  emitTitled(ctx, {
    subject: "Citizenship Studies",
    year_band: "GCSE",
    topic: "Rights and law",
    year_group: "Year 10",
    description: "Rights / law diagram for GCSE Citizenship.",
    style_notes: STYLE,
    tags: ["GCSE", "citizenship", "rights"],
  }, [
    "UK legal system — civil vs criminal law comparison",
    "Court hierarchy — magistrates' to Supreme Court",
    "Police powers card — stop and search",
    "Universal Declaration of Human Rights — key articles",
    "European Convention on Human Rights — key articles",
    "UK Human Rights Act 1998 — summary",
    "Equality Act 2010 — protected characteristics",
    "International law — UN Security Council diagram",
    "NATO and the Commonwealth — UK alliances map",
  ]);

  emitTitled(ctx, {
    subject: "Citizenship Studies",
    year_band: "GCSE",
    topic: "Active citizenship",
    year_group: "Year 11",
    description: "Active-citizenship diagram for GCSE.",
    style_notes: STYLE,
    tags: ["GCSE", "citizenship", "active-citizenship"],
  }, [
    "Citizenship action research cycle",
    "Stakeholder map for a community campaign",
    "Methods of bringing about change — petition, lobbying, protest, social media",
    "Volunteering and charities — examples card",
    "Migration — push and pull factors",
    "UK identity — nation, region, religion, culture",
    "Sustainable Development Goals — 17 icons poster",
  ]);
}
