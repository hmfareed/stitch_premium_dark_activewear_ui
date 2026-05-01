export interface Product {
  id: string;
  name: string;
  category: 'Electronics' | 'Fashion' | 'Home' | 'Beauty' | 'Groceries';
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  subCategory: string;
  rating: number;
  isNew?: boolean;
  isLimited?: boolean;
  sizes?: string[];
  colors?: string[];
  vendorEmail?: string;
  vendorStoreName?: string;
}

export const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty'] as const;

export const products: Product[] = [
  {
    id: '1',
    name: 'UltraVision 4K Smart TV',
    category: 'Electronics',
    subCategory: 'Televisions',
    price: 499.00,
    originalPrice: 650.00,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800',
    description: 'Experience stunning visuals with the UltraVision 4K Smart TV. Features HDR10 support, built-in streaming apps, and ultra-thin bezels.',
    rating: 4.8,
    isNew: true,
    sizes: ['43"', '50"', '55"', '65"'],
    colors: ['Black'],
  },
  {
    id: '2',
    name: 'Classic Denim Jacket',
    category: 'Fashion',
    subCategory: 'Men\'s Clothing',
    price: 45.00,
    originalPrice: 60.00,
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
    price: 120.00,
    originalPrice: 150.00,
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
    price: 85.00,
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
    price: 199.00,
    originalPrice: 250.00,
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
    price: 89.00,
    originalPrice: 120.00,
    image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&q=80&w=800',
    description: 'Stunning evening dress perfect for special occasions. Features a flattering silhouette and premium fabric.',
    rating: 4.6,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Red', 'Black', 'Emerald'],
  },
  {
    id: '7',
    name: 'Smart Home Hub',
    category: 'Electronics',
    subCategory: 'Smart Home',
    price: 129.00,
    image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&q=80&w=800',
    description: 'Control all your smart devices from one central hub. Features voice control and routine automation.',
    rating: 4.4,
  },
  {
    id: '8',
    name: 'Artisan Coffee Maker',
    category: 'Home',
    subCategory: 'Appliances',
    price: 250.00,
    originalPrice: 300.00,
    image: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&q=80&w=800',
    description: 'Brew cafe-quality coffee at home. Features precision temperature control and built-in grinder.',
    rating: 4.9,
    isLimited: true,
  },
];
