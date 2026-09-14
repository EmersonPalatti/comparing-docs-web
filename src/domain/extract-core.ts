import type ExcelJS from "exceljs";

export class TextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextExtractionError";
  }
}

export function cellDisplayValue(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("formula" in value) {
      const result = "result" in value ? value.result : "";
      return cellDisplayValue(result as ExcelJS.CellValue);
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && value.text != null) return String(value.text);
    if (value instanceof Date) return value.toISOString();
    if ("error" in value) return "";
    return "";
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}
