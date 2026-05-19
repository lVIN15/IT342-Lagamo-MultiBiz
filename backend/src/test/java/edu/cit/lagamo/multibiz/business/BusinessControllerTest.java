package edu.cit.lagamo.multibiz.business;

import edu.cit.lagamo.multibiz.common.security.JwtService;
import edu.cit.lagamo.multibiz.business.entity.Business;
import edu.cit.lagamo.multibiz.business.entity.BusinessStaff;
import edu.cit.lagamo.multibiz.user.UserRepository;
import edu.cit.lagamo.multibiz.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BusinessControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private BusinessRepository businessRepository;
    @Autowired private BusinessStaffRepository businessStaffRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String ownerToken;
    private User ownerUser;

    @BeforeEach
    void setUp() {
        businessStaffRepository.deleteAll();
        businessRepository.deleteAll();
        userRepository.deleteAll();

        ownerUser = new User();
        ownerUser.setFirstname("Owner");
        ownerUser.setLastname("Test");
        ownerUser.setEmail("owner@test.com");
        ownerUser.setPasswordHash(passwordEncoder.encode("Pass123!"));
        ownerUser.setRole("OWNER");
        ownerUser = userRepository.save(ownerUser);

        ownerToken = "Bearer " + jwtService.generateAccessToken(ownerUser);
    }

    @Test
    @DisplayName("TC-BIZ-01: Create business with valid data returns 201")
    void createBusiness_validData_returnsCreated() throws Exception {
        String json = String.format("""
            {
                "ownerId": "%s",
                "name": "Test Shop",
                "category": "Retail",
                "description": "A test business"
            }
            """, ownerUser.getId());

        mockMvc.perform(post("/api/v1/businesses")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Shop"));
    }

    @Test
    @DisplayName("TC-BIZ-02: Get businesses returns owner's businesses")
    void getBusinesses_authenticated_returnsOwnerBusinesses() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("My Business");
        biz.setCategory("Food");
        biz.setDescription("Test");
        businessRepository.save(biz);

        mockMvc.perform(get("/api/v1/businesses")
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("My Business"));
    }

    @Test
    @DisplayName("TC-BIZ-03: Unauthenticated request returns 403")
    void getBusinesses_noToken_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/businesses"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-BIZ-04: Delete business removes it successfully")
    void deleteBusiness_validOwner_returnsOk() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("To Delete");
        biz.setCategory("Retail");
        biz.setDescription("Will be deleted");
        biz = businessRepository.save(biz);

        mockMvc.perform(delete("/api/v1/businesses/" + biz.getId())
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-BIZ-05: Update business with valid data returns 200")
    void updateBusiness_validOwner_returnsOk() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("Original Name");
        biz.setCategory("Retail");
        biz.setDescription("Original Desc");
        biz = businessRepository.save(biz);

        String json = String.format("""
            {
                "ownerId": "%s",
                "name": "Updated Name",
                "category": "Food",
                "description": "Updated Desc"
            }
            """, ownerUser.getId());

        mockMvc.perform(put("/api/v1/businesses/" + biz.getId())
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Updated Name"));
    }

    @Test
    @DisplayName("TC-BIZ-06: Update business by non-owner returns 400")
    void updateBusiness_notOwner_returnsBadRequest() throws Exception {
        // Create another owner
        User otherOwner = new User();
        otherOwner.setFirstname("Other");
        otherOwner.setLastname("Owner");
        otherOwner.setEmail("other@test.com");
        otherOwner.setPasswordHash(passwordEncoder.encode("Pass123!"));
        otherOwner.setRole("OWNER");
        otherOwner = userRepository.save(otherOwner);

        Business biz = new Business();
        biz.setOwner(otherOwner);
        biz.setName("Other Biz");
        biz.setCategory("Retail");
        biz.setDescription("Not mine");
        biz = businessRepository.save(biz);

        String json = String.format("""
            { "ownerId": "%s", "name": "Hacked", "category": "Hax", "description": "Stolen" }
            """, ownerUser.getId());

        mockMvc.perform(put("/api/v1/businesses/" + biz.getId())
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("TC-BIZ-07: Assign staff to business returns 201")
    void assignStaff_validData_returnsCreated() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("Staff Biz");
        biz.setCategory("Services");
        biz.setDescription("Has staff");
        biz = businessRepository.save(biz);

        User staff = new User();
        staff.setFirstname("Staff");
        staff.setLastname("Person");
        staff.setEmail("staff@test.com");
        staff.setPasswordHash(passwordEncoder.encode("Pass123!"));
        staff.setRole("STAFF");
        staff = userRepository.save(staff);

        String json = String.format("""
            { "userId": "%s" }
            """, staff.getId());

        mockMvc.perform(post("/api/v1/businesses/" + biz.getId() + "/assign-staff")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-BIZ-08: Assign already assigned staff returns existing record")
    void assignStaff_duplicate_returnsExisting() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("Dup Staff Biz");
        biz.setCategory("Services");
        biz.setDescription("Test");
        biz = businessRepository.save(biz);

        User staff = new User();
        staff.setFirstname("Dup");
        staff.setLastname("Staff");
        staff.setEmail("dupstaff@test.com");
        staff.setPasswordHash(passwordEncoder.encode("Pass123!"));
        staff.setRole("STAFF");
        staff = userRepository.save(staff);

        // First assignment
        BusinessStaff entry = new BusinessStaff();
        entry.setBusiness(biz);
        entry.setUser(staff);
        businessStaffRepository.save(entry);

        String json = String.format("""
            { "userId": "%s" }
            """, staff.getId());

        mockMvc.perform(post("/api/v1/businesses/" + biz.getId() + "/assign-staff")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-BIZ-09: Assign non-existent staff returns 400")
    void assignStaff_userNotFound_returnsBadRequest() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("No Staff Biz");
        biz.setCategory("Services");
        biz.setDescription("Test");
        biz = businessRepository.save(biz);

        String json = String.format("""
            { "userId": "%s" }
            """, UUID.randomUUID());

        mockMvc.perform(post("/api/v1/businesses/" + biz.getId() + "/assign-staff")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("TC-BIZ-10: Remove staff from business returns 200")
    void removeStaff_validData_returnsOk() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("Remove Staff Biz");
        biz.setCategory("Services");
        biz.setDescription("Test");
        biz = businessRepository.save(biz);

        User staff = new User();
        staff.setFirstname("Remove");
        staff.setLastname("Me");
        staff.setEmail("removeme@test.com");
        staff.setPasswordHash(passwordEncoder.encode("Pass123!"));
        staff.setRole("STAFF");
        staff = userRepository.save(staff);

        BusinessStaff entry = new BusinessStaff();
        entry.setBusiness(biz);
        entry.setUser(staff);
        businessStaffRepository.save(entry);

        mockMvc.perform(delete("/api/v1/businesses/" + biz.getId() + "/staff/" + staff.getId())
                .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-BIZ-11: Remove non-existent staff returns 404")
    void removeStaff_notFound_returnsNotFound() throws Exception {
        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("No Remove Biz");
        biz.setCategory("Services");
        biz.setDescription("Test");
        biz = businessRepository.save(biz);

        mockMvc.perform(delete("/api/v1/businesses/" + biz.getId() + "/staff/" + UUID.randomUUID())
                .header("Authorization", ownerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("TC-BIZ-12: Get my assignments as staff returns business list")
    void getMyAssignments_asStaff_returnsList() throws Exception {
        User staff = new User();
        staff.setFirstname("Assigned");
        staff.setLastname("Staff");
        staff.setEmail("assigned@test.com");
        staff.setPasswordHash(passwordEncoder.encode("Pass123!"));
        staff.setRole("STAFF");
        staff = userRepository.save(staff);

        Business biz = new Business();
        biz.setOwner(ownerUser);
        biz.setName("Assigned Biz");
        biz.setCategory("Services");
        biz.setDescription("Test");
        biz = businessRepository.save(biz);

        BusinessStaff entry = new BusinessStaff();
        entry.setBusiness(biz);
        entry.setUser(staff);
        businessStaffRepository.save(entry);

        String staffToken = "Bearer " + jwtService.generateAccessToken(staff);

        mockMvc.perform(get("/api/v1/businesses/my-assignments")
                .header("Authorization", staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Assigned Biz"));
    }
}
