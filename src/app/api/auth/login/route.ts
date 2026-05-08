import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { connectMongo } from "@/lib/db";
import { Usuario } from "@/models/Usuario";
import { signJwt } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Body recebido:", body);
    
    // Aceitar tanto 'yupIdOuEmail' quanto 'email'
    const identificador = body.yupIdOuEmail || body.email;
    const senha = body.senha;

    console.log("Identificador:", identificador);
    console.log("Senha presente:", !!senha);

    if (!identificador || !senha) {
      return NextResponse.json(
        { error: "Email/YupID e senha são obrigatórios" },
        { status: 400 }
      );
    }

    await connectMongo();

    // Buscar usuário por yupId ou email
    const usuario = await Usuario.findOne({
      $or: [{ yupId: identificador }, { email: identificador }]
    });

    if (!usuario) {
      console.log("Usuário não encontrado:", identificador);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    console.log("Usuário encontrado:", usuario.yupId);

    // Validar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      console.log("Senha inválida");
      return NextResponse.json(
        { error: "Senha inválida" },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = signJwt({
      sub: usuario.yupId,
      role: usuario.role,
      yupId: usuario.yupId
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return NextResponse.json({
      ok: true,
      usuario: {
        yupId: usuario.yupId,
        role: usuario.role
      }
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}