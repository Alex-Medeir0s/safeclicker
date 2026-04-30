"use client";

import { useEffect, useState } from "react";
import {
  FiPlus,
  FiClock,
  FiHelpCircle,
  FiX,
  FiStar,
  FiCheckCircle,
  FiArrowLeft,
  FiArrowRight,
  FiAlertCircle,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { api } from "@/services/api";

type Difficulty = "Fácil" | "Médio" | "Difícil";

type Question = {
  text: string;
  alternatives: string[];
  correctIndex: number | null;
};

type QuizSummary = {
  id: number;
  title: string;
  category: string | null;
  difficulty: Difficulty;
  xp: number;
  question_count: number;
};

type QuizDetail = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  xp: number;
  questions: Array<{
    id: number;
    position: number;
    text: string;
    alternatives: string[];
    correct_index: number;
  }>;
};

const REQUIRED_QUESTIONS: Record<Difficulty, number> = {
  Fácil: 15,
  Médio: 10,
  Difícil: 5,
};

const ALTERNATIVE_LABELS = ["A", "B", "C", "D", "E"];

const xpForDifficulty: Record<Difficulty, number> = {
  Fácil: 100,
  Médio: 180,
  Difícil: 260,
};

const difficultyStyle: Record<Difficulty, string> = {
  Fácil: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Médio: "bg-amber-50 text-amber-700 border-amber-200",
  Difícil: "bg-rose-50 text-rose-700 border-rose-200",
};

const makeEmptyQuestion = (): Question => ({
  text: "",
  alternatives: ["", "", "", "", ""],
  correctIndex: null,
});

const buildQuestions = (count: number, existing: Question[] = []): Question[] => {
  const result: Question[] = [];
  for (let i = 0; i < count; i++) {
    result.push(existing[i] ?? makeEmptyQuestion());
  }
  return result;
};

const isQuestionComplete = (question: Question): boolean =>
  question.text.trim().length > 0 &&
  question.alternatives.every((a) => a.trim().length > 0) &&
  question.correctIndex !== null;

