import type { ContentPack, FollowUpPrompt } from "@/content/trait-inheritance";
import type { AiDecision } from "@/lib/domain/types";

export type LearningFocusKind =
  | "missing_idea"
  | "claim_to_reconsider"
  | "clarify_reasoning"
  | "evidence_check";

export interface StudentLearningSummary {
  initiallyCovered: string[];
  missingIdeas: string[];
  possibleMisconceptions: string[];
  focusKind: LearningFocusKind;
  focusLabel: string;
  promptTitle: string;
  uncertain: boolean;
}

export function buildRevisionInstruction(focusKind?: LearningFocusKind | null) {
  const keepWhatFits =
    "Keep the parts of your first answer that still fit. You do not need to start over.";

  switch (focusKind) {
    case "missing_idea":
      return `Add one sentence that explains the scientific connection in the helping question. ${keepWhatFits}`;
    case "claim_to_reconsider":
      return `Edit one sentence so the scientific connection matches the evidence. ${keepWhatFits}`;
    case "evidence_check":
      return `Edit or add one sentence that connects your evidence to your conclusion. ${keepWhatFits}`;
    case "clarify_reasoning":
    default:
      return `Edit or add one sentence to make the scientific connection easier to follow. ${keepWhatFits}`;
  }
}

export function buildStudentLearningSummary(
  pack: ContentPack,
  decision: AiDecision,
  followUp: FollowUpPrompt | null,
): StudentLearningSummary {
  const ideaById = new Map(pack.ideas.map((idea) => [idea.id, idea.label]));
  const patternById = new Map(
    pack.alternativeConceptions.map((pattern) => [pattern.id, pattern.label]),
  );
  const initiallyCovered = decision.demonstratedIdeaIds
    .map((id) => ideaById.get(id))
    .filter((label): label is string => Boolean(label));
  const missingIdeas = decision.missingIdeaIds
    .map((id) => ideaById.get(id))
    .filter((label): label is string => Boolean(label));
  const possibleMisconceptions = decision.possibleAlternativeConceptionIds
    .map((id) => patternById.get(id))
    .filter((label): label is string => Boolean(label));

  let focusKind: LearningFocusKind = "evidence_check";
  let focusLabel = "Check that the evidence and conclusion are clearly connected";

  if (decision.abstain) {
    focusKind = "clarify_reasoning";
    focusLabel = "Make the scientific connection easier to follow";
  } else if (decision.routingTargetId && patternById.has(decision.routingTargetId)) {
    focusKind = "claim_to_reconsider";
    focusLabel = patternById.get(decision.routingTargetId) ?? focusLabel;
  } else if (decision.routingTargetId && ideaById.has(decision.routingTargetId)) {
    focusKind = "missing_idea";
    focusLabel = ideaById.get(decision.routingTargetId) ?? focusLabel;
  }

  return {
    initiallyCovered,
    missingIdeas,
    possibleMisconceptions,
    focusKind,
    focusLabel,
    promptTitle: followUp?.title ?? "Use evidence to strengthen your explanation",
    uncertain: decision.abstain,
  };
}
