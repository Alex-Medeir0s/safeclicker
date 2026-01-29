"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

        currentY = (doc as any).lastAutoTable?.finalY || currentY + 100;
      }

      // Salvar o PDF
      doc.save(`relatorio-campanhas-${new Date().toISOString().split("T")[0]}.pdf`);
      alert("PDF exportado com sucesso!");
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

  const deptClickRate =
    (data.department_stats && data.department_stats[0]?.rate) ?? data.summary.click_rate;
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
              <span>Campanhas do Departamento</span>
              <span className="font-bold">{deptCampaigns}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span>Emails Enviados</span>
              <span className="font-bold">{data.summary.emails_received}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span>Usuários do Departamento</span>
              <span className="font-bold">{data.summary.total_users}</span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded border border-red-200">
              <span className="text-red-700">Taxa de Cliques</span>
              <span className="font-bold text-red-700">{deptClickRate.toFixed(1)}%</span>
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
            <div className="text-center py-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{data.summary.report_rate.toFixed(1)}%</p>
              <p className="text-sm text-blue-600">Taxa de Reportes</p>
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

      <div className="mt-6 text-center">
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {exporting ? "Gerando PDF..." : "📥 Exportar PDF"}
        </button>
      </div>
    </>
  );
}
