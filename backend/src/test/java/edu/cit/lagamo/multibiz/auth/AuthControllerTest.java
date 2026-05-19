package edu.cit.lagamo.multibiz.auth;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("TC-AUTH-01: Register with valid data returns 201 and tokens")
    void register_validData_returnsCreated() throws Exception {
        String json = """
            {
                "firstname": "Test",
                "lastname": "User",
                "email": "test@multibiz.com",
                "password": "Pass123!",
                "sendWelcomeEmail": false
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.user.email").value("test@multibiz.com"));
    }

    @Test
    @DisplayName("TC-AUTH-02: Register with duplicate email returns 400")
    void register_duplicateEmail_returnsBadRequest() throws Exception {
        // Seed a user first
        User existing = new User();
        existing.setFirstname("Existing");
        existing.setLastname("User");
        existing.setEmail("dup@multibiz.com");
        existing.setPasswordHash(passwordEncoder.encode("Pass123!"));
        userRepository.save(existing);

        String json = """
            {
                "firstname": "New",
                "lastname": "User",
                "email": "dup@multibiz.com",
                "password": "Pass123!",
                "sendWelcomeEmail": false
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("TC-AUTH-03: Login with valid credentials returns 200 and tokens")
    void login_validCredentials_returnsOk() throws Exception {
        // Seed user
        User user = new User();
        user.setFirstname("Staff");
        user.setLastname("One");
        user.setEmail("staff@multibiz.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setRole("STAFF");
        userRepository.save(user);

        String json = """
            { "email": "staff@multibiz.com", "password": "Pass123!" }
            """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.user.role").value("STAFF"));
    }

    @Test
    @DisplayName("TC-AUTH-04: Login with wrong password returns 401")
    void login_wrongPassword_returnsUnauthorized() throws Exception {
        User user = new User();
        user.setFirstname("Bad");
        user.setLastname("Login");
        user.setEmail("bad@multibiz.com");
        user.setPasswordHash(passwordEncoder.encode("RealPass!"));
        userRepository.save(user);

        String json = """
            { "email": "bad@multibiz.com", "password": "WrongPass!" }
            """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("TC-AUTH-05: Login as banned user returns 403")
    void login_bannedUser_returnsForbidden() throws Exception {
        User user = new User();
        user.setFirstname("Banned");
        user.setLastname("User");
        user.setEmail("banned@multibiz.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setActive(false);
        userRepository.save(user);

        String json = """
            { "email": "banned@multibiz.com", "password": "Pass123!" }
            """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("INACTIVE_ACCOUNT"));
    }

    @Test
    @DisplayName("TC-AUTH-06: OWNER login from Android is blocked")
    void login_ownerOnAndroid_returnsForbidden() throws Exception {
        User user = new User();
        user.setFirstname("Owner");
        user.setLastname("Blocked");
        user.setEmail("owner@multibiz.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setRole("OWNER");
        userRepository.save(user);

        String json = """
            { "email": "owner@multibiz.com", "password": "Pass123!" }
            """;

        mockMvc.perform(post("/api/auth/login")
                .header("X-Platform", "android")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("OWNER_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("TC-AUTH-07: Register as STAFF role assigns STAFF")
    void register_asStaffRole_returnsStaffRole() throws Exception {
        String json = """
            {
                "firstname": "Staff",
                "lastname": "Member",
                "email": "staffreg@multibiz.com",
                "password": "Pass123!",
                "role": "STAFF",
                "sendWelcomeEmail": false
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.role").value("STAFF"));
    }

    @Test
    @DisplayName("TC-AUTH-08: Logout with valid token clears refresh tokens")
    void logout_validToken_returnsOk() throws Exception {
        // Seed user and generate token
        User user = new User();
        user.setFirstname("Logout");
        user.setLastname("User");
        user.setEmail("logout@multibiz.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setRole("OWNER");
        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);

        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("TC-AUTH-09: Logout without Bearer header returns 400")
    void logout_noBearerHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_TOKEN"));
    }
}
