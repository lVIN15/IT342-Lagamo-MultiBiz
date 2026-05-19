import React, { useState, useEffect } from 'react';
import Sidebar from '../../common/components/Sidebar';
import { useSearchParams } from 'react-router-dom';

const PLANS = [
  {
    id: 'basic',
    name: 'Starter Plan (Basic)',
    price: '₱0',
    period: '/mo',
    subtitle: 'A small, single-location business just getting started with digital management.',
    features: [
      'Manage 1 Business Location',
      'Up to 3 Staff Accounts',
      'Dedicated Staff Mobile App',
      'Real-time Web Dashboard',
      'Download CSV Reports',
      'Send Reports via Email',
    ],
  },
  {
    id: 'pro',
    name: 'Multi-Biz Pro Plan',
    price: '₱500',
    period: '/mo',
    subtitle: 'A scaling business owner expanding to new locations and hiring a larger team.',
    features: [
      'Unlimited Business Locations',
      'Unlimited Staff Accounts',
      'Dedicated Staff Mobile App',
      'Real-time Web Dashboard',
      'Download CSV Reports',
      'Send Reports via Email',
    ],
    highlighted: true,
  },
];

export default function Billing() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(null);

  const isPro = subscriptionStatus === 'PRO';

  // Fetch the real subscription status from the backend on every page load
  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:8080/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result.success) {
          const userObj = result.data;
          setSubscriptionStatus(userObj.subscriptionStatus || 'BASIC');
          
          if (userObj.subscriptionStatus === 'PRO' && userObj.subscriptionEndDate) {
            const endDate = new Date(userObj.subscriptionEndDate);
            const now = new Date();
            const diffTime = endDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(diffDays);
          } else {
            setDaysLeft(null);
          }

          // Keep localStorage in sync with the database
          const userString = localStorage.getItem('user');
          if (userString) {
            const user = JSON.parse(userString);
            user.subscriptionStatus = userObj.subscriptionStatus || 'BASIC';
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      } catch {
        // Fallback to localStorage if backend is unreachable
        const userString = localStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : {};
        setSubscriptionStatus(user.subscriptionStatus || 'BASIC');
      } finally {
        setLoading(false);
      }
    };

    // Check for return from PayMongo checkout
    const status = searchParams.get('status');
    if (status === 'success') {
      // Confirm the upgrade for the currently authenticated user
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://localhost:8080/api/v1/billing/confirm', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              // Update localStorage to reflect PRO status
              const userString = localStorage.getItem('user');
              if (userString) {
                const user = JSON.parse(userString);
                user.subscriptionStatus = 'PRO';
                localStorage.setItem('user', JSON.stringify(user));
              }
              setSubscriptionStatus('PRO');
            }
          })
          .catch(err => console.error('Failed to confirm upgrade:', err));
      }
      setShowSuccess(true);
    } else if (status === 'cancelled') {
      setShowCancelled(true);
    }

    fetchStatus();
  }, []);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:8080/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/billing?status=success`,
          cancelUrl: `${window.location.origin}/billing?status=cancelled`,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Redirect to PayMongo's hosted checkout page
        window.location.href = result.data.checkoutUrl;
      } else {
        setError(result.error?.message || 'Failed to create checkout session.');
        setIsProcessing(false);
      }
    } catch (e) {
      setError('Connection error. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f7fa] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg className="w-8 h-8 animate-spin text-[#123458]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="mt-3 text-sm text-gray-500">Loading billing info...</p>
          </div>
        ) : (
        <>
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
              <span>Payment Successful! Your plan has been upgraded to Pro.</span>
              <button onClick={() => setShowSuccess(false)} className="ml-2 text-emerald-400 hover:text-emerald-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Cancelled Alert */}
          {showCancelled && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium animate-[fadeIn_0.3s_ease-out]">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Payment was cancelled. You can try again anytime.</span>
              <button onClick={() => setShowCancelled(false)} className="ml-2 text-amber-400 hover:text-amber-600 transition-colors">
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
                <h3 className="text-lg font-bold text-gray-900">{isPro ? 'Pro Plan' : 'Basic Plan'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isPro ? 'Unlimited businesses & premium features' : 'Limited to 3 businesses'}
                </p>
              </div>
              <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${
                isPro ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {isPro ? '✓ Pro Active' : 'Basic'}
              </span>
            </div>

            {/* Plan Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PLANS.map((plan) => {
                const isCurrentPlan = (plan.id === 'basic' && !isPro) || (plan.id === 'pro' && isPro);
                return (
                  <div
                    key={plan.id}
                    className={`text-left bg-white rounded-xl p-6 transition-all duration-200 relative ${
                      isCurrentPlan
                        ? 'border-2 border-[#123458] shadow-md ring-1 ring-[#123458]/10'
                        : 'border border-gray-200'
                    }`}
                  >
                    {isCurrentPlan && (
                      <span className="absolute -top-3 left-5 bg-[#123458] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        Current Plan
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═════════════════════════════════════ */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm sticky top-8">
              {/* Payment Header */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  {isPro ? 'You\'re on Pro!' : 'Upgrade to Pro'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isPro
                    ? 'Thank you for being a Pro subscriber.'
                    : 'Unlock unlimited businesses & premium features'}
                </p>
              </div>

              <div className="p-6 space-y-5">
                {isPro ? (
                  <>
                    {/* Pro status display */}
                    <div className="bg-emerald-50 rounded-lg p-4 flex items-center gap-3">
                      <svg className="w-8 h-8 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-bold text-emerald-700">Pro Plan Active</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {daysLeft !== null 
                            ? (daysLeft <= 5 
                                ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.` 
                                : `Active for ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}.`)
                            : 'All premium features are unlocked.'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Early Renewal Option */}
                    {daysLeft !== null && daysLeft <= 5 && (
                      <div className="mt-4">
                        <div className="bg-[#f5f7fa] rounded-lg p-4 flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500 font-medium">Renewal cost</span>
                          <span className="text-2xl font-extrabold text-gray-900">₱500</span>
                        </div>
                        {error && (
                          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-start gap-2 mb-4">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                          </div>
                        )}
                        <button
                          onClick={handleUpgrade}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-2 bg-[#123458] hover:bg-[#0f2a47] text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            'Renew Pro Plan'
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Total Due */}
                    <div className="bg-[#f5f7fa] rounded-lg p-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">Total due today</span>
                      <span className="text-2xl font-extrabold text-gray-900">₱500</span>
                    </div>

                    {/* Payment Methods Info */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 mb-2">Accepted Payment Methods</p>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center bg-white border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">GCash</span>
                        <span className="inline-flex items-center bg-white border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">Maya</span>
                        <span className="inline-flex items-center bg-white border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">Card</span>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </div>
                    )}

                    {/* Upgrade Button */}
                    <button
                      onClick={handleUpgrade}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 bg-[#123458] hover:bg-[#0f2a47] text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Redirecting to PayMongo…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Upgrade to Pro — ₱500
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      Secure checkout powered by PayMongo. Supports GCash, Maya, and Credit/Debit Cards.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}
