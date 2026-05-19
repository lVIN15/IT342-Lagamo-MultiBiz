package edu.cit.lagamo.multibiz.billing;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WebhookControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser = new User();
        testUser.setFirstname("Webhook");
        testUser.setLastname("User");
        testUser.setEmail("webhook@test.com");
        testUser.setPasswordHash(passwordEncoder.encode("Pass123!"));
        testUser.setRole("OWNER");
        testUser.setSubscriptionStatus("BASIC");
        testUser = userRepository.save(testUser);
    }

    @Test
    @DisplayName("TC-WH-01: Valid payment webhook upgrades user to PRO")
    void webhook_validPayment_upgradesUser() throws Exception {
        String payload = String.format("""
            {
                "data": {
                    "attributes": {
                        "type": "checkout_session.payment.paid",
                        "data": {
                            "attributes": {
                                "reference_number": "%s"
                            }
                        }
                    }
                }
            }
            """, testUser.getId());

        mockMvc.perform(post("/api/webhooks/paymongo")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string("upgraded"));
    }

    @Test
    @DisplayName("TC-WH-02: Non-payment event type is ignored")
    void webhook_nonPaymentEvent_isIgnored() throws Exception {
        String payload = """
            {
                "data": {
                    "attributes": {
                        "type": "checkout_session.created",
                        "data": {
                            "attributes": {
                                "reference_number": "some-id"
                            }
                        }
                    }
                }
            }
            """;

        mockMvc.perform(post("/api/webhooks/paymongo")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string("ignored"));
    }

    @Test
    @DisplayName("TC-WH-03: Missing reference_number returns 400")
    void webhook_missingReference_returnsBadRequest() throws Exception {
        String payload = """
            {
                "data": {
                    "attributes": {
                        "type": "checkout_session.payment.paid",
                        "data": {
                            "attributes": {
                            }
                        }
                    }
                }
            }
            """;

        mockMvc.perform(post("/api/webhooks/paymongo")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("missing reference_number"));
    }

    @Test
    @DisplayName("TC-WH-04: User not found in webhook returns 400")
    void webhook_userNotFound_returnsBadRequest() throws Exception {
        String payload = String.format("""
            {
                "data": {
                    "attributes": {
                        "type": "checkout_session.payment.paid",
                        "data": {
                            "attributes": {
                                "reference_number": "%s"
                            }
                        }
                    }
                }
            }
            """, java.util.UUID.randomUUID());

        mockMvc.perform(post("/api/webhooks/paymongo")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("user not found"));
    }

    @Test
    @DisplayName("TC-WH-05: Malformed JSON body returns 500")
    void webhook_malformedJson_returnsError() throws Exception {
        mockMvc.perform(post("/api/webhooks/paymongo")
                .contentType(MediaType.APPLICATION_JSON)
                .content("this is not json"))
                .andExpect(status().isInternalServerError());
    }
}
