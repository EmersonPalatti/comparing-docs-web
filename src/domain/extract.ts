import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_PDF_PAGES,
  MAX_SPREADSHEET_COLUMNS,
  MAX_SPREADSHEET_ROWS,
  MAX_UPLOAD_BYTES,
} from "./config.ts";
import { TextExtractionError } from "./extract-core.ts";
import { reconstructPdfGrid, reconstructPdfText } from "./pdf-layout.ts";
import { parseSubjects } from "./parser.ts";
import { extractSpreadsheet } from "./spreadsheet.ts";
import { parseGrid, parseDelimited, gridsToText } from "./tables.ts";
import { type Subject } from "./models.ts";

export { cellDisplayValue, TextExtractionError } from "./extract-core.ts";

export type ExtractedDocument = {
  filename: string;
  sourceDocument: string;
  text: string;
  subjects?: Subject[];
  notes?: string[];
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

export function extractCsv(
  content: Uint8Array,
  sourceDocument: string,
  limits: { rows?: number; columns?: number } = {},
): { text: string; subjects: Subject[]; notes: string[] } {
  const maxRows = limits.rows ?? MAX_SPREADSHEET_ROWS;
  const maxColumns = limits.columns ?? MAX_SPREADSHEET_COLUMNS;
  const text = limitDelimitedText(extractTextFromTxt(content), maxRows, maxColumns);
  const subjects = parseGrid(parseDelimited(text), sourceDocument);
  return {
    text,
    subjects,
    notes: subjects.length
      ? [`${subjects.length} disciplina(s) no CSV.`]
      : ["CSV sem cabeçalho de disciplina reconhecido; usando o texto corrido."],
  };
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
    return extractCsv(content, "planilha.csv", { rows: maxRows, columns: maxColumns }).text;
  }

  const extracted = await extractSpreadsheet(content, "planilha", { rows: maxRows, columns: maxColumns });
  return extracted.text;
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
  const extracted = await extractPdf(content, "documento.pdf", maxPages);
  return extracted.text;
}

export async function extractPdf(
  content: Uint8Array,
  sourceDocument: string,
  maxPages = MAX_PDF_PAGES,
): Promise<{ text: string; subjects: Subject[]; notes: string[] }> {
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
  const grids: string[][][] = [];
  const notes: string[] = [];
  const limit = Math.min(pdf.numPages, maxPages);
  for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const items = textContent.items.filter((item) => "str" in item) as Array<{
      str?: string;
      width?: number;
      height?: number;
      transform?: number[];
    }>;
    const grid = reconstructPdfGrid(items);
    const layoutText =
      reconstructPdfText(items) || items.map((item) => ("str" in item ? item.str : "")).join(" ").trim();
    if (grid.some((row) => row.filter(Boolean).length > 1)) grids.push(grid);
    if (layoutText) pages.push(layoutText);
  }
  const text = cleanText(pages.join("\n\n"));
  if (!text) {
    throw new TextExtractionError(
      "This PDF does not appear to contain selectable text. OCR support is not available in the current MVP.",
    );
  }
  if (pdf.numPages > maxPages) {
    notes.push(`PDF truncado nas primeiras ${maxPages} páginas de ${pdf.numPages}.`);
  }
  const fromGrid = grids.flatMap((grid) => parseGrid(grid, sourceDocument));
  const fromText = parseSubjects(text, sourceDocument);
  const subjects = pickSubjects(fromGrid, fromText);
  notes.push(
    fromGrid.length
      ? `${subjects.length} disciplina(s) lidas da tabela do PDF.`
      : subjects.length
        ? `${subjects.length} disciplina(s) lidas do texto do PDF.`
        : "PDF sem tabela reconhecida; confira a revisão manual.",
  );
  return { text, subjects, notes };
}

export async function extractTextFromDocx(content: Uint8Array): Promise<string> {
  const extracted = await extractDocx(content, "documento.docx");
  return extracted.text;
}

