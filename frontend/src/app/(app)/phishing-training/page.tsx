'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiPhone, FiMessageSquare, FiTarget, FiBriefcase } from 'react-icons/fi';

function PhishingTrainingContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-lg">Carregando módulo de conscientização…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* Hero - Segurança Digital */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-10 space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Segurança Digital</h1>
          <p className="text-lg text-slate-700 leading-relaxed">
            Quando você sai de casa, confere se trancou a porta? E quando vai dormir, confere também? 
            <strong> Segurança é algo que buscamos constantemente em nossas vidas</strong>. Mas por que ainda somos 
            tão displicentes com nossos dados online?
          </p>
          <p className="text-slate-600 leading-relaxed">
            Nesse manual vamos falar sobre <strong>phishing</strong>, uma das principais maneiras de criminosos 
            conseguirem dados de outras pessoas. Nosso objetivo é mostrar que estar protegido na internet requer 
            cuidados tão simples quanto conferir se as portas de casa estão trancadas.
          </p>
          {token && (
            <p className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Identificador: {token}
            </p>
          )}
        </div>

        {/* O que é Phishing */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-lg p-10 space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">O que é Phishing?</h2>
          <p className="text-slate-700 leading-relaxed">
            A palavra phishing vem do termo em inglês <strong>"fishing"</strong>, que significa "pescar". 
            Esse tipo de golpe se baseia na emissão de "iscas" (mensagens eletrônicas) usadas para 
            "pescar" informações pessoais e financeiras das vítimas.
          </p>
          <p className="text-slate-700 leading-relaxed">
            O phishing é uma das formas mais comuns e eficazes de ataques cibernéticos. O criminoso explora 
            emoções humanas combinando mecanismos tecnológicos (geralmente mensagens eletrônicas) e engenharia 
            social para criar um senso de urgência e persuadir as pessoas a entregar dados sensíveis.
          </p>
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded mt-4">
            <p className="text-red-900 font-semibold">Informações roubadas podem incluir:</p>
            <p className="text-red-800 text-sm mt-2">
              Senhas • Números de cartão de crédito • Dados bancários • Informações de conta • 
              Roubo de identidade • Fraude financeira • Ransomware
            </p>
          </div>
        </section>

        {/* Tipos de Phishing */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">Quais os tipos de Phishing?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: FiPhone,
                title: "Vishing (Voice + Phishing)",
                desc: "Ocorre via ligação telefônica. O criminoso utiliza técnicas de persuasão para obter vantagens ilícitas.",
                color: "blue"
              },
              {
                icon: FiMessageSquare,
                title: "Smishing (SMS + Phishing)",
                desc: "Enviado por mensagem de texto (SMS) para induzir a vítima a baixar malwares ou acessar sites falsos.",
                color: "green"
              },
              {
                icon: FiTarget,
                title: "Spear Phishing",
                desc: "Ataque direcionado a uma pessoa ou organização específica, com mensagens personalizadas e conteúdo pesquisado.",
                color: "orange"
              },
              {
                icon: FiBriefcase,
                title: "Whaling",
                desc: "Tipo especializado que ataca profissionais de alto escalão para obter informações confidenciais e segredos comerciais.",
                color: "red"
              }
            ].map((type) => {
              const Icon = type.icon;
              const colors = {
                blue: "bg-blue-50 border-blue-200 text-blue-700",
                green: "bg-green-50 border-green-200 text-green-700",
                orange: "bg-orange-50 border-orange-200 text-orange-700",
                red: "bg-red-50 border-red-200 text-red-700"
              };
              return (
                <div key={type.title} className={`border rounded-xl p-5 ${colors[type.color as keyof typeof colors]}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="w-6 h-6 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg">{type.title}</h3>
                      <p className="text-sm mt-1 opacity-90">{type.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tamanho do Problema */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-lg p-10 space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">Qual o tamanho do problema?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-xl p-6 space-y-2">
              <p className="text-sm font-semibold text-red-700">IBM Research (2021-2022)</p>
              <p className="text-3xl font-bold text-red-900">Phishing foi</p>
              <p className="text-lg font-semibold text-red-800">O MAIOR CUSTO de violações de dados</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-xl p-6 space-y-2">
              <p className="text-sm font-semibold text-amber-700">Microsoft Estimativa</p>
              <p className="text-3xl font-bold text-amber-900">$500B</p>
              <p className="text-sm text-amber-800">Custo global potencial de crimes cibernéticos</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-300 rounded-xl p-6 space-y-2">
              <p className="text-sm font-semibold text-orange-700">Violação de dados</p>
              <p className="text-3xl font-bold text-orange-900">$3,8M</p>
              <p className="text-sm text-orange-800">Custo médio por empresa</p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-yellow-900 font-semibold">Os ataques contra empresas quase duplicaram nos últimos 5 anos</p>
            <p className="text-yellow-800 text-sm mt-2">
              Apenas <strong>um erro humano</strong> pode resultar em perda maciça de dados sensíveis. 
              Pesquisa da Cisco descobriu que 22% das organizações violadas perderam clientes após ataques.
            </p>
          </div>
        </section>

        {/* O que pode acontecer */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-lg p-10 space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">O que pode acontecer?</h2>
          <p className="text-slate-700 leading-relaxed">
            Os danos de um ataque de phishing a uma empresa podem ser devastadores. Ao longo dos anos, 
            organizações perderam <strong>milhões de dólares</strong> como resultado desses ataques.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-red-900">Roubo de Identidade</p>
              <p className="text-sm text-red-800">Uso indevido de suas informações pessoais</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-red-900">Perda de Propriedade Intelectual</p>
              <p className="text-sm text-red-800">Segredos comerciais e dados sensíveis roubados</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-red-900">Roubo Bancário</p>
              <p className="text-sm text-red-800">Transferências não autorizadas de sua conta</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-red-900">Danos à Reputação</p>
              <p className="text-sm text-red-800">Impacto negativo na sua imagem pessoal ou profissional</p>
            </div>
          </div>
        </section>

        {/* Como Prevenir */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">Como prevenir?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Fique atento a e-mails suspeitos",
                tips: [
                  "Se receber de remetente desconhecido, não clique em links",
                  "Procure por tom urgente, ameaçador ou erros de ortografia",
                  "Domínios parecem legítimos mas são ligeiramente diferentes",
                  "Na dúvida, consulte o site oficial da instituição"
                ]
              },
              {
                title: "Verifique a URL do site",
                tips: [
                  "Sempre verifique a URL antes de inserir dados pessoais",
                  "Digite o endereço diretamente no navegador",
                  "Confirme se a URL está correta",
                  "Use sempre conexão segura (https)"
                ]
              },
              {
                title: "Use autenticação de múltiplos fatores",
                tips: [
                  "Ative autenticação de dois fatores quando disponível",
                  "Adiciona uma camada extra de segurança",
                  "Exige senha + código via SMS ou aplicativo",
                  "Protege suas contas mesmo se senha for roubada"
                ]
              },
              {
                title: "Use senhas diferentes e seguras",
                tips: [
                  "Nunca use a mesma senha em múltiplos sites",
                  "Em caso de captura, reduz danos maiores",
                  "Use um gerenciador de senhas",
                  "Senhas fortes têm letras, números e caracteres especiais"
                ]
              },
              {
                title: "Não revele informações pessoais",
                tips: [
                  "Nunca revele dados pessoais ou financeiros online",
                  "A menos que tenha certeza da legitimidade do site",
                  "Instituições reais nunca pedem senhas por e-mail",
                  "Desconfie sempre de solicitações incomuns"
                ]
              },
              {
                title: "Mantenha sistemas atualizados",
                tips: [
                  "Atualize seu sistema operacional regularmente",
                  "Mantenha navegador atualizado",
                  "Use software antivírus atualizado",
                  "Proteja seu computador contra vulnerabilidades conhecidas"
                ]
              }
            ].map((section) => (
              <div key={section.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <h3 className="font-bold text-lg text-slate-900">{section.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {section.tips.map((tip, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-emerald-600 font-semibold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 space-y-2">
            <p className="font-semibold text-emerald-900 text-lg">Reporte o Phishing</p>
            <p className="text-emerald-800">
              Se suspeitar que foi vítima de phishing, reporte o e-mail suspeito às autoridades competentes. 
              Isso pode ajudar a prevenir outras pessoas de cair na mesma armadilha.
            </p>
          </div>
        </section>

        {/* Conclusão */}
        <section className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-xl p-10 space-y-4">
          <h2 className="text-3xl font-bold">Conhecimento é nosso maior aliado</h2>
          <p className="text-lg leading-relaxed">
            É importante estar ciente dos últimos golpes de phishing e aprender a reconhecê-los. 
            Para estar protegido na internet, você precisa ter cuidados tão simples quanto conferir se 
            as portas e janelas de casa estão trancadas.
          </p>
          <p className="text-indigo-100 font-semibold">
            ⚠️ Os criminosos cibernéticos têm como alvo pessoas como nós! Mantenha-se informado e vigilante.
          </p>
          <div className="pt-4">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition shadow-lg"
            >
              Voltar ao painel
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}

export default function PhishingTraining() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Carregando...</p></div>}>
      <PhishingTrainingContent />
    </Suspense>
  );
}
