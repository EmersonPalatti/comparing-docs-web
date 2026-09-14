export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 200;
export const MAX_SPREADSHEET_ROWS = 10_000;
export const MAX_SPREADSHEET_COLUMNS = 200;
export const MAX_SUBJECTS = 500;
export const ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".csv", ".txt", ".md", ".docx"] as const;

export const DISCLAIMER_PT =
  "Este relatório apresenta uma análise automatizada de similaridade entre disciplinas com base nos documentos enviados. Ele não representa uma decisão oficial da instituição de ensino. A aceitação final de equivalência ou aproveitamento de disciplinas depende das regras e da análise da própria instituição.";

export const CLASSIFICATION_LABELS_PT: Record<string, string> = {
  strong_equivalency: "Forte indicação de equivalência",
  likely_equivalency: "Provável equivalência, revisar manualmente",
  partial_similarity: "Similaridade parcial",
  no_match: "Nenhuma equivalência forte encontrada",
};

export const STRONG_EQUIVALENCY = "strong_equivalency";
export const LIKELY_EQUIVALENCY = "likely_equivalency";
export const PARTIAL_SIMILARITY = "partial_similarity";
export const NO_MATCH = "no_match";

/** Origem precisa cobrir esta fração da CH de destino para poder ser "forte". */
export const MIN_HOURS_RATIO_FOR_STRONG = 0.75;
/** Abaixo disto a classificação não passa de similaridade parcial. */
export const MIN_HOURS_RATIO_FOR_LIKELY = 0.6;
/** Score mínimo para o húngaro aceitar um par 1-para-1. */
export const ASSIGNMENT_THRESHOLD = 0.5;
/** Piso de score quando os códigos coincidem (antes das travas de CH/nível). */
export const SAME_CODE_SCORE_FLOOR = 0.9;
