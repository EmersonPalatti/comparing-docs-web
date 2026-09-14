import { matchAlerts, matchPriority, formatOptionalScore, formatPercent } from "./alerts.ts";
import { classificationLabel, conciseJustification } from "./evaluator.ts";
import { type Subject, type SubjectMatch } from "./models.ts";

export type MatchRow = {
  id: string;
  selected: boolean;
  previousName: string;
  previousHours: number | null;
  previousSyllabus: string;
  previousCode: string;
  currentName: string;
  currentHours: number | null;
  currentSyllabus: string;
  currentCode: string;
  priority: string;
  alerts: string;
  alertList: string[];
  workloadScore: number | null;
  workloadScoreLabel: string;
  creditScore: number | null;
  creditScoreLabel: string;
  semanticSimilarity: number | null;
  semanticLabel: string;
  nameSimilarity: number;
  nameSimilarityLabel: string;
  equivalency: number;
  equivalencyPercent: string;
  equivalencyScoreLabel: string;
  classification: string;
  classificationLabel: string;
  manualReview: boolean;
  manualReviewLabel: string;
  reviewerNote: string;
  justification: string;
  rank: number;
  isBest: boolean;
  destinationConflict: boolean;
  assignedUnique: boolean;
};

export function matchesToRows(matches: SubjectMatch[]): MatchRow[] {
  return matches.map((match, index) => {
    const alerts = matchAlerts(match);
    const rank = match.rank ?? 1;
    return {
      id: `${index}-${match.previousSubject.name}-${match.currentSubject.name}`,
      selected: false,
      previousName: sanitizeSpreadsheetCell(match.previousSubject.name),
      previousHours: match.previousSubject.workloadHours,
      previousSyllabus: match.previousSubject.syllabus ?? "",
      previousCode: match.previousSubject.code ?? "",
      currentName: sanitizeSpreadsheetCell(match.currentSubject.name),
      currentHours: match.currentSubject.workloadHours,
      currentSyllabus: match.currentSubject.syllabus ?? "",
      currentCode: match.currentSubject.code ?? "",
      priority: matchPriority(match),
      alerts: alerts.join(" | "),
      alertList: alerts,
      workloadScore: match.workloadScore,
      workloadScoreLabel: formatOptionalScore(match.workloadScore),
      creditScore: match.creditScore,
      creditScoreLabel: formatOptionalScore(match.creditScore),
      semanticSimilarity: match.semanticSimilarity,
      semanticLabel: formatOptionalScore(match.semanticSimilarity),
      nameSimilarity: match.nameSimilarity,
      nameSimilarityLabel: formatOptionalScore(match.nameSimilarity),
      equivalency: match.finalScore,
      equivalencyPercent: formatPercent(match.finalScore),
      equivalencyScoreLabel: formatOptionalScore(match.finalScore),
      classification: match.classification,
      classificationLabel: classificationLabel(match.classification),
      manualReview: match.requiresManualReview,
      manualReviewLabel: match.requiresManualReview ? "Sim" : "Não",
      reviewerNote: "",
      justification: match.justification || conciseJustification(match),
      rank,
      isBest: rank === 1,
      destinationConflict: Boolean(match.destinationConflict),
      assignedUnique: Boolean(match.assignedUnique),
    };
  });
}

export function sanitizeSpreadsheetCell(value: unknown): string {
  if (typeof value !== "string") return value == null ? "" : String(value);
  const collapsed = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uFEFF\u200B\u200C\u200D]/g, "")
    .replace(/[\r\n\t]+/g, " ");
  const leading = collapsed.replace(/^\s+/, "");
  if (/^[=+\-@]/.test(leading)) return `'${leading}`;
  return collapsed;
}

export function sanitizeFilename(name: string, fallback = "arquivo"): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const cleaned = base
    .replace(/[^\w.\-]+/gu, "_")
    .replace(/^\.+/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
  return cleaned || fallback;
}

export function subjectKey(name: unknown, workload: unknown): string {
  const hours = workload === null || workload === undefined || Number.isNaN(Number(workload)) ? "" : String(workload).trim();
  return `${String(name ?? "").trim().toLowerCase()}|${hours}`;
}

export function subjectsWithoutSelectedMatch(
  subjects: Subject[],
  selected: MatchRow[],
  side: "previous" | "current",
): Subject[] {
  const keys = new Set(
    selected.map((row) =>
      side === "previous"
        ? subjectKey(row.previousName.replace(/^'/, ""), row.previousHours)
        : subjectKey(row.currentName.replace(/^'/, ""), row.currentHours),
    ),
  );
  return subjects.filter((subject) => !keys.has(subjectKey(subject.name, subject.workloadHours)));
}
