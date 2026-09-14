import assert from "node:assert/strict";
import { test } from "node:test";
import { meaningfulTokens, tokenOverlapSimilarity } from "./embeddings.ts";
import { createSubject } from "./models.ts";
import { normalizeSubjects } from "./normalizer.ts";

function subject(name: string) {
  return normalizeSubjects([createSubject({ name, sourceDocument: "t" })])[0];
}

test("roman numerals stay as tokens", () => {
  assert.ok(meaningfulTokens("Calculo I").has("i"));
  assert.ok(meaningfulTokens("Calculo II").has("ii"));
  assert.equal(meaningfulTokens("Calculo I").has("calculo"), true);
});

test("Calculo I does not collapse into Calculo II", () => {
  const same = tokenOverlapSimilarity(subject("Calculo I"), subject("Calculo I"));
  const other = tokenOverlapSimilarity(subject("Calculo I"), subject("Calculo II"));
  assert.ok(same > 0.7);
  assert.ok(other < 0.5);
  assert.ok(same > other);
});
