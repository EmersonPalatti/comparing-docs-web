import { createSubject, type Subject } from "./models.ts";

const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bmat\.?\b/gi, "matematica"],
  [/\bestat\.?\b/gi, "estatistica"],
  [/\bintro\.?\b/gi, "introducao"],
  [/\bprog\.?\b/gi, "programacao"],
  [/\badm\.?\b/gi, "administracao"],
];

export function stripAccents(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "");
}

export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  let text = stripAccents(value).toLowerCase();
  for (const [pattern, replacement] of ABBREVIATIONS) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(/[^a-z0-9\s]/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

export function round4(value: number): number {
  return Number(value.toFixed(4));
}

export function buildEmbeddingText(subject: Subject): string {
  const parts = [`Subject: ${subject.name}`];
  if (subject.workloadHours !== null) parts.push(`Workload: ${subject.workloadHours}`);
  if (subject.credits !== null) parts.push(`Credits: ${subject.credits}`);
  if (subject.syllabus) parts.push(`Syllabus: ${subject.syllabus}`);
  return parts.join("\n");
}

export function normalizeSubject(subject: Subject): Subject {
  return createSubject({
    ...subject,
    normalizedName: normalizeText(subject.name),
    normalizedSyllabus: normalizeText(subject.syllabus),
    embeddingText: buildEmbeddingText(subject),
  });
}

export function normalizeSubjects(subjects: Subject[]): Subject[] {
  return subjects.map(normalizeSubject);
}
