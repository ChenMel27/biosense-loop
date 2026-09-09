import { traitInheritancePack } from "@/content/trait-inheritance";
import type { SimulatedStudentCase } from "@/content/simulated-class";

export interface SimulatedPatternSummary {
  id: string;
  label: string;
  kind: "Missing idea" | "Possible misconception";
  count: number;
  suggestedAction: string;
  sampleIds: string[];
}

export function buildSimulatedSummary(cases: SimulatedStudentCase[]) {
  const patterns: SimulatedPatternSummary[] = [];

  for (const idea of traitInheritancePack.ideas) {
    const matching = cases.filter((item) =>
      item.classification.missingIdeaIds.includes(idea.id),
    );
    if (matching.length) {
      patterns.push({
        id: idea.id,
        label: idea.label,
        kind: "Missing idea",
        count: matching.length,
        suggestedAction: idea.teacherAction,
        sampleIds: matching.map((item) => item.id),
      });
    }
  }

  for (const misconception of traitInheritancePack.alternativeConceptions) {
    const matching = cases.filter((item) =>
      item.classification.possibleAlternativeConceptionIds.includes(misconception.id),
    );
    if (matching.length) {
      patterns.push({
        id: misconception.id,
        label: misconception.label,
        kind: "Possible misconception",
        count: matching.length,
        suggestedAction: misconception.teacherAction,
        sampleIds: matching.map((item) => item.id),
      });
    }
  }

  return patterns.sort(
    (a, b) => b.count - a.count || a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label),
  );
}

export function calculateSusScore(responses: number[]) {
  if (responses.length !== 10 || responses.some((value) => value < 1 || value > 5)) {
    throw new Error("SUS requires ten responses from 1 to 5.");
  }
  const contribution = responses.reduce((total, value, index) => {
    return total + (index % 2 === 0 ? value - 1 : 5 - value);
  }, 0);
  return contribution * 2.5;
}

