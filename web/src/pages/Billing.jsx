import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$15',
    period: '/mo',
    subtitle: 'For freelancers',
    features: ['50 Invoices', 'Email Support'],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '$29.99',
    period: '/mo',
    subtitle: 'For growing businesses',
    features: ['Unlimited Invoices', 'Multi-User Access', 'Priority Support', 'Advanced Analytics'],
    highlighted: true,
  },
];

const MOCK_INVOICES = [
  { id: 'INV-2024-001', date: 'Oct 24, 2023', amount: '$29.99', status: 'Paid', statusColor: 'emerald' },
  { id: 'INV-2023-012', date: 'Sep 24, 2023', amount: '$0.00', status: 'Free Tier', statusColor: 'gray' },
];

export default function Billing() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activePlan = PLANS.find(p => p.id === selectedPlan);
  const displayPrice = activePlan?.price || '$29.99';

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-[#f5f7fa] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Subscription</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your plan and payment methods</p>
          </div>

          {/* Success Alert */}
          {showSuccess && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium animate-[fadeIn_0.3s_ease-out]">
              <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Payment Successful! Plan upgraded.</span>
              <button onClick={() => setShowSuccess(false)} className="ml-2 text-emerald-400 hover:text-emerald-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Content Grid ────────────────────────────────────────── */}
        <div className="px-8 pb-10 grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">

          {/* ═══ LEFT COLUMN (spans 2) ════════════════════════════ */}
          <div className="xl:col-span-2 space-y-6">

            {/* Current Plan Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Current Plan</p>
                <h3 className="text-lg font-bold text-gray-900">Free Plan</h3>
                <p className="text-sm text-gray-500 mt-0.5">Limited to 5 invoices/month</p>
              </div>
              <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                Active
              </span>
            </div>

            {/* Plan Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`text-left bg-white rounded-xl p-6 transition-all duration-200 cursor-pointer relative ${
                      isSelected
                        ? 'border-2 border-[#123458] shadow-md ring-1 ring-[#123458]/10'
                        : 'border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-3 left-5 bg-[#123458] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        Selected Upgrade
                      </span>
                    )}
                    <h4 className="text-lg font-bold text-gray-900 mt-1">{plan.name}</h4>
                    <div className="flex items-baseline gap-0.5 mt-2">
                      <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-400">{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{plan.subtitle}</p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Billing History</h3>
                <button className="flex items-center gap-1.5 text-sm font-semibold text-[#123458] hover:text-opacity-80 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Invoice ID</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Amount</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICES.map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{inv.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{inv.date}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{inv.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                            inv.statusColor === 'emerald'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="flex items-center gap-1 text-sm font-medium text-[#123458] hover:text-opacity-80 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═════════════════════════════════════ */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm sticky top-8">
              {/* Payment Header */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Payment Details</h3>
                <p className="text-sm text-gray-500 mt-0.5">Complete your upgrade to {activePlan?.name || 'Pro'}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Total Due */}
                <div className="bg-[#f5f7fa] rounded-lg p-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Total due today</span>
                  <span className="text-2xl font-extrabold text-gray-900">{displayPrice}</span>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cardholder Name</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      defaultValue="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Number</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      defaultValue="•••• •••• •••• 4242"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Expiry + CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry</label>
                    <input
                      type="text"
                      defaultValue="12/25"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                      CVC
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </label>
                    <input
                      type="text"
                      defaultValue="•••"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-[#123458] hover:bg-[#0f2a47] text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Pay {displayPrice} Now
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">Payments are processed securely by Stripe.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
