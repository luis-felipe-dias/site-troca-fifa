import mongoose, { Schema, type Model, type Types } from "mongoose";

export type TrocaStatus = "pendente" | "aceito" | "recusado" | "finalizado";

export type TrocaDoc = {
  userA: Types.ObjectId;
  userB: Types.ObjectId;
  figurinhaA: string;
  figurinhaB: string;
  status: TrocaStatus;
  eventoId?: Types.ObjectId;
  dataTroca?: string;
  localTroca?: string;
  reservadaA: boolean;     // Se a figurinhaA do userA está reservada
  reservadaB: boolean;     // Se a figurinhaB do userB está reservada
  finalizadaEm?: Date;     // Data da finalização
  createdAt: Date;
};

const TrocaSchema = new Schema<TrocaDoc>(
  {
    userA: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Usuario" },   
    userB: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Usuario" },   
    figurinhaA: { type: String, required: true },
    figurinhaB: { type: String, required: true },
    status: { type: String, enum: ["pendente", "aceito", "recusado", "finalizado"], default: "pendente", index: true },
    eventoId: { type: Schema.Types.ObjectId, ref: "EventoTroca", index: true },
    dataTroca: { type: String },
    localTroca: { type: String },
    reservadaA: { type: Boolean, default: false },
    reservadaB: { type: Boolean, default: false },
    finalizadaEm: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Troca: Model<TrocaDoc> =
  (mongoose.models.Troca as Model<TrocaDoc>) || mongoose.model<TrocaDoc>("Troca", TrocaSchema, "trocas");