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
      <div className="flex h-11 w-11 items-center justify-center rounded-interactive border border-subtle text-ink-muted">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-primary">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
