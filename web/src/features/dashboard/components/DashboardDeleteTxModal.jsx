import React, { useState } from 'react';

export default function DashboardDeleteTxModal({ isOpen, onClose, transaction, onSuccess }) {
  const [isRemoving, setIsRemoving] = useState(false);

  if (!isOpen || !transaction) return null;

  const confirmDelete = async () => {
    setIsRemoving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/v1/transactions/${transaction.rawId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete transaction. You might not have permission.');
      }
      
      if (onSuccess) onSuccess(transaction.rawId);
      onClose();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert(err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123458]/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Delete Income Log</h2>
          <button
            onClick={onClose}
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
            Are you sure you want to delete the transaction <strong className="text-gray-900">{transaction.id}</strong> for <strong className="text-gray-900">{transaction.business}</strong>? This action cannot be undone and will affect your revenue analytics.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors bg-transparent border-0"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={isRemoving}
            className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm transition-all flex items-center gap-2"
          >
            {isRemoving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isRemoving ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
