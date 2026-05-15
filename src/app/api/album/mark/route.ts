import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Usuario } from "@/models/Usuario";

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    const userId = usuario._id;

    const body = await req.json();
    const { codigo, possui, repetida, quantidadeRepetida } = body;

    if (!codigo) {
      return NextResponse.json({ error: "Código da figurinha é obrigatório" }, { status: 400 });
    }

    console.log("=== MARCAÇÃO DE FIGURINHA ===");
    console.log("Usuário:", userId);
    console.log("Código:", codigo);
    console.log("Possui:", possui);
    console.log("Repetida:", repetida);
    console.log("QuantidadeRepetida:", quantidadeRepetida);

    const existing = await UsuarioFigurinha.findOne({ userId, codigo });

    if (!possui) {
      // REMOVER FIGURINHA
      if (existing) {
        await UsuarioFigurinha.deleteOne({ userId, codigo });
        console.log(`Figurinha ${codigo} removida do usuário`);
      }
      return NextResponse.json({ 
        ok: true, 
        message: "Figurinha removida",
        data: { codigo, possui: false, repetida: false, quantidade: 0 }
      });
    }

    // POSSUI = true
    // Lógica CORRETA:
    // - Se marcou como "Tenho" (não repetida) → quantidade = 1, repetida = false
    // - Se marcou como "Repetida" → quantidade = quantidadeRepetida, repetida = true
    let quantidade = 1;
    let novaRepetida = false;

    if (repetida && quantidadeRepetida && quantidadeRepetida > 0) {
      quantidade = quantidadeRepetida;
      novaRepetida = true;
    } else if (repetida) {
      quantidade = 2; // Padrão: 1 original + 1 repetida
      novaRepetida = true;
    } else {
      quantidade = 1;
      novaRepetida = false;
    }

    console.log(`Quantidade final: ${quantidade}, Repetida: ${novaRepetida}`);

    if (existing) {
      // ATUALIZAR EXISTENTE
      const updated = await UsuarioFigurinha.findOneAndUpdate(
        { userId, codigo },
        { 
          $set: { 
            possui: true,
            repetida: novaRepetida,
            quantidade: quantidade
          }
        },
        { new: true }
      );
      return NextResponse.json({ 
        ok: true, 
        message: "Figurinha atualizada",
        data: updated 
      });
    } else {
      // CRIAR NOVO
      const newSticker = await UsuarioFigurinha.create({
        userId,
        codigo,
        possui: true,
        repetida: novaRepetida,
        quantidade: quantidade
      });
      return NextResponse.json({ 
        ok: true, 
        message: "Figurinha adicionada",
        data: newSticker 
      });
    }

  } catch (error: any) {
    console.error("Erro ao marcar figurinha:", error);
    return NextResponse.json({ error: "Erro interno: " + error.message }, { status: 500 });
  }
}