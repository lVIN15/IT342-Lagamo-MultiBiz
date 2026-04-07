/**
 * CSVExportStrategy.js
 * 
 * Strategy Pattern — Concrete Strategy for CSV export.
 * 
 * Encapsulates ALL CSV-specific logic: fetching transaction data,
 * transforming it into a CSV string, creating a Blob, and triggering
 * a browser download. Each strategy owns its own data needs.
 */

import { fetchTransactions } from './fetchTransactions';

export class CSVExportStrategy {

  /**
   * Executes the CSV export strategy.
   *
   * @param {Object} context
   * @param {string}   context.businessId   - 'all' or a specific UUID
   * @param {string}   context.businessName - Human-readable name for the export log
   * @param {Object[]} context.businesses   - Full list of owner's businesses
   * @param {string}   context.startDate    - ISO date string for range start
   * @param {string}   context.endDate      - ISO date string for range end
   *
   * @returns {Promise<{ success: boolean, fileName?: string, error?: string }>}
   */
  async execute({ businessId, businessName, businesses, startDate, endDate }) {
    // ── Step 1: Fetch & filter transaction data ────────────────────────
    const transactions = await fetchTransactions({
      businessId,
      businesses,
      startDate,
      endDate,
    });

    // ── Guard: empty dataset ───────────────────────────────────────────
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions found in this time frame.' };
    }

    // ── Step 2: Transform JSON → CSV string ────────────────────────────
    const headers = ['Transaction ID', 'Date', 'Description', 'Amount'];
    const rows = transactions.map(tx => {
      const id   = tx.id ? tx.id.substring(0, 8).toUpperCase() : 'TRX';
      const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A';
      const desc = `"${(tx.description || '').replace(/"/g, '""')}"`;
      const amt  = parseFloat(tx.amount) || 0;
      return `${id},${date},${desc},${amt}`;
    });

    const csvString = [headers.join(','), ...rows].join('\n');

    // ── Step 3: Create Blob and trigger browser download ───────────────
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);

    const fileName = `business_${businessId}_report.csv`;
    const a = document.createElement('a');
    a.href     = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  }
}
