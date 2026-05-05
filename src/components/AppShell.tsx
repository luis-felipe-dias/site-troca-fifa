"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { House, BookOpen, ArrowsClockwise, MagnifyingGlass, Shield, SignOut } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/album", label: "Álbum", icon: BookOpen },
  { href: "/matches", label: "Matches", icon: ArrowsClockwise },
  { href: "/busca", label: "Busca", icon: MagnifyingGlass },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function AppShell({
  children,
  title,
  badge
}: {
  children: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
}) {
  const [me, setMe] = useState<{ role: "user" | "admin"; yupId: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (!res.ok) return;
        setMe({ role: json.usuario.role, yupId: json.usuario.yupId });
      } catch {
        // ignore
      }
    })();
  }, []);

  const items = useMemo(() => {
    if (me?.role === "admin") return nav;
    return nav.filter((i) => i.href !== "/admin");
  }, [me]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Saiu");
      window.location.href = "/login";
    } catch {
      toast.error("Erro ao sair");
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
          <aside className="md:sticky md:top-6 h-fit">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-yup-primary/60">Yup</div>
                  <div className="text-lg font-semibold tracking-tight">Trocas</div>
                </div>
                <div className="h-8 w-8 rounded-xl bg-yup-pinkSoft/60 border border-yup-primary/10" />
              </div>
              <nav className="mt-4 grid gap-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-yup-primary/80 hover:bg-black/5 transition"
                    >
                      <Icon size={18} weight="duotone" />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/matches" ? badge : null}
                    </Link>
                  );
                })}
              </nav>
              <button
                type="button"
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm bg-white/60 hover:bg-white/80 border border-yup-primary/10 transition"
              >
                <SignOut size={18} weight="duotone" />
                Sair
              </button>
            </Card>
          </aside>

          <main>
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

