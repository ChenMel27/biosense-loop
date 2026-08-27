import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import { hashParticipantCode } from "@/lib/domain/assignment";
import { MemoryResearchStore, resetMemoryStore } from "@/lib/store/memory";

describe("memory research store", () => {
  beforeEach(() => resetMemoryStore());

  it("resumes the same attempt for a participant", async () => {
    const store = new MemoryResearchStore();
    const session = await store.getSessionByJoinCode("BIO7");
    expect(session).not.toBeNull();
    const participant = await store.getParticipantByCodeHash(
      session!.id,
      hashParticipantCode("BIO-001", "development-only-pepper"),
    );
    expect(participant?.assignedCondition).toBe("adaptive");
    const first = await store.getOrCreateAttempt(session!, participant!);
    const resumed = await store.getOrCreateAttempt(session!, participant!);
    expect(resumed.id).toBe(first.id);
  });

  it("locks one response per research stage", async () => {
    const store = new MemoryResearchStore();
    const session = (await store.getSessionByJoinCode("BIO7"))!;
    const participant = (await store.getParticipantByCodeHash(
      session.id,
      hashParticipantCode("BIO-001", "development-only-pepper"),
    ))!;
    const attempt = await store.getOrCreateAttempt(session, participant);
    const response = {
      id: randomUUID(),
      attemptId: attempt.id,
      stage: "initial" as const,
      promptId: "membrane_initial_01",
      responseText: "The membrane allows some materials to cross and limits others.",
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
    const session = (await store.getSessionByJoinCode("BIO7"))!;
    const participant = (await store.getParticipantByCodeHash(
      session.id,
      hashParticipantCode("BIO-001", "development-only-pepper"),
    ))!;
    const attempt = await store.getOrCreateAttempt(session, participant);
    await store.saveDraft(attempt.id, "Initial screen draft text", "initial");
    await store.updateAttemptStage(attempt.id, "revision");
    await store.saveDraft(attempt.id, "Late initial autosave", "initial");
    const bundle = await store.getAttemptBundle(attempt.id);
    expect(bundle?.attempt.draftText).toBeNull();
    expect(bundle?.attempt.draftStage).toBeNull();
  });
});
