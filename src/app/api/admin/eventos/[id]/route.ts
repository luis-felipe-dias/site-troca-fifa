import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-request";
import { EventoTroca } from "@/models/EventoTroca";

// PUT - Editar evento existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectMongo();
    
    const { id } = await params;
    const body = await request.json();
    const { titulo, descricao, dataInicio, dataFim, localNome, localUrl, localPreset, ativo } = body;
    
    const evento = await EventoTroca.findByIdAndUpdate(
      id,
      {
        titulo,
        descricao,
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        localNome,
        localUrl,
        localPreset,
        ativo
      },
      { new: true }
    );
    
    if (!evento) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }
    
    return NextResponse.json(evento);
  } catch (error: any) {
    console.error("Erro ao atualizar evento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar evento" },
      { status: 500 }
    );
  }
}

// DELETE - Remover evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectMongo();
    
    const { id } = await params;
    const evento = await EventoTroca.findByIdAndDelete(id);
    
    if (!evento) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Evento removido com sucesso" });
  } catch (error: any) {
    console.error("Erro ao deletar evento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar evento" },
      { status: 500 }
    );
  }
}