import { createSubject, type Subject } from "./models.ts";
import { normalizeSubjects } from "./normalizer.ts";

export type ReviewRow = {
  name: string;
  workloadHours: number | null;
  code?: string | null;
  syllabus?: string | null;
  semester?: string | null;
};

export function subjectsToReview(subjects: Subject[]): ReviewRow[] {
  return subjects.map((subject) => ({
    name: subject.name,
    workloadHours: subject.workloadHours,
    code: subject.code,
    syllabus: subject.syllabus,
    semester: subject.semester,
  }));
}

export function applyReview(
  original: Subject[],
  review: ReviewRow[],
  fallbackSource: string,
): Subject[] {
  const subjects: Subject[] = [];
  review.forEach((row, index) => {
    const name = cleanOptionalText(row.name);
    if (!name) return;
    const base = original[index];
    subjects.push(
      createSubject({
        name,
        sourceDocument: base?.sourceDocument || fallbackSource,
        code: base?.code ?? null,
        workloadHours: cleanOptionalInt(row.workloadHours),
        credits: base?.credits ?? null,
        semester: base?.semester ?? null,
        status: base?.status ?? null,
        grade: base?.grade ?? null,
        syllabus: base?.syllabus ?? null,
        rawText: base?.rawText ?? null,
      }),
    );
  });
  return normalizeSubjects(subjects);
}

export function cleanOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

export function cleanOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value).replace(",", "."), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function cleanOptionalFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
