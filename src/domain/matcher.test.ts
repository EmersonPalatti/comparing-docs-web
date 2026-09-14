import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, matchSubjects, workloadCompatibility } from "./matcher.ts";
import { createSubject } from "./models.ts";
import { normalizeSubjects } from "./normalizer.ts";

function makeSubject(name: string, workload: number | null = null, syllabus: string | null = null) {
  return normalizeSubjects([
    createSubject({ name, sourceDocument: "test", workloadHours: workload, syllabus }),
  ])[0];
}

test("workload compatibility rules", () => {
  assert.equal(workloadCompatibility(80, 80), 1);
  assert.equal(workloadCompatibility(70, 80), 0.8);
  assert.equal(workloadCompatibility(50, 80), 0.5);
  assert.equal(workloadCompatibility(30, 80), 0.2);
  assert.equal(workloadCompatibility(null, 80), null);
});

test("classification thresholds", () => {
  assert.equal(classify(0.85), "strong_equivalency");
  assert.equal(classify(0.7), "likely_equivalency");
  assert.equal(classify(0.5), "partial_similarity");
  assert.equal(classify(0.49), "no_match");
});

test("strong match sample", () => {
  const previous = makeSubject(
    "Estatistica Descritiva",
    80,
    "medidas de tendencia central, dispersao, graficos, distribuicao de frequencia",
  );
  const current = makeSubject(
    "Estatistica I",
    80,
    "estatistica descritiva, media, mediana, variancia, desvio padrao e graficos",
  );
  const match = matchSubjects([previous], [current], 1)[0];
  assert.ok(["strong_equivalency", "likely_equivalency"].includes(match.classification));
  assert.equal(match.workloadScore, 1);
});

test("similar name with much lower workload is not strong", () => {
  const previous = makeSubject("Banco de Dados", 40, "modelo relacional, SQL basico");
  const current = makeSubject(
    "Banco de Dados Avancado",
    80,
    "modelagem relacional, SQL avancado, otimizacao, transacoes, indices",
  );
  const match = matchSubjects([previous], [current], 1)[0];
  assert.ok(["partial_similarity", "likely_equivalency", "no_match"].includes(match.classification));
  assert.notEqual(match.classification, "strong_equivalency");
  assert.equal(match.requiresManualReview, true);
});

test("no match sample", () => {
  const previous = makeSubject("Comunicacao Empresarial", 40);
  const current = makeSubject("Calculo Diferencial e Integral", 80);
  const match = matchSubjects([previous], [current], 1)[0];
  assert.equal(match.classification, "no_match");
});

test("best pairs mark unique assignment and shared destination", () => {
  const previous = [
    makeSubject("Anatomia Humana", 80, "sistemas organicos ossos musculos"),
    makeSubject("Anatomia Topografica", 80, "sistemas organicos ossos musculos disseccao"),
    makeSubject("Comunicacao Empresarial", 40, "redacao corporativa"),
  ];
  const current = [
    makeSubject("Anatomia Humana", 80, "sistemas organicos ossos musculos"),
    makeSubject("Calculo I", 80, "limites derivadas integrais"),
  ];
  const matches = matchSubjects(previous, current, 3);
  const best = matches.filter((item) => item.rank === 1);
  assert.equal(best.length, 3);
  const anatomy = best.filter((item) => item.currentSubject.name === "Anatomia Humana");
  assert.ok(anatomy.length >= 2);
  assert.ok(anatomy.every((item) => item.destinationConflict));
  const unique = matches.filter((item) => item.assignedUnique);
  const uniqueCurrents = new Set(unique.map((item) => item.currentSubject.name));
  assert.equal(uniqueCurrents.size, unique.length);
  assert.ok(unique.some((item) => item.currentSubject.name === "Anatomia Humana"));
});
