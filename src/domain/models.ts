export type Subject = {
  name: string;
  sourceDocument: string;
  workloadHours: number | null;
  credits: number | null;
  semester: string | null;
  status: string | null;
  grade: string | null;
  syllabus: string | null;
  rawText: string | null;
  normalizedName: string | null;
  normalizedSyllabus: string | null;
  embeddingText: string | null;
};

export type SubjectMatch = {
  previousSubject: Subject;
  currentSubject: Subject;
  semanticSimilarity: number | null;
  nameSimilarity: number;
  workloadScore: number | null;
  creditScore: number | null;
  finalScore: number;
  classification: string;
  requiresManualReview: boolean;
  justification: string | null;
  rank?: number;
  destinationConflict?: boolean;
  assignedUnique?: boolean;
};

export function createSubject(partial: {
  name: string;
  sourceDocument: string;
  workloadHours?: number | null;
  credits?: number | null;
  semester?: string | null;
  status?: string | null;
  grade?: string | null;
  syllabus?: string | null;
  rawText?: string | null;
  normalizedName?: string | null;
  normalizedSyllabus?: string | null;
  embeddingText?: string | null;
}): Subject {
  return {
    name: partial.name,
    sourceDocument: partial.sourceDocument,
    workloadHours: partial.workloadHours ?? null,
    credits: partial.credits ?? null,
    semester: partial.semester ?? null,
    status: partial.status ?? null,
    grade: partial.grade ?? null,
    syllabus: partial.syllabus ?? null,
    rawText: partial.rawText ?? null,
    normalizedName: partial.normalizedName ?? null,
    normalizedSyllabus: partial.normalizedSyllabus ?? null,
    embeddingText: partial.embeddingText ?? null,
  };
}
