"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import MatchCard from "@/components/MatchCard";
import { X, Calendar, MapPin, Clock, Link as LinkIcon, CheckCircle } from "@phosphor-icons/react";

type Suggestion = {
  userId: string;
  yupId: string;
  cidade: string;
  give: string;
  want: string;
  avatar: string;
};

type TrocaEvento = {
  titulo: string;
  localNome: string;
  localUrl: string;
  dataInicio: string;
  dataFim: string;
};

type Troca = {
  id: string;
  from: string;
  to: string;
  figurinhaA: string;
  figurinhaB: string;
  status: string;
  evento: TrocaEvento | null;
};

export default function MatchesPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aceitandoId, setAceitandoId] = useState<string | null>(null);
  const [finalizandoId, setFinalizandoId] = useState<string | null>(null);
  const [eventoModal, setEventoModal] = useState<TrocaEvento | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/matches");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      setSuggestions(json.suggestions || []);
      setTrocas(json.trocas || []);
      setCurrentIndex(0);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar matches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function criarTroca(s: Suggestion) {
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userB: s.userId, figurinhaA: s.give, figurinhaB: s.want })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      toast.success("Solicitação de troca enviada!");

      setSuggestions(prev => prev.filter((_, i) => i !== currentIndex));
      setCurrentIndex(0);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar troca");
    }
  }

  function passarSugestao() {
    setSuggestions(prev => prev.filter((_, i) => i !== currentIndex));
    setCurrentIndex(0);
  }

  async function decidir(id: string, status: "aceito" | "recusado") {
    setAceitandoId(id);
    try {
      const res = await fetch("/api/matches/decidir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");

      if (status === "aceito") {
        toast.success("Troca aceita! Figurinhas reservadas.");
      } else {
        toast.success("Troca recusada");
      }
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro");
    } finally {
      setAceitandoId(null);
    }
  }

  async function finalizarTroca(id: string) {
    setFinalizandoId(id);
    try {
      const res = await fetch("/api/matches/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trocaId: id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");

      toast.success("Troca finalizada! Figurinhas transferidas.");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao finalizar troca");
    } finally {
      setFinalizandoId(null);
    }
  }

  const currentSuggestion = suggestions[currentIndex];

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

  const formatarDataCompleta = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <AppShell title="Matches">
      <div className="max-w-2xl mx-auto">
        {/* Seção de Sugestões */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💕</span>
              Sugestões para você
            </CardTitle>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Pessoas que têm o que você precisa e precisam do que você tem repetido
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-brincadeira-viva border-t-transparent rounded-full animate-spin" />
              </div>
            ) : suggestions.length > 0 ? (
              <>
                <MatchCard
                  suggestion={currentSuggestion}
                  onTrocar={() => criarTroca(currentSuggestion)}
                  onPassar={passarSugestao}
                />
                {suggestions.length > 1 && (
                  <div className="text-center mt-4 text-sm text-gray-400">
                    {currentIndex + 1} de {suggestions.length} sugestões
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-gray-600 dark:text-gray-400">Nenhuma sugestão no momento</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Marque suas figurinhas repetidas e faltantes no álbum
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Trocas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Minhas Trocas
            </CardTitle>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Solicitações enviadas e recebidas
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-brincadeira-viva border-t-transparent rounded-full animate-spin" />
              </div>
            ) : trocas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-600 dark:text-gray-400">Nenhuma troca ainda</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Envie solicitações para outros colecionadores
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trocas.map((t) => (
                  <div
                    key={t.id}
                    className={`bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border transition-all cursor-pointer ${
                      t.status === "aceito" ? "hover:shadow-lg hover:border-brincadeira-viva/50" : ""
                    } ${
                      t.status === "pendente" && t.to === "Você"
                        ? "border-yellow-300 dark:border-yellow-700 shadow-md"
                        : t.status === "finalizado"
                        ? "border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                    onClick={() => {
                      if (t.status === "aceito" && t.evento) {
                        setEventoModal(t.evento);
                      }
                    }}
                  >
                    {/* Cabeçalho com usuários */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {t.from}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {t.to}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.status === "pendente"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : t.status === "aceito"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : t.status === "finalizado"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {t.status === "pendente" && "⏳ Pendente"}
                        {t.status === "aceito" && "✅ Aceito (aguardando encontro)"}
                        {t.status === "finalizado" && "🏁 Finalizado"}
                        {t.status === "recusado" && "❌ Recusado"}
                      </span>
                    </div>

                    {/* Figurinhas da troca */}
                    <div className="flex items-center justify-center gap-4 my-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl mb-1">🎴</div>
                        <div className="font-bold text-brincadeira-viva">{t.figurinhaA}</div>
                        <div className="text-xs text-gray-500">{t.from === "Você" ? "Você dá" : "Você recebe"}</div>
                      </div>
                      <div className="text-xl text-gray-400">↔️</div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">✨</div>
                        <div className="font-bold text-brincadeira-viva">{t.figurinhaB}</div>
                        <div className="text-xs text-gray-500">{t.from === "Você" ? "Você recebe" : "Você dá"}</div>
                      </div>
                    </div>

                    {/* Evento info (se aceito) */}
                    {t.status === "aceito" && t.evento && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-brincadeira-viva flex items-center justify-center gap-1">
                          <Calendar size={12} />
                          {formatarData(t.evento.dataInicio)} • {formatarHorario(t.evento.dataInicio)}
                          <span className="text-gray-400 mx-1">—</span>
                          <MapPin size={12} />
                          {t.evento.localNome}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">Clique no card para ver detalhes</p>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-3 mt-4">
                      {/* Pendente e usuário é destinatário */}
                      {t.status === "pendente" && t.to === "Você" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              decidir(t.id, "aceito");
                            }}
                            disabled={aceitandoId === t.id}
                            className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50"
                          >
                            {aceitandoId === t.id ? "Processando..." : "✅ Aceitar"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              decidir(t.id, "recusado");
                            }}
                            disabled={aceitandoId === t.id}
                            className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors disabled:opacity-50"
                          >
                            ❌ Recusar
                          </button>
                        </>
                      )}

                      {/* Aceito - mostrar botão Finalizar para ambos */}
                      {t.status === "aceito" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            finalizarTroca(t.id);
                          }}
                          disabled={finalizandoId === t.id}
                          className="w-full py-2 rounded-lg bg-brincadeira-viva hover:bg-brincadeira-viva/80 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          {finalizandoId === t.id ? "Finalizando..." : "🏁 Finalizar Troca"}
                        </button>
                      )}

                      {/* Finalizado - mostrar mensagem */}
                      {t.status === "finalizado" && (
                        <div className="w-full text-center py-2 text-sm text-green-600 dark:text-green-400">
                          ✓ Troca concluída com sucesso
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes do Evento */}
      {eventoModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setEventoModal(null)}
        >
          <div
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-[#1a1a2e] border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎪</span>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Detalhes do Evento
                </h2>
              </div>
              <button
                onClick={() => setEventoModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-brincadeira-viva">
                  {eventoModal.titulo}
                </h3>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar size={22} className="text-brincadeira-viva flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data e Horário</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">
                      {formatarDataCompleta(eventoModal.dataInicio)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={22} className="text-brincadeira-viva flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Até</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">
                      {formatarDataCompleta(eventoModal.dataFim)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin size={22} className="text-brincadeira-viva flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Local</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white mb-2">
                      {eventoModal.localNome}
                    </p>
                    <a
                      href={eventoModal.localUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-brincadeira-viva hover:underline bg-brincadeira-viva/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <LinkIcon size={16} />
                      Abrir no Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                <p>📌 Apresente seu ID no local para realizar a troca</p>
                <p className="mt-1">🎴 Não esqueça de levar suas figurinhas repetidas!</p>
              </div>

              <button
                onClick={() => setEventoModal(null)}
                className="w-full py-3 rounded-xl bg-brincadeira-viva text-white font-semibold hover:bg-brincadeira-viva/80 transition-colors"
              >
                Entendi, obrigado!
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}