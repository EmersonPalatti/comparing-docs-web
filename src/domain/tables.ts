import { headerAt, HOUR_ROLES, type ColumnRole } from "./columns.ts";
import { MAX_SUBJECTS } from "./config.ts";
import { createSubject, type Subject } from "./models.ts";
import { normalizeSubjects, normalizeText } from "./normalizer.ts";

const WORKLOAD_RE = /(?<hours>\d{1,4})\s*(?:h|horas|hrs)\b/i;
const CREDITS_RE = /(?<credits>\d+(?:[,.]\d+)?)\s*(?:cr[eé]ditos?|cred\.?)\b/i;
const SKIP_NAME_RE =
  /^(?:totais?|subtotais?|total(?:\s+\w+){0,6}|ch do (?:semestre|periodo)|carga horaria total|disciplinas? (?:obrigatorias|optativas|eletivas))$/;

export function parseGrid(grid: string[][], sourceDocument: string): Subject[] {
  const subjects: Subject[] = [];
  let roles: Array<ColumnRole | null> | null = null;
  let semester: string | null = null;

  for (let index = 0; index < grid.length; ) {
    const row = grid[index];
    const banner = periodBanner(row);
    if (banner) {
      semester = banner;
      index += 1;
      continue;
    }

    const header = headerAt(grid, index);
    if (header) {
      roles = header.roles;
      index += header.consumed;
      continue;
    }

    if (!roles) {
      index += 1;
      continue;
    }

    const subject = rowToSubject(row, roles, sourceDocument, semester);
    if (subject) subjects.push(subject);
    index += 1;
  }

  const normalized = normalizeSubjects(subjects);
  if (normalized.length > MAX_SUBJECTS) {
    throw new Error(`Limite excedido: no máximo ${MAX_SUBJECTS} disciplinas por documento.`);
  }
  return normalized;
}

export function mergeSubjectLists(groups: Subject[][]): Subject[] {
  const byKey = new Map<string, Subject>();
  const order: string[] = [];
  for (const subject of groups.flat()) {
    const key = subjectKey(subject);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, subject);
      order.push(key);
      continue;
    }
    byKey.set(key, mergePair(existing, subject));
  }
  return normalizeSubjects(order.map((key) => byKey.get(key)!));
}

