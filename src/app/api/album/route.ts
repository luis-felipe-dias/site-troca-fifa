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

    // Buscar o _id do usuário
    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id").lean();
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    const userId = usuario._id;

    // Buscar todas as figurinhas
    const todasFigurinhas = await Figurinha.find({}).sort({ pagina: 1, codigo: 1 }).lean();

    // Buscar as figurinhas do usuário
    const userFigurinhas = await UsuarioFigurinha.find({ userId: userId }).lean();

    // Criar mapa de figurinhas do usuário
    const userMap = new Map();
    userFigurinhas.forEach((uf) => {
      userMap.set(uf.codigo, uf);
    });

    // Combinar dados
    const stickers = todasFigurinhas.map((fig) => {
      const userFig = userMap.get(fig.codigo);
      return {
        codigo: fig.codigo,
        pagina: fig.pagina,
        nomeSelecao: fig.nomeSelecao,
        possui: userFig?.possui || false,
        repetida: userFig?.repetida || false,
        quantidadeRepetida: userFig?.quantidadeRepetida || 0
      };
    });

    return NextResponse.json({ stickers });
  } catch (error: any) {
    console.error("Erro ao carregar álbum:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao carregar álbum" },
      { status: 500 }
    );
  }
}