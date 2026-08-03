import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  general: Record<string, any>;
  business: Record<string, any>;
  localization: Record<string, any>;
  currencies: Record<string, any>;
  taxes: Record<string, any>;
  paymentGateways: Record<string, any>;
  email: Record<string, any>;
  sms: Record<string, any>;
  pushNotifications: Record<string, any>;
  security: Record<string, any>;
  authentication: Record<string, any>;
  storage: Record<string, any>;
  apiKeys: Record<string, any>;
  integrations: Record<string, any>;
  appearance: Record<string, any>;
  backups: Record<string, any>;
  maintenanceMode: Record<string, any>;
  licensing: Record<string, any>;
  updatedAt: Date;
}

const SystemSettingsSchema: Schema<ISystemSettings> = new Schema({
  key: { type: String, required: true, unique: true, default: 'global_settings' },
  general: { type: Schema.Types.Mixed, default: {} },
  business: { type: Schema.Types.Mixed, default: {} },
  localization: { type: Schema.Types.Mixed, default: {} },
  currencies: { type: Schema.Types.Mixed, default: {} },
  taxes: { type: Schema.Types.Mixed, default: {} },
  paymentGateways: { type: Schema.Types.Mixed, default: {} },
  email: { type: Schema.Types.Mixed, default: {} },
  sms: { type: Schema.Types.Mixed, default: {} },
  pushNotifications: { type: Schema.Types.Mixed, default: {} },
  security: { type: Schema.Types.Mixed, default: {} },
  authentication: { type: Schema.Types.Mixed, default: {} },
  storage: { type: Schema.Types.Mixed, default: {} },
  apiKeys: { type: Schema.Types.Mixed, default: {} },
  integrations: { type: Schema.Types.Mixed, default: {} },
  appearance: { type: Schema.Types.Mixed, default: {} },
  backups: { type: Schema.Types.Mixed, default: {} },
  maintenanceMode: { type: Schema.Types.Mixed, default: {} },
  licensing: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
