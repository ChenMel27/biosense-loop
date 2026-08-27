import type {
  AiDecision,
  Attempt,
  AttemptBundle,
  AttemptStage,
  DashboardSnapshot,
  Participant,
  SessionCreationResult,
  StudyEvent,
  StudyResponse,
  StudySession,
  StudentSurvey,
  TeacherInstructionalAction,
} from "@/lib/domain/types";

export interface CreateSessionInput {
  title: string;
  participantCount: number;
  durationMinutes: number;
  contentVersionId: string;
}

export interface ResearchStore {
  getSessionByJoinCode(joinCode: string): Promise<StudySession | null>;
  getSession(sessionId: string): Promise<StudySession | null>;
  getParticipantByCodeHash(
    sessionId: string,
    codeHash: string,
  ): Promise<Participant | null>;
  getOrCreateAttempt(session: StudySession, participant: Participant): Promise<Attempt>;
  getAttemptBundle(attemptId: string): Promise<AttemptBundle | null>;
  updateAttemptStage(attemptId: string, stage: AttemptStage): Promise<Attempt>;
  saveDraft(attemptId: string, draftText: string, stage: AttemptStage): Promise<void>;
  appendResponse(response: StudyResponse): Promise<void>;
  appendDecision(decision: AiDecision): Promise<void>;
  saveSurvey(survey: StudentSurvey): Promise<void>;
  appendEvent(event: StudyEvent): Promise<void>;
  saveTeacherAction(action: TeacherInstructionalAction): Promise<void>;
  listSessions(): Promise<StudySession[]>;
  createSession(input: CreateSessionInput): Promise<SessionCreationResult>;
  updateSessionStatus(sessionId: string, status: StudySession["status"]): Promise<void>;
  getDashboardSnapshot(sessionId: string): Promise<DashboardSnapshot | null>;
  exportSession(sessionId: string): Promise<Array<Record<string, string | number | boolean | null>>>;
}
