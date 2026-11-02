import { describe, expect, it } from "vitest";

import {
  aggregateTeacherReviewSignals,
  createTeacherReviewJudgmentEvent,
  createTeacherReviewProposalEvent,
} from "@/lib/ai/teacher-review";
import type { StudyEvent, TeacherReviewSignal } from "@/lib/domain/types";

const responseText = "The trait changes because the beetle wants curved bristles.";

function signal(): TeacherReviewSignal {
  const quote = "wants curved bristles";
  const startIndex = responseText.indexOf(quote);
  return {
    id: "normalized-signal-id",
    category: "possible_out_of_bank_reasoning",
    quote,
    startIndex,
    endIndex: startIndex + quote.length,
    proposedInterpretation: "The student may be describing need-directed trait change.",
    rationale: "This reasoning is outside the approved misconception bank.",
  };
}

function context() {
  return {
    sessionId: "session-1",
    decisionIdsByAttempt: new Map([
      ["attempt-1", new Set(["decision-1"])],
    ]),
    responseTextByAttempt: new Map([["attempt-1", responseText]]),
  };
}

describe("teacher review event projection", () => {
  it("folds all matching events and applies the latest teacher judgment", () => {
    const proposed = createTeacherReviewProposalEvent({
      id: "signal-event-1",
      sessionId: "session-1",
      attemptId: "attempt-1",
      decisionId: "decision-1",
      signal: signal(),
      createdAt: "2026-10-29T12:00:00.000Z",
    });
    const noise: StudyEvent[] = Array.from({ length: 25 }, (_, index) => ({
      id: `noise-${index}`,
      sessionId: "session-1",
      attemptId: "attempt-1",
      eventType: "unrelated_event",
      payload: {},
      createdAt: `2026-10-29T12:01:${String(index).padStart(2, "0")}.000Z`,
    }));
    const confirmed = createTeacherReviewJudgmentEvent({
      id: "judgment-1",
      sessionId: "session-1",
      attemptId: "attempt-1",
      decisionId: "decision-1",
      signalId: proposed.id,
      judgment: "confirmed",
      createdAt: "2026-10-29T12:02:00.000Z",
    });
    const dismissed = createTeacherReviewJudgmentEvent({
      id: "judgment-2",
      sessionId: "session-1",
      attemptId: "attempt-1",
      decisionId: "decision-1",
      signalId: proposed.id,
      judgment: "dismissed",
      createdAt: "2026-10-29T12:03:00.000Z",
    });

    const result = aggregateTeacherReviewSignals(
      [dismissed, ...noise, proposed, confirmed],
      context(),
    );

    expect(result.get("attempt-1")).toEqual([
      expect.objectContaining({
        id: "signal-event-1",
        decisionId: "decision-1",
        judgment: "dismissed",
        reviewedAt: "2026-10-29T12:03:00.000Z",
      }),
    ]);
  });

  it("ignores proposals whose decision or exact response offsets do not match", () => {
    const wrongDecision = createTeacherReviewProposalEvent({
      id: "wrong-decision-event",
      sessionId: "session-1",
      attemptId: "attempt-1",
      decisionId: "decision-elsewhere",
      signal: signal(),
      createdAt: "2026-10-29T12:00:00.000Z",
    });
    const wrongQuote = createTeacherReviewProposalEvent({
      id: "wrong-quote-event",
      sessionId: "session-1",
      attemptId: "attempt-1",
      decisionId: "decision-1",
      signal: { ...signal(), startIndex: 0, endIndex: signal().quote.length },
      createdAt: "2026-10-29T12:00:01.000Z",
    });

    expect(
      aggregateTeacherReviewSignals([wrongDecision, wrongQuote], context()).get(
        "attempt-1",
      ),
    ).toBeUndefined();
  });
});
