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

    return NextResponse.json({ 
      totalFigurinhas, 
      possui, 
      repetidas, 
      faltantes, 
      progresso, 
      pendentes,
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