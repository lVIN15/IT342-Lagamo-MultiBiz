package edu.cit.lagamo.multibiz.report;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.transaction.entity.Transaction;
import edu.cit.lagamo.multibiz.user.entity.User;
import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.transaction.TransactionRepository;
import edu.cit.lagamo.multibiz.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * ReportService — handles generation of CSV transaction reports
 * and delegates email delivery to EmailService.
 */
@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    private final TransactionRepository transactionRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ReportService(TransactionRepository transactionRepository,
                         BusinessRepository businessRepository,
                         UserRepository userRepository,
                         EmailService emailService) {
        this.transactionRepository = transactionRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> generateAndEmailReport(
            String businessId, String startDate, String endDate, String userEmail) {

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.fail("UNAUTHORIZED", "User not found.");
        }

        LocalDateTime start;
        LocalDateTime end;
        try {
            start = LocalDate.parse(startDate).atStartOfDay();
            end = LocalDate.parse(endDate).atTime(LocalTime.MAX);
        } catch (Exception e) {
            return ApiResponse.fail("VALID-001", "Invalid date format. Use YYYY-MM-DD.");
        }

        List<Transaction> transactions = new ArrayList<>();

        if ("all".equalsIgnoreCase(businessId)) {
            List<Business> ownedBusinesses = businessRepository.findByOwnerId(user.getId());
            for (Business biz : ownedBusinesses) {
                transactions.addAll(
                    transactionRepository.findByBusinessIdAndCreatedAtBetween(biz.getId(), start, end)
                );
            }
        } else {
            try {
                UUID bizUuid = UUID.fromString(businessId);
                Business business = businessRepository.findById(bizUuid).orElse(null);
                if (business == null) {
                    return ApiResponse.fail("NOT_FOUND", "Business not found.");
                }
                if (!business.getOwner().getId().equals(user.getId())) {
                    return ApiResponse.fail("FORBIDDEN", "You are not authorized for this business.");
                }
                transactions = transactionRepository.findByBusinessIdAndCreatedAtBetween(bizUuid, start, end);
            } catch (IllegalArgumentException e) {
                return ApiResponse.fail("VALID-001", "Invalid business ID format.");
            }
        }

        if (transactions.isEmpty()) {
            return ApiResponse.fail("NOT_FOUND", "No transactions found for the selected filters.");
        }

        String csvContent = buildCsvContent(transactions);

        String filename = "MultiBiz_Report_" + startDate + "_to_" + endDate + ".csv";
        String subject = "MultiBiz — Your Transaction Report (" + startDate + " to " + endDate + ")";
        String body = "Hello " + user.getFirstname() + ",\n\n"
                + "Please find your requested transaction report attached as a CSV file.\n\n"
                + "Report Details:\n"
                + "  • Date Range: " + startDate + " to " + endDate + "\n"
                + "  • Transactions Included: " + transactions.size() + "\n\n"
                + "You can open this file with Excel, Google Sheets, or any CSV-compatible application.\n\n"
                + "Best regards,\n"
                + "The MultiBiz System";

        emailService.sendEmailWithCsvAttachment(user.getEmail(), subject, body, csvContent, filename);

        logger.info("CSV report emailed to {} with {} transactions", user.getEmail(), transactions.size());

        Map<String, Object> data = new HashMap<>();
        data.put("sentTo", user.getEmail());
        data.put("transactionCount", transactions.size());
        data.put("fileName", filename);

        return ApiResponse.ok(data);
    }

    private String buildCsvContent(List<Transaction> transactions) {
        StringBuilder sb = new StringBuilder();
        sb.append("Transaction ID,Business Name,Date,Description,Amount,Status\n");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (Transaction tx : transactions) {
            String id = tx.getId().toString().substring(0, 8).toUpperCase();
            String bizName = escapeCSV(tx.getBusiness().getName());
            String date = tx.getCreatedAt() != null ? tx.getCreatedAt().format(fmt) : "N/A";
            String desc = escapeCSV(tx.getDescription() != null ? tx.getDescription() : "");
            String amount = tx.getAmount() != null ? tx.getAmount().toPlainString() : "0.00";
            String status = tx.getStatus() != null ? tx.getStatus() : "N/A";

            sb.append(id).append(",")
              .append(bizName).append(",")
              .append(date).append(",")
              .append(desc).append(",")
              .append(amount).append(",")
              .append(status).append("\n");
        }

        return sb.toString();
    }

    private String escapeCSV(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
