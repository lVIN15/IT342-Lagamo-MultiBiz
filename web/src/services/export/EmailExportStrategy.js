/**
 * EmailExportStrategy.js
 * 
 * Strategy Pattern — Concrete Strategy for Email report export.
 * 
 * Encapsulates the email-report behavior. Currently simulates
 * sending with a 2-second delay (matching the original mock in
 * ExportReports.jsx). This strategy does NOT need to fetch
 * transaction data — it is fully self-contained.
 * 
 * In the future, this can be replaced with a real backend API
 * call without changing the component.
 */

export class EmailExportStrategy {

  /**
   * Executes the Email export strategy.
   *
   * @param {Object} context
   * @param {string} context.businessId   - 'all' or a specific UUID
   * @param {string} context.businessName - Human-readable name for the export log
   *
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async execute({ businessId, businessName }) {
    // ── Simulate email sending (2-second delay, matching original) ──────
    // TODO: Replace with real backend call:
    //   POST /api/v1/reports/email  { businessId, startDate, endDate }
    await new Promise(resolve => setTimeout(resolve, 2000));

    return { success: true };
  }
}
