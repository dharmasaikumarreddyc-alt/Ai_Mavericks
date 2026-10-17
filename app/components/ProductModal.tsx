'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { backendUrl } from '../lib/backend';
import { clearAuthenticatedToken, getAuthenticatedSession } from '../lib/auth';

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

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      checkIfInCart();
      // Trigger animation after mount
      setTimeout(() => setIsVisible(true), 10);
    } else {
      document.body.style.overflow = 'unset';
      setIsVisible(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [product]);

  const checkIfInCart = async () => {
    if (!product) return;

    try {
      const session = await getAuthenticatedSession('customer');
      if (!session) {
        setIsInCart(false);
        return;
      }

      const response = await fetch(`${backendUrl}/cart`, {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const productId = typeof product.id === 'string'
          ? product.id.split('_')[1]
          : product.id.toString();

        const inCart = data.items?.some((item: any) =>
          item.product_id === productId || item.product_id === product.id.toString()
        );
        setIsInCart(inCart);
      }
    } catch (error) {
      console.error('Error checking cart:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const session = await getAuthenticatedSession('customer');
    if (!session) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    setIsAdding(true);

    try {
      // Parse merchant_id and product_id from combined ID
      let merchantId = product.merchant_id;
      let productId = product.id.toString();

      if (typeof product.id === 'string' && product.id.includes('_')) {
        const parts = product.id.split('_');
        merchantId = parts[0];
        productId = parts[1];
      }

      const response = await fetch(`${backendUrl}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          product_id: productId,
          quantity: quantity
        })
      });

      if (response.ok) {
        setIsInCart(true);
        // Trigger a cart update event for other components
        window.dispatchEvent(new Event('cartUpdated'));
      } else if (response.status === 401) {
        // Token expired, redirect to login
        clearAuthenticatedToken('customer');
        router.push('/login');
      } else {
        console.error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleGoToCart = () => {
    onClose();
    router.push('/cart');
  };

  if (!product) return null;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <li
          key={i}
          className={i < fullStars ? 'star-fill' : ''}
        >
          <i className="flaticon-star-1"></i>
        </li>
      );
    }
    return stars;
  };


  return (
    <>
      {/* Modal Backdrop */}
      <div
        className={`modal-backdrop fade ${isVisible ? 'show' : ''}`}
        style={{
          zIndex: 1040,
          transition: 'opacity 0.3s ease-in-out',
          opacity: isVisible ? 0.5 : 0
        }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className={`modal quick-view-modal fade ${isVisible ? 'show' : ''}`}
        style={{
          display: 'block',
          zIndex: 1050,
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.9)'
        }}
        tabIndex={-1}
        role="dialog"
        aria-hidden="false"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="icon feather icon-x"></i>
            </button>
            <div className="modal-body">
              <div className="row g-xl-4 g-3">
                <div className="col-xl-6 col-md-6">
                  <div className="dz-product-detail mb-0">
                    <div className="dz-media">
                      <img src={product.image} alt={product.name} className="img-fluid" />
                    </div>
                  </div>
                </div>
                <div className="col-xl-6 col-md-6">
                  <div className="dz-product-detail style-2 ps-xl-3 ps-0 pt-2 mb-0">
                    <div className="dz-content">
                      <div className="dz-content-footer">
                        <div className="dz-content-start">
                          {product.discount && (
                            <span className="badge bg-secondary mb-2">{product.discount}</span>
                          )}
                          <h4 className="title mb-1">{product.name}</h4>
                          <div className="review-num">
                            <ul className="dz-rating me-2">
                              {renderStars(product.rating)}
                            </ul>
                            <span className="text-secondary me-2">{product.rating} Rating</span>
                            <span className="small text-muted">Synthetic demo rating</span>
                          </div>
                        </div>
                      </div>
                      <p className="para-text">
                        {product.description}
                      </p>
                      <div className="meta-content m-b20 d-flex align-items-end">
                        <div className="me-3">
                          <span className="form-label">Price</span>
                          <span className="price">
                            ${product.price.toFixed(2)}
                            {product.originalPrice && (
                              <> <del>${product.originalPrice.toFixed(2)}</del></>
                            )}
                          </span>
                        </div>
                        <div className="btn-quantity light me-0">
                          <label className="form-label">Quantity</label>
                          <div className="input-group">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              type="button"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                              -
                            </button>
                            <input
                              type="text"
                              className="form-control text-center"
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setQuantity(Math.max(1, val));
                              }}
                              style={{ width: '60px' }}
                            />
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              type="button"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="cart-btn">
                        {isInCart ? (
                          <button
                            onClick={handleGoToCart}
                            className="btn btn-secondary text-uppercase"
                          >
                            Go To Cart
                          </button>
                        ) : (
                          <button
                            onClick={handleAddToCart}
                            className="btn btn-secondary text-uppercase"
                            disabled={isAdding}
                          >
                            {isAdding ? 'Adding...' : 'Add To Cart'}
                          </button>
                        )}
                      </div>
                      <div className="dz-info mb-0">
                        <ul>
                          <li>
                            <strong>Category:</strong>
                          </li>
                          {product.category.map((cat, idx) => (
                            <li key={idx}>
                              <Link href="/shop">{cat}{idx < product.category.length - 1 ? ',' : ''}</Link>
                            </li>
                          ))}
                        </ul>
                        <ul>
                          <li>
                            <strong>Tags:</strong>
                          </li>
                          {product.tags.map((tag, idx) => (
                            <li key={idx}>
                              <Link href="/shop">{tag}{idx < product.tags.length - 1 ? ',' : ''}</Link>
                            </li>
                          ))}
                        </ul>
                        <ul>
                          <li>
                            <strong>Merchant:</strong>
                          </li>
                          <li>{product.merchant}</li>
                        </ul>
                        <ul>
                          <li>
                            <strong>Location:</strong>
                          </li>
                          <li>{product.location}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
