import type { Merchant, Product } from '../api/agents/data';

export interface CatalogProductView {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  category: string[];
  tags: string[];
  description: string;
  merchant: string;
  merchant_id: string;
  location: string;
  prepTime: string;
  rating: number;
  inStock: boolean;
  quantity: number;
}

export function toCatalogProductView(product: Product, merchants: Merchant[]): CatalogProductView {
  const merchant = merchants.find((candidate) => candidate.id === product.merchantId);
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    discount: product.discount ? `${product.discount}%` : undefined,
    image: product.image,
    category: [product.category],
    tags: product.tags,
    description: product.description,
    merchant: merchant?.name || 'Local Shop',
    merchant_id: product.merchantId,
    location: merchant?.address || 'Synthetic demo location',
    prepTime: merchant?.prepTime || 'Verify with merchant',
    rating: product.rating || merchant?.rating || 4.5,
    inStock: product.inStock,
    quantity: product.quantity,
  };
}
