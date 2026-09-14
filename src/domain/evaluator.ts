import { CLASSIFICATION_LABELS_PT } from "./config.ts";
import { hoursRatio } from "./hours.ts";
import { type SubjectMatch } from "./models.ts";

export function classificationLabel(classification: string): string {
  return CLASSIFICATION_LABELS_PT[classification] ?? classification;
}

export function conciseJustification(match: SubjectMatch): string {
  const parts: string[] = [];
  if (match.blockedStatus) {
    parts.push(
      `Situação de origem (“${match.previousSubject.status}”) indica que a disciplina não foi cumprida; ela não entra na atribuição 1-para-1.`,
    );
  }
  if (match.codeMatch) {
    parts.push(
      `Os códigos coincidem (${match.previousSubject.code} = ${match.currentSubject.code}).`,
    );
  }
  if (match.levelConflict) {
    parts.push("Há conflito de nível (I/II ou introdução versus avançado).");
  }
  parts.push(`Similaridade do nome: ${match.nameSimilarity.toFixed(2)}.`);
  parts.push(`Pontuação final: ${match.finalScore.toFixed(2)}.`);
  if (match.semanticSimilarity !== null) {
    parts.push(`Similaridade de conteúdo: ${match.semanticSimilarity.toFixed(2)}.`);
  }
  const ratio = hoursRatio(match.previousSubject, match.currentSubject);
  if (match.workloadScore === null) {
    parts.push("Carga horária ausente em ao menos uma disciplina; revisão manual recomendada.");
  } else if (ratio !== null && ratio < 1) {
    const percent = Math.round(ratio * 100);
    parts.push(
      `A carga horária anterior (${match.previousSubject.workloadHours}h) cobre ${percent}% da atual (${match.currentSubject.workloadHours}h).`,
    );
  }
  return parts.join(" ");
}
