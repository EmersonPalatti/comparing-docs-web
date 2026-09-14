import { ArrowLeft, Download, FileSpreadsheet, FileText, LoaderCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Dropzone } from "@/components/dropzone";
import { MatchTable } from "@/components/match-table";
import { PairPanel } from "@/components/pair-panel";
import { SubjectEditor } from "@/components/subject-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DISCLAIMER_PT, type SortMode, useComparisonStore } from "@/lib/comparison-store";
import { SAMPLE_FILES } from "@/domain/samples";
import { finalReviewReportToXlsx, generateSelectedPdfReport, rowsToDetailedXlsx, rowsToSummaryXlsx } from "@/domain/reports";
import type { MatchRow } from "@/domain/rows";
import { sanitizeFilename } from "@/domain/rows";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "upload", label: "Enviar" },
  { id: "review", label: "Revisar" },
  { id: "results", label: "Resultado" },
] as const;

function filterRows(
  rows: MatchRow[],
  classifications: string[],
  selectedAlerts: string[],
  onlyManual: boolean,
  sortMode: SortMode,
  bestOnly: boolean,
): MatchRow[] {
  const filtered = rows.filter((row) => {
    if (bestOnly && row.isBest === false) return false;
    if (classifications.length && !classifications.includes(row.classificationLabel)) return false;
    if (onlyManual && !row.manualReview) return false;
    if (selectedAlerts.length && !selectedAlerts.some((alert) => row.alertList.includes(alert))) return false;
    return true;
  });
  const rank: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };
  return [...filtered].sort((a, b) => {
    if (sortMode === "Prioridade") {
      const delta = (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
      if (delta !== 0) return delta;
    }
    return b.equivalency - a.equivalency;
  });
}

