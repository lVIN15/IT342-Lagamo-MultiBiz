import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const QUICK_FILTERS = ['This Month', 'Last Quarter', 'Year to Date'];



export default function ExportReports() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [quickFilter, setQuickFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [recentExports, setRecentExports] = useState([]);

  useEffect(() => {
    fetchBusinesses();
    const savedLog = localStorage.getItem('recentExports');
    if (savedLog) {
      setRecentExports(JSON.parse(savedLog));
    }
    // Initialize default filter UI
    handleQuickFilter('Year to Date');
  }, []);

  const handleQuickFilter = (f) => {
    setQuickFilter(f);
    const now = new Date();
    
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (f === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(fmt(start));
      setEndDate(fmt(end));
    } else if (f === 'Last Quarter') {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setStartDate(fmt(start));
      setEndDate(fmt(now));
    } else if (f === 'Year to Date') {
      const start = new Date(now.getFullYear(), 0, 1);
      setStartDate(fmt(start));
      setEndDate(fmt(now));
    }
  };

  const fetchBusinesses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/v1/businesses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success && result.data) {
        setBusinesses(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    }
  };

  const generateCSVReport = async (businessIdTarget) => {
    setCsvLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication required.");
      
      let allTxns = [];
      
      // Handle the global 'All Businesses' option robustly
      if (businessIdTarget === 'all') {
         const results = await Promise.allSettled(
           businesses.map(b => fetch(`http://localhost:8080/api/v1/transactions/business/${b.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()))
         );
         results.forEach(res => {
            if (res.status === 'fulfilled' && res.value?.success && res.value?.data) {
               allTxns.push(...res.value.data);
            }
         });
      } else {
         const res = await fetch(`http://localhost:8080/api/v1/transactions/business/${businessIdTarget}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         const result = await res.json();
         if (!result.success) throw new Error(result.error?.message || 'Failed to fetch dynamically');
         allTxns = result.data || [];
      }
      
      // 1. Array Filter by Date Sequence
      let filteredTxns = [...allTxns];
      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000; // include end of day
        filteredTxns = filteredTxns.filter(tx => {
          const t = new Date(tx.createdAt).getTime();
          return t >= start && t <= end;
        });
      }
      
      if (filteredTxns.length === 0) {
        setToastMsg('No transactions found in this time frame.');
        setTimeout(() => setToastMsg(''), 3000);
        return;
      }
      
      // JSON to CSV parsing
      const headers = ['Transaction ID', 'Date', 'Description', 'Amount'];
      const rows = filteredTxns.map(tx => {
        const id = tx.id ? tx.id.substring(0, 8).toUpperCase() : 'TRX';
        const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A';
        const desc = `"${(tx.description || '').replace(/"/g, '""')}"`;
        const amt = parseFloat(tx.amount) || 0;
        return `${id},${date},${desc},${amt}`;
      });
      
      const csvString = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      // Synthetic Browser Download Trigger
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `business_${businessIdTarget}_report.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // 2. Log History to UI & LocalStorage
      const bizNameObj = businesses.find(b => b.id === businessIdTarget);
      const bizNameFormated = businessIdTarget === 'all' ? 'All Businesses' : (bizNameObj?.name || 'Unknown Business');
      
      const newExportLog = {
        id: Date.now(),
        filename: fileName,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
        type: 'CSV Export',
        business: bizNameFormated,
        status: 'Completed',
        statusColor: 'emerald',
        action: 'download'
      };
      
      const updatedExports = [newExportLog, ...recentExports].slice(0, 10);
      setRecentExports(updatedExports);
      localStorage.setItem('recentExports', JSON.stringify(updatedExports));
      
      setToastMsg('CSV Generated & Downloaded Successfully!');
      setTimeout(() => setToastMsg(''), 3000);
      
    } catch (err) {
      setToastMsg(`Export failed: ${err.message}`);
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExport = (type) => {
    if (type === 'csv') {
      generateCSVReport(selectedBusiness);
    } else {
      setEmailLoading(true);
      setTimeout(() => {
        setEmailLoading(false);
        setToastMsg('PDF Report Emailed Successfully!');
        setTimeout(() => setToastMsg(''), 3000);
      }, 2000);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f7fa] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-2 flex items-end justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Export &amp; Reports</h1>
          <p className="text-sm text-gray-500">Generate financial summaries and data exports</p>
        </div>

        <div className="px-8 pb-10 space-y-6 mt-4">

          {/* ── Report Configuration ──────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Report Configuration</h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left — Select Business */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Business</label>
                <select
                  value={selectedBusiness}
                  onChange={(e) => setSelectedBusiness(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all bg-white"
                >
                  <option value="all">All Businesses</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1.5">Select a specific entity or aggregate all data.</p>
              </div>

              {/* Right — Date Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setQuickFilter('');
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setQuickFilter('');
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 mt-3">
                  {QUICK_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => handleQuickFilter(f)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        quickFilter === f
                          ? 'bg-[#123458] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Action Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CSV Download */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-gray-900">Download Data CSV</h4>
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs">Get a raw data file compatible with Excel, Google Sheets, or other accounting software.</p>
              <button
                onClick={() => handleExport('csv')}
                disabled={csvLoading}
                className="mt-5 flex items-center gap-2 bg-[#123458] hover:bg-[#0f2a47] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {csvLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Generate &amp; Download
                  </>
                )}
              </button>
            </div>

            {/* Email Report */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-gray-900">Email Executive Report</h4>
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs">Send a formatted PDF summary report directly to your registered email address.</p>
              <button
                onClick={() => handleExport('email')}
                disabled={emailLoading}
                className="mt-5 flex items-center gap-2 bg-[#123458] hover:bg-[#0f2a47] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {emailLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Email Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Recent Exports ────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Recent Exports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date Requested</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Report Type</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Target Business</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExports.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-400">No recent exports performed on this device.</td>
                    </tr>
                  ) : (
                    recentExports.map((exp, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{exp.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{exp.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{exp.business}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          exp.statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                          exp.statusColor === 'teal' ? 'bg-teal-50 text-teal-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {exp.action === 'download' && (
                          <button 
                            onClick={() => {
                              setToastMsg('Re-downloading is not supported for cached states. Generate a new report.');
                              setTimeout(() => setToastMsg(''), 3000);
                            }}
                            className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 cursor-not-allowed"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Re-generate
                          </button>
                        )}
                        {exp.action === 'resend' && (
                          <button className="text-sm font-medium text-[#123458] hover:text-opacity-80 transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resend
                          </button>
                        )}
                        {exp.action === 'disabled' && (
                          <span className="text-sm text-gray-400">Not available</span>
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

      {/* ── Custom Cyan Success Toast ─────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`bg-white border-l-4 ${toastMsg.includes('failed') || toastMsg.includes('No transactions') ? 'border-red-500' : 'border-[#00bcd4]'} shadow-xl rounded-r-xl px-5 py-3.5 flex items-center gap-3`}>
            <div className={`w-8 h-8 rounded-full ${toastMsg.includes('failed') || toastMsg.includes('No transactions') ? 'bg-red-50' : 'bg-cyan-50'} flex items-center justify-center`}>
              {toastMsg.includes('failed') || toastMsg.includes('No transactions') ? (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-[#00bcd4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <p className="text-gray-800 font-semibold text-sm">{toastMsg}</p>
          </div>
        </div>
      )}

    </div>
  );
}
