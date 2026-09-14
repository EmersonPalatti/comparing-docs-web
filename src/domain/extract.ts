import ExcelJS from "exceljs";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_PDF_PAGES,
  MAX_SPREADSHEET_COLUMNS,
  MAX_SPREADSHEET_ROWS,
  MAX_UPLOAD_BYTES,
} from "./config.ts";

export class TextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextExtractionError";
  }
}

export type ExtractedDocument = {
  filename: string;
  sourceDocument: string;
  text: string;
};

export type BinarySource = {
  name?: string;
  bytes: Uint8Array;
};

export const PDF_LOAD_OPTIONS = {
  isEvalSupported: false,
  useSystemFonts: true,
} as const;

export function cleanText(text: string): string {
  const lines = text.replace(/\r/g, "\n").split("\n").map((line) => line.trim());
  const cleaned: string[] = [];
  let previousBlank = false;
  for (const line of lines) {
    if (!line) {
      if (!previousBlank) cleaned.push("");
      previousBlank = true;
      continue;
    }
    cleaned.push(line.split(/\s+/).join(" "));
    previousBlank = false;
  }
  return cleaned.join("\n").trim();
}

export function readBinary(source: Uint8Array | BinarySource, maxBytes = MAX_UPLOAD_BYTES): Uint8Array {
  const content = source instanceof Uint8Array ? source : source.bytes;
  if (content.byteLength > maxBytes) {
    throw new TextExtractionError(
      `Arquivo excede o tamanho máximo permitido de ${maxBytes} bytes.`,
    );
  }
  return content;
}

export function extractTextFromTxt(content: Uint8Array): string {
  const encodings: string[] = ["utf-8", "latin1"];
  for (const encoding of encodings) {
    try {
      const decoded = new TextDecoder(encoding, { fatal: encoding === "utf-8" }).decode(content);
      return cleanText(decoded.replace(/^\uFEFF/, ""));
    } catch {
      continue;
    }
  }
  throw new TextExtractionError("Não foi possível decodificar o arquivo de texto.");
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

export async function extractTextFromSpreadsheet(
  content: Uint8Array,
  suffix: string,
  limits: { rows?: number; columns?: number } = {},
): Promise<string> {
  if (suffix === ".xls") {
    throw new TextExtractionError(
      "Arquivos .xls não são suportados. Salve a planilha como XLSX ou CSV e envie de novo.",
    );
  }

  const maxRows = limits.rows ?? MAX_SPREADSHEET_ROWS;
  const maxColumns = limits.columns ?? MAX_SPREADSHEET_COLUMNS;

  if (suffix === ".csv") {
    return limitDelimitedText(extractTextFromTxt(content), maxRows, maxColumns);
  }

  const workbook = new ExcelJS.Workbook();
  const copy = new Uint8Array(content.byteLength);
  copy.set(content);
  try {
    await workbook.xlsx.load(copy as never);
  } catch (error) {
    if (error instanceof TextExtractionError) throw error;
    throw new TextExtractionError("O arquivo XLSX está corrompido ou não é uma planilha válida.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new TextExtractionError("O arquivo de planilha está vazio.");

  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map((cell) => cellDisplayValue(cell as ExcelJS.CellValue)));
  });
  if (!rows.length) throw new TextExtractionError("O arquivo de planilha está vazio.");
  const dataRowCount = Math.max(0, rows.length - 1);
  const width = Math.max(...rows.map((row) => row.length), 0);
  if (dataRowCount > maxRows) {
    throw new TextExtractionError(
      `Limite de planilha excedido: máximo de ${maxRows} linhas por arquivo.`,
    );
  }
  if (width > maxColumns) {
    throw new TextExtractionError(
      `Limite de planilha excedido: máximo de ${maxColumns} colunas por arquivo.`,
    );
  }
  return rows.map((row) => row.join(",")).join("\n").trim();
}

