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

interface ClickDetail {
  full_name: string;
  email: string;
  clicked_at: string | null;
  ip_address: string | null;
}

interface CampaignClickDetails {
  campaign_id: number;
  campaign_name: string;
  total_sends: number;
  total_clicks: number;
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedCampaign.campaign_name}</h2>
                <p className="text-indigo-100 text-sm">
                  {selectedCampaign.total_clicks} de {selectedCampaign.total_sends} usuários clicaram
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-white hover:text-indigo-100 text-xl font-bold"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {loadingClicks ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-slate-600">Carregando dados...</p>
                </div>
              </div>
            ) : selectedCampaign.clicks.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                Nenhum clique registrado nesta campanha
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {selectedCampaign.clicks.map((click, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{click.full_name}</p>
                        <p className="text-sm text-slate-600">{click.email}</p>
                        {click.ip_address && (
                          <p className="text-xs text-slate-500">IP: {click.ip_address}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {click.clicked_at
                            ? new Date(click.clicked_at).toLocaleString("pt-BR")
                            : "Data desconhecida"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
