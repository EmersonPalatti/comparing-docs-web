import assert from "node:assert/strict";
import { test } from "node:test";
import { matchSubjects } from "./matcher.ts";
import { parseSubjects } from "./parser.ts";
import {
  SAMPLE_CURRENT,
  SAMPLE_CURRENT_CSV,
  SAMPLE_FILES,
  SAMPLE_PREVIOUS,
  SAMPLE_PREVIOUS_CSV,
  SAMPLE_PREVIOUS_TABLE,
} from "./samples.ts";

test("structured samples parse the expected subject counts", () => {
  const previous = parseSubjects(SAMPLE_PREVIOUS, "historico-origem.txt");
  const current = parseSubjects(SAMPLE_CURRENT, "matriz-destino.txt");
  assert.equal(previous.length, 10);
  assert.equal(current.length, 11);
  assert.equal(
    previous.find((subject) => subject.name === "Introducao a Saude Coletiva")?.workloadHours,
    null,
  );
});

test("csv samples parse the same subject names as the text kit", () => {
  const fromText = parseSubjects(SAMPLE_PREVIOUS, "historico-origem.txt").map((subject) => subject.name);
  const fromCsv = parseSubjects(SAMPLE_PREVIOUS_CSV, "historico-origem.csv").map((subject) => subject.name);
  assert.deepEqual(fromCsv, fromText);
  const currentText = parseSubjects(SAMPLE_CURRENT, "matriz-destino.txt").map((subject) => subject.name);
  const currentCsv = parseSubjects(SAMPLE_CURRENT_CSV, "matriz-destino.csv").map((subject) => subject.name);
  assert.deepEqual(currentCsv, currentText);
});

test("code table sample extracts named subjects with hours", () => {
  const subjects = parseSubjects(SAMPLE_PREVIOUS_TABLE, "historico-tabela.txt");
  assert.ok(subjects.length >= 8);
  assert.ok(subjects.some((subject) => subject.name.includes("Estatistica")));
  assert.ok(subjects.every((subject) => subject.workloadHours != null));
});

test("simulated pair covers strong or likely, manual review and no match", () => {
  const previous = parseSubjects(SAMPLE_PREVIOUS, "historico-origem.txt");
  const current = parseSubjects(SAMPLE_CURRENT, "matriz-destino.txt");
  const matches = matchSubjects(previous, current);
  const classes = new Set(matches.map((match) => match.classification));
  assert.ok(classes.has("strong_equivalency") || classes.has("likely_equivalency"));
  assert.ok(matches.some((match) => match.requiresManualReview));
  assert.ok(classes.has("no_match") || classes.has("partial_similarity"));
  const anatomy = matches.find((match) => match.previousSubject.name === "Anatomia Humana");
  assert.ok(anatomy);
  assert.ok(["strong_equivalency", "likely_equivalency"].includes(anatomy.classification));
  const stats = matches.find((match) => match.previousSubject.name === "Estatistica Descritiva");
  assert.ok(stats);
  assert.ok(["strong_equivalency", "likely_equivalency"].includes(stats.classification));
  const calc = matches.find((match) => match.previousSubject.name === "Comunicacao Empresarial");
  assert.ok(calc);
  assert.equal(calc.classification, "no_match");
});

test("sample kit exposes downloadable files", () => {
  assert.equal(SAMPLE_FILES.length, 5);
  assert.ok(SAMPLE_FILES.every((file) => file.content.trim().length > 40));
});
