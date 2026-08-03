import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlogPost extends Document {
  postId: string;
  title: string;
  slug: string;
  category: string;
  coverImage?: string;
  summary: string;
  content: string;
  author: string;
  isPublished: boolean;
  createdAt: Date;
}

const BlogPostSchema: Schema<IBlogPost> = new Schema({
  postId:      { type: String, required: true, unique: true, index: true },
  title:       { type: String, required: true },
  slug:        { type: String, required: true, unique: true, index: true },
  category:    { type: String, default: 'General' },
  coverImage:  { type: String },
  summary:     { type: String, required: true },
  content:     { type: String, required: true },
  author:      { type: String, default: 'AfriCart Editorial Team' },
  isPublished: { type: Boolean, default: true, index: true },
  createdAt:   { type: Date, default: Date.now },
});

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
