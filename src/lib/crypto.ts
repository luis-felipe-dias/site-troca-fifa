import bcrypt from "bcryptjs";

export async function hashSenha(senha: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(senha, salt);
}

export async function verificarSenha(senha: string, senhaHash: string) {
  return bcrypt.compare(senha, senhaHash);
}

