package edu.cit.lagamo.multibiz.controller;

import edu.cit.lagamo.multibiz.dto.ApiResponse;
import edu.cit.lagamo.multibiz.dto.GoogleTokenRequest;
import edu.cit.lagamo.multibiz.dto.LoginRequest;
import edu.cit.lagamo.multibiz.dto.RegisterRequest;
import edu.cit.lagamo.multibiz.entity.RefreshToken;
import edu.cit.lagamo.multibiz.entity.User;
import edu.cit.lagamo.multibiz.repository.RefreshTokenRepository;
import edu.cit.lagamo.multibiz.repository.UserRepository;
import edu.cit.lagamo.multibiz.service.AuthService;
import edu.cit.lagamo.multibiz.service.EmailService;
import edu.cit.lagamo.multibiz.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final AuthService authService;

    public AuthController(UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            AuthService authService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.authService = authService;
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest request) {

        // Duplicate email check
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("EMAIL_ALREADY_EXISTS", "Email is already registered"));
        }

        // Persist new user
        User user = new User();
        user.setFirstname(request.getFirstname());
        user.setLastname(request.getLastname());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // RBAC Logic: Respect incoming role
        if ("STAFF".equalsIgnoreCase(request.getRole())) {
            user.setRole("STAFF");
        } else {
            user.setRole("OWNER"); // Default to Owner for raw signups
        }

        userRepository.save(user);

        // Async Email Trigger: Only if suppressed flag is not false
        if (request.isSendWelcomeEmail()) {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFirstname());
        }

        // Generate tokens & persist refresh token
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        persistRefreshToken(user, refreshToken);

        // Build SDD data payload (no role for Register)
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", user.getId().toString());
        userMap.put("email", user.getEmail());
        userMap.put("firstname", user.getFirstname());
        userMap.put("lastname", user.getLastname());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("user", userMap);
        data.put("accessToken", accessToken);
        data.put("refreshToken", refreshToken);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(data));
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request) {

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty() ||
                !passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("INVALID_CREDENTIALS", "Invalid email or password"));
        }

        User user = userOpt.get();

        // Generate tokens & persist refresh token (rotate: delete old ones first)
        refreshTokenRepository.deleteByUserId(user.getId());
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        persistRefreshToken(user, refreshToken);

        // Build SDD data payload (role included for Login)
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", user.getId().toString());
        userMap.put("email", user.getEmail());
        userMap.put("firstname", user.getFirstname());
        userMap.put("lastname", user.getLastname());
        userMap.put("role", user.getRole());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("user", userMap);
        data.put("accessToken", accessToken);
        data.put("refreshToken", refreshToken);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ── POST /api/auth/google ────────────────────────────────────────────────
    
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<?>> googleLogin(@Valid @RequestBody GoogleTokenRequest request) {
        Map<String, Object> data = authService.verifyGoogleTokenAndAuthenticate(request.getToken());
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void persistRefreshToken(User user, String rawToken) {
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setToken(rawToken);
        rt.setExpiresAt(LocalDateTime.now()
                .plusSeconds(jwtService.getRefreshTokenMs() / 1000));
        refreshTokenRepository.save(rt);
    }
}
