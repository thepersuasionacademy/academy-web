// app/admin/users/components/types.ts
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    credits: number;
}

export interface AIItem {
    id: string;
    tool_name: string;
    collection_name: string | null;
    suite_name: string | null;
    timestamp: string;
    credits_cost: number;
    credits_before: number;
    credits_after: number;
    ai_response: string;
}

export interface PaymentItem {
    id: string;
    name: string;
    category: string;
    suite: string;
    timestamp: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    receipt: string;
    paymentType: 'subscription' | 'one-time';
    nextBillingDate?: string;
    billingCycle?: 'monthly' | 'yearly';
}