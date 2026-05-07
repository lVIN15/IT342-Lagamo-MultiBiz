package edu.cit.lagamo.multibiz.report;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.report.dto.EmailReportRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> emailReport(
            @RequestBody EmailReportRequest request,
            Authentication authentication) {

        String userEmail = authentication.getName();
        ApiResponse<Map<String, Object>> response = reportService.generateAndEmailReport(
                request.getBusinessId(), request.getStartDate(), request.getEndDate(), userEmail);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
