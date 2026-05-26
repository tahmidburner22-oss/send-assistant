/**
 * KS3 Physics — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 Science Programme of Study. Diagrams introduce
 * forces, energy stores, waves, electricity and space at the level pupils
 * meet on the way to GCSE.
 *
 * Target: ~80 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Physics", year_band: "KS3" };
const STYLE_PHYS =
  "Black-and-white circuit / ray / force diagram, arrows in red, labels in 12pt sans-serif";
const TAGS_KS3 = ["KS3", "physics", "national-curriculum"];

export function build(ctx) {
  // ── Forces and motion ────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Forces",
    year_group: "Year 7",
    description: "Force-diagram visual for KS3.",
    style_notes: STYLE_PHYS,
    tags: [...TAGS_KS3, "forces", "free-body"],
  }, [
    "Free-body diagram — book on a table (weight, normal contact)",
    "Free-body diagram — ball falling through air (weight, drag)",
    "Free-body diagram — car accelerating (thrust, drag, weight, normal)",
    "Free-body diagram — boat floating (weight, upthrust)",
    "Balanced vs unbalanced forces — two-arrow contrast",
    "Resultant force — co-linear arrows added head-to-tail",
    "Tension force — rope pulling a sledge",
    "Friction force — block on a rough vs smooth surface",
    "Weight vs mass — kg vs N gravitational-field card",
    "Hooke's law — spring extension graph (linear region)",
    "Hooke's law apparatus — spring, ruler, masses",
    "Stretching a spring — limit of proportionality diagram",
    "Newton's First Law — moving / stationary card",
    "Newton's Third Law — action-reaction pair (rocket and exhaust)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Motion graphs",
    year_group: "Year 8",
    description: "Distance/time or speed/time graph for KS3.",
    style_notes: "Black axes with arrows, gridlines, line in coloured pen",
    tags: [...TAGS_KS3, "motion", "graphs"],
  }, [
    "Distance-time graph — at rest (horizontal line)",
    "Distance-time graph — constant speed (straight upward line)",
    "Distance-time graph — speeding up (curve upwards)",
    "Distance-time graph — slowing down (curve flattening)",
    "Distance-time graph — return journey",
    "Speed-time graph — constant acceleration (straight)",
    "Speed-time graph — constant velocity (horizontal)",
    "Speed-time graph — deceleration (downward)",
    "Speed-time graph — three stages combined",
    "Average speed worked example — total distance / total time",
  ]);

  // ── Energy ───────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Energy",
    year_group: "Year 7",
    description: "Energy-store and transfer diagram for KS3.",
    style_notes: "Coloured store-pots with label, arrows for transfers (labelled by mechanism)",
    tags: [...TAGS_KS3, "energy", "stores"],
  }, [
    "Eight energy stores poster — kinetic / gravitational / elastic / thermal / chemical / nuclear / magnetic / electrostatic",
    "Energy transfer diagram — torch (chemical → electrical → light)",
    "Energy transfer diagram — kettle (electrical → thermal)",
    "Energy transfer diagram — falling ball (gravitational → kinetic)",
    "Energy transfer diagram — pendulum swinging",
    "Sankey diagram — light bulb (electrical → light + heat)",
    "Sankey diagram — power station efficiency",
    "Conduction in a metal rod — particle vibration arrows",
    "Convection — liquid in a beaker, current arrows",
    "Radiation — black vs silver surfaces (heat)",
    "Insulator vs conductor — house energy escape diagram",
  ]);

  // ── Waves ────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Waves",
    year_group: "Year 8",
    description: "Wave-property diagram for KS3.",
    style_notes: "Sine-wave outline, amplitude / wavelength / frequency arrows in coloured pen",
    tags: [...TAGS_KS3, "waves"],
  }, [
    "Transverse wave — labelled wavelength, amplitude, crest, trough",
    "Longitudinal wave — compressions and rarefactions",
    "Sound wave — labelled compression and rarefaction",
    "Light wave vs sound wave — comparison card",
    "Higher pitch / lower pitch — frequency comparison",
    "Loud vs quiet — amplitude comparison",
    "Echo — sound bouncing off a cliff",
    "Reflection of light — angle of incidence = angle of reflection",
    "Refraction of light — bending into a denser medium",
    "Pinhole camera diagram — labelled image",
    "Periscope diagram — two-mirror light path",
    "Shadow formation — opaque object in light beam",
    "Total internal reflection — fibre-optic cable",
    "Electromagnetic spectrum — KS3 strip with everyday uses",
    "Eye anatomy — KS3 labelled (cornea, lens, retina, optic nerve)",
    "Ear anatomy — KS3 labelled (outer, middle, inner)",
  ]);

  // ── Electricity and magnetism ────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Electricity",
    year_group: "Year 8",
    description: "KS3 circuit diagram with standard symbols.",
    style_notes: STYLE_PHYS,
    tags: [...TAGS_KS3, "electricity", "circuits"],
  }, [
    "Circuit symbol card — cell",
    "Circuit symbol card — battery",
    "Circuit symbol card — switch (open / closed)",
    "Circuit symbol card — bulb / lamp",
    "Circuit symbol card — resistor (fixed)",
    "Circuit symbol card — variable resistor",
    "Circuit symbol card — voltmeter",
    "Circuit symbol card — ammeter",
    "Circuit symbol card — diode / LED",
    "Circuit symbol card — fuse",
    "Series circuit — two bulbs and an ammeter",
    "Parallel circuit — two bulbs each in own branch",
    "Series vs parallel — KS3 comparison card",
    "Voltage in series — adds across components",
    "Current in series — same throughout",
    "Current in parallel — splits between branches",
    "Current and voltage rules summary card",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Magnetism",
    year_group: "Year 8",
    description: "Magnet / magnetic-field diagram for KS3.",
    style_notes: STYLE_PHYS,
    tags: [...TAGS_KS3, "magnetism"],
  }, [
    "Bar magnet — N and S poles labelled, field lines drawn",
    "Two magnets attracting (N–S)",
    "Two magnets repelling (N–N)",
    "Magnetic field around a bar magnet — iron filings pattern",
    "Earth's magnetic field — geographic vs magnetic north",
    "Plotting compass around a bar magnet — eight positions",
    "Solenoid (electromagnet) — field lines through a coil",
    "Electromagnet apparatus — iron core, coil, cell, switch",
    "Strengthening an electromagnet — variables list card",
  ]);

  // ── Space ────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Space",
    year_group: "Year 9",
    description: "Space-physics diagram for KS3.",
    style_notes: "Stars as small white dots on dark navy, orbits dashed",
    tags: [...TAGS_KS3, "space", "astronomy"],
  }, [
    "Solar system — eight planets with relative sizes",
    "Day and night — Earth rotation",
    "Seasons — Earth's tilt around the Sun (four positions)",
    "Phases of the Moon — eight-stage circular layout",
    "Solar eclipse vs lunar eclipse comparison",
    "Geocentric vs heliocentric model card",
    "Star life cycle — KS3 simplified (nebula → main sequence → giant → end)",
    "Galaxy types — spiral / elliptical / irregular",
    "Asteroid belt and comets diagram",
    "Satellites — natural vs artificial",
  ]);
}
