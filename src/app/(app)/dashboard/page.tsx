"use client";

import { StatCard } from "@/components/StatCard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

interface DashboardMetrics {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_users: number;
    click_rate: number;
    report_rate: number;
  };
  department_stats: Array<{
    department: string;
    sends: number;
    clicks: number;
    rate: number;
  }>;
}

export default function Dashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchMetrics();
  }, [router]);

  const fetchMetrics = async () => {
    try {
      const response = await api.get("/api/metrics/dashboard");
      setMetrics(response.data);
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando dados...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-12">Erro ao carregar métricas</div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="Taxa de Cliques" value={`${metrics.summary.click_rate.toFixed(1)}%`} color="text-red-500" />
        <StatCard title="Taxa de Reporte" value={`${metrics.summary.report_rate.toFixed(1)}%`} color="text-emerald-500" />
        <StatCard title="Usuários Impactados" value={metrics.summary.total_users.toString()} />
        <StatCard title="Campanhas Ativas" value={metrics.summary.active_campaigns.toString()} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Estatísticas por Departamento</h2>
          <div className="space-y-3">
            {metrics.department_stats.map((dept, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-slate-900">{dept.department}</p>
                  <p className="text-sm text-slate-500">{dept.sends} enviados</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{dept.clicks}</p>
                  <p className="text-sm text-red-600">{dept.rate.toFixed(1)}% clicaram</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Resumo Geral</h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span className="text-slate-700">Total de Campanhas</span>
              <span className="font-bold text-slate-900">{metrics.summary.total_campaigns}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span className="text-slate-700">Campanhas Ativas</span>
              <span className="font-bold text-slate-900">{metrics.summary.active_campaigns}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span className="text-slate-700">Total de Usuários</span>
              <span className="font-bold text-slate-900">{metrics.summary.total_users}</span>
            </div>
            <div className="flex justify-between p-3 bg-emerald-50 rounded border border-emerald-200">
              <span className="text-emerald-700 font-medium">Taxa de Segurança</span>
              <span className="font-bold text-emerald-700">{(100 - metrics.summary.click_rate).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
