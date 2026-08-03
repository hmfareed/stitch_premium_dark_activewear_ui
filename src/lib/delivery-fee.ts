/**
 * Delivery fee engine (Phase 11).
 *
 * Formula (Phase 11.2):
 *   deliveryFee = clamp(
 *     baseFee + max(0, distanceKm - freeRadiusKm) * perKmRate,
 *     minFee,
 *     maxFee
 *   )
 *
 * Collection point resolved per fulfillmentSource (Phase 11.1):
 *   hub_stock | vendor_dropoff_pending → Hub → Customer (most common case)
 *   vendor_direct_pickup               → Store → Customer (fallback)
 */

import { roadDistanceKm } from './haversine';
import connectToDatabase from './mongodb';
import { DeliveryFeeConfig, IDeliveryFeeConfig, ensureDefaultDeliveryFeeConfig } from '@/models/DeliveryFeeConfig';
import { Warehouse, ensureDefaultWarehouse } from '@/models/Warehouse';
import { Store } from '@/models/Store';
import { FulfillmentSource } from '@/models/SubOrder';

export interface DeliveryFeeResult {
  /** Road-distance estimate (km) used for the calculation */
  distanceKm: number;
  /** Delivery fee in GHS (snapshotted at checkout — never recalculated) */
  fee: number;
  /** The config snapshot used, for audit purposes */
  configId: string;
}

/**
 * Clamps a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Applies the Phase 11.2 formula to compute the delivery fee.
 */
export function applyFeeFormula(
  distanceKm: number,
  config: Pick<IDeliveryFeeConfig, 'baseFee' | 'freeRadiusKm' | 'perKmRate' | 'minFee' | 'maxFee'>
): number {
  const chargeableKm = Math.max(0, distanceKm - config.freeRadiusKm);
  const raw = config.baseFee + chargeableKm * config.perKmRate;
  return clamp(raw, config.minFee, config.maxFee);
}

/**
 * Calculates the delivery fee for a single sub-order.
 *
 * @param fulfillmentSource Which routing type — determines the collection point origin
 * @param storeId The vendor's Store document _id string (used only for vendor_direct_pickup)
 * @param customerLat Customer delivery latitude
 * @param customerLon Customer delivery longitude
 */
export async function calculateSubOrderDeliveryFee(
  fulfillmentSource: FulfillmentSource,
  storeId: string | null,
  customerLat: number,
  customerLon: number
): Promise<DeliveryFeeResult> {
  await connectToDatabase();

  // 1. Load the active fee config
  const config = await DeliveryFeeConfig.findOne({ isActive: true }).sort({ effectiveFrom: -1 })
    || await ensureDefaultDeliveryFeeConfig();

  // 2. Resolve origin coordinates based on fulfillmentSource
  let originLat: number;
  let originLon: number;

  if (fulfillmentSource === 'vendor_direct_pickup' && storeId) {
    // Fallback: collect directly from vendor's store location
    const store = await Store.findById(storeId).select('latitude longitude name');
    if (store?.latitude && store?.longitude) {
      originLat = store.latitude;
      originLon = store.longitude;
    } else {
      // Store coordinates not set — fall back to hub coords with a warning
      console.warn(`[delivery-fee] vendor_direct_pickup for store ${storeId} but store has no coordinates. Falling back to hub.`);
      const hub = await Warehouse.findOne({ code: 'WH-TML-01' }) || await ensureDefaultWarehouse();
      originLat = hub.latitude;
      originLon = hub.longitude;
    }
  } else {
    // hub_stock or vendor_dropoff_pending → use hub as origin (the majority case per Phase 11.1)
    const hub = await Warehouse.findOne({ code: 'WH-TML-01' }) || await ensureDefaultWarehouse();
    originLat = hub.latitude;
    originLon = hub.longitude;
  }

  // 3. Calculate road distance
  const distanceKm = roadDistanceKm(
    originLat,
    originLon,
    customerLat,
    customerLon,
    config.roadDistanceMultiplier
  );

  // 4. Apply fee formula
  const fee = applyFeeFormula(distanceKm, config);

  return {
    distanceKm: Math.round(distanceKm * 100) / 100, // 2 decimal places
    fee: Math.round(fee * 100) / 100,
    configId: (config._id as any).toString(),
  };
}
