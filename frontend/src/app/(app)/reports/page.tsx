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

  const formatStatus = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "Ativa";
      case "completed":
        return "Concluída";
      case "paused":
        return "Pausada";
      case "draft":
        return "Rascunho";
      case "scheduled":
        return "Agendada";
      case "canceled":
        return "Cancelada";
      default:
        return status || "-";
    }
  };

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

  const departmentStats = data?.department_stats ?? [];
  const totalEnviadosDepts = departmentStats.reduce(
    (total: number, dept: any) => total + (dept.sends || 0),
    0
  );
  const totalCliquesDepts = departmentStats.reduce(
    (total: number, dept: any) => total + (dept.clicks || 0),
    0
  );
  const deptClickRate = totalEnviadosDepts > 0 ? (totalCliquesDepts / totalEnviadosDepts) * 100 : 0;
  const deptCampaigns = data?.summary?.department_campaigns ?? data?.summary?.total_campaigns ?? 0;
  const totalEmails = data?.summary?.emails_received ?? totalEnviadosDepts;

  const handleExportPdf = async () => {
    if (!data || exporting) return;
    setExporting(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const companyName = localStorage.getItem("companyName") || "SafeClicker";
      const generatedAt = new Date().toLocaleString("pt-BR");

      const tableHeadStyles = { fillColor: [234, 234, 234], textColor: [17, 24, 39], fontStyle: "bold" };
      const tableStyles = { fontSize: 10, textColor: [15, 23, 42], cellPadding: 6, halign: "center" as const };
      const tableAltRowStyles = { fillColor: [247, 247, 247] };

      const formatStatusForPdf = (status?: string) => {
        return formatStatus(status);
      };

      const drawMetricCard = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        value: string,
        accent: [number, number, number]
      ) => {
        doc.setFillColor(245, 246, 248);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, w, h, 6, 6, "FD");
        doc.setFillColor(...accent);
        doc.rect(x, y, 6, h, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text(title, x + 14, y + 18);
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text(value, x + 14, y + 40);
      };

      // Logo e título
      const logoDataUrl = await fetchImageAsDataUrl("/safeclicker-logo-branca.png");
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 70, "F");

      if (logoDataUrl) {
        const logoSize = await getImageSize(logoDataUrl);
        const maxLogoHeight = 72;
        const scale = Math.min(1, maxLogoHeight / logoSize.height);
        const logoWidth = logoSize.width * scale;
        const logoHeight = logoSize.height * scale;
        const logoX = 40;
        const logoY = (70 - logoHeight) / 2;
        doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.setTextColor(255, 255, 255);
      doc.text("Relatório de Campanhas", pageWidth - 40, 40, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(companyName, pageWidth - 40, 56, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Gerado em: ${generatedAt}`, pageWidth - 40, 68, { align: "right" });
      doc.setTextColor(0, 0, 0);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Indicadores", 40, 96);

      const cardsStartY = 110;
      const cardGap = 10;
      const cardWidth = (pageWidth - 80 - cardGap * 3) / 4;
      const cardHeight = 58;

      drawMetricCard(40, cardsStartY, cardWidth, cardHeight, "Campanhas", String(deptCampaigns), [59, 130, 246]);
      drawMetricCard(
        40 + (cardWidth + cardGap) * 1,
        cardsStartY,
        cardWidth,
        cardHeight,
        "Emails",
        String(totalEmails),
        [16, 185, 129]
      );
      drawMetricCard(
        40 + (cardWidth + cardGap) * 2,
        cardsStartY,
        cardWidth,
        cardHeight,
        "Usuários",
        String(data.summary.total_users),
        [99, 102, 241]
      );
      drawMetricCard(
        40 + (cardWidth + cardGap) * 3,
        cardsStartY,
        cardWidth,
        cardHeight,
        "Segurança",
        `${(100 - deptClickRate).toFixed(1)}%`,
        [34, 197, 94]
      );

      let currentY = cardsStartY + cardHeight + 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const activeCampaignsSummary = data.summary.active_campaigns ?? deptCampaigns;
      const summaryText = `No período analisado, ${activeCampaignsSummary} campanhas foram executadas, com ${totalEmails} emails enviados. A taxa de segurança observada foi de ${(100 - deptClickRate).toFixed(1)}%, indicando que ${deptClickRate.toFixed(1)}% dos usuários clicaram.`;
      const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 80);
      doc.text(summaryLines, 40, currentY + 12);
      currentY = currentY + 12 + summaryLines.length * 14 + 8;
      doc.setTextColor(0, 0, 0);

      if (data.recent_campaigns && data.recent_campaigns.length > 0) {
        doc.setFontSize(14);
        doc.text("Campanhas Recentes", 40, currentY + 22);

        autoTable(doc, {
          startY: currentY + 36,
          head: [["Campanha", "Status", "Emails Enviados", "Cliques", "Início"]],
          body: data.recent_campaigns.map((campaign: any) => [
            campaign.name,
            formatStatusForPdf(campaign.status),
            String(campaign.users),
            String(campaign.clicks),
            campaign.start_date ? new Date(campaign.start_date).toLocaleDateString("pt-BR") : "-",
          ]),
          styles: tableStyles,
          headStyles: tableHeadStyles,
          alternateRowStyles: tableAltRowStyles,
          columnStyles: {
            0: { halign: "left" },
            4: { halign: "right" },
          },
          didParseCell: (hookData) => {
            if (hookData.section === "body" && hookData.column.index === 1) {
              const raw = String(hookData.cell.raw || "").trim().toLowerCase();
              hookData.cell.styles.fontStyle = "bold";
              if (raw.includes("rascunho")) {
                hookData.cell.styles.textColor = [107, 114, 128];
              } else if (raw.includes("enviada") || raw.includes("agendada")) {
                hookData.cell.styles.textColor = [59, 130, 246];
              } else if (raw.includes("ativa")) {
                hookData.cell.styles.textColor = [34, 197, 94];
              } else if (raw.includes("concluída") || raw.includes("concluida")) {
                hookData.cell.styles.textColor = [37, 99, 235];
              }
            }
          },
        });
        currentY = (doc as any).lastAutoTable?.finalY || currentY + 110;
      }

      if (data.collaborators && data.collaborators.length > 0) {
        doc.setFontSize(14);
        doc.text("Colaboradores do Departamento", 40, currentY + 22);

        autoTable(doc, {
          startY: currentY + 36,
          head: [["Colaborador", "Email", "Envios", "Cliques", "Campanhas"]],
          body: data.collaborators.map((c: any) => [
            c.full_name,
            c.email,
            String(c.sends),
            String(c.clicks),
            c.campaigns && c.campaigns.length > 0 ? c.campaigns.join(", ") : "-",
          ]),
          styles: tableStyles,
          headStyles: tableHeadStyles,
          alternateRowStyles: tableAltRowStyles,
          columnStyles: {
            0: { halign: "left" },
            1: { halign: "left" },
          },
        });
        currentY = (doc as any).lastAutoTable?.finalY || currentY + 110;
      }

      // Campanhas ativas e cliques
      const campaignsResponse = await api.get("/campaigns/");
      const activeCampaigns = (campaignsResponse.data || []).filter(
        (campaign: any) => campaign.status === "active"
      );

      if (activeCampaigns.length > 0) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.line(40, currentY + 10, pageWidth - 40, currentY + 10);
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text("Detalhamento", 40, currentY + 28);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Campanhas Ativas e Cliques", 40, currentY + 46);
        currentY = currentY + 54;

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.line(40, currentY, pageWidth - 40, currentY);
        currentY += 12;

        for (const campaign of activeCampaigns) {
          if (currentY > 720) {
            doc.addPage();
            currentY = 40;
          }

          doc.setFontSize(11);
          doc.text(`${campaign.name} (ID: ${campaign.id})`, 40, currentY);
          currentY += 10;

          const clicksResponse = await api.get(`/metrics/campaigns/${campaign.id}/clicks`);
          const clicks = clicksResponse.data?.clicks || [];

          autoTable(doc, {
            startY: currentY + 12,
            head: [["Nome", "Email", "IP", "Data do Clique"]],
            body:
              clicks.length > 0
                ? clicks.map((click: any) => [
                    click.full_name,
                    click.email,
                    click.ip_address || "-",
                    click.clicked_at
                      ? new Date(click.clicked_at).toLocaleString("pt-BR")
                      : "-",
                  ])
                : [["Nenhum clique registrado", "-", "-", "-"]],
            styles: { ...tableStyles, fontSize: 9 },
            headStyles: tableHeadStyles,
            alternateRowStyles: tableAltRowStyles,
            columnStyles: {
              0: { halign: "left" },
              1: { halign: "left" },
            },
          });

          currentY = (doc as any).lastAutoTable?.finalY || currentY + 56;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text("Dados para fins de auditoria", 40, currentY + 10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          currentY += 18;
        }
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Página ${page} de ${totalPages} | Gerado automaticamente pelo sistema ${companyName}`,
          pageWidth / 2,
          pageHeight - 16,
          { align: "center" }
        );
      }

      doc.save("relatorio-campanhas.pdf");
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
              <span className="font-bold">{totalEmails}</span>
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
