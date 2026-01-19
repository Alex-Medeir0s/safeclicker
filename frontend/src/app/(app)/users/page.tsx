"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
}

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "colaborador" as string,
    department_id: null as number | null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchUsers();
    fetchDepartments();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/");
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments/");
      setDepartments(response.data);
    } catch (error) {
      console.error("Erro ao buscar departamentos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Atualizar usuário existente
        const updateData: any = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          department_id: formData.department_id,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/users/${editingUser.id}`, updateData);
        setEditingUser(null);
      } else {
        // Criar novo usuário
        await api.post("/users/", formData);
      }
      setFormData({ full_name: "", email: "", password: "", role: "colaborador", department_id: null });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
      department_id: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Carregando usuários...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Usuários
          </h1>
          <p className="text-slate-600">Gerencie os usuários do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ full_name: "", email: "", password: "", role: "colaborador", department_id: null });
            setShowForm(!showForm);
          }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border border-slate-200 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">
            {editingUser ? "✏️ Editar Usuário" : "👥 Cadastrar Novo Usuário"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                <label className="block text-sm font-medium mb-2">
                  Senha {editingUser && <span className="text-xs text-slate-500">(deixe em branco para não alterar)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input w-full"
                  required={!editingUser}
                  placeholder={editingUser ? "Nova senha (opcional)" : "Senha"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">🏷️ Perfil</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="gestor">Gestor</option>
                  <option value="ti">T.I</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">🏢 Departamento</label>
              <select
                value={formData.department_id || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  department_id: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="input w-full"
              >
                <option value="">Selecione um departamento (opcional)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {editingUser ? "✓ Atualizar Usuário" : "✓ Criar Usuário"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ full_name: "", email: "", password: "", role: "colaborador", department_id: null });
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300"
              >
                ✕ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center shadow-lg border border-slate-200">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-slate-500 text-lg">Nenhum usuário cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">👤 Nome</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">📧 E-mail</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">🏷️ Perfil</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">📅 Data de Criação</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">⚙️ Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user, idx) => (
                <tr 
                  key={user.id} 
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 animate-fade-in"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                      user.role === "admin" ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" :
                      user.role === "ti" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" :
                      user.role === "gestor" ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" :
                      "bg-gradient-to-r from-slate-400 to-slate-500 text-white"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
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

