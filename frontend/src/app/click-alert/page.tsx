'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { api } from '@/services/api';

export default function ClickAlert() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [countdown, setCountdown] = useState(30);
  const [redirect, setRedirect] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<'loading' | 'active' | 'disabled'>('loading');
  const eventId = token || 'Token não disponível';
  const eventTimestamp = new Date().toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  useEffect(() => {
    if (!token) return;

    const validateCampaign = async () => {
      try {
        const response = await api.get(`/campaigns/validate/${token}`);
        if (response.data?.status === 'active') {
          setCampaignStatus('active');
        } else {
          setCampaignStatus('disabled');
        }
      } catch (error) {
        console.error('Erro ao validar campanha:', error);
        setCampaignStatus('disabled');
      }
    };

    validateCampaign();
  }, [token]);

  useEffect(() => {
    if (campaignStatus !== 'active') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRedirect(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [campaignStatus]);

  useEffect(() => {
    if (redirect && token && campaignStatus === 'active') {
      window.location.href = `/quiz/${encodeURIComponent(token)}`;
    }
  }, [redirect, token, campaignStatus]);

  if (campaignStatus === 'disabled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-12 space-y-8">
            {/* Ícone e título */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <FiXCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Campanha Desativada</h1>
              <p className="text-lg text-slate-600">Esta simulação não está mais ativa</p>
            </div>

            {/* Mensagem */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 space-y-3">
              <p className="text-slate-700 font-medium">
                A campanha de phishing associada a este e-mail foi desativada pela administração.
              </p>
              <p className="text-slate-600 text-sm">
                Se você acha que recebeu este aviso por engano, entre em contato com o time de Segurança da Informação.
              </p>
            </div>

            {/* Footer info */}
            <div className="border-t border-slate-200 pt-6 text-center space-y-2">
              <p className="text-xs text-slate-500">
                <span className="font-medium">Identificador:</span> {eventId}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium">Data/Hora:</span> {eventTimestamp} (UTC-3)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (campaignStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-12">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 sm:px-12 py-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <FiAlertTriangle className="w-8 h-8" />
              <span className="text-sm font-semibold uppercase tracking-wide">Alerta de Segurança</span>
            </div>
            <h1 className="text-3xl font-bold">Simulação de Phishing Detectada</h1>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12 space-y-8">
            {/* Mensagem principal */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 space-y-3">
              <p className="text-slate-800 font-semibold text-lg">
                Você clicou em um e-mail de phishing
              </p>
              <p className="text-slate-700">
                Este é um evento de treinamento para aumentar sua conscientização em segurança da informação. Não há penalidades associadas.
              </p>
            </div>

            {/* Dicas */}
            <div className="space-y-3">
              <p className="text-slate-900 font-semibold">O que você pode aprender com isso:</p>
              <div className="grid gap-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <p className="text-slate-700 text-sm"><span className="font-medium">Verifique o remetente</span> — Sempre confirme o endereço de e-mail antes de clicar em links</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <p className="text-slate-700 text-sm"><span className="font-medium">Desconfie de urgência</span> — Mensagens com tom urgente ou ameaçador são suspeitas</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <p className="text-slate-700 text-sm"><span className="font-medium">Passe o mouse</span> — Valide o destino real antes de abrir links</p>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-slate-700">Redirecionamento automático em:</p>
                  <span className="text-2xl font-bold text-indigo-600">{countdown}s</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href={token ? `/quiz/${encodeURIComponent(token)}` : '#'}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
            >
              <FiCheckCircle className="w-5 h-5" />
              <span>Acessar Treinamento Agora</span>
              <FiArrowRight className="w-5 h-5" />
            </a>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-6 text-center space-y-1">
              <p className="text-xs text-slate-500">
                Nenhuma informação pessoal foi coletada
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium">ID:</span> {eventId}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium">Data/Hora:</span> {eventTimestamp} (UTC-3)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
