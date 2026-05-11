import { z } from "zod";
import { connectMongo } from "@/lib/db";
import { Usuario } from "@/models/Usuario";
import { calcularIdade } from "@/lib/idade";
import { parseDateBR } from "@/lib/date-br";
import { gerarYupId } from "@/lib/yupId";
import { hashSenha } from "@/lib/crypto";
import { jsonError, jsonOk } from "@/lib/http";

const Schema = z.object({
  nomeCompleto: z.string().min(3),
  cpf: z.string().min(11),
  email: z.string().email(),
  dataNascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use dd/mm/aaaa"),
  cidade: z.string().min(2),
  senha: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = Schema.parse(body);

    const dataNascimento = parseDateBR(data.dataNascimento);
    if (!dataNascimento) return jsonError("Data de nascimento inválida (use dd/mm/aaaa)", 400);
    
    // ✅ ALTERAR ESTA LINHA: mudar de 18 para 14
    if (calcularIdade(dataNascimento) < 14) return jsonError("É necessário ser maior de 14 anos", 400);

    await connectMongo();

    const exists = await Usuario.exists({ email: data.email.toLowerCase().trim() });
    if (exists) return jsonError("Email já cadastrado", 409);

    const yupId = await gerarYupId();
    const senhaHash = await hashSenha(data.senha);

    const usuario = await Usuario.create({
      yupId,
      nomeCompleto: data.nomeCompleto.trim(),
      cpf: data.cpf.trim(),
      email: data.email.toLowerCase().trim(),
      dataNascimento,
      cidade: data.cidade.trim(),
      senhaHash,
      senhaTemporaria: false,
      role: "user"
    });

    return jsonOk({ usuario: { id: String(usuario._id), yupId: usuario.yupId } }, { status: 201 });
  } catch (err: any) {
    if (err?.name === "ZodError") return jsonError("Dados inválidos", 400, err.issues);
    const msg = String(err?.message || "");
    if (msg.includes("E11000")) return jsonError("Cadastro duplicado (email ou yupId)", 409);
    return jsonError("Erro ao registrar", 500, process.env.NODE_ENV === "development" ? { message: msg } : undefined);
  }
}