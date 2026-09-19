import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400">
        <Icon aria-hidden size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
