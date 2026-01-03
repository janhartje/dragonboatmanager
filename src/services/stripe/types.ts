import Stripe from 'stripe';

/**
 * Response from createOrResumeSubscription
 */
export interface SubscriptionResponse {
  /** The Stripe Subscription ID */
  subscriptionId: string;
  /** 
   * The client secret for Stripe Elements. 
   * Null if payment is not needed (e.g., already active or 0-amount).
   */
  clientSecret: string | null;
  /** Current subscription status */
  status: Stripe.Subscription.Status;
  /** Price details for display */
  price: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
}

/**
 * Details about an existing subscription
 */
export interface SubscriptionDetails {
  hasSubscription: boolean;
  plan: 'FREE' | 'PRO';
  isBillingUser: boolean;
  isCustomer: boolean;
  subscription?: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number;
    currentPeriodStart: number;
    interval?: string;
    amount?: number;
    baseAmount?: number;
    currency?: string;
    priceId?: string;
    paymentMethod?: {
      brand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
    } | null;
  };
  history?: SubscriptionHistoryItem[];
}

export interface SubscriptionHistoryItem {
  id: string;
  status: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  interval?: string;
  amount?: number;
  currency?: string;
}
