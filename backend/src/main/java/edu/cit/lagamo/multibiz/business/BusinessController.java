package edu.cit.lagamo.multibiz.business;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.business.dto.BusinessRequest;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses")
public class BusinessController {

    private final BusinessService businessService;

    public BusinessController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Business>> createBusiness(@Valid @RequestBody BusinessRequest request, Authentication authentication) {
        ApiResponse<Business> response = businessService.createBusiness(request, authentication.getName());
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBusinesses(Authentication authentication) {
        ApiResponse<List<Map<String, Object>>> response = businessService.getBusinessesByOwner(authentication.getName());
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateBusiness(@PathVariable UUID id, @Valid @RequestBody BusinessRequest request, Authentication authentication) {
        ApiResponse<Map<String, Object>> response = businessService.updateBusiness(id, request, authentication.getName());
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteBusiness(@PathVariable UUID id, Authentication authentication) {
        ApiResponse<Void> response = businessService.deleteBusiness(id, authentication.getName());
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/assign-staff")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<BusinessStaff>> assignStaff(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String userIdStr = body.get("userId");
        if (userIdStr == null || userIdStr.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("BAD_REQUEST", "userId is required"));
        }

        UUID staffUserId = UUID.fromString(userIdStr);
        ApiResponse<BusinessStaff> response = businessService.assignStaff(id, staffUserId, authentication.getName());
        
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/staff/{staffUserId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Void>> removeStaff(
            @PathVariable UUID id,
            @PathVariable UUID staffUserId,
            Authentication authentication) {

        ApiResponse<Void> response = businessService.removeStaff(id, staffUserId, authentication.getName());
        
        if (!response.isSuccess()) {
            if ("NOT_FOUND".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else if ("FORBIDDEN".equals(response.getError().getCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-assignments")
    @PreAuthorize("hasAnyAuthority('STAFF', 'OWNER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyAssignments(Authentication authentication) {
        ApiResponse<List<Map<String, Object>>> response = businessService.getAssignedBusinesses(authentication.getName());
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
