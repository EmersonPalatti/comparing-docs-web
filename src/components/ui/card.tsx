import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface p-4 text-fg shadow-[var(--shadow-border)] sm:p-5",
        className,
      )}
      {...props}
    />
  );
}
