package edu.cit.lagamo.multibiz.user;

import edu.cit.lagamo.multibiz.common.security.JwtService;
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
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String userToken;
    private User testUser;

    @BeforeEach
    void setUp() {
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
}
