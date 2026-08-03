import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupplier extends Document {
  supplierId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  category: string;
  rating: number;
  createdAt: Date;
}

const SupplierSchema: Schema<ISupplier> = new Schema({
  supplierId:  { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true },
  contactName: { type: String, required: true },
  phone:       { type: String, required: true },
  email:       { type: String, required: true },
  city:        { type: String, default: 'Accra' },
  category:    { type: String, default: 'General Supplies' },
  rating:      { type: Number, default: 4.8 },
  createdAt:   { type: Date, default: Date.now },
});

export const Supplier: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
