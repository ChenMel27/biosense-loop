import { createHash, randomBytes } from "node:crypto";

import type { Condition } from "@/lib/domain/types";

export function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashInternalSlotKey(value: string, pepper: string) {
  return createHash("sha256")
    .update(`${pepper}:${normalizeCode(value)}`)
    .digest("hex");
}

export function generateJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function adaptiveConditions(count: number): Condition[] {
  return Array.from({ length: count }, () => "adaptive");
}
