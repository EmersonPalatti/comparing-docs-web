import { normalizeText } from "./normalizer.ts";

export type ColumnRole =
  | "name"
  | "code"
  | "hours"
  | "hoursTheory"
  | "hoursPractice"
  | "hoursEad"
  | "hoursExtension"
  | "credits"
  | "syllabus"
  | "semester"
  | "status"
  | "grade"
  | "ignore";

export const HOUR_ROLES: ColumnRole[] = [
  "hours",
  "hoursTheory",
  "hoursPractice",
  "hoursEad",
  "hoursExtension",
];

const ROLE_ALIASES: Record<Exclude<ColumnRole, "ignore">, string[]> = {
  name: [
    "disciplina",
    "disciplinas",
    "nome",
    "nome da disciplina",
    "nome disciplina",
    "componente",
    "componente curricular",
    "unidade curricular",
    "atividade",
    "subject",
    "name",
    "denominacao",
    "descricao da disciplina",
    "componentes curriculares",
  ],
  code: ["codigo", "cod", "sigla", "code", "id", "codigo da disciplina", "codigo disciplina"],
  hours: [
    "ch",
    "cht",
    "carga",
    "carga horaria",
    "carga horaria total",
    "carga horaria semestral",
    "horas",
    "hora",
    "workload",
    "ch total",
    "ch semestral",
    "chh",
    "c h",
    "c/h",
    "total da ch",
    "total ch",
    "total c/h",
    "horas aula",
    "horas/aula",
    "h/a",
    "ch presencial",
  ],
  hoursTheory: ["ch teorica", "teorica", "carga teorica", "carga horaria teorica", "c/h teorica", "ch t"],
  hoursPractice: ["ch pratica", "pratica", "carga pratica", "carga horaria pratica", "c/h pratica", "ch p"],
  hoursEad: [
    "ch ead",
    "ead",
    "carga ead",
    "ch sincrono",
    "ch assincrono",
    "sincrona",
    "assincrona",
    "ch a distancia",
  ],
  hoursExtension: ["ch extensao", "extensao", "carga extensao", "ch extensionista"],
  credits: ["creditos", "credito", "cr", "credits", "crd", "total cred"],
  syllabus: [
    "ementa",
    "conteudo",
    "conteudo programatico",
    "programa",
    "syllabus",
    "objetivos",
    "descricao da ementa",
    "ementa da disciplina",
  ],
  semester: ["periodo", "semestre", "period", "serie"],
  status: ["situacao", "status", "resultado"],
  grade: ["nota", "media", "conceito"],
};

const IGNORE_ALIASES = new Set([
  "pre requisito",
  "prerequisito",
  "correquisito",
  "nucleo",
  "observacao",
  "bibliografia",
  "n",
  "no",
  "item",
  "ordem",
  "equivalencias",
  "aulas semanais",
  "aulas",
]);

export function classifyHeader(value: string): ColumnRole | null {
  const n = normalizeText(value);
  if (!n) return null;
  if (IGNORE_ALIASES.has(n)) return "ignore";
  for (const [role, aliases] of Object.entries(ROLE_ALIASES) as Array<
    [Exclude<ColumnRole, "ignore">, string[]]
  >) {
    if (aliases.includes(n)) return role;
  }
  if (/\bementa\b/.test(n) || n.includes("conteudo programatico")) return "syllabus";
  if (n.includes("componente curricular") || n.includes("unidade curricular")) return "name";
  if (/\bdisciplinas?\b/.test(n) && !n.includes("obrigator") && !n.includes("optativ") && !n.includes("eletiv")) {
    return "name";
  }
  if (n.includes("carga horaria teorica") || (n.includes("teorica") && n.includes("carga"))) return "hoursTheory";
  if (n.includes("carga horaria pratica") || (n.includes("pratica") && n.includes("carga"))) return "hoursPractice";
  if (n.includes("carga horaria") || n === "ch" || n.startsWith("ch ") || n === "total da ch") return "hours";
  if (n === "total" || n === "total geral") return "hours";
  if (n.includes("codigo") || n.includes("sigla")) return "code";
  if (n.includes("credito")) return "credits";
  if (n.includes("situacao")) return "status";
  if (n.includes("extens")) return "hoursExtension";
  if (n.includes(" ead") || n.endsWith("ead")) return "hoursEad";
  return null;
}

export function headerRoles(cells: string[]): Array<ColumnRole | null> {
  return cells.map((cell) => classifyHeader(cell));
}

export function headerScore(roles: Array<ColumnRole | null>): number {
  const unique = new Set(roles.filter((role): role is ColumnRole => Boolean(role) && role !== "ignore"));
  let score = unique.size;
  if (unique.has("name")) score += 4;
  if (HOUR_ROLES.some((role) => unique.has(role))) score += 2;
  if (unique.has("syllabus")) score += 2;
  if (unique.has("code")) score += 1;
  if (!unique.has("name") && unique.has("code") && unique.has("syllabus")) score += 3;
  return score;
}

export function mergeHeaderRows(row: string[], next: string[] | undefined): string[] {
  if (!next) return row;
  const width = Math.max(row.length, next.length);
  return Array.from({ length: width }, (_, index) =>
    [row[index], next[index]].filter((part) => part && part.trim()).join(" ").trim(),
  );
}

export function isViableHeader(roles: Array<ColumnRole | null>, score: number): boolean {
  const hasName = roles.includes("name");
  const hasCode = roles.includes("code");
  const hasSupport = roles.some(
    (role) =>
      role === "hours" ||
      role === "hoursTheory" ||
      role === "credits" ||
      role === "code" ||
      role === "syllabus" ||
      role === "status" ||
      role === "grade",
  );
  if (hasName && hasSupport && score >= 6) return true;
  if (!hasName && hasCode && roles.includes("syllabus") && score >= 5) return true;
  return false;
}

export function headerAt(
  grid: string[][],
  index: number,
): { roles: Array<ColumnRole | null>; consumed: number; score: number } | null {
  if (index >= grid.length) return null;
  const single = headerRoles(grid[index]);
  const merged = headerRoles(mergeHeaderRows(grid[index], grid[index + 1]));
  const singleScore = headerScore(single);
  const mergedScore = headerScore(merged);
  const useMerged =
    mergedScore > singleScore + 1 &&
    merged.some(
      (role) =>
        role === "hoursTheory" ||
        role === "hoursPractice" ||
        role === "hoursEad" ||
        role === "hoursExtension",
    );
  const roles = useMerged ? merged : single;
  const score = useMerged ? mergedScore : singleScore;
  if (!isViableHeader(roles, score)) return null;
  return { roles, consumed: useMerged ? 2 : 1, score };
}

export function findHeaderRow(grid: string[][]): { index: number; roles: Array<ColumnRole | null> } | null {
  const limit = Math.min(grid.length, 20);
  let best: { index: number; roles: Array<ColumnRole | null>; score: number } | null = null;
  for (let index = 0; index < limit; index += 1) {
    const found = headerAt(grid, index);
    if (!found) continue;
    if (!best || found.score > best.score) best = { index, roles: found.roles, score: found.score };
  }
  return best ? { index: best.index, roles: best.roles } : null;
}
