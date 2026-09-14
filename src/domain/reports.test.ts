import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { createSubject } from "./models.ts";
import { generateSelectedPdfReport, workloadDifference, finalReviewReportToXlsx } from "./reports.ts";
import { matchesToRows } from "./rows.ts";

async function sheetRecords(bytes: Uint8Array, name: string): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as never);
  const sheet = workbook.getWorksheet(name);
  assert.ok(sheet, `missing sheet ${name}`);
  const headers: string[] = [];
  const records: Record<string, string>[] = [];
  sheet.eachRow((row, index) => {
    const values = (Array.isArray(row.values) ? row.values.slice(1) : []).map((value) =>
      value == null ? "" : String(value),
    );
    if (index === 1) {
      headers.push(...values);
      return;
    }
    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = values[headerIndex] ?? "";
    });
    records.push(record);
  });
  return records;
}

test("workload difference formats values", () => {
  assert.equal(workloadDifference(80, 100), "-20h");
  assert.equal(workloadDifference(100, 80), "+20h");
  assert.equal(workloadDifference(80, 80), "0h");
  assert.equal(workloadDifference(null, 80), "Não calculada");
});

test("selected xlsx report creates expected sheets", async () => {
  const selected = matchesToRows([
    {
      previousSubject: createSubject({
        name: "Bioquimica Metabolica",
        sourceDocument: "previous.pdf",
        workloadHours: 80,
      }),
      currentSubject: createSubject({
        name: "Bioquimica Geral",
        sourceDocument: "current.pdf",
        workloadHours: 80,
      }),
      semanticSimilarity: 0.8,
      nameSimilarity: 0.75,
      workloadScore: 1,
      creditScore: null,
      finalScore: 0.8213,
      classification: "likely_equivalency",
      requiresManualReview: true,
      justification: null,
    },
  ]);
  selected[0].selected = true;
  selected[0].reviewerNote = "Enviar para análise.";
  const bytes = await finalReviewReportToXlsx(
    selected,
    [
      createSubject({ name: "Bioquimica Metabolica", sourceDocument: "previous.pdf", workloadHours: 80 }),
      createSubject({ name: "Farmacologia Geral", sourceDocument: "previous.pdf", workloadHours: 80 }),
    ],
    [
      createSubject({ name: "Bioquimica Geral", sourceDocument: "current.pdf", workloadHours: 80 }),
      createSubject({ name: "Hematologia Básica", sourceDocument: "current.pdf", workloadHours: 80 }),
    ],
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as never);
  assert.deepEqual(
    new Set(workbook.worksheets.map((sheet) => sheet.name)),
    new Set(["matches_selecionados", "anteriores_sem_match", "atuais_nao_usadas"]),
  );
  const selectedSheet = await sheetRecords(bytes, "matches_selecionados");
  assert.equal(selectedSheet[0]["Observação do revisor"], "Enviar para análise.");
  const previous = await sheetRecords(bytes, "anteriores_sem_match");
  const current = await sheetRecords(bytes, "atuais_nao_usadas");
  assert.equal(previous[0].Disciplina, "Farmacologia Geral");
  assert.equal(current[0].Disciplina, "Hematologia Básica");
});

test("xlsx report sanitizes selected and unmatched text", async () => {
  const selected = matchesToRows([
    {
      previousSubject: createSubject({
        name: "Disciplina Segura",
        sourceDocument: "previous.pdf",
        workloadHours: 80,
      }),
      currentSubject: createSubject({
        name: "Atual Segura",
        sourceDocument: "current.pdf",
        workloadHours: 80,
      }),
      semanticSimilarity: 0.8,
      nameSimilarity: 0.75,
      workloadScore: 1,
      creditScore: null,
      finalScore: 0.8213,
      classification: "likely_equivalency",
      requiresManualReview: true,
      justification: null,
    },
  ]);
  selected[0].selected = true;
  selected[0].reviewerNote = "@SUM(A1:A2)";
  const bytes = await finalReviewReportToXlsx(
    selected,
    [createSubject({ name: "-1+2", sourceDocument: "=prev.pdf", workloadHours: 80 })],
    [createSubject({ name: "+cmd", sourceDocument: "@curr.pdf", workloadHours: 80 })],
  );
  const selectedSheet = await sheetRecords(bytes, "matches_selecionados");
  const previous = await sheetRecords(bytes, "anteriores_sem_match");
  const current = await sheetRecords(bytes, "atuais_nao_usadas");
  assert.equal(selectedSheet[0]["Observação do revisor"], "'@SUM(A1:A2)");
  assert.equal(previous[0].Disciplina, "'-1+2");
  assert.equal(previous[0]["Documento fonte"], "'=prev.pdf");
  assert.equal(current[0].Disciplina, "'+cmd");
});

test("pdf report returns pdf bytes", async () => {
  const selected = matchesToRows([
    {
      previousSubject: createSubject({
        name: "Bioquimica Metabolica",
        sourceDocument: "previous.pdf",
        workloadHours: 80,
      }),
      currentSubject: createSubject({
        name: "Bioquimica Geral",
        sourceDocument: "current.pdf",
        workloadHours: 80,
      }),
      semanticSimilarity: 0.8,
      nameSimilarity: 0.75,
      workloadScore: 1,
      creditScore: null,
      finalScore: 0.8213,
      classification: "likely_equivalency",
      requiresManualReview: true,
      justification: null,
    },
  ]);
  selected[0].selected = true;
  selected[0].reviewerNote = "Enviar para análise.";
  const pdf = await generateSelectedPdfReport(
    selected,
    [createSubject({ name: "Bioquimica Metabolica", sourceDocument: "previous.pdf", workloadHours: 80 })],
    [createSubject({ name: "Bioquimica Geral", sourceDocument: "current.pdf", workloadHours: 80 })],
    "previous.pdf",
    "current.pdf",
  );
  assert.ok(Buffer.from(pdf.subarray(0, 4)).toString() === "%PDF");
  assert.ok(pdf.byteLength > 1000);
});

test("pdf report handles empty selection", async () => {
  const pdf = await generateSelectedPdfReport([], [], []);
  assert.ok(Buffer.from(pdf.subarray(0, 4)).toString() === "%PDF");
});
