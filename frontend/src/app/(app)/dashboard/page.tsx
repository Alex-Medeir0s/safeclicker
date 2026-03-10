"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { DashboardTI } from "@/components/DashboardTI";
import { DashboardGestor } from "@/components/DashboardGestor";
import { DashboardColaborador } from "@/components/DashboardColaborador";
import { FiX } from "react-icons/fi";

interface DashboardMetrics {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_users: number;
    emails_received: number;
    emails_clicked: number;
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
  sent_campaigns?: Array<{
    campaign_id: number;
    campaign_name: string;
    sends: number;
    clicks: number;
    click_rate: number;
    last_sent_at: string | null;
  }>;
}

interface ClickDetail {
  full_name: string;
  email: string;
  clicked_at: string | null;
  ip_address: string | null;
  training_completed: boolean;
  training_completed_at: string | null;
}

interface CampaignClickDetails {
  campaign_id: number;
  campaign_name: string;
  total_sends: number;
  total_clicks: number;
  total_trainings: number;
  clicks: ClickDetail[];
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department_id?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignClickDetails | null>(null);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token) {
      router.push("/");
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchMetrics();

    const intervalId = window.setInterval(() => {
      fetchMetrics();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [router]);

  const fetchMetrics = async () => {
    try {
      const response = await api.get("/metrics/dashboard");
      setMetrics(response.data);
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      setMetrics({
        summary: {
          total_campaigns: 0,
          active_campaigns: 0,
          total_users: 0,
          emails_received: 0,
          emails_clicked: 0,
          trainings_completed: 0,
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

  const fetchCampaignClicks = async (campaignId: number) => {
    setLoadingClicks(true);
    try {
      const response = await api.get(`/metrics/campaigns/${campaignId}/clicks`);
      setSelectedCampaign(response.data);
    } catch (error) {
      console.error("Erro ao buscar cliques:", error);
    } finally {
      setLoadingClicks(false);
    }
  };

  const formatDateTimeBrasilia = (dateTime: string | null | undefined) => {
    if (!dateTime) return "Data desconhecida";

    const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(dateTime);
    const normalizedDateTime = hasTimezone ? dateTime : `${dateTime}Z`;
    const parsedDate = new Date(normalizedDateTime);

    if (Number.isNaN(parsedDate.getTime())) return "Data desconhecida";

    return parsedDate.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
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

  // Renderizar dashboard específico por role
  const renderDashboard = () => {
    if (!user) return null;

    const role = user.role.toUpperCase();

    if (role === "TI") {
      return <DashboardTI metrics={metrics} onCampaignClick={fetchCampaignClicks} />;
    } else if (role === "GESTOR") {
      return <DashboardGestor metrics={metrics} onCampaignClick={fetchCampaignClicks} />;
    } else if (role === "COLABORADOR") {
      return <DashboardColaborador metrics={metrics} />;
    }

    // Fallback: dashboard padrão
    return <DashboardColaborador metrics={metrics} />;
  };

  return (
    <>
      {renderDashboard()}

      {/* Modal de Cliques */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[88vh] overflow-hidden">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 sm:p-7 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">{selectedCampaign.campaign_name}</h2>
                <p className="text-indigo-100 text-sm sm:text-base mt-1">
                  {selectedCampaign.total_clicks} de {selectedCampaign.total_sends} usuários clicaram • {selectedCampaign.total_trainings} concluíram o treinamento
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {loadingClicks ? (
              <div className="flex items-center justify-center py-20 bg-slate-50">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-600">Carregando dados...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[66vh] bg-slate-50 p-6 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {selectedCampaign.clicks.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500">Nenhum clique registrado nesta campanha.</div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {selectedCampaign.clicks.map((click, idx) => (
                        <div key={`${click.email}-click-${idx}`} className="p-5 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900 text-base">{click.full_name}</p>
                              <p className="text-sm text-slate-600">{click.email}</p>
                              {click.training_completed ? (
                                <span className="inline-flex items-center mt-2 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">
                                  Fez o treinamento
                                </span>
                              ) : (
                                <span className="inline-flex items-center mt-2 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-semibold">
                                  Não fez o treinamento
                                </span>
                              )}
                              {click.ip_address && (
                                <p className="text-xs text-slate-500 mt-1">IP: {click.ip_address}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">
                                {formatDateTimeBrasilia(click.clicked_at)}
                              </p>
                              {click.training_completed && (
                                <p className="text-xs text-emerald-600 mt-1">
                                  Treinamento: {formatDateTimeBrasilia(click.training_completed_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
