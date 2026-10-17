'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductModal from './ProductModal';
import { getAuthenticatedSession } from '../lib/auth';

interface Product {
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

export default function ProductList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async (category?: string, search?: string, signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const response = await fetch(`/api/products${params.size ? `?${params}` : ''}`, { signal });
      const data = await response.json();

      if (!signal?.aborted && data.success) {
        setProducts(data.products);
      } else if (!signal?.aborted) {
        setError('Failed to load products');
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError('Error fetching products');
        console.error(err);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadShop = async () => {
      const customerSession = await getAuthenticatedSession('customer');
      const merchantSession = await getAuthenticatedSession('merchant');
      if (controller.signal.aborted) return;
      if (merchantSession && !customerSession) {
        router.replace('/login');
        return;
      }

      const params = new URLSearchParams(queryKey);
      setSearch(params.get('search') || '');
      await fetchProducts(params.get('category') || undefined, params.get('search') || undefined, controller.signal);
    };
    void loadShop();
    return () => controller.abort();
  }, [fetchProducts, queryKey, router]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = search.trim();
    const url = normalized ? `/shop?search=${encodeURIComponent(normalized)}` : '/shop';
    router.replace(url, { scroll: false });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <>
      <form className="aisle-shop-search" onSubmit={submitSearch} role="search">
        <label htmlFor="shop-search">Search the synthetic demo catalog</label>
        <div className="aisle-shop-search-row">
          <input
            id="shop-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try coffee, breakfast, bakery, dosa…"
          />
          <button type="submit" className="btn btn-secondary">Search</button>
        </div>
        <small>Matches product names, descriptions, categories, tags, and merchants.</small>
      </form>
      {products.length === 0 && (
        <div className="alert alert-light text-center" role="status">
          No food or drinks match this search. Try coffee, bakery, breakfast, or dosa.
        </div>
      )}
      <div>
        <div className="row">
          {products.map((product) => (
            <div key={product.id} className="col-6 col-xl-3 col-lg-4 col-md-4 col-sm-6 m-md-b15 m-b30">
              <div className="shop-card style-1">
                <div className="dz-media">
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                  />
                  <div className="shop-meta">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="btn btn-secondary btn-md btn-rounded"
                    >
                      <i className="fa-solid fa-eye d-md-none d-block"></i>
                      <span className="d-md-block d-none">Quick View</span>
                    </button>
                  </div>
                </div>
                <div className="dz-content">
                  <h5 className="title">
                    <Link href={`/shop/${product.id}`}>{product.name}</Link>
                  </h5>
                  <h5 className="price">${product.price.toFixed(2)}</h5>
                  <Link className="aisle-product-detail-link" href={`/shop/${product.id}`}>Evidence & details <i className="fas fa-arrow-right" /></Link>
                </div>
                {product.discount && (
                  <div className="product-tag">
                    <span className="badge ">{product.discount}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
