import { randomUUID } from "node:crypto";

import { cellularRespirationPack } from "@/content/cellular-respiration";
import {
  balancedConditions,
  generateJoinCode,
  generateParticipantCode,
  hashParticipantCode,
  normalizeCode,
} from "@/lib/domain/assignment";
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
import type { CreateSessionInput, ResearchStore } from "@/lib/store/types";

interface MemoryState {
  sessions: StudySession[];
  participants: Participant[];
  attempts: Attempt[];
  responses: StudyResponse[];
  decisions: AiDecision[];
  surveys: StudentSurvey[];
  events: StudyEvent[];
  teacherActions: TeacherInstructionalAction[];
}

function now() {
  return new Date().toISOString();
}

function participantPepper() {
  return process.env.PARTICIPANT_CODE_PEPPER || "development-only-pepper";
}

function buildDemoState(): MemoryState {
  const session: StudySession = {
    id: "demo-session",
    title: "Period 3 · Cellular respiration",
    joinCode: "BIO7",
    contentVersionId: cellularRespirationPack.versionId,
    status: "active",
    assignmentSeed: "demo-balanced-v1",
    durationMinutes: 15,
    createdAt: now(),
    launchedAt: now(),
    closedAt: null,
  };
  const participants = Array.from({ length: 30 }, (_, index): Participant => {
    const participantCode = `BIO-${String(index + 1).padStart(3, "0")}`;
    return {
      id: `demo-participant-${index + 1}`,
      sessionId: session.id,
      participantTag: `P${String(index + 1).padStart(2, "0")}`,
      codeHash: hashParticipantCode(participantCode, participantPepper()),
      assignedCondition: index % 2 === 0 ? "adaptive" : "reflection",
      eligible: true,
    };
  });

  return {
    sessions: [session],
    participants,
    attempts: [],
    responses: [],
    decisions: [],
    surveys: [],
    events: [],
    teacherActions: [],
  };
}

declare global {
  var __biosenseMemoryState: MemoryState | undefined;
}

function getState() {
  if (!globalThis.__biosenseMemoryState) {
    globalThis.__biosenseMemoryState = buildDemoState();
  }
  globalThis.__biosenseMemoryState.teacherActions ??= [];
  return globalThis.__biosenseMemoryState;
}

export function resetMemoryStore() {
  const state = getState();
  const fresh = buildDemoState();
  state.sessions.splice(0, state.sessions.length, ...fresh.sessions);
  state.participants.splice(0, state.participants.length, ...fresh.participants);
  state.attempts.splice(0, state.attempts.length);
  state.responses.splice(0, state.responses.length);
  state.decisions.splice(0, state.decisions.length);
  state.surveys.splice(0, state.surveys.length);
  state.events.splice(0, state.events.length);
  state.teacherActions.splice(0, state.teacherActions.length);
}

export class MemoryResearchStore implements ResearchStore {
  private state = getState();

  async getSessionByJoinCode(joinCode: string) {
    return (
      this.state.sessions.find(
        (session) => normalizeCode(session.joinCode) === normalizeCode(joinCode),
      ) ?? null
    );
  }

  async getSession(sessionId: string) {
    return this.state.sessions.find((session) => session.id === sessionId) ?? null;
  }

  async getParticipantByCodeHash(sessionId: string, codeHash: string) {
    return (
      this.state.participants.find(
        (participant) =>
          participant.sessionId === sessionId && participant.codeHash === codeHash,
      ) ?? null
    );
  }

  async getOrCreateAttempt(session: StudySession, participant: Participant) {
    const existing = this.state.attempts.find(
      (attempt) =>
        attempt.sessionId === session.id && attempt.participantId === participant.id,
    );
    if (existing) return existing;

    const timestamp = now();
    const attempt: Attempt = {
      id: randomUUID(),
      sessionId: session.id,
      participantId: participant.id,
      participantTag: participant.participantTag,
      condition: participant.assignedCondition,
      stage: "initial",
      startedAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      draftText: null,
      draftStage: null,
      technicalStatus: "ok",
    };
    this.state.attempts.push(attempt);
    return attempt;
  }

