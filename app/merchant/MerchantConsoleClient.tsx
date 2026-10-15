'use client';

import { useCallback, useEffect, useState } from 'react';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  items: OrderItem[];
  pricing: { subtotal: number; total: number };
  status: OrderStatus;
  loyaltyPointsEarned: number;
  createdAt: string;
  estimatedReady: string;
}

// What the merchant can do next, per status.
const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus; icon: string }>> = {
  pending: { label: 'Accept', next: 'confirmed', icon: 'fa-check' },
  confirmed: { label: 'Start Preparing', next: 'preparing', icon: 'fa-fire-burner' },
  preparing: { label: 'Mark Ready', next: 'ready', icon: 'fa-box' },
  ready: { label: 'Complete', next: 'delivered', icon: 'fa-flag-checkered' },
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-warning text-dark',
  confirmed: 'bg-info text-dark',
  preparing: 'bg-primary',
  ready: 'bg-success',
  delivered: 'bg-secondary',
  cancelled: 'bg-danger',
};

const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];

export default function MerchantConsoleClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastSync, setLastSync] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch {
      /* ignore transient errors during polling */
    }
  }, []);

  // Live polling — new Cart Pilot orders appear here within a few seconds.
  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const advance = async (order: Order) => {
    const action = NEXT_ACTION[order.status];
    if (!action) return;
    setUpdating(order.id);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.next }),
      });
      await load();
    } finally {
      setUpdating(null);
    }
  };

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const done = orders.filter((o) => !ACTIVE.includes(o.status));

  const renderCard = (order: Order) => {
    const action = NEXT_ACTION[order.status];
    return (
      <div key={order.id} className="card mb-3">
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
          <div>
            <h6 className="mb-0">{order.merchantName}</h6>
            <small className="text-muted">#{order.id}</small>
          </div>
          <span className={`badge ${STATUS_BADGE[order.status]}`}>{order.status.toUpperCase()}</span>
        </div>
        <div className="card-body py-2">
          {order.items.map((item) => (
            <div key={item.productId} className="d-flex justify-content-between py-1 border-bottom">
              <span>
                <span className="fw-bold me-2">{item.quantity}×</span>
                {item.name}
              </span>
              <span className="text-muted">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between mt-2">
            <span className="text-muted small">
              <i className="far fa-clock me-1"></i>
              {new Date(order.createdAt).toLocaleTimeString()} • ready in {order.estimatedReady}
            </span>
            <span className="fw-bold text-primary">${order.pricing.total.toFixed(2)}</span>
          </div>
        </div>
        {action && (
          <div className="card-footer bg-white py-2">
            <button
              className="btn btn-primary btn-sm w-100"
              onClick={() => advance(order)}
              disabled={updating === order.id}
            >
              {updating === order.id ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <i className={`fas ${action.icon} me-2`}></i>
              )}
              {action.label}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
        <div className="container">
          <div className="dz-bnr-inr-entry">
            <h1>Merchant Console</h1>
            <nav aria-label="breadcrumb" className="breadcrumb-row">
              <ul className="breadcrumb">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Live Orders</li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="content-inner-1">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0">
                <i className="fas fa-store text-primary me-2"></i>
                Incoming Orders
              </h4>
              <small className="text-muted">
                Live — auto-refreshing every 4s{lastSync && ` • last synced ${lastSync}`}
              </small>
            </div>
            <span className="badge bg-primary fs-6">{active.length} active</span>
          </div>

          <div className="row">
            <div className="col-lg-7">
              <h6 className="text-uppercase text-muted mb-3">Active</h6>
              {active.length === 0 ? (
                <div className="alert alert-light border text-center py-4">
                  <i className="fas fa-inbox fa-2x text-muted mb-2 d-block"></i>
                  No active orders. Place one in <a href="/cart-pilot">Cart Pilot</a> and watch it appear here.
                </div>
              ) : (
                active.map(renderCard)
              )}
            </div>
            <div className="col-lg-5">
              <h6 className="text-uppercase text-muted mb-3">Completed</h6>
              {done.length === 0 ? (
                <p className="text-muted small">No completed orders yet.</p>
              ) : (
                done.map(renderCard)
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
