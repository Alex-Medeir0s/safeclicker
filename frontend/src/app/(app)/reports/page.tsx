"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export default function Reports() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
              <span className="font-bold">{data.summary.total_campaigns}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span>Campanhas Ativas</span>
              <span className="font-bold">{data.summary.active_campaigns}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded">
              <span>Total de Usuários</span>
              <span className="font-bold">{data.summary.total_users}</span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded border border-red-200">
              <span className="text-red-700">Taxa de Cliques</span>
              <span className="font-bold text-red-700">{data.summary.click_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Taxa de Segurança</h2>
          <div className="space-y-3">
            <div className="text-center py-6 bg-emerald-50 rounded border border-emerald-200">
              <p className="text-4xl font-bold text-emerald-700">
                {(100 - data.summary.click_rate).toFixed(1)}%
              </p>
              <p className="text-sm text-emerald-600 mt-2">Colaboradores Seguros</p>
            </div>
            <div className="text-center py-4 bg-red-50 rounded border border-red-200">
              <p className="text-2xl font-bold text-red-700">{data.summary.click_rate.toFixed(1)}%</p>
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

      <div className="mt-6 text-center">
        <button className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg">
          📥 Exportar PDF
        </button>
      </div>
    </>
  );
}
