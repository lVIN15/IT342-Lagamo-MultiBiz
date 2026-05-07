package edu.cit.lagamo.multibiz.transaction;

import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.common.security.JwtService;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TransactionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private BusinessRepository businessRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String ownerToken;
    private User ownerUser;
    private Business testBusiness;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
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
        // Log a transaction first
        edu.cit.lagamo.multibiz.transaction.entity.Transaction tx = new edu.cit.lagamo.multibiz.transaction.entity.Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new java.math.BigDecimal("250.00"));
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
        edu.cit.lagamo.multibiz.transaction.entity.Transaction tx = new edu.cit.lagamo.multibiz.transaction.entity.Transaction();
        tx.setBusiness(testBusiness);
        tx.setStaff(ownerUser);
        tx.setAmount(new java.math.BigDecimal("100.00"));
        tx.setDescription("To delete");
        tx.setStatus("pending_receipt");
        tx = transactionRepository.save(tx);

        mockMvc.perform(delete("/api/v1/transactions/" + tx.getId())
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
