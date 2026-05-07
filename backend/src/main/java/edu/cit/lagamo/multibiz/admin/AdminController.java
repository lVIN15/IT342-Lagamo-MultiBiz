package edu.cit.lagamo.multibiz.admin;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.user.entity.User;
import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.transaction.TransactionRepository;
import edu.cit.lagamo.multibiz.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

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

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalBusinesses", businessRepository.count());
        stats.put("proSubscribers", userRepository.countBySubscriptionStatus("PRO"));
        stats.put("totalTransactions", transactionRepository.count());
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
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

    @Transactional
    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleUserStatus(@PathVariable UUID id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("NOT_FOUND", "User not found"));
        }
        User user = userOpt.get();
        if ("SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail("FORBIDDEN", "Cannot modify another admin"));
        }
        user.setActive(!user.isActive());
        userRepository.save(user);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId().toString());
        result.put("isActive", user.isActive());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Transactional
    @PutMapping("/users/{id}/subscription")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleSubscription(@PathVariable UUID id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("NOT_FOUND", "User not found"));
        }
        User user = userOpt.get();
        if (!"OWNER".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("INVALID_ROLE", "Subscription status only applies to Owners"));
        }
        String newStatus = "PRO".equals(user.getSubscriptionStatus()) ? "BASIC" : "PRO";
        user.setSubscriptionStatus(newStatus);
        userRepository.save(user);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId().toString());
        result.put("subscriptionStatus", user.getSubscriptionStatus());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

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

    @Transactional
    @DeleteMapping("/businesses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBusiness(@PathVariable UUID id) {
        Optional<Business> bizOpt = businessRepository.findById(id);
        if (bizOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("NOT_FOUND", "Business not found"));
        }
        Business business = bizOpt.get();
        List<UUID> staffUserIds = business.getBusinessStaff().stream()
                .filter(bs -> "STAFF".equals(bs.getUser().getRole()))
                .map(bs -> bs.getUser().getId())
                .toList();
        businessRepository.delete(business);
        if (!staffUserIds.isEmpty()) {
            userRepository.deleteAllById(staffUserIds);
        }
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
