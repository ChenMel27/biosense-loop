import { describe, expect, it } from "vitest";

import {
  adaptiveConditions,
  hashParticipantCode,
  normalizeCode,
} from "@/lib/domain/assignment";

describe("study assignment", () => {
  it("assigns every participant to response-specific routing", () => {
    expect(adaptiveConditions(30)).toEqual(Array(30).fill("adaptive"));
    expect(adaptiveConditions(29)).toEqual(Array(29).fill("adaptive"));
  });

  it("normalizes codes before hashing", () => {
    expect(normalizeCode(" gen-001 ")).toBe("GEN-001");
    expect(hashParticipantCode("gen-001", "pepper")).toBe(
      hashParticipantCode(" GEN-001 ", "pepper"),
    );
  });
});
