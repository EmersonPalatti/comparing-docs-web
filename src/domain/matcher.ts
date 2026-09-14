import { maxWeightAssignment } from "./assignment.ts";
import { codesMatch, normalizeCode } from "./codes.ts";
import {
  ASSIGNMENT_THRESHOLD,
  LIKELY_EQUIVALENCY,
  MIN_HOURS_RATIO_FOR_LIKELY,
  MIN_HOURS_RATIO_FOR_STRONG,
  NO_MATCH,
  PARTIAL_SIMILARITY,
  SAME_CODE_SCORE_FLOOR,
  STRONG_EQUIVALENCY,
} from "./config.ts";
import { subjectSimilarityMatrix } from "./embeddings.ts";
import { conciseJustification } from "./evaluator.ts";
import { hoursRatio } from "./hours.ts";
import { levelConflict } from "./levels.ts";
import { type Subject, type SubjectMatch } from "./models.ts";
import { normalizeText, round4 } from "./normalizer.ts";
import { jaroWinkler, sequenceMatcherRatio, tokenSetRatio } from "./sequence.ts";
import { isCompletableOrigin } from "./status.ts";

export function nameSimilarity(previous: Subject, current: Subject): number {
  const previousName = previous.normalizedName || normalizeText(previous.name);
  const currentName = current.normalizedName || normalizeText(current.name);
  if (!previousName || !currentName) return 0;
  const ratio = sequenceMatcherRatio(previousName, currentName);
  const setRatio = tokenSetRatio(previousName, currentName);
  const winkler = jaroWinkler(previousName, currentName);
  const previousTokens = new Set(previousName.split(" ").filter((token) => token.length > 1));
  const currentTokens = new Set(currentName.split(" ").filter((token) => token.length > 1));
  const intersection = [...previousTokens].filter((token) => currentTokens.has(token)).length;
  const union = new Set([...previousTokens, ...currentTokens]).size;
  const tokenScore = intersection / Math.max(union, 1);
  return round4(Math.max(ratio, setRatio, winkler, tokenScore));
}

export function workloadCompatibility(
  previousHours: number | null,
  currentHours: number | null,
): number | null {
  if (previousHours === null || currentHours === null || currentHours <= 0) return null;
  if (previousHours >= currentHours) return 1;
  const ratio = previousHours / currentHours;
  if (ratio >= 0.8) return 0.8;
  if (ratio >= MIN_HOURS_RATIO_FOR_LIKELY) return 0.5;
  return 0.2;
}

export function creditCompatibility(
  previousCredits: number | null,
  currentCredits: number | null,
): number | null {
  if (previousCredits === null || currentCredits === null || currentCredits <= 0) return null;
  if (previousCredits >= currentCredits) return 1;
  const ratio = previousCredits / currentCredits;
  if (ratio >= 0.8) return 0.8;
  if (ratio >= MIN_HOURS_RATIO_FOR_LIKELY) return 0.5;
  return 0.2;
}

export function contextScore(previous: Subject, current: Subject): number {
  if (levelConflict(previous, current)) return 0.45;
  return 1;
}

function weightedScore(
  scores: Record<string, number | null>,
  weights: Record<string, number>,
): number {
  const available = Object.entries(scores).filter(([, value]) => value !== null) as Array<
    [string, number]
  >;
  const totalWeight = available.reduce((sum, [key]) => sum + (weights[key] ?? 0), 0);
  if (totalWeight === 0) return 0;
  return available.reduce((sum, [key, value]) => sum + value * (weights[key] ?? 0), 0) / totalWeight;
}

export function finalScore(
  previous: Subject,
  current: Subject,
  semanticSimilarity: number | null,
  nameScore: number,
  workloadScore: number | null,
  creditScore: number | null,
  context: number,
  sameCode = false,
): number {
  const hasContent = Boolean(previous.syllabus || current.syllabus);
  let weights: Record<string, number>;
  let scores: Record<string, number | null>;
  if (hasContent && semanticSimilarity !== null) {
    weights = { semantic: 0.4, name: 0.25, workload: 0.2, credit: 0.1, context: 0.05 };
    scores = {
      semantic: semanticSimilarity,
      name: nameScore,
      workload: workloadScore,
      credit: creditScore,
      context,
    };
  } else {
    weights = { name: 0.6, workload: 0.3, context: 0.1 };
    scores = { name: nameScore, workload: workloadScore, context };
  }

  let score = weightedScore(scores, weights);
  if (sameCode) score = Math.max(score, SAME_CODE_SCORE_FLOOR);
  if (workloadScore === null) score *= 0.9;
  else if (workloadScore <= 0.5) score *= 0.85;
  if (context < 1) score = Math.min(score, 0.65);
  return round4(Math.min(score, 1));
}

export function classify(score: number): string {
  if (score >= 0.85) return STRONG_EQUIVALENCY;
  if (score >= 0.7) return LIKELY_EQUIVALENCY;
  if (score >= 0.5) return PARTIAL_SIMILARITY;
  return NO_MATCH;
}

function classificationRank(value: string): number {
  if (value === STRONG_EQUIVALENCY) return 3;
  if (value === LIKELY_EQUIVALENCY) return 2;
  if (value === PARTIAL_SIMILARITY) return 1;
  return 0;
}

function capClassification(current: string, max: string): string {
  return classificationRank(current) <= classificationRank(max) ? current : max;
}

