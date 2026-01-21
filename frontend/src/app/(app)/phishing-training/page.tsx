'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PhishingTraining() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-lg">
          Carregando módulo de conscientização em segurança…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Cabeçalho */}
        <div className="bg-white border-l-4 border-red-600 rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            Treinamento de Conscientização — Phishing
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Você interagiu com um e-mail que fazia parte de uma simulação de phishing.
            Esta ação não gera penalidades e faz parte do programa educativo de segurança da informação.
          </p>
        </div>

        {/* O que é Phishing */}
        <section className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            O que é phishing?
          </h2>
          <p className="text-slate-700 leading-relaxed">
            Phishing é uma técnica de engenharia social utilizada por criminosos digitais
            para enganar pessoas e induzi-las a fornecer informações sensíveis, como senhas,
            dados pessoais ou acessar links maliciosos.
          </p>
          <p className="text-slate-700 leading-relaxed mt-3">
            Normalmente, o ataque se apresenta na forma de e-mails, mensagens ou páginas
            falsas que imitam comunicações legítimas de empresas, bancos ou setores internos.
          </p>
        </section>

        {/* Por que funciona */}
        <section className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Por que ataques de phishing funcionam?
          </h2>

          <ul className="space-y-3 text-slate-700">
            <li>• Criam senso de urgência (“ação imediata”, “prazo curto”)</li>
            <li>• Utilizam linguagem semelhante à de comunicações reais</li>
            <li>• Exploram confiança, medo ou curiosidade</li>
            <li>• Dependem de decisões rápidas, sem verificação</li>
          </ul>
        </section>

        {/* Sinais de Alerta */}
        <section className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Principais sinais de alerta
          </h2>

          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              Mensagens solicitando ações urgentes ou ameaçando bloqueios
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              Links que direcionam para sites externos ou desconhecidos
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              Remetentes com domínios semelhantes, porém incorretos
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              Solicitação de senhas, códigos ou dados pessoais
            </div>
          </div>
        </section>

        {/* Como agir corretamente */}
        <section className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Como agir para evitar novos incidentes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded">
              Verifique sempre o endereço do remetente
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded">
              Passe o mouse sobre links antes de clicar
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded">
              Nunca informe senhas ou códigos por e-mail
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded">
              Em caso de dúvida, contate a equipe de TI
            </div>
          </div>
        </section>

        {/* Conclusão */}
        <div className="bg-indigo-50 border-l-4 border-indigo-600 p-8 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-indigo-900 mb-2">
            Treinamento concluído
          </h3>
          <p className="text-indigo-800 leading-relaxed">
            O objetivo desta simulação é fortalecer a cultura de segurança da informação,
            reduzindo riscos associados ao comportamento humano frente a ataques de engenharia social.
          </p>

          {token && (
            <p className="mt-4 text-sm text-indigo-700 font-mono">
              Identificador da simulação: {token}
            </p>
          )}
        </div>

        {/* Ação final */}
        <div className="flex justify-center">
          <a
            href="/dashboard"
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Voltar ao painel
          </a>
        </div>

      </div>
    </div>
  );
}
