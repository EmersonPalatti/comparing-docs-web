import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DISCLAIMER_PT } from "@/domain/config";
import { loadDocument, TextExtractionError, friendlyExtractionError, pickSubjects } from "@/domain/extract";
import { matchSubjects } from "@/domain/matcher";
import { type Subject } from "@/domain/models";
import { parseSubjects } from "@/domain/parser";
import { matchesToRows, type MatchRow } from "@/domain/rows";
import { SAMPLE_CURRENT, SAMPLE_PREVIOUS } from "@/domain/samples";
import { applyReview, subjectsToReview, type ReviewRow } from "@/domain/subjects";

export type Step = "upload" | "review" | "results";
export type SortMode = "Prioridade" | "Score";
export type CandidateMode = "best" | "all";

type FilePayload = { name: string; bytes: Uint8Array };

type State = {
  step: Step;
  previousFile: FilePayload | null;
  currentFile: FilePayload | null;
  previousSource: string;
  currentSource: string;
  previousSubjects: Subject[];
  currentSubjects: Subject[];
  previousReview: ReviewRow[];
  currentReview: ReviewRow[];
  previousNotes: string[];
  currentNotes: string[];
  rows: MatchRow[];
  error: string | null;
  busy: boolean;
  classifications: string[];
  selectedAlerts: string[];
  onlyManual: boolean;
  sortMode: SortMode;
  candidateMode: CandidateMode;
  activeRowId: string | null;
  setPreviousFile: (file: FilePayload | null) => void;
  setCurrentFile: (file: FilePayload | null) => void;
  loadSample: () => void;
  extract: () => Promise<void>;
  updatePreviousReview: (index: number, patch: Partial<ReviewRow>) => void;
  updateCurrentReview: (index: number, patch: Partial<ReviewRow>) => void;
  addPreviousRow: () => void;
  addCurrentRow: () => void;
  removePreviousRow: (index: number) => void;
  removeCurrentRow: (index: number) => void;
  compare: () => void;
  setRowSelected: (id: string, selected: boolean) => void;
  setRowNote: (id: string, note: string) => void;
  selectUniquePairs: () => void;
  setClassifications: (values: string[]) => void;
  toggleAlert: (alert: string) => void;
  setOnlyManual: (value: boolean) => void;
  setSortMode: (mode: SortMode) => void;
  setCandidateMode: (mode: CandidateMode) => void;
  setActiveRowId: (id: string | null) => void;
  goTo: (step: Step) => void;
  reset: () => void;
};

const emptyReview: ReviewRow = { name: "", workloadHours: null };

const memoryStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
};

