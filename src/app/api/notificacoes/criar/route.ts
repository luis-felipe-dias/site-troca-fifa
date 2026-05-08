import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Notificacao } from "@/models/Notificacao";
import { Usuario } from "@/models/Usuario";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return NextResponse.json({ notificacoes: [], pagination: { total: 0, page: 1, totalPages: 0 } });
    }

    // Pegar parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filtro = searchParams.get("filtro") || "todas"; // "todas", "naoLidas", "lidas"
    
    const skip = (page - 1) * limit;
    
    // Construir filtro
    const filter: any = { userId: usuario._id };
    if (filtro === "naoLidas") {
      filter.lida = false;
    } else if (filtro === "lidas") {
      filter.lida = true;
    }
    
    // Total de notificações para paginação
    const total = await Notificacao.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    
    // Buscar notificações paginadas
    const notificacoes = await Notificacao.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      notificacoes: notificacoes || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ 
      notificacoes: [],
      pagination: { total: 0, page: 1, totalPages: 0 }
    }, { status: 200 });
  }
}