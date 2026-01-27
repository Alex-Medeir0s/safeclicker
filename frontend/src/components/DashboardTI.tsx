"use client";

import { StatCard } from "@/components/StatCard";
import { FiTarget, FiCheckCircle, FiUsers, FiZap, FiBriefcase } from "react-icons/fi";

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

interface DashboardTIProps {
  metrics: DashboardMetrics;
  onCampaignClick: (campaignId: number) => void;
}

export function DashboardTI({ metrics, onCampaignClick }: DashboardTIProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard TI</h1>
        <p className="text-gray-400">Visão completa de todas as campanhas e departamentos</p>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total de Campanhas"
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
          title="Total de Usuários"
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
        <StatCard
          title="Taxa de Reporte"
          value={`${metrics.summary.report_rate.toFixed(1)}%`}
          icon={<FiBriefcase className="w-6 h-6" />}
          color="red"
        />
      </div>

      {/* Estatísticas por departamento */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Desempenho por Departamento</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Departamento</th>
                <th className="pb-3 text-right">Envios</th>
                <th className="pb-3 text-right">Cliques</th>
                <th className="pb-3 text-right">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {metrics.department_stats.map((dept, idx) => (
                <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3">{dept.department}</td>
                  <td className="py-3 text-right">{dept.sends}</td>
                  <td className="py-3 text-right">{dept.clicks}</td>
                  <td className="py-3 text-right">{dept.rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campanhas recentes */}
      {metrics.recent_campaigns && metrics.recent_campaigns.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Campanhas Recentes</h2>
          <div className="space-y-3">
            {metrics.recent_campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => onCampaignClick(campaign.id)}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 cursor-pointer transition"
              >
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(campaign.start_date || "").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-400">{campaign.users} usuários</span>
                  <span className="text-yellow-400">{campaign.clicks} cliques</span>
                  <span className="text-red-400">{campaign.reports} reportes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
