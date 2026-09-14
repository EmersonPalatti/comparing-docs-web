import assert from "node:assert/strict";
import { test } from "node:test";
import { reconstructPdfGrid, reconstructPdfText } from "./pdf-layout.ts";
import { parseGrid } from "./tables.ts";

function item(str: string, x: number, y: number, width = 40, height = 10) {
  return { str, width, height, transform: [1, 0, 0, 1, x, y] };
}

test("pdf items on the same line become columns by x gap", () => {
  const items = [
    item("Código", 20, 700, 50),
    item("Disciplina", 90, 700, 80),
    item("CH", 260, 700, 20),
    item("Situação", 320, 700, 50),
    item("BIO101", 20, 680, 50),
    item("Biologia Celular", 90, 680, 90),
    item("60", 260, 680, 20),
    item("Aprovado", 320, 680, 50),
    item("BIO102", 20, 660, 50),
    item("Histologia", 90, 660, 70),
    item("80", 260, 660, 20),
    item("A cursar", 320, 660, 50),
  ];
  const grid = reconstructPdfGrid(items);
  assert.ok(grid[0].length >= 3);
  assert.ok(reconstructPdfText(items).includes("|"));
  const subjects = parseGrid(grid, "historico.pdf");
  assert.equal(subjects.length, 2);
  assert.equal(subjects[0].name, "Biologia Celular");
  assert.equal(subjects[0].workloadHours, 60);
  assert.equal(subjects[0].code, "BIO101");
  assert.equal(subjects[1].status, "A cursar");
});

test("single-column pdf text stays readable without fake columns", () => {
  const items = [
    item("Disciplina: Anatomia Humana - 80h", 72, 700, 240),
    item("Ementa: sistemas organicos e ossos", 72, 684, 220),
  ];
  const grid = reconstructPdfGrid(items);
  assert.equal(grid.length, 2);
  assert.equal(grid[0].length, 1);
  assert.ok(reconstructPdfText(items).includes("Anatomia"));
});
