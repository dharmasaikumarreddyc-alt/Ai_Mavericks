import { NextResponse } from 'next/server';
import { localProductsDB, localMerchantsDB, searchDummyJsonAPI } from '../agents/data';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  category: string[];
  tags: string[];
  description: string;
  merchant: string;
  merchant_id?: string;
  location: string;
  rating: number;
  inStock: boolean;
}

// Transform local product to shop format
function transformLocalProduct(p: any): Product {
  const merchant = localMerchantsDB.find(m => m.id === p.merchantId);
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    discount: p.discount ? `${p.discount}%` : undefined,
    image: p.image,
    category: [p.category],
    tags: p.tags,
    description: p.description,
    merchant: merchant?.name || 'Local Shop',
    merchant_id: p.merchantId,
    location: merchant?.address || 'Hyderabad',
    rating: p.rating || merchant?.rating || 4.5,
    inStock: p.inStock,
  };
}

// Transform DummyJSON product to shop format
function transformDummyProduct(item: any): Product {
  return {
    id: `dj-${item.id}`,
    name: item.title,
    price: Math.round(item.price * 100) / 100, // Keep USD price
    originalPrice: Math.round((item.price / (1 - (item.discountPercentage || 0) / 100)) * 100) / 100,
    discount: item.discountPercentage ? `${Math.round(item.discountPercentage)}%` : undefined,
    image: item.thumbnail || item.images?.[0] || '',
    category: [item.category],
    tags: item.tags || [],
    description: item.description,
    merchant: item.brand || 'Online Store',
    merchant_id: 'dummyjson',
    location: 'Hyderabad',
    rating: item.rating || 4.0,
    inStock: item.stock > 0,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');

  // Try Python backend first if configured
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`${BACKEND_URL}/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          return NextResponse.json({
            products: data.products,
            total: data.total || data.products.length,
            success: true,
          });
        }
      }
    } catch {
      // Backend not available, fall through to local/DummyJSON
    }
  }

  // Fallback: Combine local products + DummyJSON products
  try {
    let products: Product[] = [];

    // Add local products
    let localProducts = localProductsDB.map(transformLocalProduct);

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      localProducts = localProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.category.some(c => c.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (category) {
      const cat = category.toLowerCase();
      localProducts = localProducts.filter(p =>
        p.category.some(c => c.toLowerCase().includes(cat)) ||
        p.tags.some(t => t.toLowerCase().includes(cat))
      );
    }

    products = [...localProducts];

    // Fetch from DummyJSON if search provided or want more products
    if (search || products.length < limit) {
      const dummyProducts = await searchDummyJsonAPI(search || 'phone laptop watch perfume');
      const transformedDummy = dummyProducts.map(transformDummyProduct);

      // Filter DummyJSON by category if needed
      let filteredDummy = transformedDummy;
      if (category) {
        const cat = category.toLowerCase();
        filteredDummy = transformedDummy.filter(p =>
          p.category.some(c => c.toLowerCase().includes(cat)) ||
          p.tags.some(t => t.toLowerCase().includes(cat))
        );
      }

      products = [...products, ...filteredDummy];
    }

    // Apply limit
    const limitedProducts = products.slice(0, limit);

    return NextResponse.json({
      products: limitedProducts,
      total: products.length,
      success: true,
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ products: [], total: 0, success: true });
  }
}
