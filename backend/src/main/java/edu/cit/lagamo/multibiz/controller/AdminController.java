package edu.cit.lagamo.multibiz.controller;

import edu.cit.lagamo.multibiz.dto.ApiResponse;
import edu.cit.lagamo.multibiz.entity.Business;
import edu.cit.lagamo.multibiz.entity.User;
import edu.cit.lagamo.multibiz.repository.BusinessRepository;
import edu.cit.lagamo.multibiz.repository.TransactionRepository;
import edu.cit.lagamo.multibiz.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Platform Admin Controller.
 * All endpoints are restricted to users with the SUPER_ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final TransactionRepository transactionRepository;

    public AdminController(UserRepository userRepository,
                           BusinessRepository businessRepository,
                           TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.transactionRepository = transactionRepository;
    }

    // ── GET /api/v1/admin/stats ─────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalBusinesses", businessRepository.count());
        stats.put("proSubscribers", userRepository.countBySubscriptionStatus("PRO"));
        stats.put("totalTransactions", transactionRepository.count());
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    // ── GET /api/v1/admin/users ─────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (User u : users) {
            // Skip other SUPER_ADMIN accounts from being listed
            if ("SUPER_ADMIN".equals(u.getRole())) continue;

            Map<String, Object> userMap = new LinkedHashMap<>();
            userMap.put("id", u.getId().toString());
            userMap.put("firstname", u.getFirstname());
            userMap.put("lastname", u.getLastname());
            userMap.put("email", u.getEmail());
            userMap.put("role", u.getRole());
            userMap.put("subscriptionStatus", u.getSubscriptionStatus());
            userMap.put("isActive", u.isActive());
            userMap.put("createdAt", u.getCreatedAt().toString());
            result.add(userMap);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── PUT /api/v1/admin/users/{id}/status ─────────────────────────────────
    @Transactional
    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleUserStatus(@PathVariable UUID id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("NOT_FOUND", "User not found"));
        }

        User user = userOpt.get();

        // Prevent admins from banning other admins
        if ("SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("FORBIDDEN", "Cannot modify another admin"));
        }

        user.setActive(!user.isActive());
        userRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId().toString());
        result.put("isActive", user.isActive());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── PUT /api/v1/admin/users/{id}/subscription ───────────────────────────
    @Transactional
    @PutMapping("/users/{id}/subscription")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleSubscription(@PathVariable UUID id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("NOT_FOUND", "User not found"));
        }

        User user = userOpt.get();

        // Only Owners have subscription plans
        if (!"OWNER".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("INVALID_ROLE", "Subscription status only applies to Owners"));
        }

        String newStatus = "PRO".equals(user.getSubscriptionStatus()) ? "BASIC" : "PRO";
        user.setSubscriptionStatus(newStatus);
        userRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId().toString());
        result.put("subscriptionStatus", user.getSubscriptionStatus());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── GET /api/v1/admin/businesses ────────────────────────────────────────
    @GetMapping("/businesses")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllBusinesses() {
        List<Business> businesses = businessRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Business b : businesses) {
            Map<String, Object> bizMap = new LinkedHashMap<>();
            bizMap.put("id", b.getId().toString());
            bizMap.put("name", b.getName());
            bizMap.put("category", b.getCategory());
            bizMap.put("ownerName", b.getOwner().getFirstname() + " " + b.getOwner().getLastname());
            bizMap.put("ownerEmail", b.getOwner().getEmail());
            bizMap.put("staffCount", b.getBusinessStaff().size());
            bizMap.put("transactionCount", b.getTransactions().size());
            bizMap.put("createdAt", b.getCreatedAt().toString());
            result.add(bizMap);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── DELETE /api/v1/admin/businesses/{id} ────────────────────────────────
    @Transactional
    @DeleteMapping("/businesses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBusiness(@PathVariable UUID id) {
        Optional<Business> bizOpt = businessRepository.findById(id);
        if (bizOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("NOT_FOUND", "Business not found"));
        }

        Business business = bizOpt.get();

        // Collect staff User IDs BEFORE the cascading delete wipes out BusinessStaff records
        List<UUID> staffUserIds = business.getBusinessStaff().stream()
                .filter(bs -> "STAFF".equals(bs.getUser().getRole()))
                .map(bs -> bs.getUser().getId())
                .toList();

        // Delete the business (cascades to transactions + business_staff records)
        businessRepository.delete(business);

        // Clean up orphaned staff user accounts
        if (!staffUserIds.isEmpty()) {
            userRepository.deleteAllById(staffUserIds);
        }

        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
