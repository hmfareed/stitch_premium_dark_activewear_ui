import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductQA extends Document {
  productId: string;
  question: string;
  questionerEmail: string;
  questionerName: string;
  answer?: string;
  answeredByEmail?: string;
  answeredByName?: string;
  answeredAt?: Date;
  helpful: number;
  createdAt: Date;
}

const ProductQASchema: Schema<IProductQA> = new Schema({
  productId:       { type: String, required: true, index: true },
  question:        { type: String, required: true },
  questionerEmail: { type: String, required: true },
  questionerName:  { type: String, required: true },
  answer:          { type: String },
  answeredByEmail: { type: String },
  answeredByName:  { type: String },
  answeredAt:      { type: Date },
  helpful:         { type: Number, default: 0 },
  createdAt:       { type: Date, default: Date.now },
});

export const ProductQA: Model<IProductQA> =
  mongoose.models.ProductQA || mongoose.model<IProductQA>('ProductQA', ProductQASchema);
