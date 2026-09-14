import { createSubject, type Subject } from "./models.ts";
import { normalizeSubjects, normalizeText } from "./normalizer.ts";
import { MAX_SUBJECTS } from "./config.ts";

const WORKLOAD_RE = /(?<hours>\d{1,4})\s*(?:h|horas|hrs)\b/i;
const CREDITS_RE = /(?<credits>\d+(?:[,.]\d+)?)\s*(?:cr[eé]ditos?|cred\.?)\b/i;
const SYLLABUS_RE = /^(?:conte[uú]do|ementa|programa|syllabus)\s*:\s*(?<value>.+)$/i;
const SUBJECT_LABEL_RE = /^(?:disciplina|subject|componente curricular)\s*:\s*(?<value>.+)$/i;
const CODE_TABLE_RE =
  /^(?<code>[A-Z]{2,5}\d{2,4})\s+(?<middle>.*?)\s*(?<hours>\d{1,4})h\s+(?<semester>\d+º)\s+(?<grade>-|\d+(?:,\d+)?)\s+(?<status>Aprovado|A cursar)\b(?<trailing>.*)$/i;
const SUBJECT_CODE_RE = /\b[A-Z]{2,5}[-\s]?\d{2,4}\b/;

const CONNECTOR_WORDS = new Set(["e", "à", "a", "ao", "de", "da", "do", "das", "dos"]);
const TABLE_HEADER_MARKERS = new Set([
  "Código Disciplina CH Período Nota Situação",
  "resumida",
  "Ementa",
  "Histórico de disciplinas cursadas",
]);
const TABLE_END_MARKERS = new Set([
  "Conteúdo programático simplificado",
  "Critérios sugeridos para análise de equivalência",
]);

export type ParsedLine = {
  text: string;
  index: number;
  hasSubjectCode: boolean;
  hasWorkload: boolean;
  hasSyllabusLabel: boolean;
  looksLikeTitle: boolean;
  isTableBoundary: boolean;
};

type ParseStrategy = (text: string, sourceDocument: string) => Subject[];

export function extractWorkload(text: string): number | null {
  const match = WORKLOAD_RE.exec(text);
  if (match?.groups?.hours) return Number.parseInt(match.groups.hours, 10);
  const trimmed = text.trim();
  if (/^\d{1,4}$/.test(trimmed)) return Number.parseInt(trimmed, 10);
  return null;
}

export function extractCredits(text: string): number | null {
  const match = CREDITS_RE.exec(text);
  if (!match?.groups?.credits) return null;
  return Number.parseFloat(match.groups.credits.replace(",", "."));
}

export function cleanSubjectName(text: string): string {
  let value = text.replace(SUBJECT_LABEL_RE, "$<value>").trim();
  value = value.replace(WORKLOAD_RE, "");
  value = value.replace(CREDITS_RE, "");
  value = value.replace(/\s*[-–—|;]\s*$/u, "");
  value = value.split(/\s[-–—|]\s/u, 1)[0].trim();
  return value.replace(/\s+/g, " ").replace(/^[ ,\-–—|;]+|[ ,\-–—|;]+$/gu, "");
}

export function isSubjectLine(line: string): boolean {
  if (SYLLABUS_RE.test(line)) return false;
  return WORKLOAD_RE.test(line) || SUBJECT_LABEL_RE.test(line);
}

export function analyzeLine(line: string, index: number): ParsedLine {
  return {
    text: line,
    index,
    hasSubjectCode: SUBJECT_CODE_RE.test(line),
    hasWorkload: WORKLOAD_RE.test(line),
    hasSyllabusLabel: SYLLABUS_RE.test(line),
    looksLikeTitle: Boolean(titlePrefix(line)),
    isTableBoundary: isTableEndLine(line) || shouldSkipTableLine(line),
  };
}

export function analyzeLines(text: string): ParsedLine[] {
  return [...iterRelevantLines(text)].map((line, index) => analyzeLine(line, index));
}

