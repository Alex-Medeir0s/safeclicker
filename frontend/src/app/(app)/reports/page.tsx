"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiX } from "react-icons/fi";

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

export default function Reports() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignClickDetails | null>(null);
  const [loadingClicks, setLoadingClicks] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchReportData();
  }, [router]);

  const fetchReportData = async () => {
    try {
      const response = await api.get("/metrics/dashboard");
      setData(response.data);
    } catch (error) {
      console.error("Erro ao buscar relatório:", error);
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

  const fetchImageAsDataUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Falha ao carregar imagem"));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
      return "";
    }
  };

  const getImageSize = async (dataUrl: string): Promise<{ width: number; height: number }> => {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error("Falha ao obter tamanho da imagem"));
      img.src = dataUrl;
    });
  };

  const handleExportPdf = async () => {
    if (!data || exporting) return;
    setExporting(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Logo e título
      const logoDataUrl = await fetchImageAsDataUrl("/safeclicker-logo-branca.png");
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 70, "F");

      if (logoDataUrl) {
        const logoSize = await getImageSize(logoDataUrl);
        const maxLogoHeight = 60;
        const scale = Math.min(1, maxLogoHeight / logoSize.height);
        const logoWidth = logoSize.width * scale;
        const logoHeight = logoSize.height * scale;
        const logoX = 40;
        const logoY = (70 - logoHeight) / 2;
        doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
      }

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("Relatório de Campanhas", pageWidth - 40, 40, { align: "right" });
      doc.setTextColor(0, 0, 0);

      // Resumo Geral
      const deptClickRate =
        (data.department_stats && data.department_stats[0]?.rate) ?? data.summary.click_rate;
      const deptCampaigns = data.summary.department_campaigns ?? data.summary.total_campaigns;

      doc.setFontSize(12);
      doc.text("Resumo Geral", 40, 90);

      autoTable(doc, {
        startY: 100,
        head: [["Métrica", "Valor"]],
        body: [
          ["Campanhas do Departamento", String(deptCampaigns)],
          ["Emails Enviados", String(data.summary.emails_received)],
          ["Usuários do Departamento", String(data.summary.total_users)],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40 },
      });

      let currentY = (doc as any).lastAutoTable?.finalY || 140;

      // Taxa de Segurança
      doc.setFontSize(12);
      doc.text("Taxa de Segurança", 40, currentY + 20);

      autoTable(doc, {
        startY: currentY + 30,
        head: [["Indicador", "Valor"]],
        body: [
          ["Colaboradores Seguros", `${(100 - deptClickRate).toFixed(1)}%`],
          ["Taxa de Cliques", `${deptClickRate.toFixed(1)}%`],
          ["Taxa de Reportes", `${data.summary.report_rate.toFixed(1)}%`],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40 },
      });

      currentY = (doc as any).lastAutoTable?.finalY || currentY + 90;

      // Estatísticas por Departamento
      if (data.department_stats && data.department_stats.length > 0) {
        doc.setFontSize(12);
        doc.text("Estatísticas por Departamento", 40, currentY + 20);

        autoTable(doc, {
          startY: currentY + 30,
          head: [["Departamento", "Enviados", "Cliques", "Taxa %"]],
          body: data.department_stats.map((dept: any) => [
            dept.department,
            String(dept.sends),
            String(dept.clicks),
            `${dept.rate.toFixed(1)}%`,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          margin: { left: 40, right: 40 },
        });

        currentY = (doc as any).lastAutoTable?.finalY || currentY + 100;
      }

      // Campanhas Recentes com Cliques
      if (data.recent_campaigns && data.recent_campaigns.length > 0) {
        if (currentY > 700) {
          doc.addPage();
          currentY = 40;
        }

        doc.setFontSize(12);
        doc.text("Campanhas Recentes e Cliques", 40, currentY + 20);

        // Para cada campanha, buscar os cliques
        for (const campaign of data.recent_campaigns) {
          if (currentY > 700) {
            doc.addPage();
            currentY = 40;
          }

          currentY += 30;
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          doc.text(`Campanha: ${campaign.name}`, 40, currentY);
          doc.setTextColor(0, 0, 0);

          // Buscar os cliques da campanha
          try {
            const clicksResponse = await api.get(`/metrics/campaigns/${campaign.id}/clicks`);
            const clicksData = clicksResponse.data;

            currentY += 15;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(
              `Enviados: ${clicksData.total_sends} | Cliques: ${clicksData.total_clicks}`,
              40,
              currentY
            );
            doc.setTextColor(0, 0, 0);

            if (clicksData.clicks && clicksData.clicks.length > 0) {
              currentY += 15;

              // Tabela com quem clicou
              autoTable(doc, {
                startY: currentY,
                head: [["Usuário", "Email", "Data e Hora", "IP"]],
                body: clicksData.clicks.map((click: any) => [
                  click.full_name,
                  click.email,
                  click.clicked_at
                    ? new Date(click.clicked_at).toLocaleString("pt-BR")
                    : "-",
                  click.ip_address || "-",
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
                margin: { left: 40, right: 40 },
              });

              currentY = (doc as any).lastAutoTable?.finalY || currentY + 50;
            } else {
              currentY += 10;
              doc.setFontSize(9);
              doc.setTextColor(150, 150, 150);
              doc.text("Nenhum clique registrado nesta campanha", 40, currentY);
              doc.setTextColor(0, 0, 0);
              currentY += 10;
            }
          } catch (error) {
            console.error(`Erro ao buscar cliques da campanha ${campaign.id}:`, error);
          }
        }
      }

      // Colaboradores do Departamento
      if (data.collaborators && data.collaborators.length > 0) {
        if (currentY > 700) {
          doc.addPage();
          currentY = 40;
        }

        doc.setFontSize(12);
        doc.text("Colaboradores do Departamento", 40, currentY + 20);

        autoTable(doc, {
          startY: currentY + 30,
          head: [["Colaborador", "Email", "Enviados", "Cliques", "Campanhas"]],
          body: data.collaborators.map((c: any) => [
            c.full_name,
            c.email,
            String(c.sends),
            String(c.clicks),
            c.campaigns && c.campaigns.length > 0 ? c.campaigns.join(", ") : "-",
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          margin: { left: 40, right: 40 },
        });
      }

      // Salvar o PDF
      doc.save(`relatorio-campanhas-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao exportar PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando relatório...</div>;
  }

  if (!data) {
    return <div className="text-center py-12">Erro ao carregar dados</div>;
  }

  // Calcular totais a partir da tabela de departamentos
  let totalEnviadosDepts = 0;
  let totalCliquesDepts = 0;
  
  if (data.department_stats && data.department_stats.length > 0) {
    data.department_stats.forEach((dept: any) => {
      totalEnviadosDepts += dept.sends || 0;
      totalCliquesDepts += dept.clicks || 0;
    });
  }

  const deptClickRate = totalEnviadosDepts > 0 ? (totalCliquesDepts / totalEnviadosDepts) * 100 : 0;
  const deptCampaigns = data.summary.department_campaigns ?? data.summary.total_campaigns;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
        <p className="text-slate-600">Análise consolidada de campanhas e treinamentos</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Resumo Geral</h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span>Total de Campanhas</span>
              <span className="font-bold">{deptCampaigns}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span>Emails Enviados</span>
              <span className="font-bold">{data.summary.emails_received}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span>Total de Usuários</span>
              <span className="font-bold">{data.summary.total_users}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Taxa de Segurança</h2>
          <div className="space-y-3">
            <div className="text-center py-6 bg-emerald-50 rounded border border-emerald-200">
              <p className="text-4xl font-bold text-emerald-700">
                {(100 - deptClickRate).toFixed(1)}%
              </p>
              <p className="text-sm text-emerald-600 mt-2">Colaboradores Seguros</p>
            </div>
            <div className="text-center py-4 bg-red-50 rounded border border-red-200">
              <p className="text-2xl font-bold text-red-700">{deptClickRate.toFixed(1)}%</p>
              <p className="text-sm text-red-600">Taxa de Cliques</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Estatísticas por Departamento</h2>
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Departamento</th>
              <th className="px-4 py-2 text-right text-sm font-semibold">Enviados</th>
              <th className="px-4 py-2 text-right text-sm font-semibold">Cliques</th>
              <th className="px-4 py-2 text-right text-sm font-semibold">Taxa %</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.department_stats.map((dept: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">{dept.department}</td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">{dept.sends}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">{dept.clicks}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-red-700">
                  {dept.rate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.collaborators && data.collaborators.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-bold mb-4">Colaboradores do Departamento</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Colaborador</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Emails Enviados</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Cliques</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Campanhas Enviadas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.collaborators.map((c: any, idx: number) => (
                  <tr key={`${c.email}-${idx}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div className="font-semibold">{c.full_name}</div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-700">{c.sends}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-700">{c.clicks}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {c.campaigns && c.campaigns.length > 0 ? c.campaigns.join(", ") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campanhas Recentes */}
      {data.recent_campaigns && data.recent_campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200 mt-8">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Campanhas Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Campanha</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Emails Enviados</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Cliques</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Início</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recent_campaigns.map((campaign: any) => (
                  <tr
                    key={campaign.id}
                    onClick={() => fetchCampaignClicks(campaign.id)}
                    className="hover:bg-indigo-50 cursor-pointer transition-all duration-300"
                  >
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">{campaign.name}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          campaign.status === "draft"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {campaign.status === "draft" ? "Rascunho" : "Enviada"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-700">{campaign.users}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">{campaign.clicks}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                      {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString("pt-BR") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {exporting ? "Gerando PDF..." : "Exportar PDF"}
        </button>
      </div>

      {/* Modal de Cliques */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedCampaign.campaign_name}</h2>
                <p className="text-indigo-100 text-sm">
                  {selectedCampaign.total_clicks} de {selectedCampaign.total_sends} usuários clicaram
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-white hover:text-indigo-100 text-xl font-bold transition-colors"
              >
                <FiX className="w-6 h-6" />
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
                          <p className="text-xs text-slate-500 mt-1">IP: {click.ip_address}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {click.clicked_at && (
                          <p className="text-sm text-slate-600">
                            {new Date(click.clicked_at).toLocaleString("pt-BR")}
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
    </>
  );
}
