import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";

export async function getBearerTokenFromCookies() {
  const jar = await cookies();
  return jar.get("token")?.value || null;
}

export async function requireAuth() {
  const token = await getBearerTokenFromCookies();
  if (!token) throw new Error("UNAUTHORIZED");
  const payload = verifyJwt(token);
  
  // GARANTIR que NUNCA retorna nome real
  if (payload && 'nomeCompleto' in payload) {
    delete (payload as any).nomeCompleto;
  }
  if (payload && 'nome' in payload) {
    delete (payload as any).nome;
  }
  
  return payload;
}

export async function requireAdmin() {
  const payload = await requireAuth();
  if (payload.role !== "admin") throw new Error("FORBIDDEN");
  return payload;
}