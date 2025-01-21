'use client';

import React, { useState } from 'react';
import { 
  Pencil, 
  X, 
  Check,
  Wallet,
  Receipt,
  User,
  ChevronRight,
  FileText,
  Copy,
  CheckCircle,
  XCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface CreditRun {
  id: number;
  date: string;
  type: string;
  credits: number;
  status: 'success' | 'error';
  response: string;
}

interface Payment {
  id: number;
  planName: string;
  amount: number;
  paymentDate: string;
  nextBillingDate: string;
  status: string;
}

export default function ProfileDashboard() {
  // User state
  const [user, setUser] = useState({
    firstName: 'Jessica',
    lastName: 'Jones',
    email: 'someone@example.com',
    credits: 1000,
    status: 'ACTIVE',
    subscriptionPlan: 'Pro Plan',
    billingCycle: 'Monthly',
    nextBillingDate: '2025-02-21'
  });

  // Sample data
  const creditRuns: CreditRun[] = [
    {
      id: 1,
      date: '2025-01-21',
      type: 'Generated Response',
      credits: -100,
      status: 'success',
      response: 'This is an example of a successful response that was generated using AI credits.',
    },
    {
      id: 2,
      date: '2025-01-20',
      type: 'Generated Response',
      credits: -50,
      status: 'error',
      response: 'This request encountered an error during processing.',
    },
    {
      id: 3,
      date: '2025-01-20',
      type: 'Monthly Refill',
      credits: 1000,
      status: 'success',
      response: 'Monthly credit refill completed successfully.',
    }
  ];

  const payments: Payment[] = [
    {
      id: 1,
      planName: 'Pro Plan',
      amount: 49.99,
      paymentDate: '2025-01-01',
      nextBillingDate: '2025-02-01',
      status: 'Paid'
    },
    {
      id: 2,
      planName: 'Credit Bundle',
      amount: 99.99,
      paymentDate: '2024-12-15',
      nextBillingDate: 'N/A',
      status: 'Paid'
    },
    {
      id: 3,
      planName: 'Pro Plan',
      amount: 49.99,
      paymentDate: '2024-12-01',
      nextBillingDate: '2025-01-01',
      status: 'Paid'
    }
  ];

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [tempFirstName, setTempFirstName] = useState(user.firstName);
  const [tempLastName, setTempLastName] = useState(user.lastName);
  const [tempEmail, setTempEmail] = useState(user.email);
  const [selectedSection, setSelectedSection] = useState<'credits' | 'payments' | null>(null);
  const [selectedItem, setSelectedItem] = useState<CreditRun | Payment | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  // Event handlers
  const handleSaveName = () => {
    setUser(prev => ({ ...prev, firstName: tempFirstName, lastName: tempLastName }));
    setEditingName(false);
  };

  const handleSaveEmail = () => {
    setUser(prev => ({ ...prev, email: tempEmail }));
    setEditingEmail(false);
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleBuyCredits = () => {
    console.log('Buy credits clicked');
  };

  const handleDownloadReceipt = (payment: Payment) => {
    console.log('Download receipt for payment:', payment);
  };
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Profile & Categories */}
        <div className="col-span-3 min-h-screen p-6 border-r border-[var(--border-color)]">
          {/* Profile Section */}
          <div className="rounded-2xl p-6 border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg mb-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-[var(--hover-bg)] flex items-center justify-center">
                <User className="w-10 h-10 text-[var(--text-secondary)]" />
              </div>
              
              <div className="text-center w-full">
                {!editingName ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <h1 className="text-xl font-bold text-[var(--foreground)]">
                        {user.firstName} {user.lastName}
                      </h1>
                      <button 
                        onClick={() => setEditingName(true)}
                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-md hover:bg-[var(--accent)]/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                      <button 
                        onClick={() => setEditingEmail(true)}
                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-md hover:bg-[var(--accent)]/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tempFirstName}
                      onChange={(e) => setTempFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg"
                      placeholder="First Name"
                    />
                    <input
                      type="text"
                      value={tempLastName}
                      onChange={(e) => setTempLastName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg"
                      placeholder="Last Name"
                    />
                    <div className="flex justify-center gap-2">
                      <button onClick={handleSaveName} className="p-1 text-green-500 hover:bg-green-500/10 rounded-md">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingName(false)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {editingEmail && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg"
                      placeholder="Email"
                    />
                    <div className="flex justify-center gap-2">
                      <button onClick={handleSaveEmail} className="p-1 text-green-500 hover:bg-green-500/10 rounded-md">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingEmail(false)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Cards */}
          <div className="space-y-4">
            <div 
              onClick={() => {
                setSelectedSection('credits');
                setSelectedItem(null);
              }}
              className={cn(
                "rounded-xl p-4",
                "border border-[var(--border-color)]",
                "bg-[var(--card-bg)]",
                "cursor-pointer",
                "transition-all",
                selectedSection === 'credits' ? 'border-[var(--accent)] shadow-lg' : 'hover:border-[var(--accent)]'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="bg-[var(--accent)]/10 p-2 rounded-full">
                  <Wallet className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--foreground)]">AI Credits</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{user.credits} available</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setSelectedSection('payments');
                setSelectedItem(null);
              }}
              className={cn(
                "rounded-xl p-4",
                "border border-[var(--border-color)]",
                "bg-[var(--card-bg)]",
                "cursor-pointer",
                "transition-all",
                selectedSection === 'payments' ? 'border-[var(--accent)] shadow-lg' : 'hover:border-[var(--accent)]'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="bg-[var(--accent)]/10 p-2 rounded-full">
                  <Receipt className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--foreground)]">{user.subscriptionPlan}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{user.billingCycle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Middle Column - Overview */}
        <div className="col-span-5 p-6 border-r border-[var(--border-color)]">
          {selectedSection === 'credits' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[var(--foreground)]">Credit History</h2>
                <button 
                  onClick={handleBuyCredits}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90"
                >
                  Buy Credits
                </button>
              </div>

              <div className="space-y-3">
                {creditRuns.map((run) => (
                  <div 
                    key={run.id}
                    onClick={() => setSelectedItem(run)}
                    className={cn(
                      "p-4 rounded-xl",
                      "border border-[var(--border-color)]",
                      "bg-[var(--card-bg)]",
                      "cursor-pointer",
                      "transition-all",
                      selectedItem === run ? 'border-[var(--accent)] shadow-lg' : 'hover:border-[var(--accent)]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {run.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-[var(--foreground)]">{run.type}</span>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold",
                        run.credits < 0 ? 'text-red-500' : 'text-green-500'
                      )}>
                        {run.credits > 0 ? '+' : ''}{run.credits}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{run.date}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedSection === 'payments' ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Payment History</h2>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div 
                    key={payment.id}
                    onClick={() => setSelectedItem(payment)}
                    className={cn(
                      "p-4 rounded-xl",
                      "border border-[var(--border-color)]",
                      "bg-[var(--card-bg)]",
                      "cursor-pointer",
                      "transition-all",
                      selectedItem === payment ? 'border-[var(--accent)] shadow-lg' : 'hover:border-[var(--accent)]'
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{payment.planName}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{payment.paymentDate}</p>
                      </div>
                      <p className="text-lg font-semibold text-[var(--foreground)]">${payment.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
              <p>Select a category to view details</p>
            </div>
          )}
        </div>
        {/* Right Column - Detailed View */}
        <div className="col-span-4 p-6">
          {selectedItem ? (
            'credits' in selectedItem ? (
              // Credit Run Detail View
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--foreground)]">Credit Usage Details</h2>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedItem.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium text-[var(--foreground)]">{selectedItem.type}</span>
                    </div>
                    <span className={cn(
                      "text-lg font-semibold",
                      selectedItem.credits < 0 ? 'text-red-500' : 'text-green-500'
                    )}>
                      {selectedItem.credits > 0 ? '+' : ''}{selectedItem.credits}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Date</p>
                      <p className="font-medium text-[var(--foreground)]">{selectedItem.date}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Response</p>
                      <div className="mt-2 p-4 rounded-lg bg-[var(--hover-bg)] relative group">
                        <p className="text-[var(--foreground)]">{selectedItem.response}</p>
                        <button 
                          onClick={() => handleCopyResponse(selectedItem.response)}
                          className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-[var(--accent)]/10"
                        >
                          {showCopied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Payment Detail View
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--foreground)]">Payment Details</h2>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-[var(--foreground)]">{selectedItem.planName}</h3>
                    <p className="text-xl font-semibold text-[var(--foreground)]">${selectedItem.amount}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Payment Date</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                          <p className="font-medium text-[var(--foreground)]">{selectedItem.paymentDate}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Next Billing Date</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
                          <p className="font-medium text-[var(--foreground)]">{selectedItem.nextBillingDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Status</p>
                      <p className="font-medium text-green-500">{selectedItem.status}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleDownloadReceipt(selectedItem)}
                      className="w-full mt-4 p-3 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors flex items-center justify-center gap-2 text-[var(--foreground)]"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
              <p>Select an item to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}