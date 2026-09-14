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
