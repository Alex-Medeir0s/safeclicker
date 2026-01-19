"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "collaborator",
    department_id: null as number | null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/api/users/");
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/users/", formData);
      setFormData({ name: "", email: "", password: "", role: "collaborator", department_id: null });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usuários</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
        >
          + Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Perfil</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input w-full"
                >
                  <option value="collaborator">Colaborador</option>
                  <option value="gestor">Gestor</option>
                  <option value="ti">TI</option>
                  <option value="admin">Admin</option>
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

      {users.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center text-slate-500">
          Nenhum usuário cadastrado
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">E-mail</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Perfil</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Data de Criação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.role === "admin" ? "bg-red-100 text-red-800" :
                      user.role === "ti" ? "bg-blue-100 text-blue-800" :
                      user.role === "gestor" ? "bg-purple-100 text-purple-800" :
                      "bg-slate-100 text-slate-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
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

