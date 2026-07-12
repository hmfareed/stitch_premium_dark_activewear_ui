import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  id: string;
  name: string;
  description: string;
  discountValue: number; // Flat discount % to apply, e.g. 15 for 15% off
  bannerGradient: string; // e.g., "linear-gradient(135deg, #FF416C, #FF4B2B)"
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  createdAt: Date;
}

const CampaignSchema: Schema<ICampaign> = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  discountValue: { type: Number, required: true, default: 10 },
  bannerGradient: { type: String, default: 'linear-gradient(135deg, #FF416C, #FF4B2B)' },
  status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Campaign: Model<ICampaign> = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
