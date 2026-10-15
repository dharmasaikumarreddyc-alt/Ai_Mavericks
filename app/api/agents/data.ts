// Data layer with both local food merchants AND DummyJSON product catalog.
// The DummyJSON catalog is bundled locally (see ./dummyjson-products.json) so
// the demo works fully offline and behind corporate TLS proxies.

import dummyjsonData from './dummyjson-products.json';

const DUMMYJSON_PRODUCTS: any[] = (dummyjsonData as any)?.products ?? [];

export interface Merchant {
  id: string;
  name: string;
  type: string;
  category: string[];
  distance: string;
  rating: number;
  image: string;
  offers: string[];
  prepTime: string;
  address: string;
  isOpen: boolean;
  dummyjsonCategories?: string[]; // Maps to DummyJSON API categories (optional)
  aiReason?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  tags: string[];
  inStock: boolean;
  quantity: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  aiReason?: string;
}

// =====================================================
// LOCAL FOOD & BEVERAGE MERCHANTS (Original)
// =====================================================
export const localMerchantsDB: Merchant[] = [
  {
    id: 'cafe-verde',
    name: 'Starbucks Coffee Company',
    type: 'Coffee Shop',
    category: ['coffee', 'cafe', 'breakfast', 'vegan', 'healthy'],
    distance: '0.1 mi',
    rating: 4.7,
    image: '/images/products/cafe-verde.jpg',
    offers: ['10% off orders above $10', 'Free coffee with breakfast combo'],
    prepTime: '7-10 min',
    address: '3550 Lenox Rd NE, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'bean-scene-coffee',
    name: 'Truffles Cafe',
    type: 'Coffee Shop',
    category: ['coffee', 'cafe', 'breakfast', 'bakery'],
    distance: '0.3 mi',
    rating: 4.8,
    image: '/images/products/bean-scene-coffee.jpg',
    offers: ['Happy Hour 3-5 PM: 20% off', 'Student discount 15%'],
    prepTime: '5-10 min',
    address: '3500 Lenox Rd NE, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'green-leaf-bistro',
    name: 'Tower Cafe',
    type: 'Health Restaurant',
    category: ['salads', 'healthy', 'vegan', 'lunch', 'organic'],
    distance: '0.2 mi',
    rating: 4.5,
    image: '/images/products/green-leaf-bistro.jpg',
    offers: ['Buy 1 Get 1 on salads (Mon-Wed)', '15% off organic items'],
    prepTime: '12-18 min',
    address: '3530 Lenox Rd NE, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'daily-fresh-mart',
    name: "Peet's Coffee & Tea",
    type: 'Coffee Shop',
    category: ['coffee', 'tea', 'espresso', 'organic', 'roasts'],
    distance: '0.4 mi',
    rating: 4.6,
    image: '/images/products/daily-fresh-mart.jpg',
    offers: ['Free delivery on all orders', '10% off on first order'],
    prepTime: '5-10 min',
    address: '3393 Peachtree Rd NE, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'spice-kitchen',
    name: 'Spice Kitchen',
    type: 'Indian Restaurant',
    category: ['indian', 'biryani', 'curry', 'lunch', 'dinner'],
    distance: '0.5 mi',
    rating: 4.6,
    image: '/images/products/curry.jpg',
    offers: ['20% off on Biryani combos', 'Free dessert above $15'],
    prepTime: '15-25 min',
    address: '3580 Lenox Rd NE, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'south-delight',
    name: 'South Delight',
    type: 'South Indian Restaurant',
    category: ['south indian', 'dosa', 'idli', 'breakfast', 'vegetarian'],
    distance: '0.5 mi',
    rating: 4.7,
    image: '/images/products/dosa.jpg',
    offers: ['Breakfast combo at $7.99', 'Filter coffee free with meals'],
    prepTime: '8-15 min',
    address: '3424 Peachtree Rd NE, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'sweet-treats-bakery',
    name: 'Sweet Treats Bakery',
    type: 'Bakery',
    category: ['bakery', 'bread', 'pastry', 'cakes', 'desserts', 'cake'],
    distance: '0.6 mi',
    rating: 4.8,
    image: '/images/products/cake.jpg',
    offers: ['15% off on birthday cakes', 'Buy 2 Get 1 on pastries'],
    prepTime: '5-8 min',
    address: '3500 Peachtree Rd NE, Atlanta, GA 30326',
    isOpen: true,
  },
];

