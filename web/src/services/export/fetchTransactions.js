/**
 * fetchTransactions.js
 * 
 * Shared utility for the Strategy Pattern — extracts the common
 * data-fetching and date-filtering logic that was previously
 * hardcoded inside ExportReports.jsx.
 * 
 * Both CSVExportStrategy and EmailExportStrategy depend on this
 * to retrieve a clean, filtered array of transactions.
 */

const API_BASE = 'http://localhost:8080';

/**
 * Fetches transactions from the backend API for a single business
 * or all businesses, then filters by the given date range.
 *
 * @param {Object}   options
 * @param {string}   options.businessId  - UUID of the target business, or 'all'
 * @param {Object[]} options.businesses  - Full list of owner's businesses (needed when businessId === 'all')
 * @param {string}   options.startDate   - ISO date string (YYYY-MM-DD) for range start
 * @param {string}   options.endDate     - ISO date string (YYYY-MM-DD) for range end
 *
 * @returns {Promise<Object[]>} Filtered array of raw transaction objects from the API
 * @throws {Error} If authentication is missing or the API call fails
 */
export async function fetchTransactions({ businessId, businesses, startDate, endDate }) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required.');

  let allTxns = [];

  // ── Fetch: single business or aggregate all ──────────────────────────
  if (businessId === 'all') {
    const results = await Promise.allSettled(
      businesses.map(b =>
        fetch(`${API_BASE}/api/v1/transactions/business/${b.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json())
      )
    );

    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value?.success && res.value?.data) {
        allTxns.push(...res.value.data);
      }
    });
  } else {
    const res = await fetch(`${API_BASE}/api/v1/transactions/business/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch transactions.');
    }
    allTxns = result.data || [];
  }

  // ── Filter by date range ─────────────────────────────────────────────
  if (startDate && endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000; // include end of day
    allTxns = allTxns.filter(tx => {
      const t = new Date(tx.createdAt).getTime();
      return t >= start && t <= end;
    });
  }

  return allTxns;
}
