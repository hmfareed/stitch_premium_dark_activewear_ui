import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

/**
 * Image Upload API
 * Accepts a base64 image (from the vendor product form) and uploads
 * it to Cloudinary, returning a CDN-hosted URL instead of storing
 * the base64 blob in MongoDB.
 */
export async function POST(req: NextRequest) {
  try {
    const { image, folder = 'africart/products' } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      // Fallback: return the base64 as-is if Cloudinary is not configured
      console.warn('[Upload] Cloudinary not configured — returning base64 as-is');
      return NextResponse.json({ success: true, url: image, source: 'base64' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
      ],
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      source: 'cloudinary',
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    
    // If Cloudinary fails, try to extract base64 and return it as fallback
    try {
      const { image } = await req.clone().json();
      if (image && image.startsWith('data:')) {
        return NextResponse.json({ success: true, url: image, source: 'base64-fallback' });
      }
    } catch {}

    return NextResponse.json({ error: 'Upload failed: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
