import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { traitInheritancePack } from "@/content/trait-inheritance";
import { resolveContentPack } from "@/content/teacher-draft";
import { requireProductionSecret } from "@/lib/config";

import {
  adaptiveConditions,
  generateJoinCode,
  hashInternalSlotKey,
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
  TeacherActivityConfiguration,
  TeacherUsabilityEvent,
  TeacherUsabilitySubmission,
} from "@/lib/domain/types";
import type { CreateSessionInput, ResearchStore } from "@/lib/store/types";

interface SessionRow {
  id: string;
  title: string;
  join_code: string;
  content_version_id: string;
  status: StudySession["status"];
  assignment_seed: string;
  duration_minutes: number;
  created_at: string;
  launched_at: string | null;
  closed_at: string | null;
}

interface ParticipantRow {
  id: string;
  session_id: string;
  participant_tag: string;
  code_hash: string;
  assigned_condition: string;
  eligible: boolean;
}

interface AttemptRow {
  id: string;
  session_id: string;
  participant_id: string;
  participant_tag: string;
  condition: string;
  stage: AttemptStage;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
  draft_text: string | null;
  draft_stage: AttemptStage | null;
  technical_status: Attempt["technicalStatus"];
}

interface ResponseRow {
  id: string;
  attempt_id: string;
  stage: StudyResponse["stage"];
  prompt_id: string;
  response_text: string;
  confidence_choice: StudyResponse["confidenceChoice"];
  client_timestamp: string | null;
  server_timestamp: string;
  content_version_id: string;
}

interface DecisionRow {
  id: string;
  attempt_id: string;
  provider: AiDecision["provider"];
  model: string;
  schema_version: string;
  demonstrated_idea_ids: string[];
  missing_idea_ids: string[];
  possible_alternative_conception_ids: string[];
  evidence_spans: AiDecision["evidenceSpans"];
  routing_target_id: string | null;
  classification_confidence: number;
  recommended_prompt_id: string;
  displayed_prompt_id: string;
  abstain: boolean;
  reason_codes: string[];
  latency_ms: number;
  fallback_reason: string | null;
  created_at: string;
}

interface SurveyRow {
  attempt_id: string;
  clarity: number;
  pressure: number;
  helpfulness: number;
  open_comment: string;
  created_at: string;
}

interface EventRow {
  id: string;
  session_id: string;
  attempt_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface TeacherActionRow {
  id: string;
  session_id: string;
  action_type: TeacherInstructionalAction["actionType"];
  note: string;
  created_at: string;
}

function mapSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    title: row.title,
    joinCode: row.join_code,
    contentVersionId: row.content_version_id,
    status: row.status,
    assignmentSeed: row.assignment_seed,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
    launchedAt: row.launched_at,
    closedAt: row.closed_at,
  };
}

function mapParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    sessionId: row.session_id,
    participantTag: row.participant_tag,
    codeHash: row.code_hash,
    assignedCondition: "adaptive",
    eligible: row.eligible,
  };
}

function mapAttempt(row: AttemptRow): Attempt {
  return {
    id: row.id,
    sessionId: row.session_id,
    participantId: row.participant_id,
    participantTag: row.participant_tag,
    condition: "adaptive",
    stage: row.stage,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    draftText: row.draft_text,
    draftStage: row.draft_stage,
    technicalStatus: row.technical_status,
  };
}

function mapResponse(row: ResponseRow): StudyResponse {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    stage: row.stage,
    promptId: row.prompt_id,
    responseText: row.response_text,
    confidenceChoice: row.confidence_choice,
    clientTimestamp: row.client_timestamp,
    serverTimestamp: row.server_timestamp,
    contentVersionId: row.content_version_id,
  };
}

function mapDecision(row: DecisionRow): AiDecision {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    provider: row.provider,
    model: row.model,
    schemaVersion: row.schema_version,
    demonstratedIdeaIds: row.demonstrated_idea_ids,
    missingIdeaIds: row.missing_idea_ids,
    possibleAlternativeConceptionIds: row.possible_alternative_conception_ids,
    evidenceSpans: row.evidence_spans ?? [],
    routingTargetId: row.routing_target_id ?? null,
    classificationConfidence: row.classification_confidence,
    recommendedPromptId: row.recommended_prompt_id,
    displayedPromptId: row.displayed_prompt_id,
    abstain: row.abstain,
    reasonCodes: row.reason_codes,
    latencyMs: row.latency_ms,
    fallbackReason: row.fallback_reason,
    createdAt: row.created_at,
  };
}

