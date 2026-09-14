import assert from "node:assert/strict";
import { test } from "node:test";
import { codesMatch, normalizeCode } from "./codes.ts";
import { createSubject } from "./models.ts";
import { isCompletableOrigin, isCompletedStatus } from "./status.ts";
import { levelConflict } from "./levels.ts";
import { normalizeSubjects } from "./normalizer.ts";
import { jaroWinkler, tokenSetRatio } from "./sequence.ts";

test("normalizeCode ignores hyphen and case", () => {
  assert.equal(normalizeCode("BIO-101"), "BIO101");
  assert.equal(normalizeCode("bio 101"), "BIO101");
  assert.equal(normalizeCode("MAT.101"), "MAT101");
});

test("codesMatch does not expand mat as matematica", () => {
  const previous = createSubject({ name: "A", sourceDocument: "t", code: "MAT101" });
  const current = createSubject({ name: "B", sourceDocument: "t", code: "MAT-101" });
  assert.equal(codesMatch(previous, current), true);
  assert.equal(normalizeCode("MAT101").includes("MATEMATICA"), false);
});

test("status completed versus a cursar", () => {
  assert.equal(isCompletedStatus("Aprovado"), true);
  assert.equal(isCompletedStatus("aproveitada"), true);
  assert.equal(isCompletedStatus("A cursar"), false);
  assert.equal(isCompletedStatus("Reprovado"), false);
  assert.equal(isCompletedStatus(null), null);
  const pending = createSubject({ name: "X", sourceDocument: "t", status: "A cursar" });
  const done = createSubject({ name: "X", sourceDocument: "t", status: "Aprovado" });
  assert.equal(isCompletableOrigin(pending), false);
  assert.equal(isCompletableOrigin(done), true);
});

test("level conflict on roman numerals and intro vs advanced", () => {
  const calcI = normalizeSubjects([createSubject({ name: "Calculo I", sourceDocument: "t" })])[0];
  const calcII = normalizeSubjects([createSubject({ name: "Calculo II", sourceDocument: "t" })])[0];
  const intro = normalizeSubjects([createSubject({ name: "Introducao a Programacao", sourceDocument: "t" })])[0];
  const advanced = normalizeSubjects([createSubject({ name: "Programacao Avancada", sourceDocument: "t" })])[0];
  const stats = normalizeSubjects([createSubject({ name: "Estatistica Descritiva", sourceDocument: "t" })])[0];
  const statsI = normalizeSubjects([createSubject({ name: "Estatistica I", sourceDocument: "t" })])[0];
  assert.equal(levelConflict(calcI, calcII), true);
  assert.equal(levelConflict(intro, advanced), true);
  assert.equal(levelConflict(stats, statsI), false);
});

test("token set ratio handles reordered titles", () => {
  assert.ok(tokenSetRatio("calculo diferencial e integral", "integral e diferencial") > 0.7);
  assert.ok(jaroWinkler("calculo i", "calculo i") === 1);
  assert.ok(jaroWinkler("comunicacao empresarial", "calculo diferencial e integral") < 0.7);
});
