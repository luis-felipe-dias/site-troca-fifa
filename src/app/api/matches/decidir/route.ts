import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Troca } from "@/models/Troca";
import { jsonError, jsonOk } from "@/lib/http";

const Schema = z.object({
  id: z.string().min(10),
  status: z.enum(["aceito", "recusado"])
});

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const data = Schema.parse(body);

    await connectMongo();
    const troca = await Troca.findById(data.id);
    if (!troca) return jsonError("Troca não encontrada", 404);

    if (String(troca.userB) !== payload.sub) return jsonError("Sem permissão", 403);
    if (troca.status !== "pendente") return jsonError("Troca já foi decidida", 409);

    troca.status = data.status;
    await troca.save();

    return jsonOk({});
  } catch (err: any) {
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro", 500);
  }
}

