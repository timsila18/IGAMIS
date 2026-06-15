import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  green: "border-emerald-700/20 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300",
  gold: "border-[#c8a640]/30 bg-[#c8a640]/15 text-[#765f10] dark:text-[#f0d36d]",
  red: "border-red-700/20 bg-red-700/10 text-red-800 dark:text-red-300",
  neutral: "border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
