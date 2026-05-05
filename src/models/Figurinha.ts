import mongoose, { Schema, type Model } from "mongoose";

export type FigurinhaDoc = {
  codigo: string;
  pagina: number;
  nomeSelecao: string;
  createdAt: Date;
};

const FigurinhaSchema = new Schema<FigurinhaDoc>(
  {
    codigo: { type: String, required: true, unique: true, index: true },
    pagina: { type: Number, required: true, index: true },
    nomeSelecao: { type: String, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Figurinha: Model<FigurinhaDoc> =
  (mongoose.models.Figurinha as Model<FigurinhaDoc>) ||
  mongoose.model<FigurinhaDoc>("Figurinha", FigurinhaSchema, "figurinhas");