export const useComparisonStore = create<State>()(
  persist(
    (set, get) => ({
      step: "upload",
      previousFile: null,
      currentFile: null,
      previousSource: "documento_anterior",
      currentSource: "documento_atual",
      previousSubjects: [],
      currentSubjects: [],
      previousReview: [],
      currentReview: [],
      previousNotes: [],
      currentNotes: [],
      rows: [],
      error: null,
      busy: false,
      classifications: [],
      selectedAlerts: [],
      onlyManual: false,
      sortMode: "Prioridade",
      candidateMode: "best",
      activeRowId: null,
      setPreviousFile: (file) => set({ previousFile: file, error: null }),
      setCurrentFile: (file) => set({ currentFile: file, error: null }),
      loadSample: () => {
        const previous = parseSubjects(SAMPLE_PREVIOUS, "historico-origem.txt");
        const current = parseSubjects(SAMPLE_CURRENT, "matriz-destino.txt");
        set({
          previousFile: {
            name: "historico-origem.txt",
            bytes: new TextEncoder().encode(SAMPLE_PREVIOUS),
          },
          currentFile: {
            name: "matriz-destino.txt",
            bytes: new TextEncoder().encode(SAMPLE_CURRENT),
          },
          previousSource: "historico-origem.txt",
          currentSource: "matriz-destino.txt",
          previousSubjects: previous,
          currentSubjects: current,
          previousReview: subjectsToReview(previous),
          currentReview: subjectsToReview(current),
          previousNotes: [],
          currentNotes: [],
          rows: [],
          error: null,
          step: "review",
          activeRowId: null,
        });
      },
      extract: async () => {
        const { previousFile, currentFile } = get();
        if (!previousFile || !currentFile) {
          set({ error: "Envie os dois documentos para extrair as disciplinas." });
          return;
        }
        set({ busy: true, error: null });
        try {
          const [previousDoc, currentDoc] = await Promise.all([
            loadDocument(previousFile, "documento_anterior"),
            loadDocument(currentFile, "documento_atual"),
          ]);
          const previousSubjects = pickSubjects(
            previousDoc.subjects,
            parseSubjects(previousDoc.text, previousDoc.filename),
          );
          const currentSubjects = pickSubjects(
            currentDoc.subjects,
            parseSubjects(currentDoc.text, currentDoc.filename),
          );
          if (!previousSubjects.length) {
            throw new Error("Nenhuma disciplina foi encontrada no documento anterior.");
          }
          if (!currentSubjects.length) {
            throw new Error("Nenhuma disciplina foi encontrada no documento atual.");
          }
          set({
            previousSource: previousDoc.filename,
            currentSource: currentDoc.filename,
            previousSubjects,
            currentSubjects,
            previousReview: subjectsToReview(previousSubjects),
            currentReview: subjectsToReview(currentSubjects),
            previousNotes: previousDoc.notes ?? [],
            currentNotes: currentDoc.notes ?? [],
            rows: [],
            step: "review",
            busy: false,
            activeRowId: null,
          });
        } catch (error) {
          const message =
            error instanceof TextExtractionError
              ? friendlyExtractionError(error)
              : error instanceof Error
                ? error.message
                : "Não foi possível extrair as disciplinas.";
          set({ error: message, busy: false });
        }
      },
      updatePreviousReview: (index, patch) =>
        set((state) => ({
          previousReview: state.previousReview.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        })),
      updateCurrentReview: (index, patch) =>
        set((state) => ({
          currentReview: state.currentReview.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        })),
      addPreviousRow: () => set((state) => ({ previousReview: [...state.previousReview, { ...emptyReview }] })),
      addCurrentRow: () => set((state) => ({ currentReview: [...state.currentReview, { ...emptyReview }] })),
      removePreviousRow: (index) =>
        set((state) => ({ previousReview: state.previousReview.filter((_, i) => i !== index) })),
      removeCurrentRow: (index) =>
        set((state) => ({ currentReview: state.currentReview.filter((_, i) => i !== index) })),
      compare: () => {
        const { previousSubjects, currentSubjects, previousReview, currentReview, previousSource, currentSource } =
          get();
        try {
          const previous = applyReview(previousSubjects, previousReview, previousSource);
          const current = applyReview(currentSubjects, currentReview, currentSource);
          if (!previous.length) throw new Error("Nenhuma disciplina valida foi mantida no documento anterior.");
          if (!current.length) throw new Error("Nenhuma disciplina valida foi mantida no documento atual.");
          const matches = matchSubjects(previous, current);
          const rows = matchesToRows(matches);
          set({
            previousSubjects: previous,
            currentSubjects: current,
            rows,
            classifications: [],
            selectedAlerts: [],
            onlyManual: false,
            candidateMode: "best",
            activeRowId: null,
            step: "results",
            error: null,
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Não foi possível comparar as disciplinas." });
        }
      },
      setRowSelected: (id, selected) =>
        set((state) => ({
          rows: state.rows.map((row) => (row.id === id ? { ...row, selected } : row)),
        })),
      setRowNote: (id, note) =>
        set((state) => ({
          rows: state.rows.map((row) => (row.id === id ? { ...row, reviewerNote: note } : row)),
        })),
      selectUniquePairs: () =>
        set((state) => ({
          rows: state.rows.map((row) => ({ ...row, selected: row.assignedUnique })),
        })),
      setClassifications: (values) => set({ classifications: values }),
      toggleAlert: (alert) =>
        set((state) => ({
          selectedAlerts: state.selectedAlerts.includes(alert)
            ? state.selectedAlerts.filter((item) => item !== alert)
            : [...state.selectedAlerts, alert],
        })),
      setOnlyManual: (value) => set({ onlyManual: value }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setCandidateMode: (mode) => set({ candidateMode: mode }),
      setActiveRowId: (id) => set({ activeRowId: id }),
      goTo: (step) => set({ step, error: null }),
      reset: () =>
        set({
          step: "upload",
          previousFile: null,
          currentFile: null,
          previousSubjects: [],
          currentSubjects: [],
          previousReview: [],
          currentReview: [],
          previousNotes: [],
          currentNotes: [],
          rows: [],
          error: null,
          busy: false,
          classifications: [],
          selectedAlerts: [],
          onlyManual: false,
          sortMode: "Prioridade",
          candidateMode: "best",
          activeRowId: null,
        }),
    }),
    {
      name: "equivalencia-session",
      version: 1,
      storage: createJSONStorage(() => (typeof window === "undefined" ? memoryStorage : localStorage)),
      partialize: (state) => ({
        step: state.step,
        previousSource: state.previousSource,
        currentSource: state.currentSource,
        previousSubjects: state.previousSubjects,
        currentSubjects: state.currentSubjects,
        previousReview: state.previousReview,
        currentReview: state.currentReview,
        previousNotes: state.previousNotes,
        currentNotes: state.currentNotes,
        rows: state.rows,
        classifications: state.classifications,
        selectedAlerts: state.selectedAlerts,
        onlyManual: state.onlyManual,
        sortMode: state.sortMode,
        candidateMode: state.candidateMode,
      }),
    },
  ),
);

export { DISCLAIMER_PT };
