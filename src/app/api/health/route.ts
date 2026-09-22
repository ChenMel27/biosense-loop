import { isLiveAiRoutingEnabled } from "@/lib/ai/classifier";
import { productionConfigurationIssues } from "@/lib/config";
import { isDemoMode, isPersistentStorageConfigured } from "@/lib/store";

export async function GET() {
  const hasPersistentStorage = isPersistentStorageConfigured();
  const configurationIssues = productionConfigurationIssues();
  const productionReady = configurationIssues.length === 0;

  return Response.json(
    {
      ok: productionReady,
      service: "exitloop",
      storage: hasPersistentStorage
        ? "supabase"
        : isDemoMode()
          ? "memory-demo"
          : "unconfigured",
      aiRouting: isLiveAiRoutingEnabled() ? "live" : "fallback",
      contentPacks: "versioned-per-session",
      configuration: productionReady ? "ready" : "needs-attention",
      configurationIssues,
      timestamp: new Date().toISOString(),
    },
    { status: productionReady ? 200 : 503 },
  );
}
