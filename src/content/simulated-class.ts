import { traitInheritancePack } from "@/content/trait-inheritance";

export interface SimulatedClassification {
  demonstratedIdeaIds: string[];
  missingIdeaIds: string[];
  possibleAlternativeConceptionIds: string[];
  displayedPromptId: string;
  confidence: number;
  explanation: string;
  reasonCodes?: string[];
  provenance?: "frozen_ai_output";
}

export interface SimulatedStudentCase {
  id: string;
  responseText: string;
  classification: SimulatedClassification;
}

/**
 * Frozen demonstration data for the teacher-usability study.
 *
 * These are researcher-authored examples, not student records and not evidence
 * of learning. The writing intentionally varies in completeness and polish so
 * teachers can judge the usefulness of the system output.
 */
const simulatedResponseDrafts: SimulatedStudentCase[] = [
  {
    id: "S01",
    responseText:
      "The beetle got one chromosome 3 from each parent, and both chromosomes carried the b version of the bristle gene. Since the information in the two b versions is connected with curved bristles, the offspring grew curved bristles.",
    classification: {
      demonstratedIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      missingIdeaIds: [],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_complete_check_01",
      confidence: 0.91,
      explanation: "All four target relationships are stated and connected to case evidence.",
    },
  },
  {
    id: "S02",
    responseText:
      "Both parents passed curved bristles to the baby beetle. It has b and b, so the curved bristles from its parents showed up.",
    classification: {
      demonstratedIdeaIds: ["both_parent_contributions", "evidence_linked_explanation"],
      missingIdeaIds: ["gene_trait_information", "gene_on_chromosome"],
      possibleAlternativeConceptionIds: ["gene_is_the_trait"],
      displayedPromptId: "inheritance_gene_trait_probe_01",
      confidence: 0.86,
      explanation: "The response treats the visible bristles as what the parents directly passed down.",
    },
  },
  {
    id: "S03",
    responseText:
      "The genes decide the bristle shape, but chromosomes are separate and do not carry the genes. The beetle has two b genes, which made the bristles curved.",
    classification: {
      demonstratedIdeaIds: ["gene_trait_information", "evidence_linked_explanation"],
      missingIdeaIds: ["gene_on_chromosome", "both_parent_contributions"],
      possibleAlternativeConceptionIds: ["genes_and_chromosomes_unrelated"],
      displayedPromptId: "inheritance_chromosome_probe_01",
      confidence: 0.92,
      explanation: "The response explicitly separates genes from chromosomes.",
    },
  },
  {
    id: "S04",
    responseText:
      "The offspring inherited the b version from its mother, so it grew curved bristles. The father's genes do not matter for this trait.",
    classification: {
      demonstratedIdeaIds: ["gene_trait_information"],
      missingIdeaIds: [
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      possibleAlternativeConceptionIds: ["one_parent_determines_trait"],
      displayedPromptId: "inheritance_both_parents_probe_01",
      confidence: 0.94,
      explanation: "The response explicitly says that only one parent's contribution matters.",
    },
  },
  {
    id: "S05",
    responseText:
      "The mother gave the beetle its bristle-shape gene, and the father probably gave it a different trait like color. That is why the bristles are curved.",
    classification: {
      demonstratedIdeaIds: ["gene_trait_information"],
      missingIdeaIds: [
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      possibleAlternativeConceptionIds: ["parents_contribute_different_traits"],
      displayedPromptId: "inheritance_same_trait_both_parents_probe_01",
      confidence: 0.9,
      explanation: "The response assigns the focal trait to one parent and a different trait to the other.",
    },
  },
  {
    id: "S06",
    responseText:
      "If the parents had their bristles cut shorter, their offspring could inherit short bristles too. Changes to a parent can be passed through the chromosomes.",
    classification: {
      demonstratedIdeaIds: ["gene_on_chromosome"],
      missingIdeaIds: [
        "gene_trait_information",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      possibleAlternativeConceptionIds: ["acquired_trait_is_inherited"],
      displayedPromptId: "inheritance_acquired_trait_probe_01",
      confidence: 0.88,
      explanation: "The response explicitly claims that an acquired body change can be inherited.",
    },
  },
  {
    id: "S07",
    responseText:
      "The offspring has curved bristles because genes and chromosomes are involved in inheritance. This is what happens when traits pass from parents to offspring.",
    classification: {
      demonstratedIdeaIds: ["gene_trait_information"],
      missingIdeaIds: [
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_chromosome_probe_01",
      confidence: 0.66,
      explanation: "The response is generally correct but does not connect the case evidence to either parent or chromosome 3.",
    },
  },
  {
    id: "S08",
    responseText: "It got curved bristles because that is what the chart says.",
    classification: {
      demonstratedIdeaIds: [],
      missingIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_clarify_01",
      confidence: 0.35,
      explanation: "The response is too short to support a specific classification.",
    },
  },
  {
    id: "S09",
    responseText:
      "One b came on chromosome 3 from Parent 1 and the other b came on chromosome 3 from Parent 2. A gene carries information about a trait, and the evidence says b/b beetles grow curved bristles, so this offspring has curved bristles.",
    classification: {
      demonstratedIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      missingIdeaIds: [],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_complete_check_01",
      confidence: 0.95,
      explanation: "The response includes all target relationships and uses two relevant facts.",
    },
  },
  {
    id: "S10",
    responseText:
      "Chromosomes hold all the hereditary information, but genes do not contain information themselves. The two chromosome 3 copies caused the curved bristles.",
    classification: {
      demonstratedIdeaIds: ["gene_on_chromosome"],
      missingIdeaIds: [
        "gene_trait_information",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      possibleAlternativeConceptionIds: ["genes_lack_hereditary_information"],
      displayedPromptId: "inheritance_gene_information_probe_01",
      confidence: 0.93,
      explanation: "The response explicitly denies that genes carry hereditary information.",
    },
  },
  {
    id: "S11",
    responseText:
      "The bristle gene is on chromosome 3, and b/b is connected to curved bristles. The offspring inherited the gene and that caused its bristle shape.",
    classification: {
      demonstratedIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "evidence_linked_explanation",
      ],
      missingIdeaIds: ["both_parent_contributions"],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_both_parents_probe_01",
      confidence: 0.8,
      explanation: "The response does not trace one gene version from each parent.",
    },
  },
  {
    id: "S12",
    responseText:
      "Each parent gave the offspring one b version, and having b and b is why it has curved bristles. The gene versions carry information about bristle shape.",
    classification: {
      demonstratedIdeaIds: [
        "gene_trait_information",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      missingIdeaIds: ["gene_on_chromosome"],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_chromosome_probe_01",
      confidence: 0.82,
      explanation: "The inheritance reasoning is present, but chromosomes are not mentioned.",
    },
  },
  {
    id: "S13",
    responseText:
      "The offspring got chromosome 3 from both parents. The b pieces are curved bristles, and getting two of them means its bristles came out curved.",
    classification: {
      demonstratedIdeaIds: ["gene_on_chromosome", "both_parent_contributions"],
      missingIdeaIds: ["gene_trait_information", "evidence_linked_explanation"],
      possibleAlternativeConceptionIds: ["gene_is_the_trait"],
      displayedPromptId: "inheritance_gene_trait_probe_01",
      confidence: 0.81,
      explanation: "The response traces both chromosomes but treats the b versions as physical bristles.",
    },
  },
  {
    id: "S14",
    responseText:
      "The gene is on a chromosome and each parent contributes one version. The offspring has curved bristles because of inheritance.",
    classification: {
      demonstratedIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
      ],
      missingIdeaIds: ["evidence_linked_explanation"],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_evidence_probe_01",
      confidence: 0.77,
      explanation: "The response states the relationships but does not use the b/b evidence to support the conclusion.",
    },
  },
  {
    id: "S15",
    responseText:
      "okay so i think one chromosone 3 came from each parent and both had b on it. genes are like the instructions for the trait, not the actual bristles, and two b's goes with curved so thats why this beetle is curved.",
    classification: {
      demonstratedIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      missingIdeaIds: [],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_complete_check_01",
      confidence: 0.89,
      explanation: "Despite informal wording and spelling, the four scientific relationships are present.",
    },
  },
  {
    id: "S16",
    responseText:
      "The beetle probably changed its bristles because it needed to move through dirt. I am not sure what the B letters or chromosome 3 have to do with it.",
    classification: {
      demonstratedIdeaIds: [],
      missingIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_clarify_01",
      confidence: 0.42,
      explanation: "The response is outside the supplied inheritance evidence and does not support a specific approved misconception label.",
    },
  },
  {
    id: "S17",
    responseText:
      "The offspring received one b allele from each parent's chromosome 3. Those gene versions contain inherited information for bristle shape, and the case says two b versions are associated with curved bristles. This evidence explains why the offspring's bristles are curved.",
    classification: {
      demonstratedIdeaIds: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      missingIdeaIds: [],
      possibleAlternativeConceptionIds: [],
      displayedPromptId: "inheritance_complete_check_01",
      confidence: 0.96,
      explanation: "The response clearly coordinates the gene, chromosome, both parents, and evidence.",
    },
  },
  {
    id: "S18",
    responseText:
      "The father gave the offspring both b versions because fathers determine this kind of trait. Two b versions made the bristles curved.",
    classification: {
      demonstratedIdeaIds: ["gene_trait_information", "evidence_linked_explanation"],
      missingIdeaIds: ["gene_on_chromosome", "both_parent_contributions"],
      possibleAlternativeConceptionIds: ["one_parent_determines_trait"],
      displayedPromptId: "inheritance_both_parents_probe_01",
      confidence: 0.94,
      explanation: "The response explicitly attributes both inherited versions to one parent.",
    },
  },
];

export const simulatedAiRun = {
  provider: "OpenAI",
  requestedModel: "gpt-5.6",
  resolvedModel: "gpt-5.6-sol",
  generatedAt: "2026-09-09",
  store: false,
} as const;

type FrozenAiOutput = Omit<SimulatedClassification, "explanation">;

const frozenAiOutputById = {
  S01: { demonstratedIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: [], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_complete_check_01", confidence: 0.99, reasonCodes: ["explicit_evidence"], provenance: "frozen_ai_output" },
  S02: { demonstratedIdeaIds: ["both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome"], possibleAlternativeConceptionIds: ["gene_is_the_trait"], displayedPromptId: "inheritance_gene_trait_probe_01", confidence: 0.90, reasonCodes: ["explicit_evidence", "missing_relationship"], provenance: "frozen_ai_output" },
  S03: { demonstratedIdeaIds: ["gene_trait_information", "evidence_linked_explanation"], missingIdeaIds: ["gene_on_chromosome", "both_parent_contributions"], possibleAlternativeConceptionIds: ["genes_and_chromosomes_unrelated"], displayedPromptId: "inheritance_chromosome_probe_01", confidence: 0.98, reasonCodes: ["explicit_evidence", "contradictory_statement", "missing_relationship"], provenance: "frozen_ai_output" },
  S04: { demonstratedIdeaIds: ["gene_trait_information", "evidence_linked_explanation"], missingIdeaIds: ["gene_on_chromosome", "both_parent_contributions"], possibleAlternativeConceptionIds: ["one_parent_determines_trait"], displayedPromptId: "inheritance_both_parents_probe_01", confidence: 0.99, reasonCodes: ["explicit_evidence", "contradictory_statement", "missing_relationship"], provenance: "frozen_ai_output" },
  S05: { demonstratedIdeaIds: ["gene_trait_information"], missingIdeaIds: ["gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], possibleAlternativeConceptionIds: ["one_parent_determines_trait", "parents_contribute_different_traits"], displayedPromptId: "inheritance_same_trait_both_parents_probe_01", confidence: 0.98, reasonCodes: ["explicit_evidence", "missing_relationship", "contradictory_statement"], provenance: "frozen_ai_output" },
  S06: { demonstratedIdeaIds: [], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], possibleAlternativeConceptionIds: ["acquired_trait_is_inherited"], displayedPromptId: "inheritance_acquired_trait_probe_01", confidence: 0.99, reasonCodes: ["explicit_evidence", "contradictory_statement", "missing_relationship"], provenance: "frozen_ai_output" },
  S07: { demonstratedIdeaIds: [], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_clarify_01", confidence: 0.96, reasonCodes: ["missing_relationship", "insufficient_evidence"], provenance: "frozen_ai_output" },
  S08: { demonstratedIdeaIds: [], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_clarify_01", confidence: 0.98, reasonCodes: ["too_short", "missing_relationship", "insufficient_evidence"], provenance: "frozen_ai_output" },
  S09: { demonstratedIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: [], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_complete_check_01", confidence: 0.99, reasonCodes: ["explicit_evidence"], provenance: "frozen_ai_output" },
  S10: { demonstratedIdeaIds: [], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], possibleAlternativeConceptionIds: ["genes_lack_hereditary_information"], displayedPromptId: "inheritance_gene_information_probe_01", confidence: 0.98, reasonCodes: ["explicit_evidence", "contradictory_statement", "missing_relationship"], provenance: "frozen_ai_output" },
  S11: { demonstratedIdeaIds: ["gene_trait_information", "gene_on_chromosome", "evidence_linked_explanation"], missingIdeaIds: ["both_parent_contributions"], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_both_parents_probe_01", confidence: 0.95, reasonCodes: ["explicit_evidence", "missing_relationship"], provenance: "frozen_ai_output" },
  S12: { demonstratedIdeaIds: ["gene_trait_information", "both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: ["gene_on_chromosome"], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_chromosome_probe_01", confidence: 0.98, reasonCodes: ["explicit_evidence", "missing_relationship"], provenance: "frozen_ai_output" },
  S13: { demonstratedIdeaIds: ["both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome"], possibleAlternativeConceptionIds: ["gene_is_the_trait"], displayedPromptId: "inheritance_gene_trait_probe_01", confidence: 0.92, reasonCodes: ["explicit_evidence", "missing_relationship", "contradictory_statement"], provenance: "frozen_ai_output" },
  S14: { demonstratedIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: [], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_complete_check_01", confidence: 0.97, reasonCodes: ["explicit_evidence"], provenance: "frozen_ai_output" },
  S15: { demonstratedIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: [], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_complete_check_01", confidence: 0.99, reasonCodes: ["explicit_evidence"], provenance: "frozen_ai_output" },
  S16: { demonstratedIdeaIds: [], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_acquired_trait_probe_01", confidence: 0.93, reasonCodes: ["missing_relationship", "contradictory_statement"], provenance: "frozen_ai_output" },
  S17: { demonstratedIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions", "evidence_linked_explanation"], missingIdeaIds: [], possibleAlternativeConceptionIds: [], displayedPromptId: "inheritance_complete_check_01", confidence: 0.99, reasonCodes: ["explicit_evidence"], provenance: "frozen_ai_output" },
  S18: { demonstratedIdeaIds: ["evidence_linked_explanation"], missingIdeaIds: ["gene_trait_information", "gene_on_chromosome", "both_parent_contributions"], possibleAlternativeConceptionIds: ["one_parent_determines_trait"], displayedPromptId: "inheritance_both_parents_probe_01", confidence: 0.99, reasonCodes: ["explicit_evidence", "missing_relationship", "contradictory_statement"], provenance: "frozen_ai_output" },
} satisfies Record<string, FrozenAiOutput>;

const contentLabels = new Map([
  ...traitInheritancePack.ideas.map((item) => [item.id, item.label] as const),
  ...traitInheritancePack.alternativeConceptions.map((item) => [item.id, item.label] as const),
]);

function labelList(ids: string[]) {
  return ids.map((id) => contentLabels.get(id) ?? id).join(", ");
}

function describeFrozenOutput(output: FrozenAiOutput) {
  const prompt = [...traitInheritancePack.followUps, traitInheritancePack.fallbackPrompt]
    .find((item) => item.id === output.displayedPromptId);
  if (output.displayedPromptId === "inheritance_complete_check_01") {
    return "The AI marked all four target relationships as present and selected the completion review question.";
  }
  if (output.displayedPromptId === traitInheritancePack.fallbackPrompt.id) {
    return "The AI did not find enough case-linked scientific evidence for a more specific approved question, so it selected the clarification question.";
  }
  const finding = output.possibleAlternativeConceptionIds.length
    ? `flagged ${labelList(output.possibleAlternativeConceptionIds)} and marked ${labelList(output.missingIdeaIds)} as missing`
    : `marked ${labelList(output.missingIdeaIds)} as missing`;
  return `The AI ${finding}, then selected “${prompt?.title ?? output.displayedPromptId}” from the approved question bank.`;
}

export const simulatedClass: SimulatedStudentCase[] = simulatedResponseDrafts.map((sample) => {
  const output = frozenAiOutputById[sample.id as keyof typeof frozenAiOutputById];
  if (!output) throw new Error(`Missing frozen AI output for ${sample.id}.`);
  return {
    ...sample,
    classification: {
      ...output,
      explanation: describeFrozenOutput(output),
    },
  };
});
