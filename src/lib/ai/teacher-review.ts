import type {
  DashboardTeacherReviewSignal,
  StudyEvent,
  TeacherReviewJudgment,
  TeacherReviewSignal,
  TeacherReviewSignalCategory,
} from "@/lib/domain/types";

export const TEACHER_REVIEW_SIGNAL_PROPOSED_EVENT =
  "ai_teacher_review_signal_proposed";
export const TEACHER_REVIEW_SIGNAL_JUDGED_EVENT =
  "teacher_review_signal_judged";

const signalCategories = new Set<TeacherReviewSignalCategory>([
  "incompatible_with_approved_idea",
  "irrelevant_or_off_topic",
  "possible_out_of_bank_reasoning",
]);

const judgments = new Set<TeacherReviewJudgment>(["confirmed", "dismissed"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function parseProposalEvent(event: StudyEvent) {
  if (
    event.eventType !== TEACHER_REVIEW_SIGNAL_PROPOSED_EVENT ||
    !event.attemptId
  ) {
    return null;
  }
  const {
    decisionId,
    signalId,
    category,
    quote,
    startIndex,
    endIndex,
    proposedInterpretation,
    rationale,
  } = event.payload;
  if (
    !isNonEmptyString(decisionId) ||
    !isNonEmptyString(signalId) ||
    signalId !== event.id ||
    !signalCategories.has(category as TeacherReviewSignalCategory) ||
    !isNonEmptyString(quote) ||
    typeof startIndex !== "number" ||
    !Number.isInteger(startIndex) ||
    startIndex < 0 ||
    typeof endIndex !== "number" ||
    !Number.isInteger(endIndex) ||
    endIndex <= startIndex ||
    endIndex - startIndex !== quote.length ||
    !isNonEmptyString(proposedInterpretation) ||
    !isNonEmptyString(rationale)
  ) {
    return null;
  }
  return {
    attemptId: event.attemptId,
    signal: {
      id: signalId,
      decisionId,
      category: category as TeacherReviewSignalCategory,
      quote,
      startIndex,
      endIndex,
      proposedInterpretation,
      rationale,
      judgment: null,
      reviewedAt: null,
    } satisfies DashboardTeacherReviewSignal,
  };
}

function parseJudgmentEvent(event: StudyEvent) {
  if (
    event.eventType !== TEACHER_REVIEW_SIGNAL_JUDGED_EVENT ||
    !event.attemptId
  ) {
    return null;
  }
  const { decisionId, signalId, judgment } = event.payload;
  if (
    !isNonEmptyString(decisionId) ||
    !isNonEmptyString(signalId) ||
    !judgments.has(judgment as TeacherReviewJudgment)
  ) {
    return null;
  }
  return {
    attemptId: event.attemptId,
    decisionId,
    signalId,
    judgment: judgment as TeacherReviewJudgment,
    reviewedAt: event.createdAt,
  };
}

function signalKey(decisionId: string, signalId: string) {
  return `${decisionId}\u0000${signalId}`;
}

export function createTeacherReviewProposalEvent(input: {
  id: string;
  sessionId: string;
  attemptId: string;
  decisionId: string;
  signal: TeacherReviewSignal;
  createdAt: string;
}): StudyEvent {
  return {
    id: input.id,
    sessionId: input.sessionId,
    attemptId: input.attemptId,
    eventType: TEACHER_REVIEW_SIGNAL_PROPOSED_EVENT,
    payload: {
      decisionId: input.decisionId,
      signalId: input.id,
      category: input.signal.category,
      quote: input.signal.quote,
      startIndex: input.signal.startIndex,
      endIndex: input.signal.endIndex,
      proposedInterpretation: input.signal.proposedInterpretation,
      rationale: input.signal.rationale,
    },
    createdAt: input.createdAt,
  };
}

export function createTeacherReviewJudgmentEvent(input: {
  id: string;
  sessionId: string;
  attemptId: string;
  decisionId: string;
  signalId: string;
  judgment: TeacherReviewJudgment;
  createdAt: string;
}): StudyEvent {
  return {
    id: input.id,
    sessionId: input.sessionId,
    attemptId: input.attemptId,
    eventType: TEACHER_REVIEW_SIGNAL_JUDGED_EVENT,
    payload: {
      decisionId: input.decisionId,
      signalId: input.signalId,
      judgment: input.judgment,
    },
    createdAt: input.createdAt,
  };
}

/**
 * Folds the complete proposal/judgment event stream. Callers must supply all
 * matching events for the session rather than the dashboard's recent-event
 * window.
 */
export interface TeacherReviewAggregationContext {
  sessionId: string;
  decisionIdsByAttempt: ReadonlyMap<string, ReadonlySet<string>>;
  responseTextByAttempt: ReadonlyMap<string, string>;
}

export function aggregateTeacherReviewSignals(
  events: StudyEvent[],
  context?: TeacherReviewAggregationContext,
) {
  const byAttemptAndSignal = new Map<
    string,
    Map<string, DashboardTeacherReviewSignal>
  >();
  const chronological = [...events].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );

  for (const event of chronological) {
    if (context && event.sessionId !== context.sessionId) continue;
    const proposal = parseProposalEvent(event);
    if (proposal) {
      if (context) {
        const allowedDecisionIds = context.decisionIdsByAttempt.get(
          proposal.attemptId,
        );
        const responseText = context.responseTextByAttempt.get(proposal.attemptId);
        if (
          !allowedDecisionIds?.has(proposal.signal.decisionId) ||
          typeof responseText !== "string" ||
          responseText.slice(
            proposal.signal.startIndex,
            proposal.signal.endIndex,
          ) !== proposal.signal.quote
        ) {
          continue;
        }
      }
      const attemptSignals = byAttemptAndSignal.get(proposal.attemptId) ?? new Map();
      const key = signalKey(proposal.signal.decisionId, proposal.signal.id);
      const existing = attemptSignals.get(key);
      attemptSignals.set(key, {
        ...proposal.signal,
        judgment: existing?.judgment ?? null,
        reviewedAt: existing?.reviewedAt ?? null,
      });
      byAttemptAndSignal.set(proposal.attemptId, attemptSignals);
      continue;
    }

    const review = parseJudgmentEvent(event);
    if (!review) continue;
    const attemptSignals = byAttemptAndSignal.get(review.attemptId);
    const key = signalKey(review.decisionId, review.signalId);
    const signal = attemptSignals?.get(key);
    if (!signal) continue;
    attemptSignals!.set(key, {
      ...signal,
      judgment: review.judgment,
      reviewedAt: review.reviewedAt,
    });
  }

  return new Map(
    [...byAttemptAndSignal.entries()].map(([attemptId, signals]) => [
      attemptId,
      [...signals.values()],
    ]),
  );
}
