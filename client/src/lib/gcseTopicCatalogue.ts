/**
 * GCSE Science and Mathematics topic catalogue.
 *
 * The catalogue translates the DfE GCSE subject-content publications into
 * individual, selectable learning targets. It deliberately keeps topic choice
 * separate from worksheet rendering: choosing a curriculum target must never
 * alter an approved worksheet's fixed layout contract.
 *
 * Sources:
 * - DfE GCSE mathematics: subject content and assessment objectives (2013)
 * - DfE GCSE subject content for combined science (2015, updated 2019)
 */

export type GcseTier = "foundation" | "higher" | "both";
export type GcseCatalogueSubject = "mathematics" | "science";

export interface GcseTopicChoice {
  id: string;
  subject: GcseCatalogueSubject;
  yearGroup: "Year 10" | "Year 11";
  tier: GcseTier;
  strand: string;
  /** Individual, pupil-facing curriculum target. */
  topic: string;
  /** DfE-derived learning objective used in the worksheet prompt and metadata. */
  objective: string;
}

const maths = (
  yearGroup: "Year 10" | "Year 11",
  tier: GcseTier,
  strand: string,
  topic: string,
  objective: string,
): GcseTopicChoice => ({
  id: `maths-${yearGroup.replace(" ", "-").toLowerCase()}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  subject: "mathematics",
  yearGroup,
  tier,
  strand,
  topic,
  objective,
});

const science = (
  yearGroup: "Year 10" | "Year 11",
  tier: GcseTier,
  strand: string,
  topic: string,
  objective: string,
): GcseTopicChoice => ({
  id: `science-${yearGroup.replace(" ", "-").toLowerCase()}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  subject: "science",
  yearGroup,
  tier,
  strand,
  topic,
  objective,
});

/**
 * The intended school sequencing is made explicit for Year 10 and Year 11.
 * Every option remains anchored to a DfE content statement; schools can still
 * select an earlier target for retrieval and gap-closing work.
 */
