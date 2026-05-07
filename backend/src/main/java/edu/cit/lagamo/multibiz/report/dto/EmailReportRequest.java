package edu.cit.lagamo.multibiz.report.dto;

/**
 * DTO for the Email Executive Report request.
 */
public class EmailReportRequest {

    private String businessId;
    private String startDate;
    private String endDate;

    public EmailReportRequest() {}

    public EmailReportRequest(String businessId, String startDate, String endDate) {
        this.businessId = businessId;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public String getBusinessId() { return businessId; }
    public void setBusinessId(String businessId) { this.businessId = businessId; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}
