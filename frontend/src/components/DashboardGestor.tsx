"use client";

import { StatCard } from "@/components/StatCard";
import { FiTarget, FiCheckCircle, FiUsers, FiZap } from "react-icons/fi";

interface DashboardMetrics {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_users: number;
    emails_received?: number;
    emails_clicked?: number;
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

interface DashboardGestorProps {
  metrics: DashboardMetrics;
  onCampaignClick: (campaignId: number) => void;
}

export function DashboardGestor({ metrics, onCampaignClick }: DashboardGestorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard do Gestor</h1>
        <p className="text-gray-400">Visão do desempenho do seu departamento</p>
      </div>

      {/* Cards de estatísticas do departamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Campanhas do Departamento"
          value={metrics.summary.total_campaigns}
          icon={<FiTarget className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Campanhas Ativas"
          value={metrics.summary.active_campaigns}
          icon={<FiCheckCircle className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Usuários no Departamento"
          value={metrics.summary.total_users}
          icon={<FiUsers className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Taxa de Cliques"
          value={`${metrics.summary.click_rate.toFixed(1)}%`}
          icon={<FiZap className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Estatísticas do departamento */}
      {metrics.department_stats.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Desempenho do Departamento</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-700 border-b border-slate-300">
                  <th className="pb-3">Departamento</th>
                  <th className="pb-3 text-right">Envios</th>
                  <th className="pb-3 text-right">Cliques</th>
                  <th className="pb-3 text-right">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {metrics.department_stats.map((dept, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 text-slate-900">{dept.department}</td>
                    <td className="py-3 text-right text-slate-700">{dept.sends}</td>
                    <td className="py-3 text-right text-slate-700">{dept.clicks}</td>
                    <td className="py-3 text-right text-slate-700">{dept.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campanhas recentes do departamento */}
      {metrics.recent_campaigns && metrics.recent_campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Campanhas do Departamento</h2>
          <div className="space-y-3">
            {metrics.recent_campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => onCampaignClick(campaign.id)}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(campaign.start_date || "").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-400">{campaign.users} usuários</span>
                  <span className="text-yellow-400">{campaign.clicks} cliques</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
