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
    toolName: string;
    collectionName: string | null;
    suiteName: string | null;
    timestamp: string;
    creditsCost: number;
    creditsBefore: number;
    creditsAfter: number;
    aiResponse: string;
}

export interface PaymentItem {
    id: string;
    timestamp: string;
    amount: number;
    status: string;
    paymentType: string;
    name: string;
    billingCycle?: string;
    isAutoRenew?: boolean;
    nextBillingDate?: string;
    endDate?: string;
    receipt?: string;
}