// Local food products
export const localProductsDB: Product[] = [
  // Cafe Verde Products (Starbucks)
  { id: 'cv-1', merchantId: 'cafe-verde', name: 'Vegan Avocado Toast', price: 8.50, description: 'Sourdough with smashed avocado, cherry tomatoes & microgreens', image: '/images/products/avocado-toast.jpg', category: 'Breakfast', tags: ['vegan', 'healthy', 'breakfast', 'avocado', 'toast'], inStock: true, quantity: 50 },
  { id: 'cv-2', merchantId: 'cafe-verde', name: 'Oat Milk Latte', price: 5.75, description: 'Double shot espresso with creamy oat milk', image: '/images/products/latte.jpg', category: 'Drinks', tags: ['vegan', 'coffee', 'latte', 'oat'], inStock: true, quantity: 999 },
  { id: 'cv-3', merchantId: 'cafe-verde', name: 'Vegan Buddha Bowl', price: 12.50, description: 'Quinoa, roasted veggies, hummus & tahini dressing', image: '/images/products/buddha-bowl.jpg', category: 'Breakfast', tags: ['vegan', 'healthy', 'protein', 'bowl'], inStock: true, quantity: 30 },
  { id: 'cv-4', merchantId: 'cafe-verde', name: 'Fresh Orange Juice', price: 4.50, description: 'Freshly squeezed orange juice', image: '/images/products/orange-juice.jpg', category: 'Drinks', tags: ['vegan', 'fresh', 'healthy', 'juice', 'orange'], inStock: true, quantity: 50 },
  { id: 'cv-5', merchantId: 'cafe-verde', name: 'Almond Croissant', price: 4.25, description: 'Flaky croissant with almond paste', image: '/images/products/croissant.jpg', category: 'Bakery', tags: ['bakery', 'pastry', 'croissant'], inStock: true, quantity: 40 },
  { id: 'cv-6', merchantId: 'cafe-verde', name: 'Cappuccino', price: 5.50, description: 'Classic cappuccino with steamed milk foam', image: '/images/products/cappuccino.jpg', category: 'Drinks', tags: ['coffee', 'cappuccino'], inStock: true, quantity: 999 },
  { id: 'cv-7', merchantId: 'cafe-verde', name: 'Blueberry Muffin', price: 3.75, description: 'Fresh baked muffin with juicy blueberries', image: '/images/products/blueberry-muffin.jpg', category: 'Bakery', tags: ['bakery', 'muffin', 'blueberry'], inStock: true, quantity: 45 },

  // Bean Scene Coffee Products (Truffles Cafe)
  { id: 'bs-1', merchantId: 'bean-scene-coffee', name: 'Signature Cold Brew', price: 5.50, description: '18-hour slow steeped cold brew', image: '/images/products/cold-brew.jpg', category: 'Drinks', tags: ['coffee', 'cold brew', 'signature'], inStock: true, quantity: 999 },
  { id: 'bs-2', merchantId: 'bean-scene-coffee', name: 'Vegan Breakfast Platter', price: 14.50, description: 'Toast, avocado, mushrooms, tomatoes & hash browns', image: '/images/products/breakfast-platter.jpg', category: 'Breakfast', tags: ['vegan', 'healthy', 'breakfast', 'platter'], inStock: true, quantity: 20 },
  { id: 'bs-3', merchantId: 'bean-scene-coffee', name: 'Espresso Shot', price: 3.50, description: 'Single origin espresso', image: '/images/products/espresso.jpg', category: 'Drinks', tags: ['coffee', 'espresso', 'strong'], inStock: true, quantity: 999 },
  { id: 'bs-4', merchantId: 'bean-scene-coffee', name: 'Pancakes Stack', price: 10.50, description: 'Fluffy pancakes with maple syrup and butter', image: '/images/products/pancakes.jpg', category: 'Breakfast', tags: ['breakfast', 'pancakes', 'sweet'], inStock: true, quantity: 25 },
  { id: 'bs-5', merchantId: 'bean-scene-coffee', name: 'Belgian Waffles', price: 11.00, description: 'Crispy waffles with fresh berries', image: '/images/products/waffles.jpg', category: 'Breakfast', tags: ['breakfast', 'waffles', 'berries'], inStock: true, quantity: 20 },

  // Green Leaf Bistro Products (Tower Cafe)
  { id: 'gl-1', merchantId: 'green-leaf-bistro', name: 'Mediterranean Salad', price: 11.50, description: 'Mixed greens, olives, feta, cucumber & olive oil dressing', image: '/images/products/mediterranean-salad.jpg', category: 'Salads', tags: ['salad', 'healthy', 'mediterranean'], inStock: true, quantity: 30 },
  { id: 'gl-2', merchantId: 'green-leaf-bistro', name: 'Quinoa Power Bowl', price: 13.50, description: 'Protein-packed quinoa with roasted chickpeas & veggies', image: '/images/products/quinoa-bowl.jpg', category: 'Bowls', tags: ['vegan', 'protein', 'healthy', 'bowl', 'quinoa'], inStock: true, quantity: 25 },
  { id: 'gl-3', merchantId: 'green-leaf-bistro', name: 'Smoothie Bowl', price: 10.50, description: 'Acai, banana, berries & granola topping', image: '/images/products/smoothie-bowl.jpg', category: 'Breakfast', tags: ['vegan', 'fruits', 'breakfast', 'smoothie', 'acai'], inStock: true, quantity: 30 },
  { id: 'gl-4', merchantId: 'green-leaf-bistro', name: 'Caesar Salad', price: 10.75, description: 'Crisp romaine with parmesan and croutons', image: '/images/products/caesar-salad.jpg', category: 'Salads', tags: ['salad', 'caesar', 'classic'], inStock: true, quantity: 35 },

  // Daily Fresh Mart Products (Peet's Coffee & Tea)
  { id: 'df-1', merchantId: 'daily-fresh-mart', name: "Major Dickason's Blend", price: 5.25, description: 'Rich, smooth, and complex dark roast coffee', image: '/images/products/cold-brew.jpg', category: 'Drinks', tags: ['coffee', 'dark roast', 'signature'], inStock: true, quantity: 999 },
  { id: 'df-2', merchantId: 'daily-fresh-mart', name: 'Caffe Latte', price: 5.75, description: 'Espresso with steamed milk', image: '/images/products/latte.jpg', category: 'Drinks', tags: ['coffee', 'latte', 'espresso'], inStock: true, quantity: 999 },
  { id: 'df-3', merchantId: 'daily-fresh-mart', name: 'Chai Tea Latte', price: 5.50, description: 'Spiced black tea with steamed milk', image: '/images/products/tea.jpg', category: 'Drinks', tags: ['tea', 'chai', 'latte'], inStock: true, quantity: 999 },
  { id: 'df-4', merchantId: 'daily-fresh-mart', name: 'Iced Mocha', price: 6.25, description: 'Espresso, chocolate, milk over ice', image: '/images/products/mocha.jpg', category: 'Drinks', tags: ['coffee', 'mocha', 'iced'], inStock: true, quantity: 999 },
  { id: 'df-5', merchantId: 'daily-fresh-mart', name: 'Blueberry Scone', price: 3.95, description: 'Fresh baked scone with blueberries', image: '/images/products/blueberry-muffin.jpg', category: 'Bakery', tags: ['bakery', 'scone', 'blueberry'], inStock: true, quantity: 40 },
  { id: 'df-6', merchantId: 'daily-fresh-mart', name: 'Everything Bagel', price: 4.50, description: 'Toasted everything bagel with cream cheese', image: '/images/products/bagel.jpg', category: 'Bakery', tags: ['bakery', 'bagel', 'breakfast'], inStock: true, quantity: 35 },

  // Spice Kitchen Products
  { id: 'sk-1', merchantId: 'spice-kitchen', name: 'Chicken Biryani', price: 14.99, description: 'Fragrant basmati rice with tender chicken pieces', image: '/images/products/chicken-biryani.jpg', category: 'Biryani', tags: ['biryani', 'chicken', 'rice', 'indian'], inStock: true, quantity: 30 },
  { id: 'sk-2', merchantId: 'spice-kitchen', name: 'Veg Biryani', price: 12.99, description: 'Aromatic rice with mixed vegetables', image: '/images/products/veg-biryani.jpg', category: 'Biryani', tags: ['biryani', 'vegetarian', 'rice', 'indian'], inStock: true, quantity: 35 },
  { id: 'sk-3', merchantId: 'spice-kitchen', name: 'Hyderabadi Biryani', price: 15.99, description: 'Authentic Hyderabadi style dum biryani', image: '/images/products/biryani.jpg', category: 'Biryani', tags: ['biryani', 'hyderabadi', 'special', 'indian'], inStock: true, quantity: 25 },
  { id: 'sk-4', merchantId: 'spice-kitchen', name: 'Paneer Butter Masala', price: 13.50, description: 'Rich tomato gravy with soft paneer cubes', image: '/images/products/paneer-butter-masala.jpg', category: 'Curry', tags: ['curry', 'paneer', 'vegetarian', 'indian'], inStock: true, quantity: 30 },
  { id: 'sk-5', merchantId: 'spice-kitchen', name: 'Butter Naan', price: 3.50, description: 'Soft tandoori naan with butter', image: '/images/products/naan.jpg', category: 'Bread', tags: ['bread', 'naan', 'tandoor', 'indian'], inStock: true, quantity: 50 },

  // South Delight Products
  { id: 'sd-1', merchantId: 'south-delight', name: 'Masala Dosa', price: 9.99, description: 'Crispy dosa with spiced potato filling', image: '/images/products/dosa.jpg', category: 'Dosa', tags: ['dosa', 'masala', 'breakfast', 'south indian'], inStock: true, quantity: 40 },
  { id: 'sd-2', merchantId: 'south-delight', name: 'Idli Sambar (3 pcs)', price: 7.99, description: 'Soft steamed idlis with sambar', image: '/images/products/idli-sambar.jpg', category: 'Breakfast', tags: ['idli', 'sambar', 'breakfast', 'south indian'], inStock: true, quantity: 45 },
  { id: 'sd-3', merchantId: 'south-delight', name: 'Filter Coffee', price: 3.50, description: 'Traditional South Indian filter coffee', image: '/images/products/coffee-beans.jpg', category: 'Beverages', tags: ['coffee', 'filter', 'beverage', 'south indian'], inStock: true, quantity: 999 },

  // Sweet Treats Bakery Products
  { id: 'st-1', merchantId: 'sweet-treats-bakery', name: 'Chocolate Cake', price: 32.00, description: 'Rich Belgian chocolate layer cake', image: '/images/products/chocolate-cake.jpg', category: 'Cakes', tags: ['cake', 'chocolate', 'birthday', 'dessert'], inStock: true, quantity: 15 },
  { id: 'st-2', merchantId: 'sweet-treats-bakery', name: 'Vanilla Cake', price: 28.00, description: 'Classic vanilla sponge cake', image: '/images/products/cake.jpg', category: 'Cakes', tags: ['cake', 'vanilla', 'birthday', 'dessert'], inStock: true, quantity: 18 },
  { id: 'st-3', merchantId: 'sweet-treats-bakery', name: 'Red Velvet Cake', price: 35.00, description: 'Creamy red velvet with cream cheese frosting', image: '/images/products/cake.jpg', category: 'Cakes', tags: ['cake', 'red velvet', 'birthday', 'dessert'], inStock: true, quantity: 12 },
  { id: 'st-4', merchantId: 'sweet-treats-bakery', name: 'Donuts Box (6 pcs)', price: 12.99, description: 'Assorted glazed donuts', image: '/images/products/donuts.jpg', category: 'Pastries', tags: ['donuts', 'pastry', 'dessert', 'sweet'], inStock: true, quantity: 30 },
  { id: 'st-5', merchantId: 'sweet-treats-bakery', name: 'Chocolate Croissant', price: 4.50, description: 'Flaky croissant with chocolate filling', image: '/images/products/croissant.jpg', category: 'Pastries', tags: ['croissant', 'chocolate', 'pastry', 'bakery'], inStock: true, quantity: 35 },
  { id: 'st-6', merchantId: 'sweet-treats-bakery', name: 'Fresh Bread Loaf', price: 5.00, description: 'Freshly baked sourdough bread', image: '/images/products/fresh-bread.jpg', category: 'Bakery', tags: ['bread', 'fresh', 'sourdough'], inStock: true, quantity: 40 },
];

