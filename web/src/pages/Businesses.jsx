import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CreateBusinessModal from '../components/CreateBusinessModal';

// Category → visual config mapping
const CATEGORY_CONFIG = {
  AUTOMOTIVE: {
    tag: 'bg-blue-600',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    gradient: 'from-blue-900/80 to-blue-700/40',
    emoji: '🚗',
  },
  RETAIL: {
    tag: 'bg-emerald-600',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    gradient: 'from-emerald-900/80 to-emerald-700/40',
    emoji: '🛍️',
  },
  SERVICES: {
    tag: 'bg-purple-600',
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    gradient: 'from-purple-900/80 to-purple-700/40',
    emoji: '⚙️',
  },
  CONSULTING: {
    tag: 'bg-orange-500',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    gradient: 'from-orange-900/80 to-orange-700/40',
    emoji: '💼',
  },
  'FOOD & BEVERAGE': {
    tag: 'bg-rose-500',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    gradient: 'from-rose-900/80 to-rose-700/40',
    emoji: '🍽️',
  },
  TECH: {
    tag: 'bg-cyan-600',
    text: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    gradient: 'from-cyan-900/80 to-cyan-700/40',
    emoji: '💻',
  },
  OTHER: {
    tag: 'bg-gray-600',
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    gradient: 'from-gray-900/80 to-gray-700/40',
    emoji: '🏢',
  },
};

/* ── Helper: safely parse a date string into a Date object ─────────── */
function safeParseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/* ── Helper: compute revenue metrics from a list of transactions ───── */
function computeRevenueMetrics(transactions) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear = currentYear - 1;
  }

  let totalRevenue = 0;
  let currentMonthRevenue = 0;
  let lastMonthRevenue = 0;

  for (const tx of transactions) {
    const amt = parseFloat(tx.amount) || 0;
    totalRevenue += amt;

    const d = safeParseDate(tx.createdAt);
    if (!d) continue;

    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      currentMonthRevenue += amt;
    } else if (d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth) {
      lastMonthRevenue += amt;
    }
  }

  // Change % with edge case handling
  let changePercent = 0;
  if (lastMonthRevenue === 0 && currentMonthRevenue > 0) {
    changePercent = 100;
  } else if (lastMonthRevenue === 0 && currentMonthRevenue === 0) {
    changePercent = 0;
  } else {
    changePercent = Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
  }

  return { totalRevenue, changePercent };
}

// Abstract pattern SVG backgrounds per category for card headers
function CardHeaderBg({ category, name }) {
  const upper = (category || 'OTHER').toUpperCase();
  const cfg = CATEGORY_CONFIG[upper] || CATEGORY_CONFIG.OTHER;

  const patterns = {
    AUTOMOTIVE: (
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
        <circle cx="320" cy="40" r="80" fill="white" />
        <circle cx="80" cy="160" r="60" fill="white" />
        <rect x="150" y="20" width="120" height="8" rx="4" fill="white" />
        <rect x="100" y="40" width="80" height="8" rx="4" fill="white" />
        <path d="M0 140 Q100 100 200 130 T400 110" stroke="white" strokeWidth="2" fill="none" />
      </svg>
    ),
    RETAIL: (
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
        <rect x="60" y="30" width="40" height="40" rx="5" fill="white" />
        <rect x="120" y="50" width="30" height="30" rx="5" fill="white" />
        <rect x="240" y="20" width="50" height="50" rx="5" fill="white" />
        <rect x="320" y="40" width="35" height="35" rx="5" fill="white" />
        <circle cx="200" cy="140" r="50" fill="white" />
      </svg>
    ),
    SERVICES: (
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
        <path d="M50 90 A60 60 0 0 1 170 90" stroke="white" strokeWidth="3" fill="none" />
        <path d="M230 90 A60 60 0 0 1 350 90" stroke="white" strokeWidth="3" fill="none" />
        <circle cx="200" cy="50" r="40" stroke="white" strokeWidth="3" fill="none" />
        <line x1="200" y1="10" x2="200" y2="170" stroke="white" strokeWidth="2" />
      </svg>
    ),
    CONSULTING: (
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
        <line x1="40" y1="160" x2="120" y2="80" stroke="white" strokeWidth="3" />
        <line x1="120" y1="80" x2="200" y2="110" stroke="white" strokeWidth="3" />
        <line x1="200" y1="110" x2="280" y2="50" stroke="white" strokeWidth="3" />
        <line x1="280" y1="50" x2="360" y2="20" stroke="white" strokeWidth="3" />
        <circle cx="120" cy="80" r="8" fill="white" />
        <circle cx="200" cy="110" r="8" fill="white" />
        <circle cx="280" cy="50" r="8" fill="white" />
      </svg>
    ),
  };

  const patternEl = patterns[upper] || (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
      <circle cx="300" cy="60" r="90" fill="white" />
    </svg>
  );

  const colorMap = {
    AUTOMOTIVE: '#1e3a5f',
    RETAIL: '#064e3b',
    SERVICES: '#4c1d95',
    CONSULTING: '#7c2d12',
    'FOOD & BEVERAGE': '#881337',
    TECH: '#164e63',
    OTHER: '#1f2937',
  };
  const bgColor = colorMap[upper] || '#1f2937';

  return (
    <div className="relative h-36 overflow-hidden rounded-t-xl" style={{ backgroundColor: bgColor }}>
      {patternEl}
      <span className="absolute right-4 top-2 text-7xl opacity-25 select-none">{cfg.emoji}</span>
      <div className={`absolute inset-0 bg-gradient-to-t ${cfg.gradient}`} />
      <div className="absolute bottom-3 left-4 right-4">
        <span className={`inline-block ${cfg.tag} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest mb-1`}>
          {upper}
        </span>
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 drop-shadow">{name}</h3>
      </div>
    </div>
  );
}

