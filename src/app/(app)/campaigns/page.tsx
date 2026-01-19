"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

interface Campaign {
  id: number;
  name: string;
  status: string;
  complexity: string;
  trigger?: string;
  target_departments?: string;
  created_at: string;
  template_id?: number;
}

export default function Campaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    html_content: "",
    complexity: "basico",
    trigger: "urgencia",
    target_departments: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, [router]);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get("/api/campaigns/");
      setCampaigns(response.data);
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (editingCampaign) {
        // Atualizar campanha existente
        await api.put(`/api/campaigns/${editingCampaign.id}`, formData);
        setEditingCampaign(null);
      } else {
        // Criar nova campanha
        await api.post("/api/campaigns/", formData);
      }
      
      setFormData({ 
        name: "", 
        html_content: "",
        complexity: "basico", 
        trigger: "urgencia",
        target_departments: "",
      });
      setShowForm(false);
      fetchCampaigns();
    } catch (error: any) {
      console.error("Erro ao criar/atualizar campanha:", error);
      const msg = error.response?.data?.detail || error.message || "Erro ao criar campanha";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleEditClick = async (campaign: Campaign) => {
    setEditingCampaign(campaign);
    
    try {
      // Busca o template para pegar o HTML
      if (campaign.template_id) {
        const templateResponse = await api.get(`/api/templates/${campaign.template_id}`);
        setFormData({
          name: campaign.name,
          html_content: templateResponse.data.html || "",
          complexity: campaign.complexity,
          trigger: "urgencia",
          target_departments: campaign.target_departments || "",
        });
      } else {
        setFormData({
          name: campaign.name,
          html_content: "",
          complexity: campaign.complexity,
          trigger: "urgencia",
          target_departments: campaign.target_departments || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar template:", error);
      setFormData({
        name: campaign.name,
        html_content: "",
        complexity: campaign.complexity,
        trigger: "urgencia",
        target_departments: campaign.target_departments || "",
      });
    }
    
    setShowForm(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
        >
          + Nova Campanha
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingCampaign ? "Editar Campanha" : "Nova Campanha de Phishing"}
          </h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Campanha</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="Ex: Campanha de Segurança Q1 2026"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Conteúdo HTML</label>
              <textarea
                value={formData.html_content}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                className="input w-full font-mono text-sm"
                rows={12}
                placeholder="Cole aqui o HTML do email de phishing..."
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Dica: Inclua variáveis como {"{nome}"}, {"{email}"}, {"{link_rastreamento}"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Complexidade</label>
                <select
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                  className="input w-full"
                >
                  <option value="basico">Básico - Fácil de identificar</option>
                  <option value="intermediario">Intermediário - Moderado</option>
                  <option value="avancado">Avançado - Muito convincente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gatilho Psicológico</label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="input w-full"
                >
                  <option value="urgencia">Urgência</option>
                  <option value="autoridade">Autoridade</option>
                  <option value="medo">Medo</option>
                  <option value="recompensa">Recompensa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Departamentos Alvo (IDs separados por vírgula)</label>
              <input
                type="text"
                value={formData.target_departments}
                onChange={(e) => setFormData({ ...formData, target_departments: e.target.value })}
                className="input w-full"
                placeholder="Ex: 1,2,3"
              />
              <p className="text-xs text-slate-500 mt-1">
                Deixe vazio para enviar a todos os departamentos
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingCampaign ? "Atualizar Campanha" : "Criar Campanha"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCampaign(null);
                }}
                className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-6 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center text-slate-500">
          Nenhuma campanha criada ainda
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign}
              onViewHtml={setSelectedHtml}
              onEditCampaign={handleEditClick}
            />
          ))}
        </div>
      )}

      {/* Modal de visualização HTML */}
      {selectedHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Visualização do HTML</h2>
              <button
                onClick={() => setSelectedHtml(null)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
              <iframe
                srcDoc={selectedHtml}
                className="w-full h-full border-0 bg-white"
                title="HTML Preview"
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
              <button
                onClick={() => setSelectedHtml(null)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CampaignCard({ campaign, onViewHtml, onEditCampaign }: { campaign: Campaign; onViewHtml: (html: string) => void; onEditCampaign: (campaign: Campaign) => void }) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleViewHtml = async () => {
    if (htmlContent) {
      onViewHtml(htmlContent);
      return;
    }

    setLoading(true);
    try {
      // Busca o template associado à campanha
      const response = await api.get(`/api/templates/${campaign.template_id}`);
      if (response.data.html) {
        setHtmlContent(response.data.html);
        onViewHtml(response.data.html);
      }
    } catch (error) {
      console.error("Erro ao buscar HTML:", error);
      alert("Erro ao carregar HTML da campanha");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar essa campanha?")) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/api/campaigns/${campaign.id}`);
      // Recarrega a página após deletar
      window.location.reload();
    } catch (error) {
      console.error("Erro ao deletar campanha:", error);
      alert("Erro ao deletar campanha");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
        <p className="text-sm text-slate-500">ID: {campaign.id}</p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Status:</span>
          <span className={`text-sm font-semibold ${
            campaign.status === "draft" ? "text-yellow-600" : "text-emerald-600"
          }`}>
            {campaign.status === "draft" ? "Rascunho" : "Enviada"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Complexidade:</span>
          <span className="text-sm font-semibold text-slate-900">{campaign.complexity}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleViewHtml}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
        >
          {loading ? "Carregando..." : "Visualizar"}
        </button>
        <button 
          onClick={() => onEditCampaign(campaign)}
          className="flex-1 bg-blue-900 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium"
        >
          Editar
        </button>
        <button 
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium"
        >
          {deleting ? "Deletando..." : "Excluir"}
        </button>
      </div>
    </div>
  );
}
