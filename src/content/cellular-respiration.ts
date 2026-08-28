export interface IdeaDefinition {
  id: string;
  label: string;
  description: string;
}

export interface AlternativeConceptionDefinition {
  id: string;
  label: string;
  description: string;
  teacherAction: string;
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
  standards: string[];
  scopeBoundary: string;
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

export const cellularRespirationPack: ContentPack = {
  id: "cellular-respiration-ecosystems",
  versionId: "cellular-respiration-ecosystems-v1.0.0-draft",
  title: "Cellular respiration in matter cycling and energy flow",
  gradeBand: "Georgia Grade 7 life science",
  standards: ["Georgia GSE S7L4", "Georgia GSE S7L4.b"],
  scopeBoundary:
    "Students trace matter and energy through organisms and their environment. The activity does not assess biochemical stages, molecular pathways, ATP accounting, or a memorized cellular-respiration equation.",
  estimatedMinutes: 12,
  teacherReviewStatus: "draft",
  initialPrompt: {
    id: "respiration_initial_01",
    title: "Trace matter and energy",
    text:
      "A rabbit eats grass and later releases carbon dioxide. Its cells also use energy from the food to move and stay alive. Explain what happens to the matter from the grass and what happens to the energy as cellular respiration occurs. Include how the rabbit connects to its environment. Write 2–4 sentences.",
  },
  fixedReflectionPrompt: {
    id: "control_reflection_01",
    title: "Take a second look",
    text:
      "Read your explanation once. What is one scientific relationship that you could make clearer? Revise your explanation so another seventh-grade student could follow your reasoning.",
    targets: [],
  },
  fallbackPrompt: {
    id: "respiration_clarify_01",
    title: "Trace two paths",
    text:
      "Trace two paths separately: What happens to matter from the rabbit's food, and what happens to the energy stored in that food? Then connect cellular respiration to the rabbit's environment when you revise.",
    targets: ["matter_path", "energy_flow", "ecosystem_connection"],
  },
  followUps: [
    {
      id: "respiration_breathing_probe_01",
      title: "Separate two related processes",
      text:
        "Breathing moves gases into and out of the rabbit, while cellular respiration occurs in its cells. How are those processes connected without being the same process? Use that distinction in your revision.",
      targets: ["cellular_respiration_role", "respiration_is_breathing_only"],
    },
    {
      id: "respiration_matter_energy_probe_01",
      title: "Keep matter and energy separate",
      text:
        "Suppose the carbon atoms in food simply became energy. Could those same carbon atoms later be part of carbon dioxide? Trace the carbon matter and the energy as two different paths in your revision.",
      targets: ["matter_path", "energy_flow", "matter_becomes_energy_or_disappears"],
    },
    {
      id: "respiration_plants_probe_01",
      title: "Consider every living organism",
      text:
        "Plants make sugars during photosynthesis, but their cells also need usable energy. What process can release energy from food in plant cells as well as animal cells? Add that relationship to your revision.",
      targets: ["cellular_respiration_role", "plants_do_not_respire"],
    },
    {
      id: "respiration_flow_cycle_probe_01",
      title: "Compare a cycle with a flow",
      text:
        "Matter can return to the air, soil, and living things, but energy eventually leaves the ecosystem as heat. Which part cycles and which part flows? Make that difference clear in your revision.",
      targets: ["matter_path", "energy_flow", "energy_cycles_like_matter"],
    },
    {
      id: "respiration_ecosystem_probe_01",
      title: "Connect the organism to the system",
      text:
        "Your explanation describes what happens inside the rabbit. How do carbon dioxide, food matter, and energy connect the rabbit to producers, decomposers, and the nonliving environment? Add one clear system connection.",
      targets: ["ecosystem_connection"],
    },
  ],
  nearTransferPrompt: {
    id: "respiration_near_transfer_01",
    title: "Apply your model to a terrarium",
    text:
      "A closed terrarium contains a plant, a small insect, decomposers, air, and soil, and it receives light. Explain how matter can cycle among the organisms and nonliving parts and how energy flows through the system. Include the role of cellular respiration, but do not list biochemical steps. Write 2–4 sentences without using your earlier response.",
  },
  ideas: [
    {
      id: "matter_path",
      label: "Matter is traced",
      description:
        "Food matter is rearranged and can move into body structures, waste, carbon dioxide, and other ecosystem components rather than disappearing.",
    },
    {
      id: "energy_flow",
      label: "Energy flows",
      description:
        "Chemical energy is transferred and used by organisms, with some eventually leaving the ecosystem as heat; energy does not cycle like matter.",
    },
    {
      id: "cellular_respiration_role",
      label: "Role of cellular respiration",
      description:
        "Cellular respiration is a cellular process that releases usable energy from food and is related to, but not identical with, breathing.",
    },
    {
      id: "ecosystem_connection",
      label: "Ecosystem connection",
      description:
        "The explanation connects cellular respiration in organisms with matter cycling and energy flow among biotic and abiotic components.",
    },
  ],
  alternativeConceptions: [
    {
      id: "respiration_is_breathing_only",
      label: "Respiration means breathing only",
      description:
        "Treats gas movement by the respiratory system as identical to the cellular process that releases usable energy from food.",
      teacherAction:
        "Two-minute fix: contrast a lungs-level gas-exchange diagram with a cell-level food-and-energy diagram, then ask students to draw one arrow connecting them.",
    },
    {
      id: "matter_becomes_energy_or_disappears",
      label: "Food matter becomes energy or disappears",
      description:
        "Converts matter into energy or fails to account for matter after food is used.",
      teacherAction:
        "Two-minute fix: color-code carbon atoms and energy arrows separately; require students to trace where each goes without changing one into the other.",
    },
    {
      id: "plants_do_not_respire",
      label: "Plants do not perform cellular respiration",
      description:
        "Assigns cellular respiration only to animals or treats photosynthesis as the plant version of respiration.",
      teacherAction:
        "Two-minute fix: ask what plant cells do with stored sugar when light is unavailable, then add cellular respiration to both plant and animal nodes in the class model.",
    },
    {
      id: "energy_cycles_like_matter",
      label: "Energy cycles like matter",
      description:
        "Shows energy returning repeatedly through the ecosystem in the same way as atoms and molecules.",
      teacherAction:
        "Two-minute fix: use circular arrows for matter and a one-way arrow ending in heat for energy, then have students explain why the arrow shapes differ.",
    },
  ],
  surveyDisclosure:
    "This activity uses a computer system to select a teacher-written question. It is not graded. Your teacher makes instructional decisions, and research scoring is completed separately by people.",
};

export const contentPacks = [cellularRespirationPack] as const;

export function getContentPack(versionId?: string) {
  if (!versionId) return cellularRespirationPack;
  return contentPacks.find((pack) => pack.versionId === versionId) ?? null;
}

export function getFollowUpPrompt(promptId: string) {
  const pack = cellularRespirationPack;
  return (
    pack.followUps.find((prompt) => prompt.id === promptId) ??
    (pack.fallbackPrompt.id === promptId ? pack.fallbackPrompt : null) ??
    (pack.fixedReflectionPrompt.id === promptId ? pack.fixedReflectionPrompt : null)
  );
}
