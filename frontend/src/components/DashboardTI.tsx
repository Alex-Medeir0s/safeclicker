"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { StatCard } from "@/components/StatCard";
import { FiTarget, FiCheckCircle, FiUsers, FiZap, FiMaximize2, FiMinimize2, FiMail } from "react-icons/fi";

interface DashboardMetrics {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_users: number;
    emails_received?: number;
    emails_clicked?: number;
    trainings_completed?: number;
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
    trainings_completed?: number;
    reports?: number;
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
  const [isPieRefreshing, setIsPieRefreshing] = useState(false);
  const [isMonitorMode, setIsMonitorMode] = useState(false);
  const monitorPanelRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

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

  const monitorTotals = useMemo(() => {
    if (selectedDepartment === GENERAL_DEPARTMENT_OPTION || !selectedDeptData) {
      return {
        sends: generalTotals.sends,
        clicks: generalTotals.clicks,
      };
    }

    return {
      sends: selectedDeptData.sends,
      clicks: selectedDeptData.clicks,
    };
  }, [selectedDepartment, selectedDeptData, generalTotals]);

  const departmentChartData = useMemo(() => {
    if (!selectedDeptData) return null;

    const sends = Math.max(selectedDeptData.sends || 0, 0);
    const clicks = Math.max(selectedDeptData.clicks || 0, 0);
    const clicksForChart = Math.min(clicks, sends);

    if (sends === 0) {
      return {
        sends,
        clicks,
        clicksForChart,
        clicksPercentage: 0,
      };
    }

    return {
      sends,
      clicks,
      clicksForChart,
      clicksPercentage: (clicksForChart / sends) * 100,
    };
  }, [selectedDeptData]);

  const departmentPieGradient = useMemo(() => {
    if (!departmentChartData || departmentChartData.sends <= 0) return "";

    return `conic-gradient(var(--color-emerald-500) 0% ${departmentChartData.clicksPercentage}%, var(--color-slate-200) ${departmentChartData.clicksPercentage}% 100%)`;
  }, [departmentChartData]);

