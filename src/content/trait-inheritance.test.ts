import { describe, expect, it } from "vitest";

import { getFollowUpPrompt, traitInheritancePack } from "@/content/trait-inheritance";

const adaptivePromptIds = [
  "inheritance_gene_trait_probe_01",
  "inheritance_gene_information_probe_01",
  "inheritance_chromosome_probe_01",
  "inheritance_both_parents_probe_01",
  "inheritance_same_trait_both_parents_probe_01",
  "inheritance_acquired_trait_probe_01",
  "inheritance_evidence_probe_01",
  "inheritance_complete_check_01",
];

const alternativeConceptionIds = [
  "gene_is_the_trait",
  "genes_lack_hereditary_information",
  "genes_and_chromosomes_unrelated",
  "one_parent_determines_trait",
  "parents_contribute_different_traits",
  "acquired_trait_is_inherited",
];

describe("trait-inheritance frozen question bank", () => {
  it("contains exactly the approved adaptive prompt identifiers", () => {
    expect(traitInheritancePack.followUps.map((prompt) => prompt.id)).toEqual(
      adaptivePromptIds,
    );
    expect(traitInheritancePack.fallbackPrompt.id).toBe("inheritance_clarify_01");
    expect(traitInheritancePack.fixedReflectionPrompt.id).toBe(
      "control_reflection_01",
    );
  });

  it("contains exactly the approved alternative-conception identifiers", () => {
    expect(
      traitInheritancePack.alternativeConceptions.map((conception) => conception.id),
    ).toEqual(alternativeConceptionIds);
  });

  it("maps every student-facing prompt to declared research sources", () => {
    const sourceIds = new Set(
      traitInheritancePack.researchSources.map((source) => source.id),
    );
    const prompts = [
      ...traitInheritancePack.followUps,
      traitInheritancePack.fallbackPrompt,
      traitInheritancePack.fixedReflectionPrompt,
    ];

    for (const prompt of prompts) {
      expect(prompt.sourceIds?.length, prompt.id).toBeGreaterThan(0);
      for (const sourceId of prompt.sourceIds ?? []) {
        expect(sourceIds.has(sourceId), `${prompt.id}: ${sourceId}`).toBe(true);
      }
      expect(getFollowUpPrompt(prompt.id)?.text).toBe(prompt.text);
    }
  });

  it("uses a non-grading completion check for fully evidenced responses", () => {
    const prompt = getFollowUpPrompt("inheritance_complete_check_01");
    expect(prompt?.text).toContain("already includes the key scientific ideas");
    expect(prompt?.text).toContain("continue to the next example");
    expect(prompt?.text.toLowerCase()).not.toMatch(/grade|mastered|score/);
  });
});
