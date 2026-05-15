import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Figurinha } from "@/models/Figurinha";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Usuario } from "@/models/Usuario";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    const userId = usuario._id;

    // Buscar todas as figurinhas do sistema
    const todasFigurinhas = await Figurinha.find().sort({ pagina: 1, codigo: 1 }).lean();
    
    // Buscar as figurinhas do usuário
    const minhasFigurinhas = await UsuarioFigurinha.find({ userId }).lean();
    
    // Criar mapa para acesso rápido
    const minhasFigurinhasMap = new Map();
    minhasFigurinhas.forEach(f => {
      minhasFigurinhasMap.set(f.codigo, {
        possui: f.possui,
        repetida: f.repetida,
        quantidade: f.quantidade || 1
      });
    });

    // Estatísticas
    let tenho = 0;
    let repetidas = 0;
    let totalFigurinhasPossuoQuantidade = 0;

    // Montar array de figurinhas com status
    const stickers = todasFigurinhas.map(f => {
      const minhaFig = minhasFigurinhasMap.get(f.codigo);
      const possui = minhaFig?.possui || false;
      const repetida = minhaFig?.repetida || false;
      const quantidade = minhaFig?.quantidade || (possui ? 1 : 0);
      
      if (possui) {
        tenho++;
        totalFigurinhasPossuoQuantidade += quantidade;
        if (repetida) {
          repetidas++;
        }
      }
      
      return {
        codigo: f.codigo,
        pagina: f.pagina,
        nomeSelecao: f.nomeSelecao,
        possui: possui,
        repetida: repetida,
        quantidadeRepetida: quantidade > 1 ? quantidade : 0
      };
    });

    const totalFigurinhas = todasFigurinhas.length;
    const faltam = totalFigurinhas - tenho;

    return NextResponse.json({
      stickers,
      total: totalFigurinhas,
      tenho,
      faltam,
      repetidas,
      totalFigurinhasPossuoQuantidade
    });
    
  } catch (error: any) {
    console.error("Erro ao carregar álbum:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}