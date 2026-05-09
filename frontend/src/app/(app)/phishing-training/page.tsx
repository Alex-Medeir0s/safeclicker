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
  FiEye,
} from "react-icons/fi";
import { api } from "@/services/api";

type Difficulty = "Fácil" | "Médio" | "Difícil";
type UserRole = "TI" | "GESTOR" | "COLABORADOR";
type RankingScope = "global" | "department";

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
  department_name: string | null;
  total_points: number;
};

const ALTERNATIVE_LABELS = ["A", "B", "C", "D", "E"];
const MIN_ALTERNATIVES = 2;
const DEFAULT_ALTERNATIVES = 4;
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

const pageShellClass = "min-h-screen bg-transparent";

const sectionShellClass = "rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]";

const normalizeAlternatives = (alternatives: string[]): string[] => {
  const normalized = [...alternatives];
  while (normalized.length < DEFAULT_ALTERNATIVES) {
    normalized.push("");
  }
  return normalized;
};

const makeEmptyQuestion = (): Question => ({
  text: "",
  alternatives: Array.from({ length: DEFAULT_ALTERNATIVES }, () => ""),
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<QuizDetail | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [questions, setQuestions] = useState<Question[]>([makeEmptyQuestion(), makeEmptyQuestion(), makeEmptyQuestion()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // Para Gestor
  const [rankingScope, setRankingScope] = useState<RankingScope>("global");
  const [globalRanking, setGlobalRanking] = useState<DepartmentUser[]>([]);
  const [departmentRanking, setDepartmentRanking] = useState<DepartmentUser[]>([]);

  // Para Colaborador
  const [userResponses, setUserResponses] = useState<UserQuizResponse[]>([]);
  const totalUserPoints = userResponses.reduce((sum, response) => sum + response.points_earned, 0);

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
        fetchGlobalRanking();
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

  const fetchGlobalRanking = async () => {
    try {
      console.log("Fetching global ranking...");
      const response = await api.get<DepartmentUser[]>("/campaigns/quiz/global-ranking");
      console.log("Global ranking response:", response.data);
      setGlobalRanking(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar ranking global:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Erro ao carregar ranking global";
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

  const removeAlternative = (qIdx: number, altIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === qIdx) {
          // Não permitir remover se deixar menos de 2 alternativas
          if (q.alternatives.length <= MIN_ALTERNATIVES) {
            showFeedback("error", `O quiz precisa ter no mínimo ${MIN_ALTERNATIVES} alternativas por pergunta`);
            return q;
          }
          // Se a alternativa removida era a correta, limpar a seleção
          const newCorrectIndex = q.correctIndex === altIdx ? null : q.correctIndex;
          return {
            ...q,
            alternatives: q.alternatives.filter((_, j) => j !== altIdx),
            correctIndex: newCorrectIndex,
          };
        }
        return q;
      })
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

  const handlePreview = async (id: number) => {
    try {
      const response = await api.get<QuizDetail>(`/quizzes/${id}`);
      setPreviewQuiz(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error(error);
      showFeedback("error", "Erro ao carregar visualização do quiz");
    }
  };

  const completedCount = questions.filter(isQuestionComplete).length;
  const currentQuestion = questions[currentIdx];
  const rankingData = rankingScope === "global" ? globalRanking : departmentRanking;
  const totalPossiblePoints = questions.reduce(
    (acc, question) => acc + xpForDifficulty[question.difficulty],
    0
  );

  const handleNextQuestion = () => {
    if (currentQuestion && currentQuestion.correctIndex === null) {
      showFeedback("error", "Marque a alternativa correta antes de avançar para a próxima pergunta");
      return;
    }

    setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
  };

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-[1.15] pb-1 mb-2">
              Ranking de Colaboradores
            </h1>
            <p className="text-slate-600">
              {rankingScope === "global"
                ? "Pontuação geral"
                : "Pontuação total dos colaboradores do meu departamento"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRankingScope("global");
                if (globalRanking.length === 0) fetchGlobalRanking();
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                rankingScope === "global"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
              }`}
            >
              Ranking geral
            </button>
            <button
              type="button"
              onClick={() => {
                setRankingScope("department");
                if (departmentRanking.length === 0) fetchDepartmentRanking();
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                rankingScope === "department"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
              }`}
            >
              Meu departamento
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {rankingData.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <p className="text-slate-500">
                {rankingScope === "global"
                  ? "Nenhum usuário com respostas de quiz"
                  : "Nenhum colaborador do departamento com respostas de quiz"}
              </p>
            </div>
          ) : (
            rankingData.map((user, idx) => {
              // Definir cor baseada na posição
              let medalColor = "bg-gradient-to-br from-slate-300 to-slate-400";
              let medalBgColor = "bg-slate-50";
              let cardBorder = "border-slate-200";
              let medal = "";
              let medalSize = "w-12 h-12";
              let cardPadding = "p-4";
              let nameSize = "text-base";
              let nameWeight = "font-semibold";
              let pointsSize = "text-2xl";
              let pointsWeight = "font-bold";
              
              if (idx === 0) {
                // Ouro - 1º lugar
                medalColor = "bg-gradient-to-br from-yellow-400 to-yellow-600";
                medalBgColor = "bg-yellow-50";
                cardBorder = "border-yellow-400";
                medal = "🥇";
                nameSize = "text-xl sm:text-2xl";
                pointsSize = "text-4xl sm:text-5xl";
              } else if (idx === 1) {
                // Prata - 2º lugar
                medalColor = "bg-gradient-to-br from-slate-400 to-slate-500";
                medalBgColor = "bg-slate-200";
                cardBorder = "border-slate-400";
                medal = "🥈";
                nameSize = "text-xl sm:text-2xl";
                pointsSize = "text-4xl sm:text-5xl";
              } else if (idx === 2) {
                // Bronze - 3º lugar
                medalColor = "bg-gradient-to-br from-orange-300 to-orange-400";
                medalBgColor = "bg-orange-50";
                cardBorder = "border-orange-200";
                medal = "🥉";
                nameSize = "text-xl sm:text-2xl";
                pointsSize = "text-4xl sm:text-5xl";
              }
              
              return (
                <div
                  key={user.user_id}
                  className={`${medalBgColor} border-2 ${cardBorder} rounded-2xl shadow-sm hover:shadow-lg transition-all ${cardPadding} flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${medalColor} ${medalSize} shrink-0 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                      {idx < 3 ? medal : idx + 1}
                    </div>
                    <div>
                      <h3 className={`${nameWeight} text-slate-900 ${nameSize}`}>{user.full_name}</h3>
                      <p className="text-sm text-slate-600">{user.email}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {user.department_name || "Sem departamento"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <FiStar className="w-5 h-5 text-amber-500" />
                      <span className={`${pointsWeight} text-amber-600 ${pointsSize}`}>{user.total_points}</span>
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
      <div className={`${pageShellClass} animate-fade-in`}>
        {feedback && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white animate-fade-in ${
            feedback.type === "success" ? "bg-emerald-600" : feedback.type === "error" ? "bg-rose-600" : "bg-blue-600"
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-indigo-600 font-semibold">Treinamento</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">Meus Quizzes</h1>
            <p className="text-slate-600 text-sm sm:text-base">Histórico de quizzes respondidos e suas pontuações</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total de pontos</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-amber-600">{totalUserPoints}</span>
                <span className="text-sm text-slate-500">acumulados</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Quizzes respondidos</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-indigo-600">{userResponses.length}</span>
                <span className="text-sm text-slate-500">registros</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:col-span-2 lg:col-span-1">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Média de acertos</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-900">
                  {userResponses.length > 0
                    ? `${Math.round(
                        userResponses.reduce(
                          (sum, response) => sum + (response.correct_count / Math.max(response.total_questions, 1)) * 100,
                          0
                        ) / userResponses.length
                      )}%`
                    : "0%"}
                </span>
                <span className="text-sm text-slate-500">desempenho</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {userResponses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <FiHelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Você ainda não respondeu nenhum quiz</p>
              </div>
            ) : (
              userResponses.map((response, idx) => {
                const scorePercentage = Math.round((response.correct_count / Math.max(response.total_questions, 1)) * 100);

                return (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                              Quiz respondido
                            </span>
                            {response.quiz_category && (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                {response.quiz_category}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">{response.quiz_title}</h3>

                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                              <strong className="text-slate-900 mr-1">{response.correct_count}</strong>
                              de <strong className="text-slate-900 mx-1">{response.total_questions}</strong>
                              acertos
                            </span>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                              {scorePercentage}% de acerto
                            </span>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                              {new Date(response.submitted_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 lg:text-right lg:pl-4 lg:border-l lg:border-slate-200">
                          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Pontos</p>
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <FiStar className="w-5 h-5 text-amber-500" />
                            <span className="text-3xl font-bold text-amber-600">{response.points_earned}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-300/7 to-purple-300/5 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {quiz.category || "Geral"}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(quiz.id)}
                      title="Visualizar"
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-sky-600 hover:text-white hover:border-sky-600 transition flex items-center justify-center"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
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
                    ? "Defina o título, categoria e a descrição."
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

            <div className="flex-1 overflow-hidden flex flex-col">
              {step === 1 ? (
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                <>
                  <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-700">
                        Pergunta {currentIdx + 1} de {questions.length}
                      </span>
                      <span className="text-slate-500">
                        {completedCount}/{questions.length} completas · {totalPossiblePoints} Pontos totais
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                        style={{ width: `${(completedCount / Math.max(questions.length, 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3 items-center">
                      {questions.map((question, index) => {
                        const complete = isQuestionComplete(question);
                        const active = index === currentIdx;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentIdx(index)}
                            title={`Pergunta ${index + 1}${complete ? " (completa)" : ""}`}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                              active ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                            } ${
                              complete
                                ? active
                                  ? "bg-indigo-600 text-white"
                                  : "bg-emerald-100 text-emerald-700"
                                : active
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addQuestion}
                        title="Adicionar pergunta"
                        className="w-7 h-7 rounded-lg text-xs font-bold transition bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 flex items-center justify-center"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {currentQuestion && (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium text-slate-700">
                            Dificuldade desta pergunta
                          </label>
                          <button
                            type="button"
                            onClick={() => removeQuestion(currentIdx)}
                            disabled={questions.length === 1}
                            title="Remover pergunta"
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            Remover
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {DIFFICULTIES.map((difficulty) => (
                            <button
                              key={difficulty}
                              type="button"
                              onClick={() => updateQuestion(currentIdx, { difficulty })}
                              className={`py-3 rounded-xl text-sm font-semibold border-2 transition flex flex-col items-center gap-0.5 ${
                                currentQuestion.difficulty === difficulty
                                  ? `${difficultyStyle[difficulty]} border-current`
                                  : "border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <span>{difficulty}</span>
                              <span className="text-[11px] font-medium opacity-80">
                                {xpForDifficulty[difficulty]} Pontos
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Pergunta
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Qual destes é um sinal típico de e-mail de phishing?"
                            value={currentQuestion.text}
                            onChange={(e) => updateQuestion(currentIdx, { text: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Alternativas <span className="text-slate-400 font-normal">(marque a correta)</span>
                          </label>
                          <div className="space-y-2">
                            {currentQuestion.alternatives.map((alt, altIdx) => {
                              const isCorrect = currentQuestion.correctIndex === altIdx;
                              const canRemove = currentQuestion.alternatives.length > MIN_ALTERNATIVES;
                              return (
                                <div
                                  key={altIdx}
                                  className={`flex items-stretch gap-2 p-2 rounded-xl border-2 transition ${
                                    isCorrect ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => updateQuestion(currentIdx, { correctIndex: altIdx })}
                                    title={isCorrect ? "Alternativa correta" : "Marcar como correta"}
                                    className={`w-10 h-10 flex-shrink-0 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition ${
                                      isCorrect
                                        ? "bg-emerald-500 text-white shadow"
                                        : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700"
                                    }`}
                                  >
                                    {isCorrect ? (
                                      <>
                                        <FiCheckCircle className="w-4 h-4" />
                                        <span>Certa</span>
                                      </>
                                    ) : (
                                      <span>{ALTERNATIVE_LABELS[altIdx]}</span>
                                    )}
                                  </button>
                                  <input
                                    type="text"
                                    value={alt}
                                    onChange={(e) => updateAlternative(currentIdx, altIdx, e.target.value)}
                                    placeholder={`Alternativa ${ALTERNATIVE_LABELS[altIdx]}`}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  {canRemove && (
                                    <button
                                      type="button"
                                      onClick={() => removeAlternative(currentIdx, altIdx)}
                                      title="Remover alternativa"
                                      className="w-10 h-10 flex-shrink-0 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition flex items-center justify-center"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => addAlternative(currentIdx)}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition"
                          >
                            <FiPlus className="w-4 h-4" />
                            Adicionar alternativa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {step === 1 ? (
              <div className="flex items-center justify-between p-6 pt-4 border-t border-slate-100">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-semibold flex items-center gap-2"
                >
                  <FiArrowLeft className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition font-semibold flex items-center gap-2"
                >
                  Próximo <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
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
                    onClick={addQuestion}
                    className="px-4 py-2.5 rounded-xl bg-white border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Adicionar pergunta
                  </button>
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>
                  {currentIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      disabled={currentQuestion?.correctIndex === null}
                      title={
                        currentQuestion?.correctIndex === null
                          ? "Marque a alternativa correta para avançar"
                          : "Ir para a próxima pergunta"
                      }
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      {saving ? "Salvando..." : "Salvar Quiz"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPreview && previewQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setShowPreview(false);
            setPreviewQuiz(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[960px] overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com fundo sutil degradado */}
            <div className="flex items-start justify-between p-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <div className="min-w-0 pr-4">
                <p className="text-[11px] uppercase tracking-wider text-indigo-600 font-semibold">Visualização do Quiz</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 break-words leading-tight">{previewQuiz.title}</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">{previewQuiz.category || "Geral"}</p>
                {previewQuiz.description && (
                  <p className="text-sm text-slate-600 mt-3 leading-6 break-words">{previewQuiz.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewQuiz(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition shrink-0"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              {previewQuiz.questions.length === 0 ? (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-medium">
                  Este quiz ainda não possui perguntas.
                </div>
              ) : (
                previewQuiz.questions
                  .sort((a, b) => a.position - b.position)
                  .map((question, questionIdx) => (
                    <div key={question.id} className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Barra gradiente no topo */}
                      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                      
                      <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 px-3 py-1 rounded-full">
                            Pergunta {questionIdx + 1}
                          </span>
                          {question.difficulty && (
                            <span className={`text-xs font-semibold border px-3 py-1 rounded-full ${difficultyStyle[question.difficulty]}`}>
                              {question.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-base leading-7 break-words">{question.text}</p>
                        <div className="space-y-3 pt-1">
                          {question.alternatives.map((alternative, altIdx) => {
                            const isCorrect = altIdx === question.correct_index;
                            return (
                              <div
                                key={altIdx}
                                className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                                  isCorrect
                                    ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 shadow-sm"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <span className={`text-sm font-black w-6 text-center shrink-0 mt-0.5 ${
                                  isCorrect ? "text-emerald-700" : "text-slate-500"
                                }`}>
                                  {ALTERNATIVE_LABELS[altIdx] || `${altIdx + 1}`}
                                </span>
                                <span className="text-sm flex-1 min-w-0 leading-6 break-words font-medium">{alternative}</span>
                                {isCorrect && <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 flex-shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewQuiz(null);
                }}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-semibold text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
