import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic page-level loading skeleton shared by every portal route segment:
 * page header, a metric row, and a content panel — the same shape the real
 * pages settle into, so the swap doesn't shift layout.
 */
export default function PageLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
