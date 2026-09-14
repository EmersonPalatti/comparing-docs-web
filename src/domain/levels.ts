import { normalizeText } from "./normalizer.ts";
import { type Subject } from "./models.ts";

const ROMAN = /\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/g;
const INTRO = new Set(["introducao", "basico", "basica", "fundamentos", "fundamento"]);
const ADVANCED = new Set(["avancado", "avancada", "aplicada", "aplicado"]);

function nameText(subject: Subject): string {
  return subject.normalizedName || normalizeText(subject.name);
}

export function romanLevel(subject: Subject): string | null {
  const matches = nameText(subject).match(ROMAN);
  if (!matches?.length) return null;
  return matches[matches.length - 1];
}

function hasAny(text: string, terms: Set<string>): boolean {
  return text.split(" ").some((token) => terms.has(token));
}

export function levelConflict(previous: Subject, current: Subject): boolean {
  const previousRoman = romanLevel(previous);
  const currentRoman = romanLevel(current);
  if (previousRoman && currentRoman && previousRoman !== currentRoman) return true;

  const previousName = nameText(previous);
  const currentName = nameText(current);
  const previousIntro = hasAny(previousName, INTRO);
  const currentIntro = hasAny(currentName, INTRO);
  const previousAdvanced = hasAny(previousName, ADVANCED);
  const currentAdvanced = hasAny(currentName, ADVANCED);
  if (previousIntro && currentAdvanced) return true;
  if (previousAdvanced && currentIntro) return true;
  return false;
}
