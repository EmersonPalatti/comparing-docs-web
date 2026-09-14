import {
  LIKELY_EQUIVALENCY,
  NO_MATCH,
  PARTIAL_SIMILARITY,
  STRONG_EQUIVALENCY,
} from "./config.ts";
import { subjectSimilarityMatrix } from "./embeddings.ts";
import { conciseJustification } from "./evaluator.ts";
import { type Subject, type SubjectMatch } from "./models.ts";
import { normalizeText, round4 } from "./normalizer.ts";
import { sequenceMatcherRatio } from "./sequence.ts";

export function nameSimilarity(previous: Subject, current: Subject): number {
  const previousName = previous.normalizedName || normalizeText(previous.name);
  const currentName = current.normalizedName || normalizeText(current.name);
  if (!previousName || !currentName) return 0;
  const ratio = sequenceMatcherRatio(previousName, currentName);
  const previousTokens = new Set(previousName.split(" "));
  const currentTokens = new Set(currentName.split(" "));
  const intersection = [...previousTokens].filter((token) => currentTokens.has(token)).length;
  const union = new Set([...previousTokens, ...currentTokens]).size;
  const tokenScore = intersection / Math.max(union, 1);
  return round4(Math.max(ratio, tokenScore));
}

export function workloadCompatibility(
  previousHours: number | null,
  currentHours: number | null,
): number | null {
  if (previousHours === null || currentHours === null || currentHours <= 0) return null;
  if (previousHours >= currentHours) return 1;
  const ratio = previousHours / currentHours;
  if (ratio >= 0.8) return 0.8;
  if (ratio >= 0.6) return 0.5;
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
  if (ratio >= 0.6) return 0.5;
  return 0.2;
}

export function contextScore(previous: Subject, current: Subject): number {
  const previousText = normalizeText(`${previous.name} ${previous.syllabus ?? ""}`);
  const currentText = normalizeText(`${current.name} ${current.syllabus ?? ""}`);
  const advancedTerms = new Set(["avancado", "ii", "iii", "iv"]);
  const introTerms = new Set(["introducao", "basico", "fundamentos", "i"]);
  const previousTokens = new Set(previousText.split(" "));
  const currentTokens = new Set(currentText.split(" "));
  const previousIntro = [...previousTokens].some((token) => introTerms.has(token));
  const currentAdvanced = [...currentTokens].some((token) => advancedTerms.has(token));
  if (previousIntro && currentAdvanced) return 0.6;
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
  if (workloadScore === null) score *= 0.9;
  else if (workloadScore <= 0.5) score *= 0.85;
  return round4(Math.min(score, 1));
}

export function classify(score: number): string {
  if (score >= 0.85) return STRONG_EQUIVALENCY;
  if (score >= 0.7) return LIKELY_EQUIVALENCY;
  if (score >= 0.5) return PARTIAL_SIMILARITY;
  return NO_MATCH;
}

export function requiresManualReview(classification: string, workloadScore: number | null): boolean {
  if (classification === LIKELY_EQUIVALENCY || classification === PARTIAL_SIMILARITY) return true;
  if (workloadScore === null) return true;
  return classification !== STRONG_EQUIVALENCY;
}

export function comparePair(
  previous: Subject,
  current: Subject,
  semanticSimilarity: number | null,
): SubjectMatch {
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
  );
  const classification = classify(score);
  return {
    previousSubject: previous,
    currentSubject: current,
    semanticSimilarity: semanticSimilarity === null ? null : round4(semanticSimilarity),
    nameSimilarity: nameScore,
    workloadScore,
    creditScore,
    finalScore: score,
    classification,
    requiresManualReview: requiresManualReview(classification, workloadScore),
    justification: null,
  };
}

export function matchSubjects(
  previousSubjects: Subject[],
  currentSubjects: Subject[],
  topN = 3,
): SubjectMatch[] {
  if (!previousSubjects.length || !currentSubjects.length) return [];
  const semanticMatrix = subjectSimilarityMatrix(previousSubjects, currentSubjects);
  const matches: SubjectMatch[] = [];
  for (let i = 0; i < previousSubjects.length; i += 1) {
    const candidates = currentSubjects.map((current, j) =>
      comparePair(previousSubjects[i], current, semanticMatrix[i][j]),
    );
    candidates.sort((a, b) => b.finalScore - a.finalScore);
    matches.push(...candidates.slice(0, topN));
  }
  return annotateMatches(matches);
}

export function subjectIdentity(subject: Subject): string {
  return `${subject.name.trim().toLowerCase()}|${subject.workloadHours ?? ""}`;
}

export function annotateMatches(matches: SubjectMatch[]): SubjectMatch[] {
  const byPrevious = new Map<string, SubjectMatch[]>();
  for (const match of matches) {
    const key = subjectIdentity(match.previousSubject);
    const group = byPrevious.get(key) ?? [];
    group.push(match);
    byPrevious.set(key, group);
  }

  const ranked: SubjectMatch[] = [];
  for (const group of byPrevious.values()) {
    group.sort((a, b) => b.finalScore - a.finalScore);
    group.forEach((match, index) => {
      ranked.push({
        ...match,
        rank: index + 1,
        destinationConflict: false,
        assignedUnique: false,
      });
    });
  }

  const best = ranked.filter((match) => match.rank === 1);
  const currentCounts = new Map<string, number>();
  for (const match of best) {
    const key = subjectIdentity(match.currentSubject);
    currentCounts.set(key, (currentCounts.get(key) ?? 0) + 1);
  }

  const claimedCurrent = new Set<string>();
  const uniqueKeys = new Set<string>();
  for (const match of [...best].sort((a, b) => b.finalScore - a.finalScore)) {
    const currentKey = subjectIdentity(match.currentSubject);
    if (claimedCurrent.has(currentKey)) continue;
    claimedCurrent.add(currentKey);
    uniqueKeys.add(`${subjectIdentity(match.previousSubject)}::${currentKey}`);
  }

  return ranked.map((match) => {
    const previousKey = subjectIdentity(match.previousSubject);
    const currentKey = subjectIdentity(match.currentSubject);
    return {
      ...match,
      destinationConflict: match.rank === 1 && (currentCounts.get(currentKey) ?? 0) > 1,
      assignedUnique: uniqueKeys.has(`${previousKey}::${currentKey}`),
      justification: match.justification || conciseJustification(match),
    };
  });
}
