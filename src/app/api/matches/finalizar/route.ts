import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Troca } from "@/models/Troca";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Notificacao } from "@/models/Notificacao";
import { Usuario } from "@/models/Usuario";

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const body = await req.json();
    const { trocaId } = body;

    if (!trocaId) {
      return NextResponse.json({ error: "ID da troca é obrigatório" }, { status: 400 });
    }

    const troca = await Troca.findById(trocaId).lean();
    if (!troca) {
      return NextResponse.json({ error: "Troca não encontrada" }, { status: 404 });
    }

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario || (String(troca.userA) !== String(usuario._id) && String(troca.userB) !== String(usuario._id))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (troca.status !== "aceito") {
      return NextResponse.json({ error: "Apenas trocas aceitas podem ser finalizadas" }, { status: 400 });
    }

    if (troca.status === "finalizado") {
      return NextResponse.json({ error: "Troca já foi finalizada" }, { status: 400 });
    }

    // ============================================
    // 1. UserA: perde a repetida, mas mantém a figurinha no álbum
    // ============================================
    const figurinhaA_UserA = await UsuarioFigurinha.findOne({
      userId: troca.userA,
      codigo: troca.figurinhaA
    });

    if (figurinhaA_UserA) {
      await UsuarioFigurinha.updateOne(
        { _id: figurinhaA_UserA._id },
        { 
          $set: { 
            repetida: false,
            quantidade: 1
          } 
        }
      );
    }

    // ============================================
    // 2. UserB: recebe a figurinhaA (se não tiver)
    // ============================================
    const figurinhaA_UserB = await UsuarioFigurinha.findOne({
      userId: troca.userB,
      codigo: troca.figurinhaA
    });

    if (!figurinhaA_UserB) {
      await UsuarioFigurinha.create({
        userId: troca.userB,
        codigo: troca.figurinhaA,
        possui: true,
        repetida: false,
        quantidade: 1
      });
    } else if (!figurinhaA_UserB.possui) {
      await UsuarioFigurinha.updateOne(
        { _id: figurinhaA_UserB._id },
        { $set: { possui: true, quantidade: 1 } }
      );
    }

    // ============================================
    // 3. UserB: perde a repetida, mas mantém a figurinha no álbum
    // ============================================
    const figurinhaB_UserB = await UsuarioFigurinha.findOne({
      userId: troca.userB,
      codigo: troca.figurinhaB
    });

    if (figurinhaB_UserB) {
      await UsuarioFigurinha.updateOne(
        { _id: figurinhaB_UserB._id },
        { 
          $set: { 
            repetida: false,
            quantidade: 1
          } 
        }
      );
    }

    // ============================================
    // 4. UserA: recebe a figurinhaB (se não tiver)
    // ============================================
    const figurinhaB_UserA = await UsuarioFigurinha.findOne({
      userId: troca.userA,
      codigo: troca.figurinhaB
    });

    if (!figurinhaB_UserA) {
      await UsuarioFigurinha.create({
        userId: troca.userA,
        codigo: troca.figurinhaB,
        possui: true,
        repetida: false,
        quantidade: 1
      });
    } else if (!figurinhaB_UserA.possui) {
      await UsuarioFigurinha.updateOne(
        { _id: figurinhaB_UserA._id },
        { $set: { possui: true, quantidade: 1 } }
      );
    }

    // ============================================
    // 5. Atualizar status da troca
    // ============================================
    await Troca.updateOne(
      { _id: trocaId },
      { $set: { status: "finalizado", finalizadaEm: new Date() } }
    );

    // ============================================
    // 6. Notificações (agora com tipo correto)
    // ============================================
    const userADados = await Usuario.findById(troca.userA).select("yupId nomeCompleto").lean();
    const userBDados = await Usuario.findById(troca.userB).select("yupId nomeCompleto").lean();

    const primeiroNomeA = userADados?.nomeCompleto?.split(" ")[0] || userADados?.yupId;
    const primeiroNomeB = userBDados?.nomeCompleto?.split(" ")[0] || userBDados?.yupId;

    await Notificacao.create({
      userId: troca.userA,
      tipo: "troca_finalizada",
      titulo: "Troca finalizada! 🎊",
      mensagem: `Você recebeu ${troca.figurinhaB} de ${primeiroNomeB}`,
      dados: { trocaId: String(troca._id) },
      lida: false
    });

    await Notificacao.create({
      userId: troca.userB,
      tipo: "troca_finalizada",
      titulo: "Troca finalizada! 🎊",
      mensagem: `Você recebeu ${troca.figurinhaA} de ${primeiroNomeA}`,
      dados: { trocaId: String(troca._id) },
      lida: false
    });

    return NextResponse.json({ success: true, message: "Troca finalizada!" });

  } catch (error: any) {
    console.error("Erro ao finalizar troca:", error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}