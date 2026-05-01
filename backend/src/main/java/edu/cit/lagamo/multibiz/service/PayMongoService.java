package edu.cit.lagamo.multibiz.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Service for communicating with the PayMongo Checkout API.
 * Uses Test/Sandbox keys loaded from the .env file.
 */
@Service
public class PayMongoService {

    private static final String PAYMONGO_CHECKOUT_URL = "https://api.paymongo.com/v1/checkout_sessions";

    @Value("${paymongo.secret-key}")
    private String secretKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Creates a PayMongo Checkout Session for a Pro subscription upgrade.
     *
     * @param userId      The UUID of the user (stored as reference_number so webhook knows who paid)
     * @param userEmail   The email of the user (pre-filled on the checkout page)
     * @param successUrl  The URL to redirect to after a successful payment
     * @param cancelUrl   The URL to redirect to if the user cancels payment
     * @return            The checkout URL where the user should be redirected
     */
    public String createCheckoutSession(String userId, String userEmail, String successUrl, String cancelUrl) {

        // Build the request body per PayMongo API spec
        Map<String, Object> lineItem = new LinkedHashMap<>();
        lineItem.put("currency", "PHP");
        lineItem.put("amount", 50000); // ₱500.00 in centavos
        lineItem.put("name", "Multi-Biz Pro Subscription");
        lineItem.put("quantity", 1);

        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("line_items", List.of(lineItem));
        attributes.put("payment_method_types", List.of("gcash", "card", "paymaya"));
        attributes.put("reference_number", userId);
        attributes.put("send_email_receipt", true);
        attributes.put("description", "Upgrade to Multi-Biz Pro — Unlimited Businesses");
        attributes.put("success_url", successUrl);
        attributes.put("cancel_url", cancelUrl);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("attributes", attributes);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("data", data);

        // Set up Basic Auth with the Secret Key
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        String auth = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + auth);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(PAYMONGO_CHECKOUT_URL, request, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("data").path("attributes").path("checkout_url").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create PayMongo checkout session: " + e.getMessage(), e);
        }
    }
}
