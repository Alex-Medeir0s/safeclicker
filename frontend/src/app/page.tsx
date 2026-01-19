"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authAPI } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@safeclicker.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login({ email, password });
      
      // Armazenar token se retornado
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      // Armazenar informações do usuário
      if (response.data.id) {
        localStorage.setItem("userId", response.data.id.toString());
        localStorage.setItem("userEmail", response.data.email);
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* LEFT */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex flex-col justify-center items-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse-soft"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse-soft"></div>
        
        <div className="relative z-10 animate-fade-in">
          <Image
            src="/safeclicker-logo-branca.png"
            alt="SafeClicker Logo"
            width={300}
            height={300}
            priority
            className="mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            SafeClicker
          </h1>
          <p className="text-xl text-slate-200 font-light max-w-md text-center mt-4">
            Plataforma de Treinamento em Segurança de Phishing
          </p>
          <div className="flex gap-8 mt-12 justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400">99%</div>
              <div className="text-sm text-slate-300">Taxa de Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">10k+</div>
              <div className="text-sm text-slate-300">Usuários Treinados</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md px-8 animate-fade-in">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 card-hover">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Bem-vindo 👋
              </h2>
              <p className="text-slate-500">
                Entre com suas credenciais para acessar a plataforma
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl animate-fade-in flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  📧 E-mail
                </label>
                <input 
                  className="input w-full" 
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  🔒 Senha
                </label>
                <input 
                  className="input w-full" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Conectando...
                  </span>
                ) : (
                  "🚀 Entrar"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-600 mb-2">Credenciais de teste:</p>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 space-y-1">
                <p className="font-mono text-sm font-semibold text-slate-700">📧 admin@safeclicker.com</p>
                <p className="font-mono text-sm font-semibold text-slate-700">🔑 admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
