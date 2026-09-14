import ExcelJS from "exceljs";
import { MAX_SPREADSHEET_COLUMNS, MAX_SPREADSHEET_ROWS } from "./config.ts";
import { cellDisplayValue, TextExtractionError } from "./extract-core.ts";
import { type Subject } from "./models.ts";
import { gridsToText, mergeSubjectLists, parseGrid } from "./tables.ts";

export type SpreadsheetExtraction = {
  subjects: Subject[];
  text: string;
  notes: string[];
};

export async function extractSpreadsheet(
  content: Uint8Array,
  sourceDocument: string,
  limits: { rows?: number; columns?: number } = {},
): Promise<SpreadsheetExtraction> {
  const maxRows = limits.rows ?? MAX_SPREADSHEET_ROWS;
  const maxColumns = limits.columns ?? MAX_SPREADSHEET_COLUMNS;
  const workbook = new ExcelJS.Workbook();
  const copy = new Uint8Array(content.byteLength);
  copy.set(content);
  try {
    await workbook.xlsx.load(copy as never);
  } catch {
    throw new TextExtractionError("O arquivo XLSX está corrompido ou não é uma planilha válida.");
  }

  const notes: string[] = [];
  const grids: string[][][] = [];
  const groups: Subject[][] = [];

  for (const sheet of workbook.worksheets) {
    if (sheet.state === "hidden" || sheet.state === "veryHidden") continue;
    const grid = sheetToGrid(sheet);
    if (!grid.length) continue;
    const dataRows = Math.max(0, grid.length - 1);
    const width = Math.max(...grid.map((row) => row.length), 0);
    if (dataRows > maxRows || width > maxColumns) {
      throw new TextExtractionError(
        `Limite de planilha excedido: máximo de ${maxRows} linhas e ${maxColumns} colunas por aba.`,
      );
    }
    const parsed = parseGrid(grid, `${sourceDocument}#${sheet.name}`);
    grids.push(grid);
    groups.push(parsed);
    if (parsed.length) {
      notes.push(`${parsed.length} disciplina(s) na aba “${sheet.name}”.`);
    } else {
      notes.push(`Aba “${sheet.name}” sem cabeçalho de disciplina reconhecido.`);
    }
  }

  if (!grids.length) {
    throw new TextExtractionError("O arquivo de planilha está vazio.");
  }

  const subjects = mergeSubjectLists(groups);
  if (subjects.length && groups.filter((group) => group.length).length > 1) {
    notes.push("Abas combinadas pelo código ou pelo nome da disciplina (matriz + ementário).");
  }

  return { subjects, text: gridsToText(grids), notes };
}

export function sheetToGrid(sheet: ExcelJS.Worksheet): string[][] {
  const rowCount = sheet.rowCount;
  const columnCount = Math.max(sheet.columnCount, 1);
  if (!rowCount) return [];
  const grid: string[][] = [];
  for (let rowNumber = 1; rowNumber <= rowCount; rowNumber += 1) {
    const row: string[] = [];
    for (let column = 1; column <= columnCount; column += 1) {
      const cell = sheet.getCell(rowNumber, column);
      const source = "isMerged" in cell && cell.isMerged ? cell.master : cell;
      row.push(cellDisplayValue(source.value));
    }
    if (row.some((cell) => cell.trim())) grid.push(row);
  }
  return grid;
}
