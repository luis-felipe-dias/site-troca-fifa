import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { jsonError, jsonOk } from "@/lib/http";

const Schema = z.object({
  codigo: z.string().min(2),
  possui: z.boolean(),
  repetida: z.boolean(),
  quantidadeRepetida: z.number().int().min(0).optional()
});

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const data = Schema.parse(body);

    await connectMongo();
    const quantidade = Math.max(0, data.quantidadeRepetida ?? (data.repetida ? 1 : 0));
    await UsuarioFigurinha.updateOne(
      { userId: payload.sub, codigo: data.codigo },
      {
        $set: {
          possui: data.possui,
          repetida: data.possui ? data.repetida : false,
          quantidadeRepetida: data.possui && data.repetida ? quantidade : 0
        }
      },
      { upsert: true }
    );

    return jsonOk({});
  } catch (err: any) {
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro", 500);
  }
}

