'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { backendUrl } from '../lib/backend';
import { clearAuthenticatedToken, getAuthenticatedSession } from '../lib/auth';

interface CartItem {
  merchant_id: string;
  merchant_name: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartData {
  items: CartItem[];
  count: number;
  subtotal: number;
  total: number;
}

export default function CartClient() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCart();

    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      fetchCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchCart = async () => {
    try {
      const session = await getAuthenticatedSession('customer');
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${backendUrl}/cart`, {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else if (response.status === 401) {
        clearAuthenticatedToken('customer');
        router.push('/login');
      } else {
        setError('Failed to load cart');
      }
    } catch (err) {
      setError('Error loading cart');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (merchantId: string, productId: string, newQuantity: number) => {
    const itemKey = `${merchantId}_${productId}`;
    setUpdating(itemKey);

    try {
      const session = await getAuthenticatedSession('customer');
      if (!session) return;

      const response = await fetch(`${backendUrl}/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          product_id: productId,
          quantity: newQuantity
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart);
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (merchantId: string, productId: string) => {
    const itemKey = `${merchantId}_${productId}`;
    setUpdating(itemKey);

    try {
      const session = await getAuthenticatedSession('customer');
      if (!session) return;

      const response = await fetch(
        `${backendUrl}/cart/remove?merchant_id=${merchantId}&product_id=${productId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart);
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating(null);
    }
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-5">
        <h4>Your cart is empty</h4>
        <p className="text-muted">Add some products to get started!</p>
        <Link href="/shop" className="btn btn-primary mt-3">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="table-responsive">
          <table className="table check-tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th></th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => {
                const itemKey = `${item.merchant_id}_${item.product_id}`;
                const isUpdating = updating === itemKey;
                const itemSubtotal = item.price * item.quantity;

                return (
                  <tr key={itemKey}>
                    <td className="product-item-img">
                      <img src={item.image || '/images/shop/product/1.png'} alt={item.name} />
                    </td>
                    <td className="product-item-name">{item.name}</td>
                    <td className="product-item-price">${item.price.toFixed(2)}</td>
                    <td className="product-item-quantity">
                      <div className="quantity btn-quantity style-1 me-3">
                        <div className="quantity-controls d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => updateQuantity(item.merchant_id, item.product_id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                          >
                            -
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => updateQuantity(item.merchant_id, item.product_id, item.quantity + 1)}
                            disabled={isUpdating}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="product-item-totle">${itemSubtotal.toFixed(2)}</td>
                    <td className="product-item-close">
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.merchant_id, item.product_id)}
                        style={{ pointerEvents: isUpdating ? 'none' : 'auto' }}
                      >
                        <i className="ti-close"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-end m-t30"><Link href="/shop" className="btn btn-outline-secondary">Continue shopping</Link></div>
      </div>
      <div className="col-lg-4">
        <h4 className="title mb15">Cart Total</h4>
        <div className="cart-detail">
          <p className="small text-muted">Delivery, service fee and tax are recalculated by the checkout service.</p>
          <table>
            <tbody>
              <tr className="total">
                <td>
                  <h6 className="mb-0">Cart subtotal</h6>
                </td>
                <td className="price">
                  ${cart.subtotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <Link href="/checkout" className="btn btn-secondary w-100">PLACE ORDER</Link>
        </div>
      </div>
    </div>
  );
}