  const pieLegendItems = useMemo(() => {
    if (selectedDepartment === GENERAL_DEPARTMENT_OPTION) {
      return generalPieSegments.map((segment) => ({
        label: segment.department,
        color: segment.color,
        value: `${segment.percentage.toFixed(1)}%`,
      }));
    }

    if (!departmentChartData || departmentChartData.sends <= 0) {
      return [] as Array<{ label: string; color?: string; value: string }>;
    }

    return [
      {
        label: "Emails enviados",
        value: `${departmentChartData.sends}`,
      },
      {
        label: "Cliques",
        color: "var(--color-emerald-500)",
        value: `${departmentChartData.clicks} (${departmentChartData.clicksPercentage.toFixed(1)}%)`,
      },
    ];
  }, [selectedDepartment, generalPieSegments, departmentChartData]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setIsPieRefreshing(true);
    const timeoutId = window.setTimeout(() => {
      setIsPieRefreshing(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [metrics]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMonitorMode(document.fullscreenElement === monitorPanelRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleMonitorMode = async () => {
    try {
      if (document.fullscreenElement === monitorPanelRef.current) {
        await document.exitFullscreen();
        return;
      }

      if (monitorPanelRef.current) {
        await monitorPanelRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Erro ao alternar tela cheia do monitoramento:", error);
    }
  };

  const pieSizeClass = isMonitorMode ? "w-80 h-80" : "w-64 h-64";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard TI</h1>
        <p className="text-gray-400">Visão completa de todas as campanhas e departamentos</p>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
          title="Treinamentos Concluídos"
          value={metrics.summary.trainings_completed ?? 0}
          icon={<FiCheckCircle className="w-6 h-6" />}
          color="text-emerald-600"
        />
        <StatCard
          title="Taxa de Cliques"
          value={`${metrics.summary.click_rate.toFixed(1)}%`}
          icon={<FiZap className="w-6 h-6" />}
          color={getClickRateColor(metrics.summary.click_rate)}
        />
      </div>

      <div
        ref={monitorPanelRef}
        className={`bg-white rounded-lg shadow-lg p-6 border border-slate-200 transition-all duration-300 ${
          isMonitorMode ? "min-h-screen rounded-none p-8 overflow-y-auto flex items-center justify-center" : ""
        }`}
      >
        <div className={`w-full ${isMonitorMode ? "max-w-7xl mx-auto relative" : ""}`}>
          {isMonitorMode && (
            <div className="fixed top-4 left-0 z-50">
              <Image
                src="/safeclicker%20logo%20black.png"
                alt="SafeClicker"
                width={560}
                height={150}
                className="h-[150px] w-[560px] object-contain"
                priority
              />
            </div>
          )}
          {isMonitorMode && (
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Monitoramento em tempo real
              </span>
              <button
                onClick={handleToggleMonitorMode}
                title="Sair da tela cheia"
                aria-label="Sair da tela cheia"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <FiMinimize2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div
            className={`mb-4 flex flex-col gap-3 ${
              isMonitorMode ? "items-center text-center pt-28" : "sm:flex-row sm:items-center sm:justify-between"
            }`}
          >
            <h2 className="text-xl font-bold text-slate-900">Desempenho por Departamento</h2>
            {!isMonitorMode && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleToggleMonitorMode}
                  title="Tela cheia"
                  aria-label="Abrir em tela cheia"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <FiMaximize2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {isMonitorMode && (
            <div className="mb-8 w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Total de Emails Enviados
                  </p>
                  <FiMail className="w-5 h-5 text-slate-400" />
                </div>
                <p className="mt-4 text-5xl font-extrabold leading-none text-slate-900">{monitorTotals.sends}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Total de Cliques
                  </p>
                  <FiZap className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="mt-4 text-5xl font-extrabold leading-none text-slate-900">{monitorTotals.clicks}</p>
              </div>
            </div>
          )}

          {metrics.department_stats.length > 0 ? (
            <div className={`grid grid-cols-1 ${isMonitorMode ? "xl:grid-cols-2 gap-6 items-start" : "lg:grid-cols-2 gap-8 items-center"}`}>
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4 sm:gap-6">
              {pieLegendItems.length > 0 && (
                <div className="w-full sm:w-auto flex flex-col gap-2 order-1 items-start">
                  {pieLegendItems.map((item) => (
                    <div
                      key={item.label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        {item.color ? (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300 bg-slate-100" />
                        )}
                        <span className="font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="order-2">
                {selectedDepartment === GENERAL_DEPARTMENT_OPTION ? (
                  generalPieSegments.length > 0 ? (
                    <div
                      className={`relative ${pieSizeClass} rounded-full transition-transform duration-500 ${isPieRefreshing ? "animate-pulse scale-105" : "scale-100"}`}
                      style={{ background: generalPieGradient }}
                    >
                      {isPieRefreshing && (
                        <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </div>
                  ) : (
                    <div className={`${pieSizeClass} rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6`}>
                      <p className="text-sm text-slate-500">Sem cliques para gerar o gráfico.</p>
                    </div>
                  )
                ) : departmentChartData && departmentChartData.sends > 0 ? (
                  <div
                    className={`relative ${pieSizeClass} rounded-full transition-transform duration-500 ${isPieRefreshing ? "animate-pulse scale-105" : "scale-100"}`}
                    style={{ background: departmentPieGradient }}
                  >
                    {isPieRefreshing && (
                      <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                ) : (
                  <div className={`${pieSizeClass} rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6`}>
                    <p className="text-sm text-slate-500">Sem cliques para gerar o gráfico.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 w-full">
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
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

            </div>
          </div>
          ) : (
            <p className="text-slate-500">Sem dados de departamentos para gerar o gráfico.</p>
          )}
        </div>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${campaign.status === "scheduled" ? "bg-blue-100 text-blue-700" : campaign.status === "draft" ? "bg-yellow-100 text-yellow-700" : campaign.status === "disabled" ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {campaign.status === "scheduled" ? "Agendada" : campaign.status === "draft" ? "Rascunho" : campaign.status === "disabled" ? "Desativada" : "Enviada"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {new Date(campaign.start_date || "").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-900">{campaign.users} usuário(s)</span>
                  <span className="text-slate-900">{campaign.clicks} clique(s)</span>
                  <span className="text-slate-900">{campaign.trainings_completed ?? 0} treinamento(s)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
