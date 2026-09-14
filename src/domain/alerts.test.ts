import assert from "node:assert/strict";
import { test } from "node:test";
import { matchAlerts, matchPriority } from "./alerts.ts";
import { createSubject, type SubjectMatch } from "./models.ts";
import { matchesToRows, sanitizeSpreadsheetCell, subjectsWithoutSelectedMatch } from "./rows.ts";

function match(partial: Partial<SubjectMatch> & Pick<SubjectMatch, "previousSubject" | "currentSubject">): SubjectMatch {
  return {
    semanticSimilarity: 0.8,
    nameSimilarity: 0.75,
    workloadScore: 1,
    creditScore: null,
    finalScore: 0.8213,
    classification: "likely_equivalency",
    requiresManualReview: true,
    justification: null,
    ...partial,
  };
}

test("summary row formats final score as percent", () => {
  const row = matchesToRows([
    match({
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
    }),
  ])[0];
  assert.equal(row.selected, false);
  assert.equal(row.equivalencyPercent, "82.13%");
  assert.equal(row.workloadScoreLabel, "1.00");
  assert.equal(row.classificationLabel, "Provável equivalência, revisar manualmente");
  assert.equal(row.manualReviewLabel, "Sim");
  assert.equal(row.priority, "Alta");
  assert.ok(row.alerts.includes("Revisar escopo"));
});

test("alerts detect similar name with lower workload", () => {
  const item = match({
    previousSubject: createSubject({
      name: "Anatomia Humana",
      sourceDocument: "previous.pdf",
      workloadHours: 80,
    }),
    currentSubject: createSubject({
      name: "Anatomia Humana",
      sourceDocument: "current.pdf",
      workloadHours: 100,
    }),
    semanticSimilarity: 0.7,
    nameSimilarity: 1,
    workloadScore: 0.8,
    finalScore: 0.76,
  });
  assert.ok(matchAlerts(item).includes("Nome muito similar e carga menor"));
  assert.ok(matchAlerts(item).includes("Carga um pouco menor"));
  assert.equal(matchPriority(item), "Alta");
});

test("alerts detect missing workload and low score", () => {
  const item = match({
    previousSubject: createSubject({ name: "Comunicacao Empresarial", sourceDocument: "previous.pdf" }),
    currentSubject: createSubject({
      name: "Calculo Diferencial",
      sourceDocument: "current.pdf",
      workloadHours: 80,
    }),
    semanticSimilarity: 0.1,
    nameSimilarity: 0.1,
    workloadScore: null,
    finalScore: 0.25,
    classification: "no_match",
  });
  assert.ok(matchAlerts(item).includes("Carga não identificada"));
  assert.ok(matchAlerts(item).includes("Sem match forte"));
  assert.equal(matchPriority(item), "Baixa");
});

test("sanitize spreadsheet cell blocks formula-like prefixes", () => {
  assert.equal(sanitizeSpreadsheetCell('=HYPERLINK("http://example.com")'), `'=HYPERLINK("http://example.com")`);
  assert.equal(sanitizeSpreadsheetCell("+cmd"), "'+cmd");
  assert.equal(sanitizeSpreadsheetCell("-1+2"), "'-1+2");
  assert.equal(sanitizeSpreadsheetCell("@SUM(A1:A2)"), "'@SUM(A1:A2)");
});

test("unmatched subjects exclude selected pairs", () => {
  const selected = matchesToRows([
    match({
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
    }),
  ]);
  selected[0].selected = true;
  const previous = subjectsWithoutSelectedMatch(
    [
      createSubject({ name: "Bioquimica Metabolica", sourceDocument: "previous.pdf", workloadHours: 80 }),
      createSubject({ name: "Farmacologia Geral", sourceDocument: "previous.pdf", workloadHours: 80 }),
    ],
    selected,
    "previous",
  );
  const current = subjectsWithoutSelectedMatch(
    [
      createSubject({ name: "Bioquimica Geral", sourceDocument: "current.pdf", workloadHours: 80 }),
      createSubject({ name: "Hematologia Básica", sourceDocument: "current.pdf", workloadHours: 80 }),
    ],
    selected,
    "current",
  );
  assert.equal(previous[0].name, "Farmacologia Geral");
  assert.equal(current[0].name, "Hematologia Básica");
});
