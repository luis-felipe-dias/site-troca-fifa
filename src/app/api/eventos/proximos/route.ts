import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { EventoTroca } from "@/models/EventoTroca";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const agora = new Date();
    
    // Buscar próximo evento ativo com dataInicio >= agora
    const proximoEvento = await EventoTroca.findOne({
      ativo: true,
      dataInicio: { $gte: agora }
    }).sort({ dataInicio: 1 }).lean();

    // Buscar próximos eventos (limite 5)
    const proximosEventos = await EventoTroca.find({
      ativo: true,
      dataInicio: { $gte: agora }
    }).sort({ dataInicio: 1 }).limit(5).lean();

    return NextResponse.json({ 
      proximoEvento: proximoEvento || null,
      proximosEventos: proximosEventos || []
    });
  } catch (error: any) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json({ 
      error: error.message || "Erro interno",
      proximoEvento: null,
      proximosEventos: []
    }, { status: 500 });
  }
}