import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Figurinha } from "@/models/Figurinha";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const figurinhas = await Figurinha.find().sort({ pagina: 1, codigo: 1 }).lean();
    const marks = await UsuarioFigurinha.find({ userId: payload.sub }).lean();
    const map = new Map(marks.map((m) => [m.codigo, m]));

    const stickers = figurinhas.map((f) => {
      const m = map.get(f.codigo);
      return {
        codigo: f.codigo,
        pagina: f.pagina,
        nomeSelecao: f.nomeSelecao,
        possui: !!m?.possui,
        repetida: !!m?.repetida
        ,
        quantidadeRepetida: m?.quantidadeRepetida || 0
      };
    });

    return jsonOk({ stickers });
  } catch (err: any) {
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro", 500);
  }
}

