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
  const GENERAL_DEPARTMENT_OPTION = "__GERAL__";
  const [selectedDepartment, setSelectedDepartment] = useState<string>(GENERAL_DEPARTMENT_OPTION);

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

  const departmentColors = useMemo(() => {
    return metrics.department_stats.reduce<Record<string, string>>((acc, dept, idx) => {
      acc[dept.department] = piePalette[idx % piePalette.length];
      return acc;
    }, {});
  }, [metrics.department_stats]);

  const generalPieSegments = useMemo(() => {
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
        color: departmentColors[dept.department] || piePalette[idx % piePalette.length],
      };
    });

    if (segments.length > 0) {
      segments[segments.length - 1].end = 100;
    }

    return segments;
  }, [metrics.department_stats, departmentColors]);

  useEffect(() => {
    if (selectedDepartment === GENERAL_DEPARTMENT_OPTION) {
      return;
    }

    const departmentExists = metrics.department_stats.some(
      (dept) => dept.department === selectedDepartment
    );

    if (!departmentExists) {
      setSelectedDepartment(GENERAL_DEPARTMENT_OPTION);
    }
  }, [metrics.department_stats, selectedDepartment]);

  const generalPieGradient = useMemo(() => {
    if (generalPieSegments.length === 0) return "";

    return `conic-gradient(${generalPieSegments
      .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
      .join(", ")})`;
  }, [generalPieSegments]);

  const selectedDeptData = useMemo(() => {
    if (selectedDepartment === GENERAL_DEPARTMENT_OPTION) return null;

    return (
      metrics.department_stats.find((dept) => dept.department === selectedDepartment) ?? null
    );
  }, [metrics.department_stats, selectedDepartment]);

  const generalTotals = useMemo(() => {
    const sends = metrics.department_stats.reduce((sum, dept) => sum + dept.sends, 0);
    const clicks = metrics.department_stats.reduce((sum, dept) => sum + dept.clicks, 0);

    return {
      sends,
      clicks,
      rate: sends > 0 ? (clicks / sends) * 100 : 0,
    };
  }, [metrics.department_stats]);

  const departmentChartData = useMemo(() => {
    if (!selectedDeptData) return null;

    const sends = Math.max(selectedDeptData.sends || 0, 0);
    const clicks = Math.max(selectedDeptData.clicks || 0, 0);
    const total = sends + clicks;

    if (total === 0) {
      return {
        sends,
        clicks,
        total,
        sendsPercentage: 0,
        clicksPercentage: 0,
      };
    }

    return {
      sends,
      clicks,
      total,
      sendsPercentage: (sends / total) * 100,
      clicksPercentage: (clicks / total) * 100,
    };
  }, [selectedDeptData]);

  const departmentPieGradient = useMemo(() => {
    if (!departmentChartData || departmentChartData.total <= 0) return "";

    return `conic-gradient(var(--color-blue-500) 0% ${departmentChartData.sendsPercentage}%, var(--color-emerald-500) ${departmentChartData.sendsPercentage}% 100%)`;
  }, [departmentChartData]);

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

        {metrics.department_stats.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              {selectedDepartment === GENERAL_DEPARTMENT_OPTION ? (
                generalPieSegments.length > 0 ? (
                  <div className="relative w-64 h-64 rounded-full" style={{ background: generalPieGradient }}>
                    <div className="absolute inset-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-center px-3">
                      <div>
                        <p className="text-xs text-slate-500">Envios / Cliques</p>
                        <p className="text-sm font-bold text-slate-900">{generalTotals.sends} / {generalTotals.clicks}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6">
                    <p className="text-sm text-slate-500">Sem cliques para gerar o gráfico geral.</p>
                  </div>
                )
              ) : departmentChartData && departmentChartData.total > 0 ? (
                <div className="relative w-64 h-64 rounded-full" style={{ background: departmentPieGradient }}>
                  <div className="absolute inset-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-center px-3">
                    <div>
                      <p className="text-xs text-slate-500">Envios / Cliques</p>
                      <p className="text-sm font-bold text-slate-900">
                        {departmentChartData.sends} / {departmentChartData.clicks}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-64 h-64 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6">
                  <p className="text-sm text-slate-500">Sem dados de envios e cliques para o departamento.</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Selecione o departamento
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value || GENERAL_DEPARTMENT_OPTION)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={GENERAL_DEPARTMENT_OPTION}>Geral (todos os departamentos)</option>
                  {metrics.department_stats.map((departmentStat) => (
                    <option key={departmentStat.department} value={departmentStat.department}>
                      {departmentStat.department}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDepartment === GENERAL_DEPARTMENT_OPTION ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Geral (todos os departamentos)</p>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Departamentos</p>
                      <p className="font-semibold text-slate-800">{generalPieSegments.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Envios</p>
                      <p className="font-semibold text-slate-800">{generalTotals.sends}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Cliques</p>
                      <p className="font-semibold text-slate-800">{generalTotals.clicks}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Taxa</p>
                      <p className={`font-semibold ${getClickRateColor(generalTotals.rate)}`}>
                        {generalTotals.rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {generalPieSegments.length > 0 ? (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold">Departamento</th>
                            <th className="px-2 py-2 text-center font-semibold">Envios</th>
                            <th className="px-2 py-2 text-center font-semibold">Cliques</th>
                            <th className="px-2 py-2 text-center font-semibold">Taxa</th>
                            <th className="px-2 py-2 text-center font-semibold">Participação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {generalPieSegments.map((segment) => (
                            <tr key={segment.department}>
                              <td className="px-2 py-2 text-slate-800">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: segment.color }}
                                  />
                                  <span className="font-medium">{segment.department}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center text-slate-700">{segment.sends}</td>
                              <td className="px-2 py-2 text-center text-slate-700">{segment.clicks}</td>
                              <td className={`px-2 py-2 text-center font-semibold ${getClickRateColor(segment.rate)}`}>
                                {segment.rate.toFixed(1)}%
                              </td>
                              <td className="px-2 py-2 text-center text-slate-700">
                                {segment.percentage.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      Nenhum departamento com cliques para listar no gráfico.
                    </p>
                  )}
                </div>
              ) : selectedDeptData ? (
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
              ) : null}

              {selectedDepartment !== GENERAL_DEPARTMENT_OPTION && departmentChartData && departmentChartData.total > 0 && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: "var(--color-blue-500)" }}
                    />
                    <span>
                      Envios: {departmentChartData.sends} ({departmentChartData.sendsPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: "var(--color-emerald-500)" }}
                    />
                    <span>
                      Cliques: {departmentChartData.clicks} ({departmentChartData.clicksPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Sem dados de departamentos para gerar o gráfico.</p>
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
