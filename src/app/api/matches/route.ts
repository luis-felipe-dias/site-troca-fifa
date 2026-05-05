import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Troca } from "@/models/Troca";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const minhasRepetidas = await UsuarioFigurinha.find({ userId: payload.sub, repetida: true }).select("codigo").lean();
    const minhasFaltantes = await UsuarioFigurinha.find({ userId: payload.sub, possui: false }).select("codigo").lean();

    const repetidasSet = new Set(minhasRepetidas.map((r) => r.codigo));
    const faltantesSet = new Set(minhasFaltantes.map((f) => f.codigo));

    const allMineMarks = await UsuarioFigurinha.find({ userId: payload.sub }).select("codigo possui repetida").lean();
    const faltantes =
      allMineMarks.length > 0
        ? allMineMarks.filter((m) => !m.possui).map((m) => m.codigo)
        : [];
    const repetidas = allMineMarks.filter((m) => m.repetida).map((m) => m.codigo);

    const othersHaveWhatINeed = faltantes.length
      ? await UsuarioFigurinha.find({ codigo: { $in: faltantes }, repetida: true, userId: { $ne: payload.sub } })
          .select("userId codigo")
          .lean()
      : [];

    const suggestions: { userId: string; yupId: string; cidade: string; give: string; want: string }[] = [];
    const cacheOtherMarks = new Map<string, { repetidas: Set<string>; faltantes: Set<string> }>();

    for (const cand of othersHaveWhatINeed) {
      const otherId = String(cand.userId);
      if (!cacheOtherMarks.has(otherId)) {
        const marks = await UsuarioFigurinha.find({ userId: otherId }).select("codigo possui repetida").lean();
        cacheOtherMarks.set(otherId, {
          repetidas: new Set(marks.filter((m) => m.repetida).map((m) => m.codigo)),
          faltantes: new Set(marks.filter((m) => !m.possui).map((m) => m.codigo))
        });
      }
      const other = cacheOtherMarks.get(otherId)!;

      const want = cand.codigo;
      const possibleGive = repetidas.find((r) => other.faltantes.has(r));
      if (!possibleGive) continue;

      // dedupe
      if (suggestions.some((s) => s.userId === otherId && s.give === possibleGive && s.want === want)) continue;

      const u = await Usuario.findById(otherId).select("yupId cidade").lean();
      if (!u) continue;

      suggestions.push({ userId: otherId, yupId: u.yupId, cidade: u.cidade, give: possibleGive, want });
      if (suggestions.length >= 25) break;
    }

    const trocas = await Troca.find({ $or: [{ userA: payload.sub }, { userB: payload.sub }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const ids = Array.from(new Set(trocas.flatMap((t) => [String(t.userA), String(t.userB)])));
    const users = await Usuario.find({ _id: { $in: ids } }).select("yupId").lean();
    const uMap = new Map(users.map((u) => [String(u._id), u.yupId]));

    return jsonOk({
      suggestions,
      trocas: trocas.map((t) => ({
        id: String(t._id),
        from: uMap.get(String(t.userA)) || "—",
        to: uMap.get(String(t.userB)) || "—",
        figurinhaA: t.figurinhaA,
        figurinhaB: t.figurinhaB,
        status: t.status
      }))
    });
  } catch (err: any) {
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro", 500);
  }
}

const CreateSchema = z.object({
  userB: z.string().min(10),
  figurinhaA: z.string().min(2),
  figurinhaB: z.string().min(2)
});

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const data = CreateSchema.parse(body);
    await connectMongo();

    const troca = await Troca.create({
      userA: payload.sub,
      userB: data.userB,
      figurinhaA: data.figurinhaA,
      figurinhaB: data.figurinhaB,
      status: "pendente"
    });

    return jsonOk({ troca: { id: String(troca._id) } }, { status: 201 });
  } catch (err: any) {
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro", 500);
  }
}

