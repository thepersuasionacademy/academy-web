'use client';

import React, { useState } from 'react';
import { 
  User,
  ChevronRight,
  Clock,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { AICreditsDetail } from '../components/AICreditsDetail';
import { PaymentDetail } from '../components/PaymentDetail';

interface AIItem {
  id: number;
  name: string;
  category: string;
  suite: string;
  timestamp: string;
  cost: number;
  description: string;
  info: string[];
  aiResponse: string;
}

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
  // For subscriptions
  nextBillingDate?: string;
  billingCycle?: 'monthly' | 'yearly';
  // For payment plans
  installments?: {
    completed: number;
    total: number;
    nextPaymentDate: string;
  };
}

export default function ProfileDashboard() {
  // User state
  const [user, setUser] = useState({
    firstName: 'Firstname',
    lastName: 'Lastname',
    email: 'someone@example.com',
  });

  // Add edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempFirstName, setTempFirstName] = useState(user.firstName);
  const [tempLastName, setTempLastName] = useState(user.lastName);
  const [tempEmail, setTempEmail] = useState(user.email);

  // Handle save functions
  const handleSaveName = () => {
    setUser(prev => ({
      ...prev,
      firstName: tempFirstName,
      lastName: tempLastName
    }));
    setIsEditingName(false);
  };

  const handleSaveEmail = () => {
    setUser(prev => ({
      ...prev,
      email: tempEmail
    }));
    setIsEditingEmail(false);
  };

  // AI Credits test data
  const aiItems: AIItem[] = [
    {
      id: 1,
      name: "Cold Email Campaign",
      category: "Sales",
      suite: "Email Suite",
      timestamp: "2024-03-15T14:30:00Z",
      cost: 100,
      description: "AI-powered email campaign generator optimized for high open rates",
      info: ["Personalized outreach", "High conversion rate", "A/B tested"],
      aiResponse: "Here's your optimized cold email template...",
    },
    {
      id: 2,
      name: "Follow-up Strategy",
      category: "Sales",
      suite: "Outreach Suite",
      timestamp: "2024-03-14T09:15:00Z",
      cost: 150,
      description: "AI-powered strategy to optimize follow-up emails",
      info: ["5-email sequence", "Timing optimization", "Response hooks"],
      aiResponse: "Your follow-up sequence is ready...",
    },
    // ... more AI items
  ];

  // Payments test data
  const paymentItems: PaymentItem[] = [
    {
      id: 1,
      name: "Pro Plan Subscription",
      category: "Subscriptions",
      suite: "Pro Plan",
      timestamp: "2024-03-01T00:00:00Z",
      amount: 49.99,
      status: 'paid',
      receipt: "receipt-123",
      paymentType: 'subscription',
      nextBillingDate: "2024-04-01T00:00:00Z",
      billingCycle: 'monthly'
    },
    {
      id: 2,
      name: "Enterprise AI Package",
      category: "Credits",
      suite: "Enterprise Pack",
      timestamp: "2024-02-15T16:45:00Z",
      amount: 1999.99,
      status: 'paid',
      receipt: "receipt-124",
      paymentType: 'payment-plan',
      installments: {
        completed: 3,
        total: 12,
        nextPaymentDate: "2024-04-15T00:00:00Z"
      }
    },
    {
      id: 3,
      name: "Credit Bundle",
      category: "Credits",
      suite: "Standard Pack",
      timestamp: "2024-02-01T12:30:00Z",
      amount: 199.99,
      status: 'paid',
      receipt: "receipt-125",
      paymentType: 'one-time'
    }
  ];

  const [activeTab, setActiveTab] = useState<'credits' | 'payments'>('credits');
  const [selectedItem, setSelectedItem] = useState<AIItem | PaymentItem | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  // Format timestamp to readable date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Get current items based on active tab
  const currentItems = activeTab === 'credits' ? aiItems : paymentItems;

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Updated Header with user info */}
      <div className="border-b border-[var(--border-color)] p-8">
        <div className="flex items-center justify-center gap-8 max-w-6xl mx-auto">
          <div className="w-24 h-24 rounded-full bg-[var(--hover-bg)] flex items-center justify-center flex-shrink-0">
            <User className="w-12 h-12 text-[var(--text-secondary)]" />
          </div>
          <div className="space-y-3">
            {isEditingName ? (
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempFirstName}
                    onChange={(e) => setTempFirstName(e.target.value)}
                    className="px-4 py-2 text-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    value={tempLastName}
                    onChange={(e) => setTempLastName(e.target.value)}
                    className="px-4 py-2 text-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="Last Name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleSaveName}
                    className="p-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg transition-opacity"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingName(false);
                      setTempFirstName(user.firstName);
                      setTempLastName(user.lastName);
                    }}
                    className="p-2 border border-[var(--border-color)] hover:border-[var(--accent)] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-medium text-[var(--foreground)]">
                  {user.firstName} {user.lastName}
                </h2>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="p-2 hover:bg-[var(--accent)] hover:text-white transition-all rounded-lg"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            )}

            {isEditingEmail ? (
              <div className="flex items-center gap-4">
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="px-4 py-2 text-xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg w-full focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Email"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveEmail}
                    className="p-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg transition-opacity"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingEmail(false);
                      setTempEmail(user.email);
                    }}
                    className="p-2 border border-[var(--border-color)] hover:border-[var(--accent)] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xl text-[var(--text-secondary)]">{user.email}</p>
                <button 
                  onClick={() => setIsEditingEmail(true)}
                  className="p-2 hover:bg-[var(--accent)] hover:text-white transition-all rounded-lg"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto mt-8 px-6">
        {/* Centered tab buttons */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
            <button 
              onClick={() => setActiveTab('credits')}
              className={cn(
                "px-6 py-3 rounded-md text-lg font-medium transition-all",
                activeTab === 'credits' 
                  ? "bg-[var(--accent)] text-white" 
                  : "hover:bg-[var(--hover-bg)]"
              )}>
              AI Credits
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={cn(
                "px-6 py-3 rounded-md text-lg font-medium transition-all",
                activeTab === 'payments' 
                  ? "bg-[var(--accent)] text-white" 
                  : "hover:bg-[var(--hover-bg)]"
              )}>
              Payments
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Recent History */}
          <div className="col-span-5">
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-[var(--text-secondary)] mb-6">Recent History</h3>
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "p-4 rounded-lg",
                    "border border-[var(--border-color)]",
                    "cursor-pointer",
                    "transition-all",
                    selectedItem?.id === item.id 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'hover:border-[var(--accent)]'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span>{item.category}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{item.suite}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg text-[var(--foreground)]">{item.name}</span>
                      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(item.timestamp).date}</span>
                      <span>•</span>
                      <span>{formatTimestamp(item.timestamp).time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="col-span-7">
            {selectedItem ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
                  {/* Conditional rendering based on item type */}
                  {'aiResponse' in selectedItem ? (
                    <AICreditsDetail 
                      item={selectedItem}
                      formatTimestamp={formatTimestamp}
                      onCopy={handleCopyResponse}
                      showCopied={showCopied}
                    />
                  ) : (
                    <PaymentDetail 
                      item={selectedItem}
                      formatTimestamp={formatTimestamp}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)] text-lg">
                <p>Select an item to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}