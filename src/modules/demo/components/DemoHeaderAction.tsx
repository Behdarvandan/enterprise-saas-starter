"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/core/ui/primitives/badge";

/** Minimal visible proof that a module can inject into the header-actions slot. */
export default function DemoHeaderAction() {
  return (
    <Badge variant="secondary" className="hidden sm:inline-flex">
      <Sparkles aria-hidden className="size-3" />
      Demo
    </Badge>
  );
}
