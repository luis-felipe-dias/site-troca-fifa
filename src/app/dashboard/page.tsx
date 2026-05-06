import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Figurinha } from "@/models/Figurinha";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Troca } from "@/models/Troca";
import { Usuario } from "@/models/Usuario";
import BannerLoja from "@/components/BannerLoja";

async function getStats() {
  const payload = await requireAuth();
  await connectMongo();

  const totalFigurinhas = await Figurinha.countDocuments();
  const possui = await UsuarioFigurinha.countDocuments({ userId: payload.sub, possui: true });
  const repetidas = await UsuarioFigurinha.countDocuments({ userId: payload.sub, repetida: true });
  const faltantes = Math.max(0, totalFigurinhas - possui);
  const progresso = totalFigurinhas ? Math.round((possui / totalFigurinhas) * 100) : 0;

  const pendentes = await Troca.countDocuments({ userB: payload.sub, status: "pendente" });
  
  const user = await Usuario.findOne({ yupId: payload.sub }).select("yupId cidade").lean();

  return { 
    totalFigurinhas, 
    possui, 
    repetidas, 
    faltantes, 
    progresso, 
    pendentes,
    user: {
      yupId: user?.yupId || payload.sub,
      cidade: user?.cidade || "Cidade não informada"
    }
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <AppShell
      title={`Olá, #${stats.user.yupId}`}
      badge={
        stats.pendentes ? (
          <span className="ml-2 rounded-full bg-brincadeira-viva text-white text-xs px-2 py-0.5">{stats.pendentes}</span>
        ) : null
      }
    >
      {/* Banner fixo 300x250 - centralizado */}
      <div className="flex justify-center my-4">
        <BannerLoja />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Progresso do álbum</CardTitle>
            <div className="text-sm text-yup-primary/70 dark:text-white/70">{stats.progresso}% completo</div>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-abraco-doce dark:bg-gray-700 overflow-hidden">
              <div className="h-full bg-brincadeira-viva" style={{ width: `${stats.progresso}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-white/60 dark:bg-noite-serena/60 border border-yup-primary/10 p-3">
                <div className="text-xs text-yup-primary/60">Tenho</div>
                <div className="text-lg font-semibold">{stats.possui}</div>
              </div>
              <div className="rounded-xl bg-white/60 dark:bg-noite-serena/60 border border-yup-primary/10 p-3">
                <div className="text-xs text-yup-primary/60">Faltantes</div>
                <div className="text-lg font-semibold">{stats.faltantes}</div>
              </div>
              <div className="rounded-xl bg-white/60 dark:bg-noite-serena/60 border border-yup-primary/10 p-3">
                <div className="text-xs text-yup-primary/60">Repetidas</div>
                <div className="text-lg font-semibold">{stats.repetidas}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Possíveis matchs</CardTitle>
            <div className="text-sm text-yup-primary/70">Baseado em repetidas x faltantes</div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yup-primary/80">
              Assim que você marcar suas figurinhas no Álbum, a aba Matches vai sugerir trocas com base na regra:
              <div className="mt-2 rounded-xl bg-white/60 dark:bg-noite-serena/60 border border-yup-primary/10 p-3">
                A precisa de X e B tem X repetida, e B precisa de Y e A tem Y repetida.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}