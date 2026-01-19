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
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white flex flex-col justify-center items-center p-16">
        <Image
          src="/safeclicker-logo-branca.png"
          alt="SafeClicker Logo"
          width={300}
          height={300}
          priority
          className="mb-8"
        />
        <h1 className="text-4xl font-bold text-center">SafeClicker</h1>
        <p className="text-xl text-slate-200 font-light max-w-md text-center mt-4">
          Plataforma de Treinamento em Segurança de Phishing
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md px-8">
          <div className="bg-white p-10 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-2 text-slate-900">Bem-vindo</h2>
            <p className="text-slate-500 mb-8">
              Entre com suas credenciais para acessar a plataforma
            </p>

            <form className="space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
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
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Conectando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
              <p>Credenciais padrão:</p>
              <p className="font-medium">admin@safeclicker.com</p>
              <p className="font-medium">admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
