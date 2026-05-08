import mongoose, { Schema, type Model } from "mongoose";

export type UsuarioFigurinhaDoc = {
  userId: mongoose.Types.ObjectId;
  codigo: string;
  possui: boolean;
  repetida: boolean;
  quantidadeRepetida: number;
  updatedAt: Date;
};

const UsuarioFigurinhaSchema = new Schema<UsuarioFigurinhaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "Usuario", index: true },
    codigo: { type: String, required: true, index: true },
    possui: { type: Boolean, default: false },
    repetida: { type: Boolean, default: false },
    quantidadeRepetida: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const UsuarioFigurinha: Model<UsuarioFigurinhaDoc> =
  (mongoose.models.UsuarioFigurinha as Model<UsuarioFigurinhaDoc>) ||
  mongoose.model<UsuarioFigurinhaDoc>("UsuarioFigurinha", UsuarioFigurinhaSchema, "usuarioFigurinhas");