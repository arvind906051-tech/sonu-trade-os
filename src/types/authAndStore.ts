export type SubscriptionTier = 'FREE' | 'PRO_TRADER' | 'INSTITUTIONAL';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string;
  purchasedProductIds: string[];
  createdAt: string;
}

export type DigitalProductCategory = 'JOURNAL' | 'TOOLKIT' | 'PROMPT_PACK' | 'PLAYBOOK';

export interface DigitalProduct {
  id: string;
  title: string;
  category: DigitalProductCategory;
  priceInr: number;
  originalPriceInr: number;
  badge?: string;
  description: string;
  features: string[];
  fileFormat: string; // e.g. "PDF + Notion Template", "Python Scripts + Jupyter (.ZIP)", "Markdown + TXT"
  rating: number;
  reviewsCount: number;
  downloadUrl?: string;
  demoContent?: string;
}

export interface SubscriptionPlan {
  id: 'PRO_TRADER' | 'INSTITUTIONAL';
  name: string;
  priceInr: number;
  billingPeriod: 'monthly';
  tagline: string;
  popular?: boolean;
  features: string[];
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface PurchaseHistoryItem {
  id: string;
  itemName: string;
  itemType: 'SUBSCRIPTION' | 'DIGITAL_PRODUCT';
  amountInr: number;
  paymentId: string;
  date: string;
  status: 'SUCCESS' | 'REFUNDED';
}