function BusinessCard({ business, revenueData, index, currencySymbol, displayRevenue }) {
  const navigate = useNavigate();
  const upper = (business.category || 'OTHER').toUpperCase();

  const { changePercent } = revenueData;
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardHeaderBg category={business.category} name={business.name} />

      <div className="p-5 flex flex-col flex-1">
        <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">
          {business.description || 'No description provided.'}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-[#123458]">
                {currencySymbol}{displayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`flex items-center text-xs font-bold ${
                isPositive ? 'text-emerald-600' :
                isNegative ? 'text-red-500' :
                'text-gray-400'
              }`}>
                {isPositive ? (
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : isNegative ? (
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                  </svg>
                ) : null}
                {isPositive ? '+' : ''}{changePercent}%
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/business/${business.id}`)}
            className="text-sm font-semibold text-[#123458] hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            View Details
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-[#123458] hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center min-h-[280px] group"
    >
      <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-[#123458] flex items-center justify-center mb-3 transition-colors">
        <svg className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-400 group-hover:text-[#123458] transition-colors">Create New Business</p>
    </button>
  );
}

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [revenueMap, setRevenueMap] = useState({}); // businessId → { totalRevenue, changePercent }
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Currency
  const [currency, setCurrency] = useState('PHP');
  const [exchangeRate, setExchangeRate] = useState(null); // PHP per 1 USD

  const categories = ['ALL', 'AUTOMOTIVE', 'RETAIL', 'SERVICES', 'CONSULTING', 'FOOD & BEVERAGE', 'TECH', 'OTHER'];

  // Fetch live exchange rate on mount
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=PHP')
      .then(res => res.json())
      .then(data => { if (data?.rates?.PHP) setExchangeRate(data.rates.PHP); })
      .catch(err => console.error('Exchange rate fetch failed:', err));
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/v1/businesses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success && result.data) {
        setBusinesses(result.data);
        // Fetch transactions for all businesses concurrently
        await fetchAllRevenues(result.data, token);
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRevenues = async (bizList, token) => {
    // Use Promise.allSettled so one failure doesn't crash everything
    const results = await Promise.allSettled(
      bizList.map(biz =>
        fetch(`http://localhost:8080/api/v1/transactions/business/${biz.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json())
      )
    );

    const newRevenueMap = {};
    results.forEach((result, idx) => {
      const bizId = bizList[idx].id;
      if (result.status === 'fulfilled' && result.value?.success && result.value?.data) {
        newRevenueMap[bizId] = computeRevenueMetrics(result.value.data);
      } else {
        // Graceful fallback — business transaction fetch failed, show zero
        newRevenueMap[bizId] = { totalRevenue: 0, changePercent: 0 };
      }
    });

    setRevenueMap(newRevenueMap);
  };

  const handleAddSuccess = (newBusiness) => {
    setBusinesses(prev => [...prev, newBusiness]);
    // Set default revenue for the new business
    setRevenueMap(prev => ({
      ...prev,
      [newBusiness.id]: { totalRevenue: 0, changePercent: 0 },
    }));
  };

  const filtered = businesses.filter(b => {
    const matchesSearch = b.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || (b.category?.toUpperCase() === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Currency helpers
  const rate = exchangeRate || 56; // fallback
  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertRevenue = (phpAmount) => currency === 'USD' ? phpAmount / rate : phpAmount;

  // Default revenue for any business not yet in the map
  const getRevenue = (bizId) => revenueMap[bizId] || { totalRevenue: 0, changePercent: 0 };

  return (
    <div className="flex h-screen bg-[#F1EFEC] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Page Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-[#123458]">Manage Businesses</h1>
            <p className="text-sm text-gray-400 mt-0.5">Overview of your active ventures</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setCurrency('PHP')}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${currency === 'PHP' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                PHP
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${currency === 'USD' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                USD
              </button>
            </div>
            {/* Filter button + dropdown */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(p => !p)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
                {selectedCategory !== 'ALL' && (
                  <span className="bg-[#123458] text-white text-[10px] px-1.5 py-0.5 rounded-full">{selectedCategory}</span>
                )}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1 overflow-hidden">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-blue-50 text-[#123458]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#123458] hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Business
            </button>
          </div>
        </div>

        <div className="px-8 py-6 max-w-7xl mx-auto">
          {/* Search bar */}
          <div className="mb-6 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full max-w-sm pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-36 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="h-6 bg-gray-200 rounded w-1/2 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 && businesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No businesses yet</h3>
              <p className="text-sm text-gray-500 mb-6">Create your first business to get started.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#123458] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors"
              >
                + Create New Business
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((biz, i) => {
                const rev = getRevenue(biz.id);
                return (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  revenueData={rev}
                  index={i}
                  currencySymbol={currencySymbol}
                  displayRevenue={convertRevenue(rev.totalRevenue)}
                />);
              })}
              <CreateCard onClick={() => setIsModalOpen(true)} />
            </div>
          )}

          {/* Summary footer */}
          {!loading && businesses.length > 0 && (
            <p className="text-xs text-gray-400 mt-6">
              Showing {filtered.length} of {businesses.length} business{businesses.length !== 1 ? 'es' : ''}
              {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
            </p>
          )}
        </div>
      </main>

      <CreateBusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
}
