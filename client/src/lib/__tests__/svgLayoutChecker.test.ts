import { describe, expect, it } from "vitest";
import { checkSvgLayout } from "../svgLayoutChecker";

const canvas = `<svg viewBox="0 0 700 500"><rect x="0" y="0" width="700" height="500" fill="white"/>`;
const close = `</svg>`;

describe("SVG diagram hard gate", () => {
  it("rejects connector lines that cross or overlay each other", () => {
    const svg = `${canvas}
      <line x1="120" y1="120" x2="300" y2="300"/>
      <line x1="120" y1="300" x2="300" y2="120"/>
      ${close}`;

    const report = checkSvgLayout(svg);
    expect(report.pass).toBe(false);
    expect(report.issues.some(issue => issue.kind === "line-crossing")).toBe(true);
  });

  it("rejects text labels that do not keep the required clear margin", () => {
    const svg = `${canvas}
      <text x="80" y="100" text-anchor="start" font-size="14">Label one</text>
      <text x="110" y="100" text-anchor="start" font-size="14">Label two</text>
      ${close}`;

    const report = checkSvgLayout(svg);
    expect(report.pass).toBe(false);
    expect(report.issues.some(issue => issue.kind === "text-overlaps-text")).toBe(true);
  });

  it("accepts the required structural relationships in a Pythagoras diagram", () => {
    const svg = `${canvas}
      <polygon points="200,400 480,400 200,130" fill="none"/>
      <text x="340" y="445" text-anchor="middle" font-size="14">a</text>
      <text x="100" y="260" text-anchor="middle" font-size="14">b</text>
      <text x="560" y="260" text-anchor="middle" font-size="14">c</text>
      <text x="580" y="360" text-anchor="middle" font-size="14">a² + b² = c²</text>
      ${close}`;

    const report = checkSvgLayout(svg, { subject: "mathematics", topic: "Pythagoras theorem" });
    expect(report.issues.filter(issue => issue.kind === "semantic-inaccuracy")).toEqual([]);
  });

  it("rejects a Pythagoras SVG that is missing a side label or equation", () => {
    const svg = `${canvas}
      <polygon points="200,400 480,400 200,130" fill="none"/>
      <text x="340" y="445" text-anchor="middle" font-size="14">a</text>
      <text x="100" y="260" text-anchor="middle" font-size="14">b</text>
      ${close}`;

    const report = checkSvgLayout(svg, { subject: "maths", topic: "Pythagoras theorem" });
    expect(report.pass).toBe(false);
    expect(report.issues.some(issue => issue.kind === "semantic-inaccuracy")).toBe(true);
  });
});
