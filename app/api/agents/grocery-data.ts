import type { Merchant, Product } from './data';

export const groceryMerchant: Merchant = {
  id: 'loopora-fresh-market',
  name: 'Loopora Fresh Market',
  type: 'Grocery & Fresh Market',
  category: ['grocery', 'ingredients', 'rice', 'spices', 'fresh produce', 'biryani'],
  distance: '0.4 mi',
  rating: 4.8,
  image: '/images/products/daily-fresh-mart.jpg',
  offers: ['Free delivery above $25'],
  prepTime: '10-15 min',
  address: '180 Demo Market St, Atlanta, GA 30326',
  isOpen: true,
};

export const groceryProducts: Product[] = [
  {
    id: 'fm-biryani-pantry',
    merchantId: groceryMerchant.id,
    name: 'Biryani Pantry Essentials Kit',
    price: 11.99,
    description: 'Basmati rice, biryani masala, whole spices and ghee for a home biryani base.',
    image: '/images/products/biryani.jpg',
    category: 'Recipe Kits',
    tags: ['biryani', 'ingredients', 'basmati rice', 'biryani masala', 'whole spices', 'ghee', 'pantry'],
    inStock: true,
    quantity: 20,
  },
  {
    id: 'fm-biryani-chicken',
    merchantId: groceryMerchant.id,
    name: 'Chicken Biryani Fresh Ingredients Pack',
    price: 13.99,
    description: 'Chicken, onions, tomatoes, yogurt, mint and coriander for chicken biryani.',
    image: '/images/products/chicken-biryani.jpg',
    category: 'Recipe Kits',
    tags: ['biryani', 'ingredients', 'chicken', 'onion', 'tomato', 'yogurt', 'mint', 'coriander', 'fresh'],
    inStock: true,
    quantity: 15,
  },
  {
    id: 'fm-biryani-veg',
    merchantId: groceryMerchant.id,
    name: 'Vegetable Biryani Fresh Ingredients Pack',
    price: 9.99,
    description: 'Mixed vegetables, onions, tomatoes, yogurt, mint and coriander for vegetable biryani.',
    image: '/images/products/veg-biryani.jpg',
    category: 'Recipe Kits',
    tags: ['biryani', 'ingredients', 'vegetarian', 'vegetables', 'onion', 'tomato', 'yogurt', 'mint', 'coriander', 'fresh'],
    inStock: true,
    quantity: 18,
  },
];

export function isRecipeShoppingIntent(query: string): boolean {
  const normalized = query.toLowerCase();
  const recipeCue = /\b(ingredient|ingredients|grocer|groceries|cook|cooking|make|prepare|recipe)\b/.test(normalized);
  const supportedDish = /\bbiryani\b/.test(normalized);
  return recipeCue && supportedDish;
}

export function prefersVegetarianBiryani(query: string): boolean {
  return /\b(veg|vegetarian|veggie|meatless)\b/i.test(query);
}

export function deterministicBiryaniIngredients(query: string): string[] {
  const common = ['basmati rice', 'biryani masala', 'whole spices', 'ghee', 'onions', 'tomatoes', 'yogurt', 'mint', 'coriander'];
  return prefersVegetarianBiryani(query)
    ? [...common, 'mixed vegetables']
    : [...common, 'chicken'];
}
