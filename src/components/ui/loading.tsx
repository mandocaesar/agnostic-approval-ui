/**
 * Loading Components
 * Provides consistent loading states across the application
 */

export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`animate-spin ${sizes[size]} ${className}`} role="status" aria-label="Loading">
      <svg className="h-full w-full" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4 text-blue-600" />
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

export function InlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Spinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <SkeletonLine className="mb-4 h-6 w-1/3" />
      <SkeletonLine className="mb-2 h-4 w-full" />
      <SkeletonLine className="mb-2 h-4 w-5/6" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex gap-4 border-b border-slate-200 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 border-b border-slate-100 p-4 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLine key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-200" />
        <div className="flex-1">
          <SkeletonLine className="mb-2 h-4 w-1/3" />
          <SkeletonLine className="h-6 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="flex-1">
            <SkeletonLine className="mb-2 h-4 w-1/2" />
            <SkeletonLine className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
