import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic page-level loading skeleton shared by dashboard/admin route
 * segments. Mirrors the visual shape used by `client/loading.tsx` (title +
 * subtitle + a bordered content card) rather than a bespoke layout per page.
 */
export default function PageLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-56" />

      <div className="mt-8 space-y-4 rounded-interactive border border-subtle bg-surface p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
