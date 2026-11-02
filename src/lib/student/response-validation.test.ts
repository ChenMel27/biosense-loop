import { describe, expect, it } from "vitest";

import {
  applicationResponseIssue,
  countCompleteSentences,
} from "@/lib/student/response-validation";

describe("application response validation", () => {
  it("accepts three meaningful sentences", () => {
    const response = "Less carbon dioxide enters the leaves. The plant makes less glucose. Its growth slows because it has less stored chemical energy.";
    expect(countCompleteSentences(response)).toBe(3);
    expect(applicationResponseIssue(response)).toBe("");
  });

  it("asks for another sentence when only two are complete", () => {
    expect(applicationResponseIssue(
      "The plant makes less glucose. Its growth will slow.",
    )).toMatch(/1 more complete sentence/);
  });

  it("recognizes question marks and exclamation points", () => {
    expect(countCompleteSentences(
      "What changes first? Glucose production decreases! Plant growth then slows.",
    )).toBe(3);
  });

  it("does not count punctuation-only fragments", () => {
    expect(countCompleteSentences("Yes. No. Because." )).toBe(0);
  });
});
