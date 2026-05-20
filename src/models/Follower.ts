import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFollower extends Document {
  vendorEmail: string;
  userEmail: string;
  userName?: string;
  createdAt: Date;
}

const FollowerSchema: Schema<IFollower> = new Schema({
  vendorEmail: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Ensure unique following relation
FollowerSchema.index({ vendorEmail: 1, userEmail: 1 }, { unique: true });

export const Follower: Model<IFollower> = mongoose.models.Follower || mongoose.model<IFollower>('Follower', FollowerSchema);