export const GCSE_TOPIC_CATALOGUE: GcseTopicChoice[] = [
  // ── Mathematics: Year 10 ────────────────────────────────────────────────
  maths("Year 10", "both", "Number", "Integers, decimals and fractions", "Order positive and negative integers, decimals and fractions."),
  maths("Year 10", "both", "Number", "Factors, multiples and primes", "Use the concepts and vocabulary of prime numbers, factors, multiples, common factors and common multiples."),
  maths("Year 10", "both", "Number", "Powers, roots and indices", "Use positive integer powers and associated real roots."),
  maths("Year 10", "higher", "Number", "Surds and exact values", "Calculate exactly with fractions, surds and multiples of pi."),
  maths("Year 10", "both", "Number", "Standard form", "Calculate with numbers written in standard form."),
  maths("Year 10", "both", "Number", "Rounding and estimation", "Estimate answers and check calculations using approximation and estimation."),
  maths("Year 10", "both", "Number", "Accuracy and bounds", "Apply and interpret limits of accuracy, including upper and lower bounds."),
  maths("Year 10", "both", "Algebra", "Algebraic notation and substitution", "Use and interpret algebraic notation and substitute numerical values into formulae and expressions."),
  maths("Year 10", "both", "Algebra", "Expanding and factorising expressions", "Simplify and manipulate algebraic expressions by expanding brackets and factorising."),
  maths("Year 10", "higher", "Algebra", "Algebraic fractions", "Simplify and manipulate algebraic fractions."),
  maths("Year 10", "both", "Algebra", "Rearranging formulae", "Understand and use standard mathematical formulae and rearrange formulae to change the subject."),
  maths("Year 10", "both", "Algebra", "Straight-line graphs", "Plot graphs of equations that correspond to straight-line graphs and identify gradients and intercepts."),
  maths("Year 10", "higher", "Algebra", "Quadratic graphs", "Identify and interpret roots, intercepts and turning points of quadratic functions graphically."),
  maths("Year 10", "both", "Algebra", "Solving linear equations", "Solve linear equations in one unknown algebraically."),
  maths("Year 10", "both", "Algebra", "Quadratic equations", "Solve quadratic equations algebraically by factorising and by using the quadratic formula."),
  maths("Year 10", "both", "Algebra", "Simultaneous equations", "Solve two simultaneous equations in two variables algebraically and graphically."),
  maths("Year 10", "higher", "Algebra", "Inequalities and regions", "Solve linear inequalities in one or two variables and represent the solution set graphically."),
  maths("Year 10", "both", "Algebra", "Sequences", "Generate terms of a sequence and deduce expressions for the nth term of linear sequences."),
  maths("Year 10", "both", "Ratio and proportion", "Units and scale", "Change freely between related standard units and use scale factors, scale diagrams and maps."),
  maths("Year 10", "both", "Ratio and proportion", "Ratio", "Use ratio notation, including reduction to simplest form, and divide a quantity into a given ratio."),
  maths("Year 10", "both", "Ratio and proportion", "Percentages", "Interpret percentages and percentage changes as a fraction or a decimal and solve percentage problems."),
  maths("Year 10", "both", "Ratio and proportion", "Compound measures", "Use compound units such as speed, rates of pay, unit pricing, density and pressure."),
  maths("Year 10", "both", "Geometry and measure", "Angles and polygons", "Apply the properties of angles at a point, on a straight line and in polygons, including angles in parallel lines."),
  maths("Year 10", "both", "Geometry and measure", "Congruence and similarity", "Use the basic congruence criteria for triangles and identify, describe and construct similar shapes."),
  maths("Year 10", "both", "Geometry and measure", "Area, perimeter and circles", "Know and apply formulae to calculate areas, perimeters and the circumference and area of a circle."),
  maths("Year 10", "higher", "Geometry and measure", "Circle theorems", "Apply circle theorems to calculate angles and solve geometrical problems."),
  maths("Year 10", "both", "Geometry and measure", "Pythagoras and trigonometry", "Know and apply Pythagoras' theorem and the trigonometric ratios to find lengths and angles."),
  maths("Year 10", "higher", "Geometry and measure", "Sine and cosine rules", "Apply the sine rule, cosine rule and area formula to calculate lengths, angles and areas in non-right-angled triangles."),
  maths("Year 10", "both", "Geometry and measure", "Transformations and vectors", "Identify and describe transformations and use vectors in geometrical arguments."),
  maths("Year 10", "both", "Probability", "Probability of single events", "Record, describe and analyse the frequency of outcomes and calculate probabilities of single events."),
  maths("Year 10", "both", "Probability", "Probability diagrams", "Enumerate sets and combinations systematically using tables, grids, Venn diagrams and tree diagrams."),
  maths("Year 10", "higher", "Probability", "Conditional probability", "Calculate and interpret conditional probabilities using two-way tables, tree diagrams and Venn diagrams."),
  maths("Year 10", "both", "Statistics", "Data presentation", "Interpret and construct tables, charts and diagrams for categorical, discrete and continuous data."),
  maths("Year 10", "both", "Statistics", "Averages and spread", "Interpret, analyse and compare distributions using measures of central tendency and spread."),
  maths("Year 10", "higher", "Statistics", "Histograms and cumulative frequency", "Construct and interpret histograms and cumulative frequency graphs for grouped and continuous data."),

  // ── Mathematics: Year 11 ────────────────────────────────────────────────
  maths("Year 11", "both", "Algebra", "Functions", "Recognise, sketch and interpret graphs of linear, quadratic, cubic, reciprocal and exponential functions."),
  maths("Year 11", "higher", "Algebra", "Transformations of graphs", "Interpret and translate graphs of functions, including transformations of simple graphs."),
  maths("Year 11", "higher", "Algebra", "Iteration", "Find approximate solutions to equations numerically using iteration."),
  maths("Year 11", "higher", "Algebra", "Proof", "Construct arguments and proofs using algebraic and geometric reasoning."),
  maths("Year 11", "both", "Ratio and proportion", "Direct proportion", "Solve problems involving direct proportion, including graphical and algebraic representations."),
  maths("Year 11", "higher", "Ratio and proportion", "Inverse proportion", "Solve problems involving inverse proportion, including graphical and algebraic representations."),
  maths("Year 11", "both", "Ratio and proportion", "Growth and decay", "Set up, solve and interpret growth and decay problems, including compound interest."),
  maths("Year 11", "both", "Geometry and measure", "Similarity", "Apply the properties of similar shapes, including the relationship between lengths, areas and volumes."),
  maths("Year 11", "higher", "Geometry and measure", "Cones, spheres and pyramids", "Calculate volumes and surface areas of cones, spheres and pyramids."),
  maths("Year 11", "both", "Geometry and measure", "Bearings and loci", "Use and interpret bearings, scale drawings and loci in geometrical constructions and problem solving."),
  maths("Year 11", "higher", "Geometry and measure", "Geometrical reasoning", "Apply angle facts, congruence, similarity and properties of shapes to derive results and give reasons."),
  maths("Year 11", "both", "Statistics", "Scatter graphs", "Use and interpret scatter graphs, recognise correlation, draw estimated lines of best fit and make predictions."),

  // ── Combined Science: Year 10 ────────────────────────────────────────────
  science("Year 10", "both", "Biology — Cell biology", "Eukaryotic and prokaryotic cells", "Explain how the main sub-cellular structures of eukaryotic and prokaryotic cells are related to their functions."),
  science("Year 10", "both", "Biology — Cell biology", "Microscopy and cell models", "Explain how electron microscopy has increased understanding of sub-cellular structures."),
  science("Year 10", "both", "Biology — Cell biology", "Mitosis and the cell cycle", "Describe the process of mitosis in growth, including the cell cycle."),
  science("Year 10", "both", "Biology — Cell biology", "Cell differentiation and stem cells", "Explain the importance of cell differentiation and describe the function of stem cells and meristems."),
  science("Year 10", "both", "Biology — Cell biology", "Enzymes and metabolism", "Explain the mechanism of enzyme action, including the active site, specificity and factors affecting rate."),
  science("Year 10", "both", "Biology — Transport systems", "Diffusion, osmosis and active transport", "Explain how substances are transported into and out of cells through diffusion, osmosis and active transport."),
  science("Year 10", "both", "Biology — Transport systems", "Exchange surfaces", "Explain the need for exchange surfaces and a transport system in multicellular organisms in terms of surface area to volume ratio."),
  science("Year 10", "both", "Biology — Transport systems", "The human circulatory system", "Describe the human circulatory system and explain how the heart and blood vessels are adapted to their functions."),
  science("Year 10", "both", "Biology — Transport systems", "Transport in plants", "Explain how the structure of xylem and phloem are adapted to their functions in the plant."),
  science("Year 10", "both", "Biology — Health and disease", "Communicable diseases", "Explain how communicable diseases caused by viruses, bacteria, protists and fungi are spread in animals and plants."),
  science("Year 10", "both", "Biology — Health and disease", "Defence, vaccination and medicines", "Explain the role of the immune system and the use of vaccines and medicines in preventing and treating disease."),
  science("Year 10", "both", "Biology — Health and disease", "Non-communicable disease", "Explain the effect of lifestyle factors on the incidence of non-communicable diseases."),
  science("Year 10", "both", "Biology — Photosynthesis", "Photosynthesis", "Describe the process of photosynthesis and describe photosynthesis as an endothermic reaction."),
  science("Year 10", "both", "Biology — Photosynthesis", "Limiting factors in photosynthesis", "Explain the effect of temperature, light intensity and carbon dioxide concentration on the rate of photosynthesis."),
  science("Year 10", "both", "Chemistry — Atomic structure", "Atomic structure and isotopes", "Describe the atom as a positively charged nucleus surrounded by negatively charged electrons."),
  science("Year 10", "both", "Chemistry — Atomic structure", "The periodic table", "Explain how the position of an element in the Periodic Table is related to electron arrangement and atomic number."),
  science("Year 10", "both", "Chemistry — Atomic structure", "Groups and periodic trends", "Recall and explain the simple properties of Groups 1, 7 and 0 and predict trends down the groups."),
  science("Year 10", "both", "Chemistry — Structure and bonding", "Particle model and states of matter", "Recall and explain the main features of the particle model in terms of states of matter and change of state."),
  science("Year 10", "both", "Chemistry — Structure and bonding", "Ionic, covalent and metallic bonding", "Explain chemical bonding in terms of electrostatic forces and the transfer or sharing of electrons."),
  science("Year 10", "both", "Chemistry — Structure and bonding", "Carbon structures", "Explain the properties of diamond, graphite, fullerenes and graphene in terms of their structures and bonding."),
  science("Year 10", "both", "Chemistry — Chemical changes", "Chemical formulae and equations", "Use chemical symbols to write formulae and balanced chemical equations, including state symbols."),
  science("Year 10", "both", "Chemistry — Chemical changes", "Acids, alkalis and neutralisation", "Describe neutralisation as acid reacting with alkali to form a salt plus water."),
  science("Year 10", "both", "Chemistry — Chemical changes", "Reactivity series", "Explain how the reactivity of metals with water or dilute acids is related to the tendency of the metal to form positive ions."),
  science("Year 10", "both", "Chemistry — Chemical changes", "Electrolysis", "Explain electrolysis of molten ionic liquids and aqueous ionic solutions."),
  science("Year 10", "both", "Chemistry — Energy changes", "Exothermic and endothermic reactions", "Explain exothermic and endothermic reactions, including reaction profiles."),
  science("Year 10", "both", "Physics — Energy", "Energy stores and transfers", "Describe energy changes in a system and the ways energy is stored before and after such changes."),
  science("Year 10", "both", "Physics — Energy", "Energy resources and efficiency", "Explain the relationship between energy resources, energy transfer and efficiency."),
  science("Year 10", "both", "Physics — Forces", "Forces and interactions", "Describe forces and their interactions, including resultant forces and equilibrium."),
  science("Year 10", "both", "Physics — Forces and motion", "Speed, velocity and acceleration", "Apply the relationships between distance, speed, time, velocity and acceleration."),
  science("Year 10", "both", "Physics — Electricity", "Current, potential difference and resistance", "Explain the relationships between current, potential difference and resistance in electrical circuits."),
  science("Year 10", "both", "Physics — Electricity", "Series and parallel circuits", "Describe and explain the behaviour of current, potential difference and resistance in series and parallel circuits."),
  science("Year 10", "both", "Physics — Electricity", "Mains electricity and the National Grid", "Explain domestic uses and safety of electricity and how electrical power is transferred by the National Grid."),
  science("Year 10", "both", "Physics — Particle model", "Density and changes of state", "Define density and explain differences in density between states of matter using particle arrangements."),
  science("Year 10", "both", "Physics — Atomic structure", "Nuclear atom and isotopes", "Describe the nuclear atom and relate differences between isotopes to their conventional representations."),
  science("Year 10", "both", "Physics — Atomic structure", "Radioactive decay and half-life", "Explain radioactive decay, half-life, penetration and the difference between contamination and irradiation."),

  // ── Combined Science: Year 11 ────────────────────────────────────────────
  science("Year 11", "both", "Biology — Coordination and control", "The nervous system and reflexes", "Explain how the structure of the nervous system and a reflex arc are adapted to their functions."),
  science("Year 11", "both", "Biology — Coordination and control", "Hormones and the endocrine system", "Describe the principles of hormonal coordination and control by the human endocrine system."),
  science("Year 11", "both", "Biology — Coordination and control", "Homeostasis and blood glucose", "Explain the importance of maintaining a constant internal environment and how insulin and glucagon control blood sugar levels."),
  science("Year 11", "both", "Biology — Ecosystems", "Ecosystem organisation", "Describe levels of organisation in an ecosystem and explain how abiotic and biotic factors affect communities."),
  science("Year 11", "both", "Biology — Ecosystems", "Carbon and water cycles", "Explain the importance of the carbon cycle and the water cycle to living organisms."),
  science("Year 11", "both", "Biology — Ecosystems", "Biodiversity and field investigations", "Describe a field investigation into distribution and abundance and explain the impact of human interactions on biodiversity."),
  science("Year 11", "both", "Biology — Inheritance", "DNA, genes and the genome", "Describe DNA as a polymer made up of two strands forming a double helix and describe the genome as an organism's genetic material."),
  science("Year 11", "both", "Biology — Inheritance", "Inheritance and genetic crosses", "Explain single gene inheritance and predict the results of single gene crosses."),
  science("Year 11", "both", "Biology — Inheritance", "Variation and natural selection", "Describe evolution as a change in inherited characteristics through natural selection."),
  science("Year 11", "both", "Biology — Inheritance", "Selective breeding and gene technology", "Explain the impact of selective breeding and describe the process, benefits and risks of genetic engineering."),
  science("Year 11", "both", "Chemistry — Rates and equilibrium", "Rates of reaction", "Explain factors that influence the rate of reaction, including catalysts, using collision theory."),
  science("Year 11", "both", "Chemistry — Rates and equilibrium", "Reversible reactions and equilibrium", "Explain reversible reactions and the concept of dynamic equilibrium."),
  science("Year 11", "both", "Chemistry — Chemical analysis", "Purity and separation", "Assess purity and separate mixtures using appropriate physical techniques."),
  science("Year 11", "both", "Chemistry — Chemical analysis", "Identifying ions and gases", "Use qualitative tests to identify selected gases and chemical substances."),
  science("Year 11", "higher", "Chemistry — Quantitative chemistry", "Moles and reacting masses", "Use amount of substance in relation to masses of pure substances and balanced equations."),
  science("Year 11", "both", "Chemistry — Chemical industries", "Life-cycle assessment and recycling", "Use life-cycle assessment to compare environmental impacts and explain the role of recycling."),
  science("Year 11", "both", "Chemistry — Chemical industries", "Crude oil and cracking", "Explain fractional distillation of crude oil and cracking of long-chain hydrocarbons."),
  science("Year 11", "both", "Chemistry — Earth science", "Earth's atmosphere and climate change", "Explain the evidence for, causes and consequences of climate change, including the role of greenhouse gases."),
  science("Year 11", "both", "Chemistry — Earth science", "Atmospheric pollutants", "Describe common atmospheric pollutants, their sources and their effects."),
  science("Year 11", "both", "Physics — Forces", "Work, energy and power", "Apply the relationship between work done, force, distance, energy transferred and power."),
  science("Year 11", "both", "Physics — Forces", "Momentum and stopping distance", "Explain momentum, factors affecting stopping distance and safety in public transport."),
  science("Year 11", "both", "Physics — Waves", "Waves in matter", "Describe waves in air, fluids and solids and apply the wave speed equation."),
  science("Year 11", "both", "Physics — Waves", "Light and electromagnetic waves", "Describe the electromagnetic spectrum and interactions of electromagnetic radiation with matter and their applications."),
  science("Year 11", "both", "Physics — Magnetism", "Magnetic fields and electromagnets", "Describe permanent and induced magnetism, magnetic fields and the magnetic effects of electric currents."),
  science("Year 11", "higher", "Physics — Magnetism", "Motor effect", "Describe the motor effect and explain how this force is used to cause rotation in electric motors."),
  science("Year 11", "both", "Working scientifically", "Planning an investigation", "Use scientific theories and explanations to develop hypotheses and plan experiments or procedures."),
  science("Year 11", "both", "Working scientifically", "Analysing data and evaluating methods", "Collect, present and analyse data, draw conclusions, and evaluate accuracy, precision, repeatability and reproducibility."),
  science("Year 11", "both", "Working scientifically", "Scientific diagrams and apparatus", "Use and produce appropriate scientific diagrams to set up and record apparatus and procedures."),
];

