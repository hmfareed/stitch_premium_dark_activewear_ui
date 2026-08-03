import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsContent extends Document {
  slug: string; // 'homepage', 'about', 'contact', 'faq', 'privacy_policy', 'terms'
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  sectionData?: any;
  updatedAt: Date;
}

const CmsContentSchema: Schema<ICmsContent> = new Schema({
  slug:            { type: String, required: true, unique: true, index: true },
  title:           { type: String, required: true },
  content:         { type: String, required: true },
  metaTitle:       { type: String },
  metaDescription: { type: String },
  sectionData:     { type: Schema.Types.Mixed, default: {} },
  updatedAt:       { type: Date, default: Date.now },
});

export const CmsContent: Model<ICmsContent> =
  mongoose.models.CmsContent || mongoose.model<ICmsContent>('CmsContent', CmsContentSchema);
