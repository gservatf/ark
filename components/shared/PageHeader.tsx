import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  label: string;
};

type PageHeaderProps = {
  actions?: ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  backLink,
  breadcrumbs,
  description,
  eyebrow,
  title
}: PageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 max-w-3xl">
        {backLink ? (
          <Link
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            href={backLink.href}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">{eyebrow}</p>
        ) : null}
        <h1 className={eyebrow ? "mt-2 break-words text-3xl font-bold text-slate-950" : "break-words text-3xl font-bold text-slate-950"}>
          {title}
        </h1>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {breadcrumbs.map((breadcrumb, index) => (
              <span className={index === breadcrumbs.length - 1 ? "font-medium text-slate-700" : undefined} key={`${breadcrumb.label}-${index}`}>
                {index > 0 ? <span className="mr-2 text-slate-300">&gt;</span> : null}
                {breadcrumb.label}
              </span>
            ))}
          </nav>
        ) : null}
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-3 xl:justify-end">{actions}</div> : null}
    </header>
  );
}
