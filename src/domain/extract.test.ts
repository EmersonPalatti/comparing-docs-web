import assert from "node:assert/strict";
import { test } from "node:test";
import { extractTextFromSpreadsheet, extractTextFromTxt, loadDocument, readBinary, TextExtractionError } from "./extract.ts";
import { parseSubjects } from "./parser.ts";

test("readBinary rejects file above size limit", () => {
  assert.throws(
    () => readBinary(new Uint8Array([1, 2, 3, 4, 5]), 4),
    (error: unknown) => error instanceof TextExtractionError && /tamanho máximo/.test(error.message),
  );
});

test("loadDocument accepts file at exact size limit", async () => {
  const document = await loadDocument(
    { name: "arquivo.txt", bytes: new TextEncoder().encode("abcde") },
    "arquivo.txt",
  );
  assert.equal(document.text, "abcde");
  assert.equal(document.filename, "arquivo.txt");
});

test("extractTextFromSpreadsheet rejects above row limit", async () => {
  const csv = "col\n1\n2\n3\n";
  await assert.rejects(
    () => extractTextFromSpreadsheet(new TextEncoder().encode(csv), ".csv", { rows: 2, columns: 10 }),
    (error: unknown) => error instanceof TextExtractionError && /máximo de 2 linhas/.test(error.message),
  );
});

test("extractTextFromSpreadsheet accepts exact row and column limits", async () => {
  const csv = "a,b\n1,3\n2,4\n";
  const result = await extractTextFromSpreadsheet(new TextEncoder().encode(csv), ".csv", {
    rows: 2,
    columns: 2,
  });
  assert.ok(result.includes("a,b"));
  assert.ok(result.includes("1,3"));
});

test("extractTextFromTxt parses structured subjects", () => {
  const text = extractTextFromTxt(
    new TextEncoder().encode("Estatistica Descritiva - 80h\nConteudo: medidas de tendencia."),
  );
  const subjects = parseSubjects(text, "sample.txt");
  assert.equal(subjects[0].name, "Estatistica Descritiva");
});
