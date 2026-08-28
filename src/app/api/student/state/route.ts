import { getFollowUpPrompt, getContentPack } from "@/content/cellular-respiration";
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
  const pack = getContentPack(bundle.session.contentVersionId);
  if (!pack) return apiError("The lesson content version is unavailable.", 503);
  const initialResponse = bundle.responses.find((item) => item.stage === "initial");
  const finalResponse = bundle.responses.find((item) => item.stage === "final");
  const followUp = bundle.decision
    ? getFollowUpPrompt(bundle.decision.displayedPromptId)
    : null;
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
      initialResponse: initialResponse?.responseText ?? null,
      finalResponse: finalResponse?.responseText ?? null,
      draftText:
        bundle.attempt.draftStage === bundle.attempt.stage
          ? bundle.attempt.draftText
          : null,
    },
  });
}
