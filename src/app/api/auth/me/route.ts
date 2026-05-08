import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import { connectMongo } from "@/lib/db";
import { Usuario } from "@/models/Usuario";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    await connectMongo();
    const usuario = await Usuario.findOne({ yupId: payload.sub })
      .select("yupId role cidade nomeCompleto email")
      .lean();

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        yupId: usuario.yupId,
        role: usuario.role,
        cidade: usuario.cidade,
        nomeCompleto: usuario.nomeCompleto,
        email: usuario.email
      }
    });
  } catch (error: any) {
    console.error("Erro no /me:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}