export function isGcseTopicCatalogueSubject(subject?: string): subject is GcseCatalogueSubject {
  const normalized = String(subject || "").trim().toLowerCase();
  return normalized === "mathematics" || normalized === "maths" || normalized === "science";
}

export function getGcseTopicChoices(
  subject: string,
  yearGroup: string,
  selectedTier?: string,
): GcseTopicChoice[] {
  const normalizedSubject = subject.trim().toLowerCase() === "maths" ? "mathematics" : subject.trim().toLowerCase();
  if ((normalizedSubject !== "mathematics" && normalizedSubject !== "science") || !/^Year (10|11)$/.test(yearGroup)) return [];
  const tier = selectedTier === "higher" ? "higher" : selectedTier === "foundation" ? "foundation" : "both";
  return GCSE_TOPIC_CATALOGUE.filter((entry) =>
    entry.subject === normalizedSubject
    && entry.yearGroup === yearGroup
    && (tier === "both" || entry.tier === "both" || entry.tier === tier),
  );
}

export function getGcseTopicChoiceByTopic(
  subject: string,
  yearGroup: string,
  topic: string,
): GcseTopicChoice | undefined {
  const normalizedSubject = subject.trim().toLowerCase() === "maths" ? "mathematics" : subject.trim().toLowerCase();
  return GCSE_TOPIC_CATALOGUE.find((entry) =>
    entry.subject === normalizedSubject
    && entry.yearGroup === yearGroup
    && entry.topic === topic,
  );
}

export function getGcseTopicChoiceById(id: string): GcseTopicChoice | undefined {
  return GCSE_TOPIC_CATALOGUE.find((entry) => entry.id === id);
}