function parseCsvSubjects(text: string, sourceDocument: string): Subject[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const fieldMap = new Map(headers.map((field) => [field.toLowerCase().trim(), field]));
  const nameKey = [...fieldMap.keys()].find((key) =>
    ["name", "subject", "disciplina", "componente curricular"].includes(key),
  );
  if (!nameKey) return [];
  const nameHeader = fieldMap.get(nameKey);
  if (!nameHeader) return [];

  const subjects: Subject[] = [];
  for (const row of rows.slice(1)) {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    const name = (record[nameHeader] || "").trim();
    if (!name) continue;
    const workload = firstPresent(record, fieldMap, [
      "workload_hours",
      "workload",
      "carga horaria",
      "carga_horaria",
      "horas",
    ]);
    const credits = firstPresent(record, fieldMap, ["credits", "creditos", "créditos"]);
    const syllabus = firstPresent(record, fieldMap, ["syllabus", "ementa", "conteudo", "conteúdo"]);
    const joined = Object.values(record).join(",");
    subjects.push(
      createSubject({
        name,
        sourceDocument,
        workloadHours: workload ? extractWorkload(String(workload)) : extractWorkload(joined),
        credits: credits ? extractCredits(String(credits)) : extractCredits(joined),
        syllabus: syllabus ? String(syllabus).trim() : null,
        rawText: Object.entries(record)
          .filter(([, value]) => value)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", "),
      }),
    );
  }
  return subjects;
}

function firstPresent(
  row: Record<string, string>,
  fieldMap: Map<string, string>,
  names: string[],
): string | null {
  for (const [normalized, original] of fieldMap) {
    if (names.includes(normalized) && row[original]) return row[original];
  }
  return null;
}

function parseTextSubjects(text: string, sourceDocument: string): Subject[] {
  const subjects: Subject[] = [];
  let current: Record<string, unknown> | null = null;

  for (const line of iterRelevantLines(text)) {
    const syllabusMatch = SYLLABUS_RE.exec(line);
    if (syllabusMatch && current) {
      current.syllabus = appendText(current.syllabus, syllabusMatch.groups?.value ?? "");
      current.rawText = appendText(current.rawText, line);
      continue;
    }

    if (isSubjectLine(line)) {
      if (current) subjects.push(buildSubject(current, sourceDocument));
      current = {
        name: cleanSubjectName(line),
        workloadHours: extractWorkload(line),
        credits: extractCredits(line),
        rawText: line,
      };
      continue;
    }

    if (current) {
      current.rawText = appendText(current.rawText, line);
      if (line.split(/\s+/).length > 4) {
        current.syllabus = appendText(current.syllabus, line);
      }
    }
  }

  if (current) subjects.push(buildSubject(current, sourceDocument));
  return subjects.filter((subject) => subject.name);
}

function parseCodeTableSubjects(text: string, sourceDocument: string): Subject[] {
  const parsedLines = analyzeLines(text);
  const lines = parsedLines.map((line) => line.text);
  const codeRows: Array<{ index: number; match: RegExpExecArray }> = [];
  lines.forEach((line, index) => {
    const match = CODE_TABLE_RE.exec(line);
    if (match) codeRows.push({ index, match });
  });
  if (!codeRows.length) return [];

  const subjects: Subject[] = [];
  codeRows.forEach((row, rowNumber) => {
    const previousBoundary = rowNumber > 0 ? codeRows[rowNumber - 1].index : -1;
    const nextCodeBoundary =
      rowNumber + 1 < codeRows.length ? codeRows[rowNumber + 1].index : lines.length;
    const nextBoundary = Math.min(
      nextCodeBoundary,
      nextTableEndIndex(lines, row.index, nextCodeBoundary),
    );
    const beforeLines = lines.slice(previousBoundary + 1, row.index);
    const afterLines = lines.slice(row.index + 1, nextBoundary);
    const nameParts = collectNameParts(beforeLines, row.match.groups?.middle ?? "", afterLines);
    const name = nameParts.filter(Boolean).join(" ").trim() || row.match.groups?.code || "";
    const syllabusParts = collectSyllabusParts(
      beforeLines,
      row.match.groups?.trailing ?? "",
      afterLines,
      nameParts,
    );
    const gradeRaw = row.match.groups?.grade ?? "-";
    subjects.push(
      createSubject({
        name,
        sourceDocument,
        workloadHours: Number.parseInt(row.match.groups?.hours ?? "0", 10),
        semester: row.match.groups?.semester ?? null,
        status: row.match.groups?.status ?? null,
        grade: gradeRaw === "-" ? null : gradeRaw.replace(",", "."),
        syllabus: syllabusParts.join(" ") || null,
        rawText: lines.slice(previousBoundary + 1, nextBoundary).join(" "),
      }),
    );
  });
  return subjects;
}

function collectNameParts(beforeLines: string[], middle: string, afterLines: string[]): string[] {
  const parts: string[] = [];
  const before = titlePrefix(lastContentLine(beforeLines));
  const middleName = cleanInlineName(middle);
  const after = titlePrefix(firstContentLine(afterLines));
  const shouldUseBefore =
    !middleName || middleName.split(" ").length === 1 || CONNECTOR_WORDS.has(middleName.split(" ").at(-1)?.toLowerCase() ?? "");
  const shouldUseAfter = shouldUseBefore;
  if (before && shouldUseBefore) parts.push(before);
  if (middleName && !parts.includes(middleName)) parts.push(middleName);
  if (after && shouldUseAfter && !parts.includes(after)) parts.push(after);
  return parts;
}

