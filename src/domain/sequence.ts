/** Ratcliff/Obershelp matching, matching Python's difflib.SequenceMatcher.ratio(). */
export function sequenceMatcherRatio(a: string, b: string): number {
  if (!a && !b) return 1;
  const total = a.length + b.length;
  if (total === 0) return 1;
  return (2 * matchingLength(a, b)) / total;
}

function matchingLength(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  const [i, j, size] = longestMatch(a, b);
  if (size === 0) return 0;
  return (
    size +
    matchingLength(a.slice(0, i), b.slice(0, j)) +
    matchingLength(a.slice(i + size), b.slice(j + size))
  );
}

function longestMatch(a: string, b: string): [number, number, number] {
  let bestI = 0;
  let bestJ = 0;
  let bestSize = 0;
  const lengths = new Array<number>(b.length + 1).fill(0);

  for (let i = 0; i < a.length; i += 1) {
    const next = new Array<number>(b.length + 1).fill(0);
    for (let j = 0; j < b.length; j += 1) {
      if (a[i] === b[j]) {
        next[j + 1] = lengths[j] + 1;
        if (next[j + 1] > bestSize) {
          bestSize = next[j + 1];
          bestI = i - bestSize + 1;
          bestJ = j - bestSize + 1;
        }
      }
    }
    for (let k = 0; k < lengths.length; k += 1) lengths[k] = next[k];
  }

  return [bestI, bestJ, bestSize];
}

export function tokenSetRatio(a: string, b: string): number {
  const left = distinctTokens(a);
  const right = distinctTokens(b);
  if (!left.length || !right.length) return 0;
  const inter = left.filter((token) => right.includes(token));
  if (!inter.length) return sequenceMatcherRatio(left.join(" "), right.join(" "));
  const sortedInter = inter.slice().sort().join(" ");
  const leftSorted = left.slice().sort().join(" ");
  const rightSorted = right.slice().sort().join(" ");
  return Math.max(
    sequenceMatcherRatio(leftSorted, rightSorted),
    sequenceMatcherRatio(sortedInter, leftSorted),
    sequenceMatcherRatio(sortedInter, rightSorted),
  );
}

function distinctTokens(text: string): string[] {
  return [...new Set(text.split(" ").filter((token) => token.length > 1))];
}

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const matchDistance = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = Array(a.length).fill(false);
  const bMatches = Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches += 1;
      break;
    }
  }
  if (!matches) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k += 1;
    if (a[i] !== b[k]) transpositions += 1;
    k += 1;
  }
  const jaro =
    (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i += 1) {
    if (a[i] === b[i]) prefix += 1;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}
