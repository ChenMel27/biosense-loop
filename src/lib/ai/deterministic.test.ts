import { describe, expect, it } from "vitest";

import { deterministicClassify } from "@/lib/ai/deterministic";

describe("deterministic safe fallback", () => {
  it("detects connected matter-and-energy reasoning", () => {
    const result = deterministicClassify(
      "Cellular respiration in the rabbit's cells releases usable energy from food. Carbon matter can move into carbon dioxide and return to the air, while energy flows through the ecosystem and some leaves as heat.",
    );
    expect(result.demonstratedIdeaIds).toContain("matter_path");
    expect(result.demonstratedIdeaIds).toContain("energy_flow");
    expect(result.demonstratedIdeaIds).toContain("cellular_respiration_role");
    expect(result.demonstratedIdeaIds).toContain("ecosystem_connection");
    expect(result.abstain).toBe(false);
  });

  it("routes matter-to-energy reasoning to a discriminating teacher prompt", () => {
    const result = deterministicClassify(
      "The food matter becomes energy inside the rabbit, so all of the carbon is used up completely.",
    );
    expect(result.possibleAlternativeConceptionIds).toContain(
      "matter_becomes_energy_or_disappears",
    );
    expect(result.recommendedPromptId).toBe("respiration_matter_energy_probe_01");
  });

  it("routes breathing-only reasoning to the cell-level distinction", () => {
    const result = deterministicClassify(
      "Respiration means breathing with the lungs, so it only happens when the rabbit breathes.",
    );
    expect(result.possibleAlternativeConceptionIds).toContain(
      "respiration_is_breathing_only",
    );
    expect(result.recommendedPromptId).toBe("respiration_breathing_probe_01");
  });

  it("abstains on insufficient evidence", () => {
    const result = deterministicClassify("It just works somehow.");
    expect(result.abstain).toBe(true);
    expect(result.recommendedPromptId).toBe("respiration_clarify_01");
  });
});