// =====================================================
// DUMMYJSON MERCHANTS (Electronics, Fashion, etc.)
// =====================================================
export const dummyjsonMerchantsDB: Merchant[] = [
  {
    id: 'tech-world',
    name: 'Tech World',
    type: 'Electronics Store',
    category: ['electronics', 'tech', 'gadgets', 'smartphones', 'laptops', 'phone', 'iphone'],
    dummyjsonCategories: ['smartphones', 'laptops', 'tablets', 'mobile-accessories'],
    distance: '1.5 mi',
    rating: 4.7,
    image: 'https://dummyjson.com/image/400x200/282828/ffffff?text=Tech+World',
    offers: ['10% off on smartphones', 'Free screen protector with laptops'],
    prepTime: '15-20 min',
    address: 'Lenox Square Mall, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'glamour-beauty',
    name: 'Glamour Beauty',
    type: 'Beauty & Skincare',
    category: ['beauty', 'skincare', 'cosmetics', 'fragrances', 'perfume', 'makeup'],
    dummyjsonCategories: ['beauty', 'skin-care', 'fragrances'],
    distance: '1.2 mi',
    rating: 4.8,
    image: 'https://dummyjson.com/image/400x200/E91E63/ffffff?text=Glamour+Beauty',
    offers: ['20% off on skincare', 'Free samples with every order'],
    prepTime: '10-15 min',
    address: 'Phipps Plaza, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'home-essentials',
    name: 'Home Essentials',
    type: 'Home & Kitchen',
    category: ['home', 'kitchen', 'furniture', 'decor', 'appliances'],
    dummyjsonCategories: ['furniture', 'home-decoration', 'kitchen-accessories'],
    distance: '1.8 mi',
    rating: 4.4,
    image: 'https://dummyjson.com/image/400x200/795548/ffffff?text=Home+Essentials',
    offers: ['Flat 25% off on furniture', 'Free delivery above $50'],
    prepTime: '20-30 min',
    address: 'Buckhead Village, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'fashion-hub',
    name: 'Fashion Hub',
    type: 'Fashion & Apparel',
    category: ['fashion', 'clothing', 'shirts', 'dresses', 'shoes', 'bags', 'dress', 'shirt'],
    dummyjsonCategories: ['mens-shirts', 'womens-dresses', 'tops', 'mens-shoes', 'womens-shoes', 'womens-bags'],
    distance: '2.0 mi',
    rating: 4.6,
    image: 'https://dummyjson.com/image/400x200/9C27B0/ffffff?text=Fashion+Hub',
    offers: ['Buy 2 Get 1 Free', 'Extra 10% off for members'],
    prepTime: '15-20 min',
    address: 'Lenox Square Mall, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'watch-world',
    name: 'Watch World',
    type: 'Watches & Accessories',
    category: ['watches', 'accessories', 'sunglasses', 'jewellery', 'watch'],
    dummyjsonCategories: ['mens-watches', 'womens-watches', 'sunglasses', 'womens-jewellery'],
    distance: '1.5 mi',
    rating: 4.9,
    image: 'https://dummyjson.com/image/400x200/FF9800/ffffff?text=Watch+World',
    offers: ['Luxury watches 30% off', 'Free gift wrapping'],
    prepTime: '10-15 min',
    address: 'Phipps Plaza, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'sports-zone',
    name: 'Sports Zone',
    type: 'Sports & Fitness',
    category: ['sports', 'fitness', 'accessories', 'outdoor', 'gym'],
    dummyjsonCategories: ['sports-accessories'],
    distance: '2.0 mi',
    rating: 4.5,
    image: 'https://dummyjson.com/image/400x200/2196F3/ffffff?text=Sports+Zone',
    offers: ['20% off on fitness gear', 'Free delivery'],
    prepTime: '15-20 min',
    address: 'Buckhead Village, Atlanta, GA 30326',
    isOpen: true,
  },
  {
    id: 'auto-mart',
    name: 'Auto Mart',
    type: 'Vehicles & Accessories',
    category: ['vehicles', 'motorcycle', 'automotive', 'bike'],
    dummyjsonCategories: ['motorcycle', 'vehicle'],
    distance: '3.0 mi',
    rating: 4.3,
    image: 'https://dummyjson.com/image/400x200/607D8B/ffffff?text=Auto+Mart',
    offers: ['EMI options available', 'Free service for 1 year'],
    prepTime: '30-45 min',
    address: 'Midtown, Atlanta, GA 30309',
    isOpen: true,
  },
];

