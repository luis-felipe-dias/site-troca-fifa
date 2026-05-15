// src/lib/fix-repetidas.ts
import { connectMongo } from "./db";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";

export async function fixRepetidas() {
  try {
    await connectMongo();
    console.log("=== CORRIGINDO FIGURINHAS REPETIDAS ===");

    // Buscar todas as figurinhas com repetida = true mas quantidade < 2
    const inconsistentes = await UsuarioFigurinha.find({
      repetida: true,
      quantidade: { $lt: 2 }
    });

    console.log(`Encontradas ${inconsistentes.length} figurinhas inconsistentes`);

    let corrigidas = 0;
    for (const fig of inconsistentes) {
      // Se repetida = true mas quantidade = 1, significa que o usuário tem 1 normal + 1 repetida = total 2
      if (fig.quantidade === 1) {
        await UsuarioFigurinha.updateOne(
          { _id: fig._id },
          { $set: { quantidade: 2 } }
        );
        console.log(`Corrigido: ${fig.codigo} - quantidade 1 -> 2`);
        corrigidas++;
      }
    }

    console.log(`✅ Total corrigido: ${corrigidas} figurinhas`);
    return { corrigidas };
  } catch (error) {
    console.error("Erro ao corrigir repetidas:", error);
    return { error };
  }
}