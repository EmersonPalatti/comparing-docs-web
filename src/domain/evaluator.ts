import { CLASSIFICATION_LABELS_PT } from "./config.ts";
import { type SubjectMatch } from "./models.ts";

export function classificationLabel(classification: string): string {
  return CLASSIFICATION_LABELS_PT[classification] ?? classification;
}

export function conciseJustification(match: SubjectMatch): string {
  const parts = [
    `Similaridade do nome: ${match.nameSimilarity.toFixed(2)}.`,
    `Pontuação final: ${match.finalScore.toFixed(2)}.`,
  ];
  if (match.semanticSimilarity !== null) {
    parts.push(`Similaridade de conteúdo: ${match.semanticSimilarity.toFixed(2)}.`);
  }
  if (match.workloadScore === null) {
    parts.push("Carga horária ausente em ao menos uma disciplina; revisão manual recomendada.");
  } else if (match.workloadScore < 0.8) {
    parts.push("A carga horária anterior é inferior à atual, reduzindo a confiança.");
  }
  return parts.join(" ");
}
