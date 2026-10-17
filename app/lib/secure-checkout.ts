import { backendUrl } from './backend';

export type CheckoutPaymentMethod = 'card' | 'cod';

export interface CheckoutPayload {
  merchantId: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: CheckoutPaymentMethod;
  deliveryAddress: string;
  cookingInstructions?: string;
}

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface PaymentIntentResponse {
  intentId: string;
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  merchantName: string;
  description: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', callback: (response: { error?: { description?: string } }) => void): void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Checkout could not be completed.');
  }
  return data;
}

async function postCheckout(path: string, token: string, body: object) {
  const response = await fetch(`${backendUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}

async function loadRazorpay(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return window.Razorpay;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-aisle-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Secure checkout could not load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.aisleRazorpay = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Secure checkout could not load.'));
    document.head.appendChild(script);
  });
  if (!window.Razorpay) throw new Error('Secure checkout is unavailable.');
  return window.Razorpay;
}

async function authorizeWithRazorpay(intent: PaymentIntentResponse): Promise<RazorpaySuccess> {
  const Razorpay = await loadRazorpay();
  return new Promise<RazorpaySuccess>((resolve, reject) => {
    let settled = false;
    const rejectOnce = (message: string) => {
      if (!settled) {
        settled = true;
        reject(new Error(message));
      }
    };
    const checkout = new Razorpay({
      key: intent.keyId,
      order_id: intent.providerOrderId,
      amount: intent.amount,
      currency: intent.currency,
      name: intent.merchantName,
      description: intent.description,
      handler: (result: RazorpaySuccess) => {
        if (!settled) {
          settled = true;
          resolve(result);
        }
      },
      modal: {
        ondismiss: () => rejectOnce('Payment was cancelled. No order was created.'),
      },
      theme: { color: '#f4511e' },
    });
    checkout.on('payment.failed', (result) => {
      rejectOnce(result.error?.description || 'Payment authorization failed.');
    });
    checkout.open();
  });
}

export async function completeCheckout(
  token: string,
  payload: CheckoutPayload,
) {
  if (payload.paymentMethod === 'cod') {
    return postCheckout('/payments/checkout', token, payload);
  }

  const configResponse = await fetch(`${backendUrl}/payments/config`, { cache: 'no-store' });
  const config = await parseResponse(configResponse);
  if (config.mode === 'demo') {
    return postCheckout('/payments/checkout', token, payload);
  }

  const intent = await postCheckout('/payments/intents', token, payload) as PaymentIntentResponse;
  const authorization = await authorizeWithRazorpay(intent);
  return postCheckout('/payments/verify', token, {
    intentId: intent.intentId,
    razorpayOrderId: authorization.razorpay_order_id,
    razorpayPaymentId: authorization.razorpay_payment_id,
    razorpaySignature: authorization.razorpay_signature,
  });
}
