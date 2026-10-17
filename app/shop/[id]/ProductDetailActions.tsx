'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CatalogProductView } from '../../lib/catalog-view';
import { backendUrl } from '../../lib/backend';
import { clearAuthenticatedToken, getAuthenticatedSession } from '../../lib/auth';

export default function ProductDetailActions({ product }: { product: CatalogProductView }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');

  const addToCart = async () => {
    const session = await getAuthenticatedSession('customer');
    if (!session) {
      router.push('/login');
      return;
    }

    setStatus('adding');
    try {
      const response = await fetch(`${backendUrl}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          merchant_id: product.merchant_id,
          product_id: product.id,
          quantity,
        }),
      });
      if (response.status === 401) {
        clearAuthenticatedToken('customer');
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('Cart request failed');
      setStatus('added');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="aisle-product-actions">
      <label htmlFor="product-quantity">Quantity</label>
      <div>
        <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
        <input id="product-quantity" type="number" min="1" max="20" value={quantity} onChange={(event) => setQuantity(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} />
        <button type="button" onClick={() => setQuantity((value) => Math.min(20, value + 1))} aria-label="Increase quantity">+</button>
        {status === 'added' ? (
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/cart')}>View cart</button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={addToCart} disabled={!product.inStock || status === 'adding'}>
            {status === 'adding' ? 'Adding…' : product.inStock ? 'Add to cart' : 'Unavailable'}
          </button>
        )}
      </div>
      {status === 'error' && <p role="alert">The cart service is unavailable. Start the backend and try again.</p>}
    </div>
  );
}
