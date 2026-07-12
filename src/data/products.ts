export interface Review {
  id: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  images?: string[];
  date: string;
  vendorReply?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Electronics' | 'Fashion' | 'Home' | 'Beauty' | 'Groceries' | 'Laptops' | 'Phones' | 'Accessories' | 'Cosmetics' | 'Food' | 'Mobile Accessories' | 'Cooling' | 'Washers/Dryers' | 'Gaming' | 'Health' | 'Sports' | 'Books' | 'Automotive' | 'Baby' | 'Baby Products' | 'Toys' | 'Computing' | 'Phones/Tablets' | 'Pet Supplies' | 'Home Appliances' | 'Phone Accessories' | 'Beverages';
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: string;
  subCategory: string;
  rating: number;
  reviews?: Review[];
  isNew?: boolean;
  isLimited?: boolean;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnd?: string; // ISO date string
  sizes?: string[];
  colors?: string[];
  vendorEmail?: string;
  vendorStoreName?: string;
  stock?: number;
  wholesaleTiers?: Array<{ minQuantity: number; discountPercent: number }>;
  campaignId?: string | null;
}

export const categories = [
  'All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Laptops', 
  'Phones', 'Mobile Accessories', 'Groceries', 'Cooling', 'Washers/Dryers',
  'Gaming', 'Health', 'Sports', 'Books', 'Automotive', 'Baby', 'Baby Products', 'Toys',
  'Computing', 'Phones/Tablets', 'Pet Supplies', 'Home Appliances', 'Phone Accessories', 'Beverages',
  'Accessories', 'Cosmetics', 'Food'
] as const;

/** Normalized parent → children category hierarchy. */
export const categoryHierarchy: Record<string, string[]> = {
  'Electronics':      ['Laptops', 'Computing', 'Gaming'],
  'Phones':           ['Phones/Tablets', 'Phone Accessories', 'Mobile Accessories'],
  'Home':             ['Home Appliances', 'Cooling', 'Washers/Dryers'],
  'Fashion':          ['Accessories'],
  'Beauty':           ['Cosmetics'],
  'Groceries':        ['Beverages', 'Food'],
  'Health & Wellness':['Health', 'Sports'],
  'Baby & Kids':      ['Baby', 'Baby Products', 'Toys'],
  'Automotive':       [],
  'Books':            [],
  'Pet Supplies':     [],
};

/** Top-level categories to show as primary nav links (first 8 shown, rest in "More"). */
export const topLevelCategories = Object.keys(categoryHierarchy);

/** Resolve which top-level parent a raw product category belongs to. */
export function getParentCategory(category: string): string | null {
  for (const [parent, children] of Object.entries(categoryHierarchy)) {
    if (parent === category || children.includes(category)) return parent;
  }
  return null;
}

/** Get all leaf + self categories that belong under a top-level parent. */
export function getCategoryFamily(parent: string): string[] {
  const children = categoryHierarchy[parent] ?? [];
  return [parent, ...children];
}

