"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiAlertCircle, FiHelpCircle, FiClock, FiStar } from "react-icons/fi";
import { api } from "@/services/api";

type Difficulty = "Fácil" | "Médio" | "Difícil";

interface QuizQuestion {
  id: number;
  position: number;
  text: string;
  alternatives: string[];
  difficulty: Difficulty | null;
  xp: number | null;
}

interface QuizPublic {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  total_xp: number;
  questions: QuizQuestion[];
}

const ALTERNATIVE_LABELS = ["A", "B", "C", "D", "E"];

const difficultyStyle: Record<Difficulty, string> = {
  Fácil: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Médio: "bg-amber-50 text-amber-700 border-amber-200",
  Difícil: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function QuizTakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get<QuizPublic>(`/campaigns/quiz-by-token/${token}`);
        if (cancelled) return;
        setQuiz(response.data);
        setAnswers(new Array(response.data.questions.length).fill(null));
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string }; status?: number } };
        const detail = err.response?.data?.detail;
        setLoadError(typeof detail === "string" ? detail : "Não foi possível carregar o quiz");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const setAnswer = (questionIdx: number, value: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === questionIdx ? value : a)));
  };

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);
  const completedCount = answers.filter((a) => a !== null).length;

  const handleSubmit = async () => {
    if (!quiz || !allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const response = await api.post("/campaigns/quiz/submit", {
        token,
        answers,
      });
      setResult({
        correct: response.data.correct_count,
        total: response.data.total_questions,
      });
      setSubmitted(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err.response?.data?.detail;
      alert(typeof detail === "string" ? detail : "Erro ao enviar respostas");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-lg">Carregando quiz…</p>
      </div>
    );
  }

  if (loadError || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
          <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Não foi possível carregar o quiz</h1>
          <p className="text-slate-600">{loadError ?? "Tente novamente mais tarde."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-10 max-w-lg w-full text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <FiCheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Treinamento concluído!</h1>
          <p className="text-slate-600">
            Você acertou <strong>{result.correct}</strong> de <strong>{result.total}</strong> perguntas.
          </p>
          <p className="text-sm text-slate-500">
            Sua participação foi registrada. Obrigado por contribuir com a segurança da informação.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
          >
            Ir para o dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-indigo-600 font-semibold mb-1">
              {quiz.category || "Treinamento de conscientização"}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
          </div>
          {quiz.description && <p className="text-slate-600 text-sm">{quiz.description}</p>}
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <FiHelpCircle className="w-3.5 h-3.5" />
              {quiz.questions.length} perguntas
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5" />
              {Math.max(5, quiz.questions.length)} min
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-amber-600 font-bold">
              <FiStar className="w-3.5 h-3.5" />
              {quiz.total_xp} XP
            </span>
          </div>
        </header>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-6 pt-5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700">
                Pergunta {currentIdx + 1} de {quiz.questions.length}
              </span>
              <span className="text-slate-500">
                {completedCount}/{quiz.questions.length} respondidas
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                style={{ width: `${(completedCount / quiz.questions.length) * 100}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {quiz.questions.map((_, i) => {
                const answered = answers[i] !== null;
                const active = i === currentIdx;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    title={`Pergunta ${i + 1}${answered ? " (respondida)" : ""}`}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                      active ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                    } ${
                      answered
                        ? "bg-emerald-500 text-white"
                        : "bg-white border border-slate-300 text-slate-500 hover:border-indigo-400"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 flex-1">{currentQuestion.text}</h2>
              {currentQuestion.difficulty && (
                <span
                  className={`inline-flex items-center text-xs font-semibold border px-2.5 py-1 rounded-full flex-shrink-0 ${difficultyStyle[currentQuestion.difficulty]}`}
                >
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {currentQuestion.alternatives.map((alt, altIdx) => {
                const isSelected = answers[currentIdx] === altIdx;
                return (
                  <button
                    key={altIdx}
                    type="button"
                    onClick={() => setAnswer(currentIdx, altIdx)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 flex-shrink-0 rounded-lg font-bold text-sm flex items-center justify-center ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ALTERNATIVE_LABELS[altIdx]}
                    </span>
                    <span className="flex-1 text-sm text-slate-800">{alt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                title={!allAnswered ? "Responda todas as perguntas para concluir" : ""}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-lg hover:from-emerald-700 hover:to-green-700 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FiCheckCircle className="w-4 h-4" />
                {submitting ? "Concluindo..." : "Concluir"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(quiz.questions.length - 1, i + 1))}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center gap-2"
              >
                Próxima
                <FiArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
