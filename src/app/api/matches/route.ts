import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Troca } from "@/models/Troca";
import { EventoTroca } from "@/models/EventoTroca";
import { Notificacao } from "@/models/Notificacao";
import { jsonError, jsonOk } from "@/lib/http";
import mongoose from "mongoose";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return jsonError("Usuário não encontrado", 404);
    }
    const userId = usuario._id;

    const allMineMarks = await UsuarioFigurinha.find({ userId: userId }).select("codigo possui repetida").lean();
    const repetidas = allMineMarks.filter((m) => m.repetida).map((m) => m.codigo);
    const faltantes = allMineMarks.filter((m) => !m.possui).map((m) => m.codigo);

    const othersHaveWhatINeed = faltantes.length
      ? await UsuarioFigurinha.find({ 
          codigo: { $in: faltantes }, 
          repetida: true, 
          userId: { $ne: userId } 
        }).select("userId codigo").lean()
      : [];

    const suggestions: { userId: string; yupId: string; cidade: string; give: string; want: string; avatar: string }[] = [];
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

      if (suggestions.some((s) => s.userId === otherId && s.give === possibleGive && s.want === want)) continue;

      const u = await Usuario.findById(otherId).select("yupId cidade").lean();
      if (!u) continue;

      const avatarIndex = otherId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const avatares = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐸", "🐙", "🦄"];
      const avatar = avatares[avatarIndex % avatares.length];

      suggestions.push({ 
        userId: otherId, 
        yupId: u.yupId, 
        cidade: u.cidade, 
        give: possibleGive, 
        want,
        avatar
      });
      if (suggestions.length >= 25) break;
    }

    const trocas = await Troca.find({ 
      $or: [{ userA: userId }, { userB: userId }] 
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const ids = Array.from(new Set(trocas.flatMap((t) => [String(t.userA), String(t.userB)])));
    const users = await Usuario.find({ _id: { $in: ids } }).select("yupId").lean();
    const uMap = new Map(users.map((u) => [String(u._id), u.yupId]));

    const eventoIds = trocas.filter(t => t.eventoId).map(t => t.eventoId);
    const eventos = await EventoTroca.find({ _id: { $in: eventoIds } }).lean();
    const eventoMap = new Map(eventos.map(e => [String(e._id), e]));

    return jsonOk({
      suggestions,
      trocas: trocas.map((t) => {
        const isUserA = String(t.userA) === String(userId);
        const evento = t.eventoId ? eventoMap.get(String(t.eventoId)) : null;
        
        return {
          id: String(t._id),
          from: isUserA ? "Você" : (uMap.get(String(t.userA)) || "—"),
          to: isUserA ? (uMap.get(String(t.userB)) || "—") : "Você",
          figurinhaA: t.figurinhaA,
          figurinhaB: t.figurinhaB,
          status: t.status,
          evento: evento ? {
            titulo: evento.titulo,
            localNome: evento.localNome,
            localUrl: evento.localUrl,
            dataInicio: evento.dataInicio,
            dataFim: evento.dataFim
          } : null
        };
      })
    });
  } catch (err: any) {
    console.error("Erro no GET /matches:", err);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro interno", 500);
  }
}

const CreateSchema = z.object({
  userB: z.string().min(2),
  figurinhaA: z.string().min(1),
  figurinhaB: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    console.log("POST /matches body:", body);
    
    const data = CreateSchema.parse(body);
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id yupId").lean();
    if (!usuario) {
      return jsonError("Usuário não encontrado", 404);
    }
    const userId = usuario._id;

    let userBDestino = null;
    
    if (mongoose.Types.ObjectId.isValid(data.userB)) {
      userBDestino = await Usuario.findById(data.userB).select("_id yupId").lean();
    }
    
    if (!userBDestino) {
      userBDestino = await Usuario.findOne({ yupId: data.userB }).select("_id yupId").lean();
    }
    
    if (!userBDestino) {
      console.log("Usuário destino não encontrado:", data.userB);
      return jsonError("Usuário destino não encontrado", 404);
    }

    console.log("UserA:", userId, "UserB:", userBDestino._id);

    const trocaExistente = await Troca.findOne({
      $or: [
        { userA: userId, userB: userBDestino._id, figurinhaA: data.figurinhaA, figurinhaB: data.figurinhaB, status: "pendente" },
        { userA: userBDestino._id, userB: userId, figurinhaA: data.figurinhaB, figurinhaB: data.figurinhaA, status: "pendente" }
      ]
    });

    if (trocaExistente) {
      return jsonError("Já existe uma solicitação de troca pendente para estas figurinhas", 409);
    }

    const troca = await Troca.create({
      userA: userId,
      userB: userBDestino._id,
      figurinhaA: data.figurinhaA,
      figurinhaB: data.figurinhaB,
      status: "pendente"
    });

    console.log("Troca criada:", troca._id);

    // Criar notificação para o usuário destino
    await Notificacao.create({
      userId: userBDestino._id,
      tipo: "solicitacao_troca",
      titulo: "Nova solicitação de troca!",
      mensagem: `${usuario.yupId} quer trocar ${data.figurinhaA} por ${data.figurinhaB} com você`,
      dados: {
        trocaId: String(troca._id),
        usuarioYupId: usuario.yupId,
        figurinhaA: data.figurinhaA,
        figurinhaB: data.figurinhaB
      },
      lida: false
    });

    return jsonOk({ troca: { id: String(troca._id) } }, { status: 201 });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      console.log("ZodError:", err.issues);
      return jsonError("Dados inválidos", 400, err.issues);
    }
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    console.error("Erro no POST /matches:", err);
    return jsonError("Erro interno: " + err.message, 500);
  }
}