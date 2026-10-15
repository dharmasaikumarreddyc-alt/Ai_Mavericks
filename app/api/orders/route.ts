import { NextRequest, NextResponse } from 'next/server';
import { addOrder, getOrders, type Order } from './store';

// GET /api/orders - Get all orders (newest first)
export async function GET() {
  return NextResponse.json({ success: true, orders: getOrders() });
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const order: Order = await request.json();
    addOrder(order);
    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
