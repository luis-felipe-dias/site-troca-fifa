import mongoose, { Schema, type Model, type Types } from "mongoose";

export type TrocaStatus = "pendente" | "aceito" | "recusado";

export type TrocaDoc = {
  userA: Types.ObjectId;
  userB: Types.ObjectId;
  figurinhaA: string;
  figurinhaB: string;
  status: TrocaStatus;
  eventoId?: Types.ObjectId; // NOVO: evento de troca vinculado
  dataTroca?: string;
  localTroca?: string;
  createdAt: Date;
};

const TrocaSchema = new Schema<TrocaDoc>(
  {
    userA: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Usuario" },
    userB: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Usuario" },
    figurinhaA: { type: String, required: true },
    figurinhaB: { type: String, required: true },
    status: { type: String, enum: ["pendente", "aceito", "recusado"], default: "pendente", index: true },
    eventoId: { type: Schema.Types.ObjectId, ref: "EventoTroca", index: true }, // NOVO
    dataTroca: { type: String },
    localTroca: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Troca: Model<TrocaDoc> =
  (mongoose.models.Troca as Model<TrocaDoc>) || mongoose.model<TrocaDoc>("Troca", TrocaSchema, "trocas");