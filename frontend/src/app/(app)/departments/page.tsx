"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments/");
      setDepartments(response.data);
    } catch (error) {
      console.error("Erro ao buscar departamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, formData);
        setEditingDept(null);
      } else {
        await api.post("/departments/", formData);
      }

      setFormData({ name: "", description: "" });
      setShowForm(false);
      fetchDepartments();
    } catch (error: any) {
      console.error("Erro ao criar/atualizar departamento:", error);
      const msg = error.response?.data?.detail || error.message || "Erro ao processar departamento";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este departamento?")) {
      try {
        await api.delete(`/departments/${id}`);
        fetchDepartments();
      } catch (error: any) {
        const msg = error.response?.data?.detail || "Erro ao deletar departamento";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDept(null);
    setFormData({ name: "", description: "" });
    setError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando departamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Departamentos
          </h1>
          <p className="text-slate-600">Gerencie os departamentos da empresa</p>
        </div>
        <button
          onClick={() => {
            setEditingDept(null);
            setFormData({ name: "", description: "" });
            setShowForm(!showForm);
          }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Novo Departamento
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border border-slate-200 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              {editingDept ? "✏️" : "🏢"}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {editingDept ? `✏️ Editando: ${editingDept.name}` : "🏢 Novo Departamento"}
            </h2>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">🏢 Nome do Departamento</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="Ex: Financeiro, RH, TI"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">📄 Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Descreva o departamento..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {editingDept ? "✓ Atualizar" : "🚀 Criar"} Departamento
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300"
              >
                ✕ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {departments.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center shadow-lg border border-slate-200">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-slate-500 text-lg">Nenhum departamento criado ainda</p>
          </div>
        ) : (
          departments.map((dept, idx) => (
            <div 
              key={dept.id} 
              style={{ animationDelay: `${idx * 0.1}s` }}
              className={`bg-white p-6 rounded-2xl shadow-lg border-2 card-hover animate-fade-in transition-all ${
                editingDept?.id === dept.id 
                  ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50" 
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">#{dept.id}</span>
                    <h3 className="text-2xl font-bold text-slate-900">{dept.name}</h3>
                    {editingDept?.id === dept.id && (
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ✏️ Editando
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{dept.description || "Sem descrição"}</p>
                  <p className="text-xs text-slate-500">
                    📅 Criado em: {new Date(dept.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
