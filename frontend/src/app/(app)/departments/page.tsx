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
    return <div className="text-center py-12">Carregando departamentos...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Departamentos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
        >
          + Novo Departamento
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingDept ? "Editar Departamento" : "Novo Departamento"}
          </h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Departamento</label>
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
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Descreva o departamento..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                {editingDept ? "Atualizar" : "Criar"} Departamento
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {departments.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-slate-600">
            Nenhum departamento criado ainda.
          </div>
        ) : (
          departments.map((dept) => (
            <div key={dept.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{dept.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Criado em: {new Date(dept.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Deletar
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
