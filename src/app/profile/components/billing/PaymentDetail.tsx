import React from 'react';
import { ChevronRight } from 'lucide-react';

export function PaymentDetail() {
  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/payments/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to access billing portal');
      }

      // Redirect to Stripe Billing Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Error accessing billing portal:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between cursor-pointer" onClick={handleBillingPortal}>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Billing</h3>
          <p className="text-sm text-gray-500">Manage your subscription and payment methods</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
} 