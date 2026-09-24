"use client";

import { Sparkles } from "lucide-react";
import Badge from "@/components/ui/Badge";

/** Minimal visible proof that a module can inject into the header-actions slot. */
export default function DemoHeaderAction() {
  return (
    <Badge tone="violet" className="hidden sm:inline-flex">
      <Sparkles aria-hidden className="size-3" />
      Demo
    </Badge>
  );
}
