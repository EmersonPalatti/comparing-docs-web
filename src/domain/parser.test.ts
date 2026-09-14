import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeLines, parseSubjects } from "./parser.ts";
import { applyReview, subjectsToReview } from "./subjects.ts";

test("parse simple structured subjects", () => {
  const text = `
    Estatistica Descritiva - 80h
    Conteudo: medidas de tendencia central, dispersao, graficos.

    Banco de Dados - 40h
    Conteudo: modelo relacional, SQL basico.
  `;
  const subjects = parseSubjects(text, "sample.txt");
  assert.equal(subjects.length, 2);
  assert.equal(subjects[0].name, "Estatistica Descritiva");
  assert.equal(subjects[0].workloadHours, 80);
  assert.ok(subjects[0].syllabus?.includes("medidas"));
});

test("parse pdf extracted code table subjects", () => {
  const text = `
    Código Disciplina CH Período Nota Situação
    Anatomia e
    fundamentos de
    BIO101 Histologia 100h 1º - A cursar
    histologia dos
    Humana
    tecidos epitelial,
    Organização da
    célula
    BIO102 Biologia Celular 60h 1º - A cursar organelas,
    citoesqueleto,
    Química
    base, tampões,
    BIO103 Aplicada à 60h 1º - A cursar
    reações
    Saúde
    Conteúdo programático simplificado
  `;
  const subjects = parseSubjects(text, "pdf_sample.pdf");
  assert.deepEqual(
    subjects.map((subject) => subject.name),
    ["Anatomia e Histologia Humana", "Biologia Celular", "Química Aplicada à Saúde"],
  );
  assert.deepEqual(
    subjects.map((subject) => subject.workloadHours),
    [100, 60, 60],
  );
});

test("analyze lines marks codes and workloads", () => {
  const lines = analyzeLines("BIO102 Biologia Celular 60h 1º - A cursar organelas,");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].hasSubjectCode, true);
  assert.equal(lines[0].hasWorkload, true);
});

test("code table parser stops before program content section", () => {
  const text = `
    Farmacologia interações
    FAR401 80h 4º 8,0 Aprovado
    Geral medicamentosas
    Conteúdo programático simplificado
    Farmacologia Geral dose-resposta; receptores; efeitos adversos.
  `;
  const subjects = parseSubjects(text, "sample.pdf");
  assert.equal(subjects.length, 1);
  assert.equal(subjects[0].name, "Farmacologia Geral");
  assert.equal((subjects[0].rawText || "").includes("Conteúdo programático"), false);
});

test("review preserves hidden subject data", () => {
  const subjects = parseSubjects(
    "Disciplina: Bioquimica Metabolica - 80h\nConteudo: enzimas e metabolismo energetico.",
    "sample.txt",
  );
  const review = subjectsToReview(subjects);
  review[0] = { name: "Bioquimica Geral", workloadHours: 60 };
  const edited = applyReview(subjects, review, "fallback.txt");
  assert.equal(edited[0].name, "Bioquimica Geral");
  assert.equal(edited[0].workloadHours, 60);
  assert.ok((edited[0].syllabus || "").includes("enzimas"));
});

test("blank review rows are ignored and names are normalized", () => {
  const subjects = parseSubjects("Disciplina: Estat. Descritiva - 80h", "sample.txt");
  const review = [
    { name: "Estatística Descritiva", workloadHours: subjects[0].workloadHours },
    { name: "", workloadHours: null },
  ];
  const edited = applyReview(subjects, review, "fallback.txt");
  assert.equal(edited.length, 1);
  assert.equal(edited[0].name, "Estatística Descritiva");
  assert.equal(edited[0].normalizedName, "estatistica descritiva");
});

test("csv hours accept a bare number without h suffix", () => {
  const text = `disciplina,carga horaria,ementa
Calculo I,80,limites e derivadas
Algebra Linear,60h,matrizes e vetores
`;
  const subjects = parseSubjects(text, "matriz.csv");
  assert.equal(subjects.length, 2);
  assert.equal(subjects[0].workloadHours, 80);
  assert.equal(subjects[1].workloadHours, 60);
});

test("csv aliases accept componente curricular and carga horaria", () => {
  const text = `componente curricular,carga horaria,ementa
Anatomia Humana,80,sistemas organicos
`;
  const subjects = parseSubjects(text, "matriz.csv");
  assert.equal(subjects[0].name, "Anatomia Humana");
  assert.equal(subjects[0].workloadHours, 80);
});

