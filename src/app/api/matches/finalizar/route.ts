import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { Troca } from "@/models/Troca";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { jsonError, jsonOk } from "@/lib/http";
import mongoose from "mongoose";

const FinalizarSchema = z.object({
  trocaId: z.string().min(10)
});

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const { trocaId } = FinalizarSchema.parse(body);

    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id yupId").lean();
    if (!usuario) {
      return jsonError("Usuário não encontrado", 404);
    }
    const userId = usuario._id;

    const troca = await Troca.findById(trocaId).session(session);
    if (!troca) {
      return jsonError("Troca não encontrada", 404);
    }

    // Verificar se o usuário participa da troca
    if (String(troca.userA) !== String(userId) && String(troca.userB) !== String(userId)) {
      return jsonError("Você não participa desta troca", 403);
    }

    // Verificar se a troca está aceita
    if (troca.status !== "aceito") {
      return jsonError("Apenas trocas aceitas podem ser finalizadas", 400);
    }

    // Verificar se já foi finalizada
    if (troca.status === "finalizado") {
      return jsonError("Esta troca já foi finalizada", 400);
    }

    // ============================================
    // REALIZAR A TRANSFERÊNCIA DAS FIGURINHAS
    // ============================================

    // 1. ATUALIZAR figurinhaA do userA (perde uma unidade)
    const userAFigurinhaA = await UsuarioFigurinha.findOne({
      userId: troca.userA,
      codigo: troca.figurinhaA
    }).session(session);

    if (!userAFigurinhaA) {
      throw new Error("UserA não possui a figurinha");
    }

    // ✅ CORREÇÃO: Se quantidade é 1, não deleta, apenas atualiza
    if (userAFigurinhaA.quantidade <= 1) {
      // A figurinha era repetida (quantidade=1 significa que ele tinha 1 repetida)
      // Após a troca, ele perde essa unidade repetida, mas ainda tem a figurinha original
      // Deixa de ser repetida, agora é apenas "tenho"
      userAFigurinhaA.quantidade = 1;
      userAFigurinhaA.repetida = false;
      userAFigurinhaA.possui = true;
      await userAFigurinhaA.save({ session });
    } else {
      // Diminui quantidade (era 2 ou mais)
      userAFigurinhaA.quantidade -= 1;
      if (userAFigurinhaA.quantidade === 1) {
        userAFigurinhaA.repetida = false;
      }
      await userAFigurinhaA.save({ session });
    }

    // 2. ATUALIZAR figurinhaB do userB (perde uma unidade)
    const userBFigurinhaB = await UsuarioFigurinha.findOne({
      userId: troca.userB,
      codigo: troca.figurinhaB
    }).session(session);

    if (!userBFigurinhaB) {
      throw new Error("UserB não possui a figurinha");
    }

    // ✅ CORREÇÃO: Mesma lógica para o userB
    if (userBFigurinhaB.quantidade <= 1) {
      userBFigurinhaB.quantidade = 1;
      userBFigurinhaB.repetida = false;
      userBFigurinhaB.possui = true;
      await userBFigurinhaB.save({ session });
    } else {
      userBFigurinhaB.quantidade -= 1;
      if (userBFigurinhaB.quantidade === 1) {
        userBFigurinhaB.repetida = false;
      }
      await userBFigurinhaB.save({ session });
    }

    // 3. ADICIONAR figurinhaB para userA (ganha uma unidade)
    const userATemFigurinhaB = await UsuarioFigurinha.findOne({
      userId: troca.userA,
      codigo: troca.figurinhaB
    }).session(session);

    if (userATemFigurinhaB) {
      userATemFigurinhaB.quantidade += 1;
      if (userATemFigurinhaB.quantidade >= 2) {
        userATemFigurinhaB.repetida = true;
      }
      userATemFigurinhaB.possui = true;
      await userATemFigurinhaB.save({ session });
    } else {
      await UsuarioFigurinha.create([{
        userId: troca.userA,
        codigo: troca.figurinhaB,
        possui: true,
        repetida: false,
        quantidade: 1
      }], { session });
    }

    // 4. ADICIONAR figurinhaA para userB (ganha uma unidade)
    const userBTemFigurinhaA = await UsuarioFigurinha.findOne({
      userId: troca.userB,
      codigo: troca.figurinhaA
    }).session(session);

    if (userBTemFigurinhaA) {
      userBTemFigurinhaA.quantidade += 1;
      if (userBTemFigurinhaA.quantidade >= 2) {
        userBTemFigurinhaA.repetida = true;
      }
      userBTemFigurinhaA.possui = true;
      await userBTemFigurinhaA.save({ session });
    } else {
      await UsuarioFigurinha.create([{
        userId: troca.userB,
        codigo: troca.figurinhaA,
        possui: true,
        repetida: false,
        quantidade: 1
      }], { session });
    }

    // 5. Atualizar status da troca
    troca.status = "finalizado";
    troca.finalizadaEm = new Date();
    await troca.save({ session });

    await session.commitTransaction();

    return jsonOk({ 
      success: true, 
      message: "Troca finalizada com sucesso! Figurinhas transferidas." 
    });

  } catch (err: any) {
    await session.abortTransaction();
    console.error("Erro ao finalizar troca:", err);
    
    if (err?.name === "ZodError") {
      return jsonError("Dados inválidos", 400);
    }
    if (err?.message === "UNAUTHORIZED") {
      return jsonError("Não autenticado", 401);
    }
    if (err?.message === "UserA não possui a figurinha") {
      return jsonError("Você não possui mais esta figurinha repetida", 400);
    }
    if (err?.message === "UserB não possui a figurinha") {
      return jsonError("O outro usuário não possui mais a figurinha dele", 400);
    }
    
    return jsonError("Erro ao finalizar troca: " + err.message, 500);
  } finally {
    session.endSession();
  }
}