import { StatCard } from "@/components/StatCard";

export default function Dashboard() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="Taxa de Cliques" value="15.6%" color="text-red-500" />
        <StatCard title="Taxa de Reporte" value="24.3%" color="text-emerald-500" />
        <StatCard title="Usuários Impactados" value="795" />
        <StatCard title="Campanhas Ativas" value="2" />
      </div>
    </>
  );
}
