"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

interface Campaign {
  id: number;
  title: string;
  status: string;
  target_users: number;
  clicks: number;
  reports: number;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/campaigns")
      .then(res => {
        setCampaigns(res.data);
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
      <h1 className="text-3xl font-bold mb-6">Campanhas</h1>

      <div className="grid grid-cols-2 gap-6">
        {campaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <span className="text-sm text-emerald-600 font-semibold">
        {campaign.status}
      </span>
      <h3 className="text-xl font-bold mt-2">{campaign.title}</h3>

      <div className="grid grid-cols-3 mt-6 text-center">
        <Metric label="Alvos" value={campaign.target_users.toString()} />
        <Metric label="Cliques" value={campaign.clicks.toString()} color="text-red-500" />
        <Metric label="Reportes" value={campaign.reports.toString()} color="text-emerald-500" />
      </div>
    </div>
  );
}

function Metric({ label, value, color }: any) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
