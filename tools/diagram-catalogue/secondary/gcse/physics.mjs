/**
 * GCSE Physics — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel, OCR Gateway/21st-Century, WJEC and
 * Cambridge International GCSE Physics specifications. Heavy-priority
 * GCSE families flagged in the brief: ray diagrams (mirror / lens), wave
 * properties, circuits with V/A meters, motion graphs (s-t, v-t, a-t),
 * forces free-body diagrams, EM spectrum strip, transformers, half-life
 * decay curves.
 *
 * Target: ~150 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Physics", year_band: "GCSE" };
const STYLE_PHYS =
  "Black-and-white circuit / ray / force diagram, arrows in red, labels in 12pt sans-serif, exam-paper feel";
const TAGS = ["GCSE", "physics"];

export function build(ctx) {
  // ── Forces and motion ────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Forces",
    year_group: "Year 10",
    description: "Force / free-body diagram for GCSE.",
    style_notes: STYLE_PHYS,
    tags: [...TAGS, "forces", "free-body"],
  }, [
    "Free-body diagram — book on a table",
    "Free-body diagram — car at constant velocity",
    "Free-body diagram — car accelerating",
    "Free-body diagram — car braking",
    "Free-body diagram — skydiver before parachute opens",
    "Free-body diagram — skydiver at terminal velocity",
    "Free-body diagram — skydiver after parachute opens",
    "Free-body diagram — block on an inclined plane",
    "Free-body diagram — boat with engine and water resistance",
    "Free-body diagram — pulley system, two masses",
    "Resultant force — co-linear arrows",
    "Resultant force — using a vector triangle (higher tier)",
    "Vector vs scalar — examples table",
    "Hooke's law — force vs extension graph (linear region with limit)",
    "Hooke's law — apparatus diagram",
    "Required practical — Hooke's law spring extension",
    "Newton's First Law — equilibrium card",
    "Newton's Second Law — F = ma triangle",
    "Newton's Third Law — action-reaction pair (rocket and exhaust)",
    "Centre of mass — irregular shape suspension method",
    "Moments — see-saw with two masses",
    "Moments — principle of moments worked card",
    "Levers — first / second / third class",
    "Gears — gear-ratio diagram",
    "Pulley — single fixed vs single movable",
    "Hydraulic systems — pressure transmission diagram",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Motion",
    year_group: "Year 10",
    description: "Motion-graph or kinematics diagram for GCSE.",
    style_notes: "Black axes with arrows, gridlines, line in coloured pen, gradient annotations",
    tags: [...TAGS, "motion", "graphs"],
  }, [
    "Distance-time graph — at rest (horizontal)",
    "Distance-time graph — constant speed (straight line)",
    "Distance-time graph — speeding up (concave up)",
    "Distance-time graph — slowing down (concave down)",
    "Distance-time graph — return journey (V-shape)",
    "Distance-time graph — finding speed from gradient",
    "Velocity-time graph — constant acceleration",
    "Velocity-time graph — constant velocity",
    "Velocity-time graph — deceleration",
    "Velocity-time graph — three stages combined",
    "Velocity-time graph — area under = displacement",
    "Velocity-time graph — gradient = acceleration",
    "Acceleration-time graph — at rest, accelerating, constant velocity",
    "Suvat equations card — five named equations",
    "Suvat — finding final velocity using v² = u² + 2as",
    "Stopping distance — thinking + braking distance bar",
    "Stopping distance — factors affecting each part chart",
    "Reaction time — ruler-drop method",
    "Required practical — investigating acceleration with a ramp and trolley",
    "Light gates and data logger setup",
  ]);

  // ── Energy ───────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Energy",
    year_group: "Year 10",
    description: "Energy-store / transfer / efficiency diagram for GCSE.",
    style_notes: "Coloured store-pots, transfer arrows labelled by mechanism (mechanical, heating, radiation, electrical)",
    tags: [...TAGS, "energy"],
  }, [
    "Eight energy stores poster — kinetic / gravitational / elastic / thermal / chemical / nuclear / magnetic / electrostatic",
    "Energy transfer arrow card — four mechanisms (mechanical, heating, radiation, electrical)",
    "Energy transfer — falling ball (gravitational → kinetic)",
    "Energy transfer — pendulum (kinetic ↔ gravitational)",
    "Energy transfer — bow and arrow (elastic → kinetic)",
    "Energy transfer — electric kettle (electrical → thermal)",
    "Energy transfer — nuclear power station chain",
    "Sankey diagram — light bulb",
    "Sankey diagram — power station (60% waste heat)",
    "Sankey diagram — car engine",
    "Efficiency formula card — useful / total × 100%",
    "Conduction in a metal — particle vibration arrows",
    "Convection currents in a beaker — labelled",
    "Radiation — black vs silver surface absorption / emission",
    "Required practical — investigating insulators (specific heat capacity)",
    "Required practical — specific heat capacity (water + immersion heater)",
    "Specific heat capacity formula triangle",
    "Specific latent heat formula card",
    "Heating curve — labelled with melting and boiling plateaus",
    "Renewable vs non-renewable energy resources comparison table",
    "Wind turbine — labelled with energy transfers",
    "Hydroelectric dam — labelled cross-section",
    "Tidal barrage — labelled",
    "Solar panel (PV) vs solar water heater comparison",
    "Geothermal energy — labelled cross-section",
    "Biomass power station — labelled",
  ]);

  // ── Waves ────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Waves",
    year_group: "Year 10",
    description: "Wave-properties / EM spectrum diagram for GCSE.",
    style_notes: "Sine wave with amplitude / wavelength / period arrows in coloured pen",
    tags: [...TAGS, "waves"],
  }, [
    "Transverse wave — labelled (wavelength, amplitude, crest, trough, period)",
    "Longitudinal wave — labelled (compressions, rarefactions, wavelength)",
    "Wave equation — v = fλ triangle",
    "Frequency vs period — relationship card (T = 1/f)",
    "Required practical — measuring wave speed on a string",
    "Required practical — measuring wave speed in water (ripple tank)",
    "Reflection of waves — angle of incidence equals angle of reflection",
    "Refraction at an interface — bending towards/away from normal",
    "Refraction wavefronts — slowing down in denser medium",
    "Total internal reflection — critical angle and beyond",
    "Optical fibre — total internal reflection diagram",
    "EM spectrum — full strip (radio, microwave, infrared, visible, UV, X-ray, gamma)",
    "EM spectrum — frequency and wavelength order with everyday uses",
    "EM spectrum — example uses card per band",
    "Visible spectrum — colour order with wavelengths",
    "Producing radio waves — oscillating electrons in an aerial",
    "Sound waves — compression / rarefaction in air",
    "Sound waves — frequency vs pitch / amplitude vs loudness",
    "Echo / pulse-echo — distance from time delay",
    "Ultrasound — medical scanning and industrial flaw detection",
    "Doppler effect — pitch change of an ambulance",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Optics — ray diagrams",
    year_group: "Year 11",
    description: "Ray-diagram for GCSE optics.",
    style_notes: "Solid arrowheads on rays, dashed for virtual rays, principal axis line",
    tags: [...TAGS, "optics", "ray-diagrams"],
  }, [
    "Ray diagram — plane mirror, virtual image",
    "Ray diagram — concave (converging) mirror, object beyond focal point",
    "Ray diagram — concave mirror, object at focal point",
    "Ray diagram — concave mirror, object inside focal point (virtual image)",
    "Ray diagram — convex (diverging) mirror, virtual image",
    "Ray diagram — converging lens, object beyond 2F",
    "Ray diagram — converging lens, object at 2F",
    "Ray diagram — converging lens, object between F and 2F",
    "Ray diagram — converging lens, object at F (image at infinity)",
    "Ray diagram — converging lens, object inside F (virtual magnified image)",
    "Ray diagram — diverging lens, virtual diminished image",
    "Magnification formula card — image height / object height",
    "Camera lens vs eye lens — comparison card",
  ]);

  // ── Electricity ──────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Electricity",
    year_group: "Year 10",
    description: "Circuit diagram with standard symbols.",
    style_notes: STYLE_PHYS,
    tags: [...TAGS, "electricity", "circuits"],
  }, [
    "Circuit symbol poster — full GCSE set",
    "Series circuit — single loop with cell, switch, lamp, ammeter",
    "Series circuit — adding a voltmeter in parallel with one component",
    "Parallel circuit — two lamps each in own branch",
    "Parallel circuit — three branches with switches",
    "Series — current is the same throughout (rule card)",
    "Parallel — current splits between branches (rule card)",
    "Series — voltage adds across components (rule card)",
    "Parallel — voltage is the same across each branch",
    "I-V characteristic — fixed resistor (straight line through origin)",
    "I-V characteristic — filament lamp (S-shape)",
    "I-V characteristic — diode (one-way conduction)",
    "Required practical — I-V characteristics of a fixed resistor / filament lamp / diode",
    "Required practical — investigating resistance of a wire",
    "Required practical — series and parallel resistance comparison",
    "Resistance — V = IR triangle",
    "Power formula card — P = VI and P = I²R",
    "Energy transferred — E = Pt and E = QV",
    "LDR — resistance vs light intensity graph",
    "Thermistor — resistance vs temperature graph",
    "Mains electricity — three-pin plug labelled (live, neutral, earth, fuse)",
    "AC vs DC — oscilloscope traces",
    "Earth wire — fault current path diagram",
    "Fuse and circuit breaker comparison",
    "Power station — energy transfers diagram",
    "National Grid — schematic with step-up and step-down transformers",
    "Step-up transformer — turns ratio diagram",
    "Step-down transformer — turns ratio diagram",
    "Transformer — Vs/Vp = Ns/Np card",
    "Transformer — power input = power output (efficient transformer)",
    "Static electricity — charging by friction",
    "Static electricity — like / unlike charges",
    "Electric field around a point charge",
  ]);

  // ── Particle model and matter ────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Particle model of matter",
    year_group: "Year 10",
    description: "Particle / states-of-matter diagram for GCSE Physics.",
    style_notes: "Coloured particles in container outline, motion arrows",
    tags: [...TAGS, "particle-model", "states"],
  }, [
    "Particle arrangement — solid, liquid, gas comparison",
    "State changes — melting, freezing, evaporating, condensing, sublimation",
    "Density formula triangle — ρ = m/V",
    "Required practical — density of regular and irregular solids",
    "Required practical — density of a liquid",
    "Internal energy — kinetic + potential of particles card",
    "Specific heat capacity — formula and units",
    "Specific latent heat of fusion / vaporisation card",
    "Pressure in a gas — particle collisions diagram",
    "Pressure-volume relationship — Boyle's law graph",
    "Temperature and gas pressure — particle motion diagram",
  ]);

  // ── Atomic / nuclear physics ────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Atomic and nuclear physics",
    year_group: "Year 11",
    description: "Nuclear / radioactivity diagram for GCSE.",
    style_notes: "Nucleus in red, particles labelled, decay arrows",
    tags: [...TAGS, "nuclear", "radioactivity"],
  }, [
    "Atomic structure — labelled atom (proton, neutron, electron, shells)",
    "History of the atom timeline — Dalton → Thomson → Rutherford → Bohr → Chadwick",
    "Plum-pudding vs nuclear-model card",
    "Rutherford gold-foil experiment — apparatus and outcomes",
    "Isotope notation — ²³⁵U vs ²³⁸U card",
    "Alpha particle — composition and properties card",
    "Beta particle — composition and properties card",
    "Gamma ray — composition and properties card",
    "Penetration of α / β / γ — paper / aluminium / lead",
    "Ionising power comparison card",
    "Alpha decay — example equation",
    "Beta-minus decay — example equation",
    "Gamma decay — example diagram",
    "Half-life decay curve — labelled with multiple half-lives",
    "Half-life — finding the half-life from a graph",
    "Half-life — calculation from initial activity",
    "Background radiation sources — pie chart",
    "Uses of radiation — sterilising, smoke alarm, tracer, treatment",
    "Nuclear fission — chain-reaction diagram",
    "Nuclear fission — controlled vs uncontrolled",
    "Nuclear reactor — labelled (fuel rods, control rods, moderator, coolant)",
    "Nuclear fusion — D + T → He + n + energy",
    "Risks of radiation — contamination vs irradiation card",
  ]);

  // ── Magnetism and electromagnetism ───────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Magnetism and electromagnetism",
    year_group: "Year 11",
    description: "Magnetic-field / electromagnet diagram for GCSE.",
    style_notes: STYLE_PHYS,
    tags: [...TAGS, "magnetism", "electromagnetism"],
  }, [
    "Bar magnet field lines — labelled with N and S",
    "Two bar magnets — attracting (N–S)",
    "Two bar magnets — repelling (N–N)",
    "Earth's magnetic field — geographic vs magnetic poles",
    "Plotting compass around a bar magnet",
    "Solenoid — field lines and right-hand grip rule",
    "Electromagnet — iron core in a coil with switch",
    "Strengthening an electromagnet — variables card",
    "Motor effect — Fleming's left-hand rule",
    "Force on a wire in a magnetic field — F = BIL card",
    "DC motor — labelled (split-ring commutator, brushes)",
    "Generator effect — moving wire in a magnetic field",
    "AC generator — labelled (slip rings, brushes)",
    "Transformer — labelled (primary, secondary, soft iron core)",
    "Transformer step-up vs step-down comparison",
  ]);

  // ── Space (where on spec) ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Space physics",
    year_group: "Year 11",
    description: "Astronomy / cosmology diagram for GCSE (where on spec).",
    style_notes: "Stars as small white dots on dark navy, orbits dashed",
    tags: [...TAGS, "space", "astronomy"],
  }, [
    "Solar system — relative orbital distances",
    "Star life cycle — low-mass route to white dwarf",
    "Star life cycle — high-mass route to neutron star / black hole",
    "Hertzsprung-Russell diagram — labelled regions",
    "Red shift — galaxy spectrum shifted to red",
    "Hubble's law — recession velocity vs distance",
    "Big Bang model — timeline since origin",
    "Cosmic microwave background — evidence card",
    "Geostationary satellite vs polar orbit comparison",
  ]);
}
