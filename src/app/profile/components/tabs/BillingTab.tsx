import React, { useState } from 'react';
import { Toast } from '../common/Toast';

interface BillingTabProps {
  userId?: string;
}

export function BillingTab({ userId }: BillingTabProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/payments/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      // Redirect to the billing portal URL in the same tab
      window.location.href = data.url;
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to access billing portal',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-medium">Manage Your Subscription</h3>
          <p className="text-[var(--text-secondary)]">
            Access your billing portal to manage your subscription, view payment history, and update payment methods.
          </p>
          <button
            onClick={handleBillingPortal}
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Access Billing Portal
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          position="bottom-right"
        />
      )}
    </div>
  );
} 