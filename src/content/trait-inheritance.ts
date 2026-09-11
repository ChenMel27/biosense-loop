export interface IdeaDefinition {
  id: string;
  label: string;
  description: string;
  teacherAction: string;
}

export interface AlternativeConceptionDefinition {
  id: string;
  label: string;
  description: string;
  teacherAction: string;
  sourceIds: string[];
}

export interface FollowUpPrompt {
  id: string;
  title: string;
  text: string;
  targets: string[];
  sourceIds?: string[];
}

export interface ResearchSource {
  id: string;
  label: string;
  url: string;
  use: string;
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
  fallbackPrompt: FollowUpPrompt;
  followUps: FollowUpPrompt[];
  nearTransferPrompt: { id: string; title: string; text: string };
  ideas: IdeaDefinition[];
  alternativeConceptions: AlternativeConceptionDefinition[];
  researchSources: ResearchSource[];
  surveyDisclosure: string;
}

export const traitInheritancePack: ContentPack = {
  id: "genes-chromosomes-trait-inheritance",
  versionId: "genes-chromosomes-trait-inheritance-v1.1.0-draft",
  title: "Genes, chromosomes, and inheritance of a specific trait",
  gradeBand: "Georgia Grade 7 life science",
  standards: ["Georgia Standards of Excellence S7L3.a"],
  scopeBoundary:
    "Students construct an evidence-supported explanation of how genes and chromosomes contribute to inheriting one specific trait. The activity does not assess Punnett-square procedures, probability calculations, memorized meiosis or mitosis stages, DNA replication, protein synthesis, or complex human inheritance.",
  estimatedMinutes: 12,
  teacherReviewStatus: "draft",
  initialPrompt: {
    id: "inheritance_initial_01",
    title: "Explain an inherited beetle trait",
    text:
      "Researchers study bristle shape in a fictional beetle species. Evidence card: (1) a bristle-shape gene is located at a marked position on chromosome 3; (2) each parent has gene versions B and b; (3) the offspring inherited one chromosome 3 from each parent and has b and b; and (4) beetles with b and b grow curved bristles, while beetles with at least one B grow straight bristles. Construct an explanation of how this offspring inherited curved bristles. Explain the roles of the gene and chromosomes and use at least two pieces of evidence from the card. Write 2–4 sentences.",
  },
  fallbackPrompt: {
    id: "inheritance_clarify_01",
    title: "Trace the inherited information",
    text:
      "Identify the gene version carried on the chromosome from each parent. Then explain how the two inherited versions connect to the offspring's curved-bristle trait, using evidence from the card.",
    targets: [
      "gene_trait_information",
      "gene_on_chromosome",
      "both_parent_contributions",
      "evidence_linked_explanation",
    ],
    sourceIds: ["gadoe-s7l3a", "aaas-rh-300", "aaas-rh-302"],
  },
  followUps: [
    {
      id: "inheritance_gene_trait_probe_01",
      title: "Separate inherited information from the trait",
      text:
        "Did the parents pass curved bristles themselves, or information related to bristle shape? Name the gene evidence and explain what the offspring later grew.",
      targets: ["gene_trait_information", "gene_is_the_trait"],
      sourceIds: ["aaas-rh-300"],
    },
    {
      id: "inheritance_gene_information_probe_01",
      title: "Identify what the gene carries",
      text:
        "What information does the bristle-shape gene contain, and how is that information related to the offspring's bristle trait? Use one fact from the evidence card.",
      targets: ["gene_trait_information", "genes_lack_hereditary_information"],
      sourceIds: ["aaas-rh-300", "gca-2008"],
    },
    {
      id: "inheritance_chromosome_probe_01",
      title: "Connect the gene to its chromosome",
      text:
        "Where does the evidence card locate the bristle-shape gene, and what structure carried each gene version from parent to offspring? Add that gene–chromosome relationship to your revision.",
      targets: ["gene_on_chromosome", "genes_and_chromosomes_unrelated"],
      sourceIds: ["aaas-rh-300"],
    },
    {
      id: "inheritance_both_parents_probe_01",
      title: "Trace a contribution from each parent",
      text:
        "The offspring has b and b. Which parent contributed each b version, and on what chromosome was each version carried? Cite evidence about both parents in your revision.",
      targets: ["both_parent_contributions", "one_parent_determines_trait"],
      sourceIds: ["aaas-rh-302"],
    },
    {
      id: "inheritance_same_trait_both_parents_probe_01",
      title: "Use both parents for the same trait",
      text:
        "For this one bristle-shape gene, what version came from each parent? Explain why both contributions are relevant to the offspring's bristle shape.",
      targets: ["both_parent_contributions", "parents_contribute_different_traits"],
      sourceIds: ["aaas-rh-302"],
    },
    {
      id: "inheritance_acquired_trait_probe_01",
      title: "Distinguish inherited and acquired changes",
      text:
        "If a parent beetle's bristles were trimmed, would that change the gene versions on the chromosomes passed to its offspring? Use the evidence card to explain what is inherited.",
      targets: ["gene_trait_information", "acquired_trait_is_inherited"],
      sourceIds: ["aaas-rh-302", "cins-2002"],
    },
    {
      id: "inheritance_evidence_probe_01",
      title: "Link evidence to the conclusion",
      text:
        "Choose two facts from the evidence card: one about what the offspring inherited and one about which gene-version pattern is associated with curved bristles. Explain how those facts support your conclusion.",
      targets: ["evidence_linked_explanation"],
      sourceIds: ["gadoe-s7l3a", "gca-2008"],
    },
    {
      id: "inheritance_complete_check_01",
      title: "Review your explanation",
      text:
        "Your explanation already includes the key scientific ideas for this activity. Reread it and make any change that would connect your evidence and conclusion more clearly. If you would not change anything, continue to the next example.",
      targets: [
        "gene_trait_information",
        "gene_on_chromosome",
        "both_parent_contributions",
        "evidence_linked_explanation",
      ],
      sourceIds: ["gadoe-s7l3a", "gca-2008"],
    },
  ],
  nearTransferPrompt: {
    id: "inheritance_near_transfer_01",
    title: "Apply your explanation to a plant trait",
    text:
      "Researchers study seed-coat pattern in a fictional plant. Evidence card: (1) a seed-coat gene is located at a marked position on chromosome 2; (2) Parent A has gene versions C and c, and Parent B has c and c; (3) a seed inherited from these parents has c and c, with one chromosome 2 from each parent; and (4) plants with c and c make spotted seed coats, while plants with at least one C make plain seed coats. Construct an explanation of how the seed inherited the spotted-coat trait. Explain the roles of the gene and chromosomes and use at least two pieces of evidence. Write 2–4 sentences without using your earlier response.",
  },
  ideas: [
    {
      id: "gene_trait_information",
      label: "Gene carries trait-related information",
      description:
        "A gene is inherited information related to a trait; the gene is not the visible trait itself.",
      teacherAction:
        "Two-minute fix: sort gene versions and curved bristles into 'inherited information' and 'observed trait,' then connect them with an evidence arrow.",
    },
    {
      id: "gene_on_chromosome",
      label: "Gene is located on a chromosome",
      description:
        "The explanation connects the gene and its versions to a specific location on a chromosome that carries them from parent to offspring.",
      teacherAction:
        "Two-minute fix: mark the bristle-shape gene on paired chromosome strips and trace one strip from each parent into the offspring.",
    },
    {
      id: "both_parent_contributions",
      label: "Both parents contribute",
      description:
        "The offspring receives one relevant chromosome and gene version from each parent.",
      teacherAction:
        "Two-minute fix: color-code the two offspring chromosomes by parent and label the bristle-shape gene version carried on each one.",
    },
    {
      id: "evidence_linked_explanation",
      label: "Evidence supports the trait explanation",
      description:
        "The explanation uses facts from the evidence card and links the inherited gene-version pair to the observed trait.",
      teacherAction:
        "Two-minute fix: underline one inheritance fact and one gene-version/trait fact, then join them with a because or therefore statement.",
    },
  ],
  alternativeConceptions: [
    {
      id: "gene_is_the_trait",
      label: "The gene is the visible trait",
      description:
        "Treats a gene as the physical trait itself rather than inherited information associated with development of the trait.",
      teacherAction:
        "Two-minute fix: make a two-column map labeled 'inherited information' and 'observed trait,' then place the gene versions and curved bristles in the correct columns and connect them with an evidence arrow.",
      sourceIds: ["aaas-rh-300"],
    },
    {
      id: "genes_lack_hereditary_information",
      label: "Genes do not carry hereditary information",
      description:
        "States that genes do not contain inherited information, or assigns hereditary information to chromosomes while excluding genes.",
      teacherAction:
        "Two-minute fix: label a chromosome, mark the bristle-shape gene on it, and ask students what information that gene contributes to the trait explanation.",
      sourceIds: ["aaas-rh-300"],
    },
    {
      id: "genes_and_chromosomes_unrelated",
      label: "Genes and chromosomes are unrelated",
      description:
        "Describes genes and chromosomes as separate inheritance systems or does not recognize that chromosomes carry genes.",
      teacherAction:
        "Two-minute fix: mark one gene location on two chromosome strips, color-code one strip from each parent, and trace the strips into the offspring's pair.",
      sourceIds: ["aaas-rh-300"],
    },
    {
      id: "one_parent_determines_trait",
      label: "Only one parent determines the trait",
      description:
        "Attributes the offspring's gene information or trait to only one parent, including a same-sex-parent rule.",
      teacherAction:
        "Two-minute fix: color-code the two relevant offspring chromosomes by parent and ask students to label the gene version carried on each one.",
      sourceIds: ["aaas-rh-302"],
    },
    {
      id: "parents_contribute_different_traits",
      label: "Each parent contributes different traits",
      description:
        "Claims that one parent provides the information for bristle shape while the other parent provides information only for a different trait.",
      teacherAction:
        "Two-minute fix: focus on one gene and trait, then trace one version of that same gene from each parent into the offspring's chromosome pair.",
      sourceIds: ["aaas-rh-302"],
    },
    {
      id: "acquired_trait_is_inherited",
      label: "An acquired change is inherited",
      description:
        "Assumes that a body change acquired during a parent's life changes the gene versions passed to offspring.",
      teacherAction:
        "Two-minute fix: compare trimming bristles with changing inherited information on a chromosome, then ask which change the evidence card says can pass to offspring.",
      sourceIds: ["aaas-rh-302", "cins-2002"],
    },
  ],
  researchSources: [
    {
      id: "gadoe-s7l3a",
      label: "Georgia Standards of Excellence S7L3.a",
      url: "https://www.georgiastandards.org/Georgia-Standards/Documents/Science-seventh-Grade-Georgia-Standards.pdf",
      use: "Defines the grade-level performance expectation: construct an evidence-supported explanation of the roles of genes and chromosomes in inheriting a specific trait.",
    },
    {
      id: "aaas-rh-300",
      label: "AAAS Project 2061 / BSCS Science Assessment: genetic information in DNA",
      url: "https://assess.bscs.org/science/topics/1/RH/300",
      use: "Grounds the gene-versus-trait, hereditary-information, and gene-on-chromosome response patterns for middle grades.",
    },
    {
      id: "aaas-rh-302",
      label: "AAAS Project 2061 / BSCS Science Assessment: inheritance across generations",
      url: "https://assess.bscs.org/science/topics/1/RH/302",
      use: "Grounds both-parent, same-sex/one-parent, different-traits-by-parent, and acquired-characteristic response patterns for middle grades.",
    },
    {
      id: "gca-2008",
      label: "Genetics Concept Assessment validation study",
      url: "https://doi.org/10.1187/cbe.08-08-0045",
      use: "Supports a concept-inventory approach using plain language, expert review, student interviews, and concept-specific distractor logic; its college population is not used as grade-seven validation.",
    },
    {
      id: "cins-2002",
      label: "Conceptual Inventory of Natural Selection validation study",
      url: "https://doi.org/10.1002/tea.10053",
      use: "Supports the diagnostic use of documented alternative conceptions and the distinction between inherited variation and acquired changes; natural-selection constructs outside S7L3.a are excluded.",
    },
  ],
  surveyDisclosure:
    "This activity uses AI to select one teacher-written follow-up question based on the ideas in your explanation. It is not graded. Your teacher makes instructional decisions, and research scoring is completed separately by people.",
};

export const contentPacks = [traitInheritancePack] as const;

export function getContentPack(versionId?: string) {
  if (!versionId) return traitInheritancePack;
  return contentPacks.find((pack) => pack.versionId === versionId) ?? null;
}

export function getFollowUpPrompt(promptId: string) {
  const pack = traitInheritancePack;
  return (
    pack.followUps.find((prompt) => prompt.id === promptId) ??
    (pack.fallbackPrompt.id === promptId ? pack.fallbackPrompt : null)
  );
}
