'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import AccountSidebar from '../../../components/AccountSidebar';

interface TimelineEvent {
  status: string;
  time: string;
  description: string;
}

interface Order {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  pricing: {
    subtotal: number;
    serviceFee: number;
    deliveryFee: number;
    tax: number;
    loyaltyDiscount: number;
    total: number;
  };
  payment: {
    token: string;
    method: string;
    status: string;
  };
  status: string;
  loyaltyPointsEarned: number;
  createdAt: string;
  estimatedReady: string;
  timeline?: TimelineEvent[];
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('order-history');
  const [lastSync, setLastSync] = useState('');
  const terminalRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchOrder();
    // Live updates: poll until the order reaches a terminal state, so the
    // customer sees the merchant advance it (confirmed -> preparing -> ready...).
    const interval = setInterval(() => {
      if (terminalRef.current) return;
      fetchOrder();
    }, 4000);
    return () => clearInterval(interval);
  }, [resolvedParams.id, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrder(data.order);
          setLastSync(new Date().toLocaleTimeString());
          terminalRef.current = data.order.status === 'delivered' || data.order.status === 'cancelled';
        } else {
          setError('Order not found');
        }
      } else {
        setError('Failed to fetch order');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; label: string }> = {
      pending: { bg: 'bg-warning', label: 'Pending' },
      confirmed: { bg: 'bg-info', label: 'Confirmed' },
      preparing: { bg: 'bg-info', label: 'In Progress' },
      ready: { bg: 'bg-primary', label: 'Ready' },
      delivered: { bg: 'bg-success', label: 'Delivered' },
      cancelled: { bg: 'bg-danger', label: 'Cancelled' },
    };
    const statusInfo = statusMap[status] || { bg: 'bg-secondary', label: status };
    return statusInfo;
  };

  const getTimelineBadgeClass = (index: number, totalItems: number) => {
    if (index === 0) return 'success';
    if (index === 1) return 'primary';
    return '';
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="page-content bg-light">
          <div className="container py-5 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className="page-content bg-light">
          <div className="container py-5 text-center">
            <h4>{error || 'Order not found'}</h4>
            <Link href="/account/orders" className="btn btn-secondary mt-3">
              Back to Orders
            </Link>
          </div>
        </div>
      </>
    );
  }

  const statusInfo = getStatusBadge(order.status);

  return (
    <>
      <Header />
      <div className="page-content bg-light">
        {/* Banner */}
      <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: 'url(/images/background/bg1.jpg)' }}>
        <div className="container">
          <div className="dz-bnr-inr-entry">
            <h1>Order Details</h1>
            <nav aria-label="breadcrumb" className="breadcrumb-row">
              <ul className="breadcrumb">
                <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                <li className="breadcrumb-item"><Link href="/account/orders">Orders</Link></li>
                <li className="breadcrumb-item">Order Details</li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="content-inner-1">
        <div className="container">
          <div className="row">
            <AccountSidebar />

            <section className="col-xl-9 account-wrapper">
              <div className="account-card order-details">
                {/* Order Header */}
                <div className="order-head">
                  <div className="head-thumb">
                    <img src={order.items[0]?.image || '/images/shop/small/pic1.png'} alt={order.items[0]?.name} />
                  </div>
                  <div className="clearfix m-l20">
                    <div className={`badge ${statusInfo.bg}`}>{statusInfo.label}</div>
                    {!terminalRef.current && (
                      <span className="badge bg-light text-dark ms-2">
                        <span className="spinner-grow spinner-grow-sm text-success me-1" style={{ width: '0.5rem', height: '0.5rem' }}></span>
                        Live{lastSync && ` • ${lastSync}`}
                      </span>
                    )}
                    <h4 className="mb-0">Order #{order.id}</h4>
                  </div>
                </div>

                {/* Live status tracker */}
                {order.status !== 'cancelled' && (() => {
                  const steps = [
                    { key: 'placed', label: 'Placed', icon: 'fa-receipt' },
                    { key: 'confirmed', label: 'Confirmed', icon: 'fa-check' },
                    { key: 'preparing', label: 'Preparing', icon: 'fa-fire-burner' },
                    { key: 'ready', label: 'Ready', icon: 'fa-box' },
                    { key: 'delivered', label: 'Done', icon: 'fa-flag-checkered' },
                  ];
                  const order_ = ['placed', 'confirmed', 'preparing', 'ready', 'delivered'];
                  const current = order.status === 'pending' ? 0 : order_.indexOf(order.status);
                  return (
                    <div className="d-flex justify-content-between align-items-start my-4 px-2">
                      {steps.map((step, idx) => {
                        const done = idx <= current;
                        const active = idx === current;
                        return (
                          <div key={step.key} className="text-center flex-fill position-relative">
                            {idx > 0 && (
                              <div style={{ position: 'absolute', top: 18, right: '50%', width: '100%', height: 3, background: done ? 'var(--primary)' : '#e0e0e0', zIndex: 0 }} />
                            )}
                            <div
                              className="rounded-circle d-inline-flex align-items-center justify-content-center position-relative"
                              style={{
                                width: 38, height: 38, zIndex: 1,
                                background: done ? 'var(--primary)' : '#e9ecef',
                                color: done ? '#fff' : '#9aa0a6',
                                boxShadow: active ? '0 0 0 4px var(--rgba-primary-2)' : 'none',
                              }}
                            >
                              <i className={`fas ${step.icon}`}></i>
                            </div>
                            <div className="small mt-1" style={{ color: done ? 'var(--primary)' : '#9aa0a6', fontWeight: active ? 700 : 400 }}>
                              {step.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Payment / receipt summary (matches the Cart Pilot confirmation) */}
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <i className="far fa-clock me-2 text-muted"></i>
                      <span className="text-muted">Estimated ready:</span>
                      <strong className="ms-2">{order.estimatedReady}</strong>
                    </div>
                    <div className="d-flex align-items-center text-muted">
                      <i className="fas fa-location-dot me-2"></i>
                      Pickup or table service ready
                    </div>
                    <hr />
                    {order.items.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between py-1">
                        <span>
                          <span className="fw-bold me-2">{item.quantity}×</span>
                          {item.name}
                        </span>
                        <span className="text-muted">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.pricing.loyaltyDiscount > 0 && (
                      <div className="d-flex justify-content-between py-1 text-success">
                        <span>Discount applied</span>
                        <span>−${order.pricing.loyaltyDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <strong style={{ fontSize: '1.15rem' }}>Total Paid</strong>
                      <strong className="text-primary" style={{ fontSize: '1.5rem' }}>
                        ${order.pricing.total.toFixed(2)}
                      </strong>
                    </div>
                    <div className="d-flex align-items-center mt-3">
                      <span className="badge bg-light text-dark border me-2" style={{ fontSize: '0.85rem', padding: '6px 10px' }}>
                        {order.payment.method === 'upi' ? (
                          <><i className="fas fa-mobile-alt me-1"></i>UPI Payment</>
                        ) : order.payment.method === 'wallet' ? (
                          <><i className="fas fa-wallet me-1"></i>Wallet</>
                        ) : order.payment.method === 'cod' ? (
                          <><i className="fas fa-money-bill-wave me-1"></i>Cash on Delivery</>
                        ) : (
                          <><i className="fas fa-credit-card me-1"></i>Card •••• 4242</>
                        )}
                      </span>
                      <small className="text-muted">
                        {order.payment.method === 'cod' ? 'Pay on arrival' : 'Tokenized payment'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Loyalty card */}
                {order.loyaltyPointsEarned > 0 && (
                  <div
                    className="mb-3 d-flex align-items-center justify-content-between"
                    style={{ background: '#fff8e6', border: '1px solid #ffe08a', borderRadius: 14, padding: '14px 16px' }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: 12, background: '#f5b301',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginRight: 12,
                        }}
                      >
                        <i className="fas fa-gift"></i>
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: '#664d00' }}>Loyalty Points Earned!</div>
                        <small style={{ color: '#8a6d00' }}>+{order.loyaltyPointsEarned} points added to your wallet</small>
                      </div>
                    </div>
                    <div className="text-end" style={{ color: '#e0a000', fontWeight: 800, lineHeight: 1.1 }}>
                      <div style={{ fontSize: '1.4rem' }}>+{order.loyaltyPointsEarned}</div>
                      <small><i className="fas fa-star"></i> pts</small>
                    </div>
                  </div>
                )}

                {/* Order Details */}
                <div className="row mb-sm-4 mb-2">
                  <div className="col-sm-6">
                    <div className="shiping-tracker-detail">
                      <span>Merchant</span>
                      <h6 className="title">{order.merchantName}</h6>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="shiping-tracker-detail">
                      <span>Items</span>
                      <h6 className="title">{order.items.length} item{order.items.length > 1 ? 's' : ''}</h6>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="shiping-tracker-detail">
                      <span>Order Date</span>
                      <h6 className="title">{formatDate(order.createdAt)}</h6>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="shiping-tracker-detail">
                      <span>Address</span>
                      <h6 className="title">{order.merchantAddress}</h6>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="content-btn m-b15">
                  <Link href="/account/orders" className="btn btn-outline-secondary m-b15 me-xl-3 me-2 btnhover20">
                    Back to Orders
                  </Link>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button className="btn btn-outline-danger m-b15 btnhover20" disabled>
                      Cancel Order
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="clearfix">
                  <div className="dz-tabs style-3">
                    <div className="nav nav-tabs" id="nav-tab" role="tablist">
                      <button
                        className={`nav-link ${activeTab === 'order-history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('order-history')}
                        type="button"
                        role="tab"
                      >
                        Order History
                      </button>
                      <button
                        className={`nav-link ${activeTab === 'items' ? 'active' : ''}`}
                        onClick={() => setActiveTab('items')}
                        type="button"
                        role="tab"
                      >
                        Item Details
                      </button>
                      <button
                        className={`nav-link ${activeTab === 'payment' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payment')}
                        type="button"
                        role="tab"
                      >
                        Payment
                      </button>
                    </div>
                  </div>

                  <div className="tab-content pt-3" id="nav-tabContent">
                    {/* Order History Tab */}
                    {activeTab === 'order-history' && (
                      <div className="tab-pane fade show active" role="tabpanel">
                        <div className="widget-timeline style-1">
                          <ul className="timeline">
                            {(order.timeline || []).map((event, index) => (
                              <li key={index}>
                                <div className={`timeline-badge ${getTimelineBadgeClass(index, order.timeline?.length || 0)}`}></div>
                                <div className="timeline-box">
                                  <div className="timeline-panel" style={{ cursor: 'default' }}>
                                    <h6 className="mb-0">{event.status}</h6>
                                    <span>{formatTime(event.time)}</span>
                                  </div>
                                  {event.description && (
                                    <p><strong>Details: </strong>{event.description}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                            {(!order.timeline || order.timeline.length === 0) && (
                              <li>
                                <div className="timeline-badge success"></div>
                                <div className="timeline-box">
                                  <div className="timeline-panel" style={{ cursor: 'default' }}>
                                    <h6 className="mb-0">Order Placed</h6>
                                    <span>{formatTime(order.createdAt)}</span>
                                  </div>
                                  <p><strong>Status: </strong>{statusInfo.label}</p>
                                </div>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Item Details Tab */}
                    {activeTab === 'items' && (
                      <div className="tab-pane fade show active" role="tabpanel">
                        <h5>Item Details</h5>
                        {order.items.map((item, index) => (
                          <div key={index} className="tracking-item mb-3">
                            <div className="tracking-product">
                              <img src={item.image} alt={item.name} />
                            </div>
                            <div className="tracking-product-content">
                              <h6 className="title">{item.name}</h6>
                              <small className="d-block"><strong>Price</strong>: ${item.price.toFixed(2)}</small>
                              <small className="d-block"><strong>Quantity</strong>: {item.quantity}</small>
                            </div>
                          </div>
                        ))}
                        <hr />
                        <div className="tracking-item-content">
                          <span>Subtotal</span>
                          <h6>${order.pricing.subtotal.toFixed(2)}</h6>
                        </div>
                        <div className="tracking-item-content">
                          <span>Service Fee</span>
                          <h6>${order.pricing.serviceFee.toFixed(2)}</h6>
                        </div>
                        <div className="tracking-item-content">
                          <span>Delivery Fee</span>
                          <h6>${order.pricing.deliveryFee.toFixed(2)}</h6>
                        </div>
                        <div className="tracking-item-content">
                          <span>Tax</span>
                          <h6>${order.pricing.tax.toFixed(2)}</h6>
                        </div>
                        {order.pricing.loyaltyDiscount > 0 && (
                          <div className="tracking-item-content border-bottom border-light mb-2">
                            <span className="text-success">Loyalty Discount</span>
                            <h6 className="text-success">-${order.pricing.loyaltyDiscount.toFixed(2)}</h6>
                          </div>
                        )}
                        <div className="tracking-item-content">
                          <strong>Order Total</strong>
                          <h5>${order.pricing.total.toFixed(2)}</h5>
                        </div>
                      </div>
                    )}

                    {/* Payment Tab */}
                    {activeTab === 'payment' && (
                      <div className="tab-pane fade show active" role="tabpanel">
                        <h5 className="text-success mb-4">Payment Information</h5>
                        <ul className="tracking-receiver">
                          <li>Order Number: <strong>#{order.id}</strong></li>
                          <li>Date: <strong>{formatTime(order.createdAt)}</strong></li>
                          <li>Total: <strong>${order.pricing.total.toFixed(2)}</strong></li>
                          <li>Payment Method: <strong>{order.payment.method.charAt(0).toUpperCase() + order.payment.method.slice(1)}</strong></li>
                          <li>Payment Status: <strong>{order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}</strong></li>
                          <li>Loyalty Points Earned: <strong>{order.loyaltyPointsEarned} points</strong></li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
