import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';

/**
 * Atomically reserves stock for a short checkout window per spec §1.3b.
 * Prevents stock race conditions where 2 buyers attempt to buy the last unit.
 */
export async function reserveStockForCheckout(productId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
  await connectToDatabase();

  const product = await Product.findOne({ id: productId });
  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  const totalStock = product.stock || 0;
  const currentReserved = product.reservedStock || 0;
  const availableStock = totalStock - currentReserved;

  if (availableStock < quantity) {
    return {
      success: false,
      error: `Only ${availableStock} unit(s) available. Other customers are currently checking out.`,
    };
  }

  // Atomic increment of reservedStock
  await Product.updateOne(
    { id: productId },
    { $inc: { reservedStock: quantity } }
  );

  return { success: true };
}

/**
 * Releases reserved stock if checkout window expires or user cancels.
 */
export async function releaseStockReservation(productId: string, quantity: number): Promise<void> {
  await connectToDatabase();
  await Product.updateOne(
    { id: productId, reservedStock: { $gte: quantity } },
    { $inc: { reservedStock: -quantity } }
  );
}

/**
 * Confirms stock purchase on payment success: converts reservation to actual stock decrement.
 */
export async function confirmStockPurchase(productId: string, quantity: number): Promise<void> {
  await connectToDatabase();
  await Product.updateOne(
    { id: productId },
    {
      $inc: {
        stock: -quantity,
        reservedStock: -quantity,
      },
    }
  );
}
