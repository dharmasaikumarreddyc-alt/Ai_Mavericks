// Shared in-memory order store (single source of truth for all order routes).
// In production this would be a database. Module state persists across requests
// within a running server process, so orders placed in Cart Pilot show up live
// in the merchant console.

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface TimelineEntry {
  status: string;
  time: string;
  description: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    serviceFee: number;
    deliveryFee: number;
    tax: number;
    loyaltyDiscount: number;
    total: number;
  };
  payment: { token: string; method: string; status: string };
  status: OrderStatus;
  loyaltyPointsEarned: number;
  createdAt: string;
  estimatedReady: string;
  timeline?: TimelineEntry[];
  deliveryAddress?: unknown;
}

// Sample orders that look like they were placed through Cart Pilot
// In production, this would start empty and orders would only come from Cart Pilot
export const ordersDB: Order[] = [
  {
    id: 'ORD-K7X2M9',
    merchantId: 'cafe-verde',
    merchantName: 'Cafe Verde',
    merchantAddress: 'Jubilee Hills, Hyderabad',
    items: [
      { productId: 'cv-2', name: 'Oat Milk Latte', price: 180, quantity: 1, image: '/images/products/latte.jpg' },
      { productId: 'cv-5', name: 'Almond Croissant', price: 150, quantity: 1, image: '/images/products/croissant.jpg' },
    ],
    pricing: { subtotal: 330, serviceFee: 0, deliveryFee: 0, tax: 28.88, loyaltyDiscount: 33, total: 325.88 },
    payment: { token: 'tok_k7x2m9abc1', method: 'card', status: 'authorized' },
    status: 'confirmed',
    loyaltyPointsEarned: 163,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    estimatedReady: '7-10 min',
    timeline: [
      { status: 'Order Placed', time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), description: 'Your order has been received' },
    ],
  },
  {
    id: 'ORD-P3N8Q5',
    merchantId: 'sweet-treats-bakery',
    merchantName: 'Sweet Treats Bakery',
    merchantAddress: 'Kondapur, Hyderabad',
    items: [
      { productId: 'st-1', name: 'Chocolate Cake', price: 650, quantity: 1, image: '/images/products/chocolate-cake.jpg' },
      { productId: 'st-5', name: 'Chocolate Croissant', price: 120, quantity: 2, image: '/images/products/croissant.jpg' },
    ],
    pricing: { subtotal: 890, serviceFee: 0, deliveryFee: 0, tax: 77.88, loyaltyDiscount: 89, total: 878.88 },
    payment: { token: 'tok_p3n8q5def2', method: 'card', status: 'authorized' },
    status: 'preparing',
    loyaltyPointsEarned: 439,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
    estimatedReady: '5-8 min',
    timeline: [
      { status: 'Order Placed', time: new Date(Date.now() - 12 * 60 * 1000).toISOString(), description: 'Your order has been received' },
      { status: 'Preparing', time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), description: 'Your order is being prepared' },
    ],
  },
  {
    id: 'ORD-R9T4W1',
    merchantId: 'spice-kitchen',
    merchantName: 'Spice Kitchen',
    merchantAddress: 'Gachibowli, Hyderabad',
    items: [
      { productId: 'sk-3', name: 'Hyderabadi Biryani', price: 380, quantity: 2, image: '/images/products/biryani.jpg' },
      { productId: 'sk-5', name: 'Butter Naan', price: 45, quantity: 4, image: '/images/products/naan.jpg' },
    ],
    pricing: { subtotal: 940, serviceFee: 0, deliveryFee: 0, tax: 82.25, loyaltyDiscount: 94, total: 928.25 },
    payment: { token: 'tok_r9t4w1ghi3', method: 'card', status: 'authorized' },
    status: 'ready',
    loyaltyPointsEarned: 464,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    estimatedReady: '15-25 min',
    timeline: [
      { status: 'Order Placed', time: new Date(Date.now() - 25 * 60 * 1000).toISOString(), description: 'Your order has been received' },
      { status: 'Confirmed', time: new Date(Date.now() - 24 * 60 * 1000).toISOString(), description: 'Merchant confirmed your order' },
      { status: 'Preparing', time: new Date(Date.now() - 20 * 60 * 1000).toISOString(), description: 'Your order is being prepared' },
      { status: 'Ready', time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), description: 'Order is ready' },
    ],
  },
];

export function getOrders(): Order[] {
  return [...ordersDB].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrder(id: string): Order | undefined {
  return ordersDB.find((o) => o.id === id);
}

export function addOrder(order: Order): Order {
  ordersDB.unshift(order);
  return order;
}

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Order received, awaiting merchant',
  confirmed: 'Merchant confirmed your order',
  preparing: 'Your order is being prepared',
  ready: 'Order is ready',
  delivered: 'Order completed',
  cancelled: 'Order cancelled',
};

export function updateOrderStatus(id: string, status: OrderStatus): Order | undefined {
  const order = ordersDB.find((o) => o.id === id);
  if (!order) return undefined;
  order.status = status;
  order.timeline = order.timeline ?? [];
  order.timeline.push({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    time: new Date().toISOString(),
    description: STATUS_DESCRIPTIONS[status],
  });
  return order;
}
