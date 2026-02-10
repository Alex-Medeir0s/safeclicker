'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiInfo } from 'react-icons/fi';

export default function ClickAlert() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [countdown, setCountdown] = useState(30);
  const [redirect, setRedirect] = useState(false);
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
  }, []);

  useEffect(() => {
    if (redirect && token) {
      window.location.href = `/phishing-training?token=${token}`;
    }
  }, [redirect, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-10 space-y-6">
          {/* Identidade */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              SafeClicker — Plataforma Web de Simulação e Treinamento Contínuo contra Phishing
            </p>
          </div>

          {/* Bloco 1 — Confirmação */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <FiAlertTriangle className="w-10 h-10 text-red-600" />
              <span className="text-slate-700 font-semibold tracking-wide text-sm uppercase">
                Notificação de Segurança
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Evento identificado: interação com e-mail de phishing (simulação)
            </h1>
          </div>

          {/* Bloco 2 — Contexto educativo */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-slate-700">
              Este evento faz parte de um programa corporativo de simulação e conscientização em
              segurança da informação.
            </p>
            <p className="text-slate-700">
              Nenhuma penalidade foi aplicada. O objetivo deste processo é educativo e preventivo,
              visando a redução de riscos de segurança.
            </p>
          </div>

          {/* Bloco 3 — Lições aprendidas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <p className="font-semibold text-slate-800 flex items-center gap-2">
              <FiInfo className="w-4 h-4 text-slate-500" /> Boas práticas de segurança da informação
            </p>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>• Verifique o remetente antes de interagir com links ou anexos</li>
              <li>• Desconfie de mensagens com tom urgente, ameaçador ou incomum</li>
              <li>• Passe o cursor sobre links para validar o destino real</li>
              <li>• Em caso de dúvida, entre em contato com o time de TI ou Segurança da Informação</li>
            </ul>
          </div>

          {/* Bloco 4 — Próxima ação */}
          <div className="space-y-3 text-center">
            <p className="text-slate-600 text-sm">
              Você será direcionado automaticamente para um treinamento rápido de conscientização
              em segurança em 30 segundos.
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((30 - countdown) / 30) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href={token ? `/phishing-training?token=${token}` : '/phishing-training'}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 hover:shadow-lg"
            >
              <FiCheckCircle className="w-5 h-5" />
              <span>Acessar treinamento de conscientização</span>
              <FiArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Microcopy de confiança */}
          <div className="text-xs text-slate-500 border-t border-slate-200 pt-4 space-y-2">
            <p>Nenhuma informação pessoal sensível foi coletada.</p>
            <p>
              Este evento é registrado exclusivamente para fins educativos, estatísticos e de melhoria
              contínua dos controles de segurança.
            </p>
            <p>Classificação: Uso interno — Programa corporativo de segurança da informação.</p>
            <p>Este registro atende aos requisitos de conscientização previstos em políticas internas de segurança da informação.</p>
            <p>Identificador do evento: {eventId}</p>
            <p>Data e hora: {eventTimestamp} (UTC-3)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
