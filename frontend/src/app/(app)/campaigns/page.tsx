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

interface Department {
  id: number;
  name: string;
}

export default function Campaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    html_content: "",
    complexity: "basico",
    trigger: "urgencia",
    target_departments: "",
    template_id: 1,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaigns();
    fetchDepartments();
  }, [router]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments/");
      setDepartments(response.data);
    } catch (error) {
      console.error("Erro ao buscar departamentos:", error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await api.get("/campaigns/");
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
    
    const targetDepartments = selectedDeptIds.join(",");
    
    try {
      if (editingCampaign) {
        // Atualizar campanha existente
        await api.put(`/campaigns/${editingCampaign.id}`, {
          name: formData.name,
          description: formData.name,
          template_id: formData.template_id,
          status: "draft",
          target_audience: targetDepartments,
        });
        setEditingCampaign(null);
      } else {
        // Criar novo template primeiro
        const templateResponse = await api.post("/templates/", {
          name: `Template - ${formData.name}`,
          subject: formData.name,
          body: formData.html_content,
          description: `Template para ${formData.name}`,
        });
        
        const templateId = templateResponse.data.id;
        
        // Criar nova campanha com o template
        await api.post("/campaigns/", {
          name: formData.name,
          description: formData.name,
          template_id: templateId,
          status: "draft",
          target_audience: targetDepartments,
        });
      }
      
      setFormData({ 
        name: "", 
        html_content: "",
        complexity: "basico", 
        trigger: "urgencia",
        target_departments: "",
        template_id: 1,
      });
      setSelectedDeptIds([]);
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
        const templateResponse = await api.get(`/templates/${campaign.template_id}`);
        setFormData({
          name: campaign.name,
          html_content: templateResponse.data.body || "",
          complexity: campaign.complexity,
          trigger: "urgencia",
          target_departments: campaign.target_departments || "",
          template_id: campaign.template_id,
        });
      } else {
        setFormData({
          name: campaign.name,
          html_content: "",
          complexity: campaign.complexity,
          trigger: "urgencia",
          target_departments: campaign.target_departments || "",
          template_id: 1,
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
        template_id: campaign.template_id || 1,
      });
    }
    
    setShowForm(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Campanhas
          </h1>
          <p className="text-slate-600">Gerencie suas campanhas de segurança</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nova Campanha
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border border-slate-200 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
            {editingCampaign ? "✏️ Editar Campanha" : "🎯 Nova Campanha de Phishing"}
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
              <label className="block text-sm font-medium mb-2">Departamentos Alvo</label>
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 max-h-48 overflow-y-auto">
                {departments.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum departamento disponível</p>
                ) : (
                  <div className="space-y-2">
                    {departments.map((dept) => (
                      <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedDeptIds.includes(dept.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeptIds([...selectedDeptIds, dept.id]);
                            } else {
                              setSelectedDeptIds(selectedDeptIds.filter((id) => id !== dept.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedDeptIds.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {selectedDeptIds.length} departamento(s) selecionado(s)
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {editingCampaign ? "✓ Atualizar Campanha" : "🚀 Criar Campanha"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCampaign(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                ✕ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Carregando campanhas...</p>
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center shadow-lg border border-slate-200">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-slate-500 text-lg">Nenhuma campanha criada ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, idx) => (
            <div key={campaign.id} style={{ animationDelay: `${idx * 0.1}s` }} className="animate-fade-in">
              <CampaignCard 
                campaign={campaign}
                onViewHtml={setSelectedHtml}
                onEditCampaign={handleEditClick}
                departments={departments}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualização HTML */}
      {selectedHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-2xl font-bold text-slate-800">👁️ Visualização do HTML</h2>
              <button
                onClick={() => setSelectedHtml(null)}
                className="text-slate-500 hover:text-red-600 text-3xl w-10 h-10 rounded-full hover:bg-red-100 transition-all duration-300"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
              <iframe
                srcDoc={selectedHtml}
                className="w-full h-full min-h-[600px] border-0 bg-white rounded-lg shadow-lg"
                title="HTML Preview"
              />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
              <button
                onClick={() => setSelectedHtml(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
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

function CampaignCard({ campaign, onViewHtml, onEditCampaign, departments }: { campaign: Campaign; onViewHtml: (html: string) => void; onEditCampaign: (campaign: Campaign) => void; departments: Department[] }) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Função para obter nomes dos departamentos selecionados
  const getDepartmentNames = () => {
    if (!campaign.target_audience) return "Nenhum";
    
    const deptIds = campaign.target_audience.split(",").map(id => parseInt(id.trim()));
    const names = deptIds
      .map(id => departments.find(d => d.id === id)?.name)
      .filter(name => name)
      .join(", ");
    
    return names || "Nenhum";
  };

  const handleViewHtml = async () => {
    if (htmlContent) {
      onViewHtml(htmlContent);
      return;
    }

    setLoading(true);
    try {
      // Busca o template associado à campanha
      const response = await api.get(`/templates/${campaign.template_id}`);
      if (response.data.body) {
        setHtmlContent(response.data.body);
        onViewHtml(response.data.body);
      } else if (response.data.html) {
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
      await api.delete(`/campaigns/${campaign.id}`);
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
    <div className="bg-white p-6 rounded-2xl shadow-lg card-hover border border-slate-200 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative z-10">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{campaign.name}</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">#{campaign.id}</span>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
            <span className="text-sm text-slate-600 font-medium">📊 Status:</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg shadow-sm ${
              campaign.status === "draft" 
                ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white" 
                : "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
            }`}>
              {campaign.status === "draft" ? "Rascunho" : "Enviada"}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <span className="text-sm text-slate-600 font-medium">🎯 Complexidade:</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg shadow-sm ${
              campaign.complexity === "basico" ? "bg-blue-100 text-blue-700" :
              campaign.complexity === "intermediario" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {campaign.complexity === "basico" ? "Básico" :
               campaign.complexity === "intermediario" ? "Intermediário" :
               "Avançado"}
            </span>
          </div>
          {campaign.target_audience && (
            <div className="flex flex-col p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <span className="text-sm text-slate-600 font-medium mb-1">🏢 Departamentos Alvo:</span>
              <span className="text-sm font-bold text-green-700 line-clamp-2" title={getDepartmentNames()}>
                {getDepartmentNames()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleViewHtml}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            {loading ? "⏳ Carregando..." : "👁️ Visualizar"}
          </button>
          <button 
            onClick={() => onEditCampaign(campaign)}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            ✏️ Editar
          </button>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            {deleting ? "🗑️ Deletando..." : "🗑️ Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
