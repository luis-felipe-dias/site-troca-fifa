import { z } from "zod";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/db";
import { Usuario } from "@/models/Usuario";
import { verificarSenha } from "@/lib/crypto";
import { signJwt } from "@/lib/jwt";
import { jsonError, jsonOk } from "@/lib/http";

const Schema = z.object({
  email: z.string().email(),
  senha: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = Schema.parse(body);

    await connectMongo();
    const usuario = await Usuario.findOne({ email: data.email.toLowerCase().trim() });
    if (!usuario) return jsonError("Credenciais inválidas", 401);

    const ok = await verificarSenha(data.senha, usuario.senhaHash);
    if (!ok) return jsonError("Credenciais inválidas", 401);

    const token = signJwt({
      sub: String(usuario._id),
      role: usuario.role,
      yupId: usuario.yupId
    });

    cookies().set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    return jsonOk({
      usuario: { id: String(usuario._id), yupId: usuario.yupId, senhaTemporaria: usuario.senhaTemporaria }
    });
  } catch (err: any) {
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    return jsonError("Erro ao logar", 500);
  }
}

