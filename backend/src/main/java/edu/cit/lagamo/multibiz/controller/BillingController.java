package edu.cit.lagamo.multibiz.controller;

import edu.cit.lagamo.multibiz.dto.ApiResponse;
import edu.cit.lagamo.multibiz.service.JwtService;
import edu.cit.lagamo.multibiz.service.PayMongoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final PayMongoService payMongoService;
    private final JwtService jwtService;

    public BillingController(PayMongoService payMongoService, JwtService jwtService) {
        this.payMongoService = payMongoService;
        this.jwtService = jwtService;
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
}
