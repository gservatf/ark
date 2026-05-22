import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <Sidebar />
      <div className="min-h-screen lg:pl-[280px]">
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
