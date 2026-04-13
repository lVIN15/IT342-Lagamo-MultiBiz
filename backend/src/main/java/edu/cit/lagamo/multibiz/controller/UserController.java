package edu.cit.lagamo.multibiz.controller;

import edu.cit.lagamo.multibiz.dto.ApiResponse;
import edu.cit.lagamo.multibiz.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.entity.User;
import edu.cit.lagamo.multibiz.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Simple request body record for changing password */
    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    /**
     * Returns the authenticated user's full profile details.
     * Accessible by both STAFF and OWNER roles.
     */
    @Transactional
    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('STAFF', 'OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyProfile(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("UNAUTHORIZED", "User not found"));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId().toString());
        profile.put("firstname", user.getFirstname());
        profile.put("lastname", user.getLastname());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("createdAt", user.getCreatedAt().toString());
        profile.put("profilePictureUrl", user.getProfilePictureUrl()); // null if not set

        // If STAFF, include their assigned business name (first assignment)
        if ("STAFF".equals(user.getRole()) && user.getBusinessStaffEntries() != null
                && !user.getBusinessStaffEntries().isEmpty()) {
            BusinessStaff assignment = user.getBusinessStaffEntries().get(0);
            if (assignment.getBusiness() != null) {
                profile.put("assignedBusiness", assignment.getBusiness().getName());
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    /**
     * Accepts a profile picture file upload.
     * Saves a mock URL to the user's profile_picture_url column (no real storage).
     */
    @Transactional
    @PostMapping("/me/profile-picture")
    @PreAuthorize("hasAnyAuthority('STAFF', 'OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("UNAUTHORIZED", "User not found"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("BAD_REQUEST", "No file provided"));
        }

        // Mock upload — consistent with receipt upload strategy in TransactionService
        String mockUrl = "https://mock.supabase.co/storage/v1/object/public/avatars/"
                + user.getId().toString() + "_" + file.getOriginalFilename();

        user.setProfilePictureUrl(mockUrl);
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("profilePictureUrl", mockUrl);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Changes the authenticated user's password.
     * Verifies the current password via BCrypt before accepting the new one.
     */
    @Transactional
    @PutMapping("/me/password")
    @PreAuthorize("hasAnyAuthority('STAFF', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("UNAUTHORIZED", "User not found"));
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("WRONG_PASSWORD", "Incorrect current password"));
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("SAME_PASSWORD", "New password cannot be the same as the current password"));
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
