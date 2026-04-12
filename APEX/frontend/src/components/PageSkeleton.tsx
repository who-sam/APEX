import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  rows?: number;
  cards?: number;
}

export function PageSkeleton({ rows = 3, cards = 0 }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Cards skeleton */}
      {cards > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
