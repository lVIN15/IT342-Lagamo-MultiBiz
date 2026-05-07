import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../common/components/Sidebar';

function DeleteConfirmModal({ isOpen, onClose, onConfirm, businessName }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Delete Business</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Are you sure you want to permanently delete <strong className="text-gray-700">{businessName}</strong>?
          This will also remove all its transactions, staff assignments, and associated staff accounts. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminBusinesses() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingRef = useRef(null);

  const fetchBusinesses = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token');
    try {
      if (!silent) setLoading(true);
      const res = await fetch('http://localhost:8080/api/v1/admin/businesses', {
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
        setBusinesses(result.data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch businesses', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate]);

  // Initial fetch
  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  // Live polling every 5 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchBusinesses(true);
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchBusinesses]);

  const filteredBusinesses = useMemo(() => {
    if (!search.trim()) return businesses;
    const q = search.toLowerCase();
    return businesses.filter(b =>
      b.name.toLowerCase().includes(q)
      || b.category.toLowerCase().includes(q)
      || b.ownerName.toLowerCase().includes(q)
    );
  }, [businesses, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/businesses/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBusinesses(prev => prev.filter(b => b.id !== deleteTarget.id));
      }
    } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const formatDate = (raw) => {
    try {
      return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return raw; }
  };

  return (
    <div className="flex h-screen bg-[#f5f7fa] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header with Live Polling Indicator */}
        <div className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-[#123458]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h1 className="text-xl font-bold text-[#123458]">Business Moderation</h1>
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

        {/* Search */}
        <div className="px-8 mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">{filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''} found</p>
          <div className="relative w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, category, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-8 mt-5 pb-10">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <svg className="w-8 h-8 animate-spin text-[#123458]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <p className="mt-3 text-sm text-gray-500">Loading businesses...</p>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No businesses found.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Business Name</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Category</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Owner</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Staff</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Transactions</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Created</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{b.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                          {b.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-gray-800 font-medium">{b.ownerName}</p>
                          <p className="text-xs text-gray-400">{b.ownerEmail}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{b.staffCount}</td>
                      <td className="px-5 py-3.5 text-gray-500">{b.transactionCount}</td>
                      <td className="px-5 py-3.5 text-gray-400">{formatDate(b.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        businessName={deleteTarget?.name || ''}
      />
    </div>
  );
}
