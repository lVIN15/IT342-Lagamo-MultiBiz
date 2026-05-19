package edu.cit.lagamo.multibiz.report;

import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.transaction.TransactionRepository;
import edu.cit.lagamo.multibiz.transaction.entity.Transaction;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class ReportServiceTest {

    @Autowired private ReportService reportService;
    @Autowired private UserRepository userRepository;
    @Autowired private BusinessRepository businessRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @MockitoBean private EmailService emailService;

    private User ownerUser;
    private Business testBusiness;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        businessRepository.deleteAll();
        userRepository.deleteAll();

        ownerUser = new User();
        ownerUser.setFirstname("Report");
        ownerUser.setLastname("Owner");
        ownerUser.setEmail("report@test.com");
        ownerUser.setPasswordHash(passwordEncoder.encode("Pass123!"));
        ownerUser.setRole("OWNER");
        ownerUser = userRepository.save(ownerUser);

        testBusiness = new Business();
        testBusiness.setOwner(ownerUser);
        testBusiness.setName("Report Biz");
        testBusiness.setCategory("Services");
        testBusiness.setDescription("For report tests");
        testBusiness = businessRepository.save(testBusiness);
    }

    @Test
    @DisplayName("TC-RPT-01: Generate report for single business succeeds")
    void generateReport_singleBusiness_succeeds() {
        // Seed a transaction within the date range
        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("500.00"));
        tx.setDescription("Test sale");
        tx.setStatus("completed");
        transactionRepository.save(tx);

        ApiResponse<Map<String, Object>> result = reportService.generateAndEmailReport(
                testBusiness.getId().toString(), "2020-01-01", "2030-12-31", "report@test.com");

        assertTrue(result.isSuccess());
        assertEquals(1, result.getData().get("transactionCount"));
        verify(emailService).sendEmailWithCsvAttachment(
                eq("report@test.com"), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("TC-RPT-02: Generate report for all businesses succeeds")
    void generateReport_allBusinesses_succeeds() {
        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("750.00"));
        tx.setDescription("All biz sale");
        tx.setStatus("completed");
        transactionRepository.save(tx);

        ApiResponse<Map<String, Object>> result = reportService.generateAndEmailReport(
                "all", "2020-01-01", "2030-12-31", "report@test.com");

        assertTrue(result.isSuccess());
        assertEquals(1, result.getData().get("transactionCount"));
    }

    @Test
    @DisplayName("TC-RPT-03: Generate report for unknown user returns UNAUTHORIZED")
    void generateReport_userNotFound_returnsUnauthorized() {
        ApiResponse<Map<String, Object>> result = reportService.generateAndEmailReport(
                testBusiness.getId().toString(), "2020-01-01", "2030-12-31", "nobody@test.com");

        assertFalse(result.isSuccess());
        assertEquals("UNAUTHORIZED", result.getError().getCode());
    }

    @Test
    @DisplayName("TC-RPT-04: Generate report for non-existent business returns NOT_FOUND")
    void generateReport_businessNotFound_returnsNotFound() {
        ApiResponse<Map<String, Object>> result = reportService.generateAndEmailReport(
                java.util.UUID.randomUUID().toString(), "2020-01-01", "2030-12-31", "report@test.com");

        assertFalse(result.isSuccess());
        assertEquals("NOT_FOUND", result.getError().getCode());
    }

    @Test
    @DisplayName("TC-RPT-05: Generate report for business not owned returns FORBIDDEN")
    void generateReport_notOwner_returnsForbidden() {
        // Create another owner with a business
        User otherOwner = new User();
        otherOwner.setFirstname("Other");
        otherOwner.setLastname("Rpt");
        otherOwner.setEmail("otherrpt@test.com");
        otherOwner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        otherOwner.setRole("OWNER");
        otherOwner = userRepository.save(otherOwner);

        Business otherBiz = new Business();
        otherBiz.setOwner(otherOwner);
        otherBiz.setName("Other Biz");
        otherBiz.setCategory("Other");
        otherBiz.setDescription("Not mine");
        otherBiz = businessRepository.save(otherBiz);

        ApiResponse<Map<String, Object>> result = reportService.generateAndEmailReport(
                otherBiz.getId().toString(), "2020-01-01", "2030-12-31", "report@test.com");

        assertFalse(result.isSuccess());
        assertEquals("FORBIDDEN", result.getError().getCode());
    }

    @Test
    @DisplayName("TC-RPT-06: Generate report with no transactions returns NOT_FOUND")
    void generateReport_noTransactions_returnsNotFound() {
        ApiResponse<Map<String, Object>> result = reportService.generateAndEmailReport(
                testBusiness.getId().toString(), "2020-01-01", "2030-12-31", "report@test.com");

        assertFalse(result.isSuccess());
        assertEquals("NOT_FOUND", result.getError().getCode());
    }

    @Test
    @DisplayName("TC-RPT-07: Generate report with invalid date returns VALID-001")
    void generateReport_invalidDate_returnsValidationError() {
        ApiResponse<Map<String, Object>> result = reportService.generateAndEmailReport(
                testBusiness.getId().toString(), "not-a-date", "2030-12-31", "report@test.com");

        assertFalse(result.isSuccess());
        assertEquals("VALID-001", result.getError().getCode());
    }
}
