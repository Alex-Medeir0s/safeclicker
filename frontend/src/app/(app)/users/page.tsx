"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { FiDownload, FiUpload } from "react-icons/fi";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  department_id?: number | null;
  department_name?: string | null;
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
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "COLABORADOR" as string,
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
    
    // Validar que GESTOR/COLABORADOR tem departamento
    if (!editingUser && (formData.role === "GESTOR" || formData.role === "COLABORADOR")) {
      if (!formData.department_id) {
        alert("❌ Usuários com perfil Gestor ou Colaborador precisam ter um departamento definido");
        return;
      }
    }
    
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
      setFormData({ full_name: "", email: "", password: "", role: "COLABORADOR", department_id: null });
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
      department_id: user.department_id || null,
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

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/users/template/download", {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "usuarios_template.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Erro ao baixar template:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Erro ao baixar template";
      alert(`❌ Erro: ${errorMsg}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportMessage("");
    setImportError("");

    try {
      const formDataFile = new FormData();
      formDataFile.append("file", file);

      const response = await api.post("/users/import/csv", formDataFile, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setImportMessage(
        `✅ ${response.data.created} usuários criados com sucesso! (${response.data.total} total processados)`
      );

      if (response.data.errors && response.data.errors.length > 0) {
        const errorSummary = response.data.errors
          .slice(0, 5)
          .map(
            (err: any) =>
              `Linha ${err.line}: ${err.email || "?"} - ${err.error}`
          )
          .join("\n");
        setImportError(
          `⚠️ ${response.data.errors.length} erros encontrados:\n${errorSummary}${
            response.data.errors.length > 5
              ? `\n... e mais ${response.data.errors.length - 5}`
              : ""
          }`
        );
      }

      fetchUsers();
      setTimeout(() => {
        setShowImport(false);
        setImportMessage("");
        setImportError("");
        if (event.target) event.target.value = "";
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao importar usuários:", error);
      setImportError(
        error.response?.data?.detail || "Erro ao processar o arquivo CSV"
      );
    } finally {
      setImportLoading(false);
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
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ full_name: "", email: "", password: "", role: "COLABORADOR", department_id: null });
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Novo Usuário
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <FiUpload className="w-5 h-5" /> Importar CSV
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-xl mb-6 border-2 border-green-200 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-green-900">📥 Importar Usuários em Massa</h2>
              <p className="text-green-700 text-sm mt-1">Importe múltiplos usuários via arquivo CSV</p>
            </div>
            <button
              onClick={() => setShowImport(false)}
              className="text-green-600 hover:text-green-900 text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-green-200">
              <h3 className="font-bold text-lg text-slate-900 mb-4">📋 Passo 1: Baixar Template</h3>
              <p className="text-slate-600 mb-4">
                Clique no botão abaixo para baixar um arquivo CSV com o modelo correto de formatação.
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <FiDownload className="w-5 h-5" /> Baixar Template (usuarios_template.csv)
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-green-200">
              <h3 className="font-bold text-lg text-slate-900 mb-4">✏️ Passo 2: Preencher Dados</h3>
              <p className="text-slate-600 mb-3">
                Abra o arquivo em Excel ou outro editor de planilhas e preencha com os dados dos usuários:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg text-sm font-mono text-slate-700 space-y-1 mb-4">
                <p>• <strong>full_name</strong>: Nome completo do usuário</p>
                <p>• <strong>email</strong>: Email único (obrigatório)</p>
                <p>• <strong>password</strong>: Senha para acesso (obrigatório)</p>
                <p>• <strong>role</strong>: COLABORADOR, GESTOR ou TI (obrigatório)</p>
                <p>• <strong>department_id</strong>: ID do departamento (obrigatório para COLABORADOR e GESTOR)</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-green-200">
              <h3 className="font-bold text-lg text-slate-900 mb-4">📤 Passo 3: Fazer Upload</h3>
              <p className="text-slate-600 mb-4">
                Selecione o arquivo CSV preenchido para importar:
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importLoading}
                  className="block w-full text-sm text-slate-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-green-600 file:to-emerald-600
                    file:text-white
                    hover:file:from-green-700 hover:file:to-emerald-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    cursor-pointer"
                />
              </label>

              {importLoading && (
                <div className="mt-4 flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processando arquivo...</span>
                </div>
              )}

              {importMessage && (
                <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700 whitespace-pre-line">
                  {importMessage}
                </div>
              )}

              {importError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 whitespace-pre-line text-sm">
                  {importError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="GESTOR">Gestor</option>
                  <option value="TI">T.I</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                🏢 Departamento
                {!editingUser && (formData.role === "GESTOR" || formData.role === "COLABORADOR") && 
                  <span className="text-red-500"> *</span>
                }
              </label>
              <select
                value={formData.department_id || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  department_id: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="input w-full"
                required={!editingUser && (formData.role === "GESTOR" || formData.role === "COLABORADOR")}
              >
                <option value="">Selecione um departamento {!editingUser && (formData.role === "GESTOR" || formData.role === "COLABORADOR") ? "(obrigatório)" : "(opcional)"}</option>
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
                  setFormData({ full_name: "", email: "", password: "", role: "COLABORADOR", department_id: null });
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
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">🏢 Departamento</th>
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
                      user.role === "TI" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" :
                      user.role === "GESTOR" ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" :
                      "bg-gradient-to-r from-slate-400 to-slate-500 text-white"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.department_name || <span className="text-slate-400 italic">Sem departamento</span>}
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

