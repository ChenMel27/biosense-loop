import { describe, expect, it } from "vitest";

import { isLiveAiRoutingEnabled } from "@/lib/ai/classifier";

describe("live AI routing configuration", () => {
  it("allows an adult demonstration when routing and a key are configured", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      AI_DEMO_ROUTING_ENABLED: "true",
      OPENAI_API_KEY: "test-key",
    })).toBe(true);
  });

  it("allows an approved minors context without enabling demo mode", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      MINOR_DATA_SAFEGUARDS_CONFIRMED: "true",
      OPENAI_API_KEY: "test-key",
    })).toBe(true);
  });

  it("keeps live routing off without an approved context", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      OPENAI_API_KEY: "test-key",
    })).toBe(false);
  });

  it("keeps live routing off when the API key is missing", () => {
    expect(isLiveAiRoutingEnabled({
      AI_ROUTING_ENABLED: "true",
      AI_DEMO_ROUTING_ENABLED: "true",
    })).toBe(false);
  });
});
