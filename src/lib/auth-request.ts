import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/jwt";

export async function getBearerTokenFromCookies() {
  const jar = await cookies();
  return jar.get("token")?.value || null;
}

export async function requireAuth() {
  const token = await getBearerTokenFromCookies();
  if (!token) throw new Error("UNAUTHORIZED");
  return verifyJwt(token);
}

export async function requireAdmin() {
  const payload = await requireAuth();
  if (payload.role !== "admin") throw new Error("FORBIDDEN");
  return payload;
}

