import { Skeleton } from '@components/ui/Skeleton';
import { cn } from '@utils/cn';

interface PageSkeletonProps {
  width?: number;
  height?: number;
  className?: string;
}

export function PageSkeleton({ width = 612, height = 792, className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-white shadow-md dark:bg-gray-900',
        className
      )}
      style={{ width, height }}
      role="status"
      aria-label="Loading page"
    >
      <div className="flex w-4/5 flex-col gap-4 p-8">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4" />

        {/* Paragraph skeletons */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Another paragraph */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Image placeholder */}
        <Skeleton className="mt-4 h-32 w-full" />

        {/* More text */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function ThumbnailSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center gap-1', className)}
      role="status"
      aria-label="Loading thumbnail"
    >
      <Skeleton className="h-32 w-24 rounded shadow-sm" />
      <Skeleton className="h-3 w-8" />
    </div>
  );
}
