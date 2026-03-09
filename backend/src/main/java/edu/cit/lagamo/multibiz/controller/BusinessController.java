package edu.cit.lagamo.multibiz.controller;

import edu.cit.lagamo.multibiz.dto.BusinessRequest;
import edu.cit.lagamo.multibiz.entity.Business;
import edu.cit.lagamo.multibiz.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.entity.User;
import edu.cit.lagamo.multibiz.repository.BusinessRepository;
import edu.cit.lagamo.multibiz.repository.BusinessStaffRepository;
import edu.cit.lagamo.multibiz.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/businesses")
@CrossOrigin(origins = "*")
public class BusinessController {

    private final BusinessRepository businessRepository;
    private final BusinessStaffRepository businessStaffRepository;
    private final UserRepository userRepository;

    public BusinessController(BusinessRepository businessRepository,
                              BusinessStaffRepository businessStaffRepository,
                              UserRepository userRepository) {
        this.businessRepository      = businessRepository;
        this.businessStaffRepository = businessStaffRepository;
        this.userRepository          = userRepository;
    }

    // ── POST /api/businesses ─────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createBusiness(@Valid @RequestBody BusinessRequest request) {

        User owner = userRepository.findById(request.getOwnerId()).orElse(null);
        if (owner == null) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Owner not found"));
        }

        Business business = new Business();
        business.setOwner(owner);
        business.setName(request.getName());
        business.setCategory(request.getCategory());
        business.setDescription(request.getDescription());

        Business saved = businessRepository.save(business);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(Map.of(
                "message",    "Business created successfully",
                "businessId", saved.getId().toString()
            ));
    }

    // ── GET /api/businesses/owner/{ownerId} ──────────────────────────────────

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<?> getByOwner(@PathVariable UUID ownerId) {

        List<Business> businesses = businessRepository.findByOwnerId(ownerId);
        return ResponseEntity.ok(businesses);
    }

    // ── POST /api/businesses/{businessId}/staff ──────────────────────────────

    @PostMapping("/{businessId}/staff")
    public ResponseEntity<?> assignStaff(
            @PathVariable UUID businessId,
            @RequestBody Map<String, String> body) {

        String userIdStr = body.get("userId");
        if (userIdStr == null || userIdStr.isBlank()) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "userId is required"));
        }

        UUID userId = UUID.fromString(userIdStr);

        Business business = businessRepository.findById(businessId).orElse(null);
        if (business == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Business not found"));
        }

        User staffUser = userRepository.findById(userId).orElse(null);
        if (staffUser == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "User not found"));
        }

        BusinessStaff entry = new BusinessStaff();
        entry.setBusiness(business);
        entry.setUser(staffUser);

        BusinessStaff saved = businessStaffRepository.save(entry);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(Map.of(
                "message",       "Staff assigned successfully",
                "businessStaffId", saved.getId().toString()
            ));
    }
}
