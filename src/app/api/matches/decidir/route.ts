import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Troca } from "@/models/Troca";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { EventoTroca } from "@/models/EventoTroca";
import { Notificacao } from "@/models/Notificacao";
import { Usuario } from "@/models/Usuario";

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const body = await req.json();
    const { id, status } = body;

    if (!id || !["aceito", "recusado"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Buscar a troca
    const troca = await Troca.findById(id).lean();
    if (!troca) {
      return NextResponse.json({ error: "Troca não encontrada" }, { status: 404 });
    }

    // Verificar se o usuário é o destinatário (userB) ou o remetente (userA) pode aceitar?
    // Por segurança, apenas o destinatário pode aceitar/recusar
    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario || String(troca.userB) !== String(usuario._id)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se já foi respondida
    if (troca.status !== "pendente") {
      return NextResponse.json({ error: "Esta troca já foi respondida" }, { status: 400 });
    }

    // Buscar evento ativo
    const eventoAtivo = await EventoTroca.findOne({
      ativo: true,
      dataInicio: { $lte: new Date() },
      dataFim: { $gte: new Date() }
    }).lean();

    if (status === "aceito") {
      // ============================================
      // VALIDAÇÕES DE RESERVA ANTES DE ACEITAR
      // ============================================
      
      // 1. Verificar se a figurinhaA do userA ainda está disponível
      const reservaConflitanteA = await Troca.findOne({
        _id: { $ne: id },
        userA: troca.userA,
        figurinhaA: troca.figurinhaA,
        status: "aceito",
        reservadaA: true
      });

      if (reservaConflitanteA) {
        return NextResponse.json({ 
          error: `A figurinha ${troca.figurinhaA} já foi reservada em outra troca` 
        }, { status: 409 });
      }

      // 2. Verificar se a figurinhaB do userB ainda está disponível
      const reservaConflitanteB = await Troca.findOne({
        _id: { $ne: id },
        userB: troca.userB,
        figurinhaB: troca.figurinhaB,
        status: "aceito",
        reservadaB: true
      });

      if (reservaConflitanteB) {
        return NextResponse.json({ 
          error: `A figurinha ${troca.figurinhaB} já foi reservada em outra troca` 
        }, { status: 409 });
      }

      // 3. Verificar se o userA ainda possui a figurinha como repetida
      const userAFaltante = await UsuarioFigurinha.findOne({
        userId: troca.userA,
        codigo: troca.figurinhaA,
        possui: true,
        repetida: true
      }).lean();

      if (!userAFaltante) {
        return NextResponse.json({ 
          error: `${troca.figurinhaA} não está mais disponível para troca` 
        }, { status: 409 });
      }

      // 4. Verificar se o userB ainda possui a figurinha como repetida
      const userBFaltante = await UsuarioFigurinha.findOne({
        userId: troca.userB,
        codigo: troca.figurinhaB,
        possui: true,
        repetida: true
      }).lean();

      if (!userBFaltante) {
        return NextResponse.json({ 
          error: `${troca.figurinhaB} não está mais disponível para troca` 
        }, { status: 409 });
      }

      // ============================================
      // RESERVAR AS FIGURINHAS
      // ============================================
      
      // Atualizar a troca com status aceito e marcar reservas
      await Troca.updateOne(
        { _id: id },
        { 
          $set: { 
            status: "aceito",
            reservadaA: true,
            reservadaB: true,
            eventoId: eventoAtivo?._id || null
          }
        }
      );

      // Criar notificação para o userA
      const userADados = await Usuario.findById(troca.userA).select("yupId").lean();
      const userBDados = await Usuario.findById(troca.userB).select("yupId").lean();

      await Notificacao.create({
        userId: troca.userA,
        tipo: "troca_aceita",
        titulo: "Troca aceita! 🎉",
        mensagem: `${userBDados?.yupId} aceitou a troca! Figurinhas reservadas.`,
        dados: {
          trocaId: String(troca._id),
          usuarioYupId: userBDados?.yupId,
          figurinhaA: troca.figurinhaA,
          figurinhaB: troca.figurinhaB
        },
        lida: false
      });

      return NextResponse.json({ 
        success: true, 
        message: "Troca aceita! Figurinhas reservadas." 
      });

    } else {
      // RECUSADO - apenas atualiza o status
      await Troca.updateOne(
        { _id: id },
        { $set: { status: "recusado" } }
      );

      // Notificar o userA
      const userADados = await Usuario.findById(troca.userA).select("yupId").lean();
      const userBDados = await Usuario.findById(troca.userB).select("yupId").lean();

      await Notificacao.create({
        userId: troca.userA,
        tipo: "troca_recusada",
        titulo: "Troca recusada",
        mensagem: `${userBDados?.yupId} recusou a troca de ${troca.figurinhaA} por ${troca.figurinhaB}`,
        dados: {
          trocaId: String(troca._id),
          usuarioYupId: userBDados?.yupId,
          figurinhaA: troca.figurinhaA,
          figurinhaB: troca.figurinhaB
        },
        lida: false
      });

      return NextResponse.json({ success: true, message: "Troca recusada" });
    }

  } catch (error: any) {
    console.error("Erro ao decidir troca:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}