import { describe, expect, it } from "vitest";

import {
  formatGradeCourse,
  normalizeGradeLevel,
} from "@/lib/domain/curriculum";

describe("curriculum selections", () => {
  it("normalizes grades returned in common lesson-note formats", () => {
    expect(normalizeGradeLevel("Kindergarten biology")).toBe("Kindergarten");
    expect(normalizeGradeLevel("7th-grade life science")).toBe("Grade 7");
    expect(normalizeGradeLevel("Grade 12 Biology")).toBe("Grade 12");
    expect(normalizeGradeLevel("middle school biology")).toBe("");
    expect(normalizeGradeLevel("K-12 biology")).toBe("");
  });

  it("formats the selected grade and course for the student activity", () => {
    expect(formatGradeCourse("Grade 7", "Biology")).toBe("Grade 7 Biology");
  });
});
