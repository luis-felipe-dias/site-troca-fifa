import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Figurinha } from "@/models/Figurinha";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Troca } from "@/models/Troca";
import { Usuario } from "@/models/Usuario";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).lean();
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    const userId = usuario._id;

    const totalFigurinhas = await Figurinha.countDocuments();
    const possui = await UsuarioFigurinha.countDocuments({ userId: userId, possui: true });
    const repetidas = await UsuarioFigurinha.countDocuments({ userId: userId, repetida: true });
    const faltantes = Math.max(0, totalFigurinhas - possui);
    const progresso = totalFigurinhas ? Math.round((possui / totalFigurinhas) * 100) : 0;

    const pendentes = await Troca.countDocuments({ userB: userId, status: "pendente" });
    
    const user = await Usuario.findOne({ yupId: payload.sub }).select("yupId cidade").lean();

    // ============================================
    // CÁLCULO DE POSSÍVEIS TROCAS
    // ============================================
    
    // 1. Buscar todas as figurinhas que o usuário TEM (possui = true)
    const minhasFigurinhas = await UsuarioFigurinha.find({ 
      userId: userId,
      possui: true 
    }).lean();

    // 2. Identificar quais figurinhas eu tenho como REPETIDA (quantidade > 1)
    const minhasRepetidas = minhasFigurinhas
      .filter(f => f.repetida === true || f.quantidade > 1)
      .map(f => f.codigo);

    // 3. Identificar quais figurinhas me FALTAM (não possuo)
    const todasFigurinhas = await Figurinha.find().select("codigo").lean();
    const codigosQueTenho = new Set(minhasFigurinhas.map(f => f.codigo));
    const faltantesLista = todasFigurinhas
      .filter(f => !codigosQueTenho.has(f.codigo))
      .map(f => f.codigo);

    // Se não tenho repetidas ou não falta nada, possiveisTrocas = 0
    if (minhasRepetidas.length === 0 || faltantesLista.length === 0) {
      return NextResponse.json({ 
        totalFigurinhas, 
        possui, 
        repetidas, 
        faltantes, 
        progresso, 
        pendentes,
        possiveisTrocas: 0,
        user: {
          yupId: user?.yupId || payload.sub,
          cidade: user?.cidade || "Cidade não informada"
        }
      });
    }

    // 4. Buscar outros usuários da MESMA CIDADE que têm as figurinhas que me faltam como repetidas
    const outrosUsuarios = await Usuario.find({ 
      _id: { $ne: userId },
      cidade: usuario.cidade 
    }).select("_id").lean();

    if (outrosUsuarios.length === 0) {
      return NextResponse.json({ 
        totalFigurinhas, 
        possui, 
        repetidas, 
        faltantes, 
        progresso, 
        pendentes,
        possiveisTrocas: 0,
        user: {
          yupId: user?.yupId || payload.sub,
          cidade: user?.cidade || "Cidade não informada"
        }
      });
    }

    const outrosIds = outrosUsuarios.map(u => u._id);

    // 5. Buscar figurinhas que outros usuários têm como repetidas E que estão na minha lista de faltantes
    const outrosPossuemRepetidas = await UsuarioFigurinha.find({
      userId: { $in: outrosIds },
      codigo: { $in: faltantesLista },
      possui: true,
      $or: [{ repetida: true }, { quantidade: { $gt: 1 } }]
    }).lean();

    // 6. Agrupar por código da figurinha que eles têm repetida
    const codigosQueOutrosTemRepetidas = new Set(outrosPossuemRepetidas.map(f => f.codigo));

    // 7. Para cada figurinha que me falta e que alguém tem repetida, verificar se EU tenho algo que ELES precisam
    let possiveisTrocasCount = 0;
    const combinacoesUsadas = new Set<string>();

    // Buscar cache de necessidades dos outros usuários
    const outrosIdsUnicos = [...new Set(outrosPossuemRepetidas.map(f => String(f.userId)))];
    const cacheNecessidadesOutros = new Map<string, Set<string>>();

    for (const outroId of outrosIdsUnicos) {
      const outrasFigurinhas = await UsuarioFigurinha.find({ 
        userId: outroId,
        possui: true 
      }).lean();
      const outrasTenho = new Set(outrasFigurinhas.map(f => f.codigo));
      const outrasFaltantes = todasFigurinhas
        .filter(f => !outrasTenho.has(f.codigo))
        .map(f => f.codigo);
      cacheNecessidadesOutros.set(outroId, new Set(outrasFaltantes));
    }

    // 8. Calcular matches possíveis
    for (const outroItem of outrosPossuemRepetidas) {
      const outroId = String(outroItem.userId);
      const want = outroItem.codigo; // figurinha que EU quero (eles têm repetida)
      
      const necessidadesOutro = cacheNecessidadesOutros.get(outroId);
      if (!necessidadesOutro) continue;

      // Verificar se EU tenho alguma repetida que o OUTRO precisa
      const possibleGive = minhasRepetidas.find(r => necessidadesOutro.has(r));
      if (!possibleGive) continue;

      const combinacao = `${outroId}|${possibleGive}|${want}`;
      if (combinacoesUsadas.has(combinacao)) continue;

      // Verificar se já existe troca pendente/aceita para esta combinação
      const trocaExistente = await Troca.findOne({
        $or: [
          { userA: userId, userB: outroId, figurinhaA: possibleGive, figurinhaB: want, status: { $in: ["pendente", "aceito"] } },
          { userA: outroId, userB: userId, figurinhaA: want, figurinhaB: possibleGive, status: { $in: ["pendente", "aceito"] } }
        ]
      }).lean();

      if (!trocaExistente) {
        combinacoesUsadas.add(combinacao);
        possiveisTrocasCount++;
      }

      // Limitar a 99 para não sobrecarregar
      if (possiveisTrocasCount >= 99) break;
    }

    return NextResponse.json({ 
      totalFigurinhas, 
      possui, 
      repetidas, 
      faltantes, 
      progresso, 
      pendentes,
      possiveisTrocas: possiveisTrocasCount,
      user: {
        yupId: user?.yupId || payload.sub,
        cidade: user?.cidade || "Cidade não informada"
      }
    });
  } catch (error: any) {
    console.error("Erro ao buscar stats:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}