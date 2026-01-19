"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

interface Template {
  id: number;
  name: string;
  complexity: string;
  trigger: string;
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    html: "",
    complexity: "basico",
    trigger: "urgencia",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchTemplates();
  }, [router]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get("/templates/");
      setTemplates(response.data);
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/templates/", formData);
      setFormData({ name: "", html: "", complexity: "basico", trigger: "urgencia" });
      setShowForm(false);
      fetchTemplates();
    } catch (error) {
      console.error("Erro ao criar template:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja deletar este template?")) {
      try {
        await api.delete(`/templates/${id}`);
        fetchTemplates();
      } catch (error) {
        console.error("Erro ao deletar template:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Templates HTML</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
        >
          + Novo Template
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Template</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">HTML</label>
              <textarea
                value={formData.html}
                onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                className="input w-full h-32 font-mono text-sm"
                placeholder="<html>...</html>"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Complexidade</label>
                <select
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                  className="input w-full"
                >
                  <option value="basico">Básico</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gatilho</label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="input w-full"
                >
                  <option value="urgencia">Urgência</option>
                  <option value="autoridade">Autoridade</option>
                  <option value="medo">Medo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center text-slate-500">
          Nenhum template criado ainda
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Complexidade</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Gatilho</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Data</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{template.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{template.complexity}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{template.trigger}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(template.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
