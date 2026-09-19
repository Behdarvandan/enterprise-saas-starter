import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Landing-page card: translucent panel, hairline border, deep black shadow. */
export default function GlassPanel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800/80 bg-[#131B2E]/50 shadow-2xl shadow-black/60 backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
