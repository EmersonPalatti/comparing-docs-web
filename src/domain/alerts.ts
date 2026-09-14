import { MIN_HOURS_RATIO_FOR_STRONG } from "./config.ts";
import { hoursRatio } from "./hours.ts";

import { type SubjectMatch } from "./models.ts";

export function matchAlerts(match: SubjectMatch): string[] {
  const alerts: string[] = [];
  const previousHours = match.previousSubject.workloadHours;
  const currentHours = match.currentSubject.workloadHours;
  const ratio = hoursRatio(match.previousSubject, match.currentSubject);

  if (match.blockedStatus) alerts.push("Situação não cumprida");
  if (match.codeMatch) alerts.push("Mesmo código");
  if (match.levelConflict) alerts.push("Nível diferente (I/II)");

  if (
    match.nameSimilarity >= 0.8 &&
    previousHours !== null &&
    currentHours !== null &&
    previousHours < currentHours
  ) {
    alerts.push("Nome muito similar e carga menor");
  }

  if (match.workloadScore === null) {
    alerts.push("Carga não identificada");
  } else if (match.workloadScore <= 0.2) {
    alerts.push("Carga insuficiente");
  } else if (match.workloadScore <= 0.5) {
    alerts.push("Carga significativamente menor");
  } else if (match.workloadScore < 1) {
    alerts.push("Carga um pouco menor");
  }

  if (ratio !== null && ratio < MIN_HOURS_RATIO_FOR_STRONG && ratio >= 0.6) {
    alerts.push("Carga abaixo de 75%");
  }

  if (match.finalScore >= 0.85) alerts.push("Boa similaridade");
  else if (match.finalScore < 0.5) alerts.push("Sem match forte");

  if (match.requiresManualReview && match.finalScore >= 0.7) {
    alerts.push("Revisar escopo");
  }

  if (match.destinationConflict) {
    alerts.push("Destino compartilhado");
  }

  return alerts.length ? alerts : ["Sem alerta específico"];
}

export function matchPriority(match: SubjectMatch): string {
  const alerts = new Set(matchAlerts(match));
  if (alerts.has("Situação não cumprida")) return "Alta";
  if (alerts.has("Nome muito similar e carga menor")) return "Alta";
  if (alerts.has("Destino compartilhado")) return "Alta";
  if (alerts.has("Nível diferente (I/II)")) return "Alta";
  if (match.finalScore >= 0.7 && match.requiresManualReview) return "Alta";
  if (match.finalScore >= 0.5) return "Média";
  return "Baixa";
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  return `${(value * 100).toFixed(2)}%`;
}

export function formatOptionalScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  return value.toFixed(2);
}
