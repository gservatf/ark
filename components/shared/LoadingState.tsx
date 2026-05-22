type LoadingStateProps = {
  label?: string;
  rows?: number;
};

export function LoadingState({ label = "Cargando datos", rows = 3 }: LoadingStateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="h-4 animate-pulse rounded-full bg-slate-100" key={index} />
        ))}
      </div>
    </div>
  );
}
