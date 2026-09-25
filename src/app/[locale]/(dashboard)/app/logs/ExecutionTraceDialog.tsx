"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/ui/primitives/dialog";
import ExecutionTraceWaterfall, { type ExecutionTraceSpan, type ExecutionTraceWaterfallCopy } from "./ExecutionTraceWaterfall";

interface ExecutionTraceDialogCopy extends ExecutionTraceWaterfallCopy {
  dialogTitle: string;
}

export default function ExecutionTraceDialog({
  open,
  onOpenChange,
  spans,
  copy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spans: ExecutionTraceSpan[];
  copy: ExecutionTraceDialogCopy;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
        </DialogHeader>
        <ExecutionTraceWaterfall
          spans={spans}
          copy={{
            spanLabels: copy.spanLabels,
            totalDurationLabel: copy.totalDurationLabel,
            expandLabel: copy.expandLabel,
            collapseLabel: copy.collapseLabel,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
