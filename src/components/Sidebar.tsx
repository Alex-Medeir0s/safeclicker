"use client";

import Link from "next/link";
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
      <div className="p-6 text-xl font-bold text-emerald-400">
        SafeClicker
        <p className="text-sm text-slate-400 font-normal">
          Phishing Training
        </p>
      </div>

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
      </div>
    </aside>
  );
}
