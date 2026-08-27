import { isDemoMode } from "@/lib/store";

export async function GET() {
  return Response.json({
    ok: true,
    service: "biosense-loop",
    storage: isDemoMode() ? "memory-demo" : "supabase",
    aiRouting: process.env.AI_ROUTING_ENABLED === "true" ? "configured" : "fallback",
    contentPack: process.env.CONTENT_PACK_APPROVED === "true" ? "approved" : "draft",
    timestamp: new Date().toISOString(),
  });
}
