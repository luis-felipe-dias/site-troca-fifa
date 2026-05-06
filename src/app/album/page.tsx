"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { CheckCircle, Copy, Minus, Plus, CaretLeft, CaretRight, GridFour, X } from "@phosphor-icons/react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

type Sticker = {
  codigo: string;
  pagina: number;
  nomeSelecao: string;
  possui?: boolean;
  repetida?: boolean;
  quantidadeRepetida?: number;
};

type PaginaInfo = {
  id: number;
  selecao: string;
  bandeira: string;
  figurinhas: Sticker[];
  paginaInicial: number;
  paginaFinal: number;
  ordem: number;
};

const bandeiras: Record<string, string> = {
  "MEXICO": "🇲🇽",
  "SOUTH AFRICA": "🇿🇦",
  "KOREA REPUBLIC": "🇰🇷",
  "CZECHIA": "🇨🇿",
  "CANADA": "🇨🇦",
  "BOSNIA-HERZEGOVINA": "🇧🇦",
  "QATAR": "🇶🇦",
  "SWITZERLAND": "🇨🇭",
  "BRAZIL": "🇧🇷",
  "MAROCCO": "🇲🇦",
  "HAITI": "🇭🇹",
  "SCOTLAND": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA": "🇺🇸",
  "PARAGUAY": "🇵🇾",
  "AUSTRALIA": "🇦🇺",
  "TÜRKIYE": "🇹🇷",
  "GERMANY": "🇩🇪",
  "CURAÇAO": "🇨🇼",
  "CÔTE D'IVOIRE": "🇨🇮",
  "ECUADOR": "🇪🇨",
  "NETHERLANDS": "🇳🇱",
  "JAPAN": "🇯🇵",
  "SWEDEN": "🇸🇪",
  "BELGIUM": "🇧🇪",
  "EGYPT": "🇪🇬",
  "IRAN": "🇮🇷",
  "NEW ZEALAND": "🇳🇿",
  "SPAIN": "🇪🇸",
  "CABO VERDE": "🇨🇻",
  "SAUDI ARABIA": "🇸🇦",
  "URUGUAY": "🇺🇾",
  "FRANCE": "🇫🇷",
  "SENEGAL": "🇸🇳",
  "IRAQ": "🇮🇶",
  "NORWAY": "🇳🇴",
  "ARGENTINA": "🇦🇷",
  "ALGERIA": "🇩🇿",
  "AUSTRIA": "🇦🇹",
  "JORDAN": "🇯🇴",
  "PORTUGAL": "🇵🇹",
  "CONGO DR": "🇨🇩",
  "UZBEKISTAN": "🇺🇿",
  "COLOMBIA": "🇨🇴",
  "ENGLAND": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "CROATIA": "🇭🇷",
  "GHANA": "🇬🇭",
  "PANAMA": "🇵🇦",
  "FWC": "🏆",
  "COCA-COLA": "🥤"
};

function groupByPagePair(stickers: Sticker[]) {
  const groups = new Map<string, PaginaInfo>();
  let ordemContador = 0;
  
  const sortedStickers = [...stickers].sort((a, b) => a.pagina - b.pagina);
  
  for (let i = 0; i < sortedStickers.length; i++) {
    const sticker = sortedStickers[i];
    
    let groupKey = "";
    let pagInicial = sticker.pagina;
    let pagFinal = sticker.pagina;
    
    if (sticker.pagina === 0 || sticker.pagina === 1) {
      groupKey = "intro";
      pagInicial = 0;
      pagFinal = 1;
    } else if (sticker.pagina === 999) {
      groupKey = "coca";
      pagInicial = 999;
      pagFinal = 999;
    } else if (sticker.pagina >= 106 && sticker.pagina <= 109) {
      groupKey = "fwc-final";
      pagInicial = 106;
      pagFinal = 109;
    } else {
      const isEven = sticker.pagina % 2 === 0;
      if (isEven) {
        pagInicial = sticker.pagina;
        pagFinal = sticker.pagina + 1;
      } else {
        pagInicial = sticker.pagina - 1;
        pagFinal = sticker.pagina;
      }
      groupKey = `${pagInicial}-${pagFinal}`;
    }
    
    if (!groups.has(groupKey)) {
      const nomeSelecao = sticker.nomeSelecao;
      const bandeira = bandeiras[nomeSelecao.toUpperCase()] || bandeiras[nomeSelecao.split(" ")[0].toUpperCase()] || "🏷️";
      groups.set(groupKey, {
        id: groupKey === "intro" ? 0 : groupKey === "coca" ? 999 : pagInicial,
        selecao: nomeSelecao,
        bandeira: bandeira,
        figurinhas: [],
        paginaInicial: pagInicial,
        paginaFinal: pagFinal,
        ordem: ordemContador++
      });
    }
    
    groups.get(groupKey)!.figurinhas.push(sticker);
  }
  
  let resultado = Array.from(groups.values());
  
  resultado.sort((a, b) => {
    if (a.id === 0) return -1;
    if (b.id === 0) return 1;
    if (a.id === 999) return 1;
    if (b.id === 999) return -1;
    return a.id - b.id;
  });
  
  return resultado;
}

