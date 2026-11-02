import {
  getContentPack,
  type ContentPack,
} from "@/content/trait-inheritance";
import type { EditableLessonDraft } from "@/lib/ai/lesson-draft";
import { formatGradeCourse } from "@/lib/domain/curriculum";
import type { TeacherContentDraft } from "@/lib/domain/types";

export const TEACHER_COMPLETION_PROMPT_ID = "teacher_complete_review";
export const TEACHER_FALLBACK_PROMPT_ID = "teacher_clarification";

export function lessonDraftToContentDraft(
  draft: EditableLessonDraft,
): TeacherContentDraft {
  const ideaIds = draft.targetIdeas.map((item) => item.id);
  const misconceptionIds = draft.possibleMisconceptions.map((item) => item.id);
  const analysisFocuses = [
    ...draft.targetIdeas.map((item, index) => ({
      id: `analysis_idea_${String(index + 1).padStart(2, "0")}`,
      title: item.label,
      text: `Primary analysis focus: missing or unclear relationship for ${item.label}.`,
      targetId: item.id,
    })),
    ...draft.possibleMisconceptions.map((item, index) => ({
      id: `analysis_misconception_${String(index + 1).padStart(2, "0")}`,
      title: item.label,
      text: `Primary analysis focus: possible incompatible claim for ${item.label}.`,
      targetId: item.id,
    })),
  ];
  const followUpIds = [
    ...analysisFocuses.map((item) => item.id),
    TEACHER_COMPLETION_PROMPT_ID,
  ];

  return {
    title: draft.lessonTitle,
    gradeLevel: draft.gradeLevel || undefined,
    course: draft.course,
    essentialVocabulary: draft.requiredVocabulary
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean),
    minimumInitialSentences: 3,
    gradeBand: formatGradeCourse(draft.gradeLevel, draft.course),
    scopeBoundary: draft.scopeBoundary,
    initialPrompt: [draft.studentContext.trim(), draft.studentPrompt.trim()]
      .filter(Boolean)
      .join("\n\n"),
    activityFlow: "single_response",
    includeTransfer: false,
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
    misconceptionSourceSupport: Object.fromEntries(
      draft.possibleMisconceptions.map((item) => [item.id, item.sourceSupport]),
    ),
    misconceptionTeacherActions: Object.fromEntries(
      draft.possibleMisconceptions.map((item) => [item.id, item.suggestedTeacherResponse]),
    ),
    followUpIds,
    followUpTitles: Object.fromEntries([
      ...analysisFocuses.map((item) => [item.id, item.title]),
      [TEACHER_COMPLETION_PROMPT_ID, "All approved ideas identified"],
      [TEACHER_FALLBACK_PROMPT_ID, "Teacher review may be needed"],
    ]),
    followUpPrompts: Object.fromEntries([
      ...analysisFocuses.map((item) => [item.id, item.text]),
      [TEACHER_COMPLETION_PROMPT_ID, "No missing or incompatible approved idea was selected as the primary focus."],
      [TEACHER_FALLBACK_PROMPT_ID, "The response was too unclear or outside the approved scope for a confident primary focus."],
    ]),
    followUpTargetIds: Object.fromEntries([
      ...analysisFocuses.map((item) => [item.id, [item.targetId]]),
      [TEACHER_COMPLETION_PROMPT_ID, ideaIds],
      [TEACHER_FALLBACK_PROMPT_ID, [...ideaIds, ...misconceptionIds]],
    ]),
    sourceNotes: draft.sourceNotes,
    teacherReviewChecks: draft.teacherReviewChecks,
  };
}

interface ApprovedPackMetadata {
  id: string;
  versionId: string;
  approvedAt: string;
  estimatedMinutes: number;
}

