import { describe, expect, it } from "vitest";

import { deterministicClassify } from "@/lib/ai/deterministic";

describe("deterministic safe fallback", () => {
  it("detects connected selective-boundary reasoning", () => {
    const result = deterministicClassify(
      "The selective membrane lets some substances move through protein channels. Oxygen and waste movement helps keep conditions inside the cell balanced.",
    );
    expect(result.demonstratedIdeaIds).toContain("selective_boundary");
    expect(result.demonstratedIdeaIds).toContain("substance_and_membrane_properties");
    expect(result.demonstratedIdeaIds).toContain("system_effect");
    expect(result.abstain).toBe(false);
  });

  it("routes an all-blocking conception to a discriminating teacher prompt", () => {
    const result = deterministicClassify(
      "The membrane blocks everything so no substance can cross into or out of the cell at all.",
    );
    expect(result.possibleAlternativeConceptionIds).toContain("membrane_blocks_everything");
    expect(result.recommendedPromptId).toBe("membrane_not_all_or_none_01");
  });

  it("abstains on insufficient evidence", () => {
    const result = deterministicClassify("It just works somehow.");
    expect(result.abstain).toBe(true);
    expect(result.recommendedPromptId).toBe("membrane_clarify_01");
  });
});

