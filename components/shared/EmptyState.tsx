import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  icon?: LucideIcon;
  title: string;
};

export function EmptyState({ action, description, icon: Icon, title }: EmptyStateProps) {
  return (
    <div className="px-5 py-10 text-center sm:px-8">
      {Icon ? (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <p className={Icon ? "mt-4 text-base font-bold text-slate-800" : "text-base font-bold text-slate-800"}>
        {title}
      </p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