export default function AlbumPage() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [selected, setSelected] = useState<Sticker | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/album");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Erro");
        setStickers(json.stickers);
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar álbum");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const paginas = useMemo(() => groupByPagePair(stickers), [stickers]);
  const paginaAtualData = paginas[paginaAtual];

  const mudarPagina = (index: number) => {
    setPaginaAtual(index);
    setSidebarAberta(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 100);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && paginaAtual < paginas.length - 1) {
        mudarPagina(paginaAtual + 1);
      } else if (diff < 0 && paginaAtual > 0) {
        mudarPagina(paginaAtual - 1);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && paginaAtual > 0) {
        mudarPagina(paginaAtual - 1);
      } else if (e.key === "ArrowRight" && paginaAtual < paginas.length - 1) {
        mudarPagina(paginaAtual + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paginaAtual, paginas.length]);

  async function mark(codigo: string, possui: boolean, repetida: boolean, quantidadeRepetida?: number) {
    try {
      const res = await fetch("/api/album/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, possui, repetida, quantidadeRepetida })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      setStickers((prev) =>
        prev.map((s) =>
          s.codigo === codigo ? { ...s, possui, repetida, quantidadeRepetida: repetida ? Math.max(1, quantidadeRepetida || 1) : 0 } : s
        )
      );
      toast.success("Salvo");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar");
    }
  }

  async function marcarMultiplos(possui: boolean) {
    const codigos = Array.from(selecionados);
    for (const codigo of codigos) {
      await mark(codigo, possui, false, 0);
    }
    setSelecionados(new Set());
    setModoSelecao(false);
    toast.success(`${codigos.length} figurinhas marcadas como ${possui ? "tenho" : "não tenho"}`);
  }

  function toggleSelecionar(codigo: string) {
    const novos = new Set(selecionados);
    if (novos.has(codigo)) {
      novos.delete(codigo);
    } else {
      novos.add(codigo);
    }
    setSelecionados(novos);
  }

  function toggleSelecionarTodos() {
    if (!paginaAtualData) return;
    const todosCodigos = paginaAtualData.figurinhas.map(s => s.codigo);
    const todosSelecionados = todosCodigos.every(c => selecionados.has(c));
    
    if (todosSelecionados) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(todosCodigos));
    }
  }

  if (loading) {
    return (
      <AppShell title="Álbum">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brincadeira-viva border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Carregando figurinhas...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!paginaAtualData) {
    return (
      <AppShell title="Álbum">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma figurinha encontrada</p>
        </div>
      </AppShell>
    );
  }

  const figurinhas = paginaAtualData.figurinhas;
  const progressoPagina = figurinhas.filter(f => f.possui).length;
  const totalPagina = figurinhas.length;

  const Sidebar = () => (
    <div className="w-64 lg:w-72 h-full bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h2 className="font-semibold text-gray-800 dark:text-white">Seleções</h2>
          <button onClick={() => setSidebarAberta(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="space-y-1">
          {paginas.map((pag, idx) => {
            const progresso = pag.figurinhas.filter(f => f.possui).length;
            const total = pag.figurinhas.length;
            const percentual = Math.round((progresso / total) * 100);
            const numeroExibido = pag.id === 0 ? "0-1" : pag.id === 999 ? "Coca-Cola" : `Pág ${pag.id}`;
            
            return (
              <button
                key={pag.id}
                onClick={() => mudarPagina(idx)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  idx === paginaAtual
                    ? "bg-brincadeira-viva text-white shadow-md"
                    : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="text-2xl">{pag.bandeira}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{pag.selecao}</div>
                  <div className="text-xs opacity-70">{numeroExibido}</div>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-brincadeira-viva rounded-full" style={{ width: `${percentual}%` }} />
                  </div>
                </div>
                <div className="text-xs font-semibold">{progresso}/{total}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <AppShell title="Álbum">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Overlay mobile */}
        {sidebarAberta && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarAberta(false)}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar />
            </div>
          </>
        )}

        {/* Conteúdo principal */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-w-0 bg-gray-50 dark:bg-[#0d0d1a]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="max-w-7xl mx-auto">
            {/* Header mobile */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 lg:border-none">
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSidebarAberta(true)}
                    className="lg:hidden w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                  >
                    <GridFour size={18} weight="bold" className="text-brincadeira-viva" />
                  </button>
                  
                  <div className="text-center flex-1 min-w-0 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg">{paginaAtualData.bandeira}</span>
                      <h1 className="text-sm font-semibold tracking-tight text-gray-800 dark:text-white truncate">
                        {paginaAtualData.selecao}
                      </h1>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Pág {paginaAtualData.paginaInicial}-{paginaAtualData.paginaFinal}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => mudarPagina(Math.max(0, paginaAtual - 1))}
                      disabled={paginaAtual === 0}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 disabled:opacity-30 flex items-center justify-center"
                    >
                      <CaretLeft size={16} weight="bold" className="text-brincadeira-viva" />
                    </button>
                    <button
                      onClick={() => mudarPagina(Math.min(paginas.length - 1, paginaAtual + 1))}
                      disabled={paginaAtual === paginas.length - 1}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 disabled:opacity-30 flex items-center justify-center"
                    >
                      <CaretRight size={16} weight="bold" className="text-brincadeira-viva" />
                    </button>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mt-2">
                  <div className="flex justify-between text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">
                    <span>Progresso</span>
                    <span>{progressoPagina}/{totalPagina}</span>
                  </div>
                  <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brincadeira-viva rounded-full transition-all duration-500"
                      style={{ width: `${(progressoPagina / totalPagina) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Grade de figurinhas */}
            <div className="p-2">
              {/* Botão de seleção múltipla */}
              {!modoSelecao ? (
                <button
                  onClick={() => setModoSelecao(true)}
                  className="w-full mb-2 py-2 rounded-lg bg-brincadeira-viva/10 text-brincadeira-viva font-medium text-xs active:scale-[0.98] transition-transform"
                >
                  ✨ Selecionar várias
                </button>
              ) : (
                <div className="flex gap-1.5 mb-2">
                  <button
                    onClick={() => {
                      setModoSelecao(false);
                      setSelecionados(new Set());
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={toggleSelecionarTodos}
                    className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium"
                  >
                    {selecionados.size === figurinhas.length ? "Desmarcar" : "Todos"}
                  </button>
                  <button
                    onClick={() => marcarMultiplos(true)}
                    disabled={selecionados.size === 0}
                    className="flex-1 py-1.5 rounded-lg bg-brincadeira-viva text-white text-xs font-medium disabled:opacity-50"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => marcarMultiplos(false)}
                    disabled={selecionados.size === 0}
                    className="flex-1 py-1.5 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium disabled:opacity-50"
                  >
                    ✗
                  </button>
                </div>
              )}

              {/* Grid móvel 2 colunas */}
              <div className="grid grid-cols-2 gap-2">
                {figurinhas.map((s) => (
                  <button
                    key={s.codigo}
                    onClick={() => {
                      if (modoSelecao) {
                        toggleSelecionar(s.codigo);
                      } else {
                        setSelected(s);
                        setQty(s.quantidadeRepetida || (s.repetida ? 1 : 0));
                      }
                    }}
                    className={`
                      relative bg-white dark:bg-[#1a1a2e] rounded-xl p-2 text-left
                      transition-all active:scale-[0.97] shadow-sm
                      ${modoSelecao && selecionados.has(s.codigo) 
                        ? "ring-2 ring-brincadeira-viva bg-brincadeira-viva/5" 
                        : ""
                      }
                      ${s.possui && !modoSelecao 
                        ? "bg-brincadeira-viva/10 border-l-4 border-l-brincadeira-viva" 
                        : "border border-gray-100 dark:border-gray-800"
                      }
                    `}
                  >
                    {modoSelecao && (
                      <div className="absolute top-1 right-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selecionados.has(s.codigo) 
                            ? "bg-brincadeira-viva border-brincadeira-viva" 
                            : "border-gray-400 bg-white dark:bg-gray-800"
                        }`}>
                          {selecionados.has(s.codigo) && <CheckCircle size={8} weight="bold" className="text-white" />}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-gray-800 dark:text-white">{s.codigo}</div>
                      {s.possui && !modoSelecao && (
                        <CheckCircle size={12} weight="duotone" className="text-brincadeira-viva shrink-0" />
                      )}
                    </div>
                    
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {s.nomeSelecao}
                    </div>
                    
                    {s.repetida && !modoSelecao && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brincadeira-viva/20 text-[8px] font-semibold text-brincadeira-viva">
                          <Copy size={7} />
                          {s.quantidadeRepetida || 1}x
                        </span>
                      </div>
                    )}
                    
                    {!s.possui && !modoSelecao && (
                      <div className="mt-1 text-[8px] text-gray-400 dark:text-gray-600">❌ Falta</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dica de swipe */}
            <div className="text-center py-3 lg:hidden">
              <p className="text-[9px] text-gray-400 dark:text-gray-600">
                ← → Deslize
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">{selected.nomeSelecao}</div>
              <div className="text-xl font-bold tracking-tight text-gray-800 dark:text-white mt-0.5">{selected.codigo}</div>
            </div>

            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                  selected.possui && !selected.repetida
                    ? "bg-brincadeira-viva text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => {
                  mark(selected.codigo, true, false, 0);
                  setSelected((s) => (s ? { ...s, possui: true, repetida: false, quantidadeRepetida: 0 } : s));
                }}
              >
                ✓ Tenho
              </button>
              <button
                className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition-all ${
                  selected.possui && selected.repetida
                    ? "bg-brincadeira-viva text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => {
                  const q = Math.max(1, qty || 1);
                  setQty(q);
                  mark(selected.codigo, true, true, q);
                  setSelected((s) => (s ? { ...s, possui: true, repetida: true, quantidadeRepetida: q } : s));
                }}
              >
                <Copy size={12} />
                Repetida
              </button>
            </div>

            {selected.possui && selected.repetida && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quantidade</p>
                <div className="flex items-center justify-between">
                  <button
                    className="w-8 h-8 rounded-lg bg-white dark:bg-[#0d0d1a] text-gray-700 dark:text-gray-300 flex items-center justify-center active:scale-95"
                    onClick={() => setQty((q) => Math.max(1, (q || 1) - 1))}
                  >
                    <Minus size={14} weight="bold" />
                  </button>
                  <div className="text-xl font-semibold tabular-nums text-gray-800 dark:text-white">{Math.max(1, qty || 1)}</div>
                  <button
                    className="w-8 h-8 rounded-lg bg-white dark:bg-[#0d0d1a] text-gray-700 dark:text-gray-300 flex items-center justify-center active:scale-95"
                    onClick={() => setQty((q) => Math.min(99, (q || 1) + 1))}
                  >
                    <Plus size={14} weight="bold" />
                  </button>
                </div>
                <button
                  className="w-full mt-2 py-2 rounded-lg bg-brincadeira-viva text-white font-medium text-sm"
                  onClick={() => {
                    const q = Math.max(1, qty || 1);
                    mark(selected.codigo, true, true, q);
                    setSelected((s) => (s ? { ...s, quantidadeRepetida: q } : s));
                    toast.success("Quantidade salva");
                  }}
                >
                  Salvar
                </button>
              </div>
            )}

            <button
              className="w-full py-2 rounded-lg bg-red-500/10 text-red-500 font-medium text-sm"
              onClick={() => {
                mark(selected.codigo, false, false, 0);
                setSelected((s) => (s ? { ...s, possui: false, repetida: false, quantidadeRepetida: 0 } : s));
              }}
            >
              ✗ Não tenho
            </button>
          </div>
        ) : null}
      </Sheet>
    </AppShell>
  );
}