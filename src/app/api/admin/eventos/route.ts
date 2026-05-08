import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-request";
import { EventoTroca } from "@/models/EventoTroca";

// GET - Listar todos os eventos
export async function GET() {
  try {
    await requireAdmin();
    await connectMongo();
    
    const eventos = await EventoTroca.find({}).sort({ dataInicio: -1 });
    return NextResponse.json(eventos);
  } catch (error: any) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar eventos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo evento
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectMongo();
    
    const body = await request.json();
    const { titulo, descricao, dataInicio, dataFim, localNome, localUrl, localPreset } = body;
    
    // Validações
    if (!titulo || !dataInicio || !dataFim || !localNome || !localUrl) {
      return NextResponse.json(
        { error: "Campos obrigatórios: titulo, dataInicio, dataFim, localNome, localUrl" },
        { status: 400 }
      );
    }
    
    const evento = await EventoTroca.create({
      titulo,
      descricao,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      localNome,
      localUrl,
      localPreset,
      ativo: true,
      createdBy: admin.sub
    });
    
    return NextResponse.json(evento, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar evento" },
      { status: 500 }
    );
  }
}