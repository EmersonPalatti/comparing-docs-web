import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        default: "bg-bg-elevated text-fg",
        accent: "bg-accent/10 text-accent",
        high: "bg-high/10 text-high",
        mid: "bg-mid/10 text-mid",
        low: "bg-low/10 text-low",
        ok: "bg-ok/10 text-ok",
        warn: "bg-warn/10 text-warn",
        danger: "bg-danger/10 text-danger",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
