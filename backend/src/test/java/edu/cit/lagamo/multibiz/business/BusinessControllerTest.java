package edu.cit.lagamo.multibiz.business;

import edu.cit.lagamo.multibiz.common.security.JwtService;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BusinessControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private BusinessRepository businessRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String ownerToken;
    private User ownerUser;

    @BeforeEach
    void setUp() {
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
        // Create a business first
        edu.cit.lagamo.multibiz.business.entity.Business biz = new edu.cit.lagamo.multibiz.business.entity.Business();
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
        edu.cit.lagamo.multibiz.business.entity.Business biz = new edu.cit.lagamo.multibiz.business.entity.Business();
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
}
