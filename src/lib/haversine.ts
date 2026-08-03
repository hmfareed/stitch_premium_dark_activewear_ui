/**
 * Haversine distance calculator (Phase 11 — Stage 1).
 *
 * Computes the great-circle (straight-line) distance between two GPS coordinates.
 * This is a zero-cost, zero-dependency implementation — no external API needed.
 *
 * Stage 2 upgrade path: replace haversineKm() with a Google Distance Matrix API call
 * once volume or accuracy complaints justify the per-request cost (Phase 11.3).
 */

const EARTH_RADIUS_KM = 6371;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Returns the straight-line distance in kilometres between two lat/lon points.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Returns the estimated road distance in kilometres by applying a correction
 * multiplier to the Haversine straight-line result.
 *
 * A multiplier of 1.35 is a reasonable starting point for Tamale's road network
 * (Phase 11.3 recommends 1.3–1.4x). This is stored in DeliveryFeeConfig so the
 * superadmin can tune it without a deploy.
 *
 * @param lat1 Origin latitude
 * @param lon1 Origin longitude
 * @param lat2 Destination latitude
 * @param lon2 Destination longitude
 * @param roadMultiplier Road-distance correction factor (default 1.35)
 */
export function roadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  roadMultiplier: number = 1.35
): number {
  return haversineKm(lat1, lon1, lat2, lon2) * roadMultiplier;
}
