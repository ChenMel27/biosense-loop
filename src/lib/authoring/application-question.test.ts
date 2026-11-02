import { describe, expect, it } from "vitest";

import { applicationQuestionIssue } from "@/lib/authoring/application-question";

describe("application question review", () => {
  it("accepts a scenario-based explanation that asks for evidence", () => {
    expect(applicationQuestionIssue(
      "A plant gets light and water, but very little carbon dioxide reaches its leaves.",
      "Predict what will happen to glucose production and growth. Explain why and use one fact from the scenario as evidence.",
    )).toBe("");
  });

  it("blocks a definition-only question", () => {
    expect(applicationQuestionIssue(
      "Students have just learned about photosynthesis and plant growth.",
      "Define photosynthesis in your own words.",
    )).toMatch(/apply or explain/);
  });

  it("asks for an evidence connection when one is absent", () => {
    expect(applicationQuestionIssue(
      "Two plants grew in different conditions during a classroom investigation.",
      "Explain how light affects plant growth.",
    )).toMatch(/fact, detail, result, or observation/);
  });

  it("does not treat data mentioned only in the scenario as an evidence request", () => {
    expect(applicationQuestionIssue(
      "Students compare plant-growth data from two different light conditions.",
      "Explain how light affects plant growth and why the two plants grew differently.",
    )).toMatch(/fact, detail, result, or observation/);
  });
});
