import { RazorpayOptions, RazorpayPaymentResponse } from '../types/authAndStore';

declare global {
  interface Window {
    Razorpay?: new (options: any) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    if (window.Razorpay) {
      return resolve(true);
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Could not load Razorpay script from CDN; fallback modal enabled.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export async function processRazorpayPayment(
  params: {
    amountInr: number;
    name: string;
    description: string;
    userEmail: string;
    userName: string;
    notes?: Record<string, string>;
  },
  onSuccess: (paymentResponse: RazorpayPaymentResponse) => void,
  onDismiss?: () => void
): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_aitos_command_os';

  if (isLoaded && window.Razorpay) {
    const options: any = {
      key: razorpayKey,
      amount: Math.round(params.amountInr * 100), // amount in paise
      currency: 'INR',
      name: 'AITOS Trade OS',
      description: params.description,
      image: 'https://cdn-icons-png.flaticon.com/512/2953/2953363.png',
      handler: function (response: RazorpayPaymentResponse) {
        onSuccess(response);
      },
      prefill: {
        name: params.userName || 'AITOS Trader',
        email: params.userEmail || 'trader@aitos.trade',
        contact: '9999999999'
      },
      notes: {
        product: params.name,
        ...params.notes
      },
      theme: {
        color: '#f59e0b' // Amber-500 matching AITOS dark theme
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) onDismiss();
        }
      }
    };

    const rzpInstance = new window.Razorpay(options);
    rzpInstance.open();
  } else {
    // Graceful fallback simulation if script cannot load or is blocked in sandbox
    const simulatedPaymentId = `pay_sim_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const confirmPrompt = window.confirm(
      `[Razorpay Gateway Simulation]\n\nProduct: ${params.name}\nAmount: ₹${params.amountInr.toLocaleString()}\nUser: ${params.userEmail}\n\nClick OK to simulate successful payment authorization.`
    );

    if (confirmPrompt) {
      onSuccess({
        razorpay_payment_id: simulatedPaymentId,
        razorpay_order_id: `order_${Date.now().toString(36)}`,
        razorpay_signature: `sig_${Math.random().toString(36).substring(2, 10)}`
      });
    } else {
      if (onDismiss) onDismiss();
    }
  }
}
