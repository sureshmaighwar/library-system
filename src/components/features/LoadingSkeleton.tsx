function Bone({ className }: { className: string }) {
  return <div className={`shimmer ${className}`} />;
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Bone key={index} className="h-64 rounded-2xl border border-slate-200" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Bone className="h-8 rounded-xl" />
      {Array.from({ length: rows }, (_, index) => (
        <Bone key={index} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }, (_, index) => (
        <Bone key={index} className="h-28 rounded-2xl border border-slate-200" />
      ))}
    </div>
  );
}
