"use client";

import { StatCard } from "@/components/StatCard";
import { FiTarget, FiMail, FiUsers, FiZap } from "react-icons/fi";

interface DashboardMetrics {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_users: number;
    emails_received?: number;
    emails_clicked?: number;
    click_rate: number;
    report_rate: number;
    department_campaigns?: number;
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
  sent_campaigns?: Array<{
    campaign_id: number;
    campaign_name: string;
    sends: number;
    clicks: number;
    click_rate: number;
    last_sent_at: string | null;
  }>;
  collaborators?: Array<{
    full_name: string;
    email: string;
    sends: number;
    clicks: number;
    campaigns: string[];
  }>;
}

interface DashboardGestorProps {
  metrics: DashboardMetrics;
  onCampaignClick: (campaignId: number) => void;
}

export function DashboardGestor({ metrics, onCampaignClick }: DashboardGestorProps) {
  const deptClickRate =
    (metrics.department_stats && metrics.department_stats[0]?.rate) ??
    metrics.summary.click_rate;

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
          value={metrics.summary.department_campaigns ?? metrics.summary.total_campaigns}
          icon={<FiTarget className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Emails Enviados"
          value={metrics.summary.emails_received}
          icon={<FiMail className="w-6 h-6" />}
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
          value={`${deptClickRate.toFixed(1)}%`}
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

      <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Campanhas Enviadas para o Departamento</h2>

        {metrics.sent_campaigns && metrics.sent_campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-700 border-b border-slate-300">
                  <th className="pb-3 px-4">Campanha</th>
                  <th className="pb-3 px-4 text-center">Envios</th>
                  <th className="pb-3 px-4 text-center">Cliques</th>
                  <th className="pb-3 px-4 text-center">Taxa</th>
                  <th className="pb-3 px-4 text-center">Último envio</th>
                </tr>
              </thead>
              <tbody>
                {metrics.sent_campaigns.map((campaign) => (
                  <tr
                    key={campaign.campaign_id}
                    onClick={() => onCampaignClick(campaign.campaign_id)}
                    className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 text-slate-900 font-semibold">{campaign.campaign_name}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{campaign.sends}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{campaign.clicks}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{campaign.click_rate.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {campaign.last_sent_at
                        ? new Date(campaign.last_sent_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">Nenhuma campanha enviada para o seu departamento.</p>
        )}
      </div>
    </div>
  );
}
