import jwt from "jsonwebtoken";

export type JwtPayload = {
  sub: string;
  role?: "user" | "admin";
  yupId: string;
};

export function signJwt(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não definido");
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyJwt(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não definido");
  return jwt.verify(token, secret) as JwtPayload;
}

