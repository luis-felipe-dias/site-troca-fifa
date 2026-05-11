import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Troca } from "@/models/Troca";
import { EventoTroca } from "@/models/EventoTroca";
import { Notificacao } from "@/models/Notificacao";
import { Figurinha } from "@/models/Figurinha";
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

    // ============================================
    // Buscar TODAS as trocas já existentes
    // ============================================
    const trocasExistentes = await Troca.find({
      $or: [{ userA: userId }, { userB: userId }]
    }).lean();

    const combinacoesUsadas = new Set<string>();
    
    trocasExistentes.forEach(troca => {
      const isUserA = String(troca.userA) === String(userId);
      if (isUserA) {
        combinacoesUsadas.add(`${String(troca.userB)}|${troca.figurinhaA}|${troca.figurinhaB}`);
      } else {
        combinacoesUsadas.add(`${String(troca.userA)}|${troca.figurinhaB}|${troca.figurinhaA}`);
      }
    });

    // ============================================
    // Buscar APENAS o que o usuário TEM
    // Ausência de registro = NÃO possui
    // ============================================
    const minhasFigurinhas = await UsuarioFigurinha.find({ 
      userId: userId,
      possui: true 
    }).lean();

    const repetidas = minhasFigurinhas
      .filter((m) => m.repetida === true)
      .map((m) => m.codigo);
    
    const tenho = new Set(minhasFigurinhas.map((m) => m.codigo));

    // Buscar TODAS as figurinhas do sistema (para saber o que falta)
    const todasFigurinhas = await Figurinha.find().select("codigo").lean();
    const faltantes = todasFigurinhas
      .filter((f) => !tenho.has(f.codigo))
      .map((f) => f.codigo);

    // Buscar outros usuários que têm o que eu preciso
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
        const marks = await UsuarioFigurinha.find({ 
          userId: otherId,
          possui: true 
        }).lean();
        
        const outrasRepetidas = marks.filter(m => m.repetida).map(m => m.codigo);
        const outrasTenho = new Set(marks.map(m => m.codigo));
        const todasFigurinhasSet = new Set(todasFigurinhas.map(f => f.codigo));
        const outrasFaltantes = [...todasFigurinhasSet].filter(cod => !outrasTenho.has(cod));
        
        cacheOtherMarks.set(otherId, {
          repetidas: new Set(outrasRepetidas),
          faltantes: new Set(outrasFaltantes)
        });
      }
      const other = cacheOtherMarks.get(otherId)!;

      const want = cand.codigo;
      const possibleGive = repetidas.find((r) => other.faltantes.has(r));
      if (!possibleGive) continue;

      const combinacaoCompleta = `${otherId}|${possibleGive}|${want}`;
      if (combinacoesUsadas.has(combinacaoCompleta)) {
        continue;
      }

      if (suggestions.some((s) => s.userId === otherId && s.give === possibleGive && s.want === want)) continue;

      const u = await Usuario.findById(otherId).select("yupId cidade").lean();
      if (!u) continue;

      const avatarIndex = otherId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const avatares = ["🦶", "🦷", "🦵", "🦹", "🦸", "🦊", "🦻", "🦼", "🦨", "🦟", "🦙", "🦦"];
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

    // Buscar trocas existentes para exibir
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
    const data = CreateSchema.parse(body);
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id yupId").lean();
    if (!usuario) return jsonError("Usuário não encontrado", 404);
    const userId = usuario._id;

    // VALIDAÇÃO 1: Eu tenho a figurinha como repetida?
    const minhaFigurinha = await UsuarioFigurinha.findOne({
      userId: userId,
      codigo: data.figurinhaA,
      possui: true,
      repetida: true
    }).lean();

    if (!minhaFigurinha) {
      return jsonError(`Você não possui ${data.figurinhaA} como repetida`, 400);
    }

    // Buscar usuário destino
    let userBDestino = null;
    if (mongoose.Types.ObjectId.isValid(data.userB)) {
      userBDestino = await Usuario.findById(data.userB).select("_id yupId").lean();        
    }
    if (!userBDestino) {
      userBDestino = await Usuario.findOne({ yupId: data.userB }).select("_id yupId").lean();
    }
    if (!userBDestino) {
      return jsonError("Usuário destino não encontrado", 404);
    }

    // VALIDAÇÃO 2: Destino PRECISA da minha figurinha?
    const destinoPossui = await UsuarioFigurinha.findOne({
      userId: userBDestino._id,
      codigo: data.figurinhaA,
      possui: true
    }).lean();

    if (destinoPossui) {
      return jsonError(`${userBDestino.yupId} já possui ${data.figurinhaA}`, 400);
    }

    // VALIDAÇÃO 3: Destino tem a figurinha dele como repetida?
    const destinoFigurinha = await UsuarioFigurinha.findOne({
      userId: userBDestino._id,
      codigo: data.figurinhaB,
      possui: true,
      repetida: true
    }).lean();

    if (!destinoFigurinha) {
      return jsonError(`${userBDestino.yupId} não possui ${data.figurinhaB} como repetida`, 400);
    }

    // VALIDAÇÃO 4: Eu preciso da figurinha que ele oferece?
    const euPossuo = await UsuarioFigurinha.findOne({
      userId: userId,
      codigo: data.figurinhaB,
      possui: true
    }).lean();

    if (euPossuo) {
      return jsonError(`Você já possui ${data.figurinhaB}`, 400);
    }

    // ============================================
    // NOVA VALIDAÇÃO: Verificar se as figurinhas não estão reservadas
    // ============================================
    
    // Verificar se a figurinhaA do userA já está reservada em outra troca aceita
    const reservaConflitanteA = await Troca.findOne({
      userA: userId,
      figurinhaA: data.figurinhaA,
      status: { $in: ["aceito", "pendente"] },
      reservadaA: true
    });

    if (reservaConflitanteA) {
      return jsonError(`Sua figurinha ${data.figurinhaA} já está reservada em outra troca`, 409);
    }

    // Verificar se a figurinhaB do userB já está reservada em outra troca aceita
    const reservaConflitanteB = await Troca.findOne({
      userB: userBDestino._id,
      figurinhaB: data.figurinhaB,
      status: { $in: ["aceito", "pendente"] },
      reservadaB: true
    });

    if (reservaConflitanteB) {
      return jsonError(`A figurinha ${data.figurinhaB} de ${userBDestino.yupId} já está reservada em outra troca`, 409);
    }

    // Verificar se já existe troca pendente
    const trocaExistente = await Troca.findOne({
      $or: [
        { userA: userId, userB: userBDestino._id, figurinhaA: data.figurinhaA, figurinhaB: data.figurinhaB, status: "pendente" },
        { userA: userBDestino._id, userB: userId, figurinhaA: data.figurinhaB, figurinhaB: data.figurinhaA, status: "pendente" }
      ]
    });

    if (trocaExistente) {
      return jsonError("Já existe solicitação pendente para estas figurinhas", 409);
    }

    const troca = await Troca.create({
      userA: userId,
      userB: userBDestino._id,
      figurinhaA: data.figurinhaA,
      figurinhaB: data.figurinhaB,
      status: "pendente"
    });

    // Notificação
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
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    console.error("Erro no POST /matches:", err);
    return jsonError("Erro interno: " + err.message, 500);
  }
}