export async function extractDocx(
  content: Uint8Array,
  sourceDocument: string,
): Promise<{ text: string; subjects: Subject[]; notes: string[] }> {
  const mammoth = await import("mammoth");
  const copy = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
  try {
    const [htmlResult, rawResult] = await Promise.all([
      mammoth.convertToHtml({ arrayBuffer: copy as ArrayBuffer }),
      mammoth.extractRawText({ arrayBuffer: copy as ArrayBuffer }),
    ]);
    const grids = htmlToGrids(htmlResult.value || "");
    const fromGrid = grids.flatMap((grid) => parseGrid(grid, sourceDocument));
    const tableText = gridsToText(grids);
    const raw = cleanText(rawResult.value || "");
    const text = [tableText, raw].filter(Boolean).join("\n\n").trim();
    if (!text) throw new TextExtractionError("O documento Word está vazio.");
    const fromText = parseSubjects(raw, sourceDocument);
    const subjects = pickSubjects(fromGrid, fromText);
    const notes = fromGrid.length
      ? [`${subjects.length} disciplina(s) em tabela(s) do Word.`]
      : subjects.length
        ? [`${subjects.length} disciplina(s) no texto do Word.`]
        : ["Word sem tabela reconhecida; usando o texto corrido."];
    return { text, subjects, notes };
  } catch (error) {
    if (error instanceof TextExtractionError) throw error;
    throw new TextExtractionError("Não foi possível ler o arquivo DOCX.");
  }
}

function htmlToGrids(html: string): string[][][] {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  return tables
    .map((table) => {
      const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
      return rows.map((row) => {
        const cells = row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? [];
        const expanded: string[] = [];
        for (const cell of cells) {
          const span = Number(/colspan=["']?(\d+)/i.exec(cell)?.[1] ?? 1);
          const text = decodeHtml(cell);
          expanded.push(text);
          for (let extra = 1; extra < span; extra += 1) expanded.push("");
        }
        return expanded;
      });
    })
    .filter((grid) => grid.some((row) => row.some((cell) => cell)));
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/"/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

export function pickSubjects(structured: Subject[] | undefined, parsed: Subject[]): Subject[] {
  if (structured?.length && structured.length >= parsed.length) return structured;
  if (parsed.length) return parsed;
  return structured ?? [];
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
  let subjects: Subject[] | undefined;
  let notes: string[] | undefined;
  if (suffix === ".pdf") {
    const extracted = await extractPdf(content, filename);
    text = extracted.text;
    subjects = extracted.subjects;
    notes = extracted.notes;
  } else if (suffix === ".xlsx") {
    const extracted = await extractSpreadsheet(content, filename);
    text = extracted.text;
    subjects = extracted.subjects;
    notes = extracted.notes;
  } else if (suffix === ".xls") {
    text = await extractTextFromSpreadsheet(content, suffix);
  } else if (suffix === ".csv") {
    const extracted = extractCsv(content, filename);
    text = extracted.text;
    subjects = extracted.subjects;
    notes = extracted.notes;
  } else if (suffix === ".docx") {
    const extracted = await extractDocx(content, filename);
    text = extracted.text;
    subjects = extracted.subjects;
    notes = extracted.notes;
  } else if (suffix === ".txt" || suffix === ".md" || suffix === "") {
    text = extractTextFromTxt(content);
  } else {
    throw new TextExtractionError(
      "Tipo de arquivo não suportado no MVP. Use PDF com texto selecionável, DOCX, XLSX, CSV ou TXT.",
    );
  }

  return { filename, sourceDocument, text, subjects, notes };
}

export function extensionOf(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

export function assertSafeUpload(filename: string, bytes: Uint8Array): void {
  const suffix = extensionOf(filename);
  if (suffix && !(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(suffix)) {
    throw new TextExtractionError(
      "Tipo de arquivo não suportado no MVP. Use PDF com texto selecionável, DOCX, XLSX, CSV ou TXT.",
    );
  }
  if (suffix === ".pdf" && !hasMagic(bytes, "%PDF")) {
    throw new TextExtractionError("O arquivo PDF está corrompido ou não é um PDF válido.");
  }
  if ((suffix === ".xlsx" || suffix === ".docx") && !hasBytes(bytes, [0x50, 0x4b])) {
    throw new TextExtractionError(
      suffix === ".docx"
        ? "O arquivo DOCX está corrompido ou não é um documento Word válido."
        : "O arquivo XLSX está corrompido ou não é uma planilha válida.",
    );
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
