package edu.cit.lagamo.multibiz.admin;

import edu.cit.lagamo.multibiz.business.BusinessRepository;
import edu.cit.lagamo.multibiz.business.BusinessStaffRepository;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.common.security.JwtService;
import edu.cit.lagamo.multibiz.transaction.TransactionRepository;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private BusinessRepository businessRepository;
    @Autowired private BusinessStaffRepository businessStaffRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String adminToken;
    private User adminUser;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        businessStaffRepository.deleteAll();
        businessRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = new User();
        adminUser.setFirstname("Super");
        adminUser.setLastname("Admin");
        adminUser.setEmail("admin@multibiz.com");
        adminUser.setPasswordHash(passwordEncoder.encode("Admin123!"));
        adminUser.setRole("SUPER_ADMIN");
        adminUser = userRepository.save(adminUser);

        adminToken = "Bearer " + jwtService.generateAccessToken(adminUser);
    }

    @Test
    @DisplayName("TC-ADMIN-01: Get stats returns counts")
    void getStats_asAdmin_returnsStats() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").exists())
                .andExpect(jsonPath("$.data.totalBusinesses").exists())
                .andExpect(jsonPath("$.data.totalTransactions").exists());
    }

    @Test
    @DisplayName("TC-ADMIN-02: Get all users filters out SUPER_ADMIN")
    void getAllUsers_asAdmin_filtersSuperAdmin() throws Exception {
        // Seed a regular user
        User regular = new User();
        regular.setFirstname("Regular");
        regular.setLastname("User");
        regular.setEmail("regular@multibiz.com");
        regular.setPasswordHash(passwordEncoder.encode("Pass123!"));
        regular.setRole("OWNER");
        userRepository.save(regular);

        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].email").value("regular@multibiz.com"));
    }

    @Test
    @DisplayName("TC-ADMIN-03: Toggle user active status succeeds")
    void toggleUserStatus_validUser_togglesStatus() throws Exception {
        User user = new User();
        user.setFirstname("Toggle");
        user.setLastname("Me");
        user.setEmail("toggle@multibiz.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setRole("OWNER");
        user = userRepository.save(user);

        mockMvc.perform(put("/api/v1/admin/users/" + user.getId() + "/status")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isActive").value(false));
    }

    @Test
    @DisplayName("TC-ADMIN-04: Toggle user status for non-existent user returns 404")
    void toggleUserStatus_notFound_returns404() throws Exception {
        mockMvc.perform(put("/api/v1/admin/users/" + UUID.randomUUID() + "/status")
                .header("Authorization", adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("TC-ADMIN-05: Toggle SUPER_ADMIN status returns 403")
    void toggleUserStatus_targetAdmin_returnsForbidden() throws Exception {
        // Create another admin
        User otherAdmin = new User();
        otherAdmin.setFirstname("Other");
        otherAdmin.setLastname("Admin");
        otherAdmin.setEmail("otheradmin@multibiz.com");
        otherAdmin.setPasswordHash(passwordEncoder.encode("Pass123!"));
        otherAdmin.setRole("SUPER_ADMIN");
        otherAdmin = userRepository.save(otherAdmin);

        mockMvc.perform(put("/api/v1/admin/users/" + otherAdmin.getId() + "/status")
                .header("Authorization", adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("TC-ADMIN-06: Toggle subscription for OWNER succeeds")
    void toggleSubscription_owner_togglesToPro() throws Exception {
        User owner = new User();
        owner.setFirstname("Pro");
        owner.setLastname("Candidate");
        owner.setEmail("pro@multibiz.com");
        owner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        owner.setRole("OWNER");
        owner.setSubscriptionStatus("BASIC");
        owner = userRepository.save(owner);

        mockMvc.perform(put("/api/v1/admin/users/" + owner.getId() + "/subscription")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subscriptionStatus").value("PRO"));
    }

    @Test
    @DisplayName("TC-ADMIN-07: Toggle subscription for non-OWNER returns 400")
    void toggleSubscription_staff_returnsBadRequest() throws Exception {
        User staff = new User();
        staff.setFirstname("Staff");
        staff.setLastname("NoSub");
        staff.setEmail("staffnosub@multibiz.com");
        staff.setPasswordHash(passwordEncoder.encode("Pass123!"));
        staff.setRole("STAFF");
        staff = userRepository.save(staff);

        mockMvc.perform(put("/api/v1/admin/users/" + staff.getId() + "/subscription")
                .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_ROLE"));
    }

    @Test
    @DisplayName("TC-ADMIN-08: Get all businesses returns list")
    void getAllBusinesses_asAdmin_returnsList() throws Exception {
        User owner = new User();
        owner.setFirstname("Biz");
        owner.setLastname("Owner");
        owner.setEmail("bizowner@multibiz.com");
        owner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        owner.setRole("OWNER");
        owner = userRepository.save(owner);

        Business biz = new Business();
        biz.setOwner(owner);
        biz.setName("Admin View Biz");
        biz.setCategory("Retail");
        biz.setDescription("Visible to admin");
        businessRepository.save(biz);

        mockMvc.perform(get("/api/v1/admin/businesses")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Admin View Biz"));
    }

    @Test
    @DisplayName("TC-ADMIN-09: Delete business as admin returns 200")
    void deleteBusiness_asAdmin_returnsOk() throws Exception {
        User owner = new User();
        owner.setFirstname("Del");
        owner.setLastname("Owner");
        owner.setEmail("delowner@multibiz.com");
        owner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        owner.setRole("OWNER");
        owner = userRepository.save(owner);

        Business biz = new Business();
        biz.setOwner(owner);
        biz.setName("To Delete Admin");
        biz.setCategory("Retail");
        biz.setDescription("Admin will delete");
        biz = businessRepository.save(biz);

        mockMvc.perform(delete("/api/v1/admin/businesses/" + biz.getId())
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-ADMIN-10: Delete non-existent business returns 404")
    void deleteBusiness_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/businesses/" + UUID.randomUUID())
                .header("Authorization", adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}
