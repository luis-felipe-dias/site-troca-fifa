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
  const startTime = Date.now();
  
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();    
    if (!usuario) {
      return jsonError("Usuário não encontrado", 404);
    }
    const userId = usuario._id;

    console.log("=== MATCHES - INICIANDO ===");

    // ============================================
    // 1. BUSCAR TODOS OS DADOS NECESSÁRIOS
    // ============================================
    const [
      todasFigurinhas,
      minhasFigurinhas,
      minhasTrocas,
      outrosUsuarios
    ] = await Promise.all([
      Figurinha.find().select("codigo").lean(),
      UsuarioFigurinha.find({ userId, possui: true }).lean(),
      Troca.find({ $or: [{ userA: userId }, { userB: userId }] }).lean(),
      Usuario.find({ _id: { $ne: userId } }).select("_id yupId cidade").lean()
    ]);

    if (minhasFigurinhas.length === 0 || outrosUsuarios.length === 0) {
      return jsonOk({ suggestions: [], trocas: await formatarTrocas(minhasTrocas, userId) });
    }

    // ============================================
    // 2. MINHAS RESERVAS ATIVAS
    // ============================================
    const minhasReservas = await Troca.find({
      $or: [
        { userA: userId, status: "aceito", reservadaA: true },
        { userB: userId, status: "aceito", reservadaB: true }
      ]
    }).lean();

    const minhasReservasPorFigura = new Map<string, number>();
    minhasReservas.forEach(t => {
      if (String(t.userA) === String(userId) && t.reservadaA) {
        minhasReservasPorFigura.set(t.figurinhaA, (minhasReservasPorFigura.get(t.figurinhaA) || 0) + 1);
      }
      if (String(t.userB) === String(userId) && t.reservadaB) {
        minhasReservasPorFigura.set(t.figurinhaB, (minhasReservasPorFigura.get(t.figurinhaB) || 0) + 1);
      }
    });

    // ============================================
    // 3. MINHAS FIGURINHAS REPETIDAS DISPONÍVEIS
    // ============================================
    const minhasFigurinhasMap = new Map();
    minhasFigurinhas.forEach(f => minhasFigurinhasMap.set(f.codigo, f));
    
    const minhasDisponiveis: { codigo: string; disponiveis: number }[] = [];
    
    for (const fig of minhasFigurinhas) {
      if (!fig.repetida) continue;
      
      const reservas = minhasReservasPorFigura.get(fig.codigo) || 0;
      const quantidadeRepetidas = fig.quantidade || 1;
      const disponiveis = quantidadeRepetidas - reservas;
      
      if (disponiveis > 0) {
        minhasDisponiveis.push({ codigo: fig.codigo, disponiveis });
      }
    }
    
    console.log(`📊 Minhas repetidas disponíveis: ${minhasDisponiveis.length}`);

    if (minhasDisponiveis.length === 0) {
      return jsonOk({ suggestions: [], trocas: await formatarTrocas(minhasTrocas, userId) });
    }

    // ============================================
    // 4. FIGURINHAS QUE ME FALTAM
    // ============================================
    const tenho = new Set(minhasFigurinhas.map(f => f.codigo));
    const todasFigurinhasSet = new Set(todasFigurinhas.map(f => f.codigo));
    const faltantes = [...todasFigurinhasSet].filter(codigo => !tenho.has(codigo));

    if (faltantes.length === 0) {
      return jsonOk({ suggestions: [], trocas: await formatarTrocas(minhasTrocas, userId) });
    }

    // ============================================
    // 5. DADOS DOS OUTROS USUÁRIOS
    // ============================================
    const outrosIds = outrosUsuarios.map(u => u._id);
    
    const [figurinhasOutros, reservasOutros, todasFigurinhasOutros] = await Promise.all([
      UsuarioFigurinha.find({
        userId: { $in: outrosIds },
        possui: true,
        repetida: true,
        codigo: { $in: faltantes }
      }).lean(),
      Troca.find({
        $or: [
          { userA: { $in: outrosIds }, status: "aceito", reservadaA: true },
          { userB: { $in: outrosIds }, status: "aceito", reservadaB: true }
        ]
      }).lean(),
      UsuarioFigurinha.find({ userId: { $in: outrosIds }, possui: true }).lean()
    ]);

    // Agrupar figurinhas dos outros por usuário
    const figurinhasOutrosPorUsuario = new Map<string, Map<string, any>>();
    figurinhasOutros.forEach(f => {
      const id = String(f.userId);
      if (!figurinhasOutrosPorUsuario.has(id)) {
        figurinhasOutrosPorUsuario.set(id, new Map());
      }
      figurinhasOutrosPorUsuario.get(id)!.set(f.codigo, f);
    });

    // Agrupar reservas dos outros
    const reservasOutrosPorFigura = new Map<string, Map<string, number>>();
    reservasOutros.forEach(t => {
      if (t.reservadaA) {
        const userIdStr = String(t.userA);
        if (!reservasOutrosPorFigura.has(userIdStr)) {
          reservasOutrosPorFigura.set(userIdStr, new Map());
        }
        const userReservas = reservasOutrosPorFigura.get(userIdStr)!;
        userReservas.set(t.figurinhaA, (userReservas.get(t.figurinhaA) || 0) + 1);
      }
      if (t.reservadaB) {
        const userIdStr = String(t.userB);
        if (!reservasOutrosPorFigura.has(userIdStr)) {
          reservasOutrosPorFigura.set(userIdStr, new Map());
        }
        const userReservas = reservasOutrosPorFigura.get(userIdStr)!;
        userReservas.set(t.figurinhaB, (userReservas.get(t.figurinhaB) || 0) + 1);
      }
    });

    // ============================================
    // 6. NECESSIDADES DOS OUTROS USUÁRIOS
    // ============================================
    const outrasPossesPorUsuario = new Map<string, Set<string>>();
    todasFigurinhasOutros.forEach(f => {
      const id = String(f.userId);
      if (!outrasPossesPorUsuario.has(id)) {
        outrasPossesPorUsuario.set(id, new Set());
      }
      outrasPossesPorUsuario.get(id)!.add(f.codigo);
    });

    const necessidadesOutros = new Map<string, Set<string>>();
    for (const outro of outrosUsuarios) {
      const id = String(outro._id);
      const possui = outrasPossesPorUsuario.get(id) || new Set();
      const faltam = [...todasFigurinhasSet].filter(codigo => !possui.has(codigo));
      necessidadesOutros.set(id, new Set(faltam));
    }

    // ============================================
    // 7. COMBINAÇÕES JÁ UTILIZADAS
    // ============================================
    const combinacoesUsadas = new Set<string>();
    minhasTrocas.forEach(t => {
      const isUserA = String(t.userA) === String(userId);
      if (isUserA) {
        combinacoesUsadas.add(`${String(t.userB)}|${t.figurinhaA}|${t.figurinhaB}`);
      } else {
        combinacoesUsadas.add(`${String(t.userA)}|${t.figurinhaB}|${t.figurinhaA}`);
      }
    });

    // ============================================
    // 8. GERAR TODAS AS SUGESTÕES (SEM LIMITE)
    // ============================================
    const suggestions: any[] = [];
    const usersMap = new Map(outrosUsuarios.map(u => [String(u._id), u]));
    const combinacoesAdicionadas = new Set<string>();

    for (const outro of outrosUsuarios) {
      const outroId = String(outro._id);
      const userData = usersMap.get(outroId);
      if (!userData) continue;
      
      const figurinhasOutro = figurinhasOutrosPorUsuario.get(outroId);
      if (!figurinhasOutro) continue;
      
      const necessidades = necessidadesOutros.get(outroId);
      if (!necessidades || necessidades.size === 0) continue;
      
      const reservasOutroMap = reservasOutrosPorFigura.get(outroId) || new Map();
      
      // Para cada figurinha que o outro tem repetida e que me falta
      for (const [codigo, fig] of figurinhasOutro) {
        // Verificar disponibilidade do outro
        const reservasOutro = reservasOutroMap.get(codigo) || 0;
        const quantidadeOutro = fig.quantidade || 1;
        const disponivelOutro = quantidadeOutro - reservasOutro;
        
        if (disponivelOutro <= 0) continue;
        
        // Para cada uma das minhas repetidas disponíveis
        for (const minha of minhasDisponiveis) {
          // Verificar se o outro precisa da minha figurinha
          if (!necessidades.has(minha.codigo)) continue;
          
          const combinacao = `${outroId}|${minha.codigo}|${codigo}`;
          const combinacaoInversa = `${outroId}|${codigo}|${minha.codigo}`;
          
          if (combinacoesUsadas.has(combinacao) || combinacoesUsadas.has(combinacaoInversa)) continue;
          if (combinacoesAdicionadas.has(combinacao)) continue;
          
          // Verificar minha disponibilidade atual
          const minhaFig = minhasFigurinhasMap.get(minha.codigo);
          const minhasReservas = minhasReservasPorFigura.get(minha.codigo) || 0;
          const minhaDisponibilidade = (minhaFig?.quantidade || 1) - minhasReservas;
          
          if (minhaDisponibilidade <= 0) continue;
          
          // Sugestão válida!
          const avatarIndex = outroId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const avatares = ["🦶", "🦷", "🦵", "🦹", "🦸", "🦊", "🦻", "🦼", "🦨", "🦟", "🦙", "🦦"];
          const avatar = avatares[avatarIndex % avatares.length];
          
          suggestions.push({
            userId: outroId,
            yupId: userData.yupId,
            cidade: userData.cidade,
            give: minha.codigo,
            want: codigo,
            avatar
          });
          
          combinacoesAdicionadas.add(combinacao);
        }
      }
    }

    // Ordenar sugestões para ter uma ordem consistente
    suggestions.sort((a, b) => {
      if (a.yupId !== b.yupId) return a.yupId.localeCompare(b.yupId);
      if (a.give !== b.give) return a.give.localeCompare(b.give);
      return a.want.localeCompare(b.want);
    });

    console.log(`📊 Total de sugestões geradas: ${suggestions.length}`);
    console.log(`⏱️ Tempo de execução: ${Date.now() - startTime}ms`);

    const trocasFormatadas = await formatarTrocas(minhasTrocas, userId);
    return jsonOk({ suggestions, trocas: trocasFormatadas });
    
  } catch (err: any) {
    console.error("Erro no GET /matches:", err);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro interno: " + err.message, 500);
  }
}

