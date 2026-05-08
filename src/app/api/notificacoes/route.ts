import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Notificacao } from "@/models/Notificacao";
import { Usuario } from "@/models/Usuario";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return NextResponse.json({ notificacoes: [] });
    }

    const notificacoes = await Notificacao.find({ userId: usuario._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ notificacoes: notificacoes || [] });
  } catch (error: any) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ notificacoes: [] }, { status: 200 });
  }
}