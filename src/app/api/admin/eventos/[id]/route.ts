import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-request";
import { EventoTroca } from "@/models/EventoTroca";
import mongoose from "mongoose";

// GET - Buscar evento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectMongo();
    
    const { id } = await params;
    
    // Valida se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }
    
    const evento = await EventoTroca.findById(id);
    
    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(evento);
  } catch (error: any) {
    console.error("Erro ao buscar evento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar evento" },
      { status: 500 }
    );
  }
}

// PUT - Editar evento existente (CORRIGIDO - SEM CONVERSÃO DE FUSO)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectMongo();
    
    const { id } = await params;
    
    // Valida se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { titulo, descricao, dataInicio, dataFim, localNome, localUrl, localPreset, ativo } = body;
    
    // Validações
    if (!titulo || !dataInicio || !dataFim || !localNome || !localUrl) {
      return NextResponse.json(
        { error: "Campos obrigatórios: titulo, dataInicio, dataFim, localNome, localUrl" },
        { status: 400 }
      );
    }
    
    // CRIA AS DATAS DIRETAMENTE (SEM CONVERSÃO DE FUSO)
    const dataInicioDate = new Date(dataInicio);
    const dataFimDate = new Date(dataFim);
    
    // Validação: dataInicio deve ser antes de dataFim
    if (dataInicioDate >= dataFimDate) {
      return NextResponse.json(
        { error: "A data de início deve ser anterior à data de fim" },
        { status: 400 }
      );
    }
    
    const evento = await EventoTroca.findByIdAndUpdate(
      id,
      {
        titulo,
        descricao,
        dataInicio: dataInicioDate,
        dataFim: dataFimDate,
        localNome,
        localUrl,
        localPreset,
        ativo: ativo !== undefined ? ativo : true
      },
      { new: true, runValidators: true }
    );
    
    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
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

// DELETE - Remover evento (CORRIGIDO)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectMongo();
    
    const { id } = await params;
    
    // Valida se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }
    
    const evento = await EventoTroca.findByIdAndDelete(id);
    
    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: "Evento removido com sucesso",
      id: id 
    });
  } catch (error: any) {
    console.error("Erro ao deletar evento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar evento" },
      { status: 500 }
    );
  }
}