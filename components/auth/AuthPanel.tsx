import { Building2 } from "lucide-react";

export function AuthPanel({
  children,
  subtitle,
  title
}: {
  children: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand-700">
            <Building2 className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">C y P</p>
            <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