function mapSurvey(row: SurveyRow): StudentSurvey {
  return {
    attemptId: row.attempt_id,
    clarity: row.clarity,
    pressure: row.pressure,
    helpfulness: row.helpfulness,
    openComment: row.open_comment,
    createdAt: row.created_at,
  };
}

function mapEvent(row: EventRow): StudyEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    attemptId: row.attempt_id,
    eventType: row.event_type,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

function mapTeacherAction(row: TeacherActionRow): TeacherInstructionalAction {
  return {
    id: row.id,
    sessionId: row.session_id,
    actionType: row.action_type,
    note: row.note,
    createdAt: row.created_at,
  };
}

function requireData<T>(data: T | null, error: { message: string } | null, label: string): T {
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null) throw new Error(`${label}: no data returned`);
  return data;
}

export class SupabaseResearchStore implements ResearchStore {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase server credentials are not configured.");
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async getSessionByJoinCode(joinCode: string) {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .eq("join_code", normalizeCode(joinCode))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapSession(data as SessionRow) : null;
  }

  async getSession(sessionId: string) {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapSession(data as SessionRow) : null;
  }

  async getTeacherActivityConfiguration(sessionId: string) {
    const { data, error } = await this.client
      .from("events")
      .select("payload")
      .eq("session_id", sessionId)
      .eq("event_type", "teacher_activity_configured")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const payload = data?.payload as Record<string, unknown> | undefined;
    const storedConfiguration = payload?.configuration as TeacherActivityConfiguration | undefined;
    if (storedConfiguration) return storedConfiguration;

    const session = await this.getSession(sessionId);
    if (!session) return null;
    const packQuery = await this.client
      .from("content_packs")
      .select("content, approved_at")
      .eq("version_id", session.contentVersionId)
      .maybeSingle();
    if (packQuery.error) throw new Error(packQuery.error.message);
    if (!packQuery.data) return null;
    return {
      mode: "teacher_authored",
      contentPack: packQuery.data.content,
      approvedAt: packQuery.data.approved_at,
    } as TeacherActivityConfiguration;
  }

  async claimAvailableAttempt(session: StudySession) {
    const [participantQuery, attemptQuery] = await Promise.all([
      this.client
        .from("participants")
        .select("*")
        .eq("session_id", session.id)
        .eq("eligible", true)
        .order("participant_tag", { ascending: true }),
      this.client.from("attempts").select("participant_id").eq("session_id", session.id),
    ]);
    if (participantQuery.error) throw new Error(participantQuery.error.message);
    if (attemptQuery.error) throw new Error(attemptQuery.error.message);

    const claimed = new Set(
      ((attemptQuery.data ?? []) as Array<{ participant_id: string }>).map(
        (row) => row.participant_id,
      ),
    );
    const available = ((participantQuery.data ?? []) as ParticipantRow[])
      .map(mapParticipant)
      .filter((participant) => !claimed.has(participant.id));

    for (const participant of available) {
      const { data, error } = await this.client
        .from("attempts")
        .insert({
          id: randomUUID(),
          session_id: session.id,
          participant_id: participant.id,
          participant_tag: participant.participantTag,
          condition: "adaptive",
          stage: "initial",
        })
        .select("*")
        .single();
      if (error?.code === "23505") continue;
      if (error) throw new Error(error.message);
      return mapAttempt(data as AttemptRow);
    }
    return null;
  }

