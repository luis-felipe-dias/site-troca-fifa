import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Troca } from "@/models/Troca";
import { EventoTroca } from "@/models/EventoTroca";
import { Usuario } from "@/models/Usuario";
import { Notificacao } from "@/models/Notificacao";
import { jsonError, jsonOk } from "@/lib/http";

const Schema = z.object({
  id: z.string().min(10),
  status: z.enum(["aceito", "recusado"])
});

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const data = Schema.parse(body);

    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id yupId").lean();
    if (!usuario) {
      return jsonError("Usuário não encontrado", 404);
    }
    const userId = usuario._id;

    const troca = await Troca.findById(data.id);
    if (!troca) return jsonError("Troca não encontrada", 404);

    // Verificar permissão (apenas quem RECEBE a solicitação pode decidir)
    if (String(troca.userB) !== String(userId)) {
      return jsonError("Sem permissão", 403);
    }
    
    if (troca.status !== "pendente") {
      return jsonError("Troca já foi decidida", 409);
    }

    // Buscar o usuário A para notificação
    const userA = await Usuario.findById(troca.userA).select("yupId").lean();

    if (data.status === "aceito") {
      // ============================================
      // RESERVAR as figurinhas (impedir novas trocas)
      // ============================================
      
      // Verificar se as figurinhas ainda estão disponíveis (não reservadas por outra troca)
      const trocasConflitantesA = await Troca.findOne({
        _id: { $ne: troca._id },
        userA: troca.userA,
        figurinhaA: troca.figurinhaA,
        status: { $in: ["aceito", "pendente"] },
        $or: [{ reservadaA: true }, { status: "aceito" }]
      });
      
      const trocasConflitantesB = await Troca.findOne({
        _id: { $ne: troca._id },
        userB: troca.userB,
        figurinhaB: troca.figurinhaB,
        status: { $in: ["aceito", "pendente"] },
        $or: [{ reservadaB: true }, { status: "aceito" }]
      });

      if (trocasConflitantesA || trocasConflitantesB) {
        return jsonError("Uma das figurinhas já está reservada em outra troca", 409);
      }

      // Reservar as figurinhas
      troca.reservadaA = true;
      troca.reservadaB = true;
      
      const agora = new Date();
      const proximoEvento = await EventoTroca.findOne({
        ativo: true,
        dataFim: { $gte: agora }
      }).sort({ dataInicio: 1 }).lean();

      if (proximoEvento) {
        troca.eventoId = proximoEvento._id;
        troca.dataTroca = proximoEvento.dataInicio.toISOString();
        troca.localTroca = proximoEvento.localNome;
      }
      
      // Notificação para quem solicitou (userA)
      await Notificacao.create({
        userId: troca.userA,
        tipo: "troca_aceita",
        titulo: "Sua troca foi aceita! 🎉",
        mensagem: `${usuario.yupId} aceitou trocar ${troca.figurinhaB} por ${troca.figurinhaA}. Clique em "Finalizar troca" após o encontro.`,
        dados: {
          trocaId: String(troca._id),
          usuarioYupId: usuario.yupId,
          figurinhaA: troca.figurinhaA,
          figurinhaB: troca.figurinhaB
        },
        lida: false
      });
    } else {
      // Notificação para quem solicitou (userA) - troca recusada
      await Notificacao.create({
        userId: troca.userA,
        tipo: "troca_recusada",
        titulo: "Troca recusada",
        mensagem: `${usuario.yupId} recusou trocar ${troca.figurinhaB} por ${troca.figurinhaA}`,
        dados: {
          trocaId: String(troca._id),
          usuarioYupId: usuario.yupId,
          figurinhaA: troca.figurinhaA,
          figurinhaB: troca.figurinhaB
        },
        lida: false
      });
    }

    troca.status = data.status;
    await troca.save();

    let eventoData = null;
    if (troca.eventoId) {
      const evento = await EventoTroca.findById(troca.eventoId).lean();
      if (evento) {
        eventoData = {
          titulo: evento.titulo,
          localNome: evento.localNome,
          localUrl: evento.localUrl,
          dataInicio: evento.dataInicio,
          dataFim: evento.dataFim
        };
      }
    }

    return jsonOk({ 
      message: data.status === "aceito" ? "Troca aceita! Figurinhas reservadas." : "Troca recusada",
      eventoVinculado: !!troca.eventoId,
      evento: eventoData
    });
  } catch (err: any) {
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    console.error("Erro no decidir:", err);
    return jsonError("Erro interno", 500);
  }
}