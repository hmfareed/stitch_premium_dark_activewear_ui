import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { DeliveryFeeConfig, ensureDefaultDeliveryFeeConfig } from '@/models/DeliveryFeeConfig';

/**
 * GET /api/admin/fees — fetch current active DeliveryFeeConfig
 * POST /api/admin/fees — update / create new DeliveryFeeConfig
 */
export async function GET() {
  try {
    await connectToDatabase();
    const config = await DeliveryFeeConfig.findOne({ isActive: true }).sort({ effectiveFrom: -1 })
      || await ensureDefaultDeliveryFeeConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch delivery fee config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { baseFee, freeRadiusKm, perKmRate, minFee, maxFee, roadDistanceMultiplier, label } = body;

    // Deactivate previous active configs
    await DeliveryFeeConfig.updateMany({ isActive: true }, { isActive: false });

    // Create new active config record (preserves audit trail per Phase 11.4)
    const newConfig = await DeliveryFeeConfig.create({
      baseFee: Number(baseFee),
      freeRadiusKm: Number(freeRadiusKm),
      perKmRate: Number(perKmRate),
      minFee: Number(minFee),
      maxFee: Number(maxFee),
      roadDistanceMultiplier: Number(roadDistanceMultiplier || 1.35),
      label: label || 'Admin Updated Config',
      effectiveFrom: new Date(),
      isActive: true,
    });

    return NextResponse.json({ success: true, config: newConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save delivery fee config' }, { status: 500 });
  }
}
