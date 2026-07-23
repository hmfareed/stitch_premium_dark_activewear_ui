import mongoose, { Schema, Document, Model } from 'mongoose';

export type StaffRole = 'manager' | 'order_staff' | 'fulfillment_staff' | 'customer_service';
export type StaffStatus = 'active' | 'inactive' | 'suspended';

export interface IVendorStaffPermission {
  viewOrders: boolean;
  manageOrders: boolean;
  viewProducts: boolean;
  manageProducts: boolean;
  viewAnalytics: boolean;
  viewCustomers: boolean;
  manageStaff: boolean;
  viewPayouts: boolean;
}

export interface IVendorStaff extends Document {
  // Identity
  userId: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  fullName: string;
  
  // Employment
  vendorId: mongoose.Types.ObjectId;
  vendorEmail: string;
  role: StaffRole;
  status: StaffStatus;
  
  // Permissions (override defaults for role)
  permissions: IVendorStaffPermission;
  
  // Work Schedule
  workSchedule?: {
    monday: { start: string; end: string; working: boolean };
    tuesday: { start: string; end: string; working: boolean };
    wednesday: { start: string; end: string; working: boolean };
    thursday: { start: string; end: string; working: boolean };
    friday: { start: string; end: string; working: boolean };
    saturday: { start: string; end: string; working: boolean };
    sunday: { start: string; end: string; working: boolean };
  };
  
  // Performance Metrics
  ordersProcessed: number;
  ordersFulfilled: number;
  averageProcessingTime: number; // in minutes
  customerRating: number;
  
  // Meta
  hiredAt: Date;
  lastActiveAt?: Date;
  terminatedAt?: Date;
  terminationReason?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Default permissions by role
export const defaultPermissionsByRole: Record<StaffRole, IVendorStaffPermission> = {
  manager: {
    viewOrders: true,
    manageOrders: true,
    viewProducts: true,
    manageProducts: true,
    viewAnalytics: true,
    viewCustomers: true,
    manageStaff: true,
    viewPayouts: true,
  },
  order_staff: {
    viewOrders: true,
    manageOrders: true,
    viewProducts: true,
    manageProducts: false,
    viewAnalytics: false,
    viewCustomers: true,
    manageStaff: false,
    viewPayouts: false,
  },
  fulfillment_staff: {
    viewOrders: true,
    manageOrders: true,
    viewProducts: true,
    manageProducts: false,
    viewAnalytics: false,
    viewCustomers: false,
    manageStaff: false,
    viewPayouts: false,
  },
  customer_service: {
    viewOrders: true,
    manageOrders: false,
    viewProducts: true,
    manageProducts: false,
    viewAnalytics: false,
    viewCustomers: true,
    manageStaff: false,
    viewPayouts: false,
  },
};

const VendorStaffPermissionSchema = new Schema<IVendorStaffPermission>({
  viewOrders: { type: Boolean, default: true },
  manageOrders: { type: Boolean, default: false },
  viewProducts: { type: Boolean, default: true },
  manageProducts: { type: Boolean, default: false },
  viewAnalytics: { type: Boolean, default: false },
  viewCustomers: { type: Boolean, default: true },
  manageStaff: { type: Boolean, default: false },
  viewPayouts: { type: Boolean, default: false },
}, { _id: false });

const WorkDaySchema = new Schema({
  start: { type: String, default: '09:00' },
  end: { type: String, default: '17:00' },
  working: { type: Boolean, default: true },
}, { _id: false });

const VendorStaffSchema: Schema<IVendorStaff> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  fullName: { type: String, required: true },

  vendorId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  vendorEmail: { type: String, required: true },
  role: { type: String, enum: ['manager', 'order_staff', 'fulfillment_staff', 'customer_service'], default: 'order_staff' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },

  permissions: { type: VendorStaffPermissionSchema, default: () => defaultPermissionsByRole.order_staff },

  workSchedule: {
    monday: { type: WorkDaySchema, default: () => ({ start: '09:00', end: '17:00', working: true }) },
    tuesday: { type: WorkDaySchema, default: () => ({ start: '09:00', end: '17:00', working: true }) },
    wednesday: { type: WorkDaySchema, default: () => ({ start: '09:00', end: '17:00', working: true }) },
    thursday: { type: WorkDaySchema, default: () => ({ start: '09:00', end: '17:00', working: true }) },
    friday: { type: WorkDaySchema, default: () => ({ start: '09:00', end: '17:00', working: true }) },
    saturday: { type: WorkDaySchema, default: () => ({ start: '09:00', end: '17:00', working: false }) },
    sunday: { type: WorkDaySchema, default: () => ({ start: '09:00', end: '17:00', working: false }) },
  },

  ordersProcessed: { type: Number, default: 0 },
  ordersFulfilled: { type: Number, default: 0 },
  averageProcessingTime: { type: Number, default: 0 },
  customerRating: { type: Number, default: 0 },

  hiredAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date },
  terminatedAt: { type: Date },
  terminationReason: { type: String },
  notes: { type: String },

}, { timestamps: true });

// Indexes for common queries
VendorStaffSchema.index({ vendorId: 1 });
VendorStaffSchema.index({ vendorEmail: 1 });
VendorStaffSchema.index({ userId: 1 });
VendorStaffSchema.index({ status: 1 });
VendorStaffSchema.index({ role: 1 });

export const VendorStaff: Model<IVendorStaff> = mongoose.models.VendorStaff || mongoose.model<IVendorStaff>('VendorStaff', VendorStaffSchema);
