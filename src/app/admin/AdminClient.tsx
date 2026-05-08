"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";

type Usuario = {
  _id: string;
  yupId: string;
  nomeCompleto: string;
  email: string;
  dataNascimento: string;
  cidade: string;
  role: string;
  createdAt: string;
  totalAlbum: number;
  possui: number;
  idade: number;
};

type Evento = {
  _id: string;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  localNome: string;
  localUrl: string;
  localPreset?: string;
  ativo: boolean;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const LOCAIS_PRESET = [
  { nome: "Praca Central", url: "https://maps.google.com/?q=Praca+Central" },
  { nome: "Shopping Tropical", url: "https://maps.google.com/?q=Shopping+Tropical" },
  { nome: "Parque Municipal", url: "https://maps.google.com/?q=Parque+Municipal" },
  { nome: "Loja Yup", url: "https://maps.google.com/?q=Loja+Yup" },
];

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<"usuarios" | "eventos">("usuarios");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    localNome: "",
    localUrl: "",
    localPreset: ""
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsuarios = async () => {
    try {
      const res = await fetch(`/api/admin/users?page=${pagination.page}&limit=${pagination.limit}&search=${debouncedSearch}`);
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.usuarios || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error);
    }
  };

  const loadEventos = async () => {
    try {
      const res = await fetch("/api/admin/eventos");
      if (res.ok) {
        const data = await res.json();
        setEventos(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUsuarios(), loadEventos()]);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "usuarios") {
      loadUsuarios();
    }
  }, [pagination.page, debouncedSearch]);

  useEffect(() => {
    loadAll();
  }, []);

  const handlePresetChange = (presetNome: string) => {
    const preset = LOCAIS_PRESET.find(p => p.nome === presetNome);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        localNome: preset.nome,
        localUrl: preset.url,
        localPreset: presetNome
      }));
    }
  };

  const handleSubmitEvento = async () => {
    if (!formData.titulo || !formData.dataInicio || !formData.dataFim || !formData.localNome || !formData.localUrl) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    const url = editingEvent ? `/api/admin/eventos/${editingEvent._id}` : "/api/admin/eventos";
    const method = editingEvent ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success(editingEvent ? "Evento atualizado!" : "Evento criado!");
      setShowEventModal(false);
      setEditingEvent(null);
      setFormData({
        titulo: "",
        descricao: "",
        dataInicio: "",
        dataFim: "",
        localNome: "",
        localUrl: "",
        localPreset: ""
      });
      loadEventos();
    } else {
      const error = await res.json();
      toast.error(error.error || "Erro ao salvar evento");
    }
  };

  const handleDeleteEvento = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      const res = await fetch(`/api/admin/eventos/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Evento removido!");
        loadEventos();
      } else {
        toast.error("Erro ao remover evento");
      }
    }
  };

  const handleEditEvento = (evento: Evento) => {
    setEditingEvent(evento);
    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao || "",
      dataInicio: evento.dataInicio.split(".")[0].slice(0, 16),
      dataFim: evento.dataFim.split(".")[0].slice(0, 16),
      localNome: evento.localNome,
      localUrl: evento.localUrl,
      localPreset: evento.localPreset || ""
    });
    setShowEventModal(true);
  };

  const handleResetPassword = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      toast.error("Senha temporaria deve ter pelo menos 6 caracteres");
      return;
    }
    
    const res = await fetch(`/api/admin/users/${selectedUser?._id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaTemporaria: novaSenha })
    });
    
    if (res.ok) {
      toast.success("Senha redefinida! Envie a senha para o usuario.");
      setShowResetModal(false);
      setNovaSenha("");
      setSelectedUser(null);
      loadUsuarios();
    } else {
      const error = await res.json();
      toast.error(error.error || "Erro ao resetar senha");
    }
  };

  if (loading) {
    return (
      <AppShell title="Admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brincadeira-viva border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin">
      <div className="max-w-7xl mx-auto">
        {/* Abas */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              setActiveTab("usuarios");
              setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
            }}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "usuarios"
                ? "border-b-2 border-brincadeira-viva text-brincadeira-viva"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Usuarios ({pagination?.total || 0})
          </button>
          <button
            onClick={() => setActiveTab("eventos")}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "eventos"
                ? "border-b-2 border-brincadeira-viva text-brincadeira-viva"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Eventos de Troca ({eventos.length})
          </button>
        </div>

        {/* TAB: USUARIOS */}
        {activeTab === "usuarios" && (
          <div>
            {/* Busca */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email ou YupID..."
                className="w-full max-w-md p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d0d1a]"
              />
            </div>

            {/* Cards de usuarios */}
            <div className="grid gap-3">
              {usuarios.map((user) => (
                <div key={user._id} className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">#{user.yupId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.role === "admin" 
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </div>
                      <h3 
                        className="text-lg font-semibold text-brincadeira-viva cursor-pointer hover:underline mt-1"
                        onClick={() => {
                          setSelectedUser(user);
                          setNovaSenha("");
                          setShowResetModal(true);
                        }}
                      >
                        {user.nomeCompleto}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>{user.idade} anos</span>
                        <span>{user.cidade}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brincadeira-viva/10 text-brincadeira-viva text-sm font-semibold">
                          {user.possui} / {user.totalAlbum} figurinhas
                        </span>
                      </div>
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brincadeira-viva rounded-full"
                          style={{ width: `${(user.possui / user.totalAlbum) * 100}%` }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNovaSenha("");
                          setShowResetModal(true);
                        }}
                        className="mt-3 px-3 py-1 text-xs rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      >
                        Resetar Senha
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginacao */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, (prev?.page || 1) - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1">
                    Pagina {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev?.totalPages || 1, (prev?.page || 1) + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: EVENTOS */}
        {activeTab === "eventos" && (
          <div>
            <button
              onClick={() => {
                setEditingEvent(null);
                setFormData({
                  titulo: "",
                  descricao: "",
                  dataInicio: "",
                  dataFim: "",
                  localNome: "",
                  localUrl: "",
                  localPreset: ""
                });
                setShowEventModal(true);
              }}
              className="mb-4 px-4 py-2 rounded-lg bg-brincadeira-viva text-white text-sm font-medium"
            >
              + Novo Evento de Troca
            </button>

            <div className="grid gap-3">
              {eventos.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>Nenhum evento de troca criado ainda</p>
                </div>
              )}
              {eventos.map((evento) => (
                <div key={evento._id} className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{evento.titulo}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          evento.ativo 
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {evento.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      {evento.descricao && (
                        <p className="text-gray-500 text-sm mt-1">{evento.descricao}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        <span>📅 {new Date(evento.dataInicio).toLocaleDateString()} - {new Date(evento.dataFim).toLocaleDateString()}</span>
                        <span>📍 {evento.localNome}</span>
                        <a href={evento.localUrl} target="_blank" rel="noopener noreferrer" className="text-brincadeira-viva hover:underline">
                          🗺️ Ver mapa
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditEvento(evento)} className="p-2 rounded-lg hover:bg-gray-100">
                        Editar
                      </button>
                      <button onClick={() => handleDeleteEvento(evento._id)} className="p-2 rounded-lg hover:bg-red-100 text-red-500">
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Reset Senha */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Resetar Senha</h2>
            </div>
            <div className="p-4 space-y-4">
              <p>Usuario: <strong>{selectedUser.nomeCompleto}</strong></p>
              <p>Email: <strong>{selectedUser.email}</strong></p>
              <input
                type="text"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Senha temporaria"
                className="w-full p-2 rounded-lg border"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowResetModal(false)} className="flex-1 py-2 rounded-lg bg-gray-200">
                  Cancelar
                </button>
                <button onClick={handleResetPassword} className="flex-1 py-2 rounded-lg bg-brincadeira-viva text-white">
                  Resetar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Evento */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">{editingEvent ? "Editar Evento" : "Novo Evento"}</h2>
            </div>
            <div className="p-4 space-y-4">
              <input type="text" value={formData.titulo} onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Titulo" className="w-full p-2 rounded-lg border" />
              <textarea value={formData.descricao} onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descricao" rows={2} className="w-full p-2 rounded-lg border" />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={formData.dataInicio} onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))} className="w-full p-2 rounded-lg border" />
                <input type="datetime-local" value={formData.dataFim} onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))} className="w-full p-2 rounded-lg border" />
              </div>
              <select value={formData.localPreset} onChange={(e) => handlePresetChange(e.target.value)} className="w-full p-2 rounded-lg border">
                <option value="">Local pre-salvo</option>
                {LOCAIS_PRESET.map(loc => <option key={loc.nome} value={loc.nome}>{loc.nome}</option>)}
              </select>
              <input type="text" value={formData.localNome} onChange={(e) => setFormData(prev => ({ ...prev, localNome: e.target.value }))} placeholder="Nome do Local" className="w-full p-2 rounded-lg border" />
              <input type="url" value={formData.localUrl} onChange={(e) => setFormData(prev => ({ ...prev, localUrl: e.target.value }))} placeholder="Link Google Maps" className="w-full p-2 rounded-lg border" />
              <div className="flex gap-3">
                <button onClick={() => setShowEventModal(false)} className="flex-1 py-2 rounded-lg bg-gray-200">Cancelar</button>
                <button onClick={handleSubmitEvento} className="flex-1 py-2 rounded-lg bg-brincadeira-viva text-white">{editingEvent ? "Salvar" : "Criar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}