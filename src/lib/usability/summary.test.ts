import { describe, expect, it } from "vitest";

import { simulatedClass } from "@/content/simulated-class";
import { traitInheritancePack } from "@/content/trait-inheritance";
import { buildSimulatedSummary, calculateSusScore } from "@/lib/usability/summary";

describe("teacher usability study fixtures", () => {
  it("contains a varied simulated class with only allowed prompt ids", () => {
    expect(simulatedClass).toHaveLength(18);
    const allowed = new Set([
      ...traitInheritancePack.followUps.map((prompt) => prompt.id),
      traitInheritancePack.fallbackPrompt.id,
    ]);
    for (const item of simulatedClass) {
      expect(allowed.has(item.classification.displayedPromptId)).toBe(true);
      expect(item.classification.provenance).toBe("frozen_ai_output");
      expect(item.classification.reasonCodes?.length).toBeGreaterThan(0);
    }
    expect(simulatedClass.some((item) => item.classification.possibleAlternativeConceptionIds.length > 0)).toBe(true);
    expect(simulatedClass.some((item) => item.classification.missingIdeaIds.length === 0)).toBe(true);
    expect(simulatedClass.some((item) => item.classification.displayedPromptId === traitInheritancePack.fallbackPrompt.id)).toBe(true);
  });

  it("creates an ordered class summary", () => {
    const summary = buildSimulatedSummary(simulatedClass);
    expect(summary.length).toBeGreaterThan(4);
    expect(summary[0].count).toBeGreaterThanOrEqual(summary[1].count);
  });

  it("scores the standard usability scale", () => {
    expect(calculateSusScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
    expect(calculateSusScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50);
  });
});
