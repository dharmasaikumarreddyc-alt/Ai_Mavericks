'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CheckoutClient() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<'free' | 'flat'>('free');
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        // Fallback to empty cart
        setCart({ items: [], count: 0, subtotal: 0, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart({ items: [], count: 0, subtotal: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = () => {
    if (shippingMethod === 'free') return 0;
    return 25.75;
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.subtotal + calculateShipping();
  };

  if (loading) {
    return (
      <div className="content-inner-1">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="content-inner-1">
        <div className="container">
          <div className="text-center py-5">
            <h4>Your cart is empty</h4>
            <p className="text-muted mb-4">Add some items to your cart before checking out</p>
            <Link href="/shop" className="btn btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-inner-1">
      <div className="container">
        <div className="row shop-checkout">
          <div className="col-xl-8">
            <h4 className="title m-b15">Billing details</h4>
            <div className="accordion dz-accordion accordion-sm" id="accordionFaq">
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingOne">
                  <a href="#" className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                    Returning customer? Click here to login
                    <span className="toggle-close"></span>
                  </a>
                </h2>
                <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionFaq">
                  <div className="accordion-body">
                    <p className="m-b0">If your order has not yet shipped, you can contact us to change your shipping address</p>
                  </div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingTwo">
                  <a href="#" className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="true" aria-controls="collapseOne">
                    Have a coupon? Click here to enter your code
                    <span className="toggle-close"></span>
                  </a>
                </h2>
                <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionFaq">
                  <div className="accordion-body">
                    <p className="m-b0">If your order has not yet shipped, you can contact us to change your shipping address</p>
                  </div>
                </div>
              </div>
            </div>
            <form className="row">
              <div className="col-md-6">
                <div className="form-group m-b25">
                  <label className="label-title">First Name</label>
                  <input name="dzName" required className="form-control" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group m-b25">
                  <label className="label-title">Last Name</label>
                  <input name="dzName" required className="form-control" />
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group m-b25">
                  <label className="label-title">Company name (optional)</label>
                  <input name="dzName" className="form-control" />
                </div>
              </div>
              <div className="col-md-12">
                <div className="m-b25">
                  <label className="label-title">Country / Region *</label>
                  <select className="default-select form-select w-100">
                    <option>India</option>
                    <option value="1">USA</option>
                    <option value="2">UK</option>
                    <option value="3">Australia</option>
                  </select>
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group m-b25">
                  <label className="label-title">Street address *</label>
                  <input name="dzName" required className="form-control m-b15" placeholder="House number and street name" />
                  <input name="dzName" required className="form-control" placeholder="Apartment, suite, unit, etc. (optional)" />
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group m-b25">
                  <label className="label-title">Town / City *</label>
                  <input name="dzName" required className="form-control" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="m-b25">
                  <label className="label-title">State *</label>
                  <select className="default-select form-select w-100">
                    <option>Telangana</option>
                    <option value="1">Karnataka</option>
                    <option value="2">Maharashtra</option>
                    <option value="3">Tamil Nadu</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group m-b25">
                  <label className="label-title">Postcode / ZIP *</label>
                  <input name="dzName" required className="form-control" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group m-b25">
                  <label className="label-title">Phone *</label>
                  <input name="dzName" required className="form-control" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group m-b25">
                  <label className="label-title">Email address *</label>
                  <input name="dzName" required className="form-control" />
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <div className="custom-control custom-checkbox">
                    <input type="checkbox" className="form-check-input" id="basic_checkbox_1" />
                    <label className="form-check-label" htmlFor="basic_checkbox_1">Create an account? </label>
                  </div>
                </div>
                <div className="form-group">
                  <div className="custom-control custom-checkbox">
                    <input type="checkbox" className="form-check-input" id="basic_checkbox_2" />
                    <label className="form-check-label" htmlFor="basic_checkbox_2">Ship to a different address?</label>
                  </div>
                </div>
              </div>
              <div className="col-md-12 m-b25">
                <div className="form-group">
                  <label className="label-title">Order notes (optional)</label>
                  <textarea id="comments" placeholder="Notes about your order, e.g. special notes for delivery." className="form-control" name="comment" cols={90} rows={5}></textarea>
                </div>
              </div>
            </form>
          </div>
          <div className="col-xl-4 side-bar">
            <h4 className="title m-b15">Your Order</h4>
            <div className="order-detail sticky-top">
              {cart.items.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className={`cart-item style-1 ${index === cart.items.length - 1 ? 'mb-0' : ''}`}>
                  <div className="dz-media">
                    <img src={item.image || '/images/shop/shop-cart/pic1.jpg'} alt={item.name} />
                  </div>
                  <div className="dz-content">
                    <h6 className="title mb-0">{item.name}</h6>
                    <span className="price">${item.price.toFixed(2)} × {item.quantity}</span>
                  </div>
                </div>
              ))}
              <table>
                <tbody>
                  <tr className="subtotal">
                    <td>Subtotal</td>
                    <td className="price">${cart.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr className="title">
                    <td><h6 className="title font-weight-500">Shipping</h6></td>
                    <td></td>
                  </tr>
                  <tr className="shipping">
                    <td>
                      <div className="custom-control custom-checkbox">
                        <input
                          className="form-check-input radio"
                          type="radio"
                          name="shippingMethod"
                          id="flexRadioDefault1"
                          checked={shippingMethod === 'free'}
                          onChange={() => setShippingMethod('free')}
                        />
                        <label className="form-check-label" htmlFor="flexRadioDefault1">
                          Free shipping
                        </label>
                      </div>
                      <div className="custom-control custom-checkbox">
                        <input
                          className="form-check-input radio"
                          type="radio"
                          name="shippingMethod"
                          id="flexRadioDefault2"
                          checked={shippingMethod === 'flat'}
                          onChange={() => setShippingMethod('flat')}
                        />
                        <label className="form-check-label" htmlFor="flexRadioDefault2">
                          Flat Rate:
                        </label>
                      </div>
                    </td>
                    <td className="price">${calculateShipping().toFixed(2)}</td>
                  </tr>
                  <tr className="total">
                    <td>Total</td>
                    <td className="price">${calculateTotal().toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="accordion dz-accordion accordion-sm" id="accordionFaq1">
                <div className="accordion-item">
                  <div className="accordion-header" id="heading1">
                    <div className="accordion-button collapsed custom-control custom-checkbox border-0" data-bs-toggle="collapse" data-bs-target="#collapse1" role="navigation" aria-expanded="true" aria-controls="collapse1">
                      <input className="form-check-input radio" type="radio" name="paymentMethod" id="flexRadioDefault3" defaultChecked />
                      <label className="form-check-label" htmlFor="flexRadioDefault3">
                        Direct bank transfer
                      </label>
                    </div>
                  </div>
                  <div id="collapse1" className="accordion-collapse collapse show" aria-labelledby="heading1" data-bs-parent="#accordionFaq1">
                    <div className="accordion-body">
                      <p className="m-b0">Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will not be shipped until the funds have cleared in our account.</p>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-header" id="heading2">
                    <div className="accordion-button collapsed custom-control custom-checkbox border-0" data-bs-toggle="collapse" data-bs-target="#collapse2" role="navigation" aria-expanded="true" aria-controls="collapse2">
                      <input className="form-check-input radio" type="radio" name="paymentMethod" id="flexRadioDefault5" />
                      <label className="form-check-label" htmlFor="flexRadioDefault5">
                        Cash on delivery
                      </label>
                    </div>
                  </div>
                  <div id="collapse2" className="accordion-collapse collapse" aria-labelledby="collapse2" data-bs-parent="#accordionFaq1">
                    <div className="accordion-body">
                      <p className="m-b0">Pay with cash upon delivery.</p>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-header" id="heading3">
                    <div className="accordion-button collapsed custom-control custom-checkbox border-0" data-bs-toggle="collapse" data-bs-target="#collapse3" role="navigation" aria-expanded="true" aria-controls="collapse3">
                      <input className="form-check-input radio" type="radio" name="paymentMethod" id="flexRadioDefault4" />
                      <label className="form-check-label" htmlFor="flexRadioDefault4">
                        PayPal / UPI
                      </label>
                    </div>
                  </div>
                  <div id="collapse3" className="accordion-collapse collapse" aria-labelledby="heading3" data-bs-parent="#accordionFaq1">
                    <div className="accordion-body">
                      <p className="m-b0">Pay via UPI or PayPal; you can pay with your credit card if you don't have a PayPal account.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <button type="button" className="btn btn-secondary btnhover w-100">PLACE ORDER</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