// Combined merchants database
export const merchantsDB: Merchant[] = [...localMerchantsDB, ...dummyjsonMerchantsDB];

// =====================================================
// DUMMYJSON API FUNCTIONS
// =====================================================

// Transform DummyJSON product to our format
function transformDummyProduct(item: any, merchantId: string): Product {
  return {
    id: `${merchantId}-${item.id}`,
    merchantId,
    name: item.title,
    price: Math.round(item.price * 100) / 100, // Keep USD price
    originalPrice: Math.round((item.price / (1 - (item.discountPercentage || 0) / 100)) * 100) / 100,
    discount: item.discountPercentage,
    description: item.description,
    image: item.thumbnail || item.images?.[0] || '',
    category: item.category,
    tags: [
      item.category,
      item.brand?.toLowerCase(),
      ...(item.tags || []),
    ].filter(Boolean),
    inStock: item.stock > 0,
    quantity: item.stock || 0,
    rating: item.rating,
  };
}

// Fetch products by category from the bundled DummyJSON snapshot.
export async function fetchProductsByCategory(category: string): Promise<any[]> {
  const cat = category.toLowerCase();
  return DUMMYJSON_PRODUCTS.filter((p) => (p.category || '').toLowerCase() === cat);
}

// Search products in the bundled DummyJSON snapshot.
// Mirrors the /products/search?q=... behavior: matches title, description,
// brand, category and tags (case-insensitive).
export async function searchDummyJsonAPI(query: string): Promise<any[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DUMMYJSON_PRODUCTS.filter((p) => {
    const haystack = [
      p.title,
      p.description,
      p.brand,
      p.category,
      ...(Array.isArray(p.tags) ? p.tags : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

// =====================================================
// UNIFIED SEARCH FUNCTIONS
// =====================================================

// Search merchants - checks both local and DummyJSON products
export async function searchMerchants(query: string): Promise<Merchant[]> {
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(word => word.length > 2);

  // Search DummyJSON to find matching categories
  const dummyResults = await searchDummyJsonAPI(query);
  const matchingDummyCategories = new Set(dummyResults.map((p: any) => p.category));

  // Search local products
  const matchingLocalMerchants = new Set<string>();
  for (const product of localProductsDB) {
    const matches = keywords.some(kw =>
      product.name.toLowerCase().includes(kw) ||
      product.tags.some(t => t.includes(kw)) ||
      product.category.toLowerCase().includes(kw) ||
      product.description.toLowerCase().includes(kw)
    );
    if (matches) {
      matchingLocalMerchants.add(product.merchantId);
    }
  }

  // Find matching merchants
  const results = merchantsDB.filter(merchant => {
    // Check if local merchant has matching products
    if (matchingLocalMerchants.has(merchant.id)) return true;

    // Check if DummyJSON merchant has matching categories
    if (merchant.dummyjsonCategories?.some(cat => matchingDummyCategories.has(cat))) return true;

    // Keyword matching on merchant info
    const keywordMatch = keywords.some(keyword =>
      merchant.category.some(cat => cat.includes(keyword)) ||
      merchant.type.toLowerCase().includes(keyword) ||
      merchant.name.toLowerCase().includes(keyword)
    );

    return keywordMatch && merchant.isOpen;
  });

  // Sort: merchants with actual matching products first
  return results.sort((a, b) => {
    const aHasProducts = matchingLocalMerchants.has(a.id) ||
      a.dummyjsonCategories?.some(cat => matchingDummyCategories.has(cat));
    const bHasProducts = matchingLocalMerchants.has(b.id) ||
      b.dummyjsonCategories?.some(cat => matchingDummyCategories.has(cat));

    if (aHasProducts && !bHasProducts) return -1;
    if (!aHasProducts && bHasProducts) return 1;
    return parseFloat(a.distance) - parseFloat(b.distance);
  });
}

// Search products for a specific merchant
export async function searchProducts(merchantId: string, query: string): Promise<Product[]> {
  const merchant = merchantsDB.find(m => m.id === merchantId);
  if (!merchant) return [];

  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(word => word.length > 2);

  // Check if it's a local merchant
  const isLocalMerchant = localMerchantsDB.some(m => m.id === merchantId);

  if (isLocalMerchant) {
    // Search local products
    const merchantProducts = localProductsDB.filter(p => p.merchantId === merchantId && p.inStock);

    if (keywords.length > 0) {
      const matching = merchantProducts.filter(product =>
        keywords.some(keyword =>
          product.tags.some(tag => tag.includes(keyword)) ||
          product.name.toLowerCase().includes(keyword) ||
          product.category.toLowerCase().includes(keyword) ||
          product.description.toLowerCase().includes(keyword)
        )
      );
      return matching;
    }
    return merchantProducts;
  }

  // DummyJSON merchant - search API
  if (merchant.dummyjsonCategories) {
    const searchResults = await searchDummyJsonAPI(query);

    // Filter to only products in this merchant's categories
    const merchantProducts = searchResults
      .filter((item: any) => merchant.dummyjsonCategories!.includes(item.category))
      .map((item: any) => transformDummyProduct(item, merchantId));

    if (merchantProducts.length > 0) {
      return merchantProducts;
    }

    // Fallback: fetch all products from merchant's categories
    const allCategoryProducts: Product[] = [];
    for (const category of merchant.dummyjsonCategories) {
      const categoryProducts = await fetchProductsByCategory(category);

      const filtered = keywords.length > 0
        ? categoryProducts.filter((item: any) =>
            keywords.some(kw =>
              item.title.toLowerCase().includes(kw) ||
              item.description.toLowerCase().includes(kw) ||
              item.category.toLowerCase().includes(kw) ||
              item.tags?.some((t: string) => t.toLowerCase().includes(kw))
            )
          )
        : categoryProducts;

      allCategoryProducts.push(
        ...filtered.map((item: any) => transformDummyProduct(item, merchantId))
      );
    }
    return allCategoryProducts;
  }

  return [];
}

// Get all products for a merchant
export async function getMerchantProducts(merchantId: string): Promise<Product[]> {
  const merchant = merchantsDB.find(m => m.id === merchantId);
  if (!merchant) return [];

  // Check if it's a local merchant
  const isLocalMerchant = localMerchantsDB.some(m => m.id === merchantId);

  if (isLocalMerchant) {
    return localProductsDB.filter(p => p.merchantId === merchantId && p.inStock);
  }

  // DummyJSON merchant
  if (merchant.dummyjsonCategories) {
    const allProducts: Product[] = [];
    for (const category of merchant.dummyjsonCategories) {
      const categoryProducts = await fetchProductsByCategory(category);
      allProducts.push(
        ...categoryProducts.map((item: any) => transformDummyProduct(item, merchantId))
      );
    }
    return allProducts;
  }

  return [];
}

// Legacy sync functions for backward compatibility
export function searchMerchantsSync(query: string): Merchant[] {
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(word => word.length > 2);

  return merchantsDB.filter(merchant => {
    return keywords.some(keyword =>
      merchant.category.some(cat => cat.includes(keyword)) ||
      merchant.type.toLowerCase().includes(keyword) ||
      merchant.name.toLowerCase().includes(keyword)
    ) || merchant.category.some(cat => q.includes(cat));
  }).filter(m => m.isOpen);
}

export function searchProductsSync(merchantId: string, query: string): Product[] {
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter(word => word.length > 2);

  const merchantProducts = localProductsDB.filter(p => p.merchantId === merchantId && p.inStock);

  if (keywords.length > 0) {
    return merchantProducts.filter(product =>
      keywords.some(keyword =>
        product.tags.some(tag => tag?.includes(keyword)) ||
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword)
      )
    );
  }

  return merchantProducts;
}

// For backward compatibility
export const productsDB = localProductsDB;
