import { cookies } from "next/headers";
import { jsonOk } from "@/lib/http";

export async function POST() {
  cookies().set("token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return jsonOk({});
}

