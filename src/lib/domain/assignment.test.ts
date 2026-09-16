import { describe, expect, it } from "vitest";

import {
  adaptiveConditions,
  hashInternalSlotKey,
  normalizeCode,
} from "@/lib/domain/assignment";

describe("study assignment", () => {
  it("assigns every participant to response-specific routing", () => {
    expect(adaptiveConditions(30)).toEqual(Array(30).fill("adaptive"));
    expect(adaptiveConditions(29)).toEqual(Array(29).fill("adaptive"));
  });

  it("normalizes internal slot keys before hashing", () => {
    expect(normalizeCode(" slot-key ")).toBe("SLOT-KEY");
    expect(hashInternalSlotKey("slot-key", "pepper")).toBe(
      hashInternalSlotKey(" SLOT-KEY ", "pepper"),
    );
  });
});
