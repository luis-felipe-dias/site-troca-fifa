import mongoose, { Schema, type Model, type Types } from "mongoose";

export type UsuarioFigurinhaDoc = {
  userId: Types.ObjectId;
  codigo: string;
  possui: boolean;
  repetida: boolean;
  quantidadeRepetida: number;
  updatedAt: Date;
};

const UsuarioFigurinhaSchema = new Schema<UsuarioFigurinhaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Usuario" },
    codigo: { type: String, required: true, index: true },
    possui: { type: Boolean, required: true, default: false },
    repetida: { type: Boolean, required: true, default: false },
    quantidadeRepetida: { type: Number, required: true, default: 0, min: 0 }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

UsuarioFigurinhaSchema.index({ userId: 1, codigo: 1 }, { unique: true });

export const UsuarioFigurinha: Model<UsuarioFigurinhaDoc> =
  (mongoose.models.UsuarioFigurinha as Model<UsuarioFigurinhaDoc>) ||
  mongoose.model<UsuarioFigurinhaDoc>("UsuarioFigurinha", UsuarioFigurinhaSchema, "usuarioFigurinhas");

