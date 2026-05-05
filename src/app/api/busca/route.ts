import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Figurinha } from "@/models/Figurinha";
import { Usuario } from "@/models/Usuario";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const url = new URL(req.url);
    const codigo = url.searchParams.get("codigo")?.trim().toUpperCase();
    const pagina = url.searchParams.get("pagina")?.trim();

    let codigos: string[] = [];
    if (codigo) {
      codigos = [codigo];
    } else if (pagina) {
      const pageNum = Number(pagina);
      if (!Number.isFinite(pageNum)) return jsonError("Página inválida", 400);
      const figs = await Figurinha.find({ pagina: pageNum }).select("codigo").lean();
      codigos = figs.map((f) => f.codigo);
    } else {
      return jsonOk({ results: [] });
    }

    const repetidas = await UsuarioFigurinha.find({
      codigo: { $in: codigos },
      repetida: true,
      userId: { $ne: payload.sub }
    })
      .select("userId codigo")
      .lean();

    const userIds = Array.from(new Set(repetidas.map((r) => String(r.userId))));
    const usuarios = await Usuario.find({ _id: { $in: userIds } }).select("yupId cidade").lean();
    const uMap = new Map(usuarios.map((u) => [String(u._id), u]));

    const figs = await Figurinha.find({ codigo: { $in: codigos } }).select("codigo pagina nomeSelecao").lean();
    const fMap = new Map(figs.map((f) => [f.codigo, f]));

    const results = repetidas
      .map((r) => {
        const u = uMap.get(String(r.userId));
        const f = fMap.get(r.codigo);
        if (!u || !f) return null;
        return { yupId: u.yupId, cidade: u.cidade, codigo: f.codigo, pagina: f.pagina, nomeSelecao: f.nomeSelecao };
      })
      .filter(Boolean);

    return jsonOk({ results });
  } catch (err: any) {
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro", 500);
  }
}

