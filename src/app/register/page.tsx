"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeCompleto: "",
    cpf: "",
    email: "",
    dataNascimento: "",
    cidade: "",
    senha: ""
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro ao registrar");
      toast.success(`Conta criada! Seu ID: ${json.usuario.yupId}`);
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} weight="duotone" />
            Cadastro
          </CardTitle>
          <div className="text-sm text-yup-primary/70">Seu nome não será exibido; só o seu Yup ID.</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
            <Input label="Nome completo" value={form.nomeCompleto} onChange={(e) => set("nomeCompleto", e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="CPF" value={form.cpf} onChange={(e) => set("cpf", e.target.value)} required />
              <Input
                label="Data de nascimento"
                hint="dd/mm/aaaa"
                placeholder="Ex: 31/12/2000"
                value={form.dataNascimento}
                onChange={(e) => set("dataNascimento", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              <Input label="Cidade" value={form.cidade} onChange={(e) => set("cidade", e.target.value)} required />
            </div>
            <Input label="Senha" type="password" value={form.senha} onChange={(e) => set("senha", e.target.value)} required />
            <Button disabled={loading} className="w-full">
              {loading ? "Criando..." : "Criar conta"}
            </Button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full text-sm text-yup-primary/70 hover:text-yup-primary underline underline-offset-4"
            >
              Voltar para login
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

