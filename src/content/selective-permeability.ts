export interface IdeaDefinition {
  id: string;
  label: string;
  description: string;
}

export interface AlternativeConceptionDefinition {
  id: string;
  label: string;
  description: string;
}

export interface FollowUpPrompt {
  id: string;
  title: string;
  text: string;
  targets: string[];
}

export interface ContentPack {
  id: string;
  versionId: string;
  title: string;
  gradeBand: string;
  estimatedMinutes: number;
  teacherReviewStatus: "draft" | "approved";
  initialPrompt: { id: string; title: string; text: string };
  fixedReflectionPrompt: FollowUpPrompt;
  fallbackPrompt: FollowUpPrompt;
  followUps: FollowUpPrompt[];
  nearTransferPrompt: { id: string; title: string; text: string };
  ideas: IdeaDefinition[];
  alternativeConceptions: AlternativeConceptionDefinition[];
  surveyDisclosure: string;
}

export const selectivePermeabilityPack: ContentPack = {
  id: "selective-permeability",
  versionId: "selective-permeability-v1.0.0-draft",
  title: "Cell membranes and selective movement",
  gradeBand: "Grade 7 biology",
  estimatedMinutes: 12,
  teacherReviewStatus: "draft",
  initialPrompt: {
    id: "membrane_initial_01",
    title: "Explain what is happening",
    text:
      "A muscle cell needs oxygen and glucose and must remove carbon dioxide. Explain how the cell membrane can allow some substances to cross while limiting others, and how that movement affects conditions inside the cell. Write 2–4 sentences.",
  },
  fixedReflectionPrompt: {
    id: "control_reflection_01",
    title: "Take a second look",
    text:
      "Read your explanation once. What is one scientific relationship that you could make clearer? Revise your explanation so another seventh-grade student could follow your reasoning.",
    targets: [],
  },
  fallbackPrompt: {
    id: "membrane_clarify_01",
    title: "Clarify one relationship",
    text:
      "Choose one substance in the situation. What affects whether it crosses the membrane, and what changes inside the cell when it moves? Use that relationship when you revise.",
    targets: ["selective_boundary", "system_effect"],
  },
  followUps: [
    {
      id: "membrane_not_all_or_none_01",
      title: "Test the all-or-nothing idea",
      text:
        "If the membrane blocked every substance, how could the cell get oxygen or release carbon dioxide? Use this case to clarify what ‘selective’ means when you revise.",
      targets: ["selective_boundary", "membrane_blocks_everything"],
    },
    {
      id: "membrane_properties_01",
      title: "Consider what differs",
      text:
        "Oxygen and glucose do not cross a cell membrane in exactly the same way. What properties of a substance or parts of the membrane could make their movement different? Add the relationship—not just the vocabulary—to your revision.",
      targets: ["substance_and_membrane_properties", "size_only"],
    },
    {
      id: "membrane_gradient_01",
      title: "Consider concentration",
      text:
        "Imagine there is more oxygen outside the cell than inside it. How could that difference influence movement across the membrane? Connect the difference to the direction of movement in your revision.",
      targets: ["concentration_gradient"],
    },
    {
      id: "membrane_system_effect_01",
      title: "Connect movement to the cell",
      text:
        "Your explanation describes crossing. What does gaining a needed substance or removing a waste substance change for the conditions inside the cell? Make that cause-and-effect connection in your revision.",
      targets: ["system_effect"],
    },
  ],
  nearTransferPrompt: {
    id: "membrane_near_transfer_01",
    title: "Apply your thinking to a new cell",
    text:
      "After a meal, an intestinal cell is surrounded by water, nutrients, and ions. Explain why some substances may cross its membrane more readily than others and how this selective movement can affect conditions inside the cell. Write 2–4 sentences without using your earlier response.",
  },
  ideas: [
    {
      id: "selective_boundary",
      label: "Selective boundary",
      description: "The membrane permits some movement while limiting other movement.",
    },
    {
      id: "substance_and_membrane_properties",
      label: "Properties and proteins",
      description:
        "Movement depends on substance properties and membrane features such as transport proteins.",
    },
    {
      id: "concentration_gradient",
      label: "Concentration relationship",
      description: "A concentration difference can influence passive net movement.",
    },
    {
      id: "system_effect",
      label: "Effect on internal conditions",
      description: "Selective transport changes or maintains conditions inside the cell.",
    },
  ],
  alternativeConceptions: [
    {
      id: "membrane_blocks_everything",
      label: "Membrane blocks everything",
      description: "Treats the membrane as completely impermeable.",
    },
    {
      id: "membrane_allows_everything",
      label: "Everything crosses freely",
      description: "Treats the membrane as having no selective role.",
    },
    {
      id: "size_only",
      label: "Size alone determines movement",
      description: "Uses particle size as the only mechanism for all membrane transport.",
    },
  ],
  surveyDisclosure:
    "This activity uses a computer system to select a teacher-written question. It is not graded. Your teacher makes instructional decisions, and research scoring is completed separately by people.",
};

export const contentPacks = [selectivePermeabilityPack] as const;

export function getContentPack(versionId?: string) {
  if (!versionId) return selectivePermeabilityPack;
  return contentPacks.find((pack) => pack.versionId === versionId) ?? null;
}

export function getFollowUpPrompt(promptId: string) {
  const pack = selectivePermeabilityPack;
  return (
    pack.followUps.find((prompt) => prompt.id === promptId) ??
    (pack.fallbackPrompt.id === promptId ? pack.fallbackPrompt : null) ??
    (pack.fixedReflectionPrompt.id === promptId ? pack.fixedReflectionPrompt : null)
  );
}

