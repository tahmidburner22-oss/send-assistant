/**
 * engines/index.ts — Adaptly Engine System
 *
 * Exports all 6 engines and the pipeline orchestrator.
 *
 * Architecture:
 * 1. Planner       — topic plan, section goals, question type sequencing
 * 2. Layout Engine — page templates, spacing rules, layout family assignment
 * 3. Diagram Engine — vector symbol library, auto-generation, validation
 * 4. Adaptation Engine — primary/SEND overlay rules
 * 5. Validator     — all checks before output
 * 6. Pipeline      — orchestrates all engines in the 10-stage flow
 */

export * from "./planner";
export * from "./layoutEngine";
export * from "./diagramEngine";
export * from "./adaptationEngine";
export * from "./validator";
export * from "./pipeline";
