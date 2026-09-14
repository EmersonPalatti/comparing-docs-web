import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { MAX_SUBJECTS, MAX_UPLOAD_BYTES } from "./config.ts";
import {
  assertSafeUpload,
  cellDisplayValue,
  extensionOf,
  extractTextFromSpreadsheet,
  loadDocument,
  PDF_LOAD_OPTIONS,
  readBinary,
  TextExtractionError,
} from "./extract.ts";
import { parseSubjects } from "./parser.ts";
import { finalReviewReportToXlsx } from "./reports.ts";
import { matchesToRows, sanitizeFilename, sanitizeSpreadsheetCell } from "./rows.ts";
import { createSubject } from "./models.ts";

test("pdf parser disables JS eval", () => {
  assert.equal(PDF_LOAD_OPTIONS.isEvalSupported, false);
});

test("formula cells expose cached result, never the formula text", () => {
  assert.equal(cellDisplayValue({ formula: 'HYPERLINK("http://evil","x")', result: "Calculo II" }), "Calculo II");
  assert.equal(cellDisplayValue({ formula: "1+1" }), "");
});

test("sanitize spreadsheet cell blocks formula and control prefixes", () => {
  assert.equal(sanitizeSpreadsheetCell('=HYPERLINK("http://evil")'), `'=HYPERLINK("http://evil")`);
  assert.equal(sanitizeSpreadsheetCell("+cmd|'/C calc'!A0"), "'+cmd|'/C calc'!A0");
  assert.equal(sanitizeSpreadsheetCell("-1+2"), "'-1+2");
  assert.equal(sanitizeSpreadsheetCell("@SUM(A1:A2)"), "'@SUM(A1:A2)");
  assert.equal(sanitizeSpreadsheetCell("\t=cmd|'cmd'!A0"), "'=cmd|'cmd'!A0");
  assert.equal(sanitizeSpreadsheetCell("\r\n=1+2"), "'=1+2");
  assert.equal(sanitizeSpreadsheetCell("  =CMD"), "'=CMD");
  assert.equal(sanitizeSpreadsheetCell("\uFEFF@SUM(1)"), "'@SUM(1)");
  assert.equal(sanitizeSpreadsheetCell("Bioquímica"), "Bioquímica");
});

test("exported xlsx keeps formula-like names as text", async () => {
  const selected = matchesToRows([
    {
      previousSubject: createSubject({
        name: '=HYPERLINK("http://evil")',
        sourceDocument: "previous.pdf",
        workloadHours: 80,
      }),
      currentSubject: createSubject({
        name: "+cmd",
        sourceDocument: "current.pdf",
        workloadHours: 80,
      }),
      semanticSimilarity: 0.8,
      nameSimilarity: 0.75,
      workloadScore: 1,
      creditScore: null,
      finalScore: 0.82,
      classification: "likely_equivalency",
      requiresManualReview: true,
      justification: "=1+2",
    },
  ]);
  selected[0].selected = true;
  selected[0].reviewerNote = "@SUM(A1)";
  const bytes = await finalReviewReportToXlsx(selected, [], []);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as never);
  const sheet = workbook.getWorksheet("matches_selecionados");
  assert.ok(sheet);
  const previous = String(sheet.getRow(2).getCell(2).value ?? "");
  const current = String(sheet.getRow(2).getCell(4).value ?? "");
  const note = String(sheet.getRow(2).getCell(12).value ?? "");
  assert.equal(previous, `'=HYPERLINK("http://evil")`);
  assert.equal(current, "'+cmd");
  assert.equal(note, "'@SUM(A1)");
});

test("spreadsheet extract ignores formula source text", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("grade");
  sheet.addRow(["disciplina", "ch"]);
  sheet.addRow(["Calculo", 80]);
  sheet.getCell("A3").value = { formula: 'HYPERLINK("http://evil","x")', result: "Algebra" };
  const buffer = await workbook.xlsx.writeBuffer();
  const text = await extractTextFromSpreadsheet(new Uint8Array(buffer), ".xlsx");
  assert.equal(text.includes("HYPERLINK"), false);
  assert.ok(text.includes("Algebra"));
});

test("sanitizeFilename blocks path traversal and reserved characters", () => {
  assert.equal(sanitizeFilename("../../etc/passwd"), "passwd");
  assert.equal(sanitizeFilename("relatorio:oficial*.xlsx"), "relatorio_oficial_.xlsx");
  assert.equal(sanitizeFilename(""), "arquivo");
  assert.equal(sanitizeFilename("..."), "arquivo");
});

test("readBinary rejects oversized uploads before parsing", () => {
  assert.throws(
    () => readBinary(new Uint8Array(MAX_UPLOAD_BYTES + 1)),
    (error: unknown) => error instanceof TextExtractionError && /tamanho máximo/.test(error.message),
  );
});

test("assertSafeUpload rejects unsupported extensions and magic mismatch", () => {
  assert.throws(
    () => assertSafeUpload("malware.exe", new Uint8Array([1, 2, 3])),
    TextExtractionError,
  );
  assert.throws(
    () => assertSafeUpload("falso.pdf", new TextEncoder().encode("<html><script>alert(1)</script>")),
    (error: unknown) => error instanceof TextExtractionError && /PDF/.test(error.message),
  );
  assert.throws(
    () => assertSafeUpload("falso.xlsx", new TextEncoder().encode("not-a-zip")),
    (error: unknown) => error instanceof TextExtractionError && /XLSX/.test(error.message),
  );
  assert.throws(
    () => assertSafeUpload("legado.xls", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])),
    (error: unknown) => error instanceof TextExtractionError && /\.xls/.test(error.message),
  );
  assert.doesNotThrow(() => assertSafeUpload("ok.pdf", new TextEncoder().encode("%PDF-1.7")));
  assert.doesNotThrow(() => assertSafeUpload("ok.xlsx", new Uint8Array([0x50, 0x4b, 0x03, 0x04])));
});

test("loadDocument rejects empty and unsupported files", async () => {
  await assert.rejects(
    () => loadDocument({ name: "vazio.txt", bytes: new Uint8Array() }, "vazio.txt"),
    (error: unknown) => error instanceof TextExtractionError && /vazio/.test(error.message),
  );
  await assert.rejects(
    () => loadDocument({ name: "payload.html", bytes: new TextEncoder().encode("<script>") }, "payload.html"),
    TextExtractionError,
  );
});

test("parseSubjects caps document size to prevent matcher exhaustion", () => {
  const lines = Array.from({ length: MAX_SUBJECTS + 1 }, (_, index) => `Disciplina ${index} - 40h`).join("\n");
  assert.throws(
    () => parseSubjects(lines, "overflow.txt"),
    (error: unknown) => error instanceof Error && /500 disciplinas/.test(error.message),
  );
});

test("extensionOf is case-insensitive and path-safe", () => {
  assert.equal(extensionOf("Histórico.PDF"), ".pdf");
  assert.equal(extensionOf("matriz"), "");
  assert.equal(extensionOf("a.b.XLSX"), ".xlsx");
});
