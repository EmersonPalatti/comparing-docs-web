import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import ExcelJS from "exceljs";
import { DISCLAIMER_PT } from "./config.ts";
import { type Subject } from "./models.ts";
import { type MatchRow, sanitizeSpreadsheetCell, subjectsWithoutSelectedMatch } from "./rows.ts";

const SUMMARY_HEADERS = [
  "Selecionar",
  "Disciplina anterior",
  "CH anterior",
  "Disciplina atual",
  "CH atual",
  "Prioridade",
  "Alertas",
  "Compatibilidade CH",
  "Equivalência",
  "Classificação",
  "Revisão manual",
  "Observação do revisor",
];

const DETAILED_HEADERS = [
  ...SUMMARY_HEADERS,
  "Similaridade semântica",
  "Similaridade do nome",
  "Compatibilidade créditos",
  "Justificativa",
];

export function summaryRow(row: MatchRow): (string | number | boolean | null)[] {
  return [
    row.selected,
    sanitizeSpreadsheetCell(row.previousName),
    row.previousHours,
    sanitizeSpreadsheetCell(row.currentName),
    row.currentHours,
    sanitizeSpreadsheetCell(row.priority),
    sanitizeSpreadsheetCell(row.alerts),
    row.workloadScoreLabel,
    row.equivalencyPercent,
    sanitizeSpreadsheetCell(row.classificationLabel),
    row.manualReviewLabel,
    sanitizeSpreadsheetCell(row.reviewerNote),
  ];
}

export function detailedRow(row: MatchRow): (string | number | boolean | null)[] {
  return [
    ...summaryRow(row),
    row.semanticLabel,
    row.nameSimilarityLabel,
    row.creditScoreLabel,
    sanitizeSpreadsheetCell(row.justification),
  ];
}

export async function workbookToBytes(workbook: ExcelJS.Workbook): Promise<Uint8Array> {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: string[],
  rows: (string | number | boolean | null)[][],
): void {
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(
      row.map((cell) => {
        if (typeof cell === "string") return sanitizeSpreadsheetCell(cell);
        if (cell === null) return "";
        return cell;
      }),
    );
  }
}

export async function rowsToSummaryXlsx(rows: MatchRow[]): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  addSheet(workbook, "equivalencias", SUMMARY_HEADERS, rows.map(summaryRow));
  return workbookToBytes(workbook);
}

export async function rowsToDetailedXlsx(rows: MatchRow[]): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  addSheet(workbook, "equivalencias", DETAILED_HEADERS, rows.map(detailedRow));
  return workbookToBytes(workbook);
}

export async function finalReviewReportToXlsx(
  selected: MatchRow[],
  previousSubjects: Subject[],
  currentSubjects: Subject[],
): Promise<Uint8Array> {
  const previousWithout = subjectsWithoutSelectedMatch(previousSubjects, selected, "previous");
  const currentUnused = subjectsWithoutSelectedMatch(currentSubjects, selected, "current");
  const workbook = new ExcelJS.Workbook();
  addSheet(workbook, "matches_selecionados", SUMMARY_HEADERS, selected.map(summaryRow));
  addSheet(workbook, "anteriores_sem_match", UNMATCHED_HEADERS, previousWithout.map(unmatchedRow));
  addSheet(workbook, "atuais_nao_usadas", UNMATCHED_HEADERS, currentUnused.map(unmatchedRow));
  return workbookToBytes(workbook);
}

const UNMATCHED_HEADERS = ["Disciplina", "Carga horária", "Documento fonte", "Ementa"];

function unmatchedRow(subject: Subject): (string | number | boolean | null)[] {
  return [
    sanitizeSpreadsheetCell(subject.name),
    subject.workloadHours,
    sanitizeSpreadsheetCell(subject.sourceDocument),
    sanitizeSpreadsheetCell(subject.syllabus ?? ""),
  ];
}

export function workloadDifference(previous: unknown, current: unknown): string {
  const previousNumber = parseNumber(previous);
  const currentNumber = parseNumber(current);
  if (previousNumber === null || currentNumber === null) return "Não calculada";
  const difference = previousNumber - currentNumber;
  if (difference > 0) return `+${formatHours(difference)}h`;
  return `${formatHours(difference)}h`;
}