export default function PhishingTrainingPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ title: "", category: "", description: "", difficulty: "Fácil" as Difficulty });
  const [questions, setQuestions] = useState<Question[]>(buildQuestions(REQUIRED_QUESTIONS["Fácil"]));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const requiredCount = REQUIRED_QUESTIONS[form.difficulty];
  const completedCount = questions.filter(isQuestionComplete).length;

  const showFeedback = (type: "success" | "error" | "info", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 2800);
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await api.get<QuizSummary[]>("/quizzes");
      setQuizzes(response.data);
    } catch (error) {
      console.error("Erro ao carregar quizzes:", error);
      showFeedback("error", "Erro ao carregar quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const resetForm = () => {
    setForm({ title: "", category: "", description: "", difficulty: "Fácil" });
    setQuestions(buildQuestions(REQUIRED_QUESTIONS["Fácil"]));
    setCurrentIdx(0);
    setStep(1);
    setEditingId(null);
  };

  const closeModal = () => {
    setShowForm(false);
    resetForm();
  };

  const handleDifficultyChange = (d: Difficulty) => {
    setForm({ ...form, difficulty: d });
    setQuestions((prev) => buildQuestions(REQUIRED_QUESTIONS[d], prev));
    setCurrentIdx(0);
  };

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateAlternative = (qIdx: number, altIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, alternatives: q.alternatives.map((a, j) => (j === altIdx ? value : a)) }
          : q
      )
    );
  };

  const handleNextStep = () => {
    if (!form.title.trim()) {
      showFeedback("error", "Informe um título para o quiz");
      return;
    }
    setStep(2);
    setCurrentIdx(0);
  };

  const handleSave = async () => {
    const firstIncomplete = questions.findIndex((q) => !isQuestionComplete(q));
    if (firstIncomplete !== -1) {
      setCurrentIdx(firstIncomplete);
      showFeedback("error", `Complete a pergunta ${firstIncomplete + 1} antes de salvar`);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      difficulty: form.difficulty,
      xp: xpForDifficulty[form.difficulty],
      questions: questions.map((q) => ({
        text: q.text,
        alternatives: q.alternatives,
        correct_index: q.correctIndex as number,
      })),
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/quizzes/${editingId}`, payload);
        showFeedback("success", "Quiz atualizado!");
      } else {
        await api.post("/quizzes", payload);
        showFeedback("success", "Quiz criado com sucesso!");
      }
      setShowForm(false);
      resetForm();
      fetchQuizzes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err.response?.data?.detail ?? "Erro ao salvar quiz";
      showFeedback("error", typeof detail === "string" ? detail : "Erro ao salvar quiz");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await api.get<QuizDetail>(`/quizzes/${id}`);
      const quiz = response.data;
      setEditingId(quiz.id);
      setForm({
        title: quiz.title,
        category: quiz.category ?? "",
        description: quiz.description ?? "",
        difficulty: quiz.difficulty,
      });
      const loaded: Question[] = quiz.questions.map((q) => ({
        text: q.text,
        alternatives: q.alternatives,
        correctIndex: q.correct_index,
      }));
      setQuestions(buildQuestions(REQUIRED_QUESTIONS[quiz.difficulty], loaded));
      setStep(1);
      setCurrentIdx(0);
      setShowForm(true);
    } catch (error) {
      console.error(error);
      showFeedback("error", "Erro ao carregar quiz");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Excluir o quiz "${title}"?`)) return;
    try {
      await api.delete(`/quizzes/${id}`);
      showFeedback("success", "Quiz excluído");
      fetchQuizzes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err.response?.data?.detail ?? "Erro ao excluir quiz";
      showFeedback("error", typeof detail === "string" ? detail : "Erro ao excluir quiz");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Treinamento de Phishing
          </h1>
          <p className="text-slate-600">Crie e gerencie quizzes para vincular às campanhas</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" /> Criar Quiz
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 py-12">Carregando quizzes...</p>
      ) : quizzes.length === 0 ? (
        <p className="text-center text-slate-500 py-12 animate-fade-in">Nenhum quiz criado</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, idx) => (
            <article
              key={quiz.id}
              style={{ animationDelay: `${idx * 0.05}s` }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in"
            >
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/15 to-purple-400/10 group-hover:scale-110 transition-transform duration-500" />

              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center text-xs font-semibold border px-2.5 py-1 rounded-full ${difficultyStyle[quiz.difficulty]}`}
                  >
                    {quiz.difficulty}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(quiz.id)}
                      title="Editar"
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition flex items-center justify-center"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      title="Excluir"
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-600 hover:text-white hover:border-red-600 transition flex items-center justify-center"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                    {quiz.category || "Geral"}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{quiz.title}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <FiHelpCircle className="w-3.5 h-3.5" />
                    {quiz.question_count} perguntas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5" />
                    {Math.max(5, quiz.question_count)} min
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-amber-600 font-bold">
                    <FiStar className="w-3.5 h-3.5" />
                    {quiz.xp} XP
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[92vh] ${
              step === 1 ? "max-w-md" : "max-w-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-indigo-600 font-semibold">
                  Etapa {step} de 2 {editingId ? "— Editando" : ""}
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {step === 1 ? "Informações do quiz" : "Perguntas e alternativas"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {step === 1
                    ? "Defina o título, categoria e dificuldade."
                    : `Preencha ${requiredCount} perguntas com 5 alternativas e marque a correta.`}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {step === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNextStep();
                }}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-1.5">
                  <label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Título
                  </label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Ex: Phishing em redes sociais"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Categoria
                  </label>
                  <input
                    id="category"
                    type="text"
                    placeholder="Ex: Phishing"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Dificuldade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Fácil", "Médio", "Difícil"] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDifficultyChange(d)}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 transition flex flex-col items-center gap-0.5 ${
                          form.difficulty === d
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span>{d}</span>
                        <span className="text-[11px] font-medium opacity-80">
                          {REQUIRED_QUESTIONS[d]} perguntas
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 mt-1 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                    <FiAlertCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-indigo-800">
                      Dificuldade <strong>{form.difficulty}</strong> exige exatamente{" "}
                      <strong>{requiredCount} perguntas</strong> de múltipla escolha (5 alternativas cada).
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Sobre o que é este quiz?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition flex items-center gap-2"
                  >
                    Próximo
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <>
                <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-700">
                      Pergunta {currentIdx + 1} de {requiredCount}
                    </span>
                    <span className="text-slate-500">
                      {completedCount}/{requiredCount} completas
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                      style={{ width: `${(completedCount / requiredCount) * 100}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {questions.map((q, i) => {
                      const complete = isQuestionComplete(q);
                      const active = i === currentIdx;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentIdx(i)}
                          title={`Pergunta ${i + 1}${complete ? " (completa)" : ""}`}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                            active ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                          } ${
                            complete
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

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {(() => {
                    const q = questions[currentIdx];
                    return (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">
                            Enunciado da pergunta {currentIdx + 1}
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Qual destes é um sinal típico de e-mail de phishing?"
                            value={q.text}
                            onChange={(e) => updateQuestion(currentIdx, { text: e.target.value })}
                            className="input resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Alternativas <span className="text-slate-400 font-normal">(marque a correta)</span>
                          </label>
                          <div className="space-y-2">
                            {q.alternatives.map((alt, altIdx) => {
                              const isCorrect = q.correctIndex === altIdx;
                              return (
                                <div
                                  key={altIdx}
                                  className={`flex items-center gap-2 p-2 rounded-xl border-2 transition ${
                                    isCorrect ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(currentIdx, { correctIndex: altIdx })}
                                    title={isCorrect ? "Alternativa correta" : "Marcar como correta"}
                                    className={`w-9 h-9 flex-shrink-0 rounded-lg font-bold text-sm flex items-center justify-center transition ${
                                      isCorrect
                                        ? "bg-emerald-500 text-white shadow"
                                        : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700"
                                    }`}
                                  >
                                    {isCorrect ? <FiCheckCircle className="w-4 h-4" /> : ALTERNATIVE_LABELS[altIdx]}
                                  </button>
                                  <input
                                    type="text"
                                    placeholder={`Alternativa ${ALTERNATIVE_LABELS[altIdx]}`}
                                    value={alt}
                                    onChange={(e) => updateAlternative(currentIdx, altIdx, e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border-2 border-transparent bg-transparent text-sm focus:border-indigo-300 focus:bg-white outline-none transition"
                                  />
                                </div>
                              );
                            })}
                          </div>
                          {q.correctIndex === null && (
                            <p className="text-xs text-amber-600 flex items-center gap-1.5 pt-1">
                              <FiAlertCircle className="w-3.5 h-3.5" />
                              Selecione qual alternativa é a correta.
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-white transition flex items-center gap-2"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    {currentIdx < requiredCount - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((i) => Math.min(requiredCount - 1, i + 1))}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center gap-2"
                      >
                        Próxima
                        <FiArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition flex items-center gap-2 disabled:opacity-60"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        {saving ? "Salvando..." : editingId ? "Atualizar Quiz" : "Criar Quiz"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed bottom-6 right-6 z-[60] animate-fade-in">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 shadow-2xl border text-sm font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : feedback.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-slate-900 border-slate-800 text-white"
            }`}
          >
            {feedback.type === "success" && <FiCheckCircle className="w-4 h-4" />}
            {feedback.type === "error" && <FiAlertCircle className="w-4 h-4" />}
            {feedback.message}
          </div>
        </div>
      )}
    </>
  );
}
