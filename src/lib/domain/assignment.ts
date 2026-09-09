import { createHash, randomBytes } from "node:crypto";

import type { Condition } from "@/lib/domain/types";

export function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashParticipantCode(value: string, pepper: string) {
  return createHash("sha256")
    .update(`${pepper}:${normalizeCode(value)}`)
    .digest("hex");
}

export function generateJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function generateParticipantCode(index: number) {
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `GEN-${String(index + 1).padStart(2, "0")}-${suffix}`;
}

export function balancedConditions(count: number, random: () => number = Math.random) {
  const conditions: Condition[] = Array.from({ length: count }, (_, index) =>
    index < Math.ceil(count / 2) ? "adaptive" : "reflection",
  );

  for (let index = conditions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [conditions[index], conditions[swapIndex]] = [conditions[swapIndex], conditions[index]];
  }

  return conditions;
}
