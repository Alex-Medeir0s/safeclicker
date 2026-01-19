"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Campanhas", href: "/campaigns", icon: "🎯" },
  { label: "Usuários", href: "/users", icon: "👥" },
  { label: "Departamentos", href: "/departments", icon: "🏢" },
  { label: "Relatórios", href: "/reports", icon: "📈" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed inset-y-0 left-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-100 flex flex-col shadow-2xl animate-slide-in z-20">
      <Link href="/dashboard" className="p-6 flex items-center justify-center hover:scale-105 transition-transform duration-300">
        <Image
          src="/safeclicker-logo-branca.png"
          alt="SafeClicker Logo"
          width={180}
          height={180}
          priority
        />
      </Link>

      <nav className="flex-1 px-4 space-y-2">
        {menu.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ animationDelay: `${index * 0.1}s` }}
            className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 animate-fade-in flex items-center gap-3 ${
              pathname === item.href
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50 scale-105"
                : "hover:bg-slate-800 hover:translate-x-1 text-slate-300"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl mb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              J
            </div>
            <div>
              <p className="text-sm font-semibold">João Santos</p>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-red-500/30"
        >
          🚪 Sair
        </Link>
      </div>
    </aside>
  );
}
