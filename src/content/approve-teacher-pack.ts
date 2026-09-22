import { createHash, randomUUID } from "node:crypto";

import { buildApprovedContentPack } from "@/content/teacher-draft";
import type { ContentPack } from "@/content/trait-inheritance";
import type { TeacherActivityConfiguration, TeacherContentDraft } from "@/lib/domain/types";

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "biology-activity";
}

export function approveTeacherContentPack(
  draft: TeacherContentDraft,
  estimatedMinutes: number,
  approvedAt = new Date().toISOString(),
): TeacherActivityConfiguration & { contentPack: ContentPack; approvedAt: string } {
  const activityId = `teacher-${slug(draft.title || "biology-activity")}`;
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ draft, estimatedMinutes, approvedAt }))
    .digest("hex")
    .slice(0, 12);
  const versionId = `${activityId}-${approvedAt.replace(/\D/g, "").slice(0, 14)}-${fingerprint}-${randomUUID().slice(0, 8)}`;
  const contentPack = buildApprovedContentPack(draft, {
    id: `${activityId}-${randomUUID().slice(0, 8)}`,
    versionId,
    approvedAt,
    estimatedMinutes,
  });

  return {
    mode: "teacher_authored",
    approvedAt,
    contentPack,
  };
}
