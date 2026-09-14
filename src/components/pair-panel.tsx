import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MatchRow } from "@/domain/rows";

type PairPanelProps = {
  row: MatchRow;
  onClose: () => void;
};

export function PairPanel({ row, onClose }: PairPanelProps) {
  return (
    <Card className="flex flex-col gap-4 p-5" role="region" aria-label="Parecer do par selecionado">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted uppercase">Parecer do par</p>
          <h2 className="mt-1 font-display text-2xl text-fg">
            {row.previousName} × {row.currentName}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-full bg-bg px-4 text-sm text-muted"
        >
          Fechar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone={row.classificationLabel.startsWith("Forte") ? "ok" : row.manualReview ? "warn" : "low"}>
          {row.classificationLabel}
        </Badge>
        <Badge tone="default">{row.equivalencyPercent}</Badge>
        {row.destinationConflict ? <Badge tone="high">Destino compartilhado</Badge> : null}
        {row.assignedUnique ? <Badge tone="accent">Par único sugerido</Badge> : null}
        {row.rank > 1 ? <Badge tone="default">{row.rank}º candidato</Badge> : null}
      </div>

      <p className="text-sm leading-relaxed text-fg">{row.justification}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <EmentaBlock
          title={row.previousName}
          hours={row.previousHours}
          text={row.previousSyllabus}
          side="Anterior"
        />
        <EmentaBlock
          title={row.currentName}
          hours={row.currentHours}
          text={row.currentSyllabus}
          side="Atual"
        />
      </div>
    </Card>
  );
}

function EmentaBlock({
  title,
  hours,
  text,
  side,
}: {
  title: string;
  hours: number | null;
  text: string;
  side: string;
}) {
  return (
    <div className="rounded-lg bg-bg p-4">
      <p className="text-xs tracking-wide text-muted uppercase">{side}</p>
      <p className="mt-1 font-medium text-fg">{title}</p>
      <p className="mt-1 text-xs tabular-nums text-muted">{hours == null ? "CH n/d" : `${hours}h`}</p>
      <p className="mt-3 text-sm leading-relaxed text-fg">
        {text.trim() ? text : "Ementa não identificada neste documento."}
      </p>
    </div>
  );
}
