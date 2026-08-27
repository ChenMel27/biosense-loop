import { selectivePermeabilityPack } from "@/content/selective-permeability";
import type { ClassificationResult } from "@/lib/domain/types";

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function deterministicClassify(response: string): ClassificationResult {
  const text = response.toLowerCase();
  const demonstratedIdeaIds: string[] = [];
  const possibleAlternativeConceptionIds: string[] = [];

  if (
    includesAny(text, ["some", "certain", "selective", "not all", "limits"]) &&
    includesAny(text, ["cross", "pass", "move", "enter", "leave"])
  ) {
    demonstratedIdeaIds.push("selective_boundary");
  }

  if (
    includesAny(text, ["protein", "channel", "carrier", "charge", "polar", "lipid"])
  ) {
    demonstratedIdeaIds.push("substance_and_membrane_properties");
  }

  if (
    includesAny(text, ["concentration", "more outside", "more inside", "high to low"])
  ) {
    demonstratedIdeaIds.push("concentration_gradient");
  }

  if (
    includesAny(text, ["waste", "oxygen", "glucose", "balance", "condition", "function", "energy"]) &&
    includesAny(text, ["inside", "cell", "remove", "need", "maintain"])
  ) {
    demonstratedIdeaIds.push("system_effect");
  }

  if (includesAny(text, ["nothing can", "blocks everything", "cannot cross", "no substance"])) {
    possibleAlternativeConceptionIds.push("membrane_blocks_everything");
  }

  if (includesAny(text, ["everything can", "anything can", "all substances cross", "all molecules pass"])) {
    possibleAlternativeConceptionIds.push("membrane_allows_everything");
  }

  if (
    includesAny(text, ["only size", "just size", "smaller passes", "large cannot"]) &&
    !includesAny(text, ["protein", "channel", "charge", "concentration"])
  ) {
    possibleAlternativeConceptionIds.push("size_only");
  }

  const allIdeaIds = selectivePermeabilityPack.ideas.map((idea) => idea.id);
  const missingIdeaIds = allIdeaIds.filter((id) => !demonstratedIdeaIds.includes(id));

  let recommendedPromptId = "membrane_clarify_01";
  if (possibleAlternativeConceptionIds.includes("membrane_blocks_everything")) {
    recommendedPromptId = "membrane_not_all_or_none_01";
  } else if (
    possibleAlternativeConceptionIds.includes("membrane_allows_everything") ||
    possibleAlternativeConceptionIds.includes("size_only") ||
    missingIdeaIds.includes("substance_and_membrane_properties")
  ) {
    recommendedPromptId = "membrane_properties_01";
  } else if (missingIdeaIds.includes("concentration_gradient")) {
    recommendedPromptId = "membrane_gradient_01";
  } else if (missingIdeaIds.includes("system_effect")) {
    recommendedPromptId = "membrane_system_effect_01";
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const abstain = wordCount < 7;

  return {
    demonstratedIdeaIds,
    missingIdeaIds,
    possibleAlternativeConceptionIds,
    classificationConfidence: abstain ? 0.35 : Math.min(0.85, 0.5 + demonstratedIdeaIds.length * 0.08),
    recommendedPromptId: abstain
      ? selectivePermeabilityPack.fallbackPrompt.id
      : recommendedPromptId,
    abstain,
    reasonCodes: abstain
      ? ["too_short", "insufficient_evidence"]
      : demonstratedIdeaIds.length
        ? ["explicit_evidence", "missing_relationship"]
        : ["insufficient_evidence"],
  };
}