function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 34;

export async function generateSelectedPdfReport(
  selected: MatchRow[],
  previousSubjects: Subject[],
  currentSubjects: Subject[],
  previousSource = "Documento anterior",
  currentSource = "Documento atual",
): Promise<Uint8Array> {
  const previousWithout = subjectsWithoutSelectedMatch(previousSubjects, selected, "previous");
  const currentUnused = subjectsWithoutSelectedMatch(currentSubjects, selected, "current");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  y = drawHeader(page, font, bold, y, previousSource, currentSource);
  y = drawSummary(page, font, bold, y, selected, previousWithout, currentUnused);
  y = drawSectionTitle(page, bold, y, "Matches selecionados pela pessoa revisora");
  if (!selected.length) {
    y = drawText(page, font, y, "Nenhum match foi selecionado.");
  } else {
    y = drawMatchTable(pdf, page, font, bold, y, selected);
  }

  page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  y = PAGE_HEIGHT - MARGIN;
  y = drawSectionTitle(page, bold, y, "Disciplinas anteriores sem match selecionado");
  y = drawSubjectTable(page, font, bold, y, previousWithout);
  y -= 16;
  y = drawSectionTitle(page, bold, y, "Disciplinas atuais não usadas nos matches selecionados");
  drawSubjectTable(page, font, bold, y, currentUnused);

  drawFooters(pdf, font);
  return pdf.save();
}

function drawHeader(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  y: number,
  previousSource: string,
  currentSource: string,
): number {
  const generatedAt = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  page.drawText("Relatório de análise de equivalência acadêmica", {
    x: MARGIN,
    y,
    size: 16,
    font: bold,
    color: ink,
  });
  y -= 22;
  y = drawText(page, font, y, `Gerado em: ${generatedAt}`, 8);
  y = drawText(page, font, y, `Documento anterior: ${previousSource}`, 8);
  y = drawText(page, font, y, `Documento atual: ${currentSource}`, 8);
  y -= 4;
  return drawWrapped(page, font, y, DISCLAIMER_PT, 8, PAGE_WIDTH - MARGIN * 2) - 8;
}

function drawSummary(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  y: number,
  selected: MatchRow[],
  previousWithout: Subject[],
  currentUnused: Subject[],
): number {
  y = drawSectionTitle(page, bold, y, "Resumo");
  const manualCount = selected.filter((row) => row.manualReview).length;
  const headers = [
    "Matches selecionados",
    "Anteriores sem match",
    "Atuais não usadas",
    "Selecionados com revisão manual",
  ];
  const values = [
    String(selected.length),
    String(previousWithout.length),
    String(currentUnused.length),
    String(manualCount),
  ];
  const col = 180;
  headers.forEach((header, index) => {
    page.drawText(header, { x: MARGIN + index * col, y, size: 8, font: bold, color: ink });
  });
  y -= 14;
  values.forEach((value, index) => {
    page.drawText(value, { x: MARGIN + index * col, y, size: 10, font, color: ink });
  });
  return y - 18;
}

function drawMatchTable(
  pdf: PDFDocument,
  startPage: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  startY: number,
  rows: MatchRow[],
): number {
  const headers = [
    "Disciplina anterior",
    "CH ant.",
    "Disciplina atual",
    "CH at.",
    "Dif. CH",
    "Equivalência",
    "Classificação",
    "Alertas",
    "Observação",
  ];
  const widths = [110, 42, 110, 42, 48, 70, 110, 130, 130];
  let page = startPage;
  let y = startY;
  y = drawTableHeader(page, bold, y, headers, widths);
  for (const row of rows) {
    const cells = [
      row.previousName,
      row.previousHours == null ? "" : String(row.previousHours),
      row.currentName,
      row.currentHours == null ? "" : String(row.currentHours),
      workloadDifference(row.previousHours, row.currentHours),
      row.equivalencyPercent,
      row.classificationLabel,
      row.alerts,
      row.reviewerNote,
    ];
    const height = Math.max(22, ...cells.map((cell, index) => wrappedHeight(font, cell, widths[index] - 6, 7)));
    if (y - height < 36) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      y = drawTableHeader(page, bold, y, headers, widths);
    }
    drawRow(page, font, y, cells, widths, height);
    y -= height;
  }
  return y;
}

