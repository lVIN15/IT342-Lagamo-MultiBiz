package edu.cit.lagamo.multibiz.service;

import edu.cit.lagamo.multibiz.dto.ApiResponse;
import edu.cit.lagamo.multibiz.dto.BusinessRequest;
import edu.cit.lagamo.multibiz.entity.Business;
import edu.cit.lagamo.multibiz.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.entity.User;
import edu.cit.lagamo.multibiz.repository.BusinessRepository;
import edu.cit.lagamo.multibiz.repository.BusinessStaffRepository;
import edu.cit.lagamo.multibiz.repository.UserRepository;
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

    public ApiResponse<List<Business>> getBusinessesByOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail).orElse(null);
        if (owner == null) {
            return ApiResponse.fail("NOT_FOUND", "Owner not found");
        }
        List<Business> businesses = businessRepository.findByOwnerId(owner.getId());
        return ApiResponse.ok(businesses);
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
