import { describe, expect, it } from "vitest";

import { deterministicClassify } from "@/lib/ai/deterministic";

describe("deterministic safe fallback", () => {
  it("detects an evidence-linked inheritance explanation", () => {
    const result = deterministicClassify(
      "The bristle-shape gene is inherited information located on chromosome 3. The offspring received one b version from each parent, so it has b and b; the evidence shows that b and b beetles grow curved bristles.",
    );
    expect(result.demonstratedIdeaIds).toContain("gene_trait_information");
    expect(result.demonstratedIdeaIds).toContain("gene_on_chromosome");
    expect(result.demonstratedIdeaIds).toContain("both_parent_contributions");
    expect(result.demonstratedIdeaIds).toContain("evidence_linked_explanation");
    expect(result.abstain).toBe(false);
    expect(result.recommendedPromptId).toBe("inheritance_complete_check_01");
  });

  it("routes a gene-is-trait claim to a discriminating prompt", () => {
    const result = deterministicClassify(
      "The parents gave it curved bristles because the gene is curved bristles, so the visible trait itself was passed down.",
    );
    expect(result.possibleAlternativeConceptionIds).toContain("gene_is_the_trait");
    expect(result.recommendedPromptId).toBe("inheritance_gene_trait_probe_01");
  });

  it("routes one-parent reasoning to the parental-contribution prompt", () => {
    const result = deterministicClassify(
      "Only the mother determines this trait, because the offspring gets the bristle gene from only one parent.",
    );
    expect(result.possibleAlternativeConceptionIds).toContain(
      "one_parent_determines_trait",
    );
    expect(result.recommendedPromptId).toBe("inheritance_both_parents_probe_01");
  });

  it("routes a claim that genes lack hereditary information", () => {
    const result = deterministicClassify(
      "Only chromosomes carry information. Genes do not contain information about the bristle trait.",
    );
    expect(result.possibleAlternativeConceptionIds).toContain(
      "genes_lack_hereditary_information",
    );
    expect(result.recommendedPromptId).toBe(
      "inheritance_gene_information_probe_01",
    );
  });

  it("routes different-traits-by-parent reasoning", () => {
    const result = deterministicClassify(
      "The mother gives bristle shape and father gives a different trait, so only the mother matters for this gene.",
    );
    expect(result.possibleAlternativeConceptionIds).toContain(
      "parents_contribute_different_traits",
    );
    expect(result.recommendedPromptId).toBe(
      "inheritance_same_trait_both_parents_probe_01",
    );
  });

  it("abstains on insufficient evidence", () => {
    const result = deterministicClassify("It just works somehow.");
    expect(result.abstain).toBe(true);
    expect(result.recommendedPromptId).toBe("inheritance_clarify_01");
  });
});
