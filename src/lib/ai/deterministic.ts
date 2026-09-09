import { traitInheritancePack } from "@/content/trait-inheritance";
import type { ClassificationResult } from "@/lib/domain/types";

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function deterministicClassify(response: string): ClassificationResult {
  const text = response.toLowerCase();
  const demonstratedIdeaIds: string[] = [];
  const possibleAlternativeConceptionIds: string[] = [];

  if (
    includesAny(text, ["gene", "genes", "gene version", "b version", "inherited information"]) &&
    includesAny(text, ["information", "trait", "bristle", "shape", "curved", "straight"])
  ) {
    demonstratedIdeaIds.push("gene_trait_information");
  }

  if (
    includesAny(text, ["gene", "gene version", "bristle-shape"]) &&
    includesAny(text, ["chromosome", "chromosome 3", "located", "position", "carried"])
  ) {
    demonstratedIdeaIds.push("gene_on_chromosome");
  }

  if (
    includesAny(text, ["both parents", "each parent", "one from each", "parent 1", "parent 2"]) ||
    (includesAny(text, ["mother", "mom", "maternal"]) &&
      includesAny(text, ["father", "dad", "paternal"]))
  ) {
    demonstratedIdeaIds.push("both_parent_contributions");
  }

  if (
    includesAny(text, ["b and b", "b/b", "two b", "bb"]) &&
    includesAny(text, ["curved", "bristle"]) &&
    includesAny(text, ["because", "so", "therefore", "evidence", "shows", "supports"])
  ) {
    demonstratedIdeaIds.push("evidence_linked_explanation");
  }

  if (
    includesAny(text, [
      "the gene is the trait",
      "gene is curved bristles",
      "gene is the curved bristle",
      "passed down curved bristles",
      "parents gave it curved bristles",
    ])
  ) {
    possibleAlternativeConceptionIds.push("gene_is_the_trait");
  }

  if (
    includesAny(text, [
      "genes do not carry information",
      "genes do not contain information",
      "genes have no hereditary information",
      "only chromosomes contain information",
      "only chromosomes carry information",
    ])
  ) {
    possibleAlternativeConceptionIds.push("genes_lack_hereditary_information");
  }

  if (
    includesAny(text, [
      "genes are not on chromosomes",
      "gene is not on the chromosome",
      "genes and chromosomes are separate",
      "chromosomes do not carry genes",
      "chromosome does not carry the gene",
    ])
  ) {
    possibleAlternativeConceptionIds.push("genes_and_chromosomes_unrelated");
  }

  if (
    includesAny(text, [
      "only one parent",
      "only the mother",
      "only the mom",
      "only the father",
      "only the dad",
      "comes from the same-sex parent",
      "comes from the parent of the same sex",
    ])
  ) {
    possibleAlternativeConceptionIds.push("one_parent_determines_trait");
  }

  if (
    includesAny(text, [
      "mother gives bristle shape and father gives",
      "mom gives bristle shape and dad gives",
      "father gives bristle shape and mother gives",
      "dad gives bristle shape and mom gives",
      "one parent gives bristle shape and the other gives",
      "each parent gives a different trait",
    ])
  ) {
    possibleAlternativeConceptionIds.push("parents_contribute_different_traits");
  }

  if (
    includesAny(text, [
      "trimmed bristles are inherited",
      "cut bristles are inherited",
      "offspring will have trimmed bristles",
      "changes during life are passed down",
      "acquired traits are inherited",
    ])
  ) {
    possibleAlternativeConceptionIds.push("acquired_trait_is_inherited");
  }

  const allIdeaIds = traitInheritancePack.ideas.map((idea) => idea.id);
  const missingIdeaIds = allIdeaIds.filter((id) => !demonstratedIdeaIds.includes(id));

  let recommendedPromptId = traitInheritancePack.fallbackPrompt.id;
  if (possibleAlternativeConceptionIds.includes("gene_is_the_trait")) {
    recommendedPromptId = "inheritance_gene_trait_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("genes_lack_hereditary_information")) {
    recommendedPromptId = "inheritance_gene_information_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("genes_and_chromosomes_unrelated")) {
    recommendedPromptId = "inheritance_chromosome_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("parents_contribute_different_traits")) {
    recommendedPromptId = "inheritance_same_trait_both_parents_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("one_parent_determines_trait")) {
    recommendedPromptId = "inheritance_both_parents_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("acquired_trait_is_inherited")) {
    recommendedPromptId = "inheritance_acquired_trait_probe_01";
  } else if (missingIdeaIds.includes("gene_trait_information")) {
    recommendedPromptId = "inheritance_gene_trait_probe_01";
  } else if (missingIdeaIds.includes("gene_on_chromosome")) {
    recommendedPromptId = "inheritance_chromosome_probe_01";
  } else if (missingIdeaIds.includes("both_parent_contributions")) {
    recommendedPromptId = "inheritance_both_parents_probe_01";
  } else if (missingIdeaIds.includes("evidence_linked_explanation")) {
    recommendedPromptId = "inheritance_evidence_probe_01";
  } else {
    recommendedPromptId = "inheritance_complete_check_01";
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const abstain = wordCount < 7;

  return {
    demonstratedIdeaIds,
    missingIdeaIds,
    possibleAlternativeConceptionIds,
    classificationConfidence: abstain
      ? 0.35
      : Math.min(0.85, 0.5 + demonstratedIdeaIds.length * 0.08),
    recommendedPromptId: abstain
      ? traitInheritancePack.fallbackPrompt.id
      : recommendedPromptId,
    abstain,
    reasonCodes: abstain
      ? ["too_short", "insufficient_evidence"]
      : possibleAlternativeConceptionIds.length
        ? ["contradictory_statement", "missing_relationship"]
        : demonstratedIdeaIds.length
          ? ["explicit_evidence", "missing_relationship"]
          : ["insufficient_evidence"],
  };
}
