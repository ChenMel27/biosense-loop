import type { ActivityFlow, AttemptStage } from "@/lib/domain/types";

export function nextStageAfterRevision(includeTransfer: boolean | undefined): AttemptStage {
  return includeTransfer === false ? "survey" : "transfer";
}

export function studentProgressSteps(
  includeTransfer: boolean | undefined,
  activityFlow: ActivityFlow = "legacy_learning_loop",
) {
  if (activityFlow === "single_response") {
    return [
      { id: "initial" as const, label: "Explain" },
      { id: "complete" as const, label: "Review" },
    ];
  }
  return [
    { id: "initial" as const, label: "Explain" },
    { id: "revision" as const, label: "Revise" },
    ...(includeTransfer === false
      ? []
      : [{ id: "transfer" as const, label: "New example" }]),
    { id: "survey" as const, label: "Reflect" },
  ];
}
