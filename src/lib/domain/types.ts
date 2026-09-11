export type Condition = "adaptive";

export type SessionStatus = "draft" | "active" | "closed";

export type AttemptStage =
  | "initial"
  | "revision"
  | "transfer"
  | "survey"
  | "complete";

export type ResponseStage = "initial" | "final" | "near_transfer";

export type ConfidenceChoice = "not_sure" | "somewhat_sure" | "very_sure";

export interface StudySession {
  id: string;
  title: string;
  joinCode: string;
  contentVersionId: string;
  status: SessionStatus;
  assignmentSeed: string;
  durationMinutes: number;
  createdAt: string;
  launchedAt: string | null;
  closedAt: string | null;
}

export interface Participant {
  id: string;
  sessionId: string;
  participantTag: string;
  codeHash: string;
  assignedCondition: Condition;
  eligible: boolean;
}

export interface Attempt {
  id: string;
  sessionId: string;
  participantId: string;
  participantTag: string;
  condition: Condition;
  stage: AttemptStage;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  draftText: string | null;
  draftStage: AttemptStage | null;
  technicalStatus: "ok" | "fallback" | "incident";
}

export interface StudyResponse {
  id: string;
  attemptId: string;
  stage: ResponseStage;
  promptId: string;
  responseText: string;
  confidenceChoice: ConfidenceChoice | null;
  clientTimestamp: string | null;
  serverTimestamp: string;
  contentVersionId: string;
}

export interface ClassificationResult {
  demonstratedIdeaIds: string[];
  missingIdeaIds: string[];
  possibleAlternativeConceptionIds: string[];
  classificationConfidence: number;
  recommendedPromptId: string;
  abstain: boolean;
  reasonCodes: string[];
}

export interface AiDecision extends ClassificationResult {
  id: string;
  attemptId: string;
  provider: "openai" | "deterministic" | "control";
  model: string;
  schemaVersion: string;
  displayedPromptId: string;
  latencyMs: number;
  fallbackReason: string | null;
  createdAt: string;
}

export interface StudentSurvey {
  attemptId: string;
  clarity: number;
  pressure: number;
  helpfulness: number;
  openComment: string;
  createdAt: string;
}

export interface StudyEvent {
  id: string;
  sessionId: string;
  attemptId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface TeacherInstructionalAction {
  id: string;
  sessionId: string;
  actionType:
    | "proceed"
    | "whole_class_clarification"
    | "small_group"
    | "review_responses"
    | "other";
  note: string;
  createdAt: string;
}

export interface AttemptBundle {
  attempt: Attempt;
  session: StudySession;
  responses: StudyResponse[];
  decision: AiDecision | null;
  survey: StudentSurvey | null;
}

export interface DashboardSnapshot {
  session: StudySession;
  participantCount: number;
  counts: Record<"not_started" | AttemptStage, number>;
  conditionCounts: Record<Condition, number>;
  fallbackCount: number;
  ideaCounts: Record<string, number>;
  missingIdeaCounts: Record<string, number>;
  misconceptionCounts: Record<string, number>;
  patternExamples: Record<
    string,
    Array<{
      participantTag: string;
      responseText: string;
      displayedPromptId: string;
    }>
  >;
  recentEvents: StudyEvent[];
  teacherAction: TeacherInstructionalAction | null;
}

export interface SessionCreationResult {
  session: StudySession;
  participantCodes: Array<{
    participantTag: string;
    participantCode: string;
    condition: Condition;
  }>;
}

export type UsabilityReviewJudgment = "agree" | "needs_revision" | "unsure";

export interface TeacherUsabilityReview {
  sampleId: string;
  judgment: UsabilityReviewJudgment;
  correction: string;
}

export interface TeacherUsabilityTaskMetric {
  taskId: "authoring" | "classification_review" | "class_summary" | "survey";
  durationMs: number;
  completed: boolean;
}

export interface TeacherUsabilitySubmission {
  id: string;
  runId: string;
  participantTag: string;
  contentVersionId: string;
  startedAt: string;
  completedAt: string;
  authoringDraft: {
    initialPrompt: string;
    ideaDescriptions: Record<string, string>;
    misconceptionDescriptions: Record<string, string>;
    followUpPrompts: Record<string, string>;
  };
  reviews: TeacherUsabilityReview[];
  classSummary: {
    primaryPatternId: string;
    interpretation: string;
    nextAction: string;
    confidence: number;
  };
  susResponses: number[];
  susScore: number;
  summaryUsefulness: number;
  promptControl: number;
  openFeedback: string;
  taskMetrics: TeacherUsabilityTaskMetric[];
}

export interface TeacherUsabilityEvent {
  id: string;
  runId: string;
  participantTag: string;
  taskId: string;
  eventType: string;
  durationMs: number | null;
  payload: Record<string, unknown>;
  createdAt: string;
}
