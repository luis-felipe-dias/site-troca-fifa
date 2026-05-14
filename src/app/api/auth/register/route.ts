import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/db";
import { Usuario } from "@/models/Usuario";
import { z } from "zod";

// Schema de validação
const RegisterSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  cpf: z.string().min(11, "CPF inválido"),
  email: z.string().email("E-mail inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

// Gerar yupId sequencial (yup-100001, yup-100002, ...)
async function gerarYupId(): Promise<string> {
  // Buscar o último usuário criado
  const ultimoUsuario = await Usuario.findOne()
    .sort({ createdAt: -1 })
    .select("yupId")
    .lean();
  
  let numero = 400001; // Número inicial
  
  if (ultimoUsuario && ultimoUsuario.yupId) {
    const match = ultimoUsuario.yupId.match(/\d+/);
    if (match) {
      numero = parseInt(match[0], 10) + 1;
    }
  }
  
  const yupId = `yup-${numero}`;
  return yupId;
}

// Converter data DD/MM/YYYY para Date
function parseDataNascimento(dataStr: string): Date {
  const partes = dataStr.split("/");
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const ano = parseInt(partes[2], 10);
    return new Date(ano, mes, dia);
  }
  return new Date(dataStr);
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    
    const body = await request.json();
    console.log("Body recebido:", body);
    
    // Validar dados
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map(issue => issue.message);
      console.log("Erro de validação:", errors);
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }
    
    const { nomeCompleto, cpf, email, dataNascimento, cidade, senha } = result.data;
    
    // Verificar se e-mail já existe
    const emailExiste = await Usuario.findOne({ email });
    if (emailExiste) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
    }
    
    // Verificar se CPF já existe
    const cpfExiste = await Usuario.findOne({ cpf });
    if (cpfExiste) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 400 });
    }
    
    // Gerar yupId sequencial
    const yupId = await gerarYupId();
    console.log("yupId gerado:", yupId);
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    // Criar usuário
    const usuario = await Usuario.create({
      yupId,
      nomeCompleto,
      cpf,
      email,
      dataNascimento: parseDataNascimento(dataNascimento),
      cidade,
      senhaHash,
      senhaTemporaria: false,
      role: "user"
    });
    
    console.log("Usuário criado com sucesso:", usuario.yupId);
    
    return NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso!",
      usuario: {
        id: usuario._id,
        yupId: usuario.yupId,
        email: usuario.email,
        nomeCompleto: usuario.nomeCompleto
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: "Erro interno do servidor: " + error.message }, { status: 500 });
  }
}