  async getAttemptBundle(attemptId: string): Promise<AttemptBundle | null> {
    const attemptQuery = await this.client
      .from("attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();
    if (attemptQuery.error) throw new Error(attemptQuery.error.message);
    if (!attemptQuery.data) return null;
    const attempt = mapAttempt(attemptQuery.data as AttemptRow);

    const [sessionQuery, responsesQuery, decisionQuery, surveyQuery] = await Promise.all([
      this.client.from("sessions").select("*").eq("id", attempt.sessionId).single(),
      this.client
        .from("response_stages")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("server_timestamp", { ascending: true }),
      this.client
        .from("ai_decisions")
        .select("*")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      this.client.from("surveys").select("*").eq("attempt_id", attemptId).maybeSingle(),
    ]);
    if (sessionQuery.error) throw new Error(sessionQuery.error.message);
    if (responsesQuery.error) throw new Error(responsesQuery.error.message);
    if (decisionQuery.error) throw new Error(decisionQuery.error.message);
    if (surveyQuery.error) throw new Error(surveyQuery.error.message);

    return {
      attempt,
      session: mapSession(sessionQuery.data as SessionRow),
      responses: ((responsesQuery.data ?? []) as ResponseRow[]).map(mapResponse),
      decision: decisionQuery.data ? mapDecision(decisionQuery.data as DecisionRow) : null,
      survey: surveyQuery.data ? mapSurvey(surveyQuery.data as SurveyRow) : null,
    };
  }

  async updateAttemptStage(attemptId: string, stage: AttemptStage) {
    const updates: Record<string, string> = {
      stage,
      updated_at: new Date().toISOString(),
    };
    if (stage === "complete") updates.completed_at = updates.updated_at;
    const { data, error } = await this.client
      .from("attempts")
      .update({ ...updates, draft_text: null, draft_stage: null })
      .eq("id", attemptId)
      .select("*")
      .single();
    return mapAttempt(requireData(data as AttemptRow | null, error, "Update attempt"));
  }

  async saveDraft(attemptId: string, draftText: string, stage: AttemptStage) {
    const { error } = await this.client
      .from("attempts")
      .update({
        draft_text: draftText.slice(0, 2_000),
        draft_stage: stage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .eq("stage", stage);
    if (error) throw new Error(error.message);
  }

  async appendResponse(response: StudyResponse) {
    const { error } = await this.client.from("response_stages").insert({
      id: response.id,
      attempt_id: response.attemptId,
      stage: response.stage,
      prompt_id: response.promptId,
      response_text: response.responseText,
      confidence_choice: response.confidenceChoice,
      client_timestamp: response.clientTimestamp,
      server_timestamp: response.serverTimestamp,
      content_version_id: response.contentVersionId,
    });
    if (error) throw new Error(error.message);
  }

  async appendDecision(decision: AiDecision) {
    const { error } = await this.client.from("ai_decisions").insert({
      id: decision.id,
      attempt_id: decision.attemptId,
      provider: decision.provider,
      model: decision.model,
      schema_version: decision.schemaVersion,
      demonstrated_idea_ids: decision.demonstratedIdeaIds,
      missing_idea_ids: decision.missingIdeaIds,
      possible_alternative_conception_ids: decision.possibleAlternativeConceptionIds,
      evidence_spans: decision.evidenceSpans,
      routing_target_id: decision.routingTargetId,
      classification_confidence: decision.classificationConfidence,
      recommended_prompt_id: decision.recommendedPromptId,
      displayed_prompt_id: decision.displayedPromptId,
      abstain: decision.abstain,
      reason_codes: decision.reasonCodes,
      latency_ms: decision.latencyMs,
      fallback_reason: decision.fallbackReason,
      created_at: decision.createdAt,
    });
    if (error) throw new Error(error.message);
    if (decision.fallbackReason) {
      await this.client
        .from("attempts")
        .update({ technical_status: "fallback" })
        .eq("id", decision.attemptId);
    }
  }

  async saveSurvey(survey: StudentSurvey) {
    const { error } = await this.client.from("surveys").upsert(
      {
        attempt_id: survey.attemptId,
        clarity: survey.clarity,
        pressure: survey.pressure,
        helpfulness: survey.helpfulness,
        open_comment: survey.openComment,
        created_at: survey.createdAt,
      },
      { onConflict: "attempt_id" },
    );
    if (error) throw new Error(error.message);
  }

  async appendEvent(event: StudyEvent) {
    const { error } = await this.client.from("events").insert({
      id: event.id,
      session_id: event.sessionId,
      attempt_id: event.attemptId,
      event_type: event.eventType,
      payload: event.payload,
      created_at: event.createdAt,
    });
    if (error) throw new Error(error.message);
  }

  async saveTeacherAction(action: TeacherInstructionalAction) {
    const { error } = await this.client.from("teacher_actions").insert({
      id: action.id,
      session_id: action.sessionId,
      action_type: action.actionType,
      note: action.note,
      created_at: action.createdAt,
    });
    if (error) throw new Error(error.message);
  }

  async saveTeacherUsabilityEvent(event: TeacherUsabilityEvent) {
    const { error } = await this.client.from("teacher_usability_events").upsert({
      id: event.id,
      run_id: event.runId,
      participant_tag: event.participantTag,
      task_id: event.taskId,
      event_type: event.eventType,
      duration_ms: event.durationMs,
      payload: event.payload,
      created_at: event.createdAt,
    });
    if (error) throw new Error(error.message);
  }

  async saveTeacherUsabilitySubmission(submission: TeacherUsabilitySubmission) {
    const { error } = await this.client.from("teacher_usability_submissions").upsert(
      {
        id: submission.id,
        run_id: submission.runId,
        participant_tag: submission.participantTag,
        content_version_id: submission.contentVersionId,
        started_at: submission.startedAt,
        completed_at: submission.completedAt,
        authoring_draft: submission.authoringDraft,
        reviews: submission.reviews,
        class_summary: submission.classSummary,
        sus_responses: submission.susResponses,
        sus_score: submission.susScore,
        summary_usefulness: submission.summaryUsefulness,
        prompt_control: submission.promptControl,
        open_feedback: submission.openFeedback,
        task_metrics: submission.taskMetrics,
      },
      { onConflict: "run_id" },
    );
    if (error) throw new Error(error.message);
  }

  async listTeacherUsabilitySubmissions(): Promise<TeacherUsabilitySubmission[]> {
    const { data, error } = await this.client
      .from("teacher_usability_submissions")
      .select("*")
      .order("completed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      runId: row.run_id,
      participantTag: row.participant_tag,
      contentVersionId: row.content_version_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      authoringDraft: row.authoring_draft,
      reviews: row.reviews,
      classSummary: row.class_summary,
      susResponses: row.sus_responses,
      susScore: row.sus_score,
      summaryUsefulness: row.summary_usefulness,
      promptControl: row.prompt_control,
      openFeedback: row.open_feedback,
      taskMetrics: row.task_metrics,
    })) as TeacherUsabilitySubmission[];
  }

  async listSessions() {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as SessionRow[]).map(mapSession);
  }

  async createSession(input: CreateSessionInput): Promise<SessionCreationResult> {
    const sessionId = randomUUID();
    const contentVersionId = input.contentPack
      ? input.contentPack.versionId
      : input.contentVersionId;
    let session: StudySession | null = null;
    for (let attempt = 0; attempt < 5 && !session; attempt += 1) {
      const sessionQuery = await this.client
        .from("sessions")
        .insert({
          id: sessionId,
          title: input.title,
          join_code: generateJoinCode(),
          content_version_id: contentVersionId,
          status: "draft",
          assignment_seed: randomUUID(),
          duration_minutes: input.durationMinutes,
        })
        .select("*")
        .single();
      if (sessionQuery.error?.code === "23505") continue;
      session = mapSession(
        requireData(sessionQuery.data as SessionRow | null, sessionQuery.error, "Create session"),
      );
    }
    if (!session) throw new Error("Could not allocate a unique class code.");
    const conditions = adaptiveConditions(input.participantCount);
    const participants = Array.from({ length: input.participantCount }, (_, index) => {
      return {
        participantTag: `P${String(index + 1).padStart(2, "0")}`,
        condition: conditions[index],
      };
    });
    const rows = participants.map((participant) => ({
      id: randomUUID(),
      session_id: session.id,
      participant_tag: participant.participantTag,
      code_hash: hashInternalSlotKey(
        randomUUID(),
        requireProductionSecret("INTERNAL_SLOT_PEPPER", "development-internal-slot-pepper"),
      ),
      assigned_condition: participant.condition,
      eligible: true,
    }));
    try {
      if (input.contentPack) {
        const contentPackQuery = await this.client.from("content_packs").insert({
          version_id: input.contentPack.versionId,
          pack_id: input.contentPack.id,
          title: input.contentPack.title,
          content: structuredClone(input.contentPack),
          approved_at: input.approvedAt,
        });
        if (contentPackQuery.error) {
          throw new Error(`Store approved content pack: ${contentPackQuery.error.message}`);
        }
      }
      const participantQuery = await this.client.from("participants").insert(rows);
      if (participantQuery.error) throw new Error(participantQuery.error.message);
      if (input.contentPack || input.contentDraft) {
        const configuration: TeacherActivityConfiguration = input.contentPack
          ? {
              mode: "teacher_authored",
              approvedAt: input.approvedAt,
              contentPack: structuredClone(input.contentPack),
            }
          : {
              mode: "teacher_authored",
              contentDraft: structuredClone(input.contentDraft!),
            };
        const configurationQuery = await this.client.from("events").insert({
          id: randomUUID(),
          session_id: session.id,
          attempt_id: null,
          event_type: "teacher_activity_configured",
          payload: { configuration },
        });
        if (configurationQuery.error) throw new Error(configurationQuery.error.message);
      }
    } catch (error) {
      await this.client.from("sessions").delete().eq("id", session.id);
      if (input.contentPack) {
        await this.client
          .from("content_packs")
          .delete()
          .eq("version_id", input.contentPack.versionId);
      }
      throw error;
    }
    return { session };
  }

