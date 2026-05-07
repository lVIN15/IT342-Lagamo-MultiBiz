package edu.cit.lagamo.multibiz.billing;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.common.security.JwtService;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final PayMongoService payMongoService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public BillingController(PayMongoService payMongoService, JwtService jwtService, UserRepository userRepository) {
        this.payMongoService = payMongoService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/v1/billing/checkout
     * Creates a PayMongo Checkout Session and returns the checkout URL.
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<?>> createCheckout(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {

        String token = authHeader.substring(7);
        String userId = jwtService.parseToken(token).getSubject();

        String successUrl = body.getOrDefault("successUrl", "http://localhost:5173/billing?status=success");
        String cancelUrl = body.getOrDefault("cancelUrl", "http://localhost:5173/billing?status=cancelled");

        String checkoutUrl = payMongoService.createCheckoutSession(userId, null, successUrl, cancelUrl);

        Map<String, String> data = new LinkedHashMap<>();
        data.put("checkoutUrl", checkoutUrl);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /**
     * POST /api/v1/billing/confirm
     * Called by the frontend after a successful PayMongo checkout redirect.
     * Upgrades the currently authenticated user's subscription to PRO.
     * This ensures the correct user is upgraded (the one holding the JWT),
     * avoiding issues where PayMongo webhooks can't reach localhost.
     */
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<?>> confirmUpgrade(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String userId = jwtService.parseToken(token).getSubject();

        User user = userRepository.findById(UUID.fromString(userId))
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("USER_NOT_FOUND", "User not found"));
        }

        user.setSubscriptionStatus("PRO");
        userRepository.save(user);

        Map<String, String> data = new LinkedHashMap<>();
        data.put("subscriptionStatus", "PRO");

        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
