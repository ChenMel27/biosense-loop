import { describe, expect, it } from "vitest";

import { nextStageAfterRevision, studentProgressSteps } from "@/lib/student/flow";

describe("student activity flow", () => {
  it("keeps transfer enabled for legacy activities", () => {
    expect(nextStageAfterRevision(undefined)).toBe("transfer");
    expect(studentProgressSteps(undefined).map((step) => step.id)).toEqual([
      "initial",
      "revision",
      "transfer",
      "survey",
    ]);
  });

  it("skips transfer for a focused exit ticket", () => {
    expect(nextStageAfterRevision(false)).toBe("survey");
    expect(studentProgressSteps(false).map((step) => step.id)).toEqual([
      "initial",
      "revision",
      "survey",
    ]);
  });

  it("uses one response and one summary for new activities", () => {
    expect(studentProgressSteps(false, "single_response").map((step) => step.id)).toEqual([
      "initial",
      "complete",
    ]);
  });
});
