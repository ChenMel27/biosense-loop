import { describe, expect, it } from "vitest";

import { withinRateLimit } from "@/lib/rate-limit";

describe("classroom-aware rate limiting", () => {
  it("allows a 30-device classroom burst", () => {
    const key = `classroom-${crypto.randomUUID()}`;
    const results = Array.from({ length: 30 }, () => withinRateLimit(key, 120, 60_000));
    expect(results.every(Boolean)).toBe(true);
  });

  it("blocks repeated guesses against the same code", () => {
    const key = `participant-${crypto.randomUUID()}`;
    for (let count = 0; count < 8; count += 1) {
      expect(withinRateLimit(key, 8, 60_000)).toBe(true);
    }
    expect(withinRateLimit(key, 8, 60_000)).toBe(false);
  });
});

