interface RuntimeEnvironment {
  NODE_ENV?: string;
  TEACHER_PASSWORD?: string;
  SESSION_SIGNING_SECRET?: string;
  INTERNAL_SLOT_PEPPER?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  AI_ROUTING_ENABLED?: string;
  AI_DEMO_ROUTING_ENABLED?: string;
  MINOR_DATA_SAFEGUARDS_CONFIRMED?: string;
  OPENAI_API_KEY?: string;
}

function isPlaceholder(value: string | undefined) {
  return !value || /replace-with|your-project|change-me/i.test(value);
}

export function productionConfigurationIssues(
  env: RuntimeEnvironment = process.env as RuntimeEnvironment,
) {
  if (env.NODE_ENV !== "production") return [];
  const issues: string[] = [];

  if (isPlaceholder(env.TEACHER_PASSWORD) || (env.TEACHER_PASSWORD?.length ?? 0) < 16) {
    issues.push("TEACHER_PASSWORD must be a unique value with at least 16 characters.");
  }
  if (
    isPlaceholder(env.SESSION_SIGNING_SECRET) ||
    (env.SESSION_SIGNING_SECRET?.length ?? 0) < 32
  ) {
    issues.push("SESSION_SIGNING_SECRET must contain at least 32 characters.");
  }
  if (
    isPlaceholder(env.INTERNAL_SLOT_PEPPER) ||
    (env.INTERNAL_SLOT_PEPPER?.length ?? 0) < 32
  ) {
    issues.push("INTERNAL_SLOT_PEPPER must contain at least 32 characters.");
  }
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    if (url.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    issues.push("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS project URL.");
  }
  if (
    isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY) ||
    (env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0) < 20
  ) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  if (env.AI_ROUTING_ENABLED === "true") {
    if (!env.OPENAI_API_KEY) issues.push("OPENAI_API_KEY is required when AI routing is enabled.");
    if (
      env.AI_DEMO_ROUTING_ENABLED !== "true" &&
      env.MINOR_DATA_SAFEGUARDS_CONFIRMED !== "true"
    ) {
      issues.push("AI routing requires one explicitly approved use context.");
    }
  }
  return issues;
}

export function requireProductionSecret(
  name: "SESSION_SIGNING_SECRET" | "INTERNAL_SLOT_PEPPER",
  developmentFallback: string,
) {
  const value = process.env[name];
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error(`${name} must contain at least 32 characters in production.`);
  }
  return value || developmentFallback;
}