/** Build a standalone classroom pack without inheriting content from the demo activity. */
export function buildApprovedContentPack(
  draft: TeacherContentDraft,
  metadata: ApprovedPackMetadata,
): ContentPack {
  const ideaIds = draft.ideaIds ?? Object.keys(draft.ideaDescriptions);
  const misconceptionIds = draft.misconceptionIds ?? Object.keys(draft.misconceptionDescriptions);
  const activeTargetIds = new Set([...ideaIds, ...misconceptionIds]);
  const completionPromptId = draft.completionPromptId ?? TEACHER_COMPLETION_PROMPT_ID;
  const requestedFollowUpIds = draft.followUpIds ?? Object.keys(draft.followUpPrompts);
  const followUpIds = requestedFollowUpIds.filter(
    (id) => id !== TEACHER_FALLBACK_PROMPT_ID,
  );

  if (!ideaIds.length) throw new Error("The approved activity needs at least one target idea.");
  if (!followUpIds.includes(completionPromptId)) {
    throw new Error("The approved activity is missing its complete-response analysis mapping.");
  }
  if (!draft.followUpPrompts[TEACHER_FALLBACK_PROMPT_ID]) {
    throw new Error("The approved activity is missing its clarification analysis mapping.");
  }

  const followUps = followUpIds.map((id) => {
    const targets = id === completionPromptId
      ? ideaIds
      : (draft.followUpTargetIds?.[id] ?? []).filter((targetId) =>
          activeTargetIds.has(targetId),
        );
    if (!draft.followUpPrompts[id]) {
      throw new Error(`The approved activity is missing analysis mapping ${id}.`);
    }
    if (!targets.length) {
      throw new Error(`Analysis mapping ${id} is not connected to an active idea.`);
    }
    return {
      id,
      title: draft.followUpTitles?.[id] || "Follow up on your explanation",
      text: draft.followUpPrompts[id],
      targets,
      sourceIds: [],
    };
  });

  for (const targetId of activeTargetIds) {
    const hasQuestion = followUps.some(
      (prompt) => prompt.id !== completionPromptId && prompt.targets.includes(targetId),
    );
    if (!hasQuestion) {
      throw new Error(`The approved activity needs an analysis mapping for ${targetId}.`);
    }
  }

  return {
    id: metadata.id,
    versionId: metadata.versionId,
    title: draft.title || "Teacher-authored biology activity",
    gradeBand:
      draft.gradeBand ||
      formatGradeCourse(draft.gradeLevel, draft.course) ||
      "K–12 Biology",
    gradeLevel: draft.gradeLevel,
    essentialVocabulary: draft.essentialVocabulary ?? [],
    minimumInitialSentences: draft.minimumInitialSentences ?? 3,
    standards: [],
    scopeBoundary:
      draft.scopeBoundary ||
      "Classify only the scientific ideas and possible misconceptions approved for this activity.",
    estimatedMinutes: metadata.estimatedMinutes,
    teacherReviewStatus: "approved",
    initialPrompt: {
      id: "teacher_initial_explanation",
      title: "Explain your thinking",
      text: draft.initialPrompt,
    },
    activityFlow: draft.activityFlow ?? "legacy_learning_loop",
    includeTransfer: draft.includeTransfer ?? true,
    completionPromptId,
    fallbackPrompt: {
      id: TEACHER_FALLBACK_PROMPT_ID,
      title: draft.followUpTitles?.[TEACHER_FALLBACK_PROMPT_ID] || "Clarify your explanation",
      text: draft.followUpPrompts[TEACHER_FALLBACK_PROMPT_ID],
      targets: [...activeTargetIds],
      sourceIds: [],
    },
    followUps,
    nearTransferPrompt: {
      id: "teacher_near_transfer",
      title: "Apply your reasoning to a related example",
      text:
        draft.nearTransferPrompt ||
        "Use the same scientific reasoning to explain this related example.",
    },
    ideas: ideaIds.map((id) => ({
      id,
      label: draft.ideaLabels?.[id] || "Target scientific idea",
      description: draft.ideaDescriptions[id],
      teacherAction: draft.ideaTeacherActions?.[id] || "Review selected student responses.",
    })),
    alternativeConceptions: misconceptionIds.map((id) => ({
      id,
      label: draft.misconceptionLabels?.[id] || "Possible misconception",
      description: draft.misconceptionDescriptions[id],
      teacherAction:
        draft.misconceptionTeacherActions?.[id] || "Review selected student responses.",
      sourceIds: [],
      sourceSupport: draft.misconceptionSourceSupport?.[id] || "Teacher review required.",
    })),
    researchSources: [],
    authoringNotes: draft.sourceNotes ?? [],
    reviewChecks: draft.teacherReviewChecks ?? [],
    approvedAt: metadata.approvedAt,
    surveyDisclosure: draft.activityFlow === "single_response"
      ? "ExitLoop compares your explanation with ideas and possible misconceptions reviewed by your teacher. It does not grade your response or decide whether you have mastered the lesson."
      : "ExitLoop selected one follow-up question from a list your teacher reviewed. The activity does not grade your response or decide whether you have mastered the lesson.",
  };
}

export function resolveContentPack(
  contentVersionId: string,
  configuration: { contentPack?: ContentPack; contentDraft?: TeacherContentDraft } | null | undefined,
) {
  if (configuration?.contentPack?.versionId === contentVersionId) {
    return configuration.contentPack;
  }
  const basePack = getContentPack(contentVersionId);
  return basePack ? applyTeacherContentDraft(basePack, configuration?.contentDraft) : null;
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
    gradeBand:
      draft.gradeBand ||
      formatGradeCourse(draft.gradeLevel, draft.course) ||
      pack.gradeBand,
    gradeLevel: draft.gradeLevel ?? pack.gradeLevel,
    essentialVocabulary: draft.essentialVocabulary ?? pack.essentialVocabulary,
    minimumInitialSentences:
      draft.minimumInitialSentences ?? pack.minimumInitialSentences ?? 3,
    scopeBoundary: draft.scopeBoundary || pack.scopeBoundary,
    completionPromptId,
    initialPrompt: {
      ...pack.initialPrompt,
      text: draft.initialPrompt || pack.initialPrompt.text,
    },
    activityFlow: draft.activityFlow ?? pack.activityFlow ?? "legacy_learning_loop",
    includeTransfer: draft.includeTransfer ?? pack.includeTransfer ?? true,
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
        sourceSupport: draft.misconceptionSourceSupport?.[id] || original?.sourceSupport,
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
