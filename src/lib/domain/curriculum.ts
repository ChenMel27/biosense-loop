export const gradeLevelOptions = [
  { value: "Kindergarten", label: "Kindergarten" },
  { value: "Grade 1", label: "1st grade" },
  { value: "Grade 2", label: "2nd grade" },
  { value: "Grade 3", label: "3rd grade" },
  { value: "Grade 4", label: "4th grade" },
  { value: "Grade 5", label: "5th grade" },
  { value: "Grade 6", label: "6th grade" },
  { value: "Grade 7", label: "7th grade" },
  { value: "Grade 8", label: "8th grade" },
  { value: "Grade 9", label: "9th grade" },
  { value: "Grade 10", label: "10th grade" },
  { value: "Grade 11", label: "11th grade" },
  { value: "Grade 12", label: "12th grade" },
] as const;

export const courseOptions = [
  { value: "Biology", label: "Biology" },
] as const;

export type GradeLevel = (typeof gradeLevelOptions)[number]["value"];
export type Course = (typeof courseOptions)[number]["value"];

export function normalizeGradeLevel(value: string | undefined): GradeLevel | "" {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "";
  if (/(?:\bk|\b\d{1,2})\s*[-–—]\s*\d{1,2}\b/.test(normalized)) return "";
  if (normalized.includes("kindergarten") || normalized === "k") return "Kindergarten";
  const match = normalized.match(/(?:grade\s*)?(\d{1,2})(?:st|nd|rd|th)?(?:\s*grade)?/);
  const grade = match ? Number(match[1]) : Number.NaN;
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) return "";
  return `Grade ${grade}` as GradeLevel;
}

export function formatGradeCourse(
  gradeLevel: GradeLevel | "" | undefined,
  course: Course | undefined,
) {
  return [gradeLevel, course].filter(Boolean).join(" ");
}
