import mongoose, { Schema, type Model } from "mongoose";

export type EventoTrocaDoc = {
  titulo: string;
  descricao?: string;
  dataInicio: Date;
  dataFim: Date;
  localNome: string;
  localUrl: string;
  localPreset?: string;
  ativo: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

const EventoTrocaSchema = new Schema<EventoTrocaDoc>(
  {
    titulo: { type: String, required: true },
    descricao: { type: String },
    dataInicio: { type: Date, required: true },
    dataFim: { type: Date, required: true },
    localNome: { type: String, required: true },
    localUrl: { type: String, required: true },
    localPreset: { type: String },
    ativo: { type: Boolean, default: true },
    createdBy: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const EventoTroca: Model<EventoTrocaDoc> =
  (mongoose.models.EventoTroca as Model<EventoTrocaDoc>) ||
  mongoose.model<EventoTrocaDoc>("EventoTroca", EventoTrocaSchema, "eventos_troca");