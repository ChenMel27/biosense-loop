import { apiError } from "@/lib/http";
import { isDemoMode } from "@/lib/store";
import { resetMemoryStore } from "@/lib/store/memory";

export async function POST() {
  if (process.env.NODE_ENV === "production" || !isDemoMode()) {
    return apiError("Demo reset is unavailable.", 404);
  }
  resetMemoryStore();
  return Response.json({ ok: true });
}

