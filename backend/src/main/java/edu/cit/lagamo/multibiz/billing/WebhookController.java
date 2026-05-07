package edu.cit.lagamo.multibiz.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.lagamo.multibiz.user.entity.User;
import edu.cit.lagamo.multibiz.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

/**
 * Webhook endpoint for PayMongo.
 * This controller receives payment notifications from PayMongo
 * and upgrades the user's subscription to PRO.
 */
@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WebhookController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * POST /api/webhooks/paymongo
     * Called automatically by PayMongo when a checkout_session.payment.paid event fires.
     */
    @PostMapping("/paymongo")
    public ResponseEntity<String> handlePayMongoWebhook(@RequestBody String rawPayload) {

        try {
            JsonNode root = objectMapper.readTree(rawPayload);

            JsonNode eventData = root.path("data").path("attributes");
            String eventType = eventData.path("type").asText("");

            if (!"checkout_session.payment.paid".equals(eventType)) {
                return ResponseEntity.ok("ignored");
            }

            String referenceNumber = eventData
                    .path("data")
                    .path("attributes")
                    .path("reference_number")
                    .asText("");

            if (referenceNumber.isEmpty()) {
                return ResponseEntity.badRequest().body("missing reference_number");
            }

            UUID userId = UUID.fromString(referenceNumber);
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setSubscriptionStatus("PRO");
                userRepository.save(user);
                return ResponseEntity.ok("upgraded");
            } else {
                return ResponseEntity.badRequest().body("user not found");
            }

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("webhook processing error: " + e.getMessage());
        }
    }
}
