import { type Subject } from "./models.ts";

/** BIO-101, bio 101 e BIO101 viram a mesma chave. Não passa pelo normalizer de nome (mat. ≠ matemática). */
export function normalizeCode(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function codesMatch(previous: Subject, current: Subject): boolean {
  const left = normalizeCode(previous.code);
  const right = normalizeCode(current.code);
  return Boolean(left && right && left === right);
}
