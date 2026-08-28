import { cellularRespirationPack } from "@/content/cellular-respiration";
import type { ClassificationResult } from "@/lib/domain/types";

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function deterministicClassify(response: string): ClassificationResult {
  const text = response.toLowerCase();
  const demonstratedIdeaIds: string[] = [];
  const possibleAlternativeConceptionIds: string[] = [];

  if (
    includesAny(text, ["matter", "carbon", "atom", "molecule", "food"]) &&
    includesAny(text, ["carbon dioxide", "body", "waste", "soil", "air", "rearrange", "move"])
  ) {
    demonstratedIdeaIds.push("matter_path");
  }

  if (
    includesAny(text, ["energy", "chemical energy"]) &&
    includesAny(text, ["flow", "transfer", "use", "heat", "move", "stay alive", "function"])
  ) {
    demonstratedIdeaIds.push("energy_flow");
  }

  if (
    includesAny(text, ["cellular respiration", "respiration in cells", "cells release", "cells use food"]) &&
    includesAny(text, ["energy", "food", "sugar", "glucose"])
  ) {
    demonstratedIdeaIds.push("cellular_respiration_role");
  }

  if (
    includesAny(text, ["environment", "ecosystem", "plant", "producer", "decomposer", "soil", "air"]) &&
    includesAny(text, ["carbon dioxide", "matter", "energy", "food", "cycle", "flow"])
  ) {
    demonstratedIdeaIds.push("ecosystem_connection");
  }

  if (
    includesAny(text, ["respiration is breathing", "respiration means breathing", "only breathing", "just breathing"]) ||
    (includesAny(text, ["breathe", "breathing", "lungs"]) &&
      !includesAny(text, ["cell", "food", "energy"]))
  ) {
    possibleAlternativeConceptionIds.push("respiration_is_breathing_only");
  }

  if (
    includesAny(text, [
      "matter becomes energy",
      "food becomes energy",
      "carbon becomes energy",
      "matter disappears",
      "food disappears",
      "used up completely",
    ])
  ) {
    possibleAlternativeConceptionIds.push("matter_becomes_energy_or_disappears");
  }

  if (
    includesAny(text, [
      "plants do not respire",
      "plants don't respire",
      "only animals respire",
      "plants only photosynthesize",
      "photosynthesis is plant respiration",
    ])
  ) {
    possibleAlternativeConceptionIds.push("plants_do_not_respire");
  }

  if (
    includesAny(text, ["energy cycles", "energy is recycled", "energy returns to the plant", "energy goes in a cycle"])
  ) {
    possibleAlternativeConceptionIds.push("energy_cycles_like_matter");
  }

  const allIdeaIds = cellularRespirationPack.ideas.map((idea) => idea.id);
  const missingIdeaIds = allIdeaIds.filter((id) => !demonstratedIdeaIds.includes(id));

  let recommendedPromptId = "respiration_clarify_01";
  if (possibleAlternativeConceptionIds.includes("respiration_is_breathing_only")) {
    recommendedPromptId = "respiration_breathing_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("matter_becomes_energy_or_disappears")) {
    recommendedPromptId = "respiration_matter_energy_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("plants_do_not_respire")) {
    recommendedPromptId = "respiration_plants_probe_01";
  } else if (possibleAlternativeConceptionIds.includes("energy_cycles_like_matter")) {
    recommendedPromptId = "respiration_flow_cycle_probe_01";
  } else if (missingIdeaIds.includes("matter_path") || missingIdeaIds.includes("energy_flow")) {
    recommendedPromptId = "respiration_matter_energy_probe_01";
  } else if (missingIdeaIds.includes("cellular_respiration_role")) {
    recommendedPromptId = "respiration_breathing_probe_01";
  } else if (missingIdeaIds.includes("ecosystem_connection")) {
    recommendedPromptId = "respiration_ecosystem_probe_01";
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
      ? cellularRespirationPack.fallbackPrompt.id
      : recommendedPromptId,
    abstain,
    reasonCodes: abstain
      ? ["too_short", "insufficient_evidence"]
      : demonstratedIdeaIds.length
        ? ["explicit_evidence", "missing_relationship"]
        : ["insufficient_evidence"],
  };
}
