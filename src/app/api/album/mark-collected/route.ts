import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { jsonError, jsonOk } from "@/lib/http";

const MarkSchema = z.object({
  codigo: z.string().min(1),
  tipo: z.enum(["possui", "repetida"]),
  acao: z.enum(["adicionar", "remover"])
});

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const { codigo, tipo, acao } = MarkSchema.parse(body);

    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id");
    if (!usuario) return jsonError("Usuário não encontrado", 404);

    const userId = usuario._id;

    // Buscar registro existente
    let registro = await UsuarioFigurinha.findOne({ userId, codigo });

    if (acao === "adicionar") {
      if (tipo === "possui") {
        // Adicionar como "possui" (primeira cópia)
        if (!registro) {
          registro = await UsuarioFigurinha.create({
            userId,
            codigo,
            possui: true,
            repetida: false,
            quantidade: 1
          });
        } else if (!registro.possui) {
          registro.possui = true;
          registro.quantidade = 1;
          registro.repetida = false;
          await registro.save();
        } else if (registro.possui && !registro.repetida) {
          // Já tem 1, agora tem 2 -> vira repetida
          registro.repetida = true;
          registro.quantidade = 2;
          await registro.save();
        } else if (registro.repetida) {
          // Já é repetida, só incrementa
          registro.quantidade += 1;
          await registro.save();
        }
      } 
      else if (tipo === "repetida") {
        // Marcar explicitamente como repetida (para troca)
        if (!registro) {
          return jsonError("Você precisa ter a figurinha antes de marcar como repetida", 400);
        }
        if (!registro.possui) {
          return jsonError("Você não possui esta figurinha", 400);
        }
        registro.repetida = true;
        if (registro.quantidade < 2) registro.quantidade = 2;
        await registro.save();
      }
    } 
    else if (acao === "remover") {
      if (!registro) {
        return jsonError("Registro não encontrado", 404);
      }
      
      if (tipo === "possui") {
        // Remover completamente a figurinha
        await UsuarioFigurinha.deleteOne({ userId, codigo });
      } 
      else if (tipo === "repetida") {
        // Remover marcação de repetida (voltar para 1 cópia)
        if (registro.quantidade <= 1) {
          registro.repetida = false;
          registro.quantidade = 1;
        } else {
          registro.quantidade -= 1;
          if (registro.quantidade === 1) {
            registro.repetida = false;
          }
        }
        await registro.save();
      }
    }

    return jsonOk({ success: true, codigo, tipo, acao });
  } catch (err: any) {
    console.error("Erro ao marcar figurinha:", err);
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400);
    if (err?.message === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro interno", 500);
  }
}

// GET para buscar todas figurinhas do usuário
export async function GET(req: Request) {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findOne({ yupId: payload.sub }).select("_id");
    if (!usuario) return jsonError("Usuário não encontrado", 404);

    const minhasFigurinhas = await UsuarioFigurinha.find({ 
      userId: usuario._id,
      possui: true 
    }).select("codigo possui repetida quantidade").lean();

    return jsonOk({ figurinhas: minhasFigurinhas });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro interno", 500);
  }
}