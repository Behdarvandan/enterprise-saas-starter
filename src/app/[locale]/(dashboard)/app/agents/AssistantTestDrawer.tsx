"use client";

import type { ReactNode } from "react";
import { Button } from "@/core/ui/primitives/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/ui/primitives/sheet";
import { Textarea } from "@/core/ui/primitives/textarea";

interface AssistantTestDrawerProps {
  assistantName: string;
  children: ReactNode;
}

/** Right slide-over placeholder for real-time assistant testing — no live wiring yet. */
export default function AssistantTestDrawer({ assistantName, children }: AssistantTestDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Test {assistantName}</SheetTitle>
          <SheetDescription>Send a message to see how this assistant responds in real time.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">Live testing coming soon.</p>
        </div>
        <div className="flex items-center gap-2">
          <Textarea
            disabled
            placeholder="Message this assistant…"
            rows={2}
            className="min-h-0 flex-1 resize-none bg-muted"
          />
          <Button variant="default" disabled>
            Send
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
