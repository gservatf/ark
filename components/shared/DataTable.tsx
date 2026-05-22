import type { ReactNode } from "react";

type DataTableProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  emptyState?: ReactNode;
  footer?: ReactNode;
  isEmpty?: boolean;
  minWidth?: number;
  title: string;
};

export function DataTable({
  actions,
  children,
  description,
  emptyState,
  footer,
  isEmpty = false,
  minWidth,
  title
}: DataTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {isEmpty ? null : (
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-sm"
            style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
          >
            {children}
          </table>
        </div>
      )}

      {isEmpty ? emptyState : null}
      {footer}
    </section>
  );
}
