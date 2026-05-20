import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  productId: string;
  orderId: string; // Ensure a user can only review once per order of a product
  customerName: string;
  customerEmail: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ReviewSchema: Schema<IReview> = new Schema({
  productId: { type: String, required: true },
  orderId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// A user can only leave one review per product per order
ReviewSchema.index({ productId: 1, orderId: 1, customerEmail: 1 }, { unique: true });

export const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
