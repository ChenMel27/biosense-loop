import { traitInheritancePack, type ContentPack } from "@/content/trait-inheritance";
import type { EditableLessonDraft } from "@/lib/ai/lesson-draft";
import type { TeacherContentDraft } from "@/lib/domain/types";

export const TEACHER_COMPLETION_PROMPT_ID = "teacher_complete_review";

export function lessonDraftToContentDraft(draft: EditableLessonDraft): TeacherContentDraft {
  const ideaIds = draft.targetIdeas.map((item) => item.id);
  const misconceptionIds = draft.possibleMisconceptions.map((item) => item.id);
  const activeTargetIds = new Set([...ideaIds, ...misconceptionIds]);
  const questions = draft.followUpQuestions.filter((item) => activeTargetIds.has(item.targetId));
  const followUpIds = [...questions.map((item) => item.id), TEACHER_COMPLETION_PROMPT_ID];

  return {
    title: draft.lessonTitle,
    gradeBand: draft.gradeBand,
    scopeBoundary: draft.scopeBoundary,
    initialPrompt: [draft.studentContext.trim(), draft.studentPrompt.trim()]
      .filter(Boolean)
      .join("\n\n"),
    nearTransferPrompt: draft.nearTransferPrompt,
    completionPromptId: TEACHER_COMPLETION_PROMPT_ID,
    ideaIds,
    ideaLabels: Object.fromEntries(draft.targetIdeas.map((item) => [item.id, item.label])),
    ideaDescriptions: Object.fromEntries(
      draft.targetIdeas.map((item) => [item.id, item.description]),
    ),
    ideaTeacherActions: Object.fromEntries(
      draft.targetIdeas.map((item) => [item.id, item.suggestedTeacherResponse]),
    ),
    misconceptionIds,
    misconceptionLabels: Object.fromEntries(
      draft.possibleMisconceptions.map((item) => [item.id, item.label]),
    ),
    misconceptionDescriptions: Object.fromEntries(
      draft.possibleMisconceptions.map((item) => [item.id, item.description]),
    ),
    misconceptionTeacherActions: Object.fromEntries(
      draft.possibleMisconceptions.map((item) => [item.id, item.suggestedTeacherResponse]),
    ),
    followUpIds,
    followUpTitles: Object.fromEntries([
      ...questions.map((item) => [item.id, item.title]),
      [TEACHER_COMPLETION_PROMPT_ID, "Review your explanation"],
      [traitInheritancePack.fallbackPrompt.id, "Clarify your explanation"],
    ]),
    followUpPrompts: Object.fromEntries([
      ...questions.map((item) => [item.id, item.question]),
      [TEACHER_COMPLETION_PROMPT_ID, draft.completionQuestion],
      [traitInheritancePack.fallbackPrompt.id, draft.clarificationQuestion],
    ]),
    followUpTargetIds: Object.fromEntries([
      ...questions.map((item) => [item.id, [item.targetId]]),
      [TEACHER_COMPLETION_PROMPT_ID, ideaIds],
      [traitInheritancePack.fallbackPrompt.id, [...ideaIds, ...misconceptionIds]],
    ]),
  };
}

export function applyTeacherContentDraft(
  pack: ContentPack,
  draft: TeacherContentDraft | null | undefined,
): ContentPack {
  if (!draft) return pack;

  const ideasById = new Map(pack.ideas.map((idea) => [idea.id, idea]));
  const misconceptionsById = new Map(
    pack.alternativeConceptions.map((item) => [item.id, item]),
  );
  const followUpsById = new Map(pack.followUps.map((prompt) => [prompt.id, prompt]));
  const ideaIds = draft.ideaIds ?? pack.ideas.map((idea) => idea.id);
  const misconceptionIds =
    draft.misconceptionIds ?? pack.alternativeConceptions.map((item) => item.id);
  const followUpIds = draft.followUpIds ?? pack.followUps.map((prompt) => prompt.id);
  const completionPromptId = draft.completionPromptId ?? pack.completionPromptId;
  const activeTargetIds = new Set([...ideaIds, ...misconceptionIds]);
  const firstTargetId = ideaIds[0] ?? misconceptionIds[0];

  function validTargets(targets: string[] | undefined) {
    const filtered = (targets ?? []).filter((id) => activeTargetIds.has(id));
    return filtered.length ? filtered : firstTargetId ? [firstTargetId] : [];
  }

  return {
    ...pack,
    title: draft.title || pack.title,
    gradeBand: draft.gradeBand || pack.gradeBand,
    scopeBoundary: draft.scopeBoundary || pack.scopeBoundary,
    completionPromptId,
    initialPrompt: {
      ...pack.initialPrompt,
      text: draft.initialPrompt || pack.initialPrompt.text,
    },
    nearTransferPrompt: {
      ...pack.nearTransferPrompt,
      text: draft.nearTransferPrompt || pack.nearTransferPrompt.text,
    },
    ideas: ideaIds.map((id) => {
      const original = ideasById.get(id);
      return {
        id,
        label: draft.ideaLabels?.[id] || original?.label || "Untitled target idea",
        description:
          draft.ideaDescriptions[id] || original?.description || "Teacher definition needed.",
        teacherAction:
          draft.ideaTeacherActions?.[id] ||
          original?.teacherAction ||
          "Teacher response not added yet.",
      };
    }),
    alternativeConceptions: misconceptionIds.map((id) => {
      const original = misconceptionsById.get(id);
      return {
        id,
        label:
          draft.misconceptionLabels?.[id] || original?.label || "Untitled possible misconception",
        description:
          draft.misconceptionDescriptions[id] ||
          original?.description ||
          "Teacher definition needed.",
        teacherAction:
          draft.misconceptionTeacherActions?.[id] ||
          original?.teacherAction ||
          "Teacher response not added yet.",
        sourceIds: original?.sourceIds ?? [],
      };
    }),
    followUps: followUpIds.map((id) => {
      const original = followUpsById.get(id);
      return {
        id,
        title: draft.followUpTitles?.[id] || original?.title || "Untitled follow-up",
        text: draft.followUpPrompts[id] || original?.text || "Teacher question needed.",
        targets:
          id === completionPromptId
            ? [...ideaIds]
            : validTargets(draft.followUpTargetIds?.[id] || original?.targets),
        sourceIds: original?.sourceIds ?? [],
      };
    }),
    fallbackPrompt: {
      ...pack.fallbackPrompt,
      title:
        draft.followUpTitles?.[pack.fallbackPrompt.id] ||
        pack.fallbackPrompt.title,
      text: draft.followUpPrompts[pack.fallbackPrompt.id] || pack.fallbackPrompt.text,
      targets: [...ideaIds, ...misconceptionIds],
    },
  };
}
