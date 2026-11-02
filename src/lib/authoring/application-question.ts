const reasoningCue = /\b(explain|predict|why|how|affect|compare|analy[sz]e|justify|support|relationship|cause|result)\b/i;
const evidenceRequestCue = /(?:\b(?:use|cite|connect|support|include|refer to|based on)\b[^.!?]{0,80}\b(?:evidence|detail|fact|data|result|observation|scenario|case|information)\b|\b(?:evidence|detail|fact|data|result|observation)\b[^.!?]{0,80}\b(?:support|show|explain)\b)/i;
const recallOnlyOpening = /^\s*(define|list|name|identify|what is|what are)\b/i;

/**
 * A deterministic teacher-facing check. It does not judge scientific quality;
 * it only prevents obviously recall-only prompts from being launched by mistake.
 */
export function applicationQuestionIssue(context: string, prompt: string) {
  const cleanContext = context.trim();
  const cleanPrompt = prompt.trim();
  if (cleanContext.length < 20 || cleanPrompt.length < 20) {
    return "Add a short scenario and a complete application question.";
  }
  const hasReasoning = reasoningCue.test(cleanPrompt);
  const asksForEvidence = evidenceRequestCue.test(cleanPrompt);
  if (recallOnlyOpening.test(cleanPrompt) && !hasReasoning) {
    return "Change the question so students apply or explain the science instead of only defining, listing, naming, or identifying.";
  }
  if (!hasReasoning) {
    return "Ask students to predict, explain why, describe how ideas are connected, or justify a conclusion.";
  }
  if (!asksForEvidence) {
    return "Ask students to use at least one fact, detail, result, or observation from the scenario as evidence.";
  }
  return "";
}