export const products: Product[] = [
  {
    id: '1',
    name: 'UltraVision 4K Smart TV',
    category: 'Electronics',
    subCategory: 'Televisions',
    price: 4999.00,
    originalPrice: 6500.00,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800',
    description: 'Experience stunning visuals with the UltraVision 4K Smart TV. Features HDR10 support, built-in streaming apps, and ultra-thin bezels.',
    rating: 4.8,
    isNew: true,
    isFlashSale: true,
    flashSalePrice: 3800.00,
    flashSaleEnd: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours from now
    sizes: ['43"', '50"', '55"', '65"'],
    colors: ['Black'],
  },
  {
    id: '2',
    name: 'Classic Denim Jacket',
    category: 'Fashion',
    subCategory: 'Men\'s Clothing',
    price: 450.00,
    originalPrice: 600.00,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=800',
    description: 'A timeless classic denim jacket, perfect for any casual occasion. Made with durable, high-quality denim.',
    rating: 4.5,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Black'],
  },
  {
    id: '3',
    name: 'ErgoComfort Office Chair',
    category: 'Home',
    subCategory: 'Furniture',
    price: 1200.00,
    originalPrice: 1500.00,
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=800',
    description: 'Designed for long hours of work. Features adjustable lumbar support, breathable mesh back, and 3D armrests.',
    rating: 4.7,
    isLimited: true,
    colors: ['Black', 'Grey'],
  },
  {
    id: '4',
    name: 'ProGlow Skincare Set',
    category: 'Beauty',
    subCategory: 'Skincare',
    price: 850.00,
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
    description: 'A complete skincare routine for a radiant glow. Includes cleanser, toner, serum, and moisturizer formulated with vitamin C.',
    rating: 4.9,
    isNew: true,
  },
  {
    id: '5',
    name: 'Noise-Cancelling Headphones',
    category: 'Electronics',
    subCategory: 'Audio',
    price: 1999.00,
    originalPrice: 2500.00,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    description: 'Immerse yourself in music with industry-leading noise cancellation. Up to 30 hours of battery life.',
    rating: 4.8,
    colors: ['Black', 'Silver', 'Navy'],
  },
  {
    id: '6',
    name: 'Elegant Evening Dress',
    category: 'Fashion',
    subCategory: 'Women\'s Clothing',
    price: 890.00,
    originalPrice: 1200.00,
    image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&q=80&w=800',
    description: 'Stunning evening dress perfect for special occasions. Features a flattering silhouette and premium fabric.',
    rating: 4.6,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Red', 'Black', 'Emerald'],
  },
  {
    id: '10',
    name: 'iPhone 15 Pro',
    category: 'Phones',
    subCategory: 'Smartphones',
    price: 9500.00,
    originalPrice: 9900.00,
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800',
    description: 'Forged in titanium. Features the A17 Pro chip, a customizable Action button, and a more versatile Pro camera system.',
    rating: 4.8,
    isNew: true,
  },
  {
    id: '14',
    name: 'MagSafe Silicone Case',
    category: 'Mobile Accessories',
    subCategory: 'Cases',
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800',
    description: 'Premium silicone case with MagSafe support. Protects your phone with a soft-touch finish.',
    rating: 4.7,
    colors: ['Deep Blue', 'Stone', 'Black'],
  },
  {
    id: '15',
    name: '20W USB-C Fast Charger',
    category: 'Mobile Accessories',
    subCategory: 'Chargers',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=800',
    description: 'High-speed charging for your devices. Compact and travel-friendly.',
    rating: 4.6,
  },
  {
    id: '16',
    name: 'Organic Breakfast Cereal',
    category: 'Groceries',
    subCategory: 'Breakfast',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddf13cf?auto=format&fit=crop&q=80&w=800',
    description: 'Healthy and organic breakfast cereal made with whole grains.',
    rating: 4.8,
  },
  {
    id: '17',
    name: 'Smart Inverter Air Conditioner',
    category: 'Cooling',
    subCategory: 'Air Conditioning',
    price: 3500.00,
    originalPrice: 4200.00,
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=800',
    description: 'Energy-efficient cooling with smart inverter technology. Control via your phone.',
    rating: 4.9,
    isNew: true,
  },
  {
    id: '18',
    name: 'High-Velocity Stand Fan',
    category: 'Cooling',
    subCategory: 'Fans',
    price: 450.00,
    image: 'https://images.unsplash.com/photo-1591147517373-3465e5387221?auto=format&fit=crop&q=80&w=800',
    description: 'Powerful airflow with 3 speed settings and height adjustment.',
    rating: 4.5,
  },
  {
    id: '19',
    name: 'Front-Load Smart Washer',
    category: 'Washers/Dryers',
    subCategory: 'Washing Machines',
    price: 5500.00,
    originalPrice: 6200.00,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    description: 'Large capacity smart washer with steam clean technology.',
    rating: 4.8,
  },
  {
    id: '20',
    name: 'Efficient Tumble Dryer',
    category: 'Washers/Dryers',
    subCategory: 'Dryers',
    price: 3800.00,
    image: 'https://images.unsplash.com/photo-1545173168-9f1947e8017e?auto=format&fit=crop&q=80&w=800',
    description: 'Dries clothes quickly and gently with sensor dry technology.',
    rating: 4.7,
  }
];
