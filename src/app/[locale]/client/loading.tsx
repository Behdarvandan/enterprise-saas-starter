import { Skeleton } from "@/components/ui/skeleton";

export default function ClientPortalLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-56" />

      <div className="mt-8 rounded-interactive border border-subtle bg-surface p-6">
        <Skeleton className="h-5 w-48" />
        <div className="mt-6 flex items-center gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-8 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
