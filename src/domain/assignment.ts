import { ASSIGNMENT_THRESHOLD } from "./config.ts";

/**
 * Atribuição de peso máximo (Kuhn–Munkres).
 * Devolve o índice de coluna para cada linha, ou -1 se ficar de fora
 * (padding, ou score abaixo do limiar).
 */
export function maxWeightAssignment(
  weights: number[][],
  threshold = ASSIGNMENT_THRESHOLD,
): number[] {
  const rows = weights.length;
  if (!rows) return [];
  const cols = weights[0]?.length ?? 0;
  if (!cols) return Array.from({ length: rows }, () => -1);

  const n = Math.max(rows, cols);
  const dummyCost = 1 - threshold;
  const cost: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i < rows && j < cols) return 1 - weights[i][j];
      if (i < rows) return dummyCost;
      return 0;
    }),
  );

  const colOfRow = hungarianMinimize(cost);
  return colOfRow.slice(0, rows).map((column, row) => {
    if (column < 0 || column >= cols) return -1;
    if (weights[row][column] < threshold) return -1;
    return column;
  });
}

/** Minimização quadrada n×n, implementação 1-indexada (cp-algorithms). */
function hungarianMinimize(cost: number[][]): number[] {
  const n = cost.length;
  const u = Array(n + 1).fill(0);
  const v = Array(n + 1).fill(0);
  const p = Array(n + 1).fill(0);
  const way = Array(n + 1).fill(0);

  for (let i = 1; i <= n; i += 1) {
    p[0] = i;
    let j0 = 0;
    const minv = Array(n + 1).fill(Number.POSITIVE_INFINITY);
    const used = Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Number.POSITIVE_INFINITY;
      let j1 = 0;
      for (let j = 1; j <= n; j += 1) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j += 1) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const assignment = Array.from({ length: n }, () => -1);
  for (let j = 1; j <= n; j += 1) {
    if (p[j] > 0) assignment[p[j] - 1] = j - 1;
  }
  return assignment;
}
