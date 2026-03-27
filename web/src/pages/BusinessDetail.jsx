import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';
import AddStaffModal from '../components/AddStaffModal';
import LogIncomeModal from '../components/LogIncomeModal';
import EditBusinessModal from '../components/EditBusinessModal';

/* ── Process Chart Data (Matches Dashboard logic) ───────────────────────── */
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

/* ── Custom Tooltip ────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, currencySymbol }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#123458] text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p>{currencySymbol || '$'}{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function BusinessDetail() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState('7d');
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [incomeLogs, setIncomeLogs] = useState([]);

  // Sync REAL backend staff gracefully to the local staffList
  useEffect(() => {
    if (business && Array.isArray(business.staff)) {
      setStaffList(business.staff);
    }
  }, [business]);

  // Remove Staff Modal State
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Custom Toast State
  const [toastMsg, setToastMsg] = useState('');

  // Mutating flag for optimistic UI and polling safety
  const isMutating = useRef(false);

  // Currency
  const [currency, setCurrency] = useState('PHP');
  const [exchangeRate, setExchangeRate] = useState(null);

  // Fetch exchange rate on mount
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=PHP')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.PHP) setExchangeRate(data.rates.PHP);
      })
      .catch(err => console.error('Exchange rate fetch failed:', err));
  }, []);

  // Initial load
  useEffect(() => {
    fetchBusiness();
    fetchTransactions();
  }, [businessId]);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/v1/businesses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        const found = result.data.find(b => b.id === businessId);
        if (found) setBusiness(found);
      }
    } catch (err) {
      console.error('Failed to fetch business:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/v1/transactions/business/${businessId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setIncomeLogs(result.data.map(tx => ({
          id: tx.id,
          date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          rawDate: tx.createdAt || '',
          description: tx.description || 'No description',
          loggedBy: tx.staff ? `${tx.staff.firstname} ${tx.staff.lastname}` : 'Unknown',
          amount: parseFloat(tx.amount),
          rawAmount: parseFloat(tx.amount) || 0,
          receipt: !!tx.receiptUrl,
          receiptUrl: tx.receiptUrl || null,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleEditSuccess = (updatedBusiness) => {
    setBusiness(updatedBusiness);
  };

  const handleStaffAdded = (newStaff) => {
    setStaffList(prev => [...prev, { id: Date.now(), ...newStaff }]);
  };

  const handleRemoveStaff = (staff) => {
    setStaffToRemove(staff);
    setIsRemoveModalOpen(true);
  };

  const confirmRemoveStaff = async () => {
    if (!staffToRemove) return;
    
    const targetId = staffToRemove.id;
    setIsRemoving(true);

    // 1. Aggressive Optimistic UI Update - Remove instantly!
    setStaffList(prev => prev.filter(s => s.id !== targetId));
    setToastMsg('Staff removed successfully');
    setTimeout(() => setToastMsg(''), 3000);
    setIsRemoveModalOpen(false);
    setStaffToRemove(null);

    // 2. Perform the actual backend sync silently in the background
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8080/api/v1/businesses/${businessId}/staff/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      // Silent success; the UI is already updated beautifully.
    } catch (err) {
      console.error('Failed to remove staff dynamically:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleIncomeLogged = () => {
    fetchTransactions();
  };

  // Currency helpers
  const rate = exchangeRate || 56;
  // System natively stores PHP. Divide by rate if user toggles to USD display.
  const convertAmount = (phpAmount) => currency === 'USD' ? phpAmount / rate : phpAmount;
  const currencySymbol = currency === 'PHP' ? '₱' : '$';

  // Compute total revenue from real transactions
  const totalRevenue = incomeLogs.reduce((sum, log) => sum + log.amount, 0);
  const displayRevenue = convertAmount(totalRevenue);

  // Compute chart data with zero-filling and currency conversion map
  const activeChartData = useMemo(() => {
    const baseData = aggregateByRange(incomeLogs, chartRange);
    return currency === 'USD' 
      ? baseData.map(d => ({ ...d, revenue: d.revenue / rate }))
      : baseData;
  }, [incomeLogs, chartRange, currency, rate]);

  // Compute Y-axis formatter based on range
  const yTickFormatter = (v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`;

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F1EFEC] font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="animate-pulse space-y-6 max-w-6xl mx-auto">
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-32 bg-white rounded-xl" />
              <div className="h-32 bg-white rounded-xl" />
            </div>
            <div className="h-72 bg-white rounded-xl" />
            <div className="h-48 bg-white rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-screen bg-[#F1EFEC] font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Business not found</h3>
            <p className="text-sm text-gray-500 mb-4">The business you're looking for doesn't exist.</p>
            <Link to="/businesses" className="text-sm font-semibold text-[#123458] hover:underline">← Back to Businesses</Link>
          </div>
        </main>
      </div>
    );
  }

  const categoryUpper = (business.category || 'OTHER').toUpperCase();

  return (
    <div className="flex h-screen bg-[#F1EFEC] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* ── Breadcrumb + Currency Toggle ───────────────────────── */}
        <div className="bg-white px-8 py-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Link to="/businesses" className="text-gray-400 hover:text-gray-600 transition-colors">Businesses</Link>
            <svg className="w-3.5 h-3.5 mx-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-700 font-medium">{business.name}</span>
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
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto space-y-6">

          {/* ── Top Summary Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Info Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">
                  {categoryUpper === 'AUTOMOTIVE' ? '🚗' : categoryUpper === 'RETAIL' ? '🛍️' : categoryUpper === 'SERVICES' ? '⚙️' : categoryUpper === 'CONSULTING' ? '💼' : categoryUpper === 'FOOD & BEVERAGE' ? '🍽️' : categoryUpper === 'TECH' ? '💻' : '🏢'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{business.name}</h2>
                <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">
                  {categoryUpper}
                </span>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{business.description || 'No description provided'}</p>
              </div>
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>

            {/* Revenue Summary Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{currencySymbol}{displayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <div className="flex items-center gap-1 mt-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-semibold text-emerald-600">+12% from last month</span>
              </div>
            </div>
          </div>

          {/* ── Revenue Trend Chart ──────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-900">Revenue Trend</h3>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { label: 'Last 7 Days', value: '7d' },
                  { label: 'Last 30 Days', value: '30d' },
                  { label: 'Yearly', value: '1y' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setChartRange(opt.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${chartRange === opt.value
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
              {activeChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No transaction data for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData.map(d => ({ ...d, revenue: convertAmount(d.revenue) }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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

          {/* ── Assigned Staff ───────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Assigned Staff</h3>
              <button
                onClick={() => setStaffModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#123458] hover:bg-opacity-90 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Assign Staff
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date Assigned</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-400">No staff assigned yet.</td>
                    </tr>
                  ) : (
                    staffList.map(staff => (
                      <tr key={staff.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {staff.initials}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{staff.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(staff.dateAssigned).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleRemoveStaff(staff)}
                            className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Recent Income Logs ───────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 mb-8">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Recent Income Logs</h3>
              <button
                onClick={() => setIncomeModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#123458] hover:bg-opacity-90 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Log Income
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Description</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Logged By</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-400">No income logged yet.</td>
                    </tr>
                  ) : (
                    incomeLogs.map(log => (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{log.loggedBy}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-emerald-600">+{currencySymbol}{convertAmount(log.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </td>
                        <td className="px-6 py-4">
                          {log.receipt && log.receiptUrl ? (
                            <a
                              href={log.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
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
      </main>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <AddStaffModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        businessName={business.name}
        businessId={businessId}
        onSuccess={handleStaffAdded}
      />
      <LogIncomeModal
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        businessId={businessId}
        businessName={business.name}
        onSuccess={handleIncomeLogged}
      />
      <EditBusinessModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        business={business}
        onEditSuccess={handleEditSuccess}
      />

      {/* ── Remove Staff Confirmation Modal ────────────────────── */}
      {isRemoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123458]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Remove Staff Member</h2>
              <button
                onClick={() => {
                  setIsRemoveModalOpen(false);
                  setStaffToRemove(null);
                }}
                disabled={isRemoving}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-500 text-sm leading-relaxed">
                Are you sure you want to remove <strong className="text-gray-900">{staffToRemove?.name}</strong> from this business? They will lose access immediately, but their past transaction logs will remain intact.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setIsRemoveModalOpen(false);
                  setStaffToRemove(null);
                }}
                disabled={isRemoving}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors bg-transparent border-0"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveStaff}
                disabled={isRemoving}
                className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm transition-all flex items-center gap-2"
              >
                {isRemoving && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isRemoving ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Cyan Success Toast ─────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom flex items-center gap-3 bg-cyan-600 text-white px-5 py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 font-medium">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
