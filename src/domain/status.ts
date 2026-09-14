import { normalizeText } from "./normalizer.ts";
import { type Subject } from "./models.ts";

const COMPLETED =
  /\b(aprovad[oa]s?|aproveitad[oa]s?|dispensad[oa]s?|convalidad[oa]s?|equivalen\w*|cumprid[oa]s?)\b/;
const NOT_COMPLETED =
  /\b(a cursar|em curso|cursando|reprovad[oa]s?|trancad[oa]s?|cancelad[oa]s?|desistente|nao cursad[oa])\b/;

export function isCompletedStatus(status: string | null | undefined): boolean | null {
  const text = normalizeText(status);
  if (!text) return null;
  if (NOT_COMPLETED.test(text)) return false;
  if (COMPLETED.test(text)) return true;
  return null;
}

/** Origem sem situação entra; "a cursar" / reprovado / trancado não competem como cumpridas. */
export function isCompletableOrigin(subject: Subject): boolean {
  return isCompletedStatus(subject.status) !== false;
}