function limitDelimitedText(text: string, maxRows: number, maxColumns: number): string {
  const lines = text ? text.split("\n") : [];
  if (!lines.length) throw new TextExtractionError("O arquivo de planilha está vazio.");
  const dataRowCount = Math.max(0, lines.length - 1);
  const width = Math.max(...lines.map((line) => line.split(",").length), 0);
  if (dataRowCount > maxRows) {
    throw new TextExtractionError(
      `Limite de planilha excedido: máximo de ${maxRows} linhas por arquivo.`,
    );
  }
  if (width > maxColumns) {
    throw new TextExtractionError(
      `Limite de planilha excedido: máximo de ${maxColumns} colunas por arquivo.`,
    );
  }
  return text;
}

export async function extractTextFromPdf(
  content: Uint8Array,
  maxPages = MAX_PDF_PAGES,
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }
  const loadingTask = pdfjs.getDocument({
    data: content.slice(),
    ...PDF_LOAD_OPTIONS,
    ...(typeof window === "undefined" ? { disableWorker: true } : {}),
  } as Parameters<typeof pdfjs.getDocument>[0]);
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  const limit = Math.min(pdf.numPages, maxPages);
  for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (pageText) pages.push(pageText);
  }
  const text = cleanText(pages.join("\n\n"));
  if (!text) {
    throw new TextExtractionError(
      "This PDF does not appear to contain selectable text. OCR support is not available in the current MVP.",
    );
  }
  return text;
}

export async function loadDocument(
  file: BinarySource,
  sourceDocument: string,
): Promise<ExtractedDocument> {
  const filename = file.name || sourceDocument;
  const suffix = extensionOf(filename);
  let content: Uint8Array;
  try {
    content = readBinary(file);
  } catch (error) {
    if (error instanceof TextExtractionError) {
      throw new TextExtractionError(`${filename}: ${error.message}`);
    }
    throw error;
  }
  if (!content.byteLength) {
    throw new TextExtractionError("O arquivo enviado está vazio.");
  }
  assertSafeUpload(filename, content);

  let text: string;
  if (suffix === ".pdf") {
    text = await extractTextFromPdf(content);
  } else if (suffix === ".xlsx" || suffix === ".xls" || suffix === ".csv") {
    text = await extractTextFromSpreadsheet(content, suffix);
  } else if (suffix === ".txt" || suffix === ".md" || suffix === "") {
    text = extractTextFromTxt(content);
  } else {
    throw new TextExtractionError(
      "Tipo de arquivo não suportado no MVP. Use PDF com texto selecionável, XLSX, CSV ou TXT.",
    );
  }

  return { filename, sourceDocument, text };
}

export function extensionOf(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

export function assertSafeUpload(filename: string, bytes: Uint8Array): void {
  const suffix = extensionOf(filename);
  if (suffix && !(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(suffix)) {
    throw new TextExtractionError(
      "Tipo de arquivo não suportado no MVP. Use PDF com texto selecionável, XLSX, CSV ou TXT.",
    );
  }
  if (suffix === ".pdf" && !hasMagic(bytes, "%PDF")) {
    throw new TextExtractionError("O arquivo PDF está corrompido ou não é um PDF válido.");
  }
  if (suffix === ".xlsx" && !hasBytes(bytes, [0x50, 0x4b])) {
    throw new TextExtractionError("O arquivo XLSX está corrompido ou não é uma planilha válida.");
  }
  if (suffix === ".xls") {
    throw new TextExtractionError(
      "Arquivos .xls não são suportados. Salve a planilha como XLSX ou CSV e envie de novo.",
    );
  }
}

function hasMagic(bytes: Uint8Array, magic: string): boolean {
  if (bytes.byteLength < magic.length) return false;
  return new TextDecoder("latin1").decode(bytes.subarray(0, magic.length)) === magic;
}

function hasBytes(bytes: Uint8Array, expected: number[]): boolean {
  if (bytes.byteLength < expected.length) return false;
  return expected.every((value, index) => bytes[index] === value);
}

export function friendlyExtractionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("selectable text") || message.toLowerCase().includes("ocr")) {
    return "Este PDF parece ser uma imagem digitalizada. Envie um PDF com texto selecionável, planilha ou arquivo de texto.";
  }
  return message;
}