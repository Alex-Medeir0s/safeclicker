'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

export default function ClickAlert() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [countdown, setCountdown] = useState(10);
  const [redirect, setRedirect] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-4 border-red-600 rounded-2xl shadow-2xl p-12 space-y-6 text-center">
          
          {/* Ícone de alerta */}
          <div className="flex justify-center">
            <div className="bg-red-100 p-6 rounded-full">
              <FiAlertTriangle className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-red-900">⚠️ ALERTA!</h1>
            <h2 className="text-2xl font-semibold text-red-800">Este é um email de Phishing</h2>
          </div>

          {/* Mensagem */}
          <div className="bg-red-50 border border-red-300 rounded-xl p-6 space-y-3">
            <p className="text-red-900 font-semibold text-lg">
              Você clicou em um link de simulação de ataque de phishing!
            </p>
            <p className="text-red-800 leading-relaxed">
              Este e-mail faz parte de um <strong>programa de simulação e treinamento de segurança</strong>. 
              A ação que você realizou é uma excelente oportunidade de aprendizado.
            </p>
            <p className="text-red-800 leading-relaxed">
              <strong>Não se preocupe!</strong> Isso não gera penalidades. É um exercício educativo para 
              fortalecer sua consciência sobre ataques de phishing.
            </p>
          </div>

          {/* O que você pode aprender */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 space-y-3">
            <p className="font-semibold text-yellow-900">💡 Lições importantes:</p>
            <ul className="text-sm text-yellow-800 space-y-2 text-left">
              <li>✓ Sempre verifique o remetente antes de clicar em links</li>
              <li>✓ Desconfie de mensagens urgentes ou ameaçadoras</li>
              <li>✓ Passe o mouse sobre links para confirmar o destino real</li>
              <li>✓ Quando em dúvida, contate o suporte de TI diretamente</li>
            </ul>
          </div>

          {/* Contagem regressiva */}
          <div className="space-y-2">
            <p className="text-slate-700 font-semibold">
              Redirecionando para treinamento em <span className="text-red-600 text-2xl font-bold">{countdown}</span>s...
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Botão manual */}
          <a
            href={token ? `/phishing-training?token=${token}` : '/phishing-training'}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all duration-300 hover:shadow-lg"
          >
            <span>Ir para Treinamento Agora</span>
            <FiArrowRight className="w-5 h-5" />
          </a>

          {/* Rodapé */}
          <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">
            Este exercício de simulação é parte do programa de segurança da informação.
          </p>
        </div>
      </div>
    </div>
  );
}
