import { MemoryResearchStore } from "@/lib/store/memory";
import { SupabaseResearchStore } from "@/lib/store/supabase";
import type { ResearchStore } from "@/lib/store/types";

let store: ResearchStore | null = null;

export function getStore(): ResearchStore {
  if (store) return store;
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  if (!hasSupabase && process.env.NODE_ENV === "production") {
    throw new Error("Persistent Supabase storage is required in production.");
  }
  store = hasSupabase ? new SupabaseResearchStore() : new MemoryResearchStore();
  return store;
}

export function isDemoMode() {
  return process.env.NODE_ENV !== "production" && !(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
