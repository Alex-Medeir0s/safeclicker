"use client";

import { useEffect, useState } from "react";
import {
  FiPlus,
  FiHelpCircle,
  FiX,
  FiStar,
  FiCheckCircle,
  FiArrowLeft,
  FiArrowRight,
  FiAlertCircle,
  FiTrash2,
  FiEdit2,
  FiTrendingUp,
} from "react-icons/fi";
import { api } from "@/services/api";

type Difficulty = "Fácil" | "Médio" | "Difícil";
type UserRole = "TI" | "GESTOR" | "COLABORADOR";

type Question = {
  text: string;
  alternatives: string[];
  correctIndex: number | null;
  difficulty: Difficulty;
};

type QuizSummary = {
  id: number;
  title: string;
  category: string | null;
  question_count: number;
  total_xp: number;
};

type QuizDetail = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  questions: Array<{
    id: number;
    position: number;
    text: string;
    alternatives: string[];
    correct_index: number;
    difficulty: Difficulty | null;
  }>;
};

type UserQuizResponse = {
  quiz_id: number;
  quiz_title: string;
  quiz_category: string | null;
  correct_count: number;
  total_questions: number;
  points_earned: number;
  submitted_at: string;
};

type DepartmentUser = {
  user_id: number;
  full_name: string;
  email: string;
  total_points: number;
};

const ALTERNATIVE_LABELS = ["A", "B", "C", "D", "E"];
const MIN_ALTERNATIVES = 3;
const DIFFICULTIES: Difficulty[] = ["Fácil", "Médio", "Difícil"];

const xpForDifficulty: Record<Difficulty, number> = {
  Fácil: 10,
  Médio: 20,
  Difícil: 30,
};

const difficultyStyle: Record<Difficulty, string> = {
  Fácil: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Médio: "bg-amber-50 text-amber-700 border-amber-200",
  Difícil: "bg-rose-50 text-rose-700 border-rose-200",
};

const normalizeAlternatives = (alternatives: string[]): string[] => {
  const normalized = [...alternatives];
  while (normalized.length < MIN_ALTERNATIVES) {
    normalized.push("");
  }
  return normalized;
};

const makeEmptyQuestion = (): Question => ({
  text: "",
  alternatives: ["", "", ""],
  correctIndex: null,
  difficulty: "Fácil",
});

const isQuestionComplete = (question: Question): boolean =>
  question.text.trim().length > 0 &&
  question.alternatives.every((a) => a.trim().length > 0) &&
  question.correctIndex !== null;

