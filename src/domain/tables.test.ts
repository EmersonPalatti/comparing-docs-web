import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { loadDocument } from "./extract.ts";
import { parseSubjects } from "./parser.ts";
import { detectDelimiter, mergeSubjectLists, parseDelimited, parseGrid, periodBanner } from "./tables.ts";
import { createSubject } from "./models.ts";
import { normalizeSubjects } from "./normalizer.ts";

const MATRIZ_GRID = [
  ["UNIVERSIDADE EXEMPLO", "", "", "", "", ""],
  ["Curso de Enfermagem — Matriz Curricular 2024", "", "", "", "", ""],
  ["1º Período", "", "", "", "", ""],
  ["Código", "Disciplina", "CH Teórica", "CH Prática", "Total da CH", "Ementa"],
  ["ENF101", "Anatomia Humana", "60", "20", "80", "sistemas organicos, ossos e musculos"],
  ["ENF102", "Histologia", "40", "20", "60", "tecidos epitelial e conjuntivo"],
  ["Totais", "", "100", "40", "140", ""],
  ["2º Período", "", "", "", "", ""],
  ["Código", "Disciplina", "CH Teórica", "CH Prática", "Total da CH", "Ementa"],
  ["ENF201", "Farmacologia Geral", "80", "0", "80", "dose-resposta, receptores e efeitos adversos"],
];

test("parseGrid reads period blocks, theory+practice hours and skips totals", () => {
  const subjects = parseGrid(MATRIZ_GRID, "matriz.xlsx");
  assert.deepEqual(
    subjects.map((subject) => subject.name),
    ["Anatomia Humana", "Histologia", "Farmacologia Geral"],
  );
  assert.deepEqual(
    subjects.map((subject) => subject.workloadHours),
    [80, 60, 80],
  );
  assert.deepEqual(
    subjects.map((subject) => subject.semester),
    ["1º período", "1º período", "2º período"],
  );
  assert.equal(subjects[0].code, "ENF101");
  assert.ok(subjects[0].syllabus?.includes("ossos"));
});

test("two-row CH teórica/prática header is merged", () => {
  const grid = [
    ["Disciplina", "Carga Horária", "", "", "Ementa"],
    ["", "Teórica", "Prática", "Total", ""],
    ["Calculo I", "80", "0", "80", "limites e derivadas"],
    ["Algebra Linear", "40", "20", "60", "matrizes e vetores"],
  ];
  const subjects = parseGrid(grid, "matriz.xlsx");
  assert.equal(subjects.length, 2);
  assert.equal(subjects[0].name, "Calculo I");
  assert.equal(subjects[0].workloadHours, 80);
  assert.equal(subjects[1].workloadHours, 60);
  assert.ok(subjects[0].syllabus?.includes("limites"));
});

test("quoted CSV ementa with commas stays in one field", () => {
  const text = `disciplina,carga horaria,ementa
Calculo I,80,"limites, derivadas e integrais"
Algebra Linear,60h,"matrizes, vetores, espacos"
`;
  const subjects = parseSubjects(text, "matriz.csv");
  assert.equal(subjects.length, 2);
  assert.equal(subjects[0].syllabus, "limites, derivadas e integrais");
  assert.equal(subjects[1].workloadHours, 60);
});

test("semicolon CSV from Brazilian Excel is detected", () => {
  const text = `Componente Curricular;C.H.;Ementa
Anatomia Humana;80;sistemas organicos
Histologia;60;tecidos
`;
  assert.equal(detectDelimiter(text), ";");
  const subjects = parseGrid(parseDelimited(text), "matriz.csv");
  assert.equal(subjects.length, 2);
  assert.equal(subjects[0].name, "Anatomia Humana");
  assert.equal(subjects[0].workloadHours, 80);
});

