"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  risk_level: string;
  trainings_completed: number;
  trainings_total: number;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/users")
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Usuários</h1>

      <table className="w-full bg-white rounded-xl overflow-hidden">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="p-4">Nome</th>
            <th>Email</th>
            <th>Departamento</th>
            <th>Risco</th>
            <th>Treinamentos</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </>
  );
}

function UserRow({ user }: { user: User }) {
  const riskColors: any = {
    Baixo: "text-emerald-500 bg-emerald-50",
    Médio: "text-yellow-600 bg-yellow-50",
    Alto: "text-red-500 bg-red-50",
  };

  return (
    <tr className="border-t">
      <td className="p-4 font-semibold">{user.name}</td>
      <td className="text-slate-600">{user.email}</td>
      <td>{user.department}</td>
      <td>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            riskColors[user.risk_level] || riskColors.Baixo
          }`}
        >
          {user.risk_level}
        </span>
      </td>
      <td className="font-semibold">{user.trainings_completed}/{user.trainings_total}</td>
    </tr>
  );
}
