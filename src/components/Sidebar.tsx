"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Campanhas", href: "/campaigns" },
  { label: "Usuários", href: "/users" },
  { label: "Relatórios", href: "/reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Link href="/dashboard" className="p-6 flex items-center justify-center hover:opacity-80 transition-opacity">
        <Image
          src="/safeclicker-logo-branca.png"
          alt="SafeClicker Logo"
          width={180}
          height={180}
          priority
        />
      </Link>

      <nav className="flex-1 px-4 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-3 rounded-lg ${
              pathname === item.href
                ? "bg-emerald-500 text-white"
                : "hover:bg-slate-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <p className="text-sm font-semibold">João Santos</p>
        <p className="text-xs text-slate-400">Admin</p>
        <Link
          href="/"
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          Sair
        </Link>
      </div>
    </aside>
  );
}
