"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type User = {
  id: string;
  yupId: string;
  email: string;
  cidade: string;
  role: "user" | "admin";
  senhaTemporaria: boolean;
  createdAt: string;
};

export default function AdminClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [senhaTemp, setSenhaTemp] = useState("");
  const [userId, setUserId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      setUsers(json.usuarios);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar admin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function seed() {
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      toast.success(`Seed OK: +${json.inserted} (matched ${json.matched})`);
    } catch (e: any) {
      toast.error(e?.message || "Erro no seed");
    }
  }

  async function reset() {
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, senhaTemporaria: senhaTemp })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro");
      toast.success("Senha temporária definida");
      setSenhaTemp("");
      setUserId("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao resetar");
    }
  }

  return (
    <AppShell title="Admin">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Seed do álbum</CardTitle>
            <div className="text-sm text-yup-primary/70">Insere as figurinhas na collection `figurinhas` (upsert).</div>
          </CardHeader>
          <CardContent>
            <Button onClick={seed}>Rodar seed</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset de senha</CardTitle>
            <div className="text-sm text-yup-primary/70">Admin define senha temporária (força troca no primeiro login).</div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input label="User ID (Mongo _id)" value={userId} onChange={(e) => setUserId(e.target.value)} />
            <Input label="Senha temporária" type="password" value={senhaTemp} onChange={(e) => setSenhaTemp(e.target.value)} />
            <Button onClick={reset} disabled={!userId || senhaTemp.length < 6}>
              Resetar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <div className="text-sm text-yup-primary/70">Lista (não mostra nome completo).</div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-yup-primary/60">Carregando...</div>
            ) : (
              <div className="grid gap-2">
                {users.map((u) => (
                  <div key={u.id} className="rounded-xl bg-white/60 border border-yup-primary/10 p-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div className="font-semibold">{u.yupId}</div>
                      <div className="text-yup-primary/60">{u.email}</div>
                    </div>
                    <div className="text-xs text-yup-primary/60">
                      {u.cidade} • role: {u.role} • senha temporária: {String(u.senhaTemporaria)} • id: {u.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

