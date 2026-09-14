type TextMark = { str: string; x: number; y: number; width: number; height: number };

type PdfTextItem = {
  str?: string;
  width?: number;
  height?: number;
  transform?: number[];
};

type PdfCell = { x: number; text: string };

export function reconstructPdfText(items: PdfTextItem[]): string {
  const grid = reconstructPdfGrid(items);
  if (!grid.length) return "";
  const width = Math.max(...grid.map((row) => row.length), 0);
  if (width > 1) return grid.map((row) => row.join(" | ")).join("\n");
  return grid.map((row) => row.join(" ")).join("\n");
}

export function reconstructPdfGrid(items: PdfTextItem[]): string[][] {
  const marks = toMarks(items);
  if (!marks.length) return [];
  const rows = clusterRows(marks).map((row) => cellsInRow(row));
  const starts = rows.flatMap((row) => row.map((cell) => cell.x));
  const columns = clusterPositions(starts, typicalGutter(rows));
  if (columns.length < 2) {
    return rows.map((row) => [row.map((cell) => cell.text).join(" ").replace(/\s+/g, " ").trim()]).filter((row) => row[0]);
  }
  return rows.map((row) => {
    const cells = columns.map(() => [] as string[]);
    for (const cell of row) {
      cells[nearestColumn(cell.x, columns)].push(cell.text);
    }
    return cells.map((parts) => parts.join(" ").replace(/\s+/g, " ").trim());
  });
}

function cellsInRow(row: TextMark[]): PdfCell[] {
  const sorted = [...row].sort((a, b) => a.x - b.x);
  const cells: PdfCell[] = [];
  let lastEnd = -Infinity;
  for (const mark of sorted) {
    const current = cells[cells.length - 1];
    const gap = mark.x - lastEnd;
    const charWidth = mark.width / Math.max(mark.str.length, 1);
    const split = gap > Math.max(8, charWidth * 1.8);
    if (!current || split) cells.push({ x: mark.x, text: mark.str });
    else current.text = `${current.text} ${mark.str}`.replace(/\s+/g, " ").trim();
    lastEnd = mark.x + mark.width;
  }
  return cells;
}

function typicalGutter(rows: PdfCell[][]): number {
  const gaps: number[] = [];
  for (const row of rows) {
    const xs = row.map((cell) => cell.x).sort((a, b) => a - b);
    for (let index = 1; index < xs.length; index += 1) gaps.push(xs[index] - xs[index - 1]);
  }
  if (!gaps.length) return 40;
  gaps.sort((a, b) => a - b);
  return Math.max(24, gaps[Math.floor(gaps.length / 2)] * 0.45);
}

function toMarks(items: PdfTextItem[]): TextMark[] {
  return items
    .map((item) => {
      if (!item.str?.trim() || !item.transform || item.transform.length < 6) return null;
      return {
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width ?? 0,
        height: item.height ?? 8,
      } satisfies TextMark;
    })
    .filter((mark): mark is TextMark => Boolean(mark));
}

function clusterRows(marks: TextMark[]): TextMark[][] {
  const sorted = [...marks].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: TextMark[][] = [];
  for (const mark of sorted) {
    const current = rows[rows.length - 1];
    if (!current) {
      rows.push([mark]);
      continue;
    }
    const sample = current[0];
    const tolerance = Math.max(3, Math.min(sample.height, mark.height) * 0.6);
    if (Math.abs(sample.y - mark.y) <= tolerance) current.push(mark);
    else rows.push([mark]);
  }
  return rows;
}

function clusterPositions(values: number[], gap: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const clusters: number[][] = [];
  for (const value of sorted) {
    const last = clusters[clusters.length - 1];
    if (!last || value - last[last.length - 1] > gap) clusters.push([value]);
    else last.push(value);
  }
  return clusters.map((cluster) => cluster.reduce((sum, value) => sum + value, 0) / cluster.length);
}

function nearestColumn(x: number, columns: number[]): number {
  let best = 0;
  let bestDistance = Math.abs(columns[0] - x);
  for (let index = 1; index < columns.length; index += 1) {
    const distance = Math.abs(columns[index] - x);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}
