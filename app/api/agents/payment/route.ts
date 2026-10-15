import { NextRequest, NextResponse } from 'next/server';
import { productsDB, merchantsDB } from '../data';

interface CartItem {
  productId: string;
  quantity: number;
  // Optional pre-calculated fields for DummyJSON products
  name?: string;
  price?: number;
}

interface PaymentRequest {
  merchantId: string;
  items: CartItem[];
  paymentMethod: 'card' | 'upi' | 'wallet' | 'cod';
  upiId?: string; // e.g., "user@paytm", "9876543210@upi"
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

// POST /api/agents/payment
// Payment Processing Agent - Handles order creation and payment tokenization
export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const { merchantId, items, paymentMethod, customerInfo } = body;

    // Validation
    if (!merchantId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order data' },
        { status: 400 }
      );
    }

    // Verify merchant exists
    const merchant = merchantsDB.find(m => m.id === merchantId);
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Calculate order details
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Try to find in local products first
      const product = productsDB.find(p => p.id === item.productId);

      // Use product data or fall back to pre-calculated values (for DummyJSON products)
      const productName = product?.name || item.name || 'Unknown Product';
      const productPrice = product?.price || item.price || 0;
      const isInStock = product ? (product.inStock && product.quantity >= item.quantity) : true;

      if (!isInStock) {
        return NextResponse.json(
          { success: false, error: `${productName} is out of stock or insufficient quantity` },
          { status: 400 }
        );
      }

      const itemTotal = productPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        name: productName,
        price: productPrice,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // Simulate agent processing time (payment processing)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Order-ahead pickup / table service: no service or delivery fee.
    const serviceFee = 0;
    const deliveryFee = 0;
    const tax = parseFloat((subtotal * 0.0875).toFixed(2)); // 8.75% tax
    const discount = parseFloat((subtotal * 0.1).toFixed(2)); // Aisle member discount (10%)
    const total = parseFloat((subtotal - discount + tax).toFixed(2));

    // Generate order ID and tokenized payment token
    const orderId = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const paymentToken = `tok_${Math.random().toString(36).substring(2, 12)}`;
    const loyaltyPointsEarned = Math.max(1, Math.round(total * 5)); // ~5 pts per $1

    // Build payment details based on method
    const getPaymentDetails = () => {
      switch (paymentMethod) {
        case 'upi':
          const upiId = body.upiId || 'user@paytm';
          return {
            token: paymentToken,
            method: 'upi',
            status: 'authorized',
            message: 'UPI payment authorized successfully',
            upiId: upiId,
            upiApp: upiId.includes('@paytm') ? 'Paytm' :
                   upiId.includes('@gpay') ? 'Google Pay' :
                   upiId.includes('@phonepe') ? 'PhonePe' : 'UPI',
            transactionId: `UPI${Math.random().toString(36).substring(2, 14).toUpperCase()}`,
            tokenized: true,
          };
        case 'wallet':
          return {
            token: paymentToken,
            method: 'wallet',
            status: 'authorized',
            message: 'Wallet payment authorized successfully',
            walletType: 'Aisle Wallet',
            balance: 5000, // Mock balance
            tokenized: true,
          };
        case 'cod':
          return {
            token: paymentToken,
            method: 'cod',
            status: 'pending',
            message: 'Cash on Delivery - Pay when order arrives',
            tokenized: false,
          };
        default: // card
          return {
            token: paymentToken,
            method: 'card',
            status: 'authorized',
            message: 'Payment authorized successfully',
            cardBrand: 'Visa',
            last4: '4242',
            tokenized: true,
          };
      }
    };

    // Agent response
    const response = {
      success: true,
      agent: 'PaymentProcessingAgent',
      timestamp: new Date().toISOString(),
      order: {
        orderId: orderId,
        merchantId: merchantId,
        merchantName: merchant.name,
        merchantAddress: merchant.address,
        items: orderItems,
        pricing: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          serviceFee,
          deliveryFee,
          tax,
          loyaltyDiscount: discount,
          total,
        },
        status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
        estimatedReady: merchant.prepTime,
      },
      payment: getPaymentDetails(),
      loyalty: {
        pointsEarned: loyaltyPointsEarned,
        message: `You earned ${loyaltyPointsEarned} loyalty points!`,
      },
      customerInfo: customerInfo || {},
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Payment Processing Agent Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
