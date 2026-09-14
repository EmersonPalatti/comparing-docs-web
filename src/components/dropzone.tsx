import { FileUp } from "lucide-react";
import { useRef, useState, type DragEvent, type ChangeEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { MAX_UPLOAD_BYTES } from "@/domain/config";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.docx,.xlsx,.xls,.csv,.txt,.md";

type DropzoneProps = {
  label: string;
  hint: string;
  fileName: string | null;
  onFile: (file: { name: string; bytes: Uint8Array }) => void;
};

export function Dropzone({ label, hint, fileName, onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`Arquivo excede o limite de ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    onFile({ name: file.name, bytes });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label}. ${fileName ?? hint}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={onKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex min-h-44 w-full flex-col items-start gap-3 rounded-lg bg-surface p-5 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150",
        over && "ring-2 ring-ring",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-sm bg-bg text-accent">
        <FileUp className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="mt-1 block text-sm text-muted">{fileName ?? hint}</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={onChange}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}