"use client";

import { useEffect, useMemo, useState } from "react";
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

interface DashboardTIProps {
  metrics: DashboardMetrics;
  onCampaignClick: (campaignId: number) => void;
}

export function DashboardTI({ metrics, onCampaignClick }: DashboardTIProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const getClickRateColor = (rate: number) => {
    const normalizedRate = Math.max(0, Math.min(100, rate));

    if (normalizedRate <= 33) return "text-green-600";
    if (normalizedRate <= 66) return "text-yellow-500";
    return "text-red-600";
  };

  const piePalette = [
    "var(--color-blue-500)",
    "var(--color-emerald-500)",
    "var(--color-amber-500)",
    "var(--color-violet-500)",
    "var(--color-cyan-500)",
    "var(--color-rose-500)",
    "var(--color-lime-500)",
    "var(--color-orange-500)",
  ];

  const pieSegments = useMemo(() => {
    const source = metrics.department_stats.filter((dept) => dept.clicks > 0);

    if (source.length === 0) {
      return [] as Array<{
        department: string;
        sends: number;
        clicks: number;
        rate: number;
        percentage: number;
        start: number;
        end: number;
        color: string;
      }>;
    }

    const totalClicks = source.reduce((sum, dept) => sum + dept.clicks, 0);
    const actualPercentages = source.map((dept) =>
      totalClicks > 0 ? (dept.clicks / totalClicks) * 100 : 0
    );

    const chartPercentages =
      totalClicks > 0 ? actualPercentages : source.map(() => 100 / source.length);

    let accumulated = 0;

    const segments = source.map((dept, idx) => {
      const percentage = actualPercentages[idx];
      const chartPercentage = chartPercentages[idx];
      const start = accumulated;
      const end = accumulated + chartPercentage;
      accumulated = end;

      return {
        ...dept,
        percentage,
        start,
        end,
        color: piePalette[idx % piePalette.length],
      };
    });

    if (segments.length > 0) {
      segments[segments.length - 1].end = 100;
    }

    return segments;
  }, [metrics.department_stats]);

  useEffect(() => {
    if (pieSegments.length === 0) {
      setSelectedDepartment(null);
      return;
    }

    if (!selectedDepartment || !pieSegments.some((seg) => seg.department === selectedDepartment)) {
      setSelectedDepartment(pieSegments[0].department);
    }
  }, [pieSegments, selectedDepartment]);

  const pieGradient = useMemo(() => {
    if (pieSegments.length === 0) return "";

    return `conic-gradient(${pieSegments
      .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
      .join(", ")})`;
  }, [pieSegments]);

  const selectedDeptData = metrics.department_stats.find(
    (dept) => dept.department === selectedDepartment
  );

  const selectedDeptSegment = pieSegments.find(
    (segment) => segment.department === selectedDepartment
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard TI</h1>
        <p className="text-gray-400">Visão completa de todas as campanhas e departamentos</p>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          color={getClickRateColor(metrics.summary.click_rate)}
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Desempenho por Departamento (Geral)</h2>

        {pieSegments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <div className="relative w-64 h-64 rounded-full" style={{ background: pieGradient }}>
                <div className="absolute inset-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-center px-3">
                  <div>
                    <p className="text-xs text-slate-500">Total de cliques</p>
                    <p className="text-lg font-bold text-slate-900">
                      {pieSegments.reduce((sum, segment) => sum + segment.clicks, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Selecione o departamento
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedDeptSegment?.color || "var(--color-slate-400)" }}
                  />
                  <select
                    value={selectedDepartment ?? ""}
                    onChange={(e) => setSelectedDepartment(e.target.value || null)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {pieSegments.map((segment) => (
                      <option
                        key={segment.department}
                        value={segment.department}
                        style={{ color: segment.color }}
                      >
                        ● {segment.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDeptData && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900 mb-2">{selectedDeptData.department}</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Envios</p>
                      <p className="font-semibold text-slate-800">{selectedDeptData.sends}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Cliques</p>
                      <p className="font-semibold text-slate-800">{selectedDeptData.clicks}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Taxa</p>
                      <p className={`font-semibold ${getClickRateColor(selectedDeptData.rate)}`}>
                        {selectedDeptData.rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Sem dados de cliques por departamento para gerar o gráfico.</p>
        )}
      </div>

      {/* Campanhas recentes */}
      {metrics.recent_campaigns && metrics.recent_campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Campanhas Recentes</h2>
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
