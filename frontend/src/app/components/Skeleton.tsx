// /frontend/src/app/components/Skeleton.tsx
// {/* Loading skeleton components to prevent layout jumps */}

export function SkeletonCard() {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-zinc-700 rounded"></div>
        <div className="flex-1">
          <div className="h-4 bg-zinc-700 rounded mb-2"></div>
          <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto animate-pulse">
      <div className="h-6 bg-zinc-700 rounded mb-4 w-1/4"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-700 rounded"></div>
            <div className="flex-1 h-4 bg-zinc-700 rounded"></div>
            <div className="w-16 h-4 bg-zinc-700 rounded"></div>
            <div className="w-20 h-4 bg-zinc-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto animate-pulse">
      <div className="h-8 bg-zinc-700 rounded mb-2 w-1/3"></div>
      <div className="h-4 bg-zinc-700 rounded mb-6 w-2/3"></div>
      <div className="h-64 bg-zinc-700 rounded"></div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-zinc-700 rounded mb-2 ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        ></div>
      ))}
    </div>
  );
}