function collectSyllabusParts(
  beforeLines: string[],
  trailing: string,
  afterLines: string[],
  nameParts: string[],
): string[] {
  const nameValues = new Set(nameParts);
  const parts: string[] = [];
  const extra = trailing.trim() ? [trailing.trim()] : [];
  for (const line of [...beforeLines, ...extra, ...afterLines]) {
    if (shouldSkipTableLine(line)) continue;
    const prefix = titlePrefix(line);
    let cleaned = line;
    if (nameValues.has(prefix)) cleaned = line.slice(prefix.length).replace(/^[ ,\-;]+/, "").trim();
    if (cleaned && !nameValues.has(cleaned)) parts.push(cleaned);
  }
  return parts;
}

function lastContentLine(lines: string[]): string {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (!shouldSkipTableLine(lines[i]) && titlePrefix(lines[i])) return lines[i];
  }
  return "";
}

function firstContentLine(lines: string[]): string {
  for (const line of lines.slice(0, 3)) {
    if (!shouldSkipTableLine(line) && titlePrefix(line)) return line;
  }
  return "";
}

export function titlePrefix(line: string): string {
  const words = line.trim().split(/\s+/);
  const selected: string[] = [];
  for (let index = 0; index < words.length; index += 1) {
    const cleaned = words[index].replace(/^[ ,.;:()]+|[ ,.;:()]+$/g, "");
    if (!cleaned) continue;
    const startsUpper = cleaned[0] === cleaned[0].toUpperCase() && cleaned[0] !== cleaned[0].toLowerCase();
    const isConnector = CONNECTOR_WORDS.has(cleaned.toLowerCase());
    const nextRaw = words[index + 1]?.replace(/^[ ,.;:()]+|[ ,.;:()]+$/g, "") ?? "";
    const nextStartsUpper = nextRaw.length > 0 && nextRaw[0] === nextRaw[0].toUpperCase() && nextRaw[0] !== nextRaw[0].toLowerCase();
    if (startsUpper || (selected.length && isConnector) || (isConnector && nextStartsUpper)) {
      selected.push(cleaned);
      continue;
    }
    break;
  }
  return selected.join(" ");
}

function cleanInlineName(value: string): string {
  return titlePrefix(value.replace(/^[ ,\-;]+|[ ,\-;]+$/g, "")) || "";
}

function shouldSkipTableLine(line: string): boolean {
  return !line.trim() || TABLE_HEADER_MARKERS.has(line.trim());
}

function nextTableEndIndex(lines: string[], start: number, fallback: number): number {
  for (let index = start + 1; index < fallback; index += 1) {
    if (isTableEndLine(lines[index])) return index;
  }
  return fallback;
}

function isTableEndLine(line: string): boolean {
  const normalized = normalizeText(line);
  return [...TABLE_END_MARKERS].some((marker) => normalized === normalizeText(marker));
}

function* iterRelevantLines(text: string): Generator<string> {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line) yield line;
  }
}

function appendText(existing: unknown, value: string): string {
  if (!existing) return value.trim();
  return `${existing} ${value.trim()}`;
}

function buildSubject(data: Record<string, unknown>, sourceDocument: string): Subject {
  return createSubject({
    name: String(data.name ?? "").trim(),
    sourceDocument,
    workloadHours: typeof data.workloadHours === "number" ? data.workloadHours : null,
    credits: typeof data.credits === "number" ? data.credits : null,
    syllabus: data.syllabus ? String(data.syllabus).trim() : null,
    rawText: data.rawText ? String(data.rawText).trim() : null,
  });
}

function parseCsv(text: string): string[][] {
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
    } else if (char === ",") {
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
  return rows.filter((entry) => entry.some((value) => value.trim()));
}

const PARSE_STRATEGIES: ParseStrategy[] = [
  parseCsvSubjects,
  parseCodeTableSubjects,
  parseTextSubjects,
];

export function parseSubjects(text: string, sourceDocument: string): Subject[] {
  for (const strategy of PARSE_STRATEGIES) {
    const subjects = strategy(text, sourceDocument);
    if (subjects.length) {
      const normalized = normalizeSubjects(subjects);
      if (normalized.length > MAX_SUBJECTS) {
        throw new Error(
          `Limite excedido: no máximo ${MAX_SUBJECTS} disciplinas por documento.`,
        );
      }
      return normalized;
    }
  }
  return [];
}
