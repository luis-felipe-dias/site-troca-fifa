import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Troca } from "@/models/Troca";
import { EventoTroca } from "@/models/EventoTroca";
import { Usuario } from "@/models/Usuario";
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

    // Buscar o _id do usuário logado
    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return jsonError("Usuário não encontrado", 404);
    }
    const userId = usuario._id;

    const troca = await Troca.findById(data.id);
    if (!troca) return jsonError("Troca não encontrada", 404);

    // Verificar permissão (apenas userB pode aceitar/recusar)
    if (String(troca.userB) !== String(userId)) {
      return jsonError("Sem permissão", 403);
    }
    if (troca.status !== "pendente") {
      return jsonError("Troca já foi decidida", 409);
    }

    // Se for aceito, vincular ao próximo evento ativo (futuro OU atual)
    if (data.status === "aceito") {
      const agora = new Date();
      
      // Buscar eventos ativos que começam hoje ou no futuro, ou que já estão acontecendo
      const proximoEvento = await EventoTroca.findOne({
        ativo: true,
        dataFim: { $gte: agora } // Evento que ainda não terminou
      }).sort({ dataInicio: 1 }).lean();

      console.log("Próximo evento encontrado:", proximoEvento?._id, proximoEvento?.titulo);

      if (proximoEvento) {
        troca.eventoId = proximoEvento._id;
        troca.dataTroca = proximoEvento.dataInicio.toISOString();
        troca.localTroca = proximoEvento.localNome;
        console.log("Evento vinculado à troca:", troca.eventoId);
      } else {
        console.log("NENHUM evento ativo encontrado. Verifique se existe evento com ativo=true e dataFim >= hoje");
      }
    }

    troca.status = data.status;
    await troca.save();

    console.log("Troca salva:", { 
      id: troca._id, 
      status: troca.status, 
      eventoId: troca.eventoId,
      dataTroca: troca.dataTroca,
      localTroca: troca.localTroca
    });

    // Buscar o evento para retornar na resposta
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
      message: data.status === "aceito" ? "Troca aceita! Evento vinculado." : "Troca recusada",
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