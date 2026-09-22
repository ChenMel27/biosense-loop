import { describe, expect, it } from "vitest";

import { productionConfigurationIssues } from "@/lib/config";

describe("production configuration", () => {
  it("accepts a complete persistent deployment", () => {
    expect(productionConfigurationIssues({
      NODE_ENV: "production",
      TEACHER_PASSWORD: "a-long-unique-teacher-password",
      SESSION_SIGNING_SECRET: "s".repeat(32),
      INTERNAL_SLOT_PEPPER: "p".repeat(32),
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-value-long-enough",
      AI_ROUTING_ENABLED: "true",
      AI_DEMO_ROUTING_ENABLED: "true",
      OPENAI_API_KEY: "test-key",
    })).toEqual([]);
  });

  it("reports unsafe production defaults", () => {
    const issues = productionConfigurationIssues({
      NODE_ENV: "production",
      TEACHER_PASSWORD: "short",
      SESSION_SIGNING_SECRET: "short",
      INTERNAL_SLOT_PEPPER: "short",
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      SUPABASE_SERVICE_ROLE_KEY: "replace-with-server-only-service-role-key",
      AI_ROUTING_ENABLED: "true",
    });

    expect(issues).toHaveLength(7);
    expect(issues.join(" ")).toContain("TEACHER_PASSWORD");
    expect(issues.join(" ")).toContain("OPENAI_API_KEY");
  });

  it("does not block local development", () => {
    expect(productionConfigurationIssues({ NODE_ENV: "development" })).toEqual([]);
  });
});
