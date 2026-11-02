import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetMemoryStore } from "@/lib/store/memory";
import { getStore } from "@/lib/store";

const authState = vi.hoisted(() => ({
  identity: null as { sub: string; sessionId: string } | null,
}));

vi.mock("@/lib/auth/guards", () => ({
  getStudentIdentity: vi.fn(async () => authState.identity),
}));

import { GET as getStudentState } from "@/app/api/student/state/route";
import { POST as submitStudentResponse } from "@/app/api/student/submit/route";

describe("single-response student API flow", () => {
  beforeEach(() => {
    resetMemoryStore();
    authState.identity = null;
  });

  async function startDemoAttempt() {
    const store = getStore();
    const session = await store.getSessionByJoinCode("GEN7");
    if (!session) throw new Error("Demo session is unavailable.");
    const attempt = await store.claimAvailableAttempt(session);
    if (!attempt) throw new Error("Demo attempt is unavailable.");
    authState.identity = { sub: attempt.id, sessionId: session.id };
    return { store, session, attempt };
  }

  it("locks one application response, analyzes it, and completes without a probe or survey", async () => {
    const { store, attempt } = await startDemoAttempt();
    const response = await submitStudentResponse(new Request("http://localhost/api/student/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "initial",
        responseText:
          "The offspring received one chromosome from each parent. Each chromosome carried the b version of the bristle gene. Because the offspring has b and b, the evidence connects those inherited gene versions to curved bristles.",
        clientTimestamp: "2026-10-31T16:00:00.000Z",
      }),
    }));

    expect(response.status).toBe(200);
    const bundle = await store.getAttemptBundle(attempt.id);
    expect(bundle?.attempt.stage).toBe("complete");
    expect(bundle?.responses).toHaveLength(1);
    expect(bundle?.responses[0]).toEqual(expect.objectContaining({
      stage: "initial",
      confidenceChoice: null,
    }));
    expect(bundle?.decision).not.toBeNull();
    expect(bundle?.survey).toBeNull();

    const dashboard = await store.getDashboardSnapshot(bundle!.session.id);
    const initialEvent = dashboard?.recentEvents.find((event) => event.eventType === "initial_locked");
    expect(initialEvent?.payload).toEqual(expect.objectContaining({
      selectedFeedbackFocusId: bundle?.decision?.displayedPromptId,
      promptDisplayed: false,
      nextStage: "complete",
    }));
    expect(initialEvent?.payload).not.toHaveProperty("displayedPromptId");

    const stateResponse = await getStudentState();
    const state = await stateResponse.json();
    expect(state.activity).toEqual(expect.objectContaining({
      stage: "complete",
      activityFlow: "single_response",
      followUp: null,
    }));
    expect(state.activity.learningSummary).not.toBeNull();
  });

  it("keeps the response editable when fewer than three complete sentences are submitted", async () => {
    const { store, attempt } = await startDemoAttempt();
    const response = await submitStudentResponse(new Request("http://localhost/api/student/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "initial",
        responseText:
          "The offspring received a chromosome from each parent. The b versions are connected to curved bristles.",
      }),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Add 1 more complete sentence/);
    const bundle = await store.getAttemptBundle(attempt.id);
    expect(bundle?.attempt.stage).toBe("initial");
    expect(bundle?.responses).toHaveLength(0);
  });

  it("resumes analysis when the response was saved before an interrupted request", async () => {
    const { store, attempt, session } = await startDemoAttempt();
    const lockedText =
      "The offspring received one chromosome from each parent. Each chromosome carried a b version of the gene. The two inherited b versions are connected to the curved-bristle trait.";
    await store.appendResponse({
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      stage: "initial",
      promptId: "inheritance_initial_01",
      responseText: lockedText,
      confidenceChoice: null,
      clientTimestamp: null,
      serverTimestamp: "2026-10-31T16:00:00.000Z",
      contentVersionId: session.contentVersionId,
    });

    const response = await submitStudentResponse(new Request("http://localhost/api/student/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "initial",
        responseText: lockedText,
      }),
    }));

    expect(response.status).toBe(200);
    const bundle = await store.getAttemptBundle(attempt.id);
    expect(bundle?.attempt.stage).toBe("complete");
    expect(bundle?.responses).toHaveLength(1);
    expect(bundle?.decision).not.toBeNull();
  });
});
