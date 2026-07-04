import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Construction } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
  kpis: { label: string; value: string }[];
}

export function StubPage({ title, description, kpis }: StubPageProps) {
  return (
    <DashboardLayout title={title}>
      <div className="-m-4 min-h-screen bg-[#080B14] p-4 text-slate-100 md:-m-6 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-[13px] text-slate-400">{description}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-[18px] border border-white/[0.06] bg-[#111827] p-5 opacity-50">
              <p className="text-[11px] uppercase tracking-widest font-medium text-slate-500">{k.label}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-400">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center rounded-[18px] border border-white/[0.06] bg-[#111827] p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Construction className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-100">Module under development</h2>
          <p className="mt-1 text-[13px] text-slate-400">Available Q3 2026</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
