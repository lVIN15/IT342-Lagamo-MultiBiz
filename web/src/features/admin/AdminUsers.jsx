import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../common/components/Sidebar';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, confirmColor }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${confirmColor || 'bg-[#123458] hover:bg-[#0f2a47]'}`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingRef = useRef(null);

  const fetchUsers = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token');
    try {
      if (!silent) setLoading(true);
      const res = await fetch('http://localhost:8080/api/v1/admin/users', {
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
        setUsers(result.data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate]);

  // Initial fetch
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Live polling every 5 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchUsers(true);
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (activeTab === 'Owners') list = list.filter(u => u.role === 'OWNER');
    if (activeTab === 'Staff') list = list.filter(u => u.role === 'STAFF');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        `${u.firstname} ${u.lastname}`.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, activeTab, search]);

  const handleToggleStatus = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
      }
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  const handleToggleSubscription = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8080/api/v1/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStatus: result.data.subscriptionStatus } : u));
      }
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  const tabs = ['All', 'Owners', 'Staff'];

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h1 className="text-xl font-bold text-[#123458]">User Management</h1>
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

        {/* Toolbar: Tabs + Search */}
        <div className="px-8 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#123458] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
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
                <p className="mt-3 text-sm text-gray-500">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No users found.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Name</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Role</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Plan</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Joined</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{u.firstname} {u.lastname}</td>
                      <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'OWNER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {u.role === 'OWNER' ? 'Owner' : 'Staff'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.role === 'OWNER' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.subscriptionStatus === 'PRO' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {u.subscriptionStatus === 'PRO' ? 'Pro' : 'Basic'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.isActive ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Ban */}
                          <button
                            onClick={() => setConfirmAction({
                              type: 'status',
                              userId: u.id,
                              title: u.isActive ? 'Ban User' : 'Unban User',
                              message: u.isActive
                                ? `Are you sure you want to ban ${u.firstname} ${u.lastname}? They will no longer be able to log in.`
                                : `Are you sure you want to unban ${u.firstname} ${u.lastname}? They will regain access to their account.`,
                              confirmLabel: u.isActive ? 'Ban' : 'Unban',
                              confirmColor: u.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700',
                            })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.isActive
                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Ban' : 'Unban'}
                          </button>

                          {/* Toggle Pro (only for Owners) */}
                          {u.role === 'OWNER' && (
                            <button
                              onClick={() => setConfirmAction({
                                type: 'subscription',
                                userId: u.id,
                                title: u.subscriptionStatus === 'PRO' ? 'Revoke Pro' : 'Grant Pro',
                                message: u.subscriptionStatus === 'PRO'
                                  ? `Downgrade ${u.firstname} ${u.lastname} from Pro to Basic?`
                                  : `Upgrade ${u.firstname} ${u.lastname} to the Pro plan for free?`,
                                confirmLabel: u.subscriptionStatus === 'PRO' ? 'Revoke' : 'Grant Pro',
                                confirmColor: u.subscriptionStatus === 'PRO' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-amber-600 hover:bg-amber-700',
                              })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                u.subscriptionStatus === 'PRO'
                                  ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                  : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                              }`}
                            >
                              {u.subscriptionStatus === 'PRO' ? 'Revoke Pro' : 'Grant Pro'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'status') handleToggleStatus(confirmAction.userId);
          if (confirmAction?.type === 'subscription') handleToggleSubscription(confirmAction.userId);
        }}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmLabel={confirmAction?.confirmLabel}
        confirmColor={confirmAction?.confirmColor}
      />
    </div>
  );
}
