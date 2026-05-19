package edu.cit.lagamo.multibiz.user;

import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.business.BusinessStaffRepository;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.common.security.JwtService;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private BusinessRepository businessRepository;
    @Autowired private BusinessStaffRepository businessStaffRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String userToken;
    private User testUser;

    @BeforeEach
    void setUp() {
        businessStaffRepository.deleteAll();
        businessRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setFirstname("Profile");
        testUser.setLastname("Tester");
        testUser.setEmail("profile@test.com");
        testUser.setPasswordHash(passwordEncoder.encode("Pass123!"));
        testUser.setRole("OWNER");
        testUser = userRepository.save(testUser);

        userToken = "Bearer " + jwtService.generateAccessToken(testUser);
    }

    @Test
    @DisplayName("TC-USER-01: Get profile returns authenticated user data")
    void getProfile_authenticated_returnsProfile() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("profile@test.com"))
                .andExpect(jsonPath("$.data.firstname").value("Profile"));
    }

    @Test
    @DisplayName("TC-USER-02: Change password with correct current password succeeds")
    void changePassword_validCurrent_returnsOk() throws Exception {
        String json = """
            { "currentPassword": "Pass123!", "newPassword": "NewPass456!" }
            """;

        mockMvc.perform(put("/api/v1/users/me/password")
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-USER-03: Change password with wrong current password fails")
    void changePassword_wrongCurrent_returnsBadRequest() throws Exception {
        String json = """
            { "currentPassword": "WrongPassword!", "newPassword": "NewPass456!" }
            """;

        mockMvc.perform(put("/api/v1/users/me/password")
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("WRONG_PASSWORD"));
    }

    @Test
    @DisplayName("TC-USER-04: Change password with same password returns 400")
    void changePassword_samePassword_returnsBadRequest() throws Exception {
        String json = """
            { "currentPassword": "Pass123!", "newPassword": "Pass123!" }
            """;

        mockMvc.perform(put("/api/v1/users/me/password")
                .header("Authorization", userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("SAME_PASSWORD"));
    }

    @Test
    @DisplayName("TC-USER-05: Upload profile picture returns 200 with URL")
    void uploadProfilePicture_validFile_returnsOk() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", "fake-avatar-bytes".getBytes());

        mockMvc.perform(multipart("/api/v1/users/me/profile-picture")
                .file(file)
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profilePictureUrl").exists());
    }

    @Test
    @DisplayName("TC-USER-06: Get profile as STAFF shows assigned business")
    void getProfile_asStaffWithAssignment_showsBusiness() throws Exception {
        // Create staff
        User staff = new User();
        staff.setFirstname("StaffName");
        staff.setLastname("Assigned");
        staff.setEmail("staffprofile@test.com");
        staff.setPasswordHash(passwordEncoder.encode("Pass123!"));
        staff.setRole("STAFF");
        staff = userRepository.save(staff);

        // Create a business and assign staff
        Business biz = new Business();
        biz.setOwner(testUser);
        biz.setName("Staff's Business");
        biz.setCategory("Food");
        biz.setDescription("Test");
        biz = businessRepository.save(biz);

        BusinessStaff entry = new BusinessStaff();
        entry.setBusiness(biz);
        entry.setUser(staff);
        businessStaffRepository.save(entry);

        String staffToken = "Bearer " + jwtService.generateAccessToken(staff);

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assignedBusiness").value("Staff's Business"));
    }
}