export function gridsToText(grids: string[][][]): string {
  return grids
    .map((grid) => grid.map((row) => row.map(csvEscape).join(",")).join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

export function parseDelimited(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows
    .map((entry) => entry.map((value) => value.replace(/^\s+|\s+$/g, "")))
    .filter((entry) => entry.some((value) => value));
}

export function detectDelimiter(text: string): string {
  const sample = firstLogicalLine(text);
  const commas = countUnquoted(sample, ",");
  const semis = countUnquoted(sample, ";");
  const tabs = countUnquoted(sample, "\t");
  const pipes = countUnquoted(sample, "|");
  const scored = [
    ["\t", tabs],
    [";", semis],
    ["|", pipes],
    [",", commas],
  ] as const;
  const best = scored.reduce((winner, next) => (next[1] > winner[1] ? next : winner));
  return best[1] > 0 ? best[0] : ",";
}

function rowToSubject(
  row: string[],
  roles: Array<ColumnRole | null>,
  sourceDocument: string,
  inheritedSemester: string | null,
): Subject | null {
  const record = rowByRole(row, roles);
  const name = ((record.name || record.code || "") as string).replace(/\s+/g, " ").trim();
  if (!name) return null;
  if (SKIP_NAME_RE.test(normalizeText(name))) return null;
  if (periodBanner([name])) return null;

  const theory = parseHoursCell(record.hoursTheory);
  const practice = parseHoursCell(record.hoursPractice);
  const ead = parseHoursCell(record.hoursEad);
  const extension = parseHoursCell(record.hoursExtension);
  const total = parseHoursCell(record.hours);
  const parts = [theory, practice, ead, extension].filter((value): value is number => value != null);
  const hours = total ?? (parts.length ? parts.reduce((sum, value) => sum + value, 0) : null);

  return createSubject({
    name,
    sourceDocument,
    code: emptyToNull(record.code),
    workloadHours: hours,
    credits: parseCreditsCell(record.credits),
    semester: emptyToNull(record.semester) ?? inheritedSemester,
    status: emptyToNull(record.status),
    grade: emptyToNull(record.grade),
    syllabus: emptyToNull(record.syllabus),
    rawText: Object.entries(record)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", "),
  });
}

function rowByRole(row: string[], roles: Array<ColumnRole | null>): Record<string, string> {
  const record: Record<string, string> = {};
  roles.forEach((role, index) => {
    if (!role || role === "ignore") return;
    const value = (row[index] ?? "").replace(/\s+/g, " ").trim();
    if (!value) return;
    if (HOUR_ROLES.includes(role)) {
      const hours = parseHoursCell(value);
      const previous = parseHoursCell(record[role]);
      if (hours != null) {
        record[role] = String((previous ?? 0) + hours);
        return;
      }
    }
    if (record[role]) record[role] = `${record[role]} ${value}`;
    else record[role] = value;
  });
  return record;
}

export function periodBanner(row: string[]): string | null {
  const filled = row.map((cell) => cell.trim()).filter(Boolean);
  if (!filled.length) return null;
  const unique = [...new Set(filled.map((cell) => normalizeText(cell)))];
  if (unique.length > 1 && filled.length > 2) return null;
  const text = unique.length === 1 ? filled[0] : filled.join(" ");
  const normalized = normalizeText(text);
  const numbered = normalized.match(/^(\d+)\s*(?:o|a)?\s*(periodo|semestre|modulo)\b/);
  if (numbered) {
    const unit = numbered[2] === "semestre" ? "semestre" : numbered[2] === "modulo" ? "módulo" : "período";
    return `${numbered[1]}º ${unit}`;
  }
  const roman = normalized.match(/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)\s*(periodo|semestre|modulo)?$/);
  if (roman) return unique.length === 1 ? filled[0] : text;
  return null;
}

function parseHoursCell(value: string | undefined): number | null {
  if (!value) return null;
  const match = WORKLOAD_RE.exec(value);
  if (match?.groups?.hours) return Number.parseInt(match.groups.hours, 10);
  return parseBareNumber(value);
}

function parseCreditsCell(value: string | undefined): number | null {
  if (!value) return null;
  const match = CREDITS_RE.exec(value);
  if (match?.groups?.credits) return Number.parseFloat(match.groups.credits.replace(",", "."));
  return parseBareNumber(value);
}

function parseBareNumber(value: string): number | null {
  const match = value.trim().replace(",", ".").match(/^(\d{1,4})(?:\.\d+)?$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function emptyToNull(value: string | undefined | null): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function subjectKey(subject: Subject): string {
  if (subject.code) return `c:${normalizeText(subject.code)}`;
  return `n:${subject.normalizedName || normalizeText(subject.name)}`;
}

function mergePair(left: Subject, right: Subject): Subject {
  return createSubject({
    name: preferredName(left, right),
    sourceDocument: left.sourceDocument,
    code: left.code || right.code,
    workloadHours: left.workloadHours ?? right.workloadHours,
    credits: left.credits ?? right.credits,
    semester: left.semester ?? right.semester,
    status: left.status ?? right.status,
    grade: left.grade ?? right.grade,
    syllabus: left.syllabus || right.syllabus,
    rawText: [left.rawText, right.rawText].filter(Boolean).join(" | "),
  });
}

function preferredName(left: Subject, right: Subject): string {
  if (left.code && left.name === left.code && right.name && right.name !== right.code) return right.name;
  if (right.code && right.name === right.code && left.name && left.name !== left.code) return left.name;
  return left.name.length >= right.name.length ? left.name : right.name;
}

function firstLogicalLine(text: string): string {
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') quoted = !quoted;
    else if (char === "\n" && !quoted) return text.slice(0, i);
  }
  return text;
}

function countUnquoted(text: string, delimiter: string): number {
  let quoted = false;
  let count = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === delimiter) count += 1;
  }
  return count;
}
