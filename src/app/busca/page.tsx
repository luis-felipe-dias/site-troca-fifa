"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Result = { yupId: string; cidade: string; codigo: string; pagina: number; nomeSelecao: string };

export default function BuscaPage() {
  const [codigo, setCodigo] = useState("");
  const [pagina, setPagina] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const canSearch = useMemo(() => codigo.trim().length >= 2 || pagina.trim().length > 0, [codigo, pagina]);

  async function search() {
    if (!canSearch) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (codigo.trim()) qs.set("codigo", codigo.trim().toUpperCase());
      if (pagina.trim()) qs.set("pagina", pagina.trim());
      const res = await fetch(`/api/busca?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      setResults(json.results);
    } catch (e: any) {
      toast.error(e?.message || "Erro na busca");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Busca">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Encontrar usuários com repetida</CardTitle>
          <div className="text-sm text-yup-primary/70">Filtre por página e/ou código.</div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Código" placeholder="Ex: BRA1" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            <Input label="Página" placeholder="Ex: 24" value={pagina} onChange={(e) => setPagina(e.target.value)} />
          </div>
          <Button onClick={search} disabled={!canSearch || loading} className="w-full sm:w-auto">
            <MagnifyingGlass size={18} weight="duotone" />
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {results.map((r, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold">{r.yupId}</span> <span className="text-yup-primary/60">({r.cidade})</span>
              </div>
              <div className="text-sm text-yup-primary/70">
                {r.codigo} • pág. {r.pagina} • {r.nomeSelecao}
              </div>
            </div>
          </Card>
        ))}
        {!results.length ? <div className="text-sm text-yup-primary/60">Sem resultados ainda.</div> : null}
      </div>
    </AppShell>
  );
}

