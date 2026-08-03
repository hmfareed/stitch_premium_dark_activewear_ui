import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliveryPartner extends Document {
  partnerId: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  apiIntegration: boolean;
  rating: number;
  isActive: boolean;
  createdAt: Date;
}

const DeliveryPartnerSchema: Schema<IDeliveryPartner> = new Schema({
  partnerId:      { type: String, required: true, unique: true, index: true },
  name:           { type: String, required: true },
  contactEmail:   { type: String, required: true },
  contactPhone:   { type: String, required: true },
  apiIntegration: { type: Boolean, default: true },
  rating:         { type: Number, default: 4.8 },
  isActive:       { type: Boolean, default: true, index: true },
  createdAt:      { type: Date, default: Date.now },
});

export const DeliveryPartner: Model<IDeliveryPartner> =
  mongoose.models.DeliveryPartner || mongoose.model<IDeliveryPartner>('DeliveryPartner', DeliveryPartnerSchema);