test("ementario sheet merges onto matriz by code", () => {
  const matriz = parseGrid(
    [
      ["Código", "Disciplina", "CH"],
      ["MAT101", "Calculo I", "80"],
      ["MAT102", "Algebra Linear", "60"],
    ],
    "matriz.xlsx#Matriz",
  );
  const ementario = parseGrid(
    [
      ["Código", "Ementa"],
      ["MAT101", "limites, derivadas e integrais"],
      ["MAT102", "matrizes e vetores"],
    ],
    "matriz.xlsx#Ementario",
  );
  const merged = mergeSubjectLists([matriz, ementario]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].name, "Calculo I");
  assert.equal(merged[0].workloadHours, 80);
  assert.ok(merged[0].syllabus?.includes("limites"));
});

test("realistic xlsx with title, merged period and two sheets is read by loadDocument", async () => {
  const workbook = new ExcelJS.Workbook();
  const matriz = workbook.addWorksheet("Matriz");
  matriz.addRow(["UNIVERSIDADE EXEMPLO — Matriz Curricular"]);
  matriz.mergeCells("A1:F1");
  matriz.addRow(["1º Período"]);
  matriz.mergeCells("A2:F2");
  matriz.addRow(["Código", "Disciplina", "CH Teórica", "CH Prática", "Total da CH", "Pré-requisito"]);
  matriz.addRow(["ENF101", "Anatomia Humana", 60, 20, 80, "—"]);
  matriz.addRow(["ENF102", "Histologia", 40, 20, 60, "ENF101"]);
  matriz.addRow(["Totais", "", 100, 40, 140, ""]);
  matriz.addRow(["2º Período"]);
  matriz.mergeCells("A7:F7");
  matriz.addRow(["Código", "Disciplina", "CH Teórica", "CH Prática", "Total da CH", "Pré-requisito"]);
  matriz.addRow(["ENF201", "Farmacologia Geral", 80, 0, 80, "ENF101"]);

  const ementas = workbook.addWorksheet("Ementário");
  ementas.addRow(["Código", "Ementa"]);
  ementas.addRow(["ENF101", "sistemas organicos, ossos, musculos e introducao a disseccao"]);
  ementas.addRow(["ENF201", "relacao dose-resposta, receptores e efeitos adversos"]);

  const buffer = await workbook.xlsx.writeBuffer();
  const document = await loadDocument(
    { name: "matriz-destino.xlsx", bytes: new Uint8Array(buffer) },
    "matriz-destino.xlsx",
  );
  assert.ok(document.subjects);
  assert.equal(document.subjects.length, 3);
  const anatomy = document.subjects.find((subject) => subject.code === "ENF101");
  assert.ok(anatomy);
  assert.equal(anatomy.workloadHours, 80);
  assert.ok(anatomy.syllabus?.includes("ossos"));
  assert.equal(anatomy.semester, "1º período");
  assert.ok((document.notes ?? []).some((note) => /Ementário|combinadas/i.test(note)));
});

test("periodBanner reads numbered and roman headers", () => {
  assert.equal(periodBanner(["1º Período", "", ""]), "1º período");
  assert.equal(periodBanner(["2o Semestre"]), "2º semestre");
  assert.equal(periodBanner(["I"]), "I");
  assert.equal(periodBanner(["Anatomia Humana", "80"]), null);
});

test("hours without total column sum theory and practice", () => {
  const subjects = parseGrid(
    [
      ["Disciplina", "CH Teórica", "CH Prática", "CH EAD"],
      ["Vida e Carreira", "80", "40", "0"],
    ],
    "matriz.xlsx",
  );
  assert.equal(subjects[0].workloadHours, 120);
});

test("merge prefers the longer real name over a code-as-name", () => {
  const merged = mergeSubjectLists([
    normalizeSubjects([
      createSubject({ name: "MAT101", sourceDocument: "a", code: "MAT101", syllabus: "limites" }),
    ]),
    normalizeSubjects([
      createSubject({ name: "Calculo I", sourceDocument: "b", code: "MAT101", workloadHours: 80 }),
    ]),
  ]);
  assert.equal(merged[0].name, "Calculo I");
  assert.equal(merged[0].workloadHours, 80);
  assert.equal(merged[0].syllabus, "limites");
});
