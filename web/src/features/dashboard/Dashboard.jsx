import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../../common/components/Sidebar';
import BusinessCard from '../business/components/BusinessCard';
import AddBusinessModal from '../business/components/AddBusinessModal';

/* ── Chart Tooltip (matches BusinessDetail style) ──────────────────────── */
function CustomTooltip({ active, payload, label, currencySymbol }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#123458] text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p>{currencySymbol}{payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
}

/* ── Helper: aggregate transactions by date range with zero-filling ──────── */
function aggregateByRange(allTxns, range) {
  const data = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30;
    
    // Generate empty array of the last `days` days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = range === '7d' 
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
        : `${d.getMonth() + 1}/${d.getDate()}`; // short date for 30d
        
      data.push({ rawDateStr: dateStr, label, revenue: 0 });
    }

    allTxns.forEach(tx => {
      if (!tx.rawDate) return;
      const txDate = new Date(tx.rawDate);
      if (isNaN(txDate.getTime())) return;
      
      const txDateStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
      
      const idx = data.findIndex(d => d.rawDateStr === txDateStr);
      if (idx !== -1) {
        data[idx].revenue += parseFloat(tx.rawAmount) || 0;
      }
    });
  } else if (range === '1y') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      data.push({ yearMonth, label: monthNames[d.getMonth()], revenue: 0 });
    }

    allTxns.forEach(tx => {
      if (!tx.rawDate) return;
      const txDate = new Date(tx.rawDate);
      if (isNaN(txDate.getTime())) return;
      
      const txYearMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      
      const idx = data.findIndex(d => d.yearMonth === txYearMonth);
      if (idx !== -1) {
        data[idx].revenue += parseFloat(tx.rawAmount) || 0;
      }
    });
  }

  return data;
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [allTxnData, setAllTxnData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactionCount, setTotalTransactionCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingRef = useRef(null);

  // MoM Growth Metrics
  const [revGrowth, setRevGrowth] = useState(0);
  const [txnGrowth, setTxnGrowth] = useState(0);
  const [bizGrowth, setBizGrowth] = useState(0);

  // Chart
  const [chartRange, setChartRange] = useState('7d');

  // Currency
  const [currency, setCurrency] = useState('PHP');
  const [exchangeRate, setExchangeRate] = useState(null); // PHP per 1 USD

  // ── Fetch exchange rate on mount ─────────────────────────────────────
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=PHP')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.PHP) setExchangeRate(data.rates.PHP);
      })
      .catch(err => console.error('Exchange rate fetch failed:', err));
  }, []);

  // ── Fetch businesses + transactions ──────────────────────────────────
  const fetchBusinesses = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/v1/businesses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success && result.data) {
        setBusinesses(result.data);
        fetchAllTransactions(result.data, token);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        let currTotalBiz = result.data.length;
        let createdThisMonth = 0;
        result.data.forEach(b => {
          if(!b.createdAt) return;
          const d = new Date(b.createdAt);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            createdThisMonth++;
          }
        });
        const prevTotalBiz = currTotalBiz - createdThisMonth;
        const bg = prevTotalBiz === 0 ? (currTotalBiz > 0 ? 100 : 0) : ((currTotalBiz - prevTotalBiz) / prevTotalBiz) * 100;
        setBizGrowth(bg);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // ── Live polling: refetch every 5 seconds ───────────────────────────
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchBusinesses(true); // silent = true → no loading spinner flash
    }, 5000);

    return () => clearInterval(pollingRef.current);
  }, [fetchBusinesses]);

  const fetchAllTransactions = async (bizList, token) => {
    try {
      const allTxns = [];
      for (const biz of bizList) {
        const res = await fetch(`http://localhost:8080/api/v1/transactions/business/${biz.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success && result.data) {
          result.data.forEach(tx => {
            allTxns.push({
              rawId: tx.id,
              id: tx.id ? `#${tx.id.substring(0, 8).toUpperCase()}` : '#TRX',
              business: biz.name,
              description: tx.description || '',
              date: tx.createdAt
                ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'N/A',
              rawDate: tx.createdAt || '',
              rawAmount: parseFloat(tx.amount) || 0,
              amount: `₱${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              receiptUrl: tx.receiptUrl || null,
            });
          });
        }
      }
      allTxns.sort((a, b) => (b.rawDate > a.rawDate ? 1 : -1));
      setAllTxnData(allTxns);
      setRecentTransactions(allTxns.slice(0, 10));

      const revenue = allTxns.reduce((sum, tx) => sum + tx.rawAmount, 0);
      setTotalRevenue(revenue);
      setTotalTransactionCount(allTxns.length);

      // --- MoM Calculations ---
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      if (previousMonth < 0) {
        previousMonth = 11;
        previousYear = currentYear - 1;
      }

      let currRev = 0, prevRev = 0;
      let currTxnCount = 0, prevTxnCount = 0;

      allTxns.forEach(tx => {
        if (!tx.rawDate) return;
        const txDate = new Date(tx.rawDate);
        const m = txDate.getMonth();
        const y = txDate.getFullYear();

        if (y === currentYear && m === currentMonth) {
          currRev += tx.rawAmount;
          currTxnCount++;
        } else if (y === previousYear && m === previousMonth) {
          prevRev += tx.rawAmount;
          prevTxnCount++;
        }
      });

      const calcGrowth = (curr, prev) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      setRevGrowth(calcGrowth(currRev, prevRev));
      setTxnGrowth(calcGrowth(currTxnCount, prevTxnCount));

    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleAddSuccess = (newBusiness) => {
    setBusinesses(prev => [...prev, newBusiness]);
  };

  // ── Currency conversion helpers ──────────────────────────────────────
  const rate = exchangeRate || 56; // fallback
  // Data is natively stored as PHP. Divide by rate if user selects USD display.
  const convertAmount = (phpAmount) => currency === 'USD' ? phpAmount / rate : phpAmount;
  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const displayRevenue = convertAmount(totalRevenue);

  // ── Chart data (memoized, applies currency conversion) ───────────────
  const chartData = useMemo(() => {
    const raw = aggregateByRange(allTxnData, chartRange);
    return raw.map(d => ({ ...d, revenue: convertAmount(d.revenue) }));
  }, [allTxnData, chartRange, currency, exchangeRate]);

  const yTickFormatter = (v) => {
    if (v >= 1000000) return `${currencySymbol}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${currencySymbol}${(v / 1000).toFixed(0)}k`;
    return `${currencySymbol}${v}`;
  };

  // Helper for MoM Visualizer
  const renderGrowthBadge = (percentage) => {
    const isPositive = percentage >= 0;
    const color = isPositive ? 'text-emerald-700' : 'text-red-700';
    const bg = isPositive ? 'bg-emerald-100' : 'bg-red-100';
    const arrow = isPositive 
      ? <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
      : <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>;
      
    return (
      <div className={`${bg} ${color} text-xs font-bold px-2 py-1 rounded-md flex items-center`}>
        {arrow}
        {isPositive ? '+' : ''}{percentage.toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F1EFEC] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto w-full">
        {/* Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 w-full mb-8">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-[#123458]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <h1 className="text-xl font-bold text-[#123458]">Dashboard Overview</h1>
          </div>

          <div className="flex items-center space-x-4">
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

            {/* Currency Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setCurrency('PHP')}
                className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${currency === 'PHP' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                PHP
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${currency === 'USD' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                USD
              </button>
            </div>

            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
          </div>
        </div>

        <div className="px-8 max-w-7xl mx-auto space-y-6 pb-12 w-full">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full">
              <div className="flex justify-between items-start">
                <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                {renderGrowthBadge(revGrowth)}
              </div>
              <div className="mt-4">
                <p className="text-gray-500 font-medium text-sm">Total Revenue</p>
                <h2 className="text-3xl font-bold text-[#123458] mt-1">{currencySymbol}{displayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full">
              <div className="flex justify-between items-start">
                <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                </div>
                {renderGrowthBadge(txnGrowth)}
              </div>
              <div className="mt-4">
                <p className="text-gray-500 font-medium text-sm">Transactions</p>
                <h2 className="text-3xl font-bold text-[#123458] mt-1">{totalTransactionCount.toLocaleString()}</h2>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full">
              <div className="flex justify-between items-start">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                {renderGrowthBadge(bizGrowth)}
              </div>
              <div className="mt-4">
                <p className="text-gray-500 font-medium text-sm">Total Businesses</p>
                <h2 className="text-3xl font-bold text-[#123458] mt-1">{businesses.length}</h2>
              </div>
            </div>
          </div>

          {/* ── Revenue Trend Chart (recharts) ─────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#123458]">Revenue Trend</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { label: 'Last 7 Days', value: '7d' },
                  { label: 'Last 30 Days', value: '30d' },
                  { label: 'Yearly', value: '1y' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setChartRange(opt.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      chartRange === opt.value
                        ? 'bg-[#123458] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No transaction data for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="dashRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#123458" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#123458" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={yTickFormatter} />
                    <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                    <Area type="monotone" dataKey="revenue" stroke="#123458" strokeWidth={2.5} fill="url(#dashRevenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Recent Transactions ────────────────────────────────────── */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col w-full overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-[#123458]">Recent Transactions</h2>
                <button className="text-[#123458] hover:text-blue-800 text-sm font-semibold transition-colors">View All</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-400 font-bold tracking-wider border-b border-gray-100 text-xs uppercase">
                      <th className="pb-3 pr-4">Transaction ID</th>
                      <th className="pb-3 px-4">Business</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 font-medium">
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-sm text-gray-400">No transactions yet. Log income from a business detail page.</td>
                      </tr>
                    ) : (
                      recentTransactions.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-4 pr-4 font-semibold text-[#123458]">{row.id}</td>
                        <td className="py-4 px-4 flex items-center">
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center mr-2 text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                          </div>
                          {row.business}
                        </td>
                        <td className="py-4 px-4">{row.date}</td>
                        <td className="py-4 px-4 font-bold text-[#123458]">
                          {currencySymbol}{convertAmount(row.rawAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4">
                          {row.receiptUrl ? (
                            <a
                              href={row.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#123458] hover:bg-[#0f2a47] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View Receipt
                            </a>
                          ) : (
                            <span className="bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-not-allowed inline-block">
                              No Receipt
                            </span>
                          )}
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AddBusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
}
