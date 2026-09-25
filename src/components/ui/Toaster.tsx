"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Toast } from "radix-ui";
import { dismissToast, useToasts, type ToastTone } from "@/lib/toast";
import { cn } from "@/lib/utils";

const toneIcon: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const toneIconClass: Record<ToastTone, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-primary",
};

/** Mount once per shell. Feedback for actions that have no inline home. */
export default function Toaster() {
  const t = useTranslations("ui");
  const toasts = useToasts();

  return (
    <Toast.Provider swipeDirection="right" duration={5000}>
      {toasts.map((item) => {
        const Icon = toneIcon[item.tone];
        return (
          <Toast.Root
            key={item.id}
            type={item.tone === "error" ? "foreground" : "background"}
            onOpenChange={(open) => {
              if (!open) dismissToast(item.id);
            }}
            className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3.5 shadow-xl shadow-black/30 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", toneIconClass[item.tone])} />
            <div className="min-w-0 flex-1">
              <Toast.Title className="text-sm font-medium text-slate-100">{item.title}</Toast.Title>
              {item.description ? (
                <Toast.Description className="mt-0.5 text-xs text-slate-400">
                  {item.description}
                </Toast.Description>
              ) : null}
            </div>
            <Toast.Close
              aria-label={t("dismiss")}
              className="rounded p-0.5 text-slate-500 transition-colors hover:text-slate-200"
            >
              <X aria-hidden className="size-3.5" />
            </Toast.Close>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className="fixed bottom-4 end-4 z-[60] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
