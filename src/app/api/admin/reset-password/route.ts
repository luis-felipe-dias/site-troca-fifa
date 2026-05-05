import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { hashSenha } from "@/lib/crypto";
import { jsonError, jsonOk } from "@/lib/http";

const Schema = z.object({
  userId: z.string().min(10),
  senhaTemporaria: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = Schema.parse(body);

    await connectMongo();
    const senhaHash = await hashSenha(data.senhaTemporaria);
    const usuario = await Usuario.findByIdAndUpdate(
      data.userId,
      { senhaHash, senhaTemporaria: true },
      { new: true }
    ).select("yupId email");

    if (!usuario) return jsonError("Usuário não encontrado", 404);

    return jsonOk({ usuario: { id: String(usuario._id), yupId: usuario.yupId, email: usuario.email } });
  } catch (err: any) {
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    if (String(err?.message || "") === "FORBIDDEN") return jsonError("Sem permissão", 403);
    return jsonError("Erro", 500);
  }
}

