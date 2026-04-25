package edu.cit.lagamo.multibiz.controller;

import edu.cit.lagamo.multibiz.dto.ApiResponse;
import edu.cit.lagamo.multibiz.dto.EmailReportRequest;
import edu.cit.lagamo.multibiz.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ReportController — REST endpoint for the Export & Reports feature.
 *
 * Aligned with SDD Section 2.4:
 *   POST /reports/send-email  →  mapped here as POST /api/v1/reports/email
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Generates a CSV transaction report for the given filters
     * and emails it to the authenticated user's registered email.
     *
     * @param request  Contains businessId, startDate, endDate
     * @param authentication  Spring Security authentication (JWT principal)
     * @return ApiResponse with { sentTo, transactionCount, fileName }
     */
    @PostMapping("/email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> emailReport(
            @RequestBody EmailReportRequest request,
            Authentication authentication) {

        String userEmail = authentication.getName();

        ApiResponse<Map<String, Object>> response = reportService.generateAndEmailReport(
                request.getBusinessId(),
                request.getStartDate(),
                request.getEndDate(),
                userEmail
        );

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
