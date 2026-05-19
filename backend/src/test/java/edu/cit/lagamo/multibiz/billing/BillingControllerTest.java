package edu.cit.lagamo.multibiz.billing;

import edu.cit.lagamo.multibiz.common.security.JwtService;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BillingControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String ownerToken;
    private User ownerUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        ownerUser = new User();
        ownerUser.setFirstname("Billing");
        ownerUser.setLastname("Owner");
        ownerUser.setEmail("billing@test.com");
        ownerUser.setPasswordHash(passwordEncoder.encode("Pass123!"));
        ownerUser.setRole("OWNER");
        ownerUser.setSubscriptionStatus("BASIC");
        ownerUser = userRepository.save(ownerUser);

        ownerToken = "Bearer " + jwtService.generateAccessToken(ownerUser);
    }

    @Test
    @DisplayName("TC-BILL-01: Confirm upgrade sets subscription to PRO")
    void confirmUpgrade_validUser_upgradesSubscription() throws Exception {
        mockMvc.perform(post("/api/v1/billing/confirm")
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subscriptionStatus").value("PRO"));
    }

    @Test
    @DisplayName("TC-BILL-02: Confirm upgrade with deleted user returns 403")
    void confirmUpgrade_userNotFound_returnsForbidden() throws Exception {
        // Create a token for a user, then delete the user
        User tempUser = new User();
        tempUser.setFirstname("Temp");
        tempUser.setLastname("User");
        tempUser.setEmail("temp@test.com");
        tempUser.setPasswordHash(passwordEncoder.encode("Pass123!"));
        tempUser.setRole("OWNER");
        tempUser = userRepository.save(tempUser);

        String tempToken = "Bearer " + jwtService.generateAccessToken(tempUser);
        userRepository.delete(tempUser);

        mockMvc.perform(post("/api/v1/billing/confirm")
                .header("Authorization", tempToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-BILL-03: Billing endpoints require authentication")
    void billing_noToken_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/billing/confirm"))
                .andExpect(status().isForbidden());
    }
}
