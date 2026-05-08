import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Notificacao } from "@/models/Notificacao";
import { Usuario } from "@/models/Usuario";

export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { id, marcarTodas } = body;

    if (marcarTodas) {
      await Notificacao.updateMany(
        { userId: usuario._id, lida: false },
        { $set: { lida: true } }
      );
    } else if (id) {
      await Notificacao.updateOne(
        { _id: id, userId: usuario._id },
        { $set: { lida: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao marcar notificação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}