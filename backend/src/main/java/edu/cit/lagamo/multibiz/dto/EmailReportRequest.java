package edu.cit.lagamo.multibiz.dto;

/**
 * DTO for the Email Executive Report request.
 *
 * Carries the filters the frontend selected on the
 * Export & Reports page so the backend can scope the CSV data.
 */
public class EmailReportRequest {

    private String businessId;   // "all" or a specific UUID string
    private String startDate;    // ISO date string (YYYY-MM-DD)
    private String endDate;      // ISO date string (YYYY-MM-DD)

    // ── Constructors ─────────────────────────────────────────────────────────

    public EmailReportRequest() {}

    public EmailReportRequest(String businessId, String startDate, String endDate) {
        this.businessId = businessId;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public String getBusinessId() { return businessId; }
    public void setBusinessId(String businessId) { this.businessId = businessId; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}
