'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6 animate-pulse">
      <Skeleton className="h-5 w-1/3 mb-4" />
      <Skeleton className="h-10 w-1/2 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => {
        const isLast = i === rows - 1;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 py-4 ${!isLast ? 'border-b border-white/5' : ''}`}
          >
            <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        );
      })}
    </div>
  );
}

export function SkeletonTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}