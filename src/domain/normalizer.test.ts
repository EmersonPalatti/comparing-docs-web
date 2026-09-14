import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeText } from "./normalizer.ts";

test("normalize_text removes accents and expands abbreviations", () => {
  assert.equal(normalizeText("Estat. Descritiva"), "estatistica descritiva");
  assert.equal(normalizeText("Mat. Aplicada"), "matematica aplicada");
});

test("normalize_text expands more academic abbreviations", () => {
  assert.equal(normalizeText("Calc. I"), "calculo i");
  assert.equal(normalizeText("Bioq. Metabolica"), "bioquimica metabolica");
});
