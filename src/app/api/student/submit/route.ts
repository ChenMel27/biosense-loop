import { randomUUID } from "node:crypto";

import { classifyForRouting } from "@/lib/ai/classifier";
import { createTeacherReviewProposalEvent } from "@/lib/ai/teacher-review";
import { resolveContentPack } from "@/content/teacher-draft";
import { getStudentIdentity } from "@/lib/auth/guards";
import type { StudyResponse } from "@/lib/domain/types";
import { studentSubmissionSchema } from "@/lib/domain/validation";
import { apiError, validationMessage } from "@/lib/http";
import { getStore } from "@/lib/store";
import { nextStageAfterRevision } from "@/lib/student/flow";
import { applicationResponseIssue } from "@/lib/student/response-validation";

export async function POST(request: Request) {
  const identity = await getStudentIdentity();
  if (!identity) return apiError("Your activity session has expired. Please join again.", 401);
  const parsed = studentSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(validationMessage(parsed.error));
  const store = getStore();
  const bundle = await store.getAttemptBundle(identity.sub);
  if (!bundle || bundle.session.id !== identity.sessionId) return apiError("Activity not found.", 404);
  if (bundle.session.status === "closed" && bundle.attempt.stage !== "complete") {
    return apiError("Your teacher has closed this session.", 409);
  }
  const activityConfiguration = await store.getTeacherActivityConfiguration(bundle.session.id);
  const pack = resolveContentPack(bundle.session.contentVersionId, activityConfiguration);
  if (!pack) return apiError("The lesson content version is unavailable.", 503);
  const singleResponseFlow = pack.activityFlow === "single_response";
  const timestamp = new Date().toISOString();

  const appendResponse = async (
    stage: StudyResponse["stage"],
    promptId: string,
    responseText: string,
    confidenceChoice: StudyResponse["confidenceChoice"],
    clientTimestamp?: string,
  ) => {
    await store.appendResponse({
      id: randomUUID(),
      attemptId: bundle.attempt.id,
      stage,
      promptId,
      responseText,
      confidenceChoice,
      clientTimestamp: clientTimestamp ?? null,
      serverTimestamp: timestamp,
      contentVersionId: pack.versionId,
    });
  };

  if (parsed.data.action === "initial") {
    if (bundle.attempt.stage !== "initial") return apiError("The initial response is already locked.", 409);
    const lockedInitialResponse = bundle.responses.find((item) => item.stage === "initial");
    const responseText = lockedInitialResponse?.responseText ?? parsed.data.responseText;
    if (singleResponseFlow) {
      const responseIssue = applicationResponseIssue(
        responseText,
        pack.minimumInitialSentences ?? 3,
      );
      if (responseIssue) return apiError(responseIssue, 400);
    } else if (!(lockedInitialResponse?.confidenceChoice ?? parsed.data.confidenceChoice)) {
      return apiError("Choose how sure you are before submitting.", 400);
    }
    if (!lockedInitialResponse) {
      await appendResponse(
        "initial",
        pack.initialPrompt.id,
        responseText,
        singleResponseFlow ? null : parsed.data.confidenceChoice ?? null,
        parsed.data.clientTimestamp,
      );
    }
    let decision = bundle.decision;
    if (!decision) {
      decision = await classifyForRouting({
        attemptId: bundle.attempt.id,
        responseText,
        contentPack: pack,
      });
      await store.appendDecision(decision);
      for (const signal of decision.teacherReviewSignals) {
        await store.appendEvent(createTeacherReviewProposalEvent({
          id: randomUUID(),
          sessionId: bundle.session.id,
          attemptId: bundle.attempt.id,
          decisionId: decision.id,
          signal,
          createdAt: decision.createdAt,
        }));
      }
    }
    const nextStage = singleResponseFlow ? "complete" : "revision";
    await store.updateAttemptStage(bundle.attempt.id, nextStage);
    await store.appendEvent({
      id: randomUUID(),
      sessionId: bundle.session.id,
      attemptId: bundle.attempt.id,
      eventType: "initial_locked",
      payload: singleResponseFlow
        ? {
            condition: "adaptive",
            selectedFeedbackFocusId: decision.displayedPromptId,
            promptDisplayed: false,
            provider: decision.provider,
            fallback: Boolean(decision.fallbackReason),
            nextStage,
          }
        : {
            condition: "adaptive",
            displayedPromptId: decision.displayedPromptId,
            promptDisplayed: true,
            provider: decision.provider,
            fallback: Boolean(decision.fallbackReason),
            nextStage,
          },
      createdAt: timestamp,
    });
    if (singleResponseFlow) {
      await store.appendEvent({
        id: randomUUID(),
        sessionId: bundle.session.id,
        attemptId: bundle.attempt.id,
        eventType: "activity_completed",
        payload: { flow: "single_response" },
        createdAt: timestamp,
      });
    }
  } else if (parsed.data.action === "revision") {
    if (bundle.attempt.stage !== "revision") return apiError("This revision cannot be submitted now.", 409);
    await appendResponse(
      "final",
      bundle.decision?.displayedPromptId ?? pack.fallbackPrompt.id,
      parsed.data.responseText,
      parsed.data.confidenceChoice,
      parsed.data.clientTimestamp,
    );
    const nextStage = nextStageAfterRevision(pack.includeTransfer);
    await store.updateAttemptStage(bundle.attempt.id, nextStage);
    await store.appendEvent({
      id: randomUUID(),
      sessionId: bundle.session.id,
      attemptId: bundle.attempt.id,
      eventType: "revision_locked",
      payload: { nextStage },
      createdAt: timestamp,
    });
  } else if (parsed.data.action === "transfer") {
    if (bundle.attempt.stage !== "transfer") return apiError("This response cannot be submitted now.", 409);
    await appendResponse(
      "near_transfer",
      pack.nearTransferPrompt.id,
      parsed.data.responseText,
      parsed.data.confidenceChoice,
      parsed.data.clientTimestamp,
    );
    await store.updateAttemptStage(bundle.attempt.id, "survey");
    await store.appendEvent({
      id: randomUUID(),
      sessionId: bundle.session.id,
      attemptId: bundle.attempt.id,
      eventType: "near_transfer_locked",
      payload: {},
      createdAt: timestamp,
    });
  } else {
    if (bundle.attempt.stage !== "survey") return apiError("This survey cannot be submitted now.", 409);
    await store.saveSurvey({
      attemptId: bundle.attempt.id,
      clarity: parsed.data.clarity,
      pressure: parsed.data.pressure,
      helpfulness: parsed.data.helpfulness,
      openComment: parsed.data.openComment,
      createdAt: timestamp,
    });
    await store.updateAttemptStage(bundle.attempt.id, "complete");
    await store.appendEvent({
      id: randomUUID(),
      sessionId: bundle.session.id,
      attemptId: bundle.attempt.id,
      eventType: "activity_completed",
      payload: {},
      createdAt: timestamp,
    });
  }

  return Response.json({ ok: true });
}
