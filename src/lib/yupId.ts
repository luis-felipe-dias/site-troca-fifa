import { Usuario } from "@/models/Usuario";

export async function gerarYupId() {
  // yup-000000 (6 dígitos)
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(Math.random() * 1_000_000);
    const yupId = `yup-${String(num).padStart(6, "0")}`;
    const exists = await Usuario.exists({ yupId });
    if (!exists) return yupId;
  }
  throw new Error("Não foi possível gerar yupId");
}

