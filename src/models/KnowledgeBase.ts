import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKnowledgeBase extends Document {
  articleId: string;
  title: string;
  category: string;
  content: string;
  views: number;
  helpfulCount: number;
  isPublished: boolean;
  createdAt: Date;
}

const KnowledgeBaseSchema: Schema<IKnowledgeBase> = new Schema({
  articleId:    { type: String, required: true, unique: true, index: true },
  title:        { type: String, required: true },
  category:     { type: String, required: true, default: 'General' },
  content:      { type: String, required: true },
  views:        { type: Number, default: 0 },
  helpfulCount: { type: Number, default: 0 },
  isPublished:  { type: Boolean, default: true, index: true },
  createdAt:    { type: Date, default: Date.now },
});

export const KnowledgeBase: Model<IKnowledgeBase> =
  mongoose.models.KnowledgeBase || mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
