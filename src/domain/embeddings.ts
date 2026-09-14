import { type Subject } from "./models.ts";
import { normalizeText } from "./normalizer.ts";

const STOPWORDS = new Set([
  "subject",
  "workload",
  "credits",
  "syllabus",
  "disciplina",
  "conteudo",
  "ementa",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "a",
  "o",
  "i",
  "ii",
  "iii",
  "iv",
]);

export function subjectSimilarityMatrix(
  previousSubjects: Subject[],
  currentSubjects: Subject[],
): number[][] {
  const texts = [...previousSubjects, ...currentSubjects].map(
    (subject) => subject.embeddingText || subject.name,
  );
  if (!texts.length || texts.every((text) => !text.trim())) {
    return previousSubjects.map(() => currentSubjects.map(() => 0));
  }

  const similarities = tfidfCosine(texts, previousSubjects.length);
  for (let i = 0; i < previousSubjects.length; i += 1) {
    for (let j = 0; j < currentSubjects.length; j += 1) {
      const tokenScore = tokenOverlapSimilarity(previousSubjects[i], currentSubjects[j]);
      similarities[i][j] = Math.max(similarities[i][j], tokenScore);
    }
  }
  return similarities;
}

export function tokenOverlapSimilarity(previous: Subject, current: Subject): number {
  const previousTokens = meaningfulTokens(previous.embeddingText || previous.name);
  const currentTokens = meaningfulTokens(current.embeddingText || current.name);
  if (!previousTokens.size || !currentTokens.size) return 0;

  const intersection = intersect(previousTokens, currentTokens);
  const containment = intersection.size / Math.min(previousTokens.size, currentTokens.size);
  const unionSize = previousTokens.size + currentTokens.size - intersection.size;
  const jaccard = intersection.size / unionSize;

  const previousNameTokens = meaningfulTokens(previous.name);
  const currentNameTokens = meaningfulTokens(current.name);
  const nameOverlap =
    intersect(previousNameTokens, currentNameTokens).size /
    Math.max(Math.min(previousNameTokens.size, currentNameTokens.size), 1);

  if (nameOverlap >= 0.5 && containment >= 0.25) {
    return Math.min(1, Math.max(containment, 0.75));
  }
  return Math.max(containment, jaccard);
}

export function meaningfulTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const token of normalizeText(text).split(" ")) {
    if (token.length > 2 && !STOPWORDS.has(token) && !/^\d+$/.test(token)) {
      tokens.add(token);
    }
  }
  return tokens;
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const value of a) {
    if (b.has(value)) result.add(value);
  }
  return result;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []).map((token) => token);
}

function ngrams(tokens: string[]): string[] {
  const grams: string[] = [...tokens];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    grams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return grams;
}

function tfidfCosine(texts: string[], splitAt: number): number[][] {
  const docs = texts.map((text) => ngrams(tokenize(text)));
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(doc)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const n = docs.length;
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((1 + n) / (1 + count)) + 1);
  }

  const vectors = docs.map((doc) => {
    const tf = new Map<string, number>();
    for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1);
    const vector = new Map<string, number>();
    let norm = 0;
    for (const [term, count] of tf) {
      const weight = count * (idf.get(term) ?? 0);
      vector.set(term, weight);
      norm += weight * weight;
    }
    const scale = Math.sqrt(norm) || 1;
    for (const [term, weight] of vector) vector.set(term, weight / scale);
    return vector;
  });

  const previous = vectors.slice(0, splitAt);
  const current = vectors.slice(splitAt);
  return previous.map((left) =>
    current.map((right) => {
      let dot = 0;
      for (const [term, weight] of left) {
        const other = right.get(term);
        if (other) dot += weight * other;
      }
      return dot;
    }),
  );
}
