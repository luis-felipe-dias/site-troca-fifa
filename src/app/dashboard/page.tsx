"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import BannerLoja from "@/components/BannerLoja";
import { Bell, CheckCircle, Calendar, MapPin, Clock, Sparkle, CaretLeft, CaretRight, Funnel } from "@phosphor-icons/react";

type Stats = {
  totalFigurinhas: number;
  possui: number;
  repetidas: number;
  faltantes: number;
  progresso: number;
  pendentes: number;
  user: { yupId: string; cidade: string };
};

type Evento = {
  _id: string;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  localNome: string;
  localUrl: string;
  ativo: boolean;
};

type Notificacao = {
  _id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dados: {
    trocaId?: string;
    usuarioYupId?: string;
    figurinhaA?: string;
    figurinhaB?: string;
  };
  lida: boolean;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const paginationPadrao: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [proximoEvento, setProximoEvento] = useState<Evento | null>(null);
  const [todosEventos, setTodosEventos] = useState<Evento[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [pagination, setPagination] = useState<Pagination>(paginationPadrao);
  const [filtroNotificacoes, setFiltroNotificacoes] = useState<"todas" | "naoLidas" | "lidas">("todas");
  const [loading, setLoading] = useState(true);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const [tempoRestante, setTempoRestante] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0
  });
  const [statusEvento, setStatusEvento] = useState<"aguardando" | "acontecendo" | "encerrado">("aguardando");

  // Buscar notificações com paginação e filtro
  const fetchNotificacoes = useCallback(async (page: number, filtro: string) => {
    setLoadingNotificacoes(true);
    try {
      const res = await fetch(`/api/notificacoes?page=${page}&limit=20&filtro=${filtro}`);
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data.notificacoes || []);
        setPagination(data.pagination || paginationPadrao);
      } else {
        setPagination(paginationPadrao);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      setPagination(paginationPadrao);
    } finally {
      setLoadingNotificacoes(false);
    }
  }, []);

  // Buscar estatísticas e eventos
  const fetchStatsAndEvents = useCallback(async () => {
    try {
      const [statsRes, eventosRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/eventos/proximos")
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      
      if (eventosRes.ok) {
        const eventosData = await eventosRes.json();
        setProximoEvento(eventosData.proximoEvento);
        setTodosEventos(eventosData.proximosEventos || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  // Carregamento inicial
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStatsAndEvents(),
      fetchNotificacoes(1, "todas")
    ]).finally(() => setLoading(false));
    
    const interval = setInterval(() => {
      fetchStatsAndEvents();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStatsAndEvents, fetchNotificacoes]);

  // Quando filtro mudar, recarregar notificações
  useEffect(() => {
    if (!loading) {
      fetchNotificacoes(1, filtroNotificacoes);
    }
  }, [filtroNotificacoes, fetchNotificacoes, loading]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchNotificacoes(newPage, filtroNotificacoes);
    }
  };

  // Cronômetro corrigido
  useEffect(() => {
    if (!proximoEvento) return;

    const calcularTempo = () => {
      const agora = new Date();
      const eventoInicio = new Date(proximoEvento.dataInicio);
      const eventoFim = new Date(proximoEvento.dataFim);

      // Verifica se o evento já começou
      if (agora >= eventoInicio) {
        // Verifica se o evento já terminou
        if (agora >= eventoFim) {
          setStatusEvento("encerrado");
          setTempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
          return;
        }
        // Evento em andamento
        setStatusEvento("acontecendo");
        setTempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
        return;
      }

      // Evento futuro - calcula diferença
      setStatusEvento("aguardando");
      const diferenca = eventoInicio.getTime() - agora.getTime();
      setTempoRestante({
        dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diferenca % (1000 * 60)) / 1000)
      });
    };

    calcularTempo();
    const intervalo = setInterval(calcularTempo, 1000);
    return () => clearInterval(intervalo);
  }, [proximoEvento]);

  const marcarComoLida = async (id: string) => {
    await fetch("/api/notificacoes/ler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    fetchNotificacoes(pagination.page, filtroNotificacoes);
    fetchStatsAndEvents();
  };

  const marcarTodasComoLidas = async () => {
    await fetch("/api/notificacoes/ler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marcarTodas: true })
    });
    fetchNotificacoes(pagination.page, filtroNotificacoes);
    fetchStatsAndEvents();
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatarHorario = (data: string) => {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const progressoPercentual = stats?.progresso || 0;
  const raio = 45;
  const circunferencia = 2 * Math.PI * raio;
  const dashOffset = circunferencia * (1 - progressoPercentual / 100);

  const eventosFuturos = todosEventos.filter(e => e._id !== proximoEvento?._id);
  
  const notificacoesNaoLidasCount = stats?.pendentes || 0;

  const getNotificacaoIcon = (tipo: string) => {
    switch(tipo) {
      case "solicitacao_troca": return "💌";
      case "troca_aceita": return "✅";
      case "troca_recusada": return "❌";
      default: return "📢";
    }
  };

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brincadeira-viva border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Olá, #${stats?.user.yupId || ""}`}
      badge={
        notificacoesNaoLidasCount > 0 ? (
          <span className="ml-2 rounded-full bg-brincadeira-viva text-white text-xs px-2 py-0.5 animate-pulse">
            {notificacoesNaoLidasCount}
          </span>
        ) : null
      }
    >
      <div className="max-w-5xl mx-auto space-y-5">
        <BannerLoja />

        {/* Próximo Evento */}
        {proximoEvento && (
          <div className="bg-gradient-to-r from-brincadeira-viva/20 to-abraco-doce/20 rounded-xl p-5 border border-brincadeira-viva/30">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brincadeira-viva/30 flex items-center justify-center text-2xl animate-pulse">
                    🎪
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Próximo evento</p>
                    <p className="font-bold text-lg">{proximoEvento.titulo}</p>
                  </div>
                </div>
                <a href={proximoEvento.localUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brincadeira-viva hover:underline flex items-center gap-1 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-full">
                  <MapPin size={14} />
                  {proximoEvento.localNome}
                </a>
              </div>

              {statusEvento === "aguardando" && (
                <>
                  <div className="flex justify-center gap-6 py-3">
                    <div className="text-center bg-white/50 dark:bg-black/20 rounded-xl px-4 py-2 min-w-[70px]">
                      <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.dias}</div>
                      <div className="text-[10px] text-gray-500">dias</div>
                    </div>
                    <div className="text-center bg-white/50 dark:bg-black/20 rounded-xl px-4 py-2 min-w-[70px]">
                      <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.horas}</div>
                      <div className="text-[10px] text-gray-500">horas</div>
                    </div>
                    <div className="text-center bg-white/50 dark:bg-black/20 rounded-xl px-4 py-2 min-w-[70px]">
                      <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.minutos}</div>
                      <div className="text-[10px] text-gray-500">min</div>
                    </div>
                    <div className="text-center bg-white/50 dark:bg-black/20 rounded-xl px-4 py-2 min-w-[70px]">
                      <div className="text-3xl font-bold text-brincadeira-viva">{tempoRestante.segundos}</div>
                      <div className="text-[10px] text-gray-500">seg</div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatarData(proximoEvento.dataInicio)}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatarHorario(proximoEvento.dataInicio)}</span>
                  </div>
                </>
              )}

              {statusEvento === "acontecendo" && (
                <div className="text-center py-4 bg-green-100 dark:bg-green-900/30 rounded-xl animate-pulse">
                  <span className="text-green-600 font-semibold text-lg">🎉 EVENTO ACONTECENDO AGORA! 🎉</span>
                  <p className="text-sm text-green-500 mt-1">Corra para a loja realizar suas trocas!</p>
                </div>
              )}

              {statusEvento === "encerrado" && (
                <div className="text-center py-4 bg-gray-100 dark:bg-gray-800/30 rounded-xl">
                  <span className="text-gray-600 font-semibold">🏁 Evento encerrado 🏁</span>
                  <p className="text-sm text-gray-500 mt-1">Aguardem o próximo evento!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progresso do Álbum (mesmo código, não precisa mudar) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              Meu Álbum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-36 h-36 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={45} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r={45}
                    fill="none"
                    stroke="#EA70B0"
                    strokeWidth="10"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-brincadeira-viva">{stats?.progresso || 0}%</span>
                  <span className="text-[10px] text-gray-500">completo</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-brincadeira-viva">{stats?.possui || 0}</div>
                  <div className="text-xs text-gray-500">Tenho</div>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
                    <div className="h-full bg-brincadeira-viva rounded-full" style={{ width: `${(stats?.possui || 0) / (stats?.totalFigurinhas || 1) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-gray-400">{stats?.faltantes || 0}</div>
                  <div className="text-xs text-gray-500">Faltam</div>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
                    <div className="h-full bg-gray-400 rounded-full" style={{ width: `${(stats?.faltantes || 0) / (stats?.totalFigurinhas || 1) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-brincadeira-viva">{stats?.repetidas || 0}</div>
                  <div className="text-xs text-gray-500">Repetidas</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-500">
              Total: {stats?.totalFigurinhas || 0} figurinhas
            </div>
          </CardContent>
        </Card>

        {/* Todos os Próximos Eventos */}
        {eventosFuturos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} />
                Todos os próximos eventos
              </CardTitle>
              <div className="text-xs text-gray-500">Marque na agenda e não perca nenhum!</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventosFuturos.map((evento) => (
                  <div key={evento._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                    <div>
                      <p className="font-medium">{evento.titulo}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {formatarData(evento.dataInicio)}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatarHorario(evento.dataInicio)}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} /> {evento.localNome}</span>
                      </div>
                    </div>
                    <a href={evento.localUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brincadeira-viva hover:underline">
                      Ver mapa →
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notificações */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell size={18} />
                <CardTitle className="!mt-0">Atualizações</CardTitle>
                <Sparkle size={14} className="text-brincadeira-viva animate-pulse" />
                <span className="text-xs text-gray-500">({pagination.total} no total)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Funnel size={14} className="text-gray-500" />
                <select
                  value={filtroNotificacoes}
                  onChange={(e) => setFiltroNotificacoes(e.target.value as any)}
                  className="text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-800"
                >
                  <option value="todas">Todas</option>
                  <option value="naoLidas">Não lidas</option>
                  <option value="lidas">Lidas</option>
                </select>
                
                {pagination.total > 0 && (
                  <button
                    onClick={marcarTodasComoLidas}
                    className="text-xs text-gray-500 hover:text-brincadeira-viva transition-colors"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">Atualiza automaticamente a cada 30 segundos</div>
          </CardHeader>
          <CardContent>
            {loadingNotificacoes ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-brincadeira-viva border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
                <p className="text-xs">Quando houver atividades de troca, aparecerão aqui</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                        notif.lida 
                          ? "bg-gray-50 dark:bg-gray-800/30 opacity-60" 
                          : "bg-brincadeira-viva/15 border-l-4 border-l-brincadeira-viva shadow-sm"
                      }`}
                      onClick={() => !notif.lida && marcarComoLida(notif._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getNotificacaoIcon(notif.tipo)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{notif.titulo}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{notif.mensagem}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString()} às {new Date(notif.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {!notif.lida && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="w-2 h-2 rounded-full bg-brincadeira-viva animate-pulse" />
                            <span className="text-[9px] text-brincadeira-viva">nova</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 text-sm"
                    >
                      <CaretLeft size={14} />
                      Anterior
                    </button>
                    <span className="text-sm text-gray-500">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 text-sm"
                    >
                      Próxima
                      <CaretRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}