  async updateSessionStatus(sessionId: string, status: StudySession["status"]) {
    const timestamp = new Date().toISOString();
    const updates: Record<string, string> = { status };
    if (status === "active") updates.launched_at = timestamp;
    if (status === "closed") updates.closed_at = timestamp;
    const { error } = await this.client.from("sessions").update(updates).eq("id", sessionId);
    if (error) throw new Error(error.message);
  }

  async deleteSession(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    const { data, error } = await this.client
      .from("sessions")
      .delete()
      .eq("id", sessionId)
      .select("id");
    if (error) throw new Error(error.message);
    if (data?.length && session.contentVersionId.startsWith("teacher-")) {
      const packDelete = await this.client
        .from("content_packs")
        .delete()
        .eq("version_id", session.contentVersionId);
      if (packDelete.error) throw new Error(packDelete.error.message);
    }
    return Boolean(data?.length);
  }

  async getDashboardSnapshot(sessionId: string): Promise<DashboardSnapshot | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    const [participantQuery, attemptQuery, eventQuery, nameEventQuery, teacherActionQuery] = await Promise.all([
      this.client.from("participants").select("*").eq("session_id", sessionId),
      this.client.from("attempts").select("*").eq("session_id", sessionId),
      this.client
        .from("events")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(20),
      this.client
        .from("events")
        .select("*")
        .eq("session_id", sessionId)
        .eq("event_type", "student_joined")
        .order("created_at", { ascending: true }),
      this.client
        .from("teacher_actions")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (participantQuery.error) throw new Error(participantQuery.error.message);
    if (attemptQuery.error) throw new Error(attemptQuery.error.message);
    if (eventQuery.error) throw new Error(eventQuery.error.message);
    if (nameEventQuery.error) throw new Error(nameEventQuery.error.message);
    if (teacherActionQuery.error) throw new Error(teacherActionQuery.error.message);
    const participants = ((participantQuery.data ?? []) as ParticipantRow[]).map(mapParticipant);
    const attempts = ((attemptQuery.data ?? []) as AttemptRow[]).map(mapAttempt);
    const activityConfiguration = await this.getTeacherActivityConfiguration(sessionId);
    const contentPack = resolveContentPack(session.contentVersionId, activityConfiguration);
    const displayNamesByAttempt = new Map<string, string>();
    for (const event of (nameEventQuery.data ?? []) as EventRow[]) {
      const displayName = event.payload.displayName;
      if (event.attempt_id && typeof displayName === "string" && displayName.trim()) {
        displayNamesByAttempt.set(event.attempt_id, displayName.trim());
      }
    }
    const counts: DashboardSnapshot["counts"] = {
      not_started: participants.length - attempts.length,
      initial: 0,
      revision: 0,
      transfer: 0,
      survey: 0,
      complete: 0,
    };
    attempts.forEach((attempt) => (counts[attempt.stage] += 1));
    let decisions: AiDecision[] = [];
    if (attempts.length) {
      const decisionQuery = await this.client
        .from("ai_decisions")
        .select("*")
        .in(
          "attempt_id",
          attempts.map((attempt) => attempt.id),
        );
      if (decisionQuery.error) throw new Error(decisionQuery.error.message);
      decisions = ((decisionQuery.data ?? []) as DecisionRow[]).map(mapDecision);
    }
    const ideaCounts: Record<string, number> = {};
    const missingIdeaCounts: Record<string, number> = {};
    const misconceptionCounts: Record<string, number> = {};
    const patternExamples: DashboardSnapshot["patternExamples"] = {};
    decisions.forEach((decision) => {
      decision.demonstratedIdeaIds.forEach((id) => (ideaCounts[id] = (ideaCounts[id] ?? 0) + 1));
      decision.missingIdeaIds.forEach(
        (id) => (missingIdeaCounts[id] = (missingIdeaCounts[id] ?? 0) + 1),
      );
      decision.possibleAlternativeConceptionIds.forEach(
        (id) => (misconceptionCounts[id] = (misconceptionCounts[id] ?? 0) + 1),
      );
    });
    let responses: StudyResponse[] = [];
    if (attempts.length) {
      const responseQuery = await this.client
        .from("response_stages")
        .select("*")
        .in(
          "attempt_id",
          attempts.map((attempt) => attempt.id),
        )
        .eq("stage", "initial");
      if (responseQuery.error) throw new Error(responseQuery.error.message);
      responses = ((responseQuery.data ?? []) as ResponseRow[]).map(mapResponse);
    }
    if (session.status === "closed" && attempts.length) {
      for (const decision of decisions) {
        const attempt = attempts.find((item) => item.id === decision.attemptId);
        const response = responses.find((item) => item.attemptId === decision.attemptId);
        if (!attempt || !response) continue;
        for (const id of [
          ...decision.missingIdeaIds,
          ...decision.possibleAlternativeConceptionIds,
        ]) {
          patternExamples[id] ??= [];
          if (patternExamples[id].length < 3) {
            patternExamples[id].push({
              participantTag: attempt.participantTag,
              displayName: displayNamesByAttempt.get(attempt.id) ?? null,
              responseText: response.responseText,
              displayedPromptId: decision.displayedPromptId,
              evidenceSpans: decision.evidenceSpans.filter(
                (evidence) => evidence.labelId === id,
              ),
            });
          }
        }
      }
    }
    const submissionRows: DashboardSnapshot["submissionRows"] = attempts
      .map((attempt) => {
        const response = responses.find((item) => item.attemptId === attempt.id);
        const decision = decisions.find((item) => item.attemptId === attempt.id);
        return {
          participantTag: attempt.participantTag,
          displayName: displayNamesByAttempt.get(attempt.id) ?? null,
          stage: attempt.stage,
          responseText: response?.responseText ?? null,
          demonstratedIdeaIds: decision?.demonstratedIdeaIds ?? [],
          missingIdeaIds: decision?.missingIdeaIds ?? [],
          possibleAlternativeConceptionIds:
            decision?.possibleAlternativeConceptionIds ?? [],
          classificationConfidence: decision?.classificationConfidence ?? null,
          displayedPromptId: decision?.displayedPromptId ?? null,
          provider: decision?.provider ?? null,
          evidenceSpans: decision?.evidenceSpans ?? [],
          routingTargetId: decision?.routingTargetId ?? null,
        };
      })
      .sort((a, b) => a.participantTag.localeCompare(b.participantTag));
    return {
      session,
      activityConfiguration,
      participantCount: participants.length,
      counts,
      conditionCounts: {
        adaptive: participants.length,
      },
      fallbackCount: decisions.filter(
        (item) => item.displayedPromptId === (contentPack?.fallbackPrompt.id ?? traitInheritancePack.fallbackPrompt.id),
      ).length,
      ideaCounts,
      missingIdeaCounts,
      misconceptionCounts,
      patternExamples,
      submissionRows,
      recentEvents: ((eventQuery.data ?? []) as EventRow[]).map(mapEvent),
      teacherAction: teacherActionQuery.data
        ? mapTeacherAction(teacherActionQuery.data as TeacherActionRow)
        : null,
    };
  }

  async exportSession(sessionId: string) {
    const [session, configuration] = await Promise.all([
      this.getSession(sessionId),
      this.getTeacherActivityConfiguration(sessionId),
    ]);
    const { data, error } = await this.client
      .from("research_export")
      .select("*")
      .eq("session_id", sessionId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const cleaned = { ...row } as Record<string, string | number | boolean | null>;
      delete cleaned.teacher_study_run_id;
      delete cleaned.response_source;
      return {
        ...cleaned,
        condition: "adaptive",
        content_version_id: session?.contentVersionId ?? null,
        content_approved_at: configuration?.approvedAt ?? null,
      };
    }) as Array<
      Record<string, string | number | boolean | null>
    >;
  }
}
