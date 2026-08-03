import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Superadmin-configurable delivery fee formula parameters (Phase 11).
 * Formula: clamp(baseFee + max(0, distanceKm - freeRadiusKm) * perKmRate, minFee, maxFee)
 *
 * Stored as a collection (not a hardcoded constant) so fee changes never require a deploy.
 * effectiveFrom allows historical orders to be audited against the config that was live
 * when they were placed.
 */
export interface IDeliveryFeeConfig extends Document {
  /** Base fee charged on every delivery regardless of distance (GHS) */
  baseFee: number;
  /** Distance within which no per-km charge applies (km) */
  freeRadiusKm: number;
  /** Per-km rate applied beyond freeRadiusKm (GHS/km) */
  perKmRate: number;
  /** Minimum delivery fee floor (GHS) */
  minFee: number;
  /** Maximum delivery fee ceiling (GHS) */
  maxFee: number;
  /**
   * Straight-line to road-distance correction multiplier.
   * Haversine gives straight-line distance; multiply by this factor (~1.3–1.4)
   * to approximate real road distance without a paid mapping API.
   */
  roadDistanceMultiplier: number;
  /** When this config became active — used to audit historical orders */
  effectiveFrom: Date;
  /** Optional label for admin UI */
  label?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryFeeConfigSchema: Schema<IDeliveryFeeConfig> = new Schema(
  {
    baseFee:                { type: Number, required: true, default: 5 },
    freeRadiusKm:           { type: Number, required: true, default: 2 },
    perKmRate:              { type: Number, required: true, default: 1.5 },
    minFee:                 { type: Number, required: true, default: 5 },
    maxFee:                 { type: Number, required: true, default: 30 },
    roadDistanceMultiplier: { type: Number, required: true, default: 1.35 },
    effectiveFrom:          { type: Date, required: true, default: Date.now },
    label:                  { type: String },
    isActive:               { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const DeliveryFeeConfig: Model<IDeliveryFeeConfig> =
  mongoose.models.DeliveryFeeConfig ||
  mongoose.model<IDeliveryFeeConfig>('DeliveryFeeConfig', DeliveryFeeConfigSchema);

/**
 * Ensures at least one active DeliveryFeeConfig exists (seeded with placeholder values).
 * Run once on startup / API cold-start.
 * GHS placeholder amounts per Phase 11.2 — update via superadmin UI.
 */
export async function ensureDefaultDeliveryFeeConfig(): Promise<IDeliveryFeeConfig> {
  let config = await DeliveryFeeConfig.findOne({ isActive: true }).sort({ effectiveFrom: -1 });
  if (!config) {
    config = await DeliveryFeeConfig.create({
      baseFee: 5,
      freeRadiusKm: 2,
      perKmRate: 1.5,
      minFee: 5,
      maxFee: 30,
      roadDistanceMultiplier: 1.35,
      effectiveFrom: new Date(),
      label: 'Default — Tamale (placeholder values)',
      isActive: true,
    });
  }
  return config;
}