// ============================================
// FUNÇÃO AUXILIAR PARA FORMATAR TROCAS
// ============================================
async function formatarTrocas(trocas: any[], userId: mongoose.Types.ObjectId) {
  if (trocas.length === 0) return [];
  
  const ids = Array.from(new Set(trocas.flatMap((t) => [String(t.userA), String(t.userB)])));
  const users = await Usuario.find({ _id: { $in: ids } }).select("yupId nomeCompleto").lean();
  const uMap = new Map(users.map((u) => [String(u._id), { yupId: u.yupId, nome: u.nomeCompleto }]));
  
  const eventoIds = trocas.filter(t => t.eventoId).map(t => t.eventoId);
  const eventos = eventoIds.length ? await EventoTroca.find({ _id: { $in: eventoIds } }).lean() : [];
  const eventoMap = new Map(eventos.map(e => [String(e._id), e]));
  
  return trocas.map((t) => {
    const isUserA = String(t.userA) === String(userId);
    const evento = t.eventoId ? eventoMap.get(String(t.eventoId)) : null;
    const userAInfo = uMap.get(String(t.userA));
    const userBInfo = uMap.get(String(t.userB));
    
    const formatarUsuario = (info: { yupId: string; nome: string } | undefined, isVoce: boolean) => {
      if (isVoce) return "Você";
      if (!info) return "—";
      if (t.status === "aceito") {
        const primeiroNome = info.nome?.split(" ")[0] || info.yupId;
        return `${info.yupId} - ${primeiroNome}`;
      }
      return info.yupId;
    };
    
    return {
      id: String(t._id),
      from: formatarUsuario(userAInfo, isUserA),
      to: formatarUsuario(userBInfo, !isUserA),
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
  });
}

// ============================================
// POST - Criar nova troca
// ============================================
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

    // Buscar usuário destino
    let userBDestino = null;
    if (mongoose.Types.ObjectId.isValid(data.userB)) {
      userBDestino = await Usuario.findById(data.userB).select("_id yupId nomeCompleto").lean();        
    }
    if (!userBDestino) {
      userBDestino = await Usuario.findOne({ yupId: data.userB }).select("_id yupId nomeCompleto").lean();
    }
    if (!userBDestino) {
      return jsonError("Usuário destino não encontrado", 404);
    }

    // ============================================
    // VALIDAÇÃO COMPLETA DE DISPONIBILIDADE
    // ============================================
    
    // 1. Verificar minha figurinha
    const minhaFigurinha = await UsuarioFigurinha.findOne({
      userId: userId,
      codigo: data.figurinhaA,
      possui: true
    }).lean();

    if (!minhaFigurinha) {
      return jsonError(`Você não possui ${data.figurinhaA}`, 400);
    }

    if (!minhaFigurinha.repetida) {
      return jsonError(`Você não possui ${data.figurinhaA} como repetida`, 400);
    }

    // Contar minhas reservas ativas
    const minhasReservas = await Troca.countDocuments({
      $or: [
        { userA: userId, figurinhaA: data.figurinhaA, status: "aceito", reservadaA: true },
        { userB: userId, figurinhaB: data.figurinhaA, status: "aceito", reservadaB: true }
      ]
    });

    const minhaDisponibilidade = (minhaFigurinha.quantidade || 1) - minhasReservas;
    if (minhaDisponibilidade <= 0) {
      return jsonError(`Você não possui mais unidades de ${data.figurinhaA} disponíveis`, 409);
    }

    // 2. Verificar figurinha do destino
    const destinoFigurinha = await UsuarioFigurinha.findOne({
      userId: userBDestino._id,
      codigo: data.figurinhaB,
      possui: true
    }).lean();

    if (!destinoFigurinha) {
      return jsonError(`${userBDestino.yupId} não possui ${data.figurinhaB}`, 400);
    }

    if (!destinoFigurinha.repetida) {
      return jsonError(`${userBDestino.yupId} não possui ${data.figurinhaB} como repetida`, 400);
    }

    // Contar reservas do destino
    const reservasDestino = await Troca.countDocuments({
      $or: [
        { userA: userBDestino._id, figurinhaA: data.figurinhaB, status: "aceito", reservadaA: true },
        { userB: userBDestino._id, figurinhaB: data.figurinhaB, status: "aceito", reservadaB: true }
      ]
    });

    const disponibilidadeDestino = (destinoFigurinha.quantidade || 1) - reservasDestino;
    if (disponibilidadeDestino <= 0) {
      return jsonError(`${userBDestino.yupId} não possui mais unidades de ${data.figurinhaB} disponíveis`, 409);
    }

    // 3. Verificar se já existe troca pendente
    const trocaExistente = await Troca.findOne({
      $or: [
        { userA: userId, userB: userBDestino._id, figurinhaA: data.figurinhaA, figurinhaB: data.figurinhaB, status: "pendente" },
        { userA: userBDestino._id, userB: userId, figurinhaA: data.figurinhaB, figurinhaB: data.figurinhaA, status: "pendente" }
      ]
    });

    if (trocaExistente) {
      return jsonError("Já existe solicitação pendente para estas figurinhas", 409);
    }

    // Criar troca
    const troca = await Troca.create({
      userA: userId,
      userB: userBDestino._id,
      figurinhaA: data.figurinhaA,
      figurinhaB: data.figurinhaB,
      status: "pendente",
      reservadaA: false,
      reservadaB: false
    });

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