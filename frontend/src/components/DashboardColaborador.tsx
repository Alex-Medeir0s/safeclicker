"use client";

import { StatCard } from "@/components/StatCard";
import { FiTarget, FiZap, FiAlertCircle, FiAward } from "react-icons/fi";

interface DashboardMetrics {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_users: number;
    emails_received: number;
    emails_clicked: number;
    click_rate: number;
  };
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

interface DashboardColaboradorProps {
  metrics: DashboardMetrics;
}

export function DashboardColaborador({ metrics }: DashboardColaboradorProps) {
  // Calcular pontuação de segurança (100 - taxa de cliques)
  const securityScore = Math.max(0, 100 - metrics.summary.click_rate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Painel de Segurança</h1>
        <p className="text-gray-400">Acompanhe seu desempenho em treinamentos de phishing</p>
      </div>

      {/* Cards de estatísticas pessoais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pontuação de Segurança"
          value={`${securityScore.toFixed(0)}%`}
          icon={<FiAward className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="E-mails Recebidos"
          value={metrics.summary.emails_received}
          icon={<FiTarget className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="E-mails Clicados"
          value={metrics.summary.emails_clicked}
          icon={<FiAlertCircle className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="Taxa de Cliques"
          value={`${metrics.summary.click_rate.toFixed(1)}%`}
          icon={<FiZap className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Feedback de desempenho */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Seu Desempenho</h2>
        <div className="space-y-4">
          {securityScore >= 90 && (
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">🎉 Excelente!</h3>
              <p className="text-slate-700">
                Você está demonstrando alta conscientização sobre segurança. Continue assim!
              </p>
            </div>
          )}
          {securityScore >= 70 && securityScore < 90 && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <h3 className="font-semibold text-yellow-400 mb-2">👍 Bom trabalho!</h3>
              <p className="text-slate-700">
                Você está indo bem, mas há espaço para melhorias. Continue atento aos treinamentos.
              </p>
            </div>
          )}
          {securityScore < 70 && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <h3 className="font-semibold text-red-400 mb-2">⚠️ Atenção Necessária</h3>
              <p className="text-slate-700">
                Recomendamos revisar os materiais de treinamento e ter mais cautela com e-mails suspeitos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Campanhas recebidas */}
      {metrics.recent_campaigns && metrics.recent_campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Treinamentos Recentes</h2>
          <div className="space-y-3">
            {metrics.recent_campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(campaign.start_date || "").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  {campaign.clicks > 0 ? (
                    <span className="text-red-400 font-semibold">Clicou no link</span>
                  ) : (
                    <span className="text-green-400 font-semibold">Não clicou</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dicas de segurança */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Dicas de Segurança</h2>
        <ul className="space-y-2 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Sempre verifique o remetente do e-mail antes de clicar em links</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Desconfie de mensagens urgentes ou que pedem informações pessoais</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Passe o mouse sobre links para verificar o destino real</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>Em caso de dúvida, reporte o e-mail ao TI</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
