import mongoose, { Schema, type Model, type Types } from "mongoose";

export type NotificacaoTipo = "solicitacao_troca" | "troca_aceita" | "troca_recusada";

export type NotificacaoDoc = {
  userId: Types.ObjectId;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  dados: {
    trocaId?: string;
    usuarioId?: string;
    usuarioYupId?: string;
    figurinhaA?: string;
    figurinhaB?: string;
  };
  lida: boolean;
  createdAt: Date;
};

const NotificacaoSchema = new Schema<NotificacaoDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Usuario" },
    tipo: { type: String, required: true, enum: ["solicitacao_troca", "troca_aceita", "troca_recusada"] },
    titulo: { type: String, required: true },
    mensagem: { type: String, required: true },
    dados: {
      trocaId: { type: String },
      usuarioId: { type: String },
      usuarioYupId: { type: String },
      figurinhaA: { type: String },
      figurinhaB: { type: String }
    },
    lida: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notificacao: Model<NotificacaoDoc> =
  (mongoose.models.Notificacao as Model<NotificacaoDoc>) ||
  mongoose.model<NotificacaoDoc>("Notificacao", NotificacaoSchema, "notificacoes");