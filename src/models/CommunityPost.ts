import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityComment {
  authorEmail: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  authorEmail: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  taggedProducts: string[];    // product IDs
  images?: string[];
  likes: string[];             // array of emails who liked
  comments: ICommunityComment[];
  isVerifiedSeller?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema({
  authorEmail: { type: String, required: true },
  authorName:  { type: String, required: true },
  text:        { type: String, required: true },
  createdAt:   { type: Date, default: Date.now },
}, { _id: true });

const CommunityPostSchema: Schema<ICommunityPost> = new Schema({
  authorEmail:      { type: String, required: true, index: true },
  authorName:       { type: String, required: true },
  authorAvatar:     { type: String },
  content:          { type: String, required: true },
  taggedProducts:   { type: [String], default: [] },
  images:           { type: [String], default: [] },
  likes:            { type: [String], default: [] },
  comments:         { type: [CommentSchema], default: [] },
  isVerifiedSeller: { type: Boolean, default: false },
}, { timestamps: true });

export const CommunityPost: Model<ICommunityPost> =
  mongoose.models.CommunityPost || mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
