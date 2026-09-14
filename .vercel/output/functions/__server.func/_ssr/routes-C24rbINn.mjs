import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as LoaderCircle, c as FileSpreadsheet, i as Plus, l as Download, n as Trash2, o as FileUp, r as RotateCcw, s as FileText, u as ArrowLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as require_excel } from "../_libs/exceljs+[...].mjs";
import { n as StandardFonts, r as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C24rbINn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_excel = /* @__PURE__ */ __toESM(require_excel());
var MAX_UPLOAD_BYTES = 10485760;
var ALLOWED_UPLOAD_EXTENSIONS = [
	".pdf",
	".xlsx",
	".xls",
	".csv",
	".txt",
	".md"
];
var DISCLAIMER_PT = "Este relatório apresenta uma análise automatizada de similaridade entre disciplinas com base nos documentos enviados. Ele não representa uma decisão oficial da instituição de ensino. A aceitação final de equivalência ou aproveitamento de disciplinas depende das regras e da análise da própria instituição.";
var CLASSIFICATION_LABELS_PT = {
	strong_equivalency: "Forte indicação de equivalência",
	likely_equivalency: "Provável equivalência, revisar manualmente",
	partial_similarity: "Similaridade parcial",
	no_match: "Nenhuma equivalência forte encontrada"
};
var STRONG_EQUIVALENCY = "strong_equivalency";
var LIKELY_EQUIVALENCY = "likely_equivalency";
var PARTIAL_SIMILARITY = "partial_similarity";
var NO_MATCH = "no_match";
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var ACCEPT = ".pdf,.xlsx,.xls,.csv,.txt,.md";
function Dropzone({ label, hint, fileName, onFile }) {
	const inputRef = (0, import_react.useRef)(null);
	const [over, setOver] = (0, import_react.useState)(false);
	async function handleFile(file) {
		if (!file) return;
		if (file.size > 10485760) {
			toast.error(`Arquivo excede o limite de ${Math.floor(MAX_UPLOAD_BYTES / 1048576)} MB.`);
			return;
		}
		const bytes = new Uint8Array(await file.arrayBuffer());
		onFile({
			name: file.name,
			bytes
		});
	}
	function onDrop(event) {
		event.preventDefault();
		setOver(false);
		handleFile(event.dataTransfer.files[0]);
	}
	function onChange(event) {
		handleFile(event.target.files?.[0]);
	}
	function onKeyDown(event) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			inputRef.current?.click();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "button",
		tabIndex: 0,
		"aria-label": `${label}. ${fileName ?? hint}`,
		onClick: () => inputRef.current?.click(),
		onKeyDown,
		onDragOver: (event) => {
			event.preventDefault();
			setOver(true);
		},
		onDragLeave: () => setOver(false),
		onDrop,
		className: cn("flex min-h-44 w-full flex-col items-start gap-3 rounded-lg bg-surface p-5 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150", over && "ring-2 ring-ring"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-10 items-center justify-center rounded-sm bg-bg text-accent",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-sm font-medium text-fg",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-sm text-muted",
				children: fileName ?? hint
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: ACCEPT,
				hidden: true,
				className: "sr-only",
				"aria-hidden": "true",
				tabIndex: -1,
				onChange,
				onClick: (event) => event.stopPropagation()
			})
		]
	});
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
	variants: { tone: {
		default: "bg-bg-elevated text-fg",
		accent: "bg-accent/10 text-accent",
		high: "bg-high/10 text-high",
		mid: "bg-mid/10 text-mid",
		low: "bg-low/10 text-low",
		ok: "bg-ok/10 text-ok",
		warn: "bg-warn/10 text-warn",
		danger: "bg-danger/10 text-danger"
	} },
	defaultVariants: { tone: "default" }
});
function Badge({ className, tone, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ tone }), className),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm text-fg placeholder:text-subtle", className),
		...props
	});
}
function priorityTone(priority) {
	if (priority === "Alta") return "high";
	if (priority === "Média") return "mid";
	return "low";
}
function classTone(classification) {
	if (classification.startsWith("Forte")) return "ok";
	if (classification.startsWith("Provável")) return "warn";
	if (classification.startsWith("Similaridade")) return "mid";
	return "low";
}
function MatchTable({ rows, onSelect, onNote, onSelectAll }) {
	const allSelected = rows.length > 0 && rows.every((row) => row.selected);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-x-auto rounded-lg bg-surface shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[980px] text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "border-b border-border bg-bg-elevated text-xs tracking-wide text-muted uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "size-4 accent-accent",
							checked: allSelected,
							"aria-label": "Selecionar todos os pares visíveis",
							onChange: (event) => onSelectAll(event.target.checked)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Anterior"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Atual"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Prioridade"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Equivalência"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Classificação"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Alertas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "min-w-48 px-3 py-3 font-medium",
						children: "Observação"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: cn("border-b border-border last:border-0", row.selected && "bg-accent/5"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3 align-top",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "size-4 accent-accent",
							checked: row.selected,
							"aria-label": `Selecionar ${row.previousName} × ${row.currentName}`,
							onChange: (event) => onSelect(row.id, event.target.checked)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-3 align-top",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium text-fg",
							children: row.previousName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "tabular-nums text-xs text-muted",
							children: row.previousHours == null ? "CH n/d" : `${row.previousHours}h`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-3 align-top",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium text-fg",
							children: row.currentName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "tabular-nums text-xs text-muted",
							children: row.currentHours == null ? "CH n/d" : `${row.currentHours}h`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3 align-top",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: priorityTone(row.priority),
							children: row.priority
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-3 align-top",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "tabular-nums font-medium",
							children: row.equivalencyPercent
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted",
							children: ["CH ", row.workloadScoreLabel || "—"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-3 align-top",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: classTone(row.classificationLabel),
							children: row.classificationLabel
						}), row.manualReview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-xs text-warn",
							children: "Revisão manual"
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3 align-top",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1",
							children: row.alertList.slice(0, 3).map((alert) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "default",
								children: alert
							}, alert))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3 align-top",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: row.reviewerNote,
							placeholder: "Justificativa humana",
							"aria-label": `Observação para ${row.previousName}`,
							onChange: (event) => onNote(row.id, event.target.value)
						})
					})
				]
			}, row.id)) })]
		}), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-4 py-8 text-center text-sm text-muted",
			children: "Nenhum par com os filtros atuais."
		}) : null]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-[opacity,transform,background-color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg shadow-[var(--shadow-border)] hover:opacity-90",
			outline: "bg-surface text-fg shadow-[var(--shadow-border)] hover:bg-bg-elevated",
			ghost: "text-fg hover:bg-bg-elevated",
			danger: "bg-danger text-primary-fg hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-sm",
			lg: "h-12 px-5"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function SubjectEditor({ title, rows, onChange, onAdd, onRemove }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-lg font-medium text-fg",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: onAdd,
				type: "button",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Adicionar"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-80 border-separate border-spacing-y-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "text-left text-xs tracking-wide text-muted uppercase",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-2 font-medium",
							children: "Disciplina"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "w-28 px-2 font-medium",
							children: "Carga"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "w-12 px-2" })
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: row.name,
							"aria-label": `Disciplina ${index + 1} de ${title}`,
							onChange: (event) => onChange(index, { name: event.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 0,
							inputMode: "numeric",
							className: "tabular-nums",
							value: row.workloadHours ?? "",
							"aria-label": `Carga horária ${index + 1} de ${title}`,
							onChange: (event) => onChange(index, { workloadHours: event.target.value === "" ? null : Number(event.target.value) })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							type: "button",
							"aria-label": `Remover disciplina ${index + 1}`,
							onClick: () => onRemove(index),
							className: "px-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 text-muted" })
						})
					})
				] }, `${title}-${index}`)) })]
			})
		})]
	});
}
function Card({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("rounded-xl bg-surface p-4 text-fg shadow-[var(--shadow-border)] sm:p-5", className),
		...props
	});
}
var TextExtractionError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "TextExtractionError";
	}
};
var PDF_LOAD_OPTIONS = {
	isEvalSupported: false,
	useSystemFonts: true
};
function cleanText(text) {
	const lines = text.replace(/\r/g, "\n").split("\n").map((line) => line.trim());
	const cleaned = [];
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
function readBinary(source, maxBytes = MAX_UPLOAD_BYTES) {
	const content = source instanceof Uint8Array ? source : source.bytes;
	if (content.byteLength > maxBytes) throw new TextExtractionError(`Arquivo excede o tamanho máximo permitido de ${maxBytes} bytes.`);
	return content;
}
function extractTextFromTxt(content) {
	for (const encoding of ["utf-8", "latin1"]) try {
		return cleanText(new TextDecoder(encoding, { fatal: encoding === "utf-8" }).decode(content).replace(/^\uFEFF/, ""));
	} catch {
		continue;
	}
	throw new TextExtractionError("Não foi possível decodificar o arquivo de texto.");
}
function cellDisplayValue(value) {
	if (value == null) return "";
	if (typeof value === "object") {
		if ("formula" in value) return cellDisplayValue("result" in value ? value.result : "");
		if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
		if ("text" in value && value.text != null) return String(value.text);
		if (value instanceof Date) return value.toISOString();
		if ("error" in value) return "";
		return "";
	}
	if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
	return String(value);
}
async function extractTextFromSpreadsheet(content, suffix, limits = {}) {
	if (suffix === ".xls") throw new TextExtractionError("Arquivos .xls não são suportados. Salve a planilha como XLSX ou CSV e envie de novo.");
	const maxRows = limits.rows ?? 1e4;
	const maxColumns = limits.columns ?? 200;
	if (suffix === ".csv") return limitDelimitedText(extractTextFromTxt(content), maxRows, maxColumns);
	const workbook = new import_excel.default.Workbook();
	const copy = new Uint8Array(content.byteLength);
	copy.set(content);
	try {
		await workbook.xlsx.load(copy);
	} catch (error) {
		if (error instanceof TextExtractionError) throw error;
		throw new TextExtractionError("O arquivo XLSX está corrompido ou não é uma planilha válida.");
	}
	const sheet = workbook.worksheets[0];
	if (!sheet) throw new TextExtractionError("O arquivo de planilha está vazio.");
	const rows = [];
	sheet.eachRow({ includeEmpty: false }, (row) => {
		const values = Array.isArray(row.values) ? row.values.slice(1) : [];
		rows.push(values.map((cell) => cellDisplayValue(cell)));
	});
	if (!rows.length) throw new TextExtractionError("O arquivo de planilha está vazio.");
	const dataRowCount = Math.max(0, rows.length - 1);
	const width = Math.max(...rows.map((row) => row.length), 0);
	if (dataRowCount > maxRows) throw new TextExtractionError(`Limite de planilha excedido: máximo de ${maxRows} linhas por arquivo.`);
	if (width > maxColumns) throw new TextExtractionError(`Limite de planilha excedido: máximo de ${maxColumns} colunas por arquivo.`);
	return rows.map((row) => row.join(",")).join("\n").trim();
}
function limitDelimitedText(text, maxRows, maxColumns) {
	const lines = text ? text.split("\n") : [];
	if (!lines.length) throw new TextExtractionError("O arquivo de planilha está vazio.");
	const dataRowCount = Math.max(0, lines.length - 1);
	const width = Math.max(...lines.map((line) => line.split(",").length), 0);
	if (dataRowCount > maxRows) throw new TextExtractionError(`Limite de planilha excedido: máximo de ${maxRows} linhas por arquivo.`);
	if (width > maxColumns) throw new TextExtractionError(`Limite de planilha excedido: máximo de ${maxColumns} colunas por arquivo.`);
	return text;
}
async function extractTextFromPdf(content, maxPages = 200) {
	const pdfjs = await import("../_libs/pdfjs-dist.mjs").then((n) => n.t);
	if (typeof window !== "undefined") {
		const worker = await import("./pdf.worker.min-CA4SejP6.mjs");
		pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	}
	const pdf = await pdfjs.getDocument({
		data: content.slice(),
		...PDF_LOAD_OPTIONS,
		...typeof window === "undefined" ? { disableWorker: true } : {}
	}).promise;
	const pages = [];
	const limit = Math.min(pdf.numPages, maxPages);
	for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
		const pageText = (await (await pdf.getPage(pageNumber)).getTextContent()).items.map((item) => "str" in item ? item.str : "").join(" ").trim();
		if (pageText) pages.push(pageText);
	}
	const text = cleanText(pages.join("\n\n"));
	if (!text) throw new TextExtractionError("This PDF does not appear to contain selectable text. OCR support is not available in the current MVP.");
	return text;
}
async function loadDocument(file, sourceDocument) {
	const filename = file.name || sourceDocument;
	const suffix = extensionOf(filename);
	let content;
	try {
		content = readBinary(file);
	} catch (error) {
		if (error instanceof TextExtractionError) throw new TextExtractionError(`${filename}: ${error.message}`);
		throw error;
	}
	if (!content.byteLength) throw new TextExtractionError("O arquivo enviado está vazio.");
	assertSafeUpload(filename, content);
	let text;
	if (suffix === ".pdf") text = await extractTextFromPdf(content);
	else if (suffix === ".xlsx" || suffix === ".xls" || suffix === ".csv") text = await extractTextFromSpreadsheet(content, suffix);
	else if (suffix === ".txt" || suffix === ".md" || suffix === "") text = extractTextFromTxt(content);
	else throw new TextExtractionError("Tipo de arquivo não suportado no MVP. Use PDF com texto selecionável, XLSX, CSV ou TXT.");
	return {
		filename,
		sourceDocument,
		text
	};
}
function extensionOf(filename) {
	const index = filename.lastIndexOf(".");
	return index >= 0 ? filename.slice(index).toLowerCase() : "";
}
function assertSafeUpload(filename, bytes) {
	const suffix = extensionOf(filename);
	if (suffix && !ALLOWED_UPLOAD_EXTENSIONS.includes(suffix)) throw new TextExtractionError("Tipo de arquivo não suportado no MVP. Use PDF com texto selecionável, XLSX, CSV ou TXT.");
	if (suffix === ".pdf" && !hasMagic(bytes, "%PDF")) throw new TextExtractionError("O arquivo PDF está corrompido ou não é um PDF válido.");
	if (suffix === ".xlsx" && !hasBytes(bytes, [80, 75])) throw new TextExtractionError("O arquivo XLSX está corrompido ou não é uma planilha válida.");
	if (suffix === ".xls") throw new TextExtractionError("Arquivos .xls não são suportados. Salve a planilha como XLSX ou CSV e envie de novo.");
}
function hasMagic(bytes, magic) {
	if (bytes.byteLength < magic.length) return false;
	return new TextDecoder("latin1").decode(bytes.subarray(0, magic.length)) === magic;
}
function hasBytes(bytes, expected) {
	if (bytes.byteLength < expected.length) return false;
	return expected.every((value, index) => bytes[index] === value);
}
function friendlyExtractionError(error) {
	const message = error instanceof Error ? error.message : String(error);
	if (message.toLowerCase().includes("selectable text") || message.toLowerCase().includes("ocr")) return "Este PDF parece ser uma imagem digitalizada. Envie um PDF com texto selecionável, planilha ou arquivo de texto.";
	return message;
}
function createSubject(partial) {
	return {
		name: partial.name,
		sourceDocument: partial.sourceDocument,
		workloadHours: partial.workloadHours ?? null,
		credits: partial.credits ?? null,
		semester: partial.semester ?? null,
		status: partial.status ?? null,
		grade: partial.grade ?? null,
		syllabus: partial.syllabus ?? null,
		rawText: partial.rawText ?? null,
		normalizedName: partial.normalizedName ?? null,
		normalizedSyllabus: partial.normalizedSyllabus ?? null,
		embeddingText: partial.embeddingText ?? null
	};
}
var ABBREVIATIONS = [
	[/\bmat\.?\b/gi, "matematica"],
	[/\bestat\.?\b/gi, "estatistica"],
	[/\bintro\.?\b/gi, "introducao"],
	[/\bprog\.?\b/gi, "programacao"],
	[/\badm\.?\b/gi, "administracao"]
];
function stripAccents(value) {
	return value.normalize("NFKD").replace(/\p{M}/gu, "");
}
function normalizeText(value) {
	if (!value) return "";
	let text = stripAccents(value).toLowerCase();
	for (const [pattern, replacement] of ABBREVIATIONS) text = text.replace(pattern, replacement);
	text = text.replace(/[^a-z0-9\s]/g, " ");
	return text.replace(/\s+/g, " ").trim();
}
function round4(value) {
	return Number(value.toFixed(4));
}
function buildEmbeddingText(subject) {
	const parts = [`Subject: ${subject.name}`];
	if (subject.workloadHours !== null) parts.push(`Workload: ${subject.workloadHours}`);
	if (subject.credits !== null) parts.push(`Credits: ${subject.credits}`);
	if (subject.syllabus) parts.push(`Syllabus: ${subject.syllabus}`);
	return parts.join("\n");
}
function normalizeSubject(subject) {
	return createSubject({
		...subject,
		normalizedName: normalizeText(subject.name),
		normalizedSyllabus: normalizeText(subject.syllabus),
		embeddingText: buildEmbeddingText(subject)
	});
}
function normalizeSubjects(subjects) {
	return subjects.map(normalizeSubject);
}
var STOPWORDS = /* @__PURE__ */ new Set([
	"subject",
	"workload",
	"credits",
	"syllabus",
	"disciplina",
	"conteudo",
	"ementa",
	"de",
	"da",
	"do",
	"das",
	"dos",
	"e",
	"a",
	"o",
	"i",
	"ii",
	"iii",
	"iv"
]);
function subjectSimilarityMatrix(previousSubjects, currentSubjects) {
	const texts = [...previousSubjects, ...currentSubjects].map((subject) => subject.embeddingText || subject.name);
	if (!texts.length || texts.every((text) => !text.trim())) return previousSubjects.map(() => currentSubjects.map(() => 0));
	const similarities = tfidfCosine(texts, previousSubjects.length);
	for (let i = 0; i < previousSubjects.length; i += 1) for (let j = 0; j < currentSubjects.length; j += 1) {
		const tokenScore = tokenOverlapSimilarity(previousSubjects[i], currentSubjects[j]);
		similarities[i][j] = Math.max(similarities[i][j], tokenScore);
	}
	return similarities;
}
function tokenOverlapSimilarity(previous, current) {
	const previousTokens = meaningfulTokens(previous.embeddingText || previous.name);
	const currentTokens = meaningfulTokens(current.embeddingText || current.name);
	if (!previousTokens.size || !currentTokens.size) return 0;
	const intersection = intersect(previousTokens, currentTokens);
	const containment = intersection.size / Math.min(previousTokens.size, currentTokens.size);
	const unionSize = previousTokens.size + currentTokens.size - intersection.size;
	const jaccard = intersection.size / unionSize;
	const previousNameTokens = meaningfulTokens(previous.name);
	const currentNameTokens = meaningfulTokens(current.name);
	if (intersect(previousNameTokens, currentNameTokens).size / Math.max(Math.min(previousNameTokens.size, currentNameTokens.size), 1) >= .5 && containment >= .25) return Math.min(1, Math.max(containment, .75));
	return Math.max(containment, jaccard);
}
function meaningfulTokens(text) {
	const tokens = /* @__PURE__ */ new Set();
	for (const token of normalizeText(text).split(" ")) if (token.length > 2 && !STOPWORDS.has(token) && !/^\d+$/.test(token)) tokens.add(token);
	return tokens;
}
function intersect(a, b) {
	const result = /* @__PURE__ */ new Set();
	for (const value of a) if (b.has(value)) result.add(value);
	return result;
}
function tokenize(text) {
	return (text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []).map((token) => token);
}
function ngrams(tokens) {
	const grams = [...tokens];
	for (let i = 0; i < tokens.length - 1; i += 1) grams.push(`${tokens[i]} ${tokens[i + 1]}`);
	return grams;
}
function tfidfCosine(texts, splitAt) {
	const docs = texts.map((text) => ngrams(tokenize(text)));
	const df = /* @__PURE__ */ new Map();
	for (const doc of docs) for (const term of new Set(doc)) df.set(term, (df.get(term) ?? 0) + 1);
	const n = docs.length;
	const idf = /* @__PURE__ */ new Map();
	for (const [term, count] of df) idf.set(term, Math.log((1 + n) / (1 + count)) + 1);
	const vectors = docs.map((doc) => {
		const tf = /* @__PURE__ */ new Map();
		for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1);
		const vector = /* @__PURE__ */ new Map();
		let norm = 0;
		for (const [term, count] of tf) {
			const weight = count * (idf.get(term) ?? 0);
			vector.set(term, weight);
			norm += weight * weight;
		}
		const scale = Math.sqrt(norm) || 1;
		for (const [term, weight] of vector) vector.set(term, weight / scale);
		return vector;
	});
	const previous = vectors.slice(0, splitAt);
	const current = vectors.slice(splitAt);
	return previous.map((left) => current.map((right) => {
		let dot = 0;
		for (const [term, weight] of left) {
			const other = right.get(term);
			if (other) dot += weight * other;
		}
		return dot;
	}));
}
/** Ratcliff/Obershelp matching, matching Python's difflib.SequenceMatcher.ratio(). */
function sequenceMatcherRatio(a, b) {
	if (!a && !b) return 1;
	const total = a.length + b.length;
	if (total === 0) return 1;
	return 2 * matchingLength(a, b) / total;
}
function matchingLength(a, b) {
	if (!a.length || !b.length) return 0;
	const [i, j, size] = longestMatch(a, b);
	if (size === 0) return 0;
	return size + matchingLength(a.slice(0, i), b.slice(0, j)) + matchingLength(a.slice(i + size), b.slice(j + size));
}
function longestMatch(a, b) {
	let bestI = 0;
	let bestJ = 0;
	let bestSize = 0;
	const lengths = new Array(b.length + 1).fill(0);
	for (let i = 0; i < a.length; i += 1) {
		const next = new Array(b.length + 1).fill(0);
		for (let j = 0; j < b.length; j += 1) if (a[i] === b[j]) {
			next[j + 1] = lengths[j] + 1;
			if (next[j + 1] > bestSize) {
				bestSize = next[j + 1];
				bestI = i - bestSize + 1;
				bestJ = j - bestSize + 1;
			}
		}
		for (let k = 0; k < lengths.length; k += 1) lengths[k] = next[k];
	}
	return [
		bestI,
		bestJ,
		bestSize
	];
}
function nameSimilarity(previous, current) {
	const previousName = previous.normalizedName || normalizeText(previous.name);
	const currentName = current.normalizedName || normalizeText(current.name);
	if (!previousName || !currentName) return 0;
	const ratio = sequenceMatcherRatio(previousName, currentName);
	const previousTokens = new Set(previousName.split(" "));
	const currentTokens = new Set(currentName.split(" "));
	const intersection = [...previousTokens].filter((token) => currentTokens.has(token)).length;
	const union = (/* @__PURE__ */ new Set([...previousTokens, ...currentTokens])).size;
	const tokenScore = intersection / Math.max(union, 1);
	return round4(Math.max(ratio, tokenScore));
}
function workloadCompatibility(previousHours, currentHours) {
	if (previousHours === null || currentHours === null || currentHours <= 0) return null;
	if (previousHours >= currentHours) return 1;
	const ratio = previousHours / currentHours;
	if (ratio >= .8) return .8;
	if (ratio >= .6) return .5;
	return .2;
}
function creditCompatibility(previousCredits, currentCredits) {
	if (previousCredits === null || currentCredits === null || currentCredits <= 0) return null;
	if (previousCredits >= currentCredits) return 1;
	const ratio = previousCredits / currentCredits;
	if (ratio >= .8) return .8;
	if (ratio >= .6) return .5;
	return .2;
}
function contextScore(previous, current) {
	const previousText = normalizeText(`${previous.name} ${previous.syllabus ?? ""}`);
	const currentText = normalizeText(`${current.name} ${current.syllabus ?? ""}`);
	const advancedTerms = /* @__PURE__ */ new Set([
		"avancado",
		"ii",
		"iii",
		"iv"
	]);
	const introTerms = /* @__PURE__ */ new Set([
		"introducao",
		"basico",
		"fundamentos",
		"i"
	]);
	const previousTokens = new Set(previousText.split(" "));
	const currentTokens = new Set(currentText.split(" "));
	const previousIntro = [...previousTokens].some((token) => introTerms.has(token));
	const currentAdvanced = [...currentTokens].some((token) => advancedTerms.has(token));
	if (previousIntro && currentAdvanced) return .6;
	return 1;
}
function weightedScore(scores, weights) {
	const available = Object.entries(scores).filter(([, value]) => value !== null);
	const totalWeight = available.reduce((sum, [key]) => sum + (weights[key] ?? 0), 0);
	if (totalWeight === 0) return 0;
	return available.reduce((sum, [key, value]) => sum + value * (weights[key] ?? 0), 0) / totalWeight;
}
function finalScore(previous, current, semanticSimilarity, nameScore, workloadScore, creditScore, context) {
	const hasContent = Boolean(previous.syllabus || current.syllabus);
	let weights;
	let scores;
	if (hasContent && semanticSimilarity !== null) {
		weights = {
			semantic: .4,
			name: .25,
			workload: .2,
			credit: .1,
			context: .05
		};
		scores = {
			semantic: semanticSimilarity,
			name: nameScore,
			workload: workloadScore,
			credit: creditScore,
			context
		};
	} else {
		weights = {
			name: .6,
			workload: .3,
			context: .1
		};
		scores = {
			name: nameScore,
			workload: workloadScore,
			context
		};
	}
	let score = weightedScore(scores, weights);
	if (workloadScore === null) score *= .9;
	else if (workloadScore <= .5) score *= .85;
	return round4(Math.min(score, 1));
}
function classify(score) {
	if (score >= .85) return STRONG_EQUIVALENCY;
	if (score >= .7) return LIKELY_EQUIVALENCY;
	if (score >= .5) return PARTIAL_SIMILARITY;
	return NO_MATCH;
}
function requiresManualReview(classification, workloadScore) {
	if (classification === "likely_equivalency" || classification === "partial_similarity") return true;
	if (workloadScore === null) return true;
	return classification !== STRONG_EQUIVALENCY;
}
function comparePair(previous, current, semanticSimilarity) {
	const nameScore = nameSimilarity(previous, current);
	const workloadScore = workloadCompatibility(previous.workloadHours, current.workloadHours);
	const creditScore = creditCompatibility(previous.credits, current.credits);
	const score = finalScore(previous, current, semanticSimilarity, nameScore, workloadScore, creditScore, contextScore(previous, current));
	const classification = classify(score);
	return {
		previousSubject: previous,
		currentSubject: current,
		semanticSimilarity: semanticSimilarity === null ? null : round4(semanticSimilarity),
		nameSimilarity: nameScore,
		workloadScore,
		creditScore,
		finalScore: score,
		classification,
		requiresManualReview: requiresManualReview(classification, workloadScore),
		justification: null
	};
}
function matchSubjects(previousSubjects, currentSubjects, topN = 3) {
	if (!previousSubjects.length || !currentSubjects.length) return [];
	const semanticMatrix = subjectSimilarityMatrix(previousSubjects, currentSubjects);
	const matches = [];
	for (let i = 0; i < previousSubjects.length; i += 1) {
		const candidates = currentSubjects.map((current, j) => comparePair(previousSubjects[i], current, semanticMatrix[i][j]));
		candidates.sort((a, b) => b.finalScore - a.finalScore);
		matches.push(...candidates.slice(0, topN));
	}
	return matches;
}
var WORKLOAD_RE = /(?<hours>\d{1,4})\s*(?:h|horas|hrs)\b/i;
var CREDITS_RE = /(?<credits>\d+(?:[,.]\d+)?)\s*(?:cr[eé]ditos?|cred\.?)\b/i;
var SYLLABUS_RE = /^(?:conte[uú]do|ementa|programa|syllabus)\s*:\s*(?<value>.+)$/i;
var SUBJECT_LABEL_RE = /^(?:disciplina|subject|componente curricular)\s*:\s*(?<value>.+)$/i;
var CODE_TABLE_RE = /^(?<code>[A-Z]{2,5}\d{2,4})\s+(?<middle>.*?)\s*(?<hours>\d{1,4})h\s+(?<semester>\d+º)\s+(?<grade>-|\d+(?:,\d+)?)\s+(?<status>Aprovado|A cursar)\b(?<trailing>.*)$/i;
var SUBJECT_CODE_RE = /\b[A-Z]{2,5}[-\s]?\d{2,4}\b/;
var CONNECTOR_WORDS = /* @__PURE__ */ new Set([
	"e",
	"à",
	"a",
	"ao",
	"de",
	"da",
	"do",
	"das",
	"dos"
]);
var TABLE_HEADER_MARKERS = /* @__PURE__ */ new Set([
	"Código Disciplina CH Período Nota Situação",
	"resumida",
	"Ementa",
	"Histórico de disciplinas cursadas"
]);
var TABLE_END_MARKERS = /* @__PURE__ */ new Set(["Conteúdo programático simplificado", "Critérios sugeridos para análise de equivalência"]);
function extractWorkload(text) {
	const match = WORKLOAD_RE.exec(text);
	return match?.groups?.hours ? Number.parseInt(match.groups.hours, 10) : null;
}
function extractCredits(text) {
	const match = CREDITS_RE.exec(text);
	if (!match?.groups?.credits) return null;
	return Number.parseFloat(match.groups.credits.replace(",", "."));
}
function cleanSubjectName(text) {
	let value = text.replace(SUBJECT_LABEL_RE, "$<value>").trim();
	value = value.replace(WORKLOAD_RE, "");
	value = value.replace(CREDITS_RE, "");
	value = value.replace(/\s*[-–—|;]\s*$/u, "");
	value = value.split(/\s[-–—|]\s/u, 1)[0].trim();
	return value.replace(/\s+/g, " ").replace(/^[ ,\-–—|;]+|[ ,\-–—|;]+$/gu, "");
}
function isSubjectLine(line) {
	if (SYLLABUS_RE.test(line)) return false;
	return WORKLOAD_RE.test(line) || SUBJECT_LABEL_RE.test(line);
}
function analyzeLine(line, index) {
	return {
		text: line,
		index,
		hasSubjectCode: SUBJECT_CODE_RE.test(line),
		hasWorkload: WORKLOAD_RE.test(line),
		hasSyllabusLabel: SYLLABUS_RE.test(line),
		looksLikeTitle: Boolean(titlePrefix(line)),
		isTableBoundary: isTableEndLine(line) || shouldSkipTableLine(line)
	};
}
function analyzeLines(text) {
	return [...iterRelevantLines(text)].map((line, index) => analyzeLine(line, index));
}
function parseCsvSubjects(text, sourceDocument) {
	const rows = parseCsv(text);
	if (rows.length < 2) return [];
	const headers = rows[0];
	const fieldMap = new Map(headers.map((field) => [field.toLowerCase().trim(), field]));
	const nameKey = [...fieldMap.keys()].find((key) => [
		"name",
		"subject",
		"disciplina",
		"componente curricular"
	].includes(key));
	if (!nameKey) return [];
	const nameHeader = fieldMap.get(nameKey);
	if (!nameHeader) return [];
	const subjects = [];
	for (const row of rows.slice(1)) {
		const record = {};
		headers.forEach((header, index) => {
			record[header] = row[index] ?? "";
		});
		const name = (record[nameHeader] || "").trim();
		if (!name) continue;
		const workload = firstPresent(record, fieldMap, [
			"workload_hours",
			"workload",
			"carga horaria",
			"carga_horaria",
			"horas"
		]);
		const credits = firstPresent(record, fieldMap, [
			"credits",
			"creditos",
			"créditos"
		]);
		const syllabus = firstPresent(record, fieldMap, [
			"syllabus",
			"ementa",
			"conteudo",
			"conteúdo"
		]);
		const joined = Object.values(record).join(",");
		subjects.push(createSubject({
			name,
			sourceDocument,
			workloadHours: workload ? extractWorkload(String(workload)) : extractWorkload(joined),
			credits: credits ? extractCredits(String(credits)) : extractCredits(joined),
			syllabus: syllabus ? String(syllabus).trim() : null,
			rawText: Object.entries(record).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(", ")
		}));
	}
	return subjects;
}
function firstPresent(row, fieldMap, names) {
	for (const [normalized, original] of fieldMap) if (names.includes(normalized) && row[original]) return row[original];
	return null;
}
function parseTextSubjects(text, sourceDocument) {
	const subjects = [];
	let current = null;
	for (const line of iterRelevantLines(text)) {
		const syllabusMatch = SYLLABUS_RE.exec(line);
		if (syllabusMatch && current) {
			current.syllabus = appendText(current.syllabus, syllabusMatch.groups?.value ?? "");
			current.rawText = appendText(current.rawText, line);
			continue;
		}
		if (isSubjectLine(line)) {
			if (current) subjects.push(buildSubject(current, sourceDocument));
			current = {
				name: cleanSubjectName(line),
				workloadHours: extractWorkload(line),
				credits: extractCredits(line),
				rawText: line
			};
			continue;
		}
		if (current) {
			current.rawText = appendText(current.rawText, line);
			if (line.split(/\s+/).length > 4) current.syllabus = appendText(current.syllabus, line);
		}
	}
	if (current) subjects.push(buildSubject(current, sourceDocument));
	return subjects.filter((subject) => subject.name);
}
function parseCodeTableSubjects(text, sourceDocument) {
	const lines = analyzeLines(text).map((line) => line.text);
	const codeRows = [];
	lines.forEach((line, index) => {
		const match = CODE_TABLE_RE.exec(line);
		if (match) codeRows.push({
			index,
			match
		});
	});
	if (!codeRows.length) return [];
	const subjects = [];
	codeRows.forEach((row, rowNumber) => {
		const previousBoundary = rowNumber > 0 ? codeRows[rowNumber - 1].index : -1;
		const nextCodeBoundary = rowNumber + 1 < codeRows.length ? codeRows[rowNumber + 1].index : lines.length;
		const nextBoundary = Math.min(nextCodeBoundary, nextTableEndIndex(lines, row.index, nextCodeBoundary));
		const beforeLines = lines.slice(previousBoundary + 1, row.index);
		const afterLines = lines.slice(row.index + 1, nextBoundary);
		const nameParts = collectNameParts(beforeLines, row.match.groups?.middle ?? "", afterLines);
		const name = nameParts.filter(Boolean).join(" ").trim() || row.match.groups?.code || "";
		const syllabusParts = collectSyllabusParts(beforeLines, row.match.groups?.trailing ?? "", afterLines, nameParts);
		const gradeRaw = row.match.groups?.grade ?? "-";
		subjects.push(createSubject({
			name,
			sourceDocument,
			workloadHours: Number.parseInt(row.match.groups?.hours ?? "0", 10),
			semester: row.match.groups?.semester ?? null,
			status: row.match.groups?.status ?? null,
			grade: gradeRaw === "-" ? null : gradeRaw.replace(",", "."),
			syllabus: syllabusParts.join(" ") || null,
			rawText: lines.slice(previousBoundary + 1, nextBoundary).join(" ")
		}));
	});
	return subjects;
}
function collectNameParts(beforeLines, middle, afterLines) {
	const parts = [];
	const before = titlePrefix(lastContentLine(beforeLines));
	const middleName = cleanInlineName(middle);
	const after = titlePrefix(firstContentLine(afterLines));
	const shouldUseBefore = !middleName || middleName.split(" ").length === 1 || CONNECTOR_WORDS.has(middleName.split(" ").at(-1)?.toLowerCase() ?? "");
	const shouldUseAfter = shouldUseBefore;
	if (before && shouldUseBefore) parts.push(before);
	if (middleName && !parts.includes(middleName)) parts.push(middleName);
	if (after && shouldUseAfter && !parts.includes(after)) parts.push(after);
	return parts;
}
function collectSyllabusParts(beforeLines, trailing, afterLines, nameParts) {
	const nameValues = new Set(nameParts);
	const parts = [];
	const extra = trailing.trim() ? [trailing.trim()] : [];
	for (const line of [
		...beforeLines,
		...extra,
		...afterLines
	]) {
		if (shouldSkipTableLine(line)) continue;
		const prefix = titlePrefix(line);
		let cleaned = line;
		if (nameValues.has(prefix)) cleaned = line.slice(prefix.length).replace(/^[ ,\-;]+/, "").trim();
		if (cleaned && !nameValues.has(cleaned)) parts.push(cleaned);
	}
	return parts;
}
function lastContentLine(lines) {
	for (let i = lines.length - 1; i >= 0; i -= 1) if (!shouldSkipTableLine(lines[i]) && titlePrefix(lines[i])) return lines[i];
	return "";
}
function firstContentLine(lines) {
	for (const line of lines.slice(0, 3)) if (!shouldSkipTableLine(line) && titlePrefix(line)) return line;
	return "";
}
function titlePrefix(line) {
	const words = line.trim().split(/\s+/);
	const selected = [];
	for (let index = 0; index < words.length; index += 1) {
		const cleaned = words[index].replace(/^[ ,.;:()]+|[ ,.;:()]+$/g, "");
		if (!cleaned) continue;
		const startsUpper = cleaned[0] === cleaned[0].toUpperCase() && cleaned[0] !== cleaned[0].toLowerCase();
		const isConnector = CONNECTOR_WORDS.has(cleaned.toLowerCase());
		const nextRaw = words[index + 1]?.replace(/^[ ,.;:()]+|[ ,.;:()]+$/g, "") ?? "";
		const nextStartsUpper = nextRaw.length > 0 && nextRaw[0] === nextRaw[0].toUpperCase() && nextRaw[0] !== nextRaw[0].toLowerCase();
		if (startsUpper || selected.length && isConnector || isConnector && nextStartsUpper) {
			selected.push(cleaned);
			continue;
		}
		break;
	}
	return selected.join(" ");
}
function cleanInlineName(value) {
	return titlePrefix(value.replace(/^[ ,\-;]+|[ ,\-;]+$/g, "")) || "";
}
function shouldSkipTableLine(line) {
	return !line.trim() || TABLE_HEADER_MARKERS.has(line.trim());
}
function nextTableEndIndex(lines, start, fallback) {
	for (let index = start + 1; index < fallback; index += 1) if (isTableEndLine(lines[index])) return index;
	return fallback;
}
function isTableEndLine(line) {
	const normalized = normalizeText(line);
	return [...TABLE_END_MARKERS].some((marker) => normalized === normalizeText(marker));
}
function* iterRelevantLines(text) {
	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (line) yield line;
	}
}
function appendText(existing, value) {
	if (!existing) return value.trim();
	return `${existing} ${value.trim()}`;
}
function buildSubject(data, sourceDocument) {
	return createSubject({
		name: String(data.name ?? "").trim(),
		sourceDocument,
		workloadHours: typeof data.workloadHours === "number" ? data.workloadHours : null,
		credits: typeof data.credits === "number" ? data.credits : null,
		syllabus: data.syllabus ? String(data.syllabus).trim() : null,
		rawText: data.rawText ? String(data.rawText).trim() : null
	});
}
function parseCsv(text) {
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		if (quoted) {
			if (char === "\"") {
				if (text[i + 1] === "\"") {
					cell += "\"";
					i += 1;
				} else quoted = false;
			} else cell += char;
			continue;
		}
		if (char === "\"") quoted = true;
		else if (char === ",") {
			row.push(cell);
			cell = "";
		} else if (char === "\n") {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else if (char !== "\r") cell += char;
	}
	if (cell.length || row.length) {
		row.push(cell);
		rows.push(row);
	}
	return rows.filter((entry) => entry.some((value) => value.trim()));
}
var PARSE_STRATEGIES = [
	parseCsvSubjects,
	parseCodeTableSubjects,
	parseTextSubjects
];
function parseSubjects(text, sourceDocument) {
	for (const strategy of PARSE_STRATEGIES) {
		const subjects = strategy(text, sourceDocument);
		if (subjects.length) {
			const normalized = normalizeSubjects(subjects);
			if (normalized.length > 500) throw new Error(`Limite excedido: no máximo 500 disciplinas por documento.`);
			return normalized;
		}
	}
	return [];
}
function matchAlerts(match) {
	const alerts = [];
	const previousHours = match.previousSubject.workloadHours;
	const currentHours = match.currentSubject.workloadHours;
	if (match.nameSimilarity >= .8 && previousHours !== null && currentHours !== null && previousHours < currentHours) alerts.push("Nome muito similar e carga menor");
	if (match.workloadScore === null) alerts.push("Carga não identificada");
	else if (match.workloadScore <= .2) alerts.push("Carga insuficiente");
	else if (match.workloadScore <= .5) alerts.push("Carga significativamente menor");
	else if (match.workloadScore < 1) alerts.push("Carga um pouco menor");
	if (match.finalScore >= .85) alerts.push("Boa similaridade");
	else if (match.finalScore < .5) alerts.push("Sem match forte");
	if (match.requiresManualReview && match.finalScore >= .7) alerts.push("Revisar escopo");
	return alerts.length ? alerts : ["Sem alerta específico"];
}
function matchPriority(match) {
	if (new Set(matchAlerts(match)).has("Nome muito similar e carga menor")) return "Alta";
	if (match.finalScore >= .7 && match.requiresManualReview) return "Alta";
	if (match.finalScore >= .5) return "Média";
	return "Baixa";
}
function formatPercent(value) {
	if (value === null || Number.isNaN(value)) return "";
	return `${(value * 100).toFixed(2)}%`;
}
function formatOptionalScore(value) {
	if (value === null || Number.isNaN(value)) return "";
	return value.toFixed(2);
}
function classificationLabel(classification) {
	return CLASSIFICATION_LABELS_PT[classification] ?? classification;
}
function conciseJustification(match) {
	const parts = [`Similaridade do nome: ${match.nameSimilarity.toFixed(2)}.`, `Pontuação final: ${match.finalScore.toFixed(2)}.`];
	if (match.semanticSimilarity !== null) parts.push(`Similaridade de conteúdo: ${match.semanticSimilarity.toFixed(2)}.`);
	if (match.workloadScore === null) parts.push("Carga horária ausente em ao menos uma disciplina; revisão manual recomendada.");
	else if (match.workloadScore < .8) parts.push("A carga horária anterior é inferior à atual, reduzindo a confiança.");
	return parts.join(" ");
}
function matchesToRows(matches) {
	return matches.map((match, index) => {
		const alerts = matchAlerts(match);
		return {
			id: `${index}-${match.previousSubject.name}-${match.currentSubject.name}`,
			selected: false,
			previousName: sanitizeSpreadsheetCell(match.previousSubject.name),
			previousHours: match.previousSubject.workloadHours,
			currentName: sanitizeSpreadsheetCell(match.currentSubject.name),
			currentHours: match.currentSubject.workloadHours,
			priority: matchPriority(match),
			alerts: alerts.join(" | "),
			alertList: alerts,
			workloadScore: match.workloadScore,
			workloadScoreLabel: formatOptionalScore(match.workloadScore),
			creditScore: match.creditScore,
			creditScoreLabel: formatOptionalScore(match.creditScore),
			semanticSimilarity: match.semanticSimilarity,
			semanticLabel: formatOptionalScore(match.semanticSimilarity),
			nameSimilarity: match.nameSimilarity,
			nameSimilarityLabel: formatOptionalScore(match.nameSimilarity),
			equivalency: match.finalScore,
			equivalencyPercent: formatPercent(match.finalScore),
			equivalencyScoreLabel: formatOptionalScore(match.finalScore),
			classification: match.classification,
			classificationLabel: classificationLabel(match.classification),
			manualReview: match.requiresManualReview,
			manualReviewLabel: match.requiresManualReview ? "Sim" : "Não",
			reviewerNote: "",
			justification: match.justification || conciseJustification(match)
		};
	});
}
function sanitizeSpreadsheetCell(value) {
	if (typeof value !== "string") return value == null ? "" : String(value);
	const collapsed = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[\uFEFF\u200B\u200C\u200D]/g, "").replace(/[\r\n\t]+/g, " ");
	const leading = collapsed.replace(/^\s+/, "");
	if (/^[=+\-@]/.test(leading)) return `'${leading}`;
	return collapsed;
}
function sanitizeFilename(name, fallback = "arquivo") {
	return (name.split(/[/\\]/).pop() ?? name).replace(/[^\w.\-]+/gu, "_").replace(/^\.+/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || fallback;
}
function subjectKey(name, workload) {
	const hours = workload === null || workload === void 0 || Number.isNaN(Number(workload)) ? "" : String(workload).trim();
	return `${String(name ?? "").trim().toLowerCase()}|${hours}`;
}
function subjectsWithoutSelectedMatch(subjects, selected, side) {
	const keys = new Set(selected.map((row) => side === "previous" ? subjectKey(row.previousName.replace(/^'/, ""), row.previousHours) : subjectKey(row.currentName.replace(/^'/, ""), row.currentHours)));
	return subjects.filter((subject) => !keys.has(subjectKey(subject.name, subject.workloadHours)));
}
var SAMPLE_PREVIOUS = `Estatistica Descritiva - 80h
Conteudo: medidas de tendencia central, dispersao, graficos, distribuicao de frequencia.

Banco de Dados - 40h
Conteudo: modelo relacional, SQL basico.

Bioquimica Metabolica - 80h
Conteudo: enzimas e metabolismo energetico.

Anatomia Humana - 80h
Conteudo: sistemas orgânicos, ossos, músculos e introdução à dissecação.

Comunicacao Empresarial - 40h
Conteudo: redacao corporativa, apresentacoes e comunicacao oral.

Farmacologia Geral - 80h
Conteudo: dose-resposta, receptores e efeitos adversos.
`;
var SAMPLE_CURRENT = `Estatistica I - 80h
Conteudo: estatistica descritiva, media, mediana, variancia, desvio padrao e graficos.

Banco de Dados Avancado - 80h
Conteudo: modelagem relacional, SQL avancado, otimizacao, transacoes, indices.

Bioquimica Geral - 80h
Conteudo: enzimas, vias metabolicas e bioenergetica.

Anatomia Humana - 100h
Conteudo: anatomia sistemica, osteologia e miologia.

Calculo Diferencial e Integral - 80h
Conteudo: limites, derivadas, integrais e aplicacoes.

Hematologia Básica - 80h
Conteudo: series sanguineas, coagulacao e interpretacao de hemograma.
`;
function subjectsToReview(subjects) {
	return subjects.map((subject) => ({
		name: subject.name,
		workloadHours: subject.workloadHours
	}));
}
function applyReview(original, review, fallbackSource) {
	const subjects = [];
	review.forEach((row, index) => {
		const name = cleanOptionalText(row.name);
		if (!name) return;
		const base = original[index];
		subjects.push(createSubject({
			name,
			sourceDocument: base?.sourceDocument || fallbackSource,
			workloadHours: cleanOptionalInt(row.workloadHours),
			credits: base?.credits ?? null,
			semester: base?.semester ?? null,
			status: base?.status ?? null,
			grade: base?.grade ?? null,
			syllabus: base?.syllabus ?? null,
			rawText: base?.rawText ?? null
		}));
	});
	return normalizeSubjects(subjects);
}
function cleanOptionalText(value) {
	if (value === null || value === void 0) return null;
	return String(value).trim() || null;
}
function cleanOptionalInt(value) {
	if (value === null || value === void 0 || value === "") return null;
	const parsed = Number.parseInt(String(value).replace(",", "."), 10);
	return Number.isFinite(parsed) ? parsed : null;
}
var emptyReview = {
	name: "",
	workloadHours: null
};
var useComparisonStore = create((set, get) => ({
	step: "upload",
	previousFile: null,
	currentFile: null,
	previousSource: "documento_anterior",
	currentSource: "documento_atual",
	previousSubjects: [],
	currentSubjects: [],
	previousReview: [],
	currentReview: [],
	rows: [],
	error: null,
	busy: false,
	classifications: [],
	selectedAlerts: [],
	onlyManual: false,
	sortMode: "Prioridade",
	setPreviousFile: (file) => set({
		previousFile: file,
		error: null
	}),
	setCurrentFile: (file) => set({
		currentFile: file,
		error: null
	}),
	loadSample: () => {
		const previous = parseSubjects(SAMPLE_PREVIOUS, "historico-origem.txt");
		const current = parseSubjects(SAMPLE_CURRENT, "matriz-destino.txt");
		set({
			previousFile: {
				name: "historico-origem.txt",
				bytes: new TextEncoder().encode(SAMPLE_PREVIOUS)
			},
			currentFile: {
				name: "matriz-destino.txt",
				bytes: new TextEncoder().encode(SAMPLE_CURRENT)
			},
			previousSource: "historico-origem.txt",
			currentSource: "matriz-destino.txt",
			previousSubjects: previous,
			currentSubjects: current,
			previousReview: subjectsToReview(previous),
			currentReview: subjectsToReview(current),
			rows: [],
			error: null,
			step: "review"
		});
	},
	extract: async () => {
		const { previousFile, currentFile } = get();
		if (!previousFile || !currentFile) {
			set({ error: "Envie os dois documentos para extrair as disciplinas." });
			return;
		}
		set({
			busy: true,
			error: null
		});
		try {
			const [previousDoc, currentDoc] = await Promise.all([loadDocument(previousFile, "documento_anterior"), loadDocument(currentFile, "documento_atual")]);
			const previousSubjects = parseSubjects(previousDoc.text, previousDoc.filename);
			const currentSubjects = parseSubjects(currentDoc.text, currentDoc.filename);
			if (!previousSubjects.length) throw new Error("Nenhuma disciplina foi encontrada no documento anterior.");
			if (!currentSubjects.length) throw new Error("Nenhuma disciplina foi encontrada no documento atual.");
			set({
				previousSource: previousDoc.filename,
				currentSource: currentDoc.filename,
				previousSubjects,
				currentSubjects,
				previousReview: subjectsToReview(previousSubjects),
				currentReview: subjectsToReview(currentSubjects),
				rows: [],
				step: "review",
				busy: false
			});
		} catch (error) {
			set({
				error: error instanceof TextExtractionError ? friendlyExtractionError(error) : error instanceof Error ? error.message : "Não foi possível extrair as disciplinas.",
				busy: false
			});
		}
	},
	updatePreviousReview: (index, patch) => set((state) => ({ previousReview: state.previousReview.map((row, i) => i === index ? {
		...row,
		...patch
	} : row) })),
	updateCurrentReview: (index, patch) => set((state) => ({ currentReview: state.currentReview.map((row, i) => i === index ? {
		...row,
		...patch
	} : row) })),
	addPreviousRow: () => set((state) => ({ previousReview: [...state.previousReview, { ...emptyReview }] })),
	addCurrentRow: () => set((state) => ({ currentReview: [...state.currentReview, { ...emptyReview }] })),
	removePreviousRow: (index) => set((state) => ({ previousReview: state.previousReview.filter((_, i) => i !== index) })),
	removeCurrentRow: (index) => set((state) => ({ currentReview: state.currentReview.filter((_, i) => i !== index) })),
	compare: () => {
		const { previousSubjects, currentSubjects, previousReview, currentReview, previousSource, currentSource } = get();
		try {
			const previous = applyReview(previousSubjects, previousReview, previousSource);
			const current = applyReview(currentSubjects, currentReview, currentSource);
			if (!previous.length) throw new Error("Nenhuma disciplina valida foi mantida no documento anterior.");
			if (!current.length) throw new Error("Nenhuma disciplina valida foi mantida no documento atual.");
			set({
				previousSubjects: previous,
				currentSubjects: current,
				rows: matchesToRows(matchSubjects(previous, current)),
				classifications: [],
				selectedAlerts: [],
				onlyManual: false,
				step: "results",
				error: null
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : "Não foi possível comparar as disciplinas." });
		}
	},
	setRowSelected: (id, selected) => set((state) => ({ rows: state.rows.map((row) => row.id === id ? {
		...row,
		selected
	} : row) })),
	setRowNote: (id, note) => set((state) => ({ rows: state.rows.map((row) => row.id === id ? {
		...row,
		reviewerNote: note
	} : row) })),
	setClassifications: (values) => set({ classifications: values }),
	toggleAlert: (alert) => set((state) => ({ selectedAlerts: state.selectedAlerts.includes(alert) ? state.selectedAlerts.filter((item) => item !== alert) : [...state.selectedAlerts, alert] })),
	setOnlyManual: (value) => set({ onlyManual: value }),
	setSortMode: (mode) => set({ sortMode: mode }),
	goTo: (step) => set({
		step,
		error: null
	}),
	reset: () => set({
		step: "upload",
		previousFile: null,
		currentFile: null,
		previousSubjects: [],
		currentSubjects: [],
		previousReview: [],
		currentReview: [],
		rows: [],
		error: null,
		busy: false,
		classifications: [],
		selectedAlerts: [],
		onlyManual: false,
		sortMode: "Prioridade"
	})
}));
var SUMMARY_HEADERS = [
	"Selecionar",
	"Disciplina anterior",
	"CH anterior",
	"Disciplina atual",
	"CH atual",
	"Prioridade",
	"Alertas",
	"Compatibilidade CH",
	"Equivalência",
	"Classificação",
	"Revisão manual",
	"Observação do revisor"
];
var DETAILED_HEADERS = [
	...SUMMARY_HEADERS,
	"Similaridade semântica",
	"Similaridade do nome",
	"Compatibilidade créditos",
	"Justificativa"
];
function summaryRow(row) {
	return [
		row.selected,
		sanitizeSpreadsheetCell(row.previousName),
		row.previousHours,
		sanitizeSpreadsheetCell(row.currentName),
		row.currentHours,
		sanitizeSpreadsheetCell(row.priority),
		sanitizeSpreadsheetCell(row.alerts),
		row.workloadScoreLabel,
		row.equivalencyPercent,
		sanitizeSpreadsheetCell(row.classificationLabel),
		row.manualReviewLabel,
		sanitizeSpreadsheetCell(row.reviewerNote)
	];
}
function detailedRow(row) {
	return [
		...summaryRow(row),
		row.semanticLabel,
		row.nameSimilarityLabel,
		row.creditScoreLabel,
		sanitizeSpreadsheetCell(row.justification)
	];
}
async function workbookToBytes(workbook) {
	const buffer = await workbook.xlsx.writeBuffer();
	return new Uint8Array(buffer);
}
function addSheet(workbook, name, headers, rows) {
	const sheet = workbook.addWorksheet(name.slice(0, 31));
	sheet.addRow(headers);
	for (const row of rows) sheet.addRow(row.map((cell) => {
		if (typeof cell === "string") return sanitizeSpreadsheetCell(cell);
		if (cell === null) return "";
		return cell;
	}));
}
async function rowsToSummaryXlsx(rows) {
	const workbook = new import_excel.default.Workbook();
	addSheet(workbook, "equivalencias", SUMMARY_HEADERS, rows.map(summaryRow));
	return workbookToBytes(workbook);
}
async function rowsToDetailedXlsx(rows) {
	const workbook = new import_excel.default.Workbook();
	addSheet(workbook, "equivalencias", DETAILED_HEADERS, rows.map(detailedRow));
	return workbookToBytes(workbook);
}
async function finalReviewReportToXlsx(selected, previousSubjects, currentSubjects) {
	const previousWithout = subjectsWithoutSelectedMatch(previousSubjects, selected, "previous");
	const currentUnused = subjectsWithoutSelectedMatch(currentSubjects, selected, "current");
	const workbook = new import_excel.default.Workbook();
	addSheet(workbook, "matches_selecionados", SUMMARY_HEADERS, selected.map(summaryRow));
	addSheet(workbook, "anteriores_sem_match", UNMATCHED_HEADERS, previousWithout.map(unmatchedRow));
	addSheet(workbook, "atuais_nao_usadas", UNMATCHED_HEADERS, currentUnused.map(unmatchedRow));
	return workbookToBytes(workbook);
}
var UNMATCHED_HEADERS = [
	"Disciplina",
	"Carga horária",
	"Documento fonte",
	"Ementa"
];
function unmatchedRow(subject) {
	return [
		sanitizeSpreadsheetCell(subject.name),
		subject.workloadHours,
		sanitizeSpreadsheetCell(subject.sourceDocument),
		sanitizeSpreadsheetCell(subject.syllabus ?? "")
	];
}
function workloadDifference(previous, current) {
	const previousNumber = parseNumber(previous);
	const currentNumber = parseNumber(current);
	if (previousNumber === null || currentNumber === null) return "Não calculada";
	const difference = previousNumber - currentNumber;
	if (difference > 0) return `+${formatHours(difference)}h`;
	return `${formatHours(difference)}h`;
}
function formatHours(value) {
	return Number.isInteger(value) ? String(value) : String(value);
}
function parseNumber(value) {
	if (value === null || value === void 0 || value === "") return null;
	const parsed = Number.parseFloat(String(value).replace(",", "."));
	return Number.isFinite(parsed) ? parsed : null;
}
var PAGE_WIDTH = 841.89;
var PAGE_HEIGHT = 595.28;
var MARGIN = 34;
async function generateSelectedPdfReport(selected, previousSubjects, currentSubjects, previousSource = "Documento anterior", currentSource = "Documento atual") {
	const previousWithout = subjectsWithoutSelectedMatch(previousSubjects, selected, "previous");
	const currentUnused = subjectsWithoutSelectedMatch(currentSubjects, selected, "current");
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	let y = 561.28;
	y = drawHeader(page, font, bold, y, previousSource, currentSource);
	y = drawSummary(page, font, bold, y, selected, previousWithout, currentUnused);
	y = drawSectionTitle(page, bold, y, "Matches selecionados pela pessoa revisora");
	if (!selected.length) y = drawText(page, font, y, "Nenhum match foi selecionado.");
	else y = drawMatchTable(pdf, page, font, bold, y, selected);
	page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	y = 561.28;
	y = drawSectionTitle(page, bold, y, "Disciplinas anteriores sem match selecionado");
	y = drawSubjectTable(page, font, bold, y, previousWithout);
	y -= 16;
	y = drawSectionTitle(page, bold, y, "Disciplinas atuais não usadas nos matches selecionados");
	drawSubjectTable(page, font, bold, y, currentUnused);
	drawFooters(pdf, font);
	return pdf.save();
}
function drawHeader(page, font, bold, y, previousSource, currentSource) {
	const generatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	});
	page.drawText("Relatório de análise de equivalência acadêmica", {
		x: MARGIN,
		y,
		size: 16,
		font: bold,
		color: ink
	});
	y -= 22;
	y = drawText(page, font, y, `Gerado em: ${generatedAt}`, 8);
	y = drawText(page, font, y, `Documento anterior: ${previousSource}`, 8);
	y = drawText(page, font, y, `Documento atual: ${currentSource}`, 8);
	y -= 4;
	return drawWrapped(page, font, y, DISCLAIMER_PT, 8, 773.89) - 8;
}
function drawSummary(page, font, bold, y, selected, previousWithout, currentUnused) {
	y = drawSectionTitle(page, bold, y, "Resumo");
	const manualCount = selected.filter((row) => row.manualReview).length;
	const headers = [
		"Matches selecionados",
		"Anteriores sem match",
		"Atuais não usadas",
		"Selecionados com revisão manual"
	];
	const values = [
		String(selected.length),
		String(previousWithout.length),
		String(currentUnused.length),
		String(manualCount)
	];
	const col = 180;
	headers.forEach((header, index) => {
		page.drawText(header, {
			x: MARGIN + index * col,
			y,
			size: 8,
			font: bold,
			color: ink
		});
	});
	y -= 14;
	values.forEach((value, index) => {
		page.drawText(value, {
			x: MARGIN + index * col,
			y,
			size: 10,
			font,
			color: ink
		});
	});
	return y - 18;
}
function drawMatchTable(pdf, startPage, font, bold, startY, rows) {
	const headers = [
		"Disciplina anterior",
		"CH ant.",
		"Disciplina atual",
		"CH at.",
		"Dif. CH",
		"Equivalência",
		"Classificação",
		"Alertas",
		"Observação"
	];
	const widths = [
		110,
		42,
		110,
		42,
		48,
		70,
		110,
		130,
		130
	];
	let page = startPage;
	let y = startY;
	y = drawTableHeader(page, bold, y, headers, widths);
	for (const row of rows) {
		const cells = [
			row.previousName,
			row.previousHours == null ? "" : String(row.previousHours),
			row.currentName,
			row.currentHours == null ? "" : String(row.currentHours),
			workloadDifference(row.previousHours, row.currentHours),
			row.equivalencyPercent,
			row.classificationLabel,
			row.alerts,
			row.reviewerNote
		];
		const height = Math.max(22, ...cells.map((cell, index) => wrappedHeight(font, cell, widths[index] - 6, 7)));
		if (y - height < 36) {
			page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
			y = 561.28;
			y = drawTableHeader(page, bold, y, headers, widths);
		}
		drawRow(page, font, y, cells, widths, height);
		y -= height;
	}
	return y;
}
function drawSubjectTable(page, font, bold, y, subjects) {
	if (!subjects.length) return drawText(page, font, y, "Nenhuma disciplina nesta seção.");
	const widths = [420, 80];
	y = drawTableHeader(page, bold, y, ["Disciplina", "Carga horária"], widths);
	for (const subject of subjects) {
		const height = 18;
		drawRow(page, font, y, [subject.name, subject.workloadHours == null ? "" : String(subject.workloadHours)], widths, height);
		y -= height;
	}
	return y;
}
function drawTableHeader(page, bold, y, headers, widths) {
	drawRow(page, bold, y, headers, widths, 18, true);
	return y - 18;
}
function drawRow(page, font, y, cells, widths, height, header = false) {
	let x = MARGIN;
	page.drawRectangle({
		x: 32,
		y: y - height + 10,
		width: widths.reduce((sum, width) => sum + width, 0) + 4,
		height,
		color: header ? rgb(.9, .905, .91) : rgb(1, 1, 1),
		borderColor: rgb(.8, .83, .86),
		borderWidth: .4
	});
	cells.forEach((cell, index) => {
		wrapText(font, cell, widths[index] - 6, 7).slice(0, 3).forEach((line, lineIndex) => {
			page.drawText(line, {
				x: x + 3,
				y: y - 2 - lineIndex * 8,
				size: 7,
				font,
				color: ink
			});
		});
		x += widths[index];
	});
}
function drawSectionTitle(page, bold, y, text) {
	page.drawText(text, {
		x: MARGIN,
		y,
		size: 11,
		font: bold,
		color: ink
	});
	return y - 16;
}
function drawText(page, font, y, text, size = 8) {
	page.drawText(winAnsi(text), {
		x: MARGIN,
		y,
		size,
		font,
		color: ink
	});
	return y - size - 4;
}
function drawWrapped(page, font, y, text, size, width) {
	wrapText(font, text, width, size).forEach((line) => {
		page.drawText(line, {
			x: MARGIN,
			y,
			size,
			font,
			color: ink
		});
		y -= size + 3;
	});
	return y;
}
function wrapText(font, text, width, size) {
	const words = winAnsi(text || " ").split(/\s+/);
	const lines = [];
	let current = "";
	for (const word of words) {
		const next = current ? `${current} ${word}` : word;
		if (font.widthOfTextAtSize(next, size) > width && current) {
			lines.push(current);
			current = word;
		} else current = next;
	}
	if (current) lines.push(current);
	return lines.length ? lines : [" "];
}
function wrappedHeight(font, text, width, size) {
	return Math.max(18, wrapText(font, text, width, size).length * (size + 3) + 6);
}
function drawFooters(pdf, font) {
	pdf.getPages().forEach((page, index) => {
		page.drawText("Relatório automatizado para apoio à revisão acadêmica. Não representa decisão oficial.", {
			x: MARGIN,
			y: 16,
			size: 7,
			font,
			color: rgb(.39, .45, .55)
		});
		page.drawText(`Página ${index + 1}`, {
			x: 757.89,
			y: 16,
			size: 7,
			font,
			color: rgb(.39, .45, .55)
		});
	});
}
var ink = rgb(.11, .1, .09);
function winAnsi(value) {
	return value.replace(/[^\x20-\x7EÀ-ÿºª€]/g, (char) => {
		return {
			"—": "-",
			"–": "-",
			"“": "\"",
			"”": "\"",
			"‘": "'",
			"’": "'"
		}[char] ?? char.normalize("NFKD").replace(/\p{M}/gu, "");
	});
}
var STEPS = [
	{
		id: "upload",
		label: "Enviar"
	},
	{
		id: "review",
		label: "Revisar"
	},
	{
		id: "results",
		label: "Resultado"
	}
];
function filterRows(rows, classifications, selectedAlerts, onlyManual, sortMode) {
	const filtered = rows.filter((row) => {
		if (classifications.length && !classifications.includes(row.classificationLabel)) return false;
		if (onlyManual && !row.manualReview) return false;
		if (selectedAlerts.length && !selectedAlerts.some((alert) => row.alertList.includes(alert))) return false;
		return true;
	});
	const rank = {
		Alta: 0,
		Média: 1,
		Baixa: 2
	};
	return [...filtered].sort((a, b) => {
		if (sortMode === "Prioridade") {
			const delta = (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
			if (delta !== 0) return delta;
		}
		return b.equivalency - a.equivalency;
	});
}
function downloadBytes(bytes, filename, mime) {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const blob = new Blob([copy], { type: mime });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = sanitizeFilename(filename, "relatorio");
	link.click();
	URL.revokeObjectURL(url);
}
function ComparisonApp() {
	const store = useComparisonStore();
	const visible = filterRows(store.rows, store.classifications, store.selectedAlerts, store.onlyManual, store.sortMode);
	const selected = store.rows.filter((row) => row.selected);
	const allClassifications = [...new Set(store.rows.map((row) => row.classificationLabel))];
	const allAlerts = [...new Set(store.rows.flatMap((row) => row.alertList))].sort();
	const strong = store.rows.filter((row) => row.classification === "strong_equivalency").length;
	const likely = store.rows.filter((row) => row.classification === "likely_equivalency").length;
	const manual = store.rows.filter((row) => row.manualReview).length;
	const none = store.rows.filter((row) => row.classification === "no_match").length;
	async function downloadPdf() {
		try {
			downloadBytes(await generateSelectedPdfReport(selected, store.previousSubjects, store.currentSubjects, store.previousSource, store.currentSource), "relatorio_equivalencias_selecionadas.pdf", "application/pdf");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Não foi possível gerar o PDF.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border bg-bg-elevated",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.22em] text-accent uppercase",
						children: "Análise acadêmica"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-4xl font-medium tracking-tight text-fg",
						children: "Equivalência"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: "Compare disciplinas entre dois documentos e gere uma tabela ranqueada para revisão humana."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "flex list-none gap-2 p-0",
					children: STEPS.map((step, index) => {
						const active = store.step === step.id;
						const done = STEPS.findIndex((item) => item.id === store.step) > index;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: step.id === "review" ? store.previousReview.length === 0 : step.id === "results" ? store.rows.length === 0 : false,
							onClick: () => store.goTo(step.id),
							className: cn("flex h-11 items-center gap-2 rounded-full px-3 text-sm", active ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums",
									children: index + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step.label }),
								done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "concluído"
								}) : null
							]
						}) }, step.id);
					})
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6",
			children: [
				store.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-danger/10 px-4 py-3 text-sm text-danger",
					role: "alert",
					children: store.error
				}) : null,
				store.step === "upload" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							className: "text-sm text-muted",
							children: DISCLAIMER_PT
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dropzone, {
								label: "Documento anterior",
								hint: "PDF, XLSX, CSV ou TXT",
								fileName: store.previousFile?.name ?? null,
								onFile: store.setPreviousFile
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dropzone, {
								label: "Documento atual",
								hint: "PDF, XLSX, CSV ou TXT",
								fileName: store.currentFile?.name ?? null,
								onFile: store.setCurrentFile
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row sm:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								onClick: () => void store.extract(),
								disabled: !store.previousFile || !store.currentFile || store.busy,
								children: [store.busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Extrair disciplinas"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: store.loadSample,
								children: "Carregar exemplo"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "PDFs precisam ter texto selecionável. OCR de documentos escaneados fica fora deste recorte."
						})
					]
				}) : null,
				store.step === "review" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Revise nomes e cargas horárias antes da comparação. Linhas com nome vazio são ignoradas. Ementa e demais dados extraídos continuam preservados."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 lg:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubjectEditor, {
								title: "Documento anterior",
								rows: store.previousReview,
								onChange: store.updatePreviousReview,
								onAdd: store.addPreviousRow,
								onRemove: store.removePreviousRow
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubjectEditor, {
								title: "Documento atual",
								rows: store.currentReview,
								onChange: store.updateCurrentReview,
								onAdd: store.addCurrentRow,
								onRemove: store.removeCurrentRow
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => store.goTo("upload"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Voltar"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: store.compare,
								children: "Comparar disciplinas revisadas"
							})]
						})
					]
				}) : null,
				store.step === "results" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 md:grid-cols-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Anteriores",
									value: store.previousSubjects.length
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Atuais",
									value: store.currentSubjects.length
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Possíveis equivalências",
									value: strong + likely
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Revisão manual",
									value: manual
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Sem equivalência forte",
									value: none
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: allClassifications.map((item) => {
									const active = store.classifications.includes(item);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => store.setClassifications(active ? store.classifications.filter((value) => value !== item) : [...store.classifications, item]),
										className: cn("h-9 rounded-full px-3 text-xs", active ? "bg-accent text-accent-fg" : "bg-bg text-muted"),
										"aria-pressed": active,
										children: item
									}, item);
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex h-11 items-center gap-2 text-sm text-fg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "size-4 accent-accent",
											checked: store.onlyManual,
											onChange: (event) => store.setOnlyManual(event.target.checked)
										}), "Somente revisão manual"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm text-muted",
										children: ["Ordenar", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "h-11 rounded-sm border border-border bg-surface px-3 text-sm text-fg",
											value: store.sortMode,
											onChange: (event) => store.setSortMode(event.target.value),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Prioridade" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Score" })]
										})]
									}),
									allAlerts.filter((alert) => alert !== "Sem alerta específico").map((alert) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => store.toggleAlert(alert),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: store.selectedAlerts.includes(alert) ? "accent" : "default",
											children: alert
										})
									}, alert))
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchTable, {
							rows: visible,
							onSelect: store.setRowSelected,
							onNote: store.setRowNote,
							onSelectAll: (selectedAll) => {
								visible.forEach((row) => store.setRowSelected(row.id, selectedAll));
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 lg:flex-row lg:flex-wrap",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => void rowsToSummaryXlsx(visible).then((bytes) => downloadBytes(bytes, "equivalencias_resumidas.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-4" }), "Excel resumido"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => void rowsToDetailedXlsx(visible).then((bytes) => downloadBytes(bytes, "equivalencias_detalhadas.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Excel detalhado"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "outline",
									disabled: !selected.length,
									onClick: () => void finalReviewReportToXlsx(selected, store.previousSubjects, store.currentSubjects).then((bytes) => downloadBytes(bytes, "relatorio_equivalencias_selecionadas.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-4" }), "Relatório selecionado"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									disabled: !selected.length,
									onClick: () => void downloadPdf(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }), "Relatório PDF"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "ghost",
									onClick: store.reset,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Nova comparação"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: DISCLAIMER_PT
						})
					]
				}) : null
			]
		})]
	});
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs tracking-wide text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-display text-3xl tabular-nums text-fg",
			children: value
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComparisonApp, {});
}
//#endregion
export { Home as component };
