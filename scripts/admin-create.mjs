import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI não definido");
  process.exit(1);
}

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

const email = (arg("email") || "").toLowerCase().trim();
const senha = arg("senha") || "";
const cidade = arg("cidade") || "—";
const nomeCompleto = arg("nome") || "Administrador";
const cpf = arg("cpf") || "00000000000";
const dataNascimento = arg("nascimento") || "01/01/1990";

if (!email || !senha) {
  console.error('Uso: npm run admin:create -- --email "email@dominio" --senha "senha" [--cidade "Cidade"]');
  process.exit(1);
}

function parseDateBR(input) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(input).trim());
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function gerarYupIdSync() {
  const num = Math.floor(Math.random() * 1_000_000);
  return `yup-${String(num).padStart(6, "0")}`;
}

const UsuarioSchema = new mongoose.Schema(
  {
    yupId: { type: String, required: true, unique: true, index: true, sparse: true },
    nomeCompleto: { type: String, required: true },
    cpf: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, sparse: true },
    dataNascimento: { type: Date, required: true },
    cidade: { type: String, required: true },
    senhaHash: { type: String, required: true },
    senhaTemporaria: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "admin" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Usuario = mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema, "usuarios");

await mongoose.connect(MONGODB_URI, { dbName: "troca_figuras" });

const existing = await Usuario.findOne({ email });
const senhaHash = await bcrypt.hash(senha, 12);
const nascimento = parseDateBR(dataNascimento) || new Date(1990, 0, 1);

if (existing) {
  existing.role = "admin";
  existing.senhaHash = senhaHash;
  existing.senhaTemporaria = false;
  await existing.save();
  console.log("Admin atualizado:", { id: String(existing._id), email });
} else {
  // tenta algumas vezes evitar colisão de yupId
  let yupId = gerarYupIdSync();
  for (let i = 0; i < 10; i++) {
    const existsY = await Usuario.exists({ yupId });
    if (!existsY) break;
    yupId = gerarYupIdSync();
  }
  const created = await Usuario.create({
    yupId,
    nomeCompleto,
    cpf,
    email,
    dataNascimento: nascimento,
    cidade,
    senhaHash,
    senhaTemporaria: false,
    role: "admin"
  });
  console.log("Admin criado:", { id: String(created._id), email, yupId });
}

await mongoose.disconnect();

