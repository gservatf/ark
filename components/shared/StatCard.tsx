import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type StatTone = "violet" | "amber" | "sky" | "green";

type StatCardProps = {
  label: string;
  value: string;
  link: string;
  href?: string;
  icon: LucideIcon;
  tone: StatTone;
};

const tones: Record<StatTone, string> = {
  violet: "bg-violet-100 text-violet-600",
  amber: "bg-amber-100 text-amber-600",
  sky: "bg-sky-100 text-sky-600",
  green: "bg-emerald-100 text-emerald-600"
};

export function StatCard({ href, label, value, link, icon: Icon, tone }: StatCardProps) {
  const isPositive = tone === "green";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-slate-500">{label}</p>
          <p className={cn("mt-1 text-2xl font-bold", isPositive ? "text-emerald-600" : "text-slate-950")}>
            {value}
          </p>
          {href ? (
            <Link className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700" href={href}>
              {link}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              {link}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
