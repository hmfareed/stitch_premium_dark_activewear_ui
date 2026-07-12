import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];  // Additional product images (gallery)
  description: string;
  subCategory: string;
  rating: number;
  reviews?: Array<{
    id: string;
    userName: string;
    userEmail: string;
    rating: number;
    comment: string;
    images?: string[];
    date: string;
    vendorReply?: string;
  }>;
  isNewProduct?: boolean;
  isLimited?: boolean;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnd?: string;
  sizes?: string[];
  colors?: string[];
  vendorEmail?: string;
  vendorStoreName?: string;
  stock?: number;
  wholesaleTiers?: Array<{ minQuantity: number; discountPercent: number }>;
  campaignId?: string;
  createdAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  images: { type: [String], default: [] },
  description: { type: String, required: true },
  subCategory: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: [{
    id: String,
    userName: String,
    userEmail: String,
    rating: Number,
    comment: String,
    images: [String],
    date: String,
    vendorReply: String,
  }],
  isNewProduct: { type: Boolean, default: false },
  isLimited: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  flashSalePrice: { type: Number },
  flashSaleEnd: { type: String },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  vendorEmail: { type: String },
  vendorStoreName: { type: String },
  stock: { type: Number, default: 0 },
  wholesaleTiers: [{
    minQuantity: { type: Number, required: true },
    discountPercent: { type: Number, required: true }
  }],
  campaignId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
