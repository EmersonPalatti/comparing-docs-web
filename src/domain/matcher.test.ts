import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, matchSubjects, nameSimilarity, workloadCompatibility } from "./matcher.ts";
import { createSubject } from "./models.ts";
import { normalizeSubjects } from "./normalizer.ts";

function makeSubject(
  name: string,
  workload: number | null = null,
  syllabus: string | null = null,
  extra: Partial<Parameters<typeof createSubject>[0]> = {},
) {
  return normalizeSubjects([
    createSubject({ name, sourceDocument: "test", workloadHours: workload, syllabus, ...extra }),
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

test("workload below 75 percent cannot be strong", () => {
  const previous = makeSubject("Anatomia Humana", 50, "sistemas organicos ossos musculos");
  const current = makeSubject("Anatomia Humana", 80, "sistemas organicos ossos musculos");
  const match = matchSubjects([previous], [current], 1)[0];
  assert.notEqual(match.classification, "strong_equivalency");
});

test("workload below 60 percent cannot be likely", () => {
  const previous = makeSubject("Banco de Dados", 40, "modelo relacional, SQL basico");
  const current = makeSubject(
    "Banco de Dados Avancado",
    80,
    "modelagem relacional, SQL avancado, otimizacao, transacoes, indices",
  );
  const match = matchSubjects([previous], [current], 1)[0];
  assert.ok(["partial_similarity", "no_match"].includes(match.classification));
});

test("no match sample", () => {
  const previous = makeSubject("Comunicacao Empresarial", 40);
  const current = makeSubject("Calculo Diferencial e Integral", 80);
  const match = matchSubjects([previous], [current], 1)[0];
  assert.equal(match.classification, "no_match");
});

test("same code is a strong pair even if names differ", () => {
  const previous = makeSubject("Histologia dos tecidos", 80, "tecidos epitelial e conjuntivo", {
    code: "BIO-101",
  });
  const current = makeSubject("Histologia I", 80, "tecidos epitelial, conjuntivo e muscular", {
    code: "bio 101",
  });
  const match = matchSubjects([previous], [current], 1)[0];
  assert.equal(match.codeMatch, true);
  assert.ok(["strong_equivalency", "likely_equivalency"].includes(match.classification));
  assert.ok((match.justification || "").includes("códigos coincidem"));
});

test("Calculo I versus Calculo II is not strong", () => {
  const previous = makeSubject("Calculo I", 80, "limites e derivadas");
  const current = makeSubject("Calculo II", 80, "integrais e series");
  const match = matchSubjects([previous], [current], 1)[0];
  assert.notEqual(match.classification, "strong_equivalency");
  assert.notEqual(match.classification, "likely_equivalency");
  assert.equal(match.levelConflict, true);
  assert.equal(match.requiresManualReview, true);
});

test("introducao versus avancado is capped", () => {
  const previous = makeSubject("Introducao a Programacao", 80, "variaveis, funcoes e control flow");
  const current = makeSubject("Programacao Avancada", 80, "variaveis, funcoes, padroes e otimizacao");
  const match = matchSubjects([previous], [current], 1)[0];
  assert.ok(["partial_similarity", "no_match"].includes(match.classification));
  assert.equal(match.levelConflict, true);
});

test("reordered subject names still score high", () => {
  const previous = makeSubject("Calculo Diferencial e Integral", 80);
  const current = makeSubject("Integral e Diferencial", 80);
  assert.ok(nameSimilarity(previous, current) >= 0.7);
});

test("a cursar origin is not uniquely assigned", () => {
  const previous = makeSubject("Biologia Celular", 60, "organelas e membrana", {
    code: "BIO102",
    status: "A cursar",
  });
  const current = makeSubject("Biologia Celular", 60, "organelas e membrana", { code: "BIO102" });
  const match = matchSubjects([previous], [current], 1)[0];
  assert.equal(match.blockedStatus, true);
  assert.equal(match.assignedUnique, false);
  assert.equal(match.requiresManualReview, true);
  assert.ok((match.justification || "").toLowerCase().includes("não foi cumprida"));
});

test("approved origin with same code can be unique", () => {
  const previous = makeSubject("Biologia Celular", 60, "organelas e membrana", {
    code: "BIO102",
    status: "Aprovado",
  });
  const current = makeSubject("Biologia Celular", 60, "organelas e membrana", { code: "BIO102" });
  const match = matchSubjects([previous], [current], 1)[0];
  assert.equal(match.blockedStatus, false);
  assert.equal(match.assignedUnique, true);
});

test("missing syllabus falls back to name and hours", () => {
  const previous = makeSubject("Anatomia Humana", 80);
  const current = makeSubject("Anatomia Humana", 80);
  const match = matchSubjects([previous], [current], 1)[0];
  assert.ok(["strong_equivalency", "likely_equivalency"].includes(match.classification));
  assert.equal(match.requiresManualReview, false);
});

test("bioquimica with overlapping syllabus stays likely or strong", () => {
  const previous = makeSubject(
    "Bioquimica Metabolica",
    80,
    "enzimas, vias metabolicas, metabolismo energetico e bioenergetica celular",
  );
  const current = makeSubject(
    "Bioquimica Geral",
    80,
    "enzimas, vias metabolicas, bioenergetica e integracao do metabolismo",
  );
  const match = matchSubjects([previous], [current], 1)[0];
  assert.ok(["strong_equivalency", "likely_equivalency"].includes(match.classification));
});

test("hungarian assigns globally instead of greedy", () => {
  const previous = [
    makeSubject("Analise Combinatoria", 80, "contagem, permutacao, combinacao e probabilidade discreta"),
    makeSubject("Probabilidade Aplicada", 80, "variaveis aleatorias, distribuicoes e esperanca"),
  ];
  const current = [
    makeSubject("Probabilidade e Estatistica", 80, "variaveis aleatorias, distribuicoes e esperanca matematica"),
    makeSubject("Matematica Discreta", 80, "contagem, permutacao, combinacao e grafos"),
  ];
  const matches = matchSubjects(previous, current, 3);
  const unique = matches.filter((item) => item.assignedUnique);
  assert.equal(unique.length, 2);
  const dests = new Set(unique.map((item) => item.currentSubject.name));
  assert.equal(dests.size, 2);
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
  const unique = matches.filter((item) => item.assignedUnique);
  const uniqueCurrents = new Set(unique.map((item) => item.currentSubject.name));
  assert.equal(uniqueCurrents.size, unique.length);
  assert.ok(unique.some((item) => item.currentSubject.name === "Anatomia Humana"));
  assert.ok(unique.every((item) => item.currentSubject.name !== "Calculo I"));
});
