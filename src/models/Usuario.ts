import mongoose, { Schema, type Model } from "mongoose";

export type UsuarioRole = "user" | "admin";

export type UsuarioDoc = {
  yupId: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  dataNascimento: Date;
  cidade: string;
  senhaHash: string;
  senhaTemporaria: boolean;
  role: UsuarioRole;
  createdAt: Date;
};

const UsuarioSchema = new Schema<UsuarioDoc>(
  {
    // sparse ajuda quando a collection `usuarios` já existe e contém documentos legados sem `yupId/email`
    yupId: { type: String, required: true, unique: true, index: true, sparse: true },
    nomeCompleto: { type: String, required: true },
    cpf: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, sparse: true },
    dataNascimento: { type: Date, required: true },
    cidade: { type: String, required: true },
    senhaHash: { type: String, required: true },
    senhaTemporaria: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Usuario: Model<UsuarioDoc> =
  (mongoose.models.Usuario as Model<UsuarioDoc>) || mongoose.model<UsuarioDoc>("Usuario", UsuarioSchema, "usuarios");