  async getAttemptBundle(attemptId: string): Promise<AttemptBundle | null> {
    const attempt = this.state.attempts.find((item) => item.id === attemptId);
    if (!attempt) return null;
    const session = this.state.sessions.find((item) => item.id === attempt.sessionId);
    if (!session) return null;
    return {
      attempt,
      session,
      responses: this.state.responses.filter((item) => item.attemptId === attemptId),
      decision:
        [...this.state.decisions]
          .reverse()
          .find((item) => item.attemptId === attemptId) ?? null,
      survey: this.state.surveys.find((item) => item.attemptId === attemptId) ?? null,
    };
  }

  async updateAttemptStage(attemptId: string, stage: AttemptStage) {
    const attempt = this.state.attempts.find((item) => item.id === attemptId);
    if (!attempt) throw new Error("Attempt not found.");
    attempt.stage = stage;
    attempt.updatedAt = now();
    attempt.draftText = null;
    attempt.draftStage = null;
    if (stage === "complete") attempt.completedAt = attempt.updatedAt;
    return attempt;
  }

  async saveDraft(attemptId: string, draftText: string, stage: AttemptStage) {
    const attempt = this.state.attempts.find((item) => item.id === attemptId);
    if (!attempt) throw new Error("Attempt not found.");
    if (attempt.stage !== stage) return;
    attempt.draftText = draftText.slice(0, 2_000);
    attempt.draftStage = stage;
    attempt.updatedAt = now();
  }

  async appendResponse(response: StudyResponse) {
    const duplicate = this.state.responses.find(
      (item) => item.attemptId === response.attemptId && item.stage === response.stage,
    );
    if (duplicate) throw new Error(`The ${response.stage} response is already locked.`);
    this.state.responses.push(response);
  }

  async appendDecision(decision: AiDecision) {
    this.state.decisions.push(decision);
    if (decision.fallbackReason) {
      const attempt = this.state.attempts.find((item) => item.id === decision.attemptId);
      if (attempt) attempt.technicalStatus = "fallback";
    }
  }

  async saveSurvey(survey: StudentSurvey) {
    const index = this.state.surveys.findIndex(
      (item) => item.attemptId === survey.attemptId,
    );
    if (index >= 0) this.state.surveys[index] = survey;
    else this.state.surveys.push(survey);
  }

  async appendEvent(event: StudyEvent) {
    this.state.events.push(event);
  }

  async saveTeacherAction(action: TeacherInstructionalAction) {
    this.state.teacherActions.push(action);
  }

