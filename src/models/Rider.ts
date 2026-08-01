import mongoose, { Schema, Document, Model } from 'mongoose';

export type RiderStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
export type RiderOnlineStatus = 'offline' | 'online' | 'on_delivery';
export type VehicleType = 'bicycle' | 'motorcycle' | 'car' | 'van' | 'walking';
export type DeliveryZone = 'tamale_central' | 'tamale_north' | 'tamale_south' | 'sagnarigu' | 'kalpohin' | 'lamashegu' | 'nyohini' | 'choggu' | 'vitting';

export interface IRiderDocument {
  type: 'id_card' | 'license' | 'vehicle_registration' | 'insurance' | 'passport_photo';
  url: string;
  uploadedAt: Date;
  verified: boolean;
}

export interface IRiderLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface IRiderEarnings {
  date: Date;
  amount: number;
  orderId: string;
  deliveryFee: number;
  tip?: number;
}

export interface IRiderRating {
  customerId: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface IRider extends Document {
  // Identity
  userId: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  fullName: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Status
  status: RiderStatus;
  onlineStatus: RiderOnlineStatus;
  
  // Documents
  documents: IRiderDocument[];
  
  // Vehicle Info
  vehicleType: VehicleType;
  vehicleModel?: string;
  vehicleRegistration?: string;
  vehicleYear?: number;
  
  // Delivery
  preferredZones: DeliveryZone[];
  currentLocation?: IRiderLocation;
  lastLocationUpdate?: Date;
  
  // Payment
  momoNumber?: string;
  momoNetwork?: 'MTN' | 'VODAFONE' | 'AIRTELTIGO';
  bankAccountNumber?: string;
  bankName?: string;
  
  // Earnings & Performance
  totalEarnings: number;
  earningsHistory: IRiderEarnings[];
  ratings: IRiderRating[];
  averageRating: number;
  totalDeliveries: number;
  onTimeDeliveryRate: number;
  walletBalance: number;
  avgDeliveryTime: number;
  
  // Meta
  applicationSubmittedAt?: Date;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const RiderDocumentSchema = new Schema<IRiderDocument>({
  type: { type: String, enum: ['id_card', 'license', 'vehicle_registration', 'insurance', 'passport_photo'], required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
}, { _id: false });

const RiderLocationSchema = new Schema<IRiderLocation>({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  accuracy: { type: Number },
}, { _id: false });

const RiderEarningsSchema = new Schema<IRiderEarnings>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  orderId: { type: String, required: true },
  deliveryFee: { type: Number, required: true },
  tip: { type: Number },
}, { _id: false });

const RiderRatingSchema = new Schema<IRiderRating>({
  customerId: { type: String, required: true },
  orderId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const RiderSchema: Schema<IRider> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  fullName: { type: String, required: true },
  nationalId: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },

  status: { type: String, enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'], default: 'pending' },
  onlineStatus: { type: String, enum: ['offline', 'online', 'on_delivery'], default: 'offline' },

  documents: { type: [RiderDocumentSchema], default: [] },

  vehicleType: { type: String, enum: ['bicycle', 'motorcycle', 'car', 'van', 'walking'], required: true },
  vehicleModel: { type: String },
  vehicleRegistration: { type: String },
  vehicleYear: { type: Number },

  preferredZones: { type: [String], default: [] },
  currentLocation: { type: RiderLocationSchema },
  lastLocationUpdate: { type: Date },

  momoNumber: { type: String },
  momoNetwork: { type: String, enum: ['MTN', 'VODAFONE', 'AIRTELTIGO'] },
  bankAccountNumber: { type: String },
  bankName: { type: String },

  totalEarnings: { type: Number, default: 0 },
  earningsHistory: { type: [RiderEarningsSchema], default: [] },
  ratings: { type: [RiderRatingSchema], default: [] },
  averageRating: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  onTimeDeliveryRate: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  avgDeliveryTime: { type: Number, default: 0 },

  applicationSubmittedAt: { type: Date },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  notes: { type: String },

}, { timestamps: true });

// Indexes for common queries
RiderSchema.index({ status: 1 });
RiderSchema.index({ onlineStatus: 1 });
RiderSchema.index({ preferredZones: 1 });
RiderSchema.index({ userId: 1 });

export const Rider: Model<IRider> = mongoose.models.Rider || mongoose.model<IRider>('Rider', RiderSchema);