function drawSubjectTable(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  y: number,
  subjects: Subject[],
): number {
  if (!subjects.length) {
    return drawText(page, font, y, "Nenhuma disciplina nesta seção.");
  }
  const widths = [420, 80];
  y = drawTableHeader(page, bold, y, ["Disciplina", "Carga horária"], widths);
  for (const subject of subjects) {
    const height = 18;
    drawRow(
      page,
      font,
      y,
      [subject.name, subject.workloadHours == null ? "" : String(subject.workloadHours)],
      widths,
      height,
    );
    y -= height;
  }
  return y;
}

function drawTableHeader(
  page: PDFPage,
  bold: PDFFont,
  y: number,
  headers: string[],
  widths: number[],
): number {
  drawRow(page, bold, y, headers, widths, 18, true);
  return y - 18;
}

function drawRow(
  page: PDFPage,
  font: PDFFont,
  y: number,
  cells: string[],
  widths: number[],
  height: number,
  header = false,
): void {
  let x = MARGIN;
  page.drawRectangle({
    x: MARGIN - 2,
    y: y - height + 10,
    width: widths.reduce((sum, width) => sum + width, 0) + 4,
    height,
    color: header ? rgb(0.9, 0.905, 0.91) : rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.83, 0.86),
    borderWidth: 0.4,
  });
  cells.forEach((cell, index) => {
    const lines = wrapText(font, cell, widths[index] - 6, 7);
    lines.slice(0, 3).forEach((line, lineIndex) => {
      page.drawText(line, {
        x: x + 3,
        y: y - 2 - lineIndex * 8,
        size: 7,
        font,
        color: ink,
      });
    });
    x += widths[index];
  });
}

function drawSectionTitle(page: PDFPage, bold: PDFFont, y: number, text: string): number {
  page.drawText(text, { x: MARGIN, y, size: 11, font: bold, color: ink });
  return y - 16;
}

function drawText(page: PDFPage, font: PDFFont, y: number, text: string, size = 8): number {
  page.drawText(winAnsi(text), { x: MARGIN, y, size, font, color: ink });
  return y - size - 4;
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  y: number,
  text: string,
  size: number,
  width: number,
): number {
  const lines = wrapText(font, text, width, size);
  lines.forEach((line) => {
    page.drawText(line, { x: MARGIN, y, size, font, color: ink });
    y -= size + 3;
  });
  return y;
}

function wrapText(font: PDFFont, text: string, width: number, size: number): string[] {
  const safe = winAnsi(text || " ");
  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [" "];
}

function wrappedHeight(font: PDFFont, text: string, width: number, size: number): number {
  return Math.max(18, wrapText(font, text, width, size).length * (size + 3) + 6);
}

function drawFooters(pdf: PDFDocument, font: PDFFont): void {
  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawText("Relatório automatizado para apoio à revisão acadêmica. Não representa decisão oficial.", {
      x: MARGIN,
      y: 16,
      size: 7,
      font,
      color: rgb(0.39, 0.45, 0.55),
    });
    page.drawText(`Página ${index + 1}`, {
      x: PAGE_WIDTH - MARGIN - 50,
      y: 16,
      size: 7,
      font,
      color: rgb(0.39, 0.45, 0.55),
    });
  });
}

const ink = rgb(0.11, 0.1, 0.09);

function winAnsi(value: string): string {
  return value.replace(/[^\x20-\x7EÀ-ÿºª€]/g, (char) => {
    const map: Record<string, string> = {
      "—": "-",
      "–": "-",
      "“": '"',
      "”": '"',
      "‘": "'",
      "’": "'",
    };
    return map[char] ?? char.normalize("NFKD").replace(/\p{M}/gu, "");
  });
}
