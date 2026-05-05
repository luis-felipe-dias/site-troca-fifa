"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Copy, Minus, Plus } from "@phosphor-icons/react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
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

function groupByPage(stickers: Sticker[]) {
  const map = new Map<number, Sticker[]>();
  stickers.forEach((s) => {
    const arr = map.get(s.pagina) || [];
    arr.push(s);
    map.set(s.pagina, arr);
  });
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

export default function AlbumPage() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(0);
  const [selected, setSelected] = useState<Sticker | null>(null);
  const [qty, setQty] = useState<number>(0);

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

  const pages = useMemo(() => groupByPage(stickers), [stickers]);
  const current = pages.find(([p]) => p === page)?.[1] || pages[0]?.[1] || [];
  const pageList = pages.map(([p]) => p);

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

  return (
    <AppShell title="Álbum">
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-yup-primary/70">Página</div>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="rounded-xl px-3 py-2 bg-white/70 border border-yup-primary/10 glass text-sm"
          >
            {pageList.map((p) => (
              <option key={p} value={p}>
                {p === 999 ? "Coca-Cola" : p}
              </option>
            ))}
          </select>
          <div className="ml-auto text-sm text-yup-primary/60">{loading ? "Carregando..." : `${current.length} figurinhas`}</div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {current.map((s) => (
          <button
            key={s.codigo}
            onClick={() => {
              setSelected(s);
              setQty(s.quantidadeRepetida || (s.repetida ? 1 : 0));
            }}
            className={[
              "glass rounded-2xl p-3 text-left transition hover:scale-[1.01] active:scale-[0.99]",
              s.possui ? "border-yup-green/40" : "border-yup-primary/10"
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{s.codigo}</div>
              {s.possui ? <CheckCircle size={18} weight="duotone" className="text-yup-green" /> : null}
            </div>
            <div className="mt-1 text-xs text-yup-primary/60">{s.nomeSelecao}</div>
            {s.repetida ? (
              <div className="mt-3 text-xs text-yup-primary/70">
                Repetidas: <span className="font-semibold">{s.quantidadeRepetida || 1}</span>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      <Sheet
        open={!!selected}
        onClose={() => {
          setSelected(null);
        }}
      >
        {selected ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-yup-primary/60">{selected.nomeSelecao}</div>
                <div className="text-xl font-semibold tracking-tight">{selected.codigo}</div>
              </div>
              {selected.possui ? <CheckCircle size={22} weight="duotone" className="text-yup-green" /> : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selected.possui && !selected.repetida ? "secondary" : "ghost"}
                className="w-full shadow-none"
                onClick={() => {
                  mark(selected.codigo, true, false, 0);
                  setSelected((s) => (s ? { ...s, possui: true, repetida: false, quantidadeRepetida: 0 } : s));
                }}
              >
                Tenho
              </Button>
              <Button
                variant={selected.possui && selected.repetida ? "secondary" : "ghost"}
                className="w-full shadow-none"
                onClick={() => {
                  const q = Math.max(1, qty || 1);
                  setQty(q);
                  mark(selected.codigo, true, true, q);
                  setSelected((s) => (s ? { ...s, possui: true, repetida: true, quantidadeRepetida: q } : s));
                }}
              >
                <Copy size={16} weight="duotone" />
                Repetida
              </Button>
            </div>

            {selected.possui && selected.repetida ? (
              <div className="glass rounded-2xl p-3">
                <div className="text-sm font-medium">Quantidade de repetidas</div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    className="h-11 w-11 rounded-2xl bg-white/60 border border-yup-primary/10 flex items-center justify-center"
                    onClick={() => setQty((q) => Math.max(1, (q || 1) - 1))}
                  >
                    <Minus size={18} weight="bold" />
                  </button>
                  <div className="text-2xl font-semibold tabular-nums">{Math.max(1, qty || 1)}</div>
                  <button
                    type="button"
                    className="h-11 w-11 rounded-2xl bg-white/60 border border-yup-primary/10 flex items-center justify-center"
                    onClick={() => setQty((q) => Math.min(99, (q || 1) + 1))}
                  >
                    <Plus size={18} weight="bold" />
                  </button>
                </div>
                <Button
                  className="w-full mt-3"
                  onClick={() => {
                    const q = Math.max(1, qty || 1);
                    mark(selected.codigo, true, true, q);
                    setSelected((s) => (s ? { ...s, quantidadeRepetida: q } : s));
                    toast.success("Quantidade salva");
                  }}
                >
                  Salvar quantidade
                </Button>
              </div>
            ) : null}

            <Button
              variant="ghost"
              className="w-full shadow-none"
              onClick={() => {
                mark(selected.codigo, false, false, 0);
                setSelected((s) => (s ? { ...s, possui: false, repetida: false, quantidadeRepetida: 0 } : s));
              }}
            >
              Não tenho
            </Button>
          </div>
        ) : null}
      </Sheet>
    </AppShell>
  );
}

