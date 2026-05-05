import { connectMongo } from "@/lib/db";
import { requireAuth } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const payload = await requireAuth();
    await connectMongo();

    const usuario = await Usuario.findById(payload.sub).select("yupId role senhaTemporaria createdAt");
    if (!usuario) return jsonError("Usuário não encontrado", 404);

    return jsonOk({
      usuario: {
        id: String(usuario._id),
        yupId: usuario.yupId,
        role: usuario.role,
        senhaTemporaria: usuario.senhaTemporaria,
        createdAt: usuario.createdAt
      }
    });
  } catch (err: any) {
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    return jsonError("Erro", 500);
  }
}

