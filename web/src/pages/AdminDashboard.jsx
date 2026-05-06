import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingRef = useRef(null);

  const fetchStats = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token');
    try {
      if (!silent) setLoading(true);
      const res = await fetch('http://localhost:8080/api/v1/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ── Ban enforcement: kick banned users to login ──
      if (res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const result = await res.json();
      if (res.ok && result.success) {
        setStats(result.data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch admin stats', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate]);

  // Initial fetch
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Live polling every 5 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchStats(true);
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchStats]);

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      label: 'Total Businesses',
      value: stats?.totalBusinesses ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'emerald',
    },
    {
      label: 'Pro Subscribers',
      value: stats?.proSubscribers ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'amber',
    },
    {
      label: 'Total Transactions',
      value: stats?.totalTransactions ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      ),
      color: 'violet',
    },
  ];

  const colorMap = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'text-amber-500' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  icon: 'text-violet-500' },
  };

  return (
    <div className="flex h-screen bg-[#f5f7fa] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header with Live Polling Indicator */}
        <div className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-[#123458]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h1 className="text-xl font-bold text-[#123458]">Platform Overview</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button className="flex items-center text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              LIVE POLLING
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-8 mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
              ))
            : statCards.map((card) => {
                const c = colorMap[card.color];
                return (
                  <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
                      <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center ${c.icon}`}>
                        {card.icon}
                      </div>
                    </div>
                    <p className={`text-3xl font-extrabold ${c.text}`}>
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </p>
                  </div>
                );
              })}
        </div>

        {/* Welcome Message */}
        <div className="px-8 mt-8 pb-10">
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#123458] flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Welcome, Super Admin</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  You have full platform access. Use the sidebar to navigate to <strong>Users</strong> for account management
                  or <strong>Businesses</strong> for content moderation. All actions are logged and protected by role-based security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
