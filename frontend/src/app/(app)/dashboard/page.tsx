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
  recent_campaigns?: Array<{
    id: number;
    name: string;
    status: string;
    users: number;
    clicks: number;
    reports: number;
    start_date: string | null;
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
      const response = await api.get("/metrics/dashboard");
      setMetrics(response.data);
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      // Usar dados de exemplo em caso de erro
      setMetrics({
        summary: {
          total_campaigns: 0,
          active_campaigns: 0,
          total_users: 0,
          click_rate: 0,
          report_rate: 0,
        },
        department_stats: [],
        recent_campaigns: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center py-12 text-red-600 font-medium">Erro ao carregar métricas</div>;
  }

  const recentCampaigns = metrics.recent_campaigns ?? [];
  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    active: "Ativa",
    paused: "Pausada",
    completed: "Concluída",
  };

  return (
    <>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600">Visão geral de segurança e campanhas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Taxa de Cliques" 
          value={`${metrics.summary.click_rate.toFixed(1)}%`} 
          color="text-red-600" 
          icon="🎯"
          trend={{ value: "2.3%", isPositive: false }}
        />
        <StatCard 
          title="Taxa de Reporte" 
          value={`${metrics.summary.report_rate.toFixed(1)}%`} 
          color="text-emerald-600" 
          icon="✅"
          trend={{ value: "5.1%", isPositive: true }}
        />
        <StatCard 
          title="Usuários Impactados" 
          value={metrics.summary.total_users.toString()} 
          color="text-blue-600"
          icon="👥"
        />
        <StatCard 
          title="Campanhas Ativas" 
          value={metrics.summary.active_campaigns.toString()} 
          color="text-purple-600"
          icon="🚀"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg card-hover border border-slate-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              🏢
            </div>
            <h2 className="text-xl font-bold text-slate-800">Estatísticas por Departamento</h2>
          </div>
          <div className="space-y-3">
            {metrics.department_stats.map((dept, idx) => (
              <div 
                key={idx} 
                style={{ animationDelay: `${idx * 0.1}s` }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300 animate-fade-in border border-slate-200"
              >
                <div>
                  <p className="font-semibold text-slate-900">{dept.department}</p>
                  <p className="text-sm text-slate-600">📧 {dept.sends} enviados</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{dept.clicks}</p>
                  <p className="text-sm font-semibold text-red-600">👆 {dept.rate.toFixed(1)}% clicaram</p>
                </div>
              </div>
            ))}
            {metrics.department_stats.length === 0 && (
              <p className="text-center py-8 text-slate-500">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg card-hover border border-slate-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              📊
            </div>
            <h2 className="text-xl font-bold text-slate-800">Resumo Geral</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all">
              <span className="text-slate-700 font-medium">📋 Total de Campanhas</span>
              <span className="font-bold text-slate-900 text-lg">{metrics.summary.total_campaigns}</span>
            </div>
            <div className="flex justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all">
              <span className="text-slate-700 font-medium">🚀 Campanhas Ativas</span>
              <span className="font-bold text-slate-900 text-lg">{metrics.summary.active_campaigns}</span>
            </div>
            <div className="flex justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:shadow-md transition-all">
              <span className="text-slate-700 font-medium">👤 Total de Usuários</span>
              <span className="font-bold text-slate-900 text-lg">{metrics.summary.total_users}</span>
            </div>
            <div className="flex justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300 hover:shadow-lg transition-all">
              <span className="text-emerald-700 font-bold flex items-center gap-2">
                🛡️ Taxa de Segurança
              </span>
              <span className="font-bold text-emerald-700 text-xl">{(100 - metrics.summary.click_rate).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Campanhas Recentes */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg card-hover border border-slate-100 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              🕒
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Campanhas Recentes</h2>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-slate-700">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50">
              <tr>
                <th className="px-4 py-3">Campanha</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Usuários</th>
                <th className="px-4 py-3">Cliques</th>
                <th className="px-4 py-3">Reportes</th>
                <th className="px-4 py-3">Início</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCampaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">Nenhuma campanha recente</td>
                </tr>
              )}

              {recentCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{campaign.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {statusLabels[campaign.status?.toLowerCase()] ?? campaign.status ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{campaign.users}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{campaign.clicks}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{campaign.reports}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
