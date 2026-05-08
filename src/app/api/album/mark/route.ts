import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Usuario } from "@/models/Usuario";

export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    // Buscar o _id do usuário
    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    const userId = usuario._id;

    const body = await request.json();
    const { codigo, possui, repetida, quantidadeRepetida } = body;

    // Atualizar ou criar registro
    const result = await UsuarioFigurinha.findOneAndUpdate(
      { userId: userId, codigo },
      {
        userId: userId,
        codigo,
        possui: possui || false,
        repetida: repetida || false,
        quantidadeRepetida: quantidadeRepetida || 0,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error("Erro ao marcar figurinha:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar" },
      { status: 500 }
    );
  }
}