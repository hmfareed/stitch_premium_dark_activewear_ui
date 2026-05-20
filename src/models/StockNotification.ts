import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockNotification extends Document {
  productId: string;
  userEmail: string;
  isNotified: boolean;
  createdAt: Date;
}

const StockNotificationSchema: Schema<IStockNotification> = new Schema({
  productId: { type: String, required: true },
  userEmail: { type: String, required: true },
  isNotified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to prevent duplicate notifications for same user/product
StockNotificationSchema.index({ productId: 1, userEmail: 1 }, { unique: true });

export const StockNotification: Model<IStockNotification> = mongoose.models.StockNotification || mongoose.model<IStockNotification>('StockNotification', StockNotificationSchema);
