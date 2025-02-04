import { Clock, FileText, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PaymentItem {
  id: number;
  name: string;
  category: string;
  suite: string;
  timestamp: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  receipt: string;
  paymentType: 'one-time' | 'subscription' | 'payment-plan';
  nextBillingDate?: string;
  billingCycle?: 'monthly' | 'yearly';
  installments?: {
    completed: number;
    total: number;
    nextPaymentDate: string;
  };
}

interface PaymentDetailProps {
  item: PaymentItem;
  formatTimestamp: (timestamp: string) => { date: string; time: string };
}

export function PaymentDetail({ item, formatTimestamp }: PaymentDetailProps) {
  return (
    <div className="space-y-6">
      {/* Title and Timestamp */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>{item.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{item.suite}</span>
        </div>
        <h3 className="text-2xl font-medium text-[var(--foreground)]">
          {item.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(item.timestamp).date}</span>
          <span>•</span>
          <span>{formatTimestamp(item.timestamp).time}</span>
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-lg text-[var(--text-secondary)]">Amount</p>
        <p className="text-2xl font-medium text-[var(--foreground)]">
          ${item.amount.toFixed(2)}
        </p>
      </div>

      {/* Payment Type */}
      <div>
        <p className="text-lg text-[var(--text-secondary)]">Payment Type</p>
        <p className="text-xl font-medium text-[var(--foreground)]">
          {item.paymentType === 'one-time' && "One-Time Payment"}
          {item.paymentType === 'subscription' && "Subscription"}
          {item.paymentType === 'payment-plan' && "Payment Plan"}
        </p>
      </div>

      {/* Subscription Details */}
      {item.paymentType === 'subscription' && item.nextBillingDate && (
        <div>
          <p className="text-lg text-[var(--text-secondary)]">Next Billing</p>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
            <p className="text-xl text-[var(--foreground)]">
              {formatTimestamp(item.nextBillingDate).date}
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {item.billingCycle && 
              `${item.billingCycle.charAt(0).toUpperCase() + item.billingCycle.slice(1)} billing cycle`
            }
          </p>
        </div>
      )}

      {/* Payment Plan Details */}
      {item.paymentType === 'payment-plan' && (
        <div className="space-y-4">
          <div>
            <p className="text-lg text-[var(--text-secondary)]">Installments</p>
            <p className="text-xl text-[var(--foreground)]">
              {item.installments?.completed} of {item.installments?.total} paid
              <span className="text-[var(--text-secondary)] text-lg ml-2">
                ({item.installments!.total - item.installments!.completed} payments remaining)
              </span>
            </p>
          </div>
          <div>
            <p className="text-lg text-[var(--text-secondary)]">Next Payment</p>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
              <p className="text-xl text-[var(--foreground)]">
                {formatTimestamp(item.installments!.nextPaymentDate).date}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status */}
      <div>
        <p className="text-lg text-[var(--text-secondary)]">Status</p>
        <p className={cn(
          "text-lg font-medium",
          item.status === 'paid' && "text-green-500",
          item.status === 'pending' && "text-yellow-500",
          item.status === 'failed' && "text-red-500"
        )}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </p>
      </div>

      {/* Receipt Download */}
      <button className="w-full mt-6 p-4 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors flex items-center justify-center gap-3 text-lg">
        <FileText className="w-5 h-5" />
        <span>Download Receipt</span>
      </button>
    </div>
  );
} 