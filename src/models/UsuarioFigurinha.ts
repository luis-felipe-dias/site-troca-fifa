import mongoose, { Schema, type Model } from "mongoose";

export type UsuarioFigurinhaDoc = {
  userId: mongoose.Types.ObjectId;
  codigo: string;
  possui: boolean;        // true = tem a figurinha (se false, não existe no banco)
  repetida: boolean;      // true = tem mais de 1 (só faz sentido se possui = true)
  quantidade: number;     // Número total de cópias (1 = normal, >1 = repetida)
  updatedAt: Date;
};

// Índice composto para buscas rápidas
const UsuarioFigurinhaSchema = new Schema<UsuarioFigurinhaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "Usuario", index: true },
    codigo: { type: String, required: true, index: true },
    possui: { type: Boolean, required: true, default: true },
    repetida: { type: Boolean, required: true, default: false },
    quantidade: { type: Number, required: true, default: 1, min: 1 }
  },
  { 
    timestamps: { createdAt: false, updatedAt: true },
    // Garantir que não haja duplicatas (userId + codigo)
    indexes: [
      { userId: 1, codigo: 1, unique: true }
    ]
  }
);

export const UsuarioFigurinha: Model<UsuarioFigurinhaDoc> =
  (mongoose.models.UsuarioFigurinha as Model<UsuarioFigurinhaDoc>) ||     
  mongoose.model<UsuarioFigurinhaDoc>("UsuarioFigurinha", UsuarioFigurinhaSchema, "usuarioFigurinhas");