export default function PhishingTrainingPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Para TI
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [questions, setQuestions] = useState<Question[]>([makeEmptyQuestion(), makeEmptyQuestion(), makeEmptyQuestion()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // Para Gestor
  const [departmentRanking, setDepartmentRanking] = useState<DepartmentUser[]>([]);

  // Para Colaborador
  const [userResponses, setUserResponses] = useState<UserQuizResponse[]>([]);

  const showFeedback = (type: "success" | "error" | "info", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 2800);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const role = (user.role || "").toUpperCase() as UserRole;
      setUserRole(role);

      if (role === "TI") {
        fetchQuizzes();
      } else if (role === "GESTOR") {
        fetchDepartmentRanking();
      } else if (role === "COLABORADOR") {
        fetchUserResponses();
      }
    }
    setLoading(false);
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get<QuizSummary[]>("/quizzes");
      setQuizzes(response.data);
    } catch (error) {
      console.error("Erro ao carregar quizzes:", error);
      showFeedback("error", "Erro ao carregar quizzes");
    }
  };

  const fetchDepartmentRanking = async () => {
    try {
      console.log("Fetching department ranking...");
      const response = await api.get<DepartmentUser[]>("/campaigns/quiz/department-ranking");
      console.log("Department ranking response:", response.data);
      setDepartmentRanking(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar ranking:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Erro ao carregar ranking do departamento";
      showFeedback("error", errorMsg);
    }
  };

  const fetchUserResponses = async () => {
    try {
      console.log("Fetching user responses...");
      const response = await api.get<UserQuizResponse[]>("/campaigns/quiz/user-responses");
      console.log("User responses:", response.data);
      setUserResponses(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar respostas:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Erro ao carregar seu histórico de quizzes";
      showFeedback("error", errorMsg);
    }
  };

  const resetForm = () => {
    setForm({ title: "", category: "", description: "" });
    setQuestions([makeEmptyQuestion(), makeEmptyQuestion(), makeEmptyQuestion()]);
    setCurrentIdx(0);
    setStep(1);
    setEditingId(null);
  };

  const closeModal = () => {
    setShowForm(false);
    resetForm();
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

  const addAlternative = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, alternatives: [...q.alternatives, ""] } : q))
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => {
      const next = [...prev, makeEmptyQuestion()];
      setCurrentIdx(next.length - 1);
      return next;
    });
  };

  const removeQuestion = (idx: number) => {
    if (idx < 3) {
      showFeedback("error", "As três primeiras perguntas são fixas e não podem ser removidas");
      return;
    }
    if (questions.length <= 3) {
      showFeedback("error", "O quiz precisa ter ao menos 3 perguntas");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
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
    if (questions.length < 3) {
      showFeedback("error", "Adicione ao menos 3 perguntas");
      return;
    }
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
      questions: questions.map((q) => ({
        text: q.text,
        alternatives: q.alternatives,
        correct_index: q.correctIndex as number,
        difficulty: q.difficulty,
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
      });
      const loaded: Question[] = quiz.questions.length
        ? quiz.questions.map((q) => ({
            text: q.text,
            alternatives: normalizeAlternatives(q.alternatives),
            correctIndex: q.correct_index,
            difficulty: (q.difficulty as Difficulty) ?? "Fácil",
          }))
        : [makeEmptyQuestion(), makeEmptyQuestion(), makeEmptyQuestion()];
      while (loaded.length < 3) {
        loaded.push(makeEmptyQuestion());
      }
      setQuestions(loaded);
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

  const completedCount = questions.filter(isQuestionComplete).length;
  const currentQuestion = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
        <p className="text-slate-600 text-lg">Carregando...</p>
      </div>
    );
  }

  // RENDERIZAÇÃO POR PERFIL
  if (userRole === "GESTOR") {
    return (
      <div className="space-y-8 animate-fade-in">
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white animate-fade-in ${
            feedback.type === "success" ? "bg-emerald-600" : feedback.type === "error" ? "bg-rose-600" : "bg-blue-600"
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Ranking de Colaboradores
            </h1>
            <p className="text-slate-600">Pontuação total de todos os colaboradores do seu departamento</p>
          </div>
        </div>

        <div className="grid gap-4">
          {departmentRanking.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <p className="text-slate-500">Nenhum colaborador com respostas de quiz</p>
            </div>
          ) : (
            departmentRanking.map((user, idx) => {
              // Definir cor baseada na posição
              let medalColor = "bg-gradient-to-br from-indigo-500 to-purple-600";
              let medalBgColor = "bg-white";
              let cardBorder = "border-slate-200";
              let medal = "";
              
              if (idx === 0) {
                // Ouro - 1º lugar
                medalColor = "bg-gradient-to-br from-yellow-400 to-yellow-600";
                medalBgColor = "bg-yellow-50";
                cardBorder = "border-yellow-300";
                medal = "🥇";
              } else if (idx === 1) {
                // Prata - 2º lugar
                medalColor = "bg-gradient-to-br from-gray-300 to-gray-400";
                medalBgColor = "bg-gray-50";
                cardBorder = "border-gray-300";
                medal = "🥈";
              } else if (idx === 2) {
                // Bronze - 3º lugar
                medalColor = "bg-gradient-to-br from-orange-400 to-orange-600";
                medalBgColor = "bg-orange-50";
                cardBorder = "border-orange-300";
                medal = "🥉";
              }
              
              return (
                <div
                  key={user.user_id}
                  className={`${medalBgColor} border-2 ${cardBorder} rounded-2xl shadow-sm hover:shadow-lg transition-all p-6 flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${medalColor} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                      {idx < 3 ? medal : idx + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <FiStar className="w-5 h-5 text-amber-500" />
                      <span className="text-3xl font-bold text-amber-600">{user.total_points}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Pontos Totais</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (userRole === "COLABORADOR") {
    return (
      <div className="space-y-8 animate-fade-in">
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white animate-fade-in ${
            feedback.type === "success" ? "bg-emerald-600" : feedback.type === "error" ? "bg-rose-600" : "bg-blue-600"
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Meus Quizzes
            </h1>
            <p className="text-slate-600">Histórico de quizzes respondidos e suas pontuações</p>
          </div>
        </div>

        <div className="grid gap-4">
          {userResponses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <FiHelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Você ainda não respondeu nenhum quiz</p>
            </div>
          ) : (
            userResponses.map((response, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{response.quiz_title}</h3>
                    {response.quiz_category && (
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-1">
                        {response.quiz_category}
                      </p>
                    )}
                    <div className="flex items-center gap-6 mt-3">
                      <span className="text-sm text-slate-600">
                        <strong>{response.correct_count}</strong> de <strong>{response.total_questions}</strong> acertadas
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(response.submitted_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <FiStar className="w-6 h-6 text-amber-500" />
                      <span className="text-3xl font-bold text-amber-600">{response.points_earned}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Pontos</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // TI - Tela de Gerenciamento
  return (
    <>
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white animate-fade-in ${
          feedback.type === "success" ? "bg-emerald-600" : feedback.type === "error" ? "bg-rose-600" : "bg-blue-600"
        }`}>
          {feedback.message}
        </div>
      )}

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
          <FiPlus className="w-5 h-5" /> Novo Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
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
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {quiz.category || "Geral"}
                  </p>
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
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{quiz.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <FiHelpCircle className="w-3.5 h-3.5" />
                    {quiz.question_count} perguntas
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-amber-600 font-bold">
                    <FiStar className="w-3.5 h-3.5" />
                    {quiz.total_xp} Pontos
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[960px] overflow-hidden flex flex-col max-h-[92vh]"
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
                    ? "Defina o título e a categoria."
                    : "Adicione perguntas e marque a alternativa correta. Cada pergunta tem sua dificuldade."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Título do Quiz <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Ex: Segurança de Senhas"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Ex: Phishing"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descreva o objetivo do quiz..."
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIdx) => (
                    <div key={qIdx} className={`p-4 rounded-xl border-2 transition ${
                      qIdx === currentIdx ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <label className="text-sm font-semibold text-slate-900">
                          Pergunta {qIdx + 1}
                        </label>
                        {qIdx >= 3 && (
                          <button
                            onClick={() => removeQuestion(qIdx)}
                            className="text-rose-500 hover:bg-rose-50 p-1 rounded transition"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                        placeholder="Digite a pergunta..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      {question.alternatives.map((alt, altIdx) => (
                        <input
                          key={altIdx}
                          type="text"
                          value={alt}
                          onChange={(e) => updateAlternative(qIdx, altIdx, e.target.value)}
                          placeholder={`Alternativa ${ALTERNATIVE_LABELS[altIdx]}`}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ))}

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => addAlternative(qIdx)}
                          className="text-xs px-3 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                        >
                          + Alternativa
                        </button>
                        <select
                          value={question.correctIndex ?? ""}
                          onChange={(e) => updateQuestion(qIdx, { correctIndex: Number(e.target.value) })}
                          className="text-xs px-3 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Correta?</option>
                          {question.alternatives.map((_, idx) => (
                            <option key={idx} value={idx}>
                              {ALTERNATIVE_LABELS[idx]}
                            </option>
                          ))}
                        </select>
                        <select
                          value={question.difficulty}
                          onChange={(e) => updateQuestion(qIdx, { difficulty: e.target.value as Difficulty })}
                          className="text-xs px-3 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {DIFFICULTIES.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addQuestion}
                    className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition font-semibold"
                  >
                    <FiPlus className="w-4 h-4 inline mr-2" /> Adicionar Pergunta
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => (step === 2 ? setStep(1) : closeModal())}
                className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-semibold flex items-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" /> {step === 2 ? "Voltar" : "Cancelar"}
              </button>
              <button
                onClick={step === 1 ? handleNextStep : handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {step === 1 ? (
                  <>
                    Próximo <FiArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {saving ? "Salvando..." : "Salvar Quiz"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
