"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Suggestion = { userId: string; yupId: string; cidade: string; give: string; want: string };
type Troca = { id: string; from: string; to: string; figurinhaA: string; figurinhaB: string; status: string };

export default function MatchesPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/matches");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      setSuggestions(json.suggestions);
      setTrocas(json.trocas);
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
      toast.success("Troca enviada!");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar troca");
    }
  }

  async function decidir(id: string, status: "aceito" | "recusado") {
    try {
      const res = await fetch("/api/matches/decidir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      toast.success("Atualizado");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro");
    }
  }

  return (
    <AppShell title="Matches">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sugestões</CardTitle>
          <div className="text-sm text-yup-primary/70">Trocas possíveis (sistema gera quando ambos têm o que o outro precisa).</div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-yup-primary/60">Carregando...</div>
          ) : suggestions.length ? (
            <div className="grid gap-3">
              {suggestions.map((s, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-semibold">{s.yupId}</div>
                      <div className="text-yup-primary/60">{s.cidade}</div>
                    </div>
                    <div className="text-sm text-yup-primary/80">
                      Você dá <span className="font-semibold">{s.give}</span> e recebe{" "}
                      <span className="font-semibold">{s.want}</span>
                    </div>
                    <Button onClick={() => criarTroca(s)} className="whitespace-nowrap">
                      Trocar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-sm text-yup-primary/60">Sem sugestões no momento. Marque repetidas e faltantes no Álbum.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trocas</CardTitle>
          <div className="text-sm text-yup-primary/70">Pendentes, aceitas e recusadas.</div>
        </CardHeader>
        <CardContent>
          {!trocas.length ? (
            <div className="text-sm text-yup-primary/60">Nenhuma troca ainda.</div>
          ) : (
            <div className="grid gap-3">
              {trocas.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-yup-primary/70">
                      {t.from} → {t.to}
                    </div>
                    <div className="text-sm">
                      {t.figurinhaA} ↔ {t.figurinhaB}
                    </div>
                    <div className="text-sm">
                      <span className="rounded-full px-2 py-0.5 bg-white/60 border border-yup-primary/10">{t.status}</span>
                    </div>
                    {t.status === "pendente" ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => decidir(t.id, "aceito")}>
                          Aceitar
                        </Button>
                        <Button variant="ghost" onClick={() => decidir(t.id, "recusado")}>
                          Recusar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