function downloadBytes(bytes: Uint8Array, filename: string, mime: string) {
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

function downloadSampleKit() {
  for (const file of SAMPLE_FILES) {
    downloadBytes(new TextEncoder().encode(file.content), file.name, file.mime);
  }
}

export function ComparisonApp() {
  const store = useComparisonStore();
  const visible = filterRows(
    store.rows,
    store.classifications,
    store.selectedAlerts,
    store.onlyManual,
    store.sortMode,
    store.candidateMode === "best",
  );
  const selected = store.rows.filter((row) => row.selected);
  const bestRows = store.rows.filter((row) => row.isBest);
  const allClassifications = [...new Set(bestRows.map((row) => row.classificationLabel))];
  const allAlerts = [...new Set(bestRows.flatMap((row) => row.alertList))].sort();
  const strong = bestRows.filter((row) => row.classification === "strong_equivalency").length;
  const likely = bestRows.filter((row) => row.classification === "likely_equivalency").length;
  const manual = bestRows.filter((row) => row.manualReview).length;
  const none = bestRows.filter((row) => row.classification === "no_match").length;
  const conflicts = bestRows.filter((row) => row.destinationConflict).length;
  const activeRow = store.rows.find((row) => row.id === store.activeRowId) ?? null;

  async function downloadPdf() {
    try {
      const bytes = await generateSelectedPdfReport(
        selected,
        store.previousSubjects,
        store.currentSubjects,
        store.previousSource,
        store.currentSource,
      );
      downloadBytes(bytes, "relatorio_equivalencias_selecionadas.pdf", "application/pdf");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o PDF.");
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg-elevated">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-accent uppercase">Análise acadêmica</p>
            <h1 className="mt-1 font-display text-4xl font-medium tracking-tight text-fg">Equivalência</h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Histórico do aluno de um lado, matriz da universidade de destino do outro. A leitura
              acontece no navegador e gera uma tabela ranqueada para revisão humana.
            </p>
          </div>
          <ol className="flex list-none gap-2 p-0">
            {STEPS.map((step, index) => {
              const active = store.step === step.id;
              const done = STEPS.findIndex((item) => item.id === store.step) > index;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    disabled={step.id === "review" ? store.previousReview.length === 0 : step.id === "results" ? store.rows.length === 0 : false}
                    onClick={() => store.goTo(step.id)}
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-full px-3 text-sm",
                      active ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
                    )}
                  >
                    <span className="tabular-nums">{index + 1}</span>
                    <span>{step.label}</span>
                    {done ? <span className="sr-only">concluído</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        {store.error ? (
          <p className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {store.error}
          </p>
        ) : null}

        {store.step === "upload" ? (
          <section className="flex flex-col gap-5">
            <Card className="text-sm text-muted">{DISCLAIMER_PT}</Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Dropzone
                label="Histórico de origem"
                hint="PDF ou Word do aluno, com texto selecionável"
                fileName={store.previousFile?.name ?? null}
                onFile={store.setPreviousFile}
              />
              <Dropzone
                label="Matriz de destino"
                hint="Planilha XLSX da universidade, CSV ou PDF"
                fileName={store.currentFile?.name ?? null}
                onFile={store.setCurrentFile}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={() => void store.extract()}
                disabled={!store.previousFile || !store.currentFile || store.busy}
              >
                {store.busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Extrair disciplinas
              </Button>
              <Button type="button" variant="outline" onClick={store.loadSample}>
                Carregar exemplo
              </Button>
              <Button type="button" variant="ghost" onClick={downloadSampleKit}>
                <Download className="size-4" />
                Baixar kit de simulação
              </Button>
            </div>
            <p className="text-sm text-muted">
              O fluxo típico: a universidade envia a matriz em XLSX; o aluno envia o histórico em PDF ou Word.
              PDFs precisam ter texto selecionável. O kit baixa TXT, CSV e uma tabela estilo histórico para testar o envio.
            </p>
          </section>
        ) : null}

        {store.step === "review" ? (
          <section className="flex flex-col gap-5">
            <p className="text-sm text-muted">
              Revise nomes e cargas antes da comparação. Código, período e ementa extraídos aparecem abaixo de cada
              nome para você conferir se a planilha ou o histórico foram lidos certo. Linhas com nome vazio são ignoradas.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <SubjectEditor
                title="Histórico de origem"
                rows={store.previousReview}
                notes={store.previousNotes ?? []}
                onChange={store.updatePreviousReview}
                onAdd={store.addPreviousRow}
                onRemove={store.removePreviousRow}
              />
              <SubjectEditor
                title="Matriz de destino"
                rows={store.currentReview}
                notes={store.currentNotes ?? []}
                onChange={store.updateCurrentReview}
                onAdd={store.addCurrentRow}
                onRemove={store.removeCurrentRow}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => store.goTo("upload")}>
                <ArrowLeft className="size-4" />
                Voltar
              </Button>
              <Button type="button" onClick={store.compare}>
                Comparar disciplinas revisadas
              </Button>
            </div>
          </section>
        ) : null}

        {store.step === "results" ? (
          <section className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Metric label="Anteriores" value={store.previousSubjects.length} />
              <Metric label="Atuais" value={store.currentSubjects.length} />
              <Metric label="Possíveis equivalências" value={strong + likely} />
              <Metric label="Revisão manual" value={manual} />
              <Metric label="Sem equivalência forte" value={none} />
              <Metric label="Destino compartilhado" value={conflicts} />
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => store.setClassifications([])}
                  className={cn(
                    "h-11 rounded-full px-3 text-xs",
                    store.classifications.length === 0 ? "bg-accent text-accent-fg" : "bg-bg text-muted",
                  )}
                  aria-pressed={store.classifications.length === 0}
                >
                  Todas
                </button>
                {allClassifications.map((item) => {
                  const pressed = store.classifications.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        store.setClassifications(
                          pressed
                            ? store.classifications.filter((value) => value !== item)
                            : [...store.classifications, item],
                        )
                      }
                      className={cn(
                        "h-11 rounded-full px-3 text-xs",
                        pressed ? "bg-accent text-accent-fg" : "bg-bg text-muted",
                      )}
                      aria-pressed={pressed}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-11 items-center gap-2 text-sm text-fg">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={store.onlyManual}
                    onChange={(event) => store.setOnlyManual(event.target.checked)}
                  />
                  Somente revisão manual
                </label>
                <label className="flex h-11 items-center gap-2 text-sm text-fg">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={store.candidateMode === "all"}
                    onChange={(event) => store.setCandidateMode(event.target.checked ? "all" : "best")}
                  />
                  Mostrar 2º e 3º candidatos
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  Ordenar
                  <select
                    className="h-11 rounded-sm border border-border bg-surface px-3 text-sm text-fg"
                    value={store.sortMode}
                    onChange={(event) => store.setSortMode(event.target.value as SortMode)}
                    aria-label="Ordenar"
                  >
                    <option>Prioridade</option>
                    <option>Score</option>
                  </select>
                </label>
                {allAlerts
                  .filter((alert) => alert !== "Sem alerta específico")
                  .map((alert) => (
                    <button key={alert} type="button" onClick={() => store.toggleAlert(alert)}>
                      <Badge tone={store.selectedAlerts.includes(alert) ? "accent" : "default"}>{alert}</Badge>
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={store.selectUniquePairs}>
                Selecionar pares únicos
              </Button>
              <p className="self-center text-sm text-muted">
                Clique numa linha para ver ementas lado a lado. O modo padrão mostra o par sugerido pela atribuição global; ligue os 2º e 3º candidatos para comparar.
              </p>
            </div>

            {activeRow ? <PairPanel row={activeRow} onClose={() => store.setActiveRowId(null)} /> : null}

            <MatchTable
              rows={visible}
              activeId={store.activeRowId}
              onSelect={store.setRowSelected}
              onNote={store.setRowNote}
              onOpen={(id) => store.setActiveRowId(id === store.activeRowId ? null : id)}
              onSelectAll={(selectedAll) => {
                visible.forEach((row) => store.setRowSelected(row.id, selectedAll));
              }}
            />

            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void rowsToSummaryXlsx(visible).then((bytes) =>
                    downloadBytes(
                      bytes,
                      "equivalencias_resumidas.xlsx",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ),
                  )
                }
              >
                <FileSpreadsheet className="size-4" />
                Excel resumido
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void rowsToDetailedXlsx(visible).then((bytes) =>
                    downloadBytes(
                      bytes,
                      "equivalencias_detalhadas.xlsx",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ),
                  )
                }
              >
                <Download className="size-4" />
                Excel detalhado
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!selected.length}
                onClick={() =>
                  void finalReviewReportToXlsx(selected, store.previousSubjects, store.currentSubjects).then((bytes) =>
                    downloadBytes(
                      bytes,
                      "relatorio_equivalencias_selecionadas.xlsx",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ),
                  )
                }
              >
                <FileSpreadsheet className="size-4" />
                Relatório selecionado
              </Button>
              <Button type="button" disabled={!selected.length} onClick={() => void downloadPdf()}>
                <FileText className="size-4" />
                Relatório PDF
              </Button>
              <Button type="button" variant="ghost" onClick={store.reset}>
                <RotateCcw className="size-4" />
                Nova comparação
              </Button>
            </div>
            <p className="text-xs text-muted">{DISCLAIMER_PT}</p>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs tracking-wide text-muted uppercase">{label}</div>
      <div className="mt-1 font-display text-3xl tabular-nums text-fg">{value}</div>
    </Card>
  );
}