  async listSessions() {
    return [...this.state.sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createSession(input: CreateSessionInput): Promise<SessionCreationResult> {
    const joinCode = generateJoinCode();
    const session: StudySession = {
      id: randomUUID(),
      title: input.title,
      joinCode,
      contentVersionId: input.contentVersionId,
      status: "draft",
      assignmentSeed: randomUUID(),
      durationMinutes: input.durationMinutes,
      createdAt: now(),
      launchedAt: null,
      closedAt: null,
    };
    const conditions = balancedConditions(input.participantCount);
    const participantCodes = Array.from({ length: input.participantCount }, (_, index) => {
      const participantCode = generateParticipantCode(index);
      const participantTag = `P${String(index + 1).padStart(2, "0")}`;
      const participant: Participant = {
        id: randomUUID(),
        sessionId: session.id,
        participantTag,
        codeHash: hashParticipantCode(participantCode, participantPepper()),
        assignedCondition: conditions[index],
        eligible: true,
      };
      this.state.participants.push(participant);
      return { participantTag, participantCode, condition: conditions[index] };
    });
    this.state.sessions.push(session);
    return { session, participantCodes };
  }

  async updateSessionStatus(sessionId: string, status: StudySession["status"]) {
    const session = this.state.sessions.find((item) => item.id === sessionId);
    if (!session) throw new Error("Session not found.");
    session.status = status;
    if (status === "active" && !session.launchedAt) session.launchedAt = now();
    if (status === "closed") session.closedAt = now();
  }

  async getDashboardSnapshot(sessionId: string): Promise<DashboardSnapshot | null> {
    const session = this.state.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    const participants = this.state.participants.filter((item) => item.sessionId === sessionId);
    const attempts = this.state.attempts.filter((item) => item.sessionId === sessionId);
    const counts: DashboardSnapshot["counts"] = {
      not_started: participants.length - attempts.length,
      initial: 0,
      revision: 0,
      transfer: 0,
      survey: 0,
      complete: 0,
    };
    for (const attempt of attempts) counts[attempt.stage] += 1;
    const decisions = this.state.decisions.filter((decision) =>
      attempts.some((attempt) => attempt.id === decision.attemptId),
    );
    const ideaCounts: Record<string, number> = {};
    const misconceptionCounts: Record<string, number> = {};
    for (const decision of decisions) {
      for (const id of decision.demonstratedIdeaIds) ideaCounts[id] = (ideaCounts[id] ?? 0) + 1;
      for (const id of decision.possibleAlternativeConceptionIds) {
        misconceptionCounts[id] = (misconceptionCounts[id] ?? 0) + 1;
      }
    }
    return {
      session,
      participantCount: participants.length,
      counts,
      conditionCounts: {
        adaptive: participants.filter((item) => item.assignedCondition === "adaptive").length,
        reflection: participants.filter((item) => item.assignedCondition === "reflection").length,
      },
      fallbackCount: decisions.filter((item) => item.fallbackReason).length,
      ideaCounts,
      misconceptionCounts,
      recentEvents: this.state.events
        .filter((item) => item.sessionId === sessionId)
        .slice(-20)
        .reverse(),
      teacherAction:
        [...this.state.teacherActions]
          .reverse()
          .find((item) => item.sessionId === sessionId) ?? null,
    };
  }

  async exportSession(sessionId: string) {
    const attempts = this.state.attempts.filter((item) => item.sessionId === sessionId);
    const teacherAction = [...this.state.teacherActions]
      .reverse()
      .find((item) => item.sessionId === sessionId);
    return attempts.map((attempt) => {
      const responses = this.state.responses.filter((item) => item.attemptId === attempt.id);
      const decision = this.state.decisions.find((item) => item.attemptId === attempt.id);
      const survey = this.state.surveys.find((item) => item.attemptId === attempt.id);
      const response = (stage: StudyResponse["stage"]) =>
        responses.find((item) => item.stage === stage);
      return {
        session_id: sessionId,
        participant_tag: attempt.participantTag,
        condition: attempt.condition,
        completion_state: attempt.stage,
        started_at: attempt.startedAt,
        completed_at: attempt.completedAt,
        initial_text: response("initial")?.responseText ?? null,
        initial_confidence: response("initial")?.confidenceChoice ?? null,
        displayed_prompt_id: decision?.displayedPromptId ?? null,
        ai_provider: decision?.provider ?? null,
        ai_model: decision?.model ?? null,
        ai_confidence: decision?.classificationConfidence ?? null,
        ai_abstained: decision?.abstain ?? null,
        fallback_reason: decision?.fallbackReason ?? null,
        final_text: response("final")?.responseText ?? null,
        final_confidence: response("final")?.confidenceChoice ?? null,
        near_transfer_text: response("near_transfer")?.responseText ?? null,
        near_transfer_confidence: response("near_transfer")?.confidenceChoice ?? null,
        clarity: survey?.clarity ?? null,
        pressure: survey?.pressure ?? null,
        helpfulness: survey?.helpfulness ?? null,
        open_comment: survey?.openComment ?? null,
        teacher_action_type: teacherAction?.actionType ?? null,
        teacher_action_note: teacherAction?.note ?? null,
      };
    });
  }
}