export function applyDomainCaps(
  classification: string,
  previous: Subject,
  current: Subject,
  sameCode: boolean,
  conflict: boolean,
): string {
  let next = classification;
  const ratio = hoursRatio(previous, current);
  if (ratio !== null) {
    if (ratio < MIN_HOURS_RATIO_FOR_STRONG) next = capClassification(next, LIKELY_EQUIVALENCY);
    if (ratio < MIN_HOURS_RATIO_FOR_LIKELY) next = capClassification(next, PARTIAL_SIMILARITY);
  }
  if (conflict && !sameCode) next = capClassification(next, PARTIAL_SIMILARITY);
  return next;
}

export function requiresManualReview(
  classification: string,
  workloadScore: number | null,
  blockedStatus = false,
  conflict = false,
): boolean {
  if (blockedStatus || conflict) return true;
  if (classification === LIKELY_EQUIVALENCY || classification === PARTIAL_SIMILARITY) return true;
  if (workloadScore === null) return true;
  return classification !== STRONG_EQUIVALENCY;
}

export function comparePair(
  previous: Subject,
  current: Subject,
  semanticSimilarity: number | null,
): SubjectMatch {
  const sameCode = codesMatch(previous, current);
  const conflict = levelConflict(previous, current);
  const blockedStatus = !isCompletableOrigin(previous);
  const nameScore = nameSimilarity(previous, current);
  const workloadScore = workloadCompatibility(previous.workloadHours, current.workloadHours);
  const creditScore = creditCompatibility(previous.credits, current.credits);
  const context = contextScore(previous, current);
  const score = finalScore(
    previous,
    current,
    semanticSimilarity,
    nameScore,
    workloadScore,
    creditScore,
    context,
    sameCode,
  );
  const classification = applyDomainCaps(classify(score), previous, current, sameCode, conflict);
  return {
    previousSubject: previous,
    currentSubject: current,
    semanticSimilarity: semanticSimilarity === null ? null : round4(semanticSimilarity),
    nameSimilarity: nameScore,
    workloadScore,
    creditScore,
    finalScore: score,
    classification,
    requiresManualReview: requiresManualReview(classification, workloadScore, blockedStatus, conflict),
    justification: null,
    codeMatch: sameCode,
    levelConflict: conflict,
    blockedStatus,
  };
}

export function matchSubjects(
  previousSubjects: Subject[],
  currentSubjects: Subject[],
  topN = 3,
): SubjectMatch[] {
  if (!previousSubjects.length || !currentSubjects.length) return [];
  const semanticMatrix = subjectSimilarityMatrix(previousSubjects, currentSubjects);
  const pairMatrix = previousSubjects.map((previous, i) =>
    currentSubjects.map((current, j) => comparePair(previous, current, semanticMatrix[i][j])),
  );
  const weights = pairMatrix.map((row) =>
    row.map((pair) => (pair.blockedStatus ? 0 : pair.finalScore)),
  );
  const assignment = maxWeightAssignment(weights, ASSIGNMENT_THRESHOLD);

  const matches: SubjectMatch[] = [];
  previousSubjects.forEach((_, i) => {
    const assignedCol = assignment[i];
    const ranked = [...pairMatrix[i]].sort((a, b) => b.finalScore - a.finalScore);
    const assigned =
      assignedCol >= 0 ? pairMatrix[i][assignedCol] : null;
    const ordered: SubjectMatch[] = [];
    if (assigned) ordered.push(assigned);
    for (const candidate of ranked) {
      if (assigned && candidate.currentSubject === assigned.currentSubject) continue;
      ordered.push(candidate);
    }
    matches.push(...ordered.slice(0, topN));
  });

  return annotateMatches(matches, assignment, previousSubjects, currentSubjects);
}

export function subjectIdentity(subject: Subject): string {
  const code = normalizeCode(subject.code);
  if (code) return `c:${code}`;
  return `n:${subject.normalizedName || normalizeText(subject.name)}`;
}

export function annotateMatches(
  matches: SubjectMatch[],
  assignment: number[] = [],
  previousSubjects: Subject[] = [],
  currentSubjects: Subject[] = [],
): SubjectMatch[] {
  const uniqueKeys = new Set<string>();
  assignment.forEach((column, row) => {
    if (column < 0 || !previousSubjects[row] || !currentSubjects[column]) return;
    uniqueKeys.add(
      `${subjectIdentity(previousSubjects[row])}::${subjectIdentity(currentSubjects[column])}`,
    );
  });

  const byPrevious = new Map<string, SubjectMatch[]>();
  for (const match of matches) {
    const key = subjectIdentity(match.previousSubject);
    const group = byPrevious.get(key) ?? [];
    group.push(match);
    byPrevious.set(key, group);
  }

  const ranked: SubjectMatch[] = [];
  for (const group of byPrevious.values()) {
    group.forEach((match, index) => {
      ranked.push({
        ...match,
        rank: index + 1,
        destinationConflict: false,
        assignedUnique: uniqueKeys.has(
          `${subjectIdentity(match.previousSubject)}::${subjectIdentity(match.currentSubject)}`,
        ),
      });
    });
  }

  const best = ranked.filter((match) => match.rank === 1);
  const currentCounts = new Map<string, number>();
  for (const match of best) {
    const key = subjectIdentity(match.currentSubject);
    currentCounts.set(key, (currentCounts.get(key) ?? 0) + 1);
  }

  return ranked.map((match) => ({
    ...match,
    destinationConflict: match.rank === 1 && (currentCounts.get(subjectIdentity(match.currentSubject)) ?? 0) > 1,
    justification: match.justification || conciseJustification(match),
  }));
}
