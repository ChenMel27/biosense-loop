import { getContentPack, getFollowUpPrompt } from "@/content/trait-inheritance";
import { applyTeacherContentDraft } from "@/content/teacher-draft";
import { getStudentIdentity } from "@/lib/auth/guards";
import { apiError } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET() {
  const identity = await getStudentIdentity();
  if (!identity) return apiError("Your activity session has expired. Please join again.", 401);
  const bundle = await getStore().getAttemptBundle(identity.sub);
  if (!bundle || bundle.session.id !== identity.sessionId) {
    return apiError("Activity not found.", 404);
  }
  const basePack = getContentPack(bundle.session.contentVersionId);
  if (!basePack) return apiError("The lesson content version is unavailable.", 503);
  const activityConfiguration = await getStore().getTeacherActivityConfiguration(bundle.session.id);
  const pack = applyTeacherContentDraft(basePack, activityConfiguration?.contentDraft);
  const initialResponse = bundle.responses.find((item) => item.stage === "initial");
  const finalResponse = bundle.responses.find((item) => item.stage === "final");
  const followUp = bundle.decision
    ? [...pack.followUps, pack.fallbackPrompt].find(
        (prompt) => prompt.id === bundle.decision?.displayedPromptId,
      ) ?? getFollowUpPrompt(bundle.decision.displayedPromptId)
    : null;
  const ideaById = new Map(pack.ideas.map((idea) => [idea.id, idea.label]));
  const patternById = new Map(
    pack.alternativeConceptions.map((pattern) => [pattern.id, pattern.label]),
  );
  const initiallyCovered = bundle.decision?.demonstratedIdeaIds
    .map((id) => ideaById.get(id))
    .filter((label): label is string => Boolean(label)) ?? [];
  const revisionFocus = [
    ...(bundle.decision?.missingIdeaIds ?? []).map((id) => ideaById.get(id)),
    ...(bundle.decision?.possibleAlternativeConceptionIds ?? []).map((id) => patternById.get(id)),
  ].filter((label): label is string => Boolean(label));
  return Response.json({
    ok: true,
    activity: {
      stage: bundle.attempt.stage,
      attemptKey: bundle.attempt.id,
      participantTag: bundle.attempt.participantTag,
      startedAt: bundle.attempt.startedAt,
      durationMinutes: bundle.session.durationMinutes,
      title: pack.title,
      gradeBand: pack.gradeBand,
      disclosure: pack.surveyDisclosure,
      initialPrompt: pack.initialPrompt,
      nearTransferPrompt: pack.nearTransferPrompt,
      followUp,
      reflectionSummary: bundle.decision
        ? {
            initiallyCovered,
            revisionFocus,
            promptTitle: followUp?.title ?? "Use evidence to strengthen your explanation",
          }
        : null,
      initialResponse: initialResponse?.responseText ?? null,
      finalResponse: finalResponse?.responseText ?? null,
      draftText:
        bundle.attempt.draftStage === bundle.attempt.stage
          ? bundle.attempt.draftText
          : null,
    },
  });
}
