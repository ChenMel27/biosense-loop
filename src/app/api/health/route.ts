import { isDemoMode, isPersistentStorageConfigured } from "@/lib/store";

export async function GET() {
  const hasPersistentStorage = isPersistentStorageConfigured();
  const productionReady = process.env.NODE_ENV !== "production" || hasPersistentStorage;

  return Response.json(
    {
      ok: productionReady,
      service: "exitloop",
      storage: hasPersistentStorage
        ? "supabase"
        : isDemoMode()
          ? "memory-demo"
          : "unconfigured",
      aiRouting: process.env.AI_ROUTING_ENABLED === "true" ? "configured" : "fallback",
      contentPack: process.env.CONTENT_PACK_APPROVED === "true" ? "approved" : "draft",
      timestamp: new Date().toISOString(),
    },
    { status: productionReady ? 200 : 503 },
  );
}
