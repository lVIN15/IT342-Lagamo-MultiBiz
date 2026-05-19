package edu.cit.lagamo.multibiz.transaction;

import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.business.BusinessStaffRepository;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.common.security.JwtService;
import edu.cit.lagamo.multibiz.transaction.entity.Transaction;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TransactionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private BusinessRepository businessRepository;
    @Autowired private BusinessStaffRepository businessStaffRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String ownerToken;
    private User ownerUser;
    private Business testBusiness;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        businessStaffRepository.deleteAll();
        businessRepository.deleteAll();
        userRepository.deleteAll();

        ownerUser = new User();
        ownerUser.setFirstname("Owner");
        ownerUser.setLastname("Tx");
        ownerUser.setEmail("ownertx@test.com");
        ownerUser.setPasswordHash(passwordEncoder.encode("Pass123!"));
        ownerUser.setRole("OWNER");
        ownerUser = userRepository.save(ownerUser);

        testBusiness = new Business();
        testBusiness.setOwner(ownerUser);
        testBusiness.setName("Tx Business");
        testBusiness.setCategory("Services");
        testBusiness.setDescription("For transaction tests");
        testBusiness = businessRepository.save(testBusiness);

        ownerToken = "Bearer " + jwtService.generateAccessToken(ownerUser);
    }

    @Test
    @DisplayName("TC-TX-01: Log transaction with valid data returns 201")
    void logTransaction_validData_returnsCreated() throws Exception {
        String json = String.format("""
            {
                "businessId": "%s",
                "amount": 500.00,
                "description": "Daily sales"
            }
            """, testBusiness.getId());

        mockMvc.perform(post("/api/v1/transactions")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.transactionId").exists());
    }

    @Test
    @DisplayName("TC-TX-02: Get transactions by business returns list")
    void getTransactions_validBusiness_returnsList() throws Exception {
        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("250.00"));
        tx.setDescription("Test income");
        tx.setStatus("completed");
        transactionRepository.save(tx);

        mockMvc.perform(get("/api/v1/transactions/business/" + testBusiness.getId())
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].amount").value(250.00));
    }

    @Test
    @DisplayName("TC-TX-03: Delete transaction as owner returns 200")
    void deleteTransaction_asOwner_returnsOk() throws Exception {
        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("100.00"));
        tx.setDescription("To delete");
        tx.setStatus("pending_receipt");
        tx = transactionRepository.save(tx);

        mockMvc.perform(delete("/api/v1/transactions/" + tx.getId())
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-TX-04: Update transaction as owner returns 200")
    void updateTransaction_asOwner_returnsOk() throws Exception {
        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("300.00"));
        tx.setDescription("Original desc");
        tx.setStatus("pending_receipt");
        tx = transactionRepository.save(tx);

        String json = String.format("""
            {
                "businessId": "%s",
                "amount": 999.99,
                "description": "Updated desc"
            }
            """, testBusiness.getId());

        mockMvc.perform(put("/api/v1/transactions/" + tx.getId())
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.transactionId").exists());
    }

    @Test
    @DisplayName("TC-TX-05: Update transaction as non-owner returns 403")
    void updateTransaction_notOwner_returnsForbidden() throws Exception {
        // Create a different OWNER (not staff) who doesn't own the business
        User otherOwner = new User();
        otherOwner.setFirstname("Other");
        otherOwner.setLastname("OwnerEdit");
        otherOwner.setEmail("otheredit@test.com");
        otherOwner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        otherOwner.setRole("OWNER");
        otherOwner = userRepository.save(otherOwner);

        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("200.00"));
        tx.setDescription("Owner logged");
        tx.setStatus("pending_receipt");
        tx = transactionRepository.save(tx);

        String otherToken = "Bearer " + jwtService.generateAccessToken(otherOwner);

        String json = String.format("""
            {
                "businessId": "%s",
                "amount": 1.00,
                "description": "Hacked"
            }
            """, testBusiness.getId());

        mockMvc.perform(put("/api/v1/transactions/" + tx.getId())
                .header("Authorization", otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-TX-06: Log transaction for unauthorized business returns 403")
    void logTransaction_unauthorizedBusiness_returnsForbidden() throws Exception {
        // Create another owner with a business
        User otherOwner = new User();
        otherOwner.setFirstname("Other");
        otherOwner.setLastname("Owner");
        otherOwner.setEmail("othertx@test.com");
        otherOwner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        otherOwner.setRole("OWNER");
        otherOwner = userRepository.save(otherOwner);

        Business otherBiz = new Business();
        otherBiz.setOwner(otherOwner);
        otherBiz.setName("Other Biz");
        otherBiz.setCategory("Other");
        otherBiz.setDescription("Not mine");
        otherBiz = businessRepository.save(otherBiz);

        // Try to log a transaction for a business I don't own
        String json = String.format("""
            {
                "businessId": "%s",
                "amount": 100.00,
                "description": "Unauthorized"
            }
            """, otherBiz.getId());

        mockMvc.perform(post("/api/v1/transactions")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("TC-TX-07: Upload receipt for transaction returns 200")
    void uploadReceipt_validData_returnsOk() throws Exception {
        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("400.00"));
        tx.setDescription("Receipt test");
        tx.setStatus("pending_receipt");
        tx = transactionRepository.save(tx);

        MockMultipartFile file = new MockMultipartFile(
                "file", "receipt.jpg", "image/jpeg", "fake-image-bytes".getBytes());

        mockMvc.perform(multipart("/api/v1/transactions/" + tx.getId() + "/upload")
                .file(file)
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.receiptUrl").exists())
                .andExpect(jsonPath("$.data.status").value("completed"));
    }

    @Test
    @DisplayName("TC-TX-08: Delete transaction as non-owner returns 403")
    void deleteTransaction_notOwner_returnsForbidden() throws Exception {
        // Create a different OWNER who doesn't own the business
        User otherOwner = new User();
        otherOwner.setFirstname("Other");
        otherOwner.setLastname("OwnerDel");
        otherOwner.setEmail("otherdel@test.com");
        otherOwner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        otherOwner.setRole("OWNER");
        otherOwner = userRepository.save(otherOwner);

        Transaction tx = new Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new BigDecimal("50.00"));
        tx.setDescription("Cannot delete");
        tx.setStatus("pending_receipt");
        tx = transactionRepository.save(tx);

        String otherToken = "Bearer " + jwtService.generateAccessToken(otherOwner);

        mockMvc.perform(delete("/api/v1/transactions/" + tx.getId())
                .header("Authorization", otherToken))
                .andExpect(status().isForbidden());
    }
}
