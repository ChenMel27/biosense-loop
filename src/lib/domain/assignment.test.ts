import { describe, expect, it } from "vitest";

import {
  balancedConditions,
  hashParticipantCode,
  normalizeCode,
} from "@/lib/domain/assignment";

describe("study assignment", () => {
  it("creates an exactly balanced 30-student split", () => {
    const conditions = balancedConditions(30, () => 0.4);
    expect(conditions.filter((condition) => condition === "adaptive")).toHaveLength(15);
    expect(conditions.filter((condition) => condition === "reflection")).toHaveLength(15);
  });

  it("keeps odd groups within one participant", () => {
    const conditions = balancedConditions(29, () => 0.7);
    const adaptive = conditions.filter((condition) => condition === "adaptive").length;
    const reflection = conditions.filter((condition) => condition === "reflection").length;
    expect(Math.abs(adaptive - reflection)).toBe(1);
  });

  it("normalizes codes before hashing", () => {
    expect(normalizeCode(" bio-001 ")).toBe("BIO-001");
    expect(hashParticipantCode("bio-001", "pepper")).toBe(
      hashParticipantCode(" BIO-001 ", "pepper"),
    );
  });
});

