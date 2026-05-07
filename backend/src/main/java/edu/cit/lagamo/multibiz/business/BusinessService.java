package edu.cit.lagamo.multibiz.business;

import edu.cit.lagamo.multibiz.common.dto.ApiResponse;
import edu.cit.lagamo.multibiz.business.dto.BusinessRequest;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.user.entity.User;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.report.EmailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final BusinessStaffRepository businessStaffRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public BusinessService(BusinessRepository businessRepository,
            BusinessStaffRepository businessStaffRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.businessRepository = businessRepository;
        this.businessStaffRepository = businessStaffRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public ApiResponse<Business> createBusiness(BusinessRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail).orElse(null);
        if (owner == null) {
            return ApiResponse.fail("NOT_FOUND", "Owner not found");
        }

        Business business = new Business();
        business.setOwner(owner);
        business.setName(request.getName());
        business.setCategory(request.getCategory());
        business.setDescription(request.getDescription());

        Business saved = businessRepository.save(business);
        return ApiResponse.ok(saved);
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getBusinessesByOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail).orElse(null);
        if (owner == null) {
            return ApiResponse.fail("NOT_FOUND", "Owner not found");
        }
        
        List<Business> businesses = businessRepository.findByOwnerId(owner.getId());
        List<Map<String, Object>> result = businesses.stream().map(b -> {
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", b.getId().toString());
            map.put("name", b.getName());
            map.put("category", b.getCategory());
            map.put("description", b.getDescription());
            map.put("createdAt", b.getCreatedAt().toString());
            
            // Map Lazy business staff safely for frontend use
            List<Map<String, Object>> staffList = b.getBusinessStaff().stream().map(bs -> {
                Map<String, Object> sMap = new java.util.LinkedHashMap<>();
                sMap.put("id", bs.getUser().getId().toString());
                String first = bs.getUser().getFirstname() != null ? bs.getUser().getFirstname() : "";
                String last = bs.getUser().getLastname() != null ? bs.getUser().getLastname() : "";
                sMap.put("name", (first + " " + last).trim());
                sMap.put("initials", (!first.isEmpty() ? first.substring(0, 1) : "") + (!last.isEmpty() ? last.substring(0, 1) : ""));
                sMap.put("email", bs.getUser().getEmail());
                sMap.put("dateAssigned", bs.getAssignedAt().toString());
                return sMap;
            }).toList();
            
            map.put("staff", staffList);
            return map;
        }).toList();

        return ApiResponse.ok(result);
    }

    @Transactional
    public ApiResponse<Map<String, Object>> updateBusiness(UUID businessId, BusinessRequest request,
            String ownerEmail) {
        Business business = businessRepository.findById(businessId).orElse(null);
        if (business == null) {
            return ApiResponse.fail("NOT_FOUND", "Business not found");
        }
        if (!business.getOwner().getEmail().equals(ownerEmail)) {
            return ApiResponse.fail("FORBIDDEN", "You do not own this business");
        }

        business.setName(request.getName());
        business.setCategory(request.getCategory());
        business.setDescription(request.getDescription());

        Business updated = businessRepository.save(business);

        // Build a clean DTO to avoid lazy-loading serialization issues
        Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("id", updated.getId().toString());
        data.put("name", updated.getName());
        data.put("category", updated.getCategory());
        data.put("description", updated.getDescription());
        data.put("createdAt", updated.getCreatedAt().toString());

        return ApiResponse.ok(data);
    }

    @Transactional
    public ApiResponse<Void> deleteBusiness(UUID businessId, String ownerEmail) {
        Business business = businessRepository.findById(businessId).orElse(null);
        if (business == null) {
            return ApiResponse.fail("NOT_FOUND", "Business not found");
        }
        if (!business.getOwner().getEmail().equals(ownerEmail)) {
            return ApiResponse.fail("FORBIDDEN", "You do not own this business");
        }

        businessRepository.delete(business);
        return ApiResponse.ok(null);
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getAssignedBusinesses(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.fail("NOT_FOUND", "User not found");
        }

        List<BusinessStaff> assignments = businessStaffRepository.findByUserId(user.getId());
        List<Map<String, Object>> businesses = assignments.stream()
                .map(BusinessStaff::getBusiness)
                .map(b -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", b.getId().toString());
                    map.put("name", b.getName());
                    map.put("category", b.getCategory());
                    map.put("description", b.getDescription());
                    return map;
                })
                .toList();

        return ApiResponse.ok(businesses);
    }

    @Transactional
    public ApiResponse<BusinessStaff> assignStaff(UUID businessId, UUID staffUserId, String ownerEmail) {
        Business business = businessRepository.findById(businessId).orElse(null);
        if (business == null) {
            return ApiResponse.fail("NOT_FOUND", "Business not found");
        }
        if (!business.getOwner().getEmail().equals(ownerEmail)) {
            return ApiResponse.fail("FORBIDDEN", "You do not own this business");
        }

        User staffUser = userRepository.findById(staffUserId).orElse(null);
        if (staffUser == null) {
            return ApiResponse.fail("NOT_FOUND", "Staff user not found");
        }

        // Check if already assigned to prevent duplicate notifications
        List<BusinessStaff> existingStaff = businessStaffRepository.findByBusinessId(businessId);
        for (BusinessStaff bs : existingStaff) {
            if (bs.getUser().getId().equals(staffUserId)) {
                return ApiResponse.ok(bs); // Return existing record immediately
            }
        }

        BusinessStaff entry = new BusinessStaff();
        entry.setBusiness(business);
        entry.setUser(staffUser);

        BusinessStaff saved = businessStaffRepository.save(entry);

        // Async Staff Notification Trigger
        emailService.sendStaffAssignmentNotification(staffUser.getEmail(), staffUser.getFirstname(),
                business.getName());

        return ApiResponse.ok(saved);
    }
}
