"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LockKey, SignIn } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erro ao logar");
      toast.success("Bem-vindo!");
      router.push(search.get("redirect") || "/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKey size={20} weight="duotone" />
            Login
          </CardTitle>
          <div className="text-sm text-yup-primary/70">Entre com email e senha.</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <Input label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} type="password" required />
            <Button disabled={loading} className="w-full">
              <SignIn size={18} weight="bold" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="w-full text-sm text-yup-primary/70 hover:text-yup-primary underline underline-offset-4"
            >
              Criar conta
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

