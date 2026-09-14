import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReviewRow } from "@/domain/subjects";

type SubjectEditorProps = {
  title: string;
  rows: ReviewRow[];
  onChange: (index: number, patch: Partial<ReviewRow>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function SubjectEditor({ title, rows, onChange, onAdd, onRemove }: SubjectEditorProps) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-medium text-fg">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onAdd} type="button">
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-80 border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted uppercase">
              <th className="px-2 font-medium">Disciplina</th>
              <th className="w-28 px-2 font-medium">Carga</th>
              <th className="w-12 px-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`}>
                <td className="px-1">
                  <Input
                    value={row.name}
                    aria-label={`Disciplina ${index + 1} de ${title}`}
                    onChange={(event) => onChange(index, { name: event.target.value })}
                  />
                </td>
                <td className="px-1">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="tabular-nums"
                    value={row.workloadHours ?? ""}
                    aria-label={`Carga horária ${index + 1} de ${title}`}
                    onChange={(event) =>
                      onChange(index, {
                        workloadHours: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                  />
                </td>
                <td className="px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    aria-label={`Remover disciplina ${index + 1}`}
                    onClick={() => onRemove(index)}
                    className="px-2"
                  >
                    <Trash2 className="size-4 text-muted" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
