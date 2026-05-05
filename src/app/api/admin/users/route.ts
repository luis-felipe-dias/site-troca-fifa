import { connectMongo } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    await connectMongo();

    const usuarios = await Usuario.find()
      .sort({ createdAt: -1 })
      .select("yupId email cidade role senhaTemporaria createdAt");

    return jsonOk({
      usuarios: usuarios.map((u) => ({
        id: String(u._id),
        yupId: u.yupId,
        email: u.email,
        cidade: u.cidade,
        role: u.role,
        senhaTemporaria: u.senhaTemporaria,
        createdAt: u.createdAt
      }))
    });
  } catch (err: any) {
    if (String(err?.message || "") === "UNAUTHORIZED") return jsonError("Não autenticado", 401);
    if (String(err?.message || "") === "FORBIDDEN") return jsonError("Sem permissão", 403);
    return jsonError("Erro", 500);
  }
}

