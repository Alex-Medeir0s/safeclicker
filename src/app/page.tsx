"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@safeclicker.com");
  const [password, setPassword] = useState("admin123");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirecionar para dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* LEFT */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white flex flex-col justify-center items-center p-16">
        <Image
          src="/safeclicker-logo-branca.png"
          alt="SafeClicker Logo"
          width={350}
          height={350}
          priority
        />
        <p className="text-2xl text-center mt-12 text-slate-200 font-light max-w-md">
          Proteja sua organização contra ataques de phishing com treinamento inteligente
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md px-8">
          <div className="bg-white p-10 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-2 text-slate-900">Bem-vindo de volta</h2>
            <p className="text-slate-500 mb-8">
              Entre com suas credenciais para acessar a plataforma
            </p>

            <form className="space-y-5" onSubmit={handleLogin}>
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
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 w-4 h-4" />
                  <span className="text-slate-600">Lembrar de mim</span>
                </label>
                <a href="#" className="text-blue-900 hover:underline font-medium">
                  Esqueceu a senha?
                </a>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Entrar
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-sm text-slate-500">
                Precisa de ajuda? <a href="#" className="text-blue-900 hover:underline font-medium">Contate o suporte</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
