import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import { hashParticipantCode } from "@/lib/domain/assignment";
import { MemoryResearchStore, resetMemoryStore } from "@/lib/store/memory";

describe("memory research store", () => {
  beforeEach(() => resetMemoryStore());

  it("resumes the same attempt for a participant", async () => {
    const store = new MemoryResearchStore();
    const session = await store.getSessionByJoinCode("GEN7");
    expect(session).not.toBeNull();
    const participant = await store.getParticipantByCodeHash(
      session!.id,
      hashParticipantCode("GEN-001", "development-only-pepper"),
    );
    expect(participant?.assignedCondition).toBe("adaptive");
    const first = await store.getOrCreateAttempt(session!, participant!);
    const resumed = await store.getOrCreateAttempt(session!, participant!);
    expect(resumed.id).toBe(first.id);
  });

  it("locks one response per research stage", async () => {
    const store = new MemoryResearchStore();
    const session = (await store.getSessionByJoinCode("GEN7"))!;
    const participant = (await store.getParticipantByCodeHash(
      session.id,
      hashParticipantCode("GEN-001", "development-only-pepper"),
    ))!;
    const attempt = await store.getOrCreateAttempt(session, participant);
    const response = {
      id: randomUUID(),
      attemptId: attempt.id,
      stage: "initial" as const,
      promptId: "inheritance_initial_01",
      responseText: "The offspring received one gene version on chromosome 3 from each parent.",
      confidenceChoice: "somewhat_sure" as const,
      clientTimestamp: null,
      serverTimestamp: new Date().toISOString(),
      contentVersionId: session.contentVersionId,
    };
    await store.appendResponse(response);
    await expect(store.appendResponse({ ...response, id: randomUUID() })).rejects.toThrow(
      "already locked",
    );
  });

  it("does not carry a draft into a later research stage", async () => {
    const store = new MemoryResearchStore();
    const session = (await store.getSessionByJoinCode("GEN7"))!;
    const participant = (await store.getParticipantByCodeHash(
      session.id,
      hashParticipantCode("GEN-001", "development-only-pepper"),
    ))!;
    const attempt = await store.getOrCreateAttempt(session, participant);
    await store.saveDraft(attempt.id, "Initial screen draft text", "initial");
    await store.updateAttemptStage(attempt.id, "revision");
    await store.saveDraft(attempt.id, "Late initial autosave", "initial");
    const bundle = await store.getAttemptBundle(attempt.id);
    expect(bundle?.attempt.draftText).toBeNull();
    expect(bundle?.attempt.draftStage).toBeNull();
  });

  it("reveals routed evidence examples only after the session closes", async () => {
    const store = new MemoryResearchStore();
    const session = (await store.getSessionByJoinCode("GEN7"))!;
    const participant = (await store.getParticipantByCodeHash(
      session.id,
      hashParticipantCode("GEN-001", "development-only-pepper"),
    ))!;
    const attempt = await store.getOrCreateAttempt(session, participant);
    await store.appendResponse({
      id: randomUUID(),
      attemptId: attempt.id,
      stage: "initial",
      promptId: "inheritance_initial_01",
      responseText: "Only the mother determines the bristle trait for this offspring.",
      confidenceChoice: "somewhat_sure",
      clientTimestamp: null,
      serverTimestamp: new Date().toISOString(),
      contentVersionId: session.contentVersionId,
    });
    await store.appendDecision({
      id: randomUUID(),
      attemptId: attempt.id,
      provider: "deterministic",
      model: "test-router",
      schemaVersion: "trait-inheritance-classifier-v2",
      demonstratedIdeaIds: ["gene_trait_information"],
      missingIdeaIds: ["both_parent_contributions"],
      possibleAlternativeConceptionIds: ["one_parent_determines_trait"],
      classificationConfidence: 0.8,
      recommendedPromptId: "inheritance_both_parents_probe_01",
      displayedPromptId: "inheritance_both_parents_probe_01",
      abstain: false,
      reasonCodes: ["contradictory_statement"],
      latencyMs: 1,
      fallbackReason: null,
      createdAt: new Date().toISOString(),
    });

    const activeSnapshot = await store.getDashboardSnapshot(session.id);
    expect(activeSnapshot?.missingIdeaCounts.both_parent_contributions).toBe(1);
    expect(activeSnapshot?.patternExamples.one_parent_determines_trait).toBeUndefined();

    await store.updateSessionStatus(session.id, "closed");
    const closedSnapshot = await store.getDashboardSnapshot(session.id);
    expect(closedSnapshot?.patternExamples.one_parent_determines_trait).toEqual([
      expect.objectContaining({
        participantTag: participant.participantTag,
        displayedPromptId: "inheritance_both_parents_probe_01",
      }),
    ]);
  });

  it("stores and replaces a teacher usability submission by run ID", async () => {
    const store = new MemoryResearchStore();
    const runId = randomUUID();
    const baseSubmission = {
      id: randomUUID(),
      runId,
      participantTag: "T01",
      contentVersionId: "test-content-v1",
      startedAt: "2026-09-08T12:00:00.000Z",
      completedAt: "2026-09-08T12:30:00.000Z",
      authoringDraft: {
        initialPrompt: "A complete test prompt long enough for validation.",
        ideaDescriptions: { idea: "Test idea" },
        misconceptionDescriptions: { misconception: "Test misconception" },
        followUpPrompts: { prompt: "Test follow-up prompt" },
      },
      reviews: [
        { sampleId: "S01", judgment: "agree" as const, correction: "" },
      ],
      classSummary: {
        primaryPatternId: "idea",
        interpretation: "A useful interpretation.",
        nextAction: "A useful next action.",
        confidence: 4,
      },
      susResponses: Array(10).fill(3),
      susScore: 50,
      summaryUsefulness: 4,
      promptControl: 4,
      openFeedback: "First submission",
      taskMetrics: [
        { taskId: "authoring" as const, durationMs: 100, completed: true },
        { taskId: "classification_review" as const, durationMs: 100, completed: true },
        { taskId: "class_summary" as const, durationMs: 100, completed: true },
        { taskId: "survey" as const, durationMs: 100, completed: true },
      ],
    };

    await store.saveTeacherUsabilitySubmission(baseSubmission);
    await store.saveTeacherUsabilitySubmission({
      ...baseSubmission,
      id: randomUUID(),
      openFeedback: "Updated submission",
    });

    const submissions = await store.listTeacherUsabilitySubmissions();
    expect(submissions).toHaveLength(1);
    expect(submissions[0].openFeedback).toBe("Updated submission");
  });
});
