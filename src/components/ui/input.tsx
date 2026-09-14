import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm text-fg placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
}
