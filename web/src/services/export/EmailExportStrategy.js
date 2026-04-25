/**
 * EmailExportStrategy.js
 * 
 * Strategy Pattern — Concrete Strategy for Email report export.
 * 
 * Calls the backend POST /api/v1/reports/email endpoint to generate
 * a CSV transaction report and email it to the authenticated user's
 * registered email address.
 */

const API_BASE = 'http://localhost:8080';

export class EmailExportStrategy {

  /**
   * Executes the Email export strategy.
   *
   * @param {Object} context
   * @param {string} context.businessId   - 'all' or a specific UUID
   * @param {string} context.businessName - Human-readable name for the export log
   * @param {string} context.startDate    - ISO date string (YYYY-MM-DD)
   * @param {string} context.endDate      - ISO date string (YYYY-MM-DD)
   *
   * @returns {Promise<{ success: boolean, fileName?: string, error?: string }>}
   */
  async execute({ businessId, businessName, startDate, endDate }) {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Authentication required.' };
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/reports/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId, startDate, endDate }),
      });

      const result = await res.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error?.message || 'Failed to send email report.',
        };
      }

      return {
        success: true,
        fileName: result.data?.fileName || 'email_report',
      };
    } catch (err) {
      return {
        success: false,
        error: 'Network error: ' + err.message,
      };
    }
  }
}
