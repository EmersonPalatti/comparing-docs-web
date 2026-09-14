import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { MatchRow } from "@/domain/rows";
import { cn } from "@/lib/utils";

type MatchTableProps = {
  rows: MatchRow[];
  activeId: string | null;
  onSelect: (id: string, selected: boolean) => void;
  onNote: (id: string, note: string) => void;
  onSelectAll: (selected: boolean) => void;
  onOpen: (id: string) => void;
};

function priorityTone(priority: string) {
  if (priority === "Alta") return "high" as const;
  if (priority === "Média") return "mid" as const;
  return "low" as const;
}

function classTone(classification: string) {
  if (classification.startsWith("Forte")) return "ok" as const;
  if (classification.startsWith("Provável")) return "warn" as const;
  if (classification.startsWith("Similaridade")) return "mid" as const;
  return "low" as const;
}

export function MatchTable({ rows, activeId, onSelect, onNote, onSelectAll, onOpen }: MatchTableProps) {
  const allSelected = rows.length > 0 && rows.every((row) => row.selected);

  return (
    <div className="overflow-x-auto rounded-lg bg-surface shadow-[var(--shadow-border)]">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-border bg-bg-elevated text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="px-3 py-3 font-medium">
              <input
                type="checkbox"
                className="size-4 accent-accent"
                checked={allSelected}
                aria-label="Selecionar todos os pares visíveis"
                onChange={(event) => onSelectAll(event.target.checked)}
              />
            </th>
            <th className="px-3 py-3 font-medium">Anterior</th>
            <th className="px-3 py-3 font-medium">Atual</th>
            <th className="px-3 py-3 font-medium">Prioridade</th>
            <th className="px-3 py-3 font-medium">Equivalência</th>
            <th className="px-3 py-3 font-medium">Classificação</th>
            <th className="px-3 py-3 font-medium">Alertas</th>
            <th className="min-w-48 px-3 py-3 font-medium">Observação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "cursor-pointer border-b border-border last:border-0",
                row.selected && "bg-accent/5",
                activeId === row.id && "bg-accent/10",
              )}
              onClick={() => onOpen(row.id)}
            >
              <td className="px-3 py-3 align-top" onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={row.selected}
                  aria-label={`Selecionar ${row.previousName} × ${row.currentName}`}
                  onChange={(event) => onSelect(row.id, event.target.checked)}
                />
              </td>
              <td className="px-3 py-3 align-top">
                <div className="font-medium text-fg">{row.previousName}</div>
                <div className="tabular-nums text-xs text-muted">
                  {row.previousHours == null ? "CH n/d" : `${row.previousHours}h`}
                  {row.rank > 1 ? ` · ${row.rank}º` : ""}
                </div>
              </td>
              <td className="px-3 py-3 align-top">
                <div className="font-medium text-fg">{row.currentName}</div>
                <div className="tabular-nums text-xs text-muted">
                  {row.currentHours == null ? "CH n/d" : `${row.currentHours}h`}
                </div>
              </td>
              <td className="px-3 py-3 align-top">
                <Badge tone={priorityTone(row.priority)}>{row.priority}</Badge>
              </td>
              <td className="px-3 py-3 align-top">
                <div className="tabular-nums font-medium">{row.equivalencyPercent}</div>
                <div className="text-xs text-muted">CH {row.workloadScoreLabel || "—"}</div>
              </td>
              <td className="px-3 py-3 align-top">
                <Badge tone={classTone(row.classificationLabel)}>{row.classificationLabel}</Badge>
                {row.manualReview ? (
                  <div className="mt-1 text-xs text-warn">Revisão manual</div>
                ) : null}
              </td>
              <td className="px-3 py-3 align-top">
                <div className="flex flex-wrap gap-1">
                  {row.alertList.slice(0, 3).map((alert) => (
                    <Badge key={alert} tone={alert === "Destino compartilhado" ? "high" : "default"}>
                      {alert}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-3 py-3 align-top" onClick={(event) => event.stopPropagation()}>
                <Input
                  value={row.reviewerNote}
                  placeholder="Justificativa humana"
                  aria-label={`Observação para ${row.previousName}`}
                  onChange={(event) => onNote(row.id, event.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">Nenhum par com os filtros atuais.</p>
      ) : null}
    </div>